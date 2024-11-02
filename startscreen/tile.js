let grids = [];
let draggedTile = null;
let dragOverGrid = null;
let dragOverTimeout = null;
const GRID_SPACING = 40;

function createNewGrid(insertIndex = null) {
    const grid = document.createElement("div");
    grid.className = "grid";

    const dropZoneLeft = document.createElement("div");
    dropZoneLeft.className = "grid-drop-zone left";
    grid.appendChild(dropZoneLeft);

    const dropZoneRight = document.createElement("div");
    dropZoneRight.className = "grid-drop-zone right";
    grid.appendChild(dropZoneRight);

    const tilesContainer = document.createElement("div");
    tilesContainer.className = "tiles-container";
    grid.appendChild(tilesContainer);

    if (insertIndex !== null) {
        const container = document.getElementById("gridsContainer");
        const existingGrids = Array.from(container.children);
        container.insertBefore(grid, existingGrids[insertIndex] || null);
        grids.splice(insertIndex, 0, grid);
        updateGridIndices();
    } else {
        document.getElementById("gridsContainer").appendChild(grid);
        grids.push(grid);
    }

    grid.addEventListener('dragover', handleGridDragOver);
    grid.addEventListener('drop', handleGridDrop);

    resizeGridContainer();

    return grid;
}

function updateGridIndices() {
    grids.forEach((grid, index) => {
        grid.dataset.gridIndex = index;
    });
}

function resizeGridContainer() {
    const container = document.getElementById("gridsContainer");
    const containerWidth = container.clientWidth;
    const totalGridWidth = grids.length * (grids[0].offsetWidth + GRID_SPACING);

    if (totalGridWidth > containerWidth) {
        container.style.overflowX = "scroll";
        container.style.flexWrap = "nowrap";
    } else {
        container.style.overflowX = "hidden";
        container.style.flexWrap = "wrap";
    }
}

function addAppTile(appName, appPath, targetGrid = null, isWide = false) {
    const grid = targetGrid || (grids.length > 0 ? grids[grids.length - 1] : createNewGrid());
    const tilesContainer = grid.querySelector('.tiles-container');

    const tile = document.createElement("div");
    tile.className = "tile";
    if (isWide) {
        tile.classList.add('wide');
        tile.style.width = '264px';
    }
    tile.textContent = appName;
    tile.draggable = true;
    tile.dataset.path = appPath;

    tile.addEventListener('click', () => {
        const {
            ipcRenderer
        } = require('electron');
        const {
            exec
        } = require('child_process');

        exec(`start "" "${appPath}"`, (error) => {
            if (error) {
                console.error('Error launching shortcut:', error);
            } else {
                setTimeout(() => {
                    ipcRenderer.send('quit-app');
                }, 200);
            }
        });
    });

    addTileEventListeners(tile);
    tilesContainer.appendChild(tile);

    document.getElementById("gridsContainer").scrollLeft = document.getElementById("gridsContainer").scrollWidth;

    cleanupEmptyGrids();
    saveTileLayout();
}

function addTileEventListeners(tile) {
    tile.addEventListener("mousedown", handleMouseDown);
    tile.addEventListener("mouseup", handleMouseUp);
    tile.addEventListener("dragstart", handleDragStart);
    tile.addEventListener("dragover", handleDragOver);
    tile.addEventListener("drop", handleDrop);
    tile.addEventListener("dragend", handleDragEnd);
}

function handleMouseDown(event) {
    const tile = event.target;
    pressTimeout = setTimeout(() => {
        tile.classList.add("clicked");
    }, 50);
}

function handleMouseUp(event) {
    clearTimeout(pressTimeout);
    event.target.classList.remove("clicked");
}

function handleDragStart(event) {
    draggedTile = event.target;
    event.dataTransfer.effectAllowed = "move";
    draggedTile.classList.add("dragging");

    document.querySelectorAll(".tile").forEach(tile => {
        if (tile !== draggedTile) {
            tile.classList.add("shrink");
        }
    });
}

