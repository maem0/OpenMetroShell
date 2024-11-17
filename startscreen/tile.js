let tileCount = 0;
let currentGrid = null;
let rightClickedTile = null;
const tileContainer = document.getElementById('tileContainer');
const contextMenu = document.getElementById('contextMenu');

function initializeContainer() {
	const leftDroparea = document.createElement('div');
	leftDroparea.classList.add('droparea');
	addDropareaEventListeners(leftDroparea);
	tileContainer.appendChild(leftDroparea);

	addGrid();
    
}

function addDropareaEventListeners(droparea) {
	droparea.addEventListener('dragover', handledropareaDragOver);
	droparea.addEventListener('drop', (event) => handledropareaDrop(event, droparea));
	droparea.addEventListener('dragleave', handledropareaDragLeave);
}

function addTile() {
	if (!currentGrid || currentGrid.children.length >= 24) {
		addGrid();
	}

	const tile = document.createElement('div');
	tile.classList.add('tile');
	tile.draggable = true;
	tile.textContent = ++tileCount;
	tile.setAttribute('data-id', tileCount);

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
}

function pinAppToStart() {
	if (rightClickedApp) {
		const appData = {
			name: rightClickedApp.name,
			targetPath: rightClickedApp.targetPath || rightClickedApp.path,
			icons: rightClickedApp.icons,
			backgroundColor: rightClickedApp.backgroundColor,
			isMetroApp: true 
		};
		createAppTile(appData);
		document.getElementById('appContextMenu').style.display = 'none';
		rightClickedApp = null;
		saveTileState(); 
	}
}

function saveTileState() {
	const grids = document.querySelectorAll('.grid');
	const tileState = [];

	grids.forEach((grid, gridIndex) => {
		const tiles = grid.querySelectorAll('.tile');
		const gridTiles = [];

		tiles.forEach(tile => {
			gridTiles.push({
				id: tile.getAttribute('data-id'),
				isWide: tile.classList.contains('wide-tile'),
				appPath: tile.getAttribute('data-app-path'),
				name: tile.querySelector('.tile-name')?.textContent,
				isMetroApp: tile.getAttribute('data-metro-app') === 'true',
				backgroundColor: tile.getAttribute('data-background-color'),
				icons: {
					shortcut: tile.getAttribute('data-icon-shortcut'),
					small: tile.getAttribute('data-icon-small'),
					wide: tile.getAttribute('data-icon-wide')
				}
			});
		});

		tileState.push(gridTiles);
	});

	localStorage.setItem('tileState', JSON.stringify(tileState));
}

function loadTileState() {
	const savedState = localStorage.getItem('tileState');
	if (!savedState) {
		initializeContainer();
		return;
	}

	const tileState = JSON.parse(savedState);
	tileContainer.innerHTML = '';

	const leftDroparea = document.createElement('div');
	leftDroparea.classList.add('droparea');
	addDropareaEventListeners(leftDroparea);
	tileContainer.appendChild(leftDroparea);

	tileState.forEach((gridTiles, index) => {
		addGrid();

		gridTiles.forEach(tileData => {
			const appData = {
				name: tileData.name,
				targetPath: tileData.appPath,
				isMetroApp: tileData.isMetroApp,
				backgroundColor: tileData.backgroundColor,
				icons: tileData.icons
			};

			const tile = document.createElement('div');
			tile.classList.add('tile');
			tile.draggable = true;
			tile.setAttribute('data-id', tileData.id);
			tile.setAttribute('data-app-path', tileData.appPath);

			if (tileData.isMetroApp) {
				tile.setAttribute('data-metro-app', 'true');
				tile.setAttribute('data-background-color', tileData.backgroundColor);
				tile.setAttribute('data-icon-shortcut', tileData.icons?.shortcut || '');
				tile.setAttribute('data-icon-small', tileData.icons?.small || '');
				tile.setAttribute('data-icon-wide', tileData.icons?.wide || '');
				tile.style.backgroundColor = tileData.backgroundColor;
			}

			const iconPath = tileData.isWide ?
				tileData.icons?.wide :
				tileData.icons?.small;

			tile.innerHTML = `
            <div class="tile-content">
                ${iconPath ? 
                    `<img src="file://${iconPath}" class="tile-icon" alt="${tileData.name} icon"/>` : 
                    '<div class="tile-icon"></div>'
                }
                <div class="tile-name">${tileData.name}</div>
            </div>
        `;

			if (tileData.isWide) {
				tile.classList.add('wide-tile');
			}

			addTileEventListeners(tile);

			tile.addEventListener('click', () => {
				exec(`start "" "${tileData.appPath}"`);
				setTimeout(() => {
					ipcRenderer.send('quit-app');
				}, 200);
			});

			currentGrid.appendChild(tile);
		});

		if (index < tileState.length - 1) {
			const droparea = document.createElement('div');
			droparea.classList.add('droparea');
			addDropareaEventListeners(droparea);
			tileContainer.appendChild(droparea);
		}
	});
    cleanupExtraDropareas() 
	tileCount = Math.max(...tileState.flat().map(tile => parseInt(tile.id) || 0), 0);
}

