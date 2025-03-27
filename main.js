// 📦 Electron app to improve selected text using ChatGPT
// Features: Tray Icon, Global Hotkey, Settings, ChatGPT Integration, Custom Prompt/Model/Hotkey

const { app, BrowserWindow, Tray, Menu, globalShortcut, clipboard, Notification, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let tray = null;
let settingsWindow = null;
let suggestionWindow = null;

const configPath = path.join(__dirname, 'config.json');
function loadConfig() {
  try {
    const data = fs.readFileSync(configPath);
    return JSON.parse(data);
  } catch (e) {
    return {
      prompt: "Please revise the following text to correct grammar, enhance clarity, and convey a professional and polite tone.",
      model: 'GPT-4o mini',
      hotkey: 'CommandOrControl+Shift+G'
    };
  }
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

let { prompt: userPrompt, model: chatModel, hotkey: shortcutKey } = loadConfig();

function createSettingsWindow() {
  console.log('[UI] Opening Settings Window');
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  settingsWindow.loadFile('settings.html');
  settingsWindow.on('closed', () => (settingsWindow = null));
}

function createSuggestionWindow(_, suggestion) {
  console.log('[UI] Creating Suggestion Window');

  const cursorPoint = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPoint);
  const winX = Math.min(cursorPoint.x, display.bounds.width - 600);
  const winY = Math.min(cursorPoint.y, display.bounds.height - 400);

  suggestionWindow = new BrowserWindow({
    x: winX,
    y: winY,
    width: 600,
    height: 300,
    resizable: false,
    alwaysOnTop: true,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  suggestionWindow.loadFile('suggestion.html');

  suggestionWindow.webContents.on('did-finish-load', () => {
    console.log('[IPC] Sending suggestion to window');
    suggestionWindow.webContents.send('display-suggestion', { suggestion });
  });

  suggestionWindow.on('closed', () => (suggestionWindow = null));
}

async function sendToChatGPT(text) {
  console.log('[ChatGPT] Preparing to send text...');
  const apiKey = loadConfig().openaiApiKey;
  if (!apiKey) {
    console.warn('[ChatGPT] API key missing');
    showNotification('API Key Missing', 'Please add your OpenAI API key to config.json');
    return;
  }
  const fetch = require('electron-fetch').default;
  try {
    const payload = {
      model: chatModel,
      messages: [{ role: 'user', content: `${userPrompt}\n\n${text}` }]
    };
    console.log('[ChatGPT] Sending request:', payload);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('[ChatGPT] Response received:', data);
    const suggestion = data?.choices?.[0]?.message?.content;
    if (suggestion) {
      createSuggestionWindow(text, suggestion);
    } else {
      console.error('[ChatGPT] No suggestion in response');
      showNotification('Error', 'No response from ChatGPT');
    }
  } catch (error) {
    console.error('[ChatGPT] Request failed:', error);
    showNotification('Error', 'Failed to communicate with ChatGPT');
  }
}




function showNotification(title, body) {
  console.log(`[Notify] ${title}: ${body}`);
  new Notification({ title, body }).show();
}

function registerShortcut() {
  console.log(`[Hotkey] Registering shortcut: ${shortcutKey}`);
  globalShortcut.unregisterAll();
  globalShortcut.register(shortcutKey, async () => {
    const selectedText = clipboard.readText();
    console.log('[Hotkey] Triggered. Clipboard text:', selectedText);
    if (!selectedText) {
      showNotification('No Text Selected', 'Please copy text first');
      return;
    }
    await sendToChatGPT(selectedText);
  });
}

ipcMain.on('copy-suggestion', (event, suggestion) => {
  console.log('[IPC] Copying suggestion to clipboard');
  clipboard.writeText(suggestion);
  showNotification('Copied', 'Suggested text copied to clipboard');
  if (suggestionWindow && !suggestionWindow.isDestroyed()) {
    suggestionWindow.close();
    suggestionWindow = null;
  } // Close only the suggestion popup, app remains running
});

ipcMain.on('update-settings', (event, data) => {
  userPrompt = data.prompt;
  chatModel = data.model;
  shortcutKey = data.hotkey;
  saveConfig({ prompt: userPrompt, model: chatModel, hotkey: shortcutKey, openaiApiKey: loadConfig().openaiApiKey });
  registerShortcut();
  // Show settings only on first launch

});

app.whenReady().then(() => {
  console.log('[App] App is ready');
  try {
    tray = new Tray(path.join(__dirname, 'iconTemplate.png'));
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Settings', click: () => createSettingsWindow() },
      { label: 'Quit', role: 'quit' }
    ]);
    tray.setToolTip('ChatGPT Text Improver');
    tray.setContextMenu(contextMenu);
  } catch (error) {
    console.error('[Tray] Failed to load tray icon:', error);
    showNotification('Tray Icon Error', 'Tray icon not loaded');
  }
  registerShortcut();
});

app.on('window-all-closed', (e) => {
  // Prevent quitting the app when all windows are closed
  e.preventDefault();
});

app.on('will-quit', () => {
  console.log('[App] Quitting app');
  globalShortcut.unregisterAll();
});