function handleGridDragOver(event) {
    event.preventDefault();
    const grid = event.currentTarget;
    const rect = grid.getBoundingClientRect();
    const mouseX = event.clientX;

    document.querySelectorAll('.grid-drop-zone').forEach(zone => {
        zone.classList.remove('active');
    });

    const nextGrid = grid.nextElementSibling;

    if (nextGrid) {
        const nextRect = nextGrid.getBoundingClientRect();
        const gapCenter = (rect.right + nextRect.left) / 2;

        if (Math.abs(mouseX - gapCenter) < GRID_SPACING / 2) {
            grid.querySelector('.grid-drop-zone.right').classList.add('active');
        }
    }
}

function handleDragOver(event) {
    event.preventDefault();
    const tile = event.target;

    if (tile.classList.contains('tile')) {
        const grid = tile.parentElement;
        const rect = tile.getBoundingClientRect();
        const mouseX = event.clientX;

        if (mouseX < rect.left + rect.width * 0.3) {
            tile.classList.add('drop-before');
            tile.classList.remove('drop-after');
        } else if (mouseX > rect.left + rect.width * 0.7) {
            tile.classList.add('drop-after');
            tile.classList.remove('drop-before');
        } else {
            tile.classList.remove('drop-before', 'drop-after');
        }
    }
}

function handleGridDrop(event) {
    event.preventDefault();
    if (!draggedTile) return;

    const grid = event.currentTarget;
    const rect = grid.getBoundingClientRect();
    const mouseX = event.clientX;
    const gridIndex = parseInt(grid.dataset.gridIndex);

    const nextGrid = grid.nextElementSibling;

    if (nextGrid) {
        const nextRect = nextGrid.getBoundingClientRect();
        const gapCenter = (rect.right + nextRect.left) / 2;

        if (Math.abs(mouseX - gapCenter) < GRID_SPACING / 2) {
            const newGrid = createNewGrid(gridIndex + 1);
            newGrid.querySelector('.tiles-container').appendChild(draggedTile);
        } else {
            grid.querySelector('.tiles-container').appendChild(draggedTile);
        }
    } else {
        grid.querySelector('.tiles-container').appendChild(draggedTile);
    }

    cleanupEmptyGrids();
    saveTileLayout();
    resizeGridContainer();
}

function handleDrop(event) {
    event.preventDefault();
    const targetTile = event.target;

    if (!targetTile.classList.contains('tile')) return;

    const tilesContainer = targetTile.closest('.tiles-container');
    if (!tilesContainer) return;

    if (draggedTile !== targetTile) {
        const draggedTileClone = draggedTile.cloneNode(true);
        const targetTileClone = targetTile.cloneNode(true);

        tilesContainer.replaceChild(draggedTileClone, targetTile);
        tilesContainer.replaceChild(targetTileClone, draggedTile);

        addTileEventListeners(draggedTileClone);
        addTileEventListeners(targetTileClone);
        resetTileStyles();
        cleanupEmptyGrids();
        saveTileLayout();
    }

    draggedTile.classList.remove('dragging');
    draggedTile = null;
}

function resetTileStyles() {
    document.querySelectorAll('.tile').forEach(tile => {
        tile.classList.remove('dragging', 'shrink', 'drop-before', 'drop-after', 'pressed');
    });
}

function handleDragEnd(event) {
    if (draggedTile) {
        draggedTile.style.visibility = 'visible';
        draggedTile.classList.remove("dragging");
    }

    document.querySelectorAll(".tile").forEach(tile => {
        tile.classList.remove("shrink", "drop-before", "drop-after");
    });

    resetTileStyles();
    draggedTile = null;
    dragOverGrid = null;
}

function cleanupEmptyGrids() {
    grids = grids.filter(grid => {
        if (grid.querySelector('.tiles-container').children.length === 0) {
            grid.remove();
            return false;
        }
        return true;
    });
    updateGridIndices();
}

