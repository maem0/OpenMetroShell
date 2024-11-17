const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 768,
        fullscreen: true,
        frame: false,
		sandbox: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('quit-app', () => {
    app.quit();
});

ipcMain.on('lock-screen', () => {
    exec('rundll32.exe user32.dll,LockWorkStation', (err) => {
        if (err) console.error('Failed to lock screen:', err);
    });
});

ipcMain.on('sign-out', () => {
    exec('shutdown -l', (err) => {
        if (err) console.error('Failed to sign out:', err);
    });
});


ipcMain.on('update-profile-picture', (event, imagePath) => {

    console.log('New profile picture path:', imagePath);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
