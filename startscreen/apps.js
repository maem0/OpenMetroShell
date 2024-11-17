const fs = require('fs');
const path = require('path');
const {
	app
} = require('electron');
const {
	ipcRenderer
} = require('electron');
const {
	exec
} = require('child_process');

const PROGRAMS_PATH = 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs';

let rightClickedApp = null;

function getMetroApps() {
	const metroAppsPath = 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\MetroApps';
	let metroApps = [];

	try {
		const appFolders = fs.readdirSync(metroAppsPath);

		appFolders.forEach(folder => {
			const folderPath = path.join(metroAppsPath, folder);
			const configPath = path.join(folderPath, 'config.json');

			if (fs.existsSync(configPath)) {
				try {
					const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
					const targetPath = path.join(folderPath, configData.target);

					const icons = {
						shortcut: configData.icons.shortcut ? path.join(folderPath, configData.icons.shortcut) : null,
						small: configData.icons.small ? path.join(folderPath, configData.icons.small) : null,
						wide: configData.icons.wide ? path.join(folderPath, configData.icons.wide) : null
					};

					metroApps.push({
						name: configData.name,
						targetPath: targetPath,
						icons: icons,
						backgroundColor: configData.backgroundColor,
						folderPath: folderPath
					});
				} catch (err) {
					console.error(`Error parsing config for ${folder}:`, err);
				}
			}
		});
	} catch (err) {
		console.error('Error reading MetroApps directory:', err);
	}

	return metroApps;
}


function createAppShortcut(shortcut) {
	const appshortcut = document.createElement('div');

	const appData = {
		name: shortcut.name,
		targetPath: shortcut.targetPath || shortcut.path,
		icons: shortcut.icons,
		backgroundColor: shortcut.backgroundColor
	};

	appshortcut.innerHTML = `
        <div class="app-container">
            <div class="icon"></div>
            <div class="name">${shortcut.name}</div>
        </div>
    `;

	const appShortcut = appshortcut.querySelector('.app-container');
	const iconElement = appshortcut.querySelector('.icon');

	if (appData.icons?.shortcut) {
		const imgElement = document.createElement('img');
		imgElement.src = appData.icons.shortcut;
		imgElement.alt = `${appData.name} icon`;
		imgElement.style.width = '100%';
		imgElement.style.height = '100%';
		imgElement.style.objectFit = 'contain';
		iconElement.appendChild(imgElement);
	} else {
		iconElement.style.backgroundColor = appData.backgroundColor || '#0099ff';
	}

	appShortcut.addEventListener('click', () => {
		const targetPath = shortcut.targetPath || shortcut.path;
		if (targetPath) {
			exec(`start "" "${targetPath}"`, (error) => {
				if (error) {
					console.error('Error launching app:', error);
				} else {
					setTimeout(() => {
						ipcRenderer.send('quit-app');
					}, 200);
				}
			});
		}
	});


	appshortcut.addEventListener('mousedown', () => {
		appShortcut.classList.add('shrink');
	});

	appshortcut.addEventListener('mouseup', () => {
		appShortcut.classList.remove('shrink');
	});

	appshortcut.addEventListener('mouseleave', () => {
		appShortcut.classList.remove('shrink');
	});

	appshortcut.addEventListener('click', () => {
		exec(`start "" "${shortcut.path}"`);
		setTimeout(() => {
			ipcRenderer.send('quit-app');
		}, 200);
	});

	appShortcut.addEventListener('contextmenu', (e) => {
		e.preventDefault();
		rightClickedApp = shortcut;

		const appContextMenu = document.getElementById('appContextMenu');
		appContextMenu.style.display = 'flex';

		document.getElementById('contextMenu').style.display = 'none';
	});

	return appshortcut;
}

function pinAppToStart() {
	if (rightClickedApp) {
		const folderPath = rightClickedApp.folderPath;
		const appData = {
			name: rightClickedApp.name,
			targetPath: rightClickedApp.targetPath || rightClickedApp.path,
			icons: {
				shortcut: rightClickedApp.icons.shortcut,
				small: rightClickedApp.icons.small,
				wide: rightClickedApp.icons.wide
			},
			backgroundColor: rightClickedApp.backgroundColor,
			isMetroApp: true
		};
		createAppTile(appData);
		document.getElementById('appContextMenu').style.display = 'none';
		rightClickedApp = null;
		saveTileState();
	}
}



