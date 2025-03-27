# Grammarly Helper for macOS (Electron App)

A lightweight macOS menu bar app that improves grammar, tone, and clarity of selected text using ChatGPT (GPT-4o).  
Select any text, press a hotkey, and instantly get a better version — professional, polite, and grammatically correct.

---

## ✨ Features

- 🧠 Powered by ChatGPT (GPT-4o mini)
- 📋 Global hotkey support
- 💬 Custom prompt and model support
- 📎 Menu bar tray app for easy access
- ✅ Works system-wide (browser, email, notes, etc.)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/grammarly-helper.git
cd grammarly-helper
```


###  2. Install Dependencies

```bash
npm install
```

###  3. Add Your OpenAI API Key
   Create a file named config.json in the root folder:

```bash
{
    "openaiApiKey": "sk-...",
    "model": "GPT-4o mini",
    "prompt": "Please revise the following text to correct grammar, enhance clarity, and convey a professional and polite tone.",
    "hotkey": "CommandOrControl+Shift+G"
}
```
🔐 This file is ignored via .gitignore to keep your key private.

### 🧪 Run the App in Dev Mode
```bash
npm start
```

### 📦 Build a macOS Installer
1. Create .icns app icon (or use icon.icns)
   Then run:
```bash
   npm run dist
```
You’ll find a .dmg installer inside the dist/ folder.


### 💡 Usage
Select any text and copy it (Cmd+C)

- Press the global hotkey (Cmd+Shift+G by default)
- See the suggested improvement in a popup
- Click “Copy” to copy the improved version

### 🔧 Customization
Use the Settings window (via tray icon) to update:

- Model (gpt-4o, gpt-3.5-turbo, etc.)
- Prompt instructions
- Hotkey

### 🛡 Security
This app uses your own OpenAI API key. Nothing is stored or logged.
It runs entirely on your local machine.