const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let sidebarWindow;
let startScreenWindow;
function createSidebar() {
    const {
        width,
        height
    } = screen.getPrimaryDisplay().workAreaSize;

    sidebarWindow = new BrowserWindow({
        width: width,
        height: height,
        x: 0,
        y: 0,
        frame: false,
        skipTaskbar: true,
        fullscreenable: false,
        alwaysOnTop: true,
        transparent: true,
        resizable: false,
        sandbox: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    sidebarWindow.setMaximizable(false);
    sidebarWindow.setMinimizable(false);

    sidebarWindow.loadFile('index.html');

    const TRIGGER_AREA = 20;
    let state = 'hidden';

    function checkMousePosition() {
        const mousePos = screen.getCursorScreenPoint();
        const inTriggerArea = (mousePos.x >= width - TRIGGER_AREA && mousePos.y <= TRIGGER_AREA);
        const inSidebarArea = (mousePos.x >= width - 300 && mousePos.x <= width && mousePos.y >= 0 && mousePos.y <= height);
        let newState = 'hidden';

        if (inTriggerArea) {
            newState = 'preview';
        } else if (inSidebarArea && state !== 'hidden') {
            newState = 'active';
        } else if (!inSidebarArea && !inTriggerArea) {
            newState = 'hidden';
        }

        if (newState !== state) {
            state = newState;
            switch (state) {
                case 'hidden':
                    fadeOutSidebar();
                    sidebarWindow.setIgnoreMouseEvents(true);
                    sidebarWindow.webContents.send('update-state', 'hidden');
                    break;
                case 'preview':
                    updateSidebarOverlay(true);
                    sidebarWindow.setOpacity(1);
                    sidebarWindow.setIgnoreMouseEvents(true);
                    sidebarWindow.webContents.send('update-state', 'preview');
                    break;
                case 'active':
                    sidebarWindow.setOpacity(1);
                    sidebarWindow.setIgnoreMouseEvents(false);
                    sidebarWindow.webContents.send('update-state', 'active');
                    break;
            }
        }
    }
    

    function fadeOutSidebar() {
        let opacity = 1;
        const fadeDuration = 500;
        const fadeInterval = 50;

        const fadeOut = setInterval(() => {
            opacity -= fadeInterval / fadeDuration;
            if (opacity <= 0) {
                clearInterval(fadeOut);
                sidebarWindow.setOpacity(0);
            } else {
                sidebarWindow.setOpacity(opacity);
            }
        }, fadeInterval);
    }

    function updateSidebarOverlay(show) {
        sidebarWindow.webContents.send('sidebar-visibility', show);
    }

    const mouseTracker = setInterval(checkMousePosition, 100);

    sidebarWindow.on('closed', () => {
        if (mouseTracker) {
            clearInterval(mouseTracker);
        }
    });
}

function createStartScreen(initialView = 'start') {
    if (startScreenWindow) {
        startScreenWindow.focus();
        return;
    }

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    startScreenWindow = new BrowserWindow({
        width: width,
        height: height,
        frame: false,
        fullscreen: true,
        show: false,
        alwaysOnTop: false,
        transparent: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, "apps.js", "tile.js", "style.css")
        }
    });

    startScreenWindow.loadFile('startscreen/index.html');

    startScreenWindow.once('ready-to-show', () => {
        startScreenWindow.show();
        startScreenWindow.webContents.send('set-initial-view', initialView);
        sidebarWindow.setAlwaysOnTop(true, 'screen-saver');
    });

    startScreenWindow.on('closed', () => {
        startScreenWindow = null;
    });
}

ipcMain.on('open-start-screen', (event, view) => {
    createStartScreen(view);
});

ipcMain.on('close-start-screen', () => {
    if (startScreenWindow) {
        startScreenWindow.close();
        startScreenWindow = null;
    }
});

app.whenReady().then(createSidebar);

ipcMain.on('quit-app', () => {
    startScreenWindow.close();
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createSidebar();
    }
});