function addTileEventListeners(tile) {
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
}

function addWideTile() {
	if (!currentGrid || currentGrid.children.length >= 24) {
		addGrid();
	}

	const wideTile = document.createElement('div');
	wideTile.classList.add('tile', 'wide-tile');
	wideTile.draggable = true;
	wideTile.textContent = ++tileCount;
	wideTile.setAttribute('data-id', tileCount);

	wideTile.addEventListener('contextmenu', handleRightClick);
	wideTile.addEventListener('dragstart', handleDragStart);
	wideTile.addEventListener('dragover', handleDragOver);
	wideTile.addEventListener('drop', handleDrop);
	wideTile.addEventListener('dragend', handleDragEnd);

	wideTile.addEventListener('mousedown', () => {
		wideTile.classList.add('tile-pressed');
	});
	wideTile.addEventListener('mouseup', () => {
		wideTile.classList.remove('tile-pressed');
	});
	wideTile.addEventListener('mouseleave', () => {
		wideTile.classList.remove('tile-pressed');
	});

	currentGrid.appendChild(wideTile);
}

function addGrid(beforeElement = null) {
    const newGrid = document.createElement('div');
    newGrid.classList.add('grid');

    if (beforeElement) {
        tileContainer.insertBefore(newGrid, beforeElement);
    } else {
        tileContainer.appendChild(newGrid);
    }

    const droparea = document.createElement('div');
    droparea.classList.add('droparea');
    addDropareaEventListeners(droparea);

    if (beforeElement) {
        tileContainer.insertBefore(droparea, newGrid.nextSibling);
    } else {
        tileContainer.appendChild(droparea);
    }

    currentGrid = newGrid;

    const gridIndex = Array.from(document.querySelectorAll('.grid')).indexOf(newGrid);
    setTimeout(() => {
        newGrid.classList.add('animate');
    }, gridIndex * 50); 

    return newGrid;
}

function handleRightClick(event) {
	event.preventDefault();
	rightClickedTile = event.target.closest('.tile');
	contextMenu.style.display = 'flex';
}



function deleteTile() {
	if (rightClickedTile) {
		const tile = rightClickedTile.closest('.tile');
		if (tile) {
			tile.remove();
			saveTileState();
		}
		rightClickedTile = null;
	}
	contextMenu.style.display = 'none';
}

function toggleTileSize() {
	if (rightClickedTile) {
		const tile = rightClickedTile.closest('.tile');
		if (tile) {
			tile.classList.toggle('wide-tile');

			if (tile.getAttribute('data-metro-app') === 'true') {
				const isWide = tile.classList.contains('wide-tile');
				const iconPath = isWide ?
					tile.getAttribute('data-icon-wide') :
					tile.getAttribute('data-icon-small');

				if (iconPath) {
					const iconImg = tile.querySelector('.tile-icon img');
					if (iconImg) {
						iconImg.src = `file://${iconPath}`;
					}
				}
			}

			saveTileState();
		}
	}
	contextMenu.style.display = 'none';
}


let draggedTile = null;

function handleDragStart(event) {
	draggedTile = event.target.closest('.tile');
	if (!draggedTile) return;

	draggedTile.classList.add('dragging');
	event.dataTransfer.effectAllowed = "move";

	draggedTile.affectedTiles = Array.from(document.querySelectorAll('.tile')).filter(tile => tile !== draggedTile);
	draggedTile.affectedTiles.forEach(tile => {
		tile.classList.add('tile-dragging');
	});
}




function cleanupEmptyGrids() {
	const grids = Array.from(document.querySelectorAll('.grid'));

	grids.forEach(grid => {
		if (grid.children.length === 0) {
			let nextElement = grid.nextElementSibling;
			if (nextElement && nextElement.classList.contains('droparea')) {
				nextElement.remove();
			}

			if (grid !== grids[grids.length - 1]) {
				let previousElement = grid.previousElementSibling;
				if (previousElement && previousElement.classList.contains('droparea')) {
					previousElement.remove();
				}
			}

			grid.remove();
		}
	});

	if (document.querySelectorAll('.grid').length === 0) {
		initializeContainer();
	}
}

