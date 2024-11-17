const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    onUpdateState: (callback) => {
        ipcRenderer.on('update-state', (event, state) => {
            callback(state);
        });
    },
    openStartScreen: (view) => {
        ipcRenderer.send('open-start-screen', view);
    },
    closeStartScreen: () => {
        ipcRenderer.send('close-start-screen');
    },
    switchToApps: () => {
        ipcRenderer.send('switch-to-apps');
    },
    switchToStart: () => {
        ipcRenderer.send('switch-to-start');
    },
    showDesktop: () => {
        ipcRenderer.send('show-desktop');
    }
});