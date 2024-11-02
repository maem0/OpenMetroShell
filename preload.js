const {
    contextBridge,
    ipcRenderer
} = require('electron');

contextBridge.exposeInMainWorld('electron', {
    onUpdateState: (callback) => {
        ipcRenderer.on('update-state', (event, state) => {
            callback(state);
        });
    },
    openStartScreen: () => {
        ipcRenderer.send('open-start-screen');
    },
    closeStartScreen: () => {
        ipcRenderer.send('close-start-screen');
    },
    showDesktop: () => {
        ipcRenderer.send('show-desktop');
    }
});