import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import Soup from 'gi://Soup';

// We no longer need the hard-coded prompts here

const LLMTextExtension = class LLMTextExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._httpSession = null; // Initialize as null
    }

    enable() {
        log(`[${this.uuid}]: Enabling...`);
        try {
            this._settings = this.getSettings();
            this._httpSession = new Soup.Session();
            
            this._bindHotkey('hotkey-fix', () => this._processClipboard('fix'));
            this._bindHotkey('hotkey-improve', () => this._processClipboard('improve'));
            
            log(`[${this.uuid}]: Enabled successfully.`);
        } catch (e) {
            logError(e, `[${this.uuid}]: FAILED TO ENABLE`);
        }
    }

    disable() {
        log(`[${this.uuid}]: Disabling...`);
        try {
            Main.wm.removeKeybinding('hotkey-fix');
            Main.wm.removeKeybinding('hotkey-improve');
        } catch (e) {
            logError(e, `[${this.uuid}]: FAILED TO REMOVE KEYBINDINGS`);
        }

        this._settings = null;
        if (this._httpSession) {
            this._httpSession = null;
        }
        log(`[${this.uuid}]: Disabled.`);
    }

    _bindHotkey(name, callback) {
        log(`[${this.uuid}]: Binding hotkey: ${name}`);
        Main.wm.addKeybinding(
            name,
            this._settings,
            Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
            Shell.ActionMode.NORMAL,
            callback
        );
    }

    // UPDATED: This function now reads from settings
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
        log(`[${this.uuid}]: Hotkey pressed, processing clipboard (${mode})...`);
        
        if (!this._httpSession) {
            logError(new Error('_httpSession is null!'), `[${this.uuid}]: LLM Text Modifier Failed`);
            Main.notifyError("LLM Text Error", "_httpSession is null. Try toggling extension OFF and ON.");
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

            log(`[${this.uuid}]: Sending to API: ${apiEndpoint} with model: ${modelName}`);

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
            log(`[${this.uuid}]: API request successful.`);

            const responseStr = new TextDecoder().decode(bytes.get_data());
            const responseJson = JSON.parse(responseStr);

            if (!responseJson.choices || !responseJson.choices[0] || !responseJson.choices[0].message) {
                throw new Error("Invalid API response format.");
            }

            const newText = responseJson.choices[0].message.content.trim();

            clipboard.set_text(St.ClipboardType.CLIPBOARD, newText);
            Main.notify("LLM Text", "Text processing complete!");
            log(`[${this.uuid}]: Text processing complete.`);

        } catch (e) {
            Main.notifyError("LLM Text Error", e.message);
            logError(e, `[${this.uuid}]: LLM Text Modifier Failed`);
        }
    }
};

export default LLMTextExtension;