document.addEventListener('click', (event) => {
	const appContextMenu = document.getElementById('appContextMenu');
	const regularContextMenu = document.getElementById('contextMenu');

	if (!appContextMenu.contains(event.target) && !regularContextMenu.contains(event.target)) {
		appContextMenu.style.display = 'none';
		regularContextMenu.style.display = 'none';
	}
});

function createAppTile(appData) {
	if (!currentGrid || currentGrid.children.length >= 24) {
		addGrid();
	}

	const tile = document.createElement('div');
	tile.classList.add('tile');
	tile.draggable = true;
	tile.setAttribute('data-id', ++tileCount);
	tile.setAttribute('data-app-path', appData.targetPath);

	if (appData.isMetroApp) {
		tile.setAttribute('data-metro-app', 'true');
		tile.setAttribute('data-background-color', appData.backgroundColor);
		tile.setAttribute('data-icon-shortcut', appData.icons?.shortcut || '');
		tile.setAttribute('data-icon-small', appData.icons?.small || '');
		tile.setAttribute('data-icon-wide', appData.icons?.wide || '');

		tile.style.backgroundColor = appData.backgroundColor;
	}

	const iconPath = tile.classList.contains('wide-tile') ?
		appData.icons?.wide :
		appData.icons?.small;

	tile.innerHTML = `
        <div class="tile-content">
            ${iconPath ? 
                `<img src="file://${iconPath}" class="tile-icon" alt="${appData.name} icon"/>` : 
                '<div class="tile-icon"></div>'
            }
            <div class="tile-name">${appData.name}</div>
        </div>
    `;

	tile.addEventListener('click', () => {
		exec(`start "" "${appData.targetPath}"`);
		setTimeout(() => {
			ipcRenderer.send('quit-app');
		}, 200);
	});

	tile.addEventListener('contextmenu', handleRightClick);
	tile.addEventListener('dragstart', handleDragStart);
	tile.addEventListener('dragover', handleDragOver);
	tile.addEventListener('drop', handleDrop);
	tile.addEventListener('dragend', handleDragEnd);

	tile.addEventListener('mousedown', () => {
		tile.classList.add('tile-pressed');
	});
	tile.addEventListener('mouseup', () => {
		tile.classList.remove('tile-pressed');
	});
	tile.addEventListener('mouseleave', () => {
		tile.classList.remove('tile-pressed');
	});

	currentGrid.appendChild(tile);
	saveTileState();
}

function getAllShortcuts(dir) {
	let results = [];
	const items = fs.readdirSync(dir);

	items.forEach(item => {
		const fullPath = path.join(dir, item);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			results = results.concat(getAllShortcuts(fullPath));
		} else if (item.endsWith('.lnk')) {
			results.push({
				name: path.parse(item).name,
				path: fullPath,
				folder: dir === PROGRAMS_PATH ? 'Root' : path.basename(dir)
			});
		}
	});

	return results;
}

function displayShortcuts() {
	const grid = document.getElementById('shortcutsGrid');
	const shortcuts = getAllShortcuts(PROGRAMS_PATH);
	const metroApps = getMetroApps();
	let lastFolder = '';

	shortcuts.forEach(shortcut => {
		if (shortcut.folder === 'Root') {
			const appshortcut = createAppShortcut(shortcut);
			grid.appendChild(appshortcut);
		}
	});

	if (metroApps.length > 0) {
		const metroLabel = document.createElement('div');
		metroLabel.className = 'folder-label';
		metroLabel.textContent = 'Metro Apps';
		grid.appendChild(metroLabel);

		metroApps.forEach(app => {
			const appshortcut = createAppShortcut({
				name: app.name,
				path: app.targetPath,
				icons: app.icons,
				backgroundColor: app.backgroundColor
			});

			grid.appendChild(appshortcut);
		});
	}

	const spacerColumn = document.createElement('div');
	spacerColumn.className = 'spacing-column';
	grid.appendChild(spacerColumn);

	shortcuts.forEach(shortcut => {
		if (shortcut.folder !== 'Root' && shortcut.folder !== lastFolder) {
			const folderLabel = document.createElement('div');
			folderLabel.className = 'folder-label';
			folderLabel.textContent = shortcut.folder;
			grid.appendChild(folderLabel);
			lastFolder = shortcut.folder;
		}

		if (shortcut.folder !== 'Root') {
			const appshortcut = createAppShortcut(shortcut);
			grid.appendChild(appshortcut);
		}
	});
}

displayShortcuts();