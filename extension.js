import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import Soup from 'gi://Soup';

const PROMPT_FIX_GRAMMAR = "You are a grammar correction tool. Correct the following text. Return *only* the corrected text, with no explanation, preamble, or markdown formatting.";
const PROMPT_IMPROVE_TEXT = "You are an editing assistant. Improve the following text for clarity, flow, and impact. Return *only* the improved text, with no explanation, preamble, or markdown formatting.";

export default class LLMTextExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._httpSession = null;
    }

    enable() {
        console.debug(`[${this.uuid}]: Enabling extension...`);
        
        this._settings = this.getSettings();
        this._httpSession = new Soup.Session();
        
        this._bindHotkey('hotkey-fix', () => this._processClipboard('fix'));
        this._bindHotkey('hotkey-improve', () => this._processClipboard('improve'));
    }

    disable() {
        console.debug(`[${this.uuid}]: Disabling extension...`);
        
        Main.wm.removeKeybinding('hotkey-fix');
        Main.wm.removeKeybinding('hotkey-improve');

        this._settings = null;

        if (this._httpSession) {
            // REVIEW FIX 1: Abort pending requests
            this._httpSession.abort();
            this._httpSession = null;
        }
    }

    _bindHotkey(name, callback) {
        Main.wm.addKeybinding(
            name,
            this._settings,
            Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
            Shell.ActionMode.NORMAL,
            callback
        );
    }

    _getPrompt(mode, text) {
        let systemPrompt;
        if (mode === 'fix') {
            systemPrompt = this._settings.get_string('prompt-fix-grammar');
        } else {
            systemPrompt = this._settings.get_string('prompt-improve-text');
        }

        return [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": text }
        ];
    }

    async _processClipboard(mode) {
        console.debug(`[${this.uuid}]: Processing clipboard for mode: ${mode}`);
        
        if (!this._httpSession) {
            console.error(`[${this.uuid}]: _httpSession is null`);
            Main.notifyError("LLM Text Error", "Session error. Please restart extension.");
            return;
        }

        try {
            const clipboard = St.Clipboard.get_default();
            const clipboardText = await new Promise((resolve, reject) => {
                clipboard.get_text(St.ClipboardType.CLIPBOARD, (clip, text) => {
                    if (text) {
                        resolve(text);
                    } else {
                        reject(new Error("Clipboard is empty or contains no text."));
                    }
                });
            });

            if (!clipboardText) {
                Main.notify("LLM Text", "Clipboard is empty.");
                return;
            }

            Main.notify("LLM Text", `Processing text (${mode})...`);

            const apiEndpoint = this._settings.get_string('api-endpoint');
            const modelName = this._settings.get_string('model-name');
            const messages = this._getPrompt(mode, clipboardText);

            const payload = JSON.stringify({
                model: modelName,
                messages: messages,
                stream: false
            });

            const message = Soup.Message.new('POST', apiEndpoint);
            message.set_request_body_from_bytes(
                'application/json',
                new TextEncoder().encode(payload)
            );

            const bytes = await this._httpSession.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                null
            );
            
            if (message.get_status() !== 200) {
                 throw new Error(`API request failed with status ${message.get_status()} ${message.get_reason_phrase()}`);
            }

            const responseStr = new TextDecoder().decode(bytes.get_data());
            const responseJson = JSON.parse(responseStr);

            if (!responseJson.choices || !responseJson.choices[0] || !responseJson.choices[0].message) {
                throw new Error("Invalid API response format.");
            }

            const newText = responseJson.choices[0].message.content.trim();

            clipboard.set_text(St.ClipboardType.CLIPBOARD, newText);
            Main.notify("LLM Text", "Text processing complete!");

        } catch (e) {
            Main.notifyError("LLM Text Error", e.message);
            // REVIEW FIX 3: Use console.error for actual errors
            console.error(e);
        }
    }
}
