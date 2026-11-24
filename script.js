// ==================== Don't Starve Together "We Await" Auto Puzzle Solver ====================
(function() {
'use strict';

// ==================== Automatic Page Navigation System ====================

// Define page transitions and click positions.
const PAGE_TRANSITIONS = {
    '0': {
        '1':  { panel: 0, x: 17, y: 15 }, // Sun switches to night.
        '78': { panel: 1, x: 14, y: 77 }  // Pencil switches to the study.
    },
    '1': {
        '0':  { panel: 0, x: 17, y: 15 }, // Moon switches to daytime.
        '4':  { panel: 0, x: 53, y: 85 }, // Dirt pit switches to the ruins.
        '2':  { panel: 16, x: 54, y: 39 }, // Music-door note switches to the repair room.
        '3':  { panel: 16, x: 52, y: 51 }  // Music-door note switches to the assembly room.
    },
    '2': {
        '78': { panel: 0, x: 54, y: 44 }, // Crayon switches to the study.
        '5':  { panel: 0, x: 22, y: 46 }  // Door switches to the lens room.
    },
    '3': {
        '78': { panel: 0, x: 15, y: 57 }, // Crayon switches to the study.
        '6':  { panel: 0, x: 58, y: 41 }  // Small note switches to the circuit dashboard room.
    },
    '4': {
        '2':  { panel: 0, x: 21, y: 70 }  // Wagstaff part switches to the repair room.
    },
    '5': {
        '2':  { panel: 0, x: 22, y: 46 }  // Door switches to the repair room.
    },
    '6': {
        '3':  { panel: 0, x: 25, y: 27 }  // Robot part switches to the assembly room.
    },
    '78': {
        '0':  { panel: 0, x: 40, y: 89 }, // Gold coin switches to daytime.
        '1':  { panel: 0, x: 44, y: 91 }, // Silver coin switches to night.
        '2':  { panel: 0, x: 43, y: 62 }, // Screwdriver switches to the repair room.
        '3':  { panel: 0, x: 8, y: 53 },  // Robot part switches to the assembly room.
        '4':  { panel: 0, x: 13, y: 32 }  // Part switches to the ruins.
    }
};

function getCurrentPage() {
    return document.body.getAttribute('page') || '0'; // Default to daytime (0) when no page is found.
}

// Use BFS to find the shortest transition path and click automatically.
async function navigateToPage(targetPage) {
    targetPage = String(targetPage);
    let currentPage = getCurrentPage();

    if (currentPage === targetPage) return;

    console.log(`\n🚗 Auto navigation: current Page ${currentPage}, target Page ${targetPage}`);

    let queue = [ { page: currentPage, path: [] } ];
    let visited = new Set([currentPage]);
    let foundPath = null;

    while (queue.length > 0) {
        let current = queue.shift();
        if (current.page === targetPage) {
            foundPath = current.path;
            break;
        }

        let neighbors = PAGE_TRANSITIONS[current.page];
        if (neighbors) {
            for (let nextPage in neighbors) {
                if (!visited.has(nextPage)) {
                    visited.add(nextPage);
                    queue.push({
                        page: nextPage,
                        path: [...current.path, { from: current.page, to: nextPage, action: neighbors[nextPage] }]
                    });
                }
            }
        }
    }

    if (!foundPath) {
        console.error(`❌ Could not find a path from Page ${currentPage} to Page ${targetPage}. You may be in an unknown state.`);
        return;
    }

    // Follow the path and perform each transition.
    for (let i = 0; i < foundPath.length; i++) {
        let step = foundPath[i];
        console.log(`   [Page jump ${i + 1}/${foundPath.length}] from ${step.from} to ${step.to}`);

        await simulateClick({
            page: step.from,
            panel: step.action.panel,
            x: step.action.x,
            y: step.action.y,
            wait: 3500, // Allow time for page-jump animation/loading.
            desc: `Page route -> ${step.to}`,
            skipNav: true
        });

        let newPage = getCurrentPage();
        if (newPage !== step.to) {
             console.warn(`   ⚠️ The page does not seem to have updated; it is still ${newPage}. It may still be loading or a prerequisite may be locked.`);
        }
    }
    console.log(`✅ Navigation reached target Page ${getCurrentPage()}\n`);
}

// ==================== Utility And Feedback Functions ====================

// When stop() is called, throw a silent interruption signal to stop the call chain.
function checkStop() {
    if (typeof Controller !== 'undefined' && Controller && !Controller.isRunning) {
        const err = new Error('INTERRUPTED');
        err.isStop = true;
        throw err;
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        const start = Date.now();
        const timer = setInterval(() => {
            const isStopped = typeof Controller !== 'undefined' && Controller && !Controller.isRunning;
            if (isStopped || Date.now() - start >= ms) {
                clearInterval(timer);
                resolve();
            }
        }, 30);
    });
}

async function waitForElement(selector, timeout) {
    let isSpecialWait = false;
    if (timeout === undefined) {
        // Special case: #page1panel6 may need up to three minutes while waiting for the cricket to appear.
        if (selector === '#page1panel6') {
            timeout = 180000;
            isSpecialWait = true;
        } else {
            timeout = 8000;
        }
    }
    const start = Date.now();
    let hasLogged = false;

    while (Date.now() - start < timeout) {
        checkStop();
        const panelContainer = document.querySelector(selector);
        if (panelContainer) {
            const clickTarget = panelContainer.querySelector('.panel-background');
            if (clickTarget) return clickTarget;
        } else if (isSpecialWait && !hasLogged) {
            console.log(`⏳ [Hint] Waiting up to two minutes for the cricket/small curled mushroom. Please wait for the page to refresh.`);
            hasLogged = true;
        }
        await sleep(500);
    }
    throw new Error(`Element not found: ${selector} (waited ${timeout / 1000} seconds)`);
}

async function waitForReady(timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        checkStop();
        if (!document.body.classList.contains('loading')) {
            await sleep(200);
            return true;
        }
        await sleep(100);
    }
    return false;
}

function highlightClick(x, y) {
    const dot = document.createElement('div');
    dot.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;background:rgba(255,0,0,0.5);border:2px solid red;pointer-events:none;z-index:999999;animation:pulse 0.5s ease-out;`;
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 500);
}

function highlightDrag(startX, startY, endX, endY) {
    const line = document.createElement('div');
    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    line.style.cssText = `position:fixed;left:${startX}px;top:${startY}px;width:${length}px;height:3px;background:linear-gradient(to right,rgba(0,100,255,0.8),rgba(0,200,255,0.8));transform-origin:0 50%;transform:rotate(${angle}deg);pointer-events:none;z-index:999999;animation:dragFade 1s ease-out;`;
    document.body.appendChild(line);
    setTimeout(() => line.remove(), 1000);
}

const style = document.createElement('style');
style.textContent = `@keyframes pulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2); opacity: 0; } } @keyframes dragFade { 0% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }`;
document.head.appendChild(style);

// ==================== Smart Error-Prevention Guard System ====================

async function checkAndClosePanel(page, panel) {
    const pg = String(page);
    const pn = String(panel);

    if (pg === '78' && pn === '0') {
        let img = document.querySelector('#page78panel0 img.inspectable.open');
        if (img) {
            console.log("  => [Guard] Detected an unclosed item in page78panel0; resetting...");
            await simulateClick({page: 78, panel: 0, x: 0, y: 0, wait: 1000, skipNav: true, skipCheck: true});
        }
    } else if (pg === '0' && pn === '1') {
        let img = document.querySelector('#page0panel1 img.inspectable.open');
        if (img) {
            console.log("  => [Guard] Detected an unclosed item in page0panel1; resetting...");
            await simulateClick({page: 0, panel: 1, x: 0, y: 0, wait: 1000, skipNav: true, skipCheck: true});
        }
    } else if (pg === '5' && pn === '1') {
        if (document.getElementById('page5panel1openbook')) {
            console.log("  => [Guard] Detected an unclosed book in page5panel1; resetting...");
            await simulateClick({page: 5, panel: 1, x: 0, y: 0, wait: 1000, skipNav: true, skipCheck: true});
        }
    }

    // Check all page 3 popups so an open inspectable item cannot block the panel after collecting a part.
    if (pg === '3') {
        let selector = `#page3panel${pn} .inspectable.open`;
        if (document.querySelector(selector)) {
            console.log(`  => [Safety guard] Detected a popup on page3panel${pn}; clicking to close it...`);
            await simulateClick({page: page, panel: panel, x: 0, y: 0, wait: 1000, skipNav: true, skipCheck: true});
        }
    }
}

// ==================== Action Execution Engine ====================

// Simulate a click.
async function simulateClick({page, panel, x, y, wait = 1000, desc = '', skipNav = false, skipCheck = false}) {
    checkStop();
    if (!skipNav && page !== undefined) {
        await navigateToPage(page);
    }

    // Before clicking a panel, check whether any open items need to be closed.
    if (!skipCheck && page !== undefined && panel !== undefined) {
        await checkAndClosePanel(page, panel);
    }

    const selector = `#page${page}panel${panel}`;
    const element = await waitForElement(selector);
    const rect = element.getBoundingClientRect();
    const clientX = rect.left + rect.width * x / 100;
    const clientY = rect.top + rect.height * y / 100;

    highlightClick(clientX, clientY);

    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: clientX, clientY: clientY, view: window }));
    console.log(`  ✓ Panel ${panel} (${x}%, ${y}%)${desc ? ` (${desc})` : ''}`);

    await waitForReady();
    await sleep(wait);
    checkStop();
}

