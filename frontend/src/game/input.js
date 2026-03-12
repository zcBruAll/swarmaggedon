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
}

function onKeyDown(e) {
    const key = e.key;
    switch (key.toUpperCase()) {
        case "ARROWUP":
        case "W":
            input.keys.up = true;
            e.preventDefault();
            break;
        case "ARROWDOWN":
        case "S":
            input.keys.down = true;
            e.preventDefault();
            break;
        case "ARROWLEFT":
        case "A":
            input.keys.left = true;
            e.preventDefault();
            break;
        case "ARROWRIGHT":
        case "D":
            input.keys.right = true;
            e.preventDefault();
            break;
    }
}

function onKeyUp(e) {
    const key = e.key;
    switch (key.toUpperCase()) {
        case "ARROWUP":
        case "W":
            input.keys.up = false;
            e.preventDefault();
            break;
        case "ARROWDOWN":
        case "S":
            input.keys.down = false;
            e.preventDefault();
            break;
        case "ARROWLEFT":
        case "A":
            input.keys.left = false;
            e.preventDefault();
            break;
        case "ARROWRIGHT":
        case "D":
            input.keys.right = false;
            e.preventDefault();
            break;
    }
}

function onMouseMove(e) {
    const x = e.clientX;
    const y = e.clientY;
    input.mouse = { x, y };
}

function onMouseDown(e) {
    input.mouseDown = (e.buttons & 1) === 1;
}

function onMouseUp(e) {
    input.mouseDown = !(input.mouseDown && !((e.buttons & 1) === 1));
}

export function initInput(canvas) {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
}

export function destroyInput(canvas) {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mouseup', onMouseUp);
}

export function flushInput(canvas) {
    // TODO: Flush inputs that lasts a single frame (e.g. mouse click if added)
}