function handleDragOver(event) {
	event.preventDefault();
	event.dataTransfer.dropEffect = "move";

	const targetTile = event.target;

	if (targetTile.classList.contains('tile') && targetTile !== draggedTile) {
		const tileContainer = targetTile.parentNode;
		const targetRect = targetTile.getBoundingClientRect();

		const isAboveCenter = (event.clientY - targetRect.top) < (targetRect.height / 2);

		if (isAboveCenter) {
			tileContainer.insertBefore(draggedTile, targetTile);
		} else {
			tileContainer.insertBefore(draggedTile, targetTile.nextSibling);
		}
	}
}

function cleanupExtraDropareas() {
	const containerChildren = Array.from(tileContainer.children);
	let lastWasDroparea = false; 
	let previousElementIsGrid = false; 

	containerChildren.forEach((child, index) => {
		if (child.classList.contains('grid')) {
			if (!lastWasDroparea && index !== 0) {
				const droparea = document.createElement('div');
				droparea.classList.add('droparea');
				addDropareaEventListeners(droparea);
				tileContainer.insertBefore(droparea, child);
			}
			lastWasDroparea = false;
			previousElementIsGrid = true;
		}
		else if (child.classList.contains('droparea')) {
			if (lastWasDroparea || !previousElementIsGrid) {
				tileContainer.removeChild(child);
			} else {
				lastWasDroparea = true;
			}
			previousElementIsGrid = false;
		}
	});

	const lastChild = tileContainer.lastElementChild;
	if (lastChild && lastChild.classList.contains('grid')) {
		const endDroparea = document.createElement('div');
		endDroparea.classList.add('droparea');
		addDropareaEventListeners(endDroparea);
		tileContainer.appendChild(endDroparea);
	}
}


function handleDragEnd() {
	if (draggedTile) {
		draggedTile.classList.remove('dragging');
		if (draggedTile.affectedTiles) {
			draggedTile.affectedTiles.forEach(tile => {
				tile.classList.remove('tile-dragging');
				tile.classList.remove('tile-pressed');
			});
			draggedTile.affectedTiles = null;
		}

		cleanupEmptyGrids();
		cleanupExtraDropareas();

		draggedTile = null;
		saveTileState();
	}
}

function handledropareaDrop(event, dropareaElement) {
    event.preventDefault();
    if (draggedTile) {
        const sourceGrid = draggedTile.parentNode;

        const newGrid = addGrid(dropareaElement);
        newGrid.appendChild(draggedTile);
        currentGrid = newGrid; 

        if (sourceGrid && sourceGrid.children.length === 0) {
            cleanupEmptyGrids();
        }

        cleanupExtraDropareas();

        saveTileState();

        requestAnimationFrame(() => {
            dropareaElement.classList.remove('droparea-highlight');
        });
    }
}


function handleDrop(event) {
	event.preventDefault();
	if (draggedTile) {
		const dropTarget = event.target.closest('.tile');
		if (dropTarget && dropTarget !== draggedTile) {
			const container = dropTarget.parentNode;
			const bounding = dropTarget.getBoundingClientRect();
			const offset = event.clientY - bounding.top;

			if (offset > bounding.height / 2) {
				container.insertBefore(draggedTile, dropTarget.nextSibling);
			} else {
				container.insertBefore(draggedTile, dropTarget);
			}
		}
		cleanupEmptyGrids();
		saveTileState();
	}
	event.stopPropagation();
}



function pinToStart() {
	if (rightClickedTile) {
		const tileClone = rightClickedTile.cloneNode(true);
		tileClone.classList.remove('tile-pressed', 'tile-dragging');
		tileClone.addEventListener('contextmenu', handleRightClick);

		tileContainer.appendChild(tileClone);

		contextMenu.style.display = 'none';
	}
}

function handledropareaDragOver(event) {
	event.preventDefault();
	event.dataTransfer.dropEffect = "move";

	const dropareaElement = event.currentTarget;
	dropareaElement.classList.add('droparea-highlight');
}


function handledropareaDragLeave(event) {
	const dropareaElement = event.currentTarget;
	dropareaElement.classList.remove('droparea-highlight');
}

document.querySelectorAll('.droparea').forEach(droparea => {
	droparea.addEventListener('dragover', handledropareaDragOver);
	droparea.addEventListener('drop', (event) => handledropareaDrop(event, droparea));
	droparea.addEventListener('dragleave', handledropareaDragLeave);
});

initializeContainer();

document.addEventListener('DOMContentLoaded', loadTileState);

document.querySelector('.tile-container').addEventListener('scroll', function(e) {
	const scrollPosition = e.target.scrollLeft;
	const firstPage = document.querySelector('.page:nth-child(1)');
	firstPage.style.backgroundPosition = `${-scrollPosition * 0.2}px center`;
});