// Simulate dragging.
async function simulateDrag({page, id, startCoord, endCoord, wait = 1500, skipNav = false}) {
    checkStop();
    if (!skipNav && page !== undefined) {
        await navigateToPage(page);
    }

    const element = document.getElementById(id);
    if (!element) return console.error(`  ✗ Element not found: ${id}`);

    // Center the target element in the viewport to avoid coordinate errors near the edges.
    element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
    await sleep(100);

    const tagName = element.tagName.toLowerCase();
    const isDraggablePanel = element.hasAttribute('candrag') && element.getAttribute('candrag') === 'true';
    const isDial = tagName === 'goggles-dial';
    const isMonocle = tagName === 'shadow-monocle';
    const isScanning = tagName === 'scanning-apparatus';
    const isSlider = id.includes('slider');

    let targetNode = element;
    if (isDial) {
        targetNode = element.querySelector('.dial-handle') || element;
    } else if (isScanning) {
        targetNode = element.querySelector('.scanning-handle') || element;
    } else if (isSlider) {
        targetNode = element.querySelector('.rangeslider-back');
        if (!targetNode || !element.querySelector('.rangeslider-knob')) {
            return console.error(`  ✗ Slider structure is incomplete: ${id}`);
        }
    }

    // Coordinate calculation helper.
    const getCoords = (coord) => {
        let parentRect = (isScanning || isSlider) ? element.getBoundingClientRect() : element.parentElement.getBoundingClientRect();

        if (isSlider) {
            const backRect = targetNode.getBoundingClientRect();
            const y = parentRect.top + parentRect.height * coord.y / 100;
            const x = backRect.left + backRect.width / 2;
            return { x, y };
        }

        if (coord === 'auto') {
            const nodeRect = targetNode.getBoundingClientRect();
            // Adjust the pointer offset for the red-cap mushroom.
            const xOffset = (id === 'page1panel20-378') ? 0.55 : 0.5;
            return {
                x: nodeRect.left + nodeRect.width * xOffset,
                y: nodeRect.top + nodeRect.height / 2
            };
        }

        return {
            x: parentRect.left + parentRect.width * coord.x / 100,
            y: parentRect.top + parentRect.height * coord.y / 100
        };
    };

    let start = getCoords(startCoord);
    let end = getCoords(endCoord);

    highlightDrag(start.x, start.y, end.x, end.y);

    // Temporarily lock page scrolling.
    const prevDocOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Block real pointer input during the capture phase so cursor movement cannot interfere with dragging.
    const blockRealEvents = (e) => {
        if (e.isTrusted) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
        }
    };
    const SHIELD_EVENTS = [
        'pointerdown', 'pointermove', 'pointerup',
        'mousedown', 'mousemove', 'mouseup',
        'click', 'touchstart', 'touchmove', 'touchend'
    ];
    SHIELD_EVENTS.forEach(type => window.addEventListener(type, blockRealEvents, true));

    // Shared event dispatcher.
    const fireEvent = (type, x, y, buttons) => {
        targetNode.dispatchEvent(new PointerEvent(`pointer${type}`, {
            bubbles: true, cancelable: true, view: window,
            clientX: x, clientY: y,
            pointerId: 1, pointerType: 'mouse', isPrimary: true,
            button: 0, buttons: buttons
        }));
        targetNode.dispatchEvent(new MouseEvent(`mouse${type}`, {
            bubbles: true, cancelable: true, view: window,
            clientX: x, clientY: y,
            button: 0, buttons: buttons
        }));
    };

    try {
        // Press down.
        fireEvent('down', start.x, start.y, 1);
        await sleep(50);

        // Recalculate the destination coordinates and move.
        end = getCoords(endCoord);
        fireEvent('move', end.x, end.y, 1);
        await sleep(100);

        // Release.
        fireEvent('up', end.x, end.y, 0);
    } finally {
        // Remove the input shield and restore scrolling.
        SHIELD_EVENTS.forEach(type => window.removeEventListener(type, blockRealEvents, true));
        document.documentElement.style.overflow = prevDocOverflow;
        document.body.style.overflow = prevBodyOverflow;
    }

    await waitForReady();
    await sleep(wait);
    checkStop();
}

// ==================== Smart Potion Helper Functions ====================

async function smartPreparePotion(recipeIds, flaskId) {
    if (getCurrentPage() !== '1') await navigateToPage('1');

    // Smart cauldron detection.
    let panel20 = document.getElementById('page1panel20');
    if (!panel20) {
        console.log("  => Entering the cauldron interface...");
        await simulateClick({page: 1, panel: 16, x: 85, y: 62, wait: 5000, skipNav: true});
    }

    // Return SKIP immediately if the corresponding potion flask already exists.
    if (flaskId && document.getElementById(flaskId)) {
        console.log(`  => [Smart check] Potion ${flaskId.slice(-1)} is already prepared; skipping this step.`);
        return 'SKIP';
    }

    // Decide whether sap needs to be scooped. If liquid 984 does not exist, the vessel is empty.
    if (!document.getElementById('page1panel20-984')) {
        console.log("  => [Smart Init] Vessel is missing sap...");

        // Use the empty spoon to scoop sap.
        let emptySpoon = document.getElementById('page1panel20-477');
        if (emptySpoon) {
            await simulateDrag({page: 1, id: 'page1panel20-477', startCoord: 'auto', endCoord: {x: 92, y: 67}, wait: 1500, skipNav: true});
        }

        // Pour the full spoon into the vessel.
        let fullSpoonId = document.getElementById('page1panel20-765') ? 'page1panel20-765' : 'page1panel20-477';
        await simulateDrag({page: 1, id: fullSpoonId, startCoord: 'auto', endCoord: {x: 47, y: 43}, wait: 3000, skipNav: true});
    }

    // Dynamic helper for collecting bugs from the bush.
    const waitAndClickBug = async (targetX, targetY) => {
        let panel6 = document.getElementById('page1panel6');
        if (!panel6) {
            console.log("  => [Helper] Clicking the bush. Please wait for the bug to crawl out...");
            await simulateClick({page: 1, panel: 7, x: 9, y: 70, wait: 2000, skipNav: true});
            await waitForElement('#page1panel6'); // Wait for panel 6 to appear.
        }
        await simulateClick({page: 1, panel: 6, x: targetX, y: targetY, wait: 2000, skipNav: true});
    };

    // Dictionary for all ingredients, collection methods, and initial center positions.
    const INGREDIENTS = {
        'page1panel20-948': { name: 'Mushroom (orange-white)', start: {x: 5.4, y: 66.85}, get: async () => { await simulateClick({page: 1, panel: 8, x: 36, y: 82, wait: 2000, skipNav: true}); } },
        'page1panel20-908': { name: 'Raspberry', start: {x: 29.4, y: 47.95}, get: async () => { await simulateClick({page: 1, panel: 4, x: 51, y: 52, wait: 2000, skipNav: true}); } },
        'page1panel20-712': { name: 'Mushroom (yellow curl)', start: {x: 20.3, y: 42.8}, get: async () => {
            await simulateClick({page: 1, panel: 7, x: 20, y: 80, wait: 2000, skipNav: true});
            await simulateClick({page: 1, panel: 7, x: 37, y: 70, wait: 2000, skipNav: true});
        } },
        'page1panel20-432': { name: 'Cricket', start: {x: 44.5, y: 66.45}, get: async () => { await waitAndClickBug(26, 77); } },
        'page1panel20-378': { name: 'Mushroom (red cap)', start: {x: 83.1, y: 72.6}, get: async () => { await simulateClick({page: 1, panel: 7, x: 80, y: 81, wait: 2000, skipNav: true}); } },
        'page1panel20-876': { name: 'Mushroom (small curl)', start: {x: 69.9, y: 62.85}, get: async () => { await waitAndClickBug(83, 84); } },
        'page1panel20-547': { name: 'Blueberry', start: {x: 24.55, y: 59.6}, get: async () => { await simulateClick({page: 1, panel: 12, x: 92, y: 12, wait: 2000, skipNav: true}); } },
        'page1panel20-602': { name: 'Bee', start: {x: 77.05, y: 35.7}, get: async () => { await simulateClick({page: 1, panel: 10, x: 65, y: 63, wait: 2000, skipNav: true}); } },
        'page1panel20-496': { name: 'Earthworm', start: {x: 5.6, y: 84.35}, get: async () => { await simulateClick({page: 1, panel: 8, x: 13, y: 82, wait: 2000, skipNav: true}); } },
    };

    // 2. Check whether required ingredients exist on screen; collect any missing ones.
    for (let id of recipeIds) {
        if (!document.getElementById(id)) {
            console.log(`  => ⚠ Missing recipe ingredient [${INGREDIENTS[id].name}], collecting automatically...`);
            await navigateToPage('1');
            await INGREDIENTS[id].get();
            console.log(`  => [${INGREDIENTS[id].name}] collected, returning to the cauldron...`);
            await navigateToPage('1');
            await simulateClick({page: 1, panel: 16, x: 85, y: 62, wait: 4000, skipNav: true});
        }
    }

    // 3. Reset the pestle so it does not block anything.
    let pestle = document.getElementById('page1panel20-271');
    if (pestle) {
        let px = (parseFloat(pestle.style.left) || 0) + (parseFloat(pestle.style.width) || 0) / 2;
        let py = (parseFloat(pestle.style.top) || 0) + (parseFloat(pestle.style.height) || 0) / 2;
        if (Math.sqrt(Math.pow(px - 62.5, 2) + Math.pow(py - 46.4, 2)) > 4) {
            console.log("  => [Smart Init] Resetting the pestle to avoid obstruction...");
            await simulateDrag({page: 1, id: 'page1panel20-271', startCoord: 'auto', endCoord: {x: 62.5, y: 46.4}, wait: 1200, skipNav: true});
        }
    }

    // Target center position for placing items in the vessel.
    const POT_CENTER = {x: 49, y: 38};

    const DOM_ORDER = [
        'page1panel20-547', // Blueberry
        'page1panel20-908', // Raspberry
        'page1panel20-602', // Bee
        'page1panel20-496', // Earthworm
        'page1panel20-432', // Cricket
        'page1panel20-876', // Small curl
        'page1panel20-378', // Red cap
        'page1panel20-712', // Yellow curl
        'page1panel20-948'  // Orange-white
    ];

    // 4. Scan all 9 ingredients and move any that are not in their target position.
    for (let id of DOM_ORDER) {
        let el = document.getElementById(id);
        if (!el) continue;

        let currentX = (parseFloat(el.style.left) || 0) + (parseFloat(el.style.width) || 0) / 2;
        let currentY = (parseFloat(el.style.top) || 0) + (parseFloat(el.style.height) || 0) / 2;

        let isRequired = recipeIds.includes(id);
        let startX = INGREDIENTS[id].start.x;
        let startY = INGREDIENTS[id].start.y;

        let distToStart = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
        let distToPot = Math.sqrt(Math.pow(currentX - POT_CENTER.x, 2) + Math.pow(currentY - POT_CENTER.y, 2));

        let isAtStart = (distToStart <= 5);
        let isAtCenter = (distToPot <= 5);

        if (isRequired) {
            if (!isAtCenter) {
                console.log(`  => [Potion] Moving required ingredient [${INGREDIENTS[id].name}] to the vessel center...`);
                await simulateDrag({page: 1, id: id, startCoord: 'auto', endCoord: POT_CENTER, wait: 1200, skipNav: true});
            }
        } else {
            if (!isAtStart) {
                console.log(`  => [Cleanup] Moving extra ingredient [${INGREDIENTS[id].name}] back to its initial position...`);
                await simulateDrag({page: 1, id: id, startCoord: 'auto', endCoord: INGREDIENTS[id].start, wait: 1200, skipNav: true});
            }
        }
    }

    // 5. Final pestle action.
    console.log("  => Start grinding the ingredients!");
    await simulateDrag({page: 1, id: 'page1panel20-271', startCoord: 'auto', endCoord: {x: 54, y: 28}, wait: 4000, skipNav: true});
}

// ==================== Full Action Table ====================

window.MANUAL = [
    // ========== Manual 1: Window And Hourglass ==========
    {name: "Window and Hourglass", page: 0, actions: [
        [0, 36, 44, 3000],
        [1, 80, 65, 5000]
    ]},

    // ========== Manual 2: Click Manifestum To Get A New Image ==========
    {name: "Click Manifestum to Get a New Image", page: 0, wait: 800, actions: [
        [14, 50, 49], [2, 46, 48], [15, 45, 34], [10, 56, 32],
        [7, 56, 33], [6, 45, 44], [20, 54, 48], [21, 57, 46],
        [22, 53, 46], [14, 52, 63, 4000]
    ]},

    // ========== Manual 3: Click Wagstaff To Get A New Image ==========
    {name: "Click Wagstaff to Get a New Image", page: 0, wait: 800, actions: [
        [24, 46, 45], [2, 26, 57], [8, 62, 46], [20, 34, 47],
        [21, 36, 47], [2, 55, 50], [7, 33, 40], [7, 33, 40, 4000]
    ]},

    // ========== Manual 4: Click The Hourglass ==========
    {name: "Click the Hourglass", page: 0, actions: [
        [1, 82, 61, 3000]
    ]},

    // ========== Manual 5: Pull Out The Note ==========
    {name: "Pull Out the Note", page: 0, actions: [
        [9, 61, 66, 2000]
    ]},

    // ========== Manual 6: Connect The Wires ==========
    {name: "Connect the Wires", page: 0, wait: 1000, actions: [
        [4, 19, 48], [4, 75, 64], [4, 46, 60], [4, 46, 60],
        [4, 75, 67], [4, 17, 52], [4, 78, 65], [4, 46, 56],
        [4, 16, 48], [4, 16, 55], [4, 43, 60, 4000]
    ]},

    // ========== Manual 7: Control Panel (Lever + Sliders + Buttons) ==========
    {name: "Control Panel (Lever + Sliders + Buttons)", page: 0, actions: [
        // Dynamic init: replace the fuse and check the switch state.
        async function() {
            if (getCurrentPage() !== '0') await navigateToPage('0');

            let panel9 = document.getElementById('page0panel9');
            if (panel9 && panel9.classList.contains('completed')) {
                console.log("  => [Smart check] The control panel is already solved; skipping this step.");
                return 'SKIP';
            }

            console.log("  => [Init] Attempting to replace the fuse...");
            await simulateClick({page: 0, panel: 9, x: 37, y: 90, wait: 1000, skipNav: true});
            await simulateClick({page: 0, panel: 9, x: 40, y: 88, wait: 1000, skipNav: true});
            await simulateClick({page: 0, panel: 9, x: 40, y: 88, wait: 1000, skipNav: true});

            console.log("  => [Init] Checking switch state...");
            let switch1 = document.getElementById('panel9switch1');
            if (switch1 && switch1.classList.contains('toggled')) {
                console.log("  => [Init] Switch is already toggled; clicking it...");
                await simulateClick({page: 0, panel: 9, x: 13, y: 60, wait: 1000, skipNav: true});
            }
        },

        // Initial click to start the lever.
        [9, 9, 42, 1000],

        // First slider group.
        {drag: 'panel9slider1', from: [56, 83], to: [54, 68], wait: 1500},
        {drag: 'panel9slider3', from: [31, 84], to: [38, 76], wait: 1500},
        {drag: 'panel9slider1', from: [50, 69], to: [54, 34], wait: 1500},
        {drag: 'panel9slider2', from: [63, 78], to: [52, 54], wait: 1500},
        {drag: 'panel9slider3', from: [41, 74], to: [44, 66], wait: 1500},

        // First button group.
        [9, 59, 35, 1000],
        [9, 62, 37, 1000],
        [9, 58, 50, 1000],

        // Second slider group.
        {drag: 'panel9slider1', from: [43, 47], to: [45, 53], wait: 1500},
        {drag: 'panel9slider3', from: [41, 63], to: [46, 55], wait: 1500},
        {drag: 'panel9slider2', from: [52, 58], to: [63, 95], wait: 1500},
        {drag: 'panel9slider1', from: [45, 60], to: [65, 95], wait: 1500},

        // Second button group.
        [9, 65, 40, 1000],

        // Third slider group.
        {drag: 'panel9slider1', from: [63, 81], to: [61, 82], wait: 1500},
        {drag: 'panel9slider3', from: [49, 55], to: [59, 40], wait: 1500},

        // Third button group.
        [9, 63, 52, 1000],

        // Fourth slider group.
        {drag: 'panel9slider1', from: [59, 75], to: [50, 32], wait: 1500},
        {drag: 'panel9slider2', from: [65, 81], to: [54, 60], wait: 1500},
        {drag: 'panel9slider3', from: [49, 45], to: [55, 27], wait: 1500},

        // Fifth slider group.
        {drag: 'panel9slider1', from: [47, 46], to: [48, 49], wait: 1500},
        {drag: 'panel9slider2', from: [50, 60], to: [52, 49], wait: 1500},
        {drag: 'panel9slider3', from: [51, 36], to: [62, 12], wait: 1500},
        {drag: 'panel9slider1', from: [52, 52], to: [54, 65], wait: 1500},

        // Final button group.
        [9, 35, 45, 1000],
        [9, 59, 50, 1000],
        [9, 80, 56, 1000],
        [9, 63, 51, 1000],

        // Final slider action.
        {drag: 'panel9slider1', from: [48, 68], to: [48, 44], wait: 1500},
        {drag: 'panel9slider2', from: [50, 55], to: [57, 60], wait: 1500},
        {drag: 'panel9slider1', from: [52, 53], to: [45, 37], wait: 1500},
        {drag: 'panel9slider3', from: [56, 26], to: [74, -12], wait: 5000}
    ]},

    // ========== Manual 8: Kick Items (5 Times) ==========
    {name: "Kick Items (5 Times)", page: 0, wait: 1000, actions: [
        [26, 80, 70], [26, 80, 70], [26, 80, 70], [26, 80, 70],
        [26, 80, 70, 4000]
    ]},

    // ========== Manual 9: New Image (Ear/Note/Tile) ==========
    {name: "New Image (Ear/Note/Tile)", page: 0, wait: 1000, actions: [
        [33, 22, 49],
        [34, 53, 72],
        [35, 56, 55, 4000]
    ]},

    // ========== Manual 10: Click Screws (4) ==========
    {name: "Click Screws (4)", page: 0, wait: 800, actions: [
        [38, 61, 94], [38, 82, 70],
        [38, 61, 74], [38, 82, 93, 4000]
    ]},

    // ========== Manual 11: Click Small Buttons (11) ==========
    {name: "Click Small Buttons (11)", page: 0, wait: 800, actions: [
        [38, 76, 78], [38, 72, 79], [38, 72, 75], [38, 69, 76],
        [38, 69, 83], [38, 76, 83], [38, 76, 91], [38, 73, 92],
        [38, 72, 88], [38, 68, 88], [38, 69, 92, 4000]
    ]},

    // ========== Manual 12: Click Items ==========
    {name: "Click Items", page: 1, wait: 1000, actions: [
        [0, 94, 83], [1, 66, 36], [1, 62, 54], [1, 78, 53]
    ]},

    // ========== Manual 13: Sap Bucket ==========
    {name: "Sap Bucket", page: 1, actions: [
        [3, 40, 77, 5000]
    ]},

    // ========== Manual 14: Take The Key ==========
    {name: "Take the Key", actions: [
        async function() {
            if (getCurrentPage() !== '0') await navigateToPage('0');

            let drawer = document.getElementById('page0panel1drawer');
            if (!drawer) {
                console.log("  => Drawer is not open; trying to click it open...");
                await simulateClick({page: 0, panel: 1, x: 80, y: 91, wait: 2000, skipNav: true});
            }

            console.log("  => Taking the key...");
            await simulateClick({page: 0, panel: '1drawer', x: 47, y: 40, wait: 1500, skipNav: true});

            console.log("  => Closing the drawer...");
            await simulateClick({page: 0, panel: 1, x: 80, y: 91, wait: 1500, skipNav: true});
        }
    ]},

    // ========== Manual 15: Take The Notes ==========
    {name: "Take the Notes", actions: [
        async function() {
            if (getCurrentPage() !== '1') await navigateToPage('1');

            let toolbox = document.getElementById('page1panel4toolbox');
            if (!toolbox) {
                console.log("  => Toolbox is not open; trying to click it open...");
                await simulateClick({page: 1, panel: 4, x: 7, y: 35, wait: 2000, skipNav: true});
            }

            // 1. Check whether the lock has already been opened by looking for the three notes inside.
            const notes = ['page1panel4toolboxhatchnote', 'page1panel4toolboxbushnote', 'page1panel4toolboxdepositslip'];
            let hasNotes = notes.some(id => document.getElementById(id) !== null);

            if (hasNotes) {
                console.log("  => [Smart Check] Notes found inside the lock, so the key has already opened it. Dragging notes out directly...");
                for (let noteId of notes) {
                    if (document.getElementById(noteId)) {
                        console.log(`  => 📄 Dragging note ${noteId} out...`);
                        await simulateDrag({ page: 1, id: noteId, startCoord: 'auto', endCoord: {x: 94, y: 40}, wait: 1500, skipNav: true });
                    }
                }
                console.log("  => ✅ Operation finished; closing the toolbox directly.");
                await simulateClick({page: 1, panel: 4, x: 7, y: 35, wait: 1000, skipNav: true});
                return; // Finish early.
            }

            // 2. If no notes were found, check the toolbox panel and key state.
            let panel = document.getElementById('page1panel4toolboxpanel');
            if (panel) {
                let key = document.getElementById('page1panel4toolboxkey');
                if (!key) {
                    console.log("  => ⚠ Key is missing. Running automatic recovery: go back and take the key...");
                    await navigateToPage('0');

                    let drawer = document.getElementById('page0panel1drawer');
                    if (!drawer) {
                        await simulateClick({page: 0, panel: 1, x: 80, y: 91, wait: 2000, skipNav: true});
                    }
                    await simulateClick({page: 0, panel: '1drawer', x: 47, y: 40, wait: 1500, skipNav: true});
                    await simulateClick({page: 0, panel: 1, x: 80, y: 91, wait: 1500, skipNav: true});

                    await navigateToPage('1');
                    await simulateClick({page: 1, panel: 4, x: 7, y: 35, wait: 2000, skipNav: true});
                }

                key = document.getElementById('page1panel4toolboxkey');
                if (key) {
                    let hammer = document.getElementById('page1panel4toolboxhammer');
                    if (hammer) {
                        console.log("  => Moving the hammer away...");
                        await simulateDrag({ page: 1, id: 'page1panel4toolboxhammer', startCoord: 'auto', endCoord: {x: 62, y: 54}, wait: 1500, skipNav: true });
                    }
                    console.log("  => Moving the wooden board away...");
                    await simulateDrag({ page: 1, id: 'page1panel4toolboxpanel', startCoord: 'auto', endCoord: {x: 13, y: 73}, wait: 1500, skipNav: true });

                    console.log("  => 🔑 Key position detected; dragging it to unlock...");
                    await simulateDrag({ page: 1, id: 'page1panel4toolboxkey', startCoord: 'auto', endCoord: {x: 33, y: 74}, wait: 2000, skipNav: true });

                    for (let noteId of notes) {
                        if (document.getElementById(noteId)) {
                            console.log(`  => 📄 Dragging note ${noteId} out...`);
                            await simulateDrag({ page: 1, id: noteId, startCoord: 'auto', endCoord: {x: 94, y: 40}, wait: 1500, skipNav: true });
                        }
                    }

                    console.log("  => ✅ Operation finished; closing the toolbox directly.");
                    await simulateClick({page: 1, panel: 4, x: 7, y: 35, wait: 1000, skipNav: true});
                }
            } else {
                console.log("  => ✅ Toolbox is already empty; closing it directly.");
                await simulateClick({page: 1, panel: 4, x: 7, y: 35, wait: 1000, skipNav: true});
            }
        }
    ]},

    // ========== Manual 16: Berry Bush ==========
    {name: "Berry Bush", page: 1, wait: 1000, actions: [
        [11, 69, 57], [11, 77, 76], [11, 94, 76], [11, 86, 56], [11, 55, 76]
    ]},

    // ========== Manual 17: Click The Bush To Find The Cricket ==========
    {name: "Click the Bush to Find the Cricket", actions: [
        async function() {
            if (getCurrentPage() !== '1') await navigateToPage('1');

            let panel6 = document.getElementById('page1panel6');
            if (!panel6) {
                console.log("  => Clicking the bush. Please wait for the bug to appear...");
                await simulateClick({page: 1, panel: 7, x: 9, y: 70, wait: 5000, skipNav: true});
            }
        }
    ]},

    // ========== Manual 18: Cricket And Mushrooms ==========
    {name: "Cricket and Mushrooms", actions: [
        async function() {
            if (getCurrentPage() !== '1') await navigateToPage('1');

            let panel6 = document.getElementById('page1panel6');
            if (!panel6) {
                console.log("  => [Collection Helper] Bug did not appear; trying to click the bush...");
                await simulateClick({page: 1, panel: 7, x: 9, y: 70, wait: 2000, skipNav: true});
                await waitForElement('#page1panel6');
            }
            await simulateClick({page: 1, panel: 6, x: 26, y: 77, wait: 800, skipNav: true});
            await simulateClick({page: 1, panel: 6, x: 83, y: 84, wait: 800, skipNav: true});
        }
    ]},

    // ========== Manual 19: Collect Various Ingredients ==========
    {name: "Collect Various Ingredients", page: 1, wait: 1000, actions: [
        [4, 51, 52], [5, 7, 16], [5, 37, 89], [7, 20, 80],
        [7, 37, 70], [7, 80, 81], [8, 13, 82], [8, 36, 82],
        [10, 32, 85], [10, 65, 63], [12, 92, 12, 4000]
    ]},

    // ========== Manual 20: Open The Manhole Cover And Enter ==========
    {name: "Open the Manhole Cover and Enter", page: 1, wait: 800, actions: [
        [12, 63, 70], [12, 63, 70], [12, 58, 81], [12, 63, 70],
        [12, 70, 81], [12, 58, 78], [12, 58, 78], [12, 63, 70],
        [12, 71, 79, 4000],
        [13, 42, 70, 2000]
    ]},

    // ========== Manual 21: Potion Recipe One ==========
    {name: "Potion Recipe One", actions: [
        async function() {
            return await smartPreparePotion(['page1panel20-948', 'page1panel20-908', 'page1panel20-712', 'page1panel20-432'], 'page1panel20-flask1');
        }
    ]},

    // ========== Manual 22: Potion Recipe Two ==========
    {name: "Potion Recipe Two", actions: [
        async function() {
            return await smartPreparePotion(['page1panel20-378', 'page1panel20-908', 'page1panel20-712', 'page1panel20-432'], 'page1panel20-flask2');
        }
    ]},

    // ========== Manual 23: Potion Recipe Three ==========
    {name: "Potion Recipe Three", actions: [
        async function() {
            return await smartPreparePotion(['page1panel20-876', 'page1panel20-908', 'page1panel20-712', 'page1panel20-432'], 'page1panel20-flask3');
        }
    ]},

    // ========== Manual 24: Potion Recipe Four ==========
    {name: "Potion Recipe Four", actions: [
        async function() {
            return await smartPreparePotion(['page1panel20-876', 'page1panel20-547', 'page1panel20-712', 'page1panel20-602', 'page1panel20-948'], 'page1panel20-flask4');
        }
    ]},

    // ========== Manual 25: Potion Recipe Five ==========
    {name: "Potion Recipe Five", actions: [
        async function() {
            return await smartPreparePotion(['page1panel20-908', 'page1panel20-432', 'page1panel20-547', 'page1panel20-496'], 'page1panel20-flask5');
        }
    ]},

    // ========== Manual 26: Open The Music Door ==========
    {name: "Open the Music Door", page: 1, wait: 1500, actions: [
        // Initialize dynamically: align the gold and silver rings.
        async function() {
            if (getCurrentPage() !== '1') await navigateToPage('1');

            let screwdriver = document.getElementById('page1panel16screwdriver');
            if (screwdriver) {
                console.log("  => [Smart check] Phase one of the music door is already solved; skipping this step.");
                return 'SKIP';
            }

            let panel17 = document.getElementById('page1panel17');
            if (!panel17) {
                console.log("  => Opening the music clock...");
                await simulateClick({page: 1, panel: 16, x: 17, y: 50, wait: 2000, skipNav: true});
            }

            let handle = document.getElementById('page1panel17handle');
            if (handle && handle.classList.contains('down')) {
                console.log("  => Raising the lever...");
                await simulateClick({page: 1, panel: 17, x: 92, y: 20, wait: 1000, skipNav: true});
            }

            // === Core: alignment state machine (target 65.44%) ===
            console.log("  => Initializing the gold and silver ring positions...");
            const tMin = 65.2;
            const tMax = 65.6;
            let maxMoves = 50;

            while (maxMoves > 0) {
                checkStop();
                let tick = document.getElementById('page1panel17tick');
                let marker = document.getElementById('page1panel17marker');
                if (!tick || !marker) break;

                let sTop = parseFloat(tick.style.top);
                let gTop = parseFloat(marker.style.top);
                if (isNaN(sTop)) break;

                let isGoldReset = isNaN(gTop) || gTop >= 69.0;
                let isSilverReady = sTop >= tMin && sTop <= tMax;

                if (isGoldReset && isSilverReady) {
                    console.log(`  => ✅ Ready! (Silver ring: ${sTop}%, gold ring: reset)`);
                    break;
                }

                if (!isGoldReset) {
                    if (sTop < tMin) {
                        console.log(`  => Silver ring position: ${sTop}%; adjusting downward...`);
                        await simulateClick({page: 1, panel: 17, x: 90, y: 71, wait: 1000, skipNav: true});
                    } else if (sTop > tMax) {
                        console.log(`  => Gold ring position: ${gTop}%; adjusting upward...`);
                        await simulateClick({page: 1, panel: 17, x: 67, y: 90, wait: 800, skipNav: true});
                    } else {
                        console.log(`  => Gold ring position: ${gTop}%; adjusting upward...`);
                        await simulateClick({page: 1, panel: 17, x: 67, y: 90, wait: 800, skipNav: true});
                    }
                } else {
                    if (sTop > tMax) {
                        console.log(`  => Silver ring position: ${sTop}%; adjusting upward...`);
                        await simulateClick({page: 1, panel: 17, x: 90, y: 57, wait: 1000, skipNav: true});
                    } else if (sTop < tMin) {
                        console.log(`  => Silver ring position: ${sTop}%; adjusting downward...`);
                        await simulateClick({page: 1, panel: 17, x: 90, y: 71, wait: 1000, skipNav: true});
                    }
                }
                maxMoves--;
            }
        },

        // Expand the 24 clicks for the music clock.
        [17, 54, 74], [17, 91, 21], [17, 68, 61], [17, 67, 90],
        [17, 92, 47], [17, 68, 61], [17, 92, 19], [17, 66, 42],
        [17, 67, 90], [17, 92, 47], [17, 59, 35], [17, 92, 19],
        [17, 39, 35], [17, 68, 91], [17, 92, 47], [17, 58, 35],
        [17, 92, 20], [17, 39, 35], [17, 67, 91], [17, 92, 46],
        [17, 44, 74], [17, 68, 61], [17, 58, 35], [17, 68, 90]
    ]},

    // ========== Manual 27: Click Vestigo To Reveal The Dirt Pit ==========
    {name: "Click Vestigo to Reveal the Dirt Pit", page: 1, wait: 1000, actions: [
        [0, 56, 77], [0, 35, 57], [0, 45, 76], [0, 43, 56],
        [0, 64, 77], [0, 25, 77], [0, 27, 58, 4000]
    ]},

    // ========== Manual 28: Focus The Goggles ==========
    {name: "Focus the Goggles", page: 4, actions: [
        [0, 26, 28, 5000],
        {drag: 'page4panel1dial1', from: [27, 9], to: [24, 10], wait: 1500},
        {drag: 'page4panel1dial2', from: [36, 76], to: [31, 79], wait: 1500},
        {drag: 'page4panel1dial3', from: [71, 10], to: [78, 11], wait: 1500},
        {drag: 'page4panel1dial4', from: [70, 83], to: [78, 81], wait: 3000}
    ]},

    // ========== Manual 29: Find Parts (5) ==========
    {name: "Find Parts (5)", page: 4, wait: 1000, actions: [
        [2, 16, 18], [3, 33, 66], [3, 71, 47], [3, 40, 75], [3, 86, 47],
        [2, 33, 34], [3, 30, 75], [3, 24, 48], [2, 27, 41], [3, 40, 82],
        [3, 63, 48], [2, 42, 63], [3, 50, 96], [3, 20, 51]
    ]},

    // ========== Manual 30: Get The Gramophone ==========
    {name: "Get the Gramophone", page: 2, wait: 3000, actions: [
        [0, 5, 49],
        [1, 78, 43]
    ]},

    // ========== Manual 31: Adjust The Laser Lenses ==========
    {name: "Adjust the Laser Lenses", page: 5, wait: 1000, actions: [
        // Dynamic init: open the filter window, remove interfering beams, then move the control bar down to the bottom.
        async function() {
            if (getCurrentPage() !== '5') await navigateToPage('5');

            let panel1 = document.getElementById('page5panel1');
            if (!panel1) {
                console.log("  => [Init] Filter window is not open; trying to click it open...");
                await simulateClick({page: 5, panel: 0, x: 82, y: 61, wait: 4000, skipNav: true});
            }

            // Only check for unclosed boxes during initialization.
            if (document.getElementById('page5panel1openbox')) {
                console.log("  => [Init] Unclosed box found; performing one reset...");
                await simulateClick({page: 5, panel: 1, x: 0, y: 0, wait: 1000, skipNav: true, skipCheck: true});
            }

            console.log("  => [Init] 1. Clearing all filters...");
            await simulateClick({page: 5, panel: 1, x: 11, y: 73, wait: 1500, skipNav: true});

            console.log("  => [Init] 2. Checking slider position...");
            let indicator = document.getElementById('page5panel1slotindicator');
            let maxMoves = 30;
            while (indicator && !indicator.style.top.includes('77') && maxMoves > 0) {
                checkStop();
                console.log(`  => Current slider position: ${indicator.style.top}; moving further down...`);
                await simulateClick({page: 5, panel: 1, x: 91, y: 90, wait: 1000, skipNav: true});
                maxMoves--;
            }
            if (maxMoves === 0) {
                console.warn("  => [Warning] Slider movement seems to have reached its limit or the target position was not found; continuing.");
            }

            console.log("  => [Init] 3. Checking for existing beams...");
            const beams = [
                { id: 'page5panel1lbeam', x: 36, y: 94 },
                { id: 'page5panel1mbeam', x: 46, y: 94 },
                { id: 'page5panel1hbeam', x: 56, y: 94 },
                { id: 'page5panel1abeam', x: 66, y: 94 }
            ];
            for (let beam of beams) {
                if (document.getElementById(beam.id)) {
                    console.log(`  => Found existing ${beam.id}; clearing it...`);
                    await simulateClick({page: 5, panel: 1, x: beam.x, y: beam.y, wait: 1500, skipNav: true});
                }
            }
            console.log("  => [Init Complete] Starting the main lens adjustment sequence.");
        },

        // Main lens adjustment sequence.
        ...(function() {
            return [
                [1, 35, 93], [1, 92, 54], [1, 49, 42], [1, 16, 88],
                [1, 79, 89], [1, 92, 54], [1, 48, 17], [1, 35, 93],
                [1, 45, 93], [1, 55, 93], [1, 6, 86], [1, 91, 55],
                [1, 49, 42], [1, 15, 89], [1, 79, 90], [1, 92, 54],
                [1, 48, 27], [1, 15, 89], [1, 79, 89], [1, 92, 54],
                [1, 48, 27], [1, 35, 94], [1, 11, 73], [1, 91, 90],
                [1, 91, 90], [1, 91, 90], [1, 92, 55], [1, 48, 78],
                [1, 14, 89], [1, 78, 89], [1, 92, 54], [1, 49, 57],
                [1, 15, 89], [1, 79, 89], [1, 92, 55], [1, 49, 57],
                [1, 14, 90], [1, 79, 89], [1, 92, 54], [1, 48, 57],
                [1, 11, 73], [1, 91, 90], [1, 91, 90], [1, 91, 90],
                [1, 35, 93], [1, 45, 94], [1, 92, 54], [1, 49, 47],
                [1, 11, 73], [1, 35, 94], [1, 46, 93], [1, 91, 54],
                [1, 81, 22], [1, 14, 90], [1, 79, 89], [1, 91, 54],
                [1, 80, 22], [1, 15, 90],
                ...Array.from({ length: 13 }, () => [1, 79, 89]),
                [1, 91, 54], [1, 80, 78], [1, 11, 73],
                ...Array.from({ length: 9 }, () => [1, 90, 89]),
                [1, 91, 54], [1, 49, 18], [1, 14, 90], [1, 91, 89],
                [1, 92, 54], [1, 47, 42], [1, 14, 89], [1, 91, 89],
                [1, 92, 54], [1, 48, 42], [1, 11, 73], [1, 66, 93],
                [1, 91, 89], [1, 91, 89], [1, 91, 54], [1, 80, 17],
                [1, 14, 90], [1, 91, 89], [1, 92, 54], [1, 49, 17],
                [1, 14, 90],
                ...Array.from({ length: 3 }, () => [1, 79, 89]),
                ...Array.from({ length: 3 }).flatMap(() => [
                    [1, 79, 89], [1, 91, 54], [1, 48, 42], [1, 14, 90]
                ]),
                [1, 11, 73], [1, 91, 89], [1, 91, 89], [1, 91, 89],
                [1, 91, 54], [1, 81, 44], [1, 14, 90], [1, 90, 89],
                [1, 90, 89], [1, 91, 54], [1, 80, 22], [1, 14, 89],
                [1, 91, 89], [1, 91, 54], [1, 81, 45], [1, 14, 89],
                [1, 79, 90], [1, 79, 90], [1, 79, 90], [1, 5, 86],
                [1, 79, 89], [1, 92, 54], [1, 81, 22], [1, 14, 90],
                [1, 79, 89], [1, 91, 54], [1, 48, 22], [1, 11, 73],
                [1, 91, 90], [1, 91, 90], [1, 91, 90], [1, 91, 54],
                [1, 48, 57], [1, 14, 89], [1, 91, 90], [1, 92, 54],
                [1, 48, 57], [1, 66, 93], [1, 66, 93], [1, 14, 90],
                [1, 79, 89], [1, 79, 89], [1, 92, 54], [1, 48, 42],
                [1, 5, 86], [1, 35, 94], [1, 66, 94], [1, 91, 54],
                [1, 48, 57], [1, 14, 90], [1, 91, 89], [1, 91, 89],
                [1, 91, 89], [1, 91, 54], [1, 48, 78], [1, 35, 93],
                [1, 11, 73], [1, 66, 93], [1, 79, 89], [1, 92, 54],
                [1, 80, 22], [1, 14, 90], [1, 79, 89], [1, 91, 54],
                [1, 82, 31], [1, 15, 89], [1, 79, 89], [1, 92, 54],
                [1, 81, 45], [1, 15, 89], [1, 79, 89], [1, 79, 89],
                [1, 91, 54], [1, 48, 57], [1, 14, 90], [1, 79, 89],
                [1, 91, 54], [1, 49, 57]
            ];
        })()
    ]},

    // ========== Manual 32: Get The Lens ==========
    {name: "Get the Lens", page: 4, actions: [
        {drag: 'page4panel1dial5', from: [9, 60], to: [12, 70], wait: 3000}
    ]},

    // ========== Manual 33: Find Petals (17) ==========
    {name: "Find Petals (17)", page: 4, wait: 1500, actions: [
        {drag: 'page5panel3monocle', from: 'auto', to: [87.5, 69.7]},
        [2, 56, 61], [3, 40, 82],
        {drag: 'page5panel3monocle', from: [87, 69], to: [87, 56]},
        [3, 85, 54], [2, 77, 45], [3, 32, 85],
        {drag: 'page5panel3monocle', from: [89, 54], to: [37, 46]},
        [3, 37, 46], [3, 48, 70], [3, 37, 49], [2, 87, 47], [3, 42, 95],
        {drag: 'page5panel3monocle', from: [36, 48], to: [20, 48]},
        [3, 16, 44], [2, 21, 42],
        {drag: 'page5panel3monocle', from: [21, 48], to: [74, 46]},
        [3, 73, 44], [2, 78, 32], [3, 48, 79],
        {drag: 'page5panel3monocle', from: [75, 47], to: [82, 56]},
        [3, 80, 55], [2, 19, 30], [3, 33, 66],
        {drag: 'page5panel3monocle', from: [83, 54], to: [60, 46]},
        [3, 58, 45], [2, 71, 15], [3, 27, 72],
        {drag: 'page5panel3monocle', from: [59, 47], to: [77, 47]},
        [3, 75, 48], [2, 38, 58], [3, 50, 89],
        {drag: 'page5panel3monocle', from: [76, 47], to: [45, 55]},
        [3, 45, 54], [2, 37, 31], [3, 45, 96], [3, 42, 50], [2, 82, 38], [3, 43, 79],
        {drag: 'page5panel3monocle', from: [45, 54], to: [54, 57]},
        [3, 54, 57], [2, 78, 63], [3, 29, 85],
        {drag: 'page5panel3monocle', from: [54, 56], to: [21, 48]},
        [3, 21, 48], [2, 71, 51], [3, 27, 91],
        {drag: 'page5panel3monocle', from: [21, 50], to: [64, 57]},
        [3, 62, 55], [2, 19, 77], [3, 45, 76],
        {drag: 'page5panel3monocle', from: [64, 54], to: [18, 48]},
        [3, 18, 48], [2, 81, 11], [3, 32, 92], [3, 16, 46], [2, 65, 85], [3, 50, 96],
        {drag: 'page5panel3monocle', from: [17, 48], to: [76, 53]},
        [3, 76, 53], [2, 89, 55], [3, 30, 66],
        {drag: 'page5panel3monocle', from: [77, 52], to: [36, 47]},
        [3, 36, 47]
    ]},

    // ========== Manual 34: Find Remaining Parts (35) ==========
    {name: "Find Remaining Parts (35)", page: 4, wait: 1000, actions: [
        {drag: 'page5panel3monocle', from: 'auto', to: [87.5, 69.7], wait: 1500},
        [2, 76, 71], [3, 29, 85], [3, 63, 40], [2, 63, 52], [3, 40, 66], [3, 87, 44],
        [2, 27, 77], [3, 45, 79], [3, 90, 43], [2, 42, 64], [3, 40, 82], [3, 69, 53],
        [2, 57, 47], [3, 75, 51], [2, 57, 80], [3, 29, 92], [3, 92, 45], [2, 41, 85],
        [3, 27, 89], [3, 20, 52], [2, 53, 47], [3, 15, 48], [2, 35, 82], [3, 43, 83],
        [3, 64, 55], [2, 74, 78], [3, 46, 70], [3, 8, 47], [2, 88, 71], [3, 51, 76],
        [3, 70, 45], [2, 66, 70], [3, 45, 83], [3, 11, 47], [3, 42, 96], [3, 76, 49],
        [2, 66, 16], [3, 41, 54], [2, 77, 51], [3, 50, 80], [3, 25, 50], [2, 52, 68],
        [3, 47, 96], [3, 49, 51], [2, 52, 17], [3, 86, 50], [2, 28, 68], [3, 40, 89],
        [3, 69, 46], [2, 48, 63], [3, 32, 72], [3, 16, 51], [2, 61, 43], [3, 74, 48],
        [2, 83, 59], [3, 38, 69], [3, 87, 53], [2, 73, 57], [3, 37, 83], [3, 16, 50],
        [2, 38, 61], [3, 37, 95], [3, 67, 48], [2, 30, 58], [3, 43, 76], [3, 70, 57],
        [2, 16, 54], [3, 35, 76], [3, 8, 47], [2, 26, 50], [3, 27, 65], [3, 61, 44],
        [2, 49, 42], [3, 35, 79], [3, 28, 49], [2, 84, 32], [3, 45, 76], [3, 67, 46],
        [2, 70, 33], [3, 48, 83], [3, 28, 49], [2, 47, 33], [3, 51, 73], [3, 42, 49],
        [2, 36, 22], [3, 80, 50], [3, 32, 85], [3, 10, 50], [2, 27, 35], [3, 40, 92],
        [3, 59, 49], [2, 82, 23], [3, 29, 88], [3, 40, 50], [2, 58, 26], [3, 48, 86],
        [3, 27, 46]
    ]},

    // ========== Manual 35: Tuning Fork Puzzle ==========
    {name: "Tuning Fork Puzzle", page: 0, wait: 1000, actions: [
        [27, 22, 33], [27, 29, 34], [27, 29, 34], [27, 22, 33],
        [27, 22, 33], [27, 29, 34], [27, 22, 33], [27, 22, 33],
        [27, 22, 33], [27, 29, 34], [27, 29, 34], [27, 22, 33],
        [27, 22, 33], [27, 29, 34], [27, 29, 34], [27, 29, 34],
        [27, 22, 33]
    ]},

    // ========== Manual 36: Music Door, Phase Two ==========
    {name: "Music Door, Phase Two", page: 1, wait: 1000, actions: [
        // Initialize dynamically: align the gold and silver rings.
        async function() {
            if (getCurrentPage() !== '1') await navigateToPage('1');

            let screwdriver = document.getElementById('page1panel16screwdriver');
            if (!screwdriver) {
                console.error("❌ [Blocked] Phase one of the music door has not been solved yet!");
                console.error("💡 Use jumpTo(26) to complete phase one first.");
                return 'SKIP';
            }

            let robot = document.getElementById('page1panel16robot');
            if (robot) {
                console.log("  => [Smart check] Phase two of the music door is already solved; skipping this step.");
                return 'SKIP';
            }

            let panel17 = document.getElementById('page1panel17');
            if (!panel17) {
                console.log("  => Opening the music clock...");
                await simulateClick({page: 1, panel: 16, x: 17, y: 50, wait: 2000, skipNav: true});
            }

            let handle = document.getElementById('page1panel17handle');
            if (handle && handle.classList.contains('down')) {
                console.log("  => Raising the lever...");
                await simulateClick({page: 1, panel: 17, x: 92, y: 20, wait: 1000, skipNav: true});
            }

            // Alignment state machine (target 57.28%).
            console.log("  => Initializing the gold and silver ring positions...");
            const tMin = 57.1;
            const tMax = 57.5;
            let maxMoves = 50;

            while (maxMoves > 0) {
                checkStop();
                let tick = document.getElementById('page1panel17tick');
                let marker = document.getElementById('page1panel17marker');
                if (!tick || !marker) break;

                let sTop = parseFloat(tick.style.top);
                let gTop = parseFloat(marker.style.top);
                if (isNaN(sTop)) break;

                let isGoldReset = isNaN(gTop) || gTop >= 69.0;
                let isSilverReady = sTop >= tMin && sTop <= tMax;

                if (isGoldReset && isSilverReady) {
                    console.log(`  => ✅ Ready! (Silver ring: ${sTop}%, gold ring: reset)`);
                    break;
                }

                if (!isGoldReset) {
                    if (sTop < tMin) {
                        console.log(`  => Silver ring position: ${sTop}%; adjusting downward...`);
                        await simulateClick({page: 1, panel: 17, x: 90, y: 71, wait: 1000, skipNav: true});
                    } else if (sTop > tMax) {
                        console.log(`  => Gold ring position: ${gTop}%; adjusting upward...`);
                        await simulateClick({page: 1, panel: 17, x: 67, y: 90, wait: 800, skipNav: true});
                    } else {
                        console.log(`  => Gold ring position: ${gTop}%; adjusting upward...`);
                        await simulateClick({page: 1, panel: 17, x: 67, y: 90, wait: 800, skipNav: true});
                    }
                } else {
                    if (sTop > tMax) {
                        console.log(`  => Silver ring position: ${sTop}%; adjusting upward...`);
                        await simulateClick({page: 1, panel: 17, x: 90, y: 57, wait: 1000, skipNav: true});
                    } else if (sTop < tMin) {
                        console.log(`  => Silver ring position: ${sTop}%; adjusting downward...`);
                        await simulateClick({page: 1, panel: 17, x: 90, y: 71, wait: 1000, skipNav: true});
                    }
                }
                maxMoves--;
            }
        },

        // Expand the 51 clicks for phase two of the music clock.
        [17, 31, 42], [17, 92, 20], [17, 63, 69], [17, 67, 90],
        [17, 68, 61], [17, 67, 91], [17, 92, 47], [17, 54, 74],
        [17, 92, 20], [17, 62, 69], [17, 67, 91], [17, 59, 36],
        [17, 67, 90], [17, 92, 46], [17, 62, 70], [17, 91, 20],
        [17, 49, 33], [17, 67, 90], [17, 32, 42], [17, 92, 47],
        [17, 67, 90], [17, 29, 61], [17, 67, 91], [17, 92, 20],
        [17, 35, 69], [17, 67, 90], [17, 54, 74], [17, 67, 90],
        [17, 35, 70], [17, 67, 91], [17, 54, 74], [17, 92, 46],
        [17, 31, 42], [17, 67, 90], [17, 92, 20], [17, 62, 69],
        [17, 92, 47], [17, 54, 74], [17, 67, 90], [17, 63, 69],
        [17, 92, 20], [17, 68, 61], [17, 67, 90], [17, 92, 46],
        [17, 68, 61], [17, 92, 20], [17, 62, 69], [17, 67, 90],
        [17, 92, 46], [17, 49, 33], [17, 67, 90]
    ]},

    // ========== Manual 37: New Images (Before Robot Assembly) ==========
    {name: "New Images (Before Robot Assembly)", page: 3, wait: 1500, actions: [
        [0, 8, 46], [0, 83, 50], [4, 8, 45], [5, 67, 35],
        [6, 70, 29], [7, 66, 36], [8, 94, 77], [9, 95, 79],
        [14, 96, 68], [14, 89, 38], [17, 50, 83], [18, 40, 50],
        [19, 85, 78], [20, 47, 59], [21, 50, 54], [22, 29, 54],
        [23, 82, 56], [25, 31, 79], [25, 67, 89], [28, 51, 89],
        [28, 83, 79], [33, 62, 49], [36, 50, 53], [39, 79, 41],
        [41, 83, 59], [45, 76, 89], [46, 53, 30], [47, 36, 65]
    ]},

    // ========== Manual 38: Find Robot Parts (12 Parts) ==========
    {name: "Find Robot Parts (12 Parts)", page: 3, wait: 1000, actions: [
        async function() {
            if (getCurrentPage() !== '3') await navigateToPage('3');

            // Initialize the robot form if needed.
            let staticPanel = document.getElementById('page3panel27static');
            if (staticPanel && staticPanel.style.display !== 'none' && staticPanel.classList.contains('not-visible')) {
                console.log("  => [Smart initialization] Switching to the robot form...");
                await simulateClick({page: 3, panel: 27, x: 26, y: 70, wait: 1500, skipNav: true});
            }
        },
        [14, 12, 56], [18, 32, 60], [14, 79, 65], [19, 22, 46],
        [20, 75, 53], [27, 50, 32], [32, 16, 96], [39, 53, 38],
        [45, 39, 44], [44, 39, 31], [45, 53, 84], [46, 33, 15]
    ]},

    // ========== Manual 39: Assemble the Robot ==========
    {name: "Assemble the Robot", page: 3, actions: [
        async function() {
            if (getCurrentPage() !== '3') await navigateToPage('3');

            // Identify the completed image (short hash 12B6F).
            const isRobotCompleted = () => {
                const bg = document.querySelector('#page3panel49 .panel-background');
                return bg && bg.style.backgroundImage && bg.style.backgroundImage.includes('12B6F');
            };

            if (isRobotCompleted()) {
                console.log("  => [Smart check] The robot is already assembled; skipping this step.");
                return 'SKIP';
            }

            // Initialize the robot form if needed.
            let staticPanel = document.getElementById('page3panel27static');
            if (staticPanel && staticPanel.style.display !== 'none' && staticPanel.classList.contains('not-visible')) {
                console.log("  => [Smart initialization] Switching to the robot form...");
                await simulateClick({page: 3, panel: 27, x: 26, y: 70, wait: 1500, skipNav: true});
            }

            // Configuration for all 12 parts, including assembly destinations and pickup coordinates for missing parts.
            const robotParts = [
                { id: 'robotpart638', name: "Ears", target: { x: 36, y: 32 }, fetch: { panel: 20, x: 75, y: 53 } },
                { id: 'robotpart182', name: "Belly", target: { x: 48, y: 57 }, fetch: { panel: 45, x: 53, y: 84 } },
                { id: 'robotpart728', name: "Eyes", target: { x: 55, y: 31 }, fetch: { panel: 44, x: 39, y: 31 } },
                { id: 'robotpart823', name: "Internal parts", target: { x: 51, y: 51 }, fetch: { panel: 19, x: 22, y: 46 } },
                { id: 'robotpart423', name: "Face",   target: { x: 49, y: 32 }, fetch: { panel: 32, x: 16, y: 96 } },
                { id: 'robotpart719', name: "Chest",   target: { x: 48, y: 46 }, fetch: { panel: 45, x: 39, y: 44 } },
                { id: 'robotpart631', name: "Left shoulder", target: { x: 58, y: 50 }, fetch: { panel: 18, x: 32, y: 60 } },
                { id: 'robotpart265', name: "Top of head", target: { x: 49, y: 21 }, fetch: { panel: 14, x: 79, y: 65 } },
                { id: 'robotpart472', name: "Feet",   target: { x: 39, y: 74 }, fetch: { panel: 14, x: 12, y: 56 } },
                { id: 'robotpart904', name: "Right shoulder", target: { x: 37, y: 49 }, fetch: { panel: 39, x: 53, y: 38 } },
                { id: 'robotpart542', name: "Hands", target: { x: 33, y: 64 }, fetch: { panel: 27, x: 50, y: 32 } },
                { id: 'robotpart346', name: "Pelvis", target: { x: 48, y: 60 }, fetch: { panel: 46, x: 33, y: 15 } }
            ];

            const isInstalled = (id) => document.getElementById(`${id}installed`) !== null;
            const isAvailable = (id) => document.getElementById(id) !== null;

            // Navigate to collect any missing parts automatically.
            for (let part of robotParts) {
                checkStop();
                if (!isInstalled(part.id) && !isAvailable(part.id)) {
                    console.log(`  => ⚠ Missing part [${part.name}](${part.id}); navigating to collect it...`);
                    await simulateClick({
                        page: 3,
                        panel: part.fetch.panel,
                        x: part.fetch.x,
                        y: part.fetch.y,
                        wait: 1500,
                        skipNav: true
                    });
                }
            }

            // Assembly state machine (up to three attempts).
            const maxAttempts = 3;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                checkStop();
                if (isRobotCompleted()) break;
                if (attempt > 1) {
                    console.warn(`  => ⚠ Incorrect assembly order; starting ordered rebuild attempt ${attempt}...`);
                }

                for (let part of robotParts) {
                    checkStop();
                    if (isRobotCompleted()) break;

                    // Skip dragging parts that are already installed.
                    if (isInstalled(part.id)) {
                        console.log(`  => [Skip] Part [${part.name}] is already installed.`);
                        continue;
                    }

                    let el = document.getElementById(part.id);
                    if (el && el.offsetParent !== null) {
                        console.log(`  => Automatically assembling [${part.name}]: ${part.id}`);
                        await simulateDrag({
                            page: 3,
                            id: part.id,
                            startCoord: 'auto',
                            endCoord: part.target,
                            wait: 1500,
                            skipNav: true
                        });
                    } else {
                        console.warn(`  => [Warning] Part [${part.name}](${part.id}) was not found on the assembly table.`);
                    }
                }
                await sleep(1000);
                checkStop();
                if (isRobotCompleted()) break;
            }

            // Check whether assembly is complete.
            if (isRobotCompleted()) {console.log("  => ✅ All 12 robot parts are assembled!")};
        }
    ]},

    // ========== Manual 40: New Images (After Robot Assembly) ==========
    {name: "New Images (After Robot Assembly)", page: 3, wait: 1000, actions: [
        [48, 61, 27], [50, 43, 55], [54, 52, 38], [55, 47, 46],
        [56, 32, 32], [59, 64, 35], [60, 29, 40], [61, 68, 34],
        [62, 65, 45], [63, 68, 81], [64, 49, 39], [65, 56, 61],
        [66, 55, 8],  [67, 82, 71], [69, 49, 45], [70, 27, 35],
        [71, 4, 64],  [71, 16, 58], [71, 22, 88], [71, 53, 84],
        [71, 71, 84], [71, 72, 52], [72, 44, 49], [73, 46, 39],
        [74, 38, 33], [75, 50, 58], [76, 40, 69], [77, 38, 69],
        [78, 20, 58], [79, 28, 65], [79, 59, 22], [80, 66, 22],
        [82, 40, 53], [84, 53, 57], [87, 4, 62],  [89, 77, 88],
        [90, 77, 29], [91, 48, 20], [92, 13, 34], [94, 54, 44],
        [95, 49, 17], [97, 73, 47], [98, 53, 31], [99, 38, 30]
    ]},

    // ========== Manual 41: Memory Module Puzzle ==========
    {name: "Memory Module Puzzle", actions: [
        async function() {
            if (getCurrentPage() !== '3') await navigateToPage('3');

            // Priority map keyed by five-character hashes.
            const priorityMap = [
                "249DD", "9F116", "0AD11", "67F2F", "98A6F", "3DD05", "637DC", "12284",
                "7095D", "D7B5C", "C62A1", "BDC0A", "34816", "74B03", "3CF32", "D54C2",
                "5F913", "9B2AD", "70177", "E4CF7", "B55AF", "BB12A", "4A631", "99D65",
                "BAEED", "B5543", "1650D", "57435", "FA3F1", "937BC", "DDB8B", "54B65",
                "531CC", "2E02C", "59BA4", "8530B", "2570C", "E8DC5", "E1E3F", "29BCA",
                "B652E", "9B5D2", "CBD93", "F4C83", "1AE9E", "A1FC7", "1F00B", "20CEA",
                "270AD", "F5CA0", "2863C", "67BCD", "BD734", "06037", "63703"
            ];

            // State hashes (first five characters).
            const S_UN = "875CF"; // Unselected.
            const S_SEL = "79C2F"; // Selected.
            const S_BRO = "EC91C"; // Damaged.

            const tubePositions = [
                {x: 50, y: 29}, {x: 65, y: 35}, {x: 71, y: 50}, {x: 64, y: 64},
                {x: 50, y: 70}, {x: 35, y: 64}, {x: 29, y: 50}, {x: 35, y: 35}
            ];

            while (true) {
                checkStop();
                let candidates = [];
                for (let i = 1; i <= 8; i++) {
                    const tubeEl = document.getElementById(`page3panel101-tube-${i}`);
                    const imgEl = document.getElementById(`page3panel101-image-${i}`);
                    if (!tubeEl || !imgEl) continue;

                    const bgStr = tubeEl.style.backgroundImage;
                    const imgStr = imgEl.style.backgroundImage;

                    let status = "unknown";
                    if (bgStr.includes(S_UN)) status = "unselected";
                    else if (bgStr.includes(S_SEL)) status = "selected";
                    else if (bgStr.includes(S_BRO)) status = "broken";

                    const shortHash = imgStr.split('/').pop().replace('")', '').substring(0, 5);

                    if (status === "unselected") {
                        candidates.push({ index: i, priority: priorityMap.indexOf(shortHash), pos: tubePositions[i - 1] });
                    }
                }

                if (candidates.length > 0) {
                    candidates.sort((a, b) => a.priority - b.priority);
                    const best = candidates[0];
                    console.log(`  => Clicking the memory module with the highest priority: ${best.index} (priority: ${best.priority})`);

                    await simulateClick({ page: 3, panel: 101, x: best.pos.x, y: best.pos.y, wait: 800, skipNav: true });
                    await sleep(500);
                } else {
                    console.log("  => All memory modules have been processed.");
                    break;
                }
            }
        }
    ]},

    // ========== Manual 42: New Images (After Memory Modules) ==========
    {name: "New Images (After Memory Modules)", page: 3, wait: 1000, actions: [
        [100, 54, 89], [102, 46, 44], [102, 20, 82], [105, 89, 5],
        [106, 45, 19], [107, 57, 24], [108, 59, 46], [109, 60, 45],
        [110, 68, 41], [111, 67, 41], [112, 65, 42], [113, 67, 42]
    ]},

    // ========== Manual 43: Gramophone Stamps (22 Forms) ==========
    {name: "Gramophone Stamps (22 Forms)", actions: [
        async function() {
            if (getCurrentPage() !== '2') await navigateToPage('2');

            // Lookup maps.
            const STAMP_MAPPING = {
                "134670": "scrapbookstamp4",  "176240": "scrapbookstamp14",
                "245860": "scrapbookstamp11", "246310": "scrapbookstamp8",
                "328510": "scrapbookstamp16", "357180": "scrapbookstamp2",
                "387150": "scrapbookstamp20", "415761": "scrapbookstamp6",
                "461870": "scrapbookstamp17", "487620": "scrapbookstamp12",
                "528461": "scrapbookstamp22", "534780": "scrapbookstamp9",
                "674281": "scrapbookstamp18", "578420": "scrapbookstamp3",
                "612350": "scrapbookstamp15", "623840": "scrapbookstamp1",
                "753610": "scrapbookstamp21", "768130": "scrapbookstamp10",
                "781251": "scrapbookstamp7",  "845720": "scrapbookstamp19",
                "853470": "scrapbookstamp13", "862531": "scrapbookstamp5"
            };

            const URL_MAPS = {
                antenna: {
                    '1144868EA7': 1, '0888C96DB1': 2, '947639847A': 3, '0857734121': 4,
                    '62A2815275': 5, 'DE8497A515': 6, '6BDF34A06A': 7, 'FBC87B2984': 8
                },
                face: {
                    'AC97A42A3D': 1, 'FAC5CF6C27': 2, 'AB79E39B76': 3, 'DE09FAC98A': 4,
                    'C69BA41CB1': 5, '297459E1A7': 6, '1B288F3A6C': 7, 'F76C3146EC': 8
                },
                left: {
                    'C7DE067F42': 1, '707594BDE3': 2, 'B5C7507A59': 3, 'F6343D5AA8': 4,
                    'DB980CC74F': 5, 'DAD5437556': 6, 'F9B70A6437': 7, '3B43ACAAE7': 8
                },
                right: {
                    '648B4A2DDD': 1, 'E93312BFB9': 2, '3D70F5F804': 3, '884970AAD7': 4,
                    '0F524A6847': 5, '4FE27BB981': 6, '25190AC076': 7, 'ACB0B31D90': 8
                },
                plate: {
                    '30415AF599': 1, 'A2BC179D3A': 2, '2D209D557B': 3, '03CE8FE64F': 4,
                    'B757B1C1DE': 5, 'CB0EBBEFDA': 6, '7F1F6185C2': 7, '2CD166FFC4': 8
                }
            };

            const COORDS = {
                antenna: {x: 48, y: 20}, face: {x: 48, y: 48},
                left: {x: 24, y: 48}, right: {x: 72, y: 48},
                plate: {x: 48, y: 80}, switch: {x: 21, y: 77}
            };

            const getCurrentState = () => {
                let state = {};
                for (let part of ['antenna', 'face', 'left', 'right', 'plate']) {
                    let el = document.getElementById(`page2panel1${part}`);
                    if (!el) continue;
                    let url = el.style.backgroundImage || "";
                    let hashMatch = url.match(/\/static\/([A-Z0-9]{10})/);
                    if (hashMatch) state[part] = URL_MAPS[part][hashMatch[1]];
                }
                let switchEl = document.getElementById('page2panel1switch');
                state['switch'] = (switchEl && switchEl.style.backgroundImage.includes('38414A7252')) ? 0 : 1;
                return state;
            };

            // Initialize: open the scrapbook to check progress.
            console.log("  => Checking the scrapbook for unlocked forms...");
            let scrapbook = document.getElementById('radioscrapbook');
            if (!scrapbook || !scrapbook.classList.contains('open')) {
                await simulateClick({page: 2, panel: 1, x: 10, y: 64, wait: 1500, skipNav: true});
            }

            // Get the stamps already collected.
            let ownedStamps = Array.from(document.querySelectorAll('.scrapbook-stamp')).map(el => el.id);
            console.log(`  => Already collected ${ownedStamps.length}/22 gramophone stamps.`);

            // Close the scrapbook after checking progress.
            await simulateClick({page: 2, panel: 1, x: 0, y: 0, wait: 1000, skipNav: true, skipCheck: true});

            // Filter out forms that have already been assembled.
            let pendingTargets = Object.keys(STAMP_MAPPING).filter(target => {
                return !ownedStamps.includes(STAMP_MAPPING[target]);
            });

            if (pendingTargets.length === 0) {
                console.log("  => 🎉 All 22 gramophone forms are already unlocked! Skipping this stage.");
                return;
            }

            console.log(`  => Still need to assemble ${pendingTargets.length} forms; starting automatic assembly...`);

            // Assemble each remaining form.
            for (let i = 0; i < pendingTargets.length; i++) {
                checkStop();
                let target = pendingTargets[i];
                console.log(`\n  => [${i+1}/${pendingTargets.length}] Assembling form: ${target} (stamp: ${STAMP_MAPPING[target]})`);

                let currState = getCurrentState();
                let tArr = target.split('').map(Number);
                let targetsObj = {
                    antenna: tArr[0], face: tArr[1], left: tArr[2],
                    right: tArr[3], plate: tArr[4]
                };

                // Use the fewest clicks to adjust each part.
                for (let part of ['antenna', 'face', 'left', 'right', 'plate']) {
                    let cVal = currState[part];
                    let tVal = targetsObj[part];
                    if (cVal && tVal) {
                        let clicks = (tVal - cVal + 8) % 8;
                        if (clicks > 0) {
                            for (let c = 0; c < clicks; c++) {
                                await simulateClick({page: 2, panel: 1, x: COORDS[part].x, y: COORDS[part].y, wait: 600, skipNav: true});
                            }
                        }
                    } else {
                        console.error(`  ✗ Cannot identify the state of part ${part}; skipping this part.`);
                    }
                }

                // Set the switch.
                if (currState.switch !== tArr[5]) {
                    await simulateClick({page: 2, panel: 1, x: COORDS.switch.x, y: COORDS.switch.y, wait: 1000, skipNav: true});
                }
                await sleep(2000);
            }
            console.log("  => ✅ All gramophone forms collected!");
        }
    ]},

    // ========== Manual 44: Note (Enter Numbers + Pull the Lever) ==========
    {name: "Note (Enter Numbers + Pull the Lever)", actions: [
        async function() {
            if (getCurrentPage() !== '6') await navigateToPage('6');

            const scanner = document.getElementById('page6panel0scanner');

            // Open the note and enter the numbers.
            if (scanner && scanner.classList.contains('closed')) {
                await simulateClick({page: 6, panel: 0, x: 64, y: 20, wait: 800, skipNav: true});
            }

            const ta = document.getElementById('notepad-sheet-textarea');
            const targetNumbers = "147 145 169 138 129 186 147 126 153 160 219 130 144 121 122 100 131 172 175 160 160 171 148 169 147 158 142 141 130 121 151 140 166 177 153 157 129 160 147 155 142 170 149 148 150 158 151 147 144 152 150 150 154 142 147 151 152 143 151 148 152 151";
            if (ta && ta.value.trim() !== targetNumbers) {
                ta.value = targetNumbers;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(500);
            }
            if (scanner && scanner.classList.contains('open')) {
                await simulateClick({page: 6, panel: 0, x: 80, y: 13, wait: 800, skipNav: true});
            }

            // Check the lights each round, then continue cycling or perform the final pull to turn them off.
            let round = 1;
            while (true) {
                checkStop();
                const l0 = scanner.querySelector('.light0');
                const l1 = scanner.querySelector('.light1');
                const l2 = scanner.querySelector('.light2');
                const allLit = l0 && l0.classList.contains('on') &&
                               l1 && l1.classList.contains('on') &&
                               l2 && l2.classList.contains('on');

                if (allLit) {
                    console.log("  => ✨ All three lights are on! Pulling the lever one last time to turn them off...");
                    await sleep(500);
                    await simulateDrag({ page: 6, id: 'page6panel0scanner', startCoord: 'auto', endCoord: { x: 96, y: 80 }, wait: 500, skipNav: true });
                    await simulateDrag({ page: 6, id: 'page6panel0scanner', startCoord: 'auto', endCoord: { x: 100, y: 46 }, wait: 800, skipNav: true });
                    console.log("  => ✅ Note and lever steps completed.");
                    return; // Task completed; return normally.
                }

                console.log(`  => Lever round ${round}`);

                // Pull down.
                await simulateDrag({ page: 6, id: 'page6panel0scanner', startCoord: 'auto', endCoord: { x: 96, y: 80 }, wait: 500, skipNav: true });

                // Push up.
                await simulateDrag({ page: 6, id: 'page6panel0scanner', startCoord: 'auto', endCoord: { x: 100, y: 46 }, wait: 600, skipNav: true });

                round++;
                if (round > 10) {
                    console.warn("⚠️ Maximum lever attempts exceeded; stopping this stage.");
                    return;
                }
            }
        }
    ]}
];

