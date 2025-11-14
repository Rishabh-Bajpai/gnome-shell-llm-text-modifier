# LLM Text Modifier (GNOME Shell Extension)

[![GNOME Shell Version](https://img.shields.io/badge/GNOME-45%2C%2046-blue.svg)](https://www.gnome.org)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
A GNOME Shell extension that uses a local, OpenAI-compatible LLM to fix grammar or improve text in your clipboard with a simple hotkey.

**Privacy-first:** All API calls are made directly to your local server. No data ever leaves your machine.



---

## Features

* **Fix Grammar:** Select text and press a hotkey to correct grammar.
* **Improve Text:** Select text and press a hotkey to improve clarity, flow, and impact.
* **Local LLM Support:** Works with any OpenAI-compatible API endpoint.
* **Privacy-Focused:** Ideal for use with local-first tools like **LM Studio**, **Ollama**, or **vLLM**.
* **Highly Configurable:**
    * Set your custom API endpoint and model name.
    * Customize the hotkeys for both actions.
    * Modify the system prompts to fine-tune the AI's behavior.

---

## ⚠️ Prerequisites

This extension **is only a client** and **does not provide an LLM**.

You must be running your own local LLM server that exposes an OpenAI-compatible API endpoint.

**Examples:**
* **[LM Studio](https://lmstudio.ai/):** Just load a model and start the server.
* **[Ollama](https://ollama.com/):** You can use a tool like [LiteLLM](https://github.com/BerriAI/litellm) to create an OpenAI-compatible proxy.
* **vLLM** or other self-hosted models.

---

## 📦 Installation

### Method 1: From extensions.gnome.org (Recommended)

(Link will be added here once the extension is approved.)

This is the easiest way. You can install it directly from the [GNOME Extensions website](https://extensions.gnome.org/) with a single click.

### Method 2: Install from Source (Manual)

If you want to install the latest development version:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Rishabh-Bajpai/gnome-shell-llm-text-modifier.git](https://github.com/Rishabh-Bajpai/gnome-shell-llm-text-modifier.git)
    cd gnome-shell-llm-text-modifier
    ```

2.  **Run the install script:**
    ```bash
    make install
    ```

3.  **Restart GNOME Shell:**
    Press `Alt` + `F2`, type `r`, and press `Enter`. (On Wayland, you must log out and log back in).

---

## 🚀 Configuration

After installing, you **must** configure the extension to point to your local LLM.

1.  Start your local LLM server (e.g., in LM Studio, load your model and click "Start Server").
2.  Open the "Extensions" application (or run `gnome-extensions prefs llm-text-modifier@rishabhbajpai24.com`).
3.  Click the **gear icon** ⚙️ next to "LLM Text Modifier".
4.  Set the **API Endpoint**.
    * For LM Studio, this is typically `http://127.0.0.1:1234/v1/chat/completions`.
5.  Set the **Model Name**.
    * This must *exactly* match the model identifier your server uses (e.g., `qwen/qwen3-vl-30b`). For LM Studio, this setting is often ignored or can be set to "local-model".
6.  (Optional) Change the hotkeys or system prompts to your liking.

## ⌨️ Usage

1.  Copy any text to your clipboard.
2.  Press the "Fix Grammar" hotkey (Default: `Ctrl`+`Win`+`O`).
3.  Wait for the notification. The corrected text is now in your clipboard, ready to paste.

...or...

1.  Copy any text to your clipboard.
2.  Press the "Improve Text" hotkey (Default: `Ctrl`+`Win`+`P`).
3.  Wait for the notification. The improved text is now in your clipboard.

## 🤝 Contributing

Pull requests are welcome! If you find a bug or have an idea for a new feature, please open an issue or submit a pull request.

## 📜 License

This project is licensed under the **GPL-3.0 License**.