function saveTileLayout() {
    const layout = grids.map(grid => {
        const tilesContainer = grid.querySelector('.tiles-container');
        return Array.from(tilesContainer.children).map(tile => ({
            name: tile.textContent,
            path: tile.dataset.path
        }));
    });

    localStorage.setItem('tileLayout', JSON.stringify(layout));
}

function loadTileLayout() {
    const savedLayout = localStorage.getItem('tileLayout');
    const container = document.getElementById('gridsContainer');
    container.innerHTML = '';
    grids = [];

    if (savedLayout) {
        const layout = JSON.parse(savedLayout);

        layout.forEach((gridData) => {
            if (gridData.length > 0) {
                const grid = createNewGrid();
                const tilesContainer = grid.querySelector('.tiles-container');

                gridData.forEach(tileData => {
                    const tile = document.createElement('div');
                    tile.className = 'tile';
                    tile.textContent = tileData.name;
                    tile.draggable = true;
                    tile.dataset.path = tileData.path;

                    tile.addEventListener('click', () => {
                        const {
                            ipcRenderer
                        } = require('electron');
                        const {
                            exec
                        } = require('child_process');

                        exec(`start "" "${tileData.path}"`, (error) => {
                            if (error) {
                                console.error('Error launching shortcut:', error);
                            } else {
                                setTimeout(() => {
                                    ipcRenderer.send('quit-app');
                                }, 200);
                            }
                        });
                    });

                    addTileEventListeners(tile);
                    tilesContainer.appendChild(tile);
                });
            }
        });
    }

    if (grids.length === 0) {
        createNewGrid();
    }
}

function initializeGridContainer() {
    const container = document.getElementById('gridsContainer');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = `${GRID_SPACING}px`;

    container.addEventListener('dragover', (event) => {
        event.preventDefault();
        const mouseX = event.clientX;

        let closestGrid = null;
        let minDistance = Infinity;

        grids.forEach((grid, index) => {
            const rect = grid.getBoundingClientRect();
            const nextGrid = grids[index + 1];

            if (nextGrid) {
                const nextRect = nextGrid.getBoundingClientRect();
                const gapCenter = (rect.right + nextRect.left) / 2;
                const distance = Math.abs(mouseX - gapCenter);

                if (distance < minDistance && distance < GRID_SPACING / 2) {
                    minDistance = distance;
                    closestGrid = grid;
                }
            }
        });

        document.querySelectorAll('.grid-drop-zone').forEach(zone => {
            zone.classList.remove('active');
        });

        if (closestGrid) {
            closestGrid.querySelector('.grid-drop-zone.right').classList.add('active');
        }
    });

    container.addEventListener('drop', (event) => {
        event.preventDefault();
        if (!draggedTile) return;

        const mouseX = event.clientX;

        let closestGrid = null;
        let minDistance = Infinity;

        grids.forEach((grid, index) => {
            const rect = grid.getBoundingClientRect();
            const nextGrid = grids[index + 1];

            if (nextGrid) {
                const nextRect = nextGrid.getBoundingClientRect();
                const gapCenter = (rect.right + nextRect.left) / 2;
                const distance = Math.abs(mouseX - gapCenter);

                if (distance < minDistance && distance < GRID_SPACING / 2) {
                    minDistance = distance;
                    closestGrid = grid;
                }
            }
        });

        if (closestGrid) {
            const gridIndex = parseInt(closestGrid.dataset.gridIndex);
            const newGrid = createNewGrid(gridIndex + 1);
            newGrid.querySelector('.tiles-container').appendChild(draggedTile);
            cleanupEmptyGrids();
            saveTileLayout();
            resizeGridContainer();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadTileLayout();
    initializeGridContainer();
});

document.querySelector('.grids-container').addEventListener('scroll', function(e) {
    const scrollPosition = e.target.scrollLeft;
    const firstPage = document.querySelector('.page:nth-child(1)');
    firstPage.style.backgroundPosition = `${-scrollPosition * 0.2}px center`;
});