export const input = {
    keys: {
        up: false,
        down: false,
        left: false,
        right: false,
    },
    mouse: {
        x: 0,
        y: 0,
    },
    mouseDown: false,
    mouseClicked: false,
    rightMouseClicked: false,
    tabPressed: false,
};

function onKeyDown(e) {
    switch (e.key.toUpperCase()) {
        case 'ARROWUP': case 'W': input.keys.up = true; e.preventDefault(); break;
        case 'ARROWDOWN': case 'S': input.keys.down = true; e.preventDefault(); break;
        case 'ARROWLEFT': case 'A': input.keys.left = true; e.preventDefault(); break;
        case 'ARROWRIGHT': case 'D': input.keys.right = true; e.preventDefault(); break;
        case 'TAB':
            input.tabPressed = true;
            e.preventDefault();
            break;
    }
}

function onKeyUp(e) {
    switch (e.key.toUpperCase()) {
        case 'ARROWUP': case 'W': input.keys.up = false; e.preventDefault(); break;
        case 'ARROWDOWN': case 'S': input.keys.down = false; e.preventDefault(); break;
        case 'ARROWLEFT': case 'A': input.keys.left = false; e.preventDefault(); break;
        case 'ARROWRIGHT': case 'D': input.keys.right = false; e.preventDefault(); break;
    }
}

function onMouseMove(e) {
    input.mouse = { x: e.clientX, y: e.clientY };
}

function onMouseDown(e) {
    if ((e.buttons & 1) === 1) input.mouseDown = true;
}

function onMouseUp(e) {
    if ((e.button === 0) && !((e.buttons & 1) === 1)) {
        input.mouseDown = false;
        input.mouseClicked = true;
    }
    if (e.button === 2) {
        input.rightMouseClicked = true;
    }
}

function onContextMenu(e) {
    e.preventDefault();
}

export function initInput(canvas) {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);
}

export function destroyInput(canvas) {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('contextmenu', onContextMenu);
}

export function flushInput() {
    input.mouseClicked = false;
    input.rightMouseClicked = false;
    input.tabPressed = false;
}