// ==================== Scheduler Controller ====================

const Controller = {
    config: window.MANUAL,
    currentStage: 0,
    isRunning: false,
    autoMode: false,

    list() {
        if (!this.config) return console.log('❌ Configuration not found');
        console.log(`\n${'━'.repeat(50)}\n📋 Action step list:\n${'━'.repeat(50)}`);
        this.config.forEach((stage, idx) => {
            console.log(`${idx + 1}. ${stage.name}`);
        });
        console.log(`${'━'.repeat(50)}\n💡 Enter jumpTo(n) to jump to stage n\n`);
    },

async executeStage(index) {
        if (!this.config || index < 0 || index >= this.config.length) return false;

        this.isRunning = true; // Ensure the running flag is active.
        const stage = this.config[index];
        console.log(`\n${'='.repeat(50)}\nRunning stage ${index + 1}/${this.config.length}: ${stage.name}\n${'='.repeat(50)}`);

        try {
            // If a stage specifies a page, navigate there first when needed.
            if (stage.page !== undefined && getCurrentPage() !== String(stage.page)) {
                await navigateToPage(stage.page);
            }

            for (let i = 0; i < stage.actions.length; i++) {
                checkStop();
                console.log(`[Step ${i + 1}/${stage.actions.length}]`);

                const action = stage.actions[i];

                if (typeof action === 'function') {
                    const res = await action(this);
                    if (res === 'SKIP') {
                        // console.log(`  => [Smart skip] This stage is already complete; skip the remaining steps.`);
                        break;
                    }
                } else if (Array.isArray(action)) {
                    // Click shorthand: [panel, x, y, wait?].
                    await simulateClick({
                        page: stage.page,
                        panel: action[0],
                        x: action[1],
                        y: action[2],
                        wait: action[3] ?? stage.wait ?? 1000,
                        skipNav: true
                    });
                } else if (action.drag || (action.id && (action.from || action.startCoord))) {
                    // Drag shorthand: {drag: 'id', from: [x, y]|'auto', to: [x, y], wait?}.
                    const targetId = action.drag || action.id;
                    const fromCoord = action.from
                        ? (action.from === 'auto' ? 'auto' : {x: action.from[0], y: action.from[1]})
                        : action.startCoord;
                    const toCoord = action.to
                        ? {x: action.to[0], y: action.to[1]}
                        : action.endCoord;
                    await simulateDrag({
                        page: action.page ?? stage.page,
                        id: targetId,
                        startCoord: fromCoord,
                        endCoord: toCoord,
                        wait: action.wait ?? stage.wait ?? 1500,
                        skipNav: true
                    });
                } else if (action.type === 'click') {
                    // Support the legacy click object syntax.
                    await simulateClick({
                        page: action.page ?? stage.page,
                        ...action,
                        wait: action.wait ?? stage.wait ?? 1000
                    });
                } else if (action.type === 'drag') {
                    // Support the legacy drag object syntax.
                    await simulateDrag({
                        page: action.page ?? stage.page,
                        ...action,
                        wait: action.wait ?? stage.wait ?? 1500
                    });
                }

                checkStop();
            }
            console.log(`✓ Stage ${index + 1} complete`);
            return true;
        } catch (error) {
            if (error && error.isStop) return false;
            if (error.message && error.message.includes("Element not found")) {
                console.error(`❌ Execution stopped: page element not found.\n\n💡 Hint: ${error.message}.\nMake sure prerequisite puzzle steps are complete, or try again after the network finishes loading. You can also try skipping the current step with jumpTo.`);
            } else {
                console.error(`❌ Execution error:`, error);
            }
            return false;
        }
    },

    async next() {
        if (this.isRunning) return console.warn('⚠️ Execution is already running. Please wait for it to finish.');
        if (this.currentStage >= this.config.length) return console.log('\n🎉 All stages are complete!');

        this.isRunning = true;
        try {
            const success = await this.executeStage(this.currentStage);
            if (success) {
                this.currentStage++;
                if (this.currentStage < this.config.length) {
                    console.log(`💡 Enter next() to continue to the next stage`);
                } else {
                    console.log('\n🎊 All story content has been unlocked. Puzzle complete!');
                }
            }
        } finally {
            this.isRunning = false;
        }
    },

    async auto() {
        if (this.isRunning) return console.warn('⚠️ Execution is already running. Please wait for it to finish.');
        console.log(`\n🚀 Starting full automatic mode! Total: ${this.config.length}.\n`);

        this.autoMode = true;
        this.isRunning = true;

        while (this.isRunning && this.autoMode && this.currentStage < this.config.length) {
            const success = await this.executeStage(this.currentStage);

            // Exit the loop immediately if stop() is called or execution fails.
            if (!this.isRunning || !this.autoMode || !success) break;

            this.currentStage++;
            if (this.currentStage < this.config.length) {
                await sleep(1000);
            }
        }

        this.isRunning = false;
        this.autoMode = false;

        if (this.currentStage >= this.config.length) {
            console.log('\n🎊 All story content has been unlocked. Puzzle complete!');
        }
    },
    jumpTo(stageNumber) {
        const index = stageNumber - 1;
        if (index < 0 || index >= this.config.length) return console.error(`❌ Invalid number. Please enter 1-${this.config.length}`);

        this.currentStage = index;
        console.log(`\n${'━'.repeat(50)}\n📍 Jumped to stage ${stageNumber}/${this.config.length} => [${this.config[index].name}]\n💡 Enter next() to start execution.\n(⚠️ The script will automatically navigate to the required page while running.)\n${'━'.repeat(50)}`);
    },

    stop() {
        this.isRunning = false;
        this.autoMode = false;
        console.log('🛑 Execution stopped');
    }
};

window.list = () => Controller.list();
window.next = () => Controller.next();
window.auto = () => Controller.auto();
window.jumpTo = (n) => Controller.jumpTo(n);
window.stop = () => Controller.stop();

console.log(`
${'━'.repeat(60)}
🎮 Don't Starve Together "We Await" Automation Script 🎮
${'━'.repeat(60)}
✅ Automatic navigation system loaded
✅ Smart protection logic loaded, including special handling for unclosed items
✅ Merged ${window.MANUAL.length} puzzle stages

[Commands]
  auto()      - Complete all remaining stages automatically
  next()      - Run the next stage
  list()      - Show all puzzle steps
  jumpTo(n)   - Jump to stage n
  stop()      - Stop immediately
${'━'.repeat(60)}
`);

})();