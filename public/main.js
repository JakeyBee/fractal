import { zoomAt, panBy, iterationsForScale, formatHud } from './viewMath.js';
import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders.js';

const canvas = document.getElementById('view');
const hud = document.getElementById('hud');
const gl = canvas.getContext('webgl');
if (!gl) {
    document.body.textContent = 'WebGL is not available in this browser.';
    throw new Error('WebGL not available');
}

// ---------- One-time GPU setup ----------

// Send shader source code to the GPU and compile it
function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('Shader compile failed:\n' + gl.getShaderInfoLog(shader));
    }
    return shader;
}

// Link the two shaders into one "program" the GPU can run
const program = gl.createProgram();
gl.attachShader(program, compileShader(gl.VERTEX_SHADER, VERTEX_SHADER));
gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Program link failed:\n' + gl.getProgramInfoLog(program));
}
gl.useProgram(program);

// One triangle big enough to cover the whole screen (-1..1 is the visible area)
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
const aPos = gl.getAttribLocation(program, 'a_pos');
gl.enableVertexAttribArray(aPos);
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

// Handles for the values we send to the shader each frame
const uResolution = gl.getUniformLocation(program, 'u_resolution');
const uCenter = gl.getUniformLocation(program, 'u_center');
const uUnitsPerPixel = gl.getUniformLocation(program, 'u_unitsPerPixel');
const uMaxIter = gl.getUniformLocation(program, 'u_maxIter');

// ---------- Drawing ----------

// Where we start, and where Reset goes back to. Object.freeze stops it from being changed by accident.
const START_VIEW = Object.freeze({ cx: -0.5, cy: 0, scale: 3 });
let view = { ...START_VIEW }; // a copy we're allowed to change

function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height); // tell WebGL the new size
    requestDraw();
}

// The whole Mandelbrot now happens on the GPU: we just send the view and draw
function draw() {
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform2f(uCenter, view.cx, view.cy);
    gl.uniform1f(uUnitsPerPixel, view.scale / canvas.height);
    const maxIter = iterationsForScale(view.scale);
    gl.uniform1i(uMaxIter, maxIter);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    hud.textContent = formatHud(view, maxIter);
}

let drawQueued = false;
function requestDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(() => {
        drawQueued = false;
        draw();
    });
}

// Scroll wheel: zoom toward the mouse (unchanged from milestone 3)
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const dpr = window.devicePixelRatio || 1;
    const px = event.offsetX * dpr;
    const py = event.offsetY * dpr;
    const factor = event.deltaY < 0 ? 0.8 : 1.25;
    view = zoomAt(view, px, py, canvas.width, canvas.height, factor);
    requestDraw();
}, { passive: false });

// Mouse, pen, and touch: one pointer drags, two fingers pinch-zoom.
const pointers = new Map(); // every finger (or mouse) currently down: pointerId -> { x, y }
let lastPinch = null;       // midpoint and finger distance from the previous two-finger move

// Pointer position in device pixels (the canvas's real pixels)
function devicePos(event) {
    const dpr = window.devicePixelRatio || 1;
    return { x: event.clientX * dpr, y: event.clientY * dpr };
}

// The point between the two fingers, and how far apart they are
function pinchInfo() {
    const [a, b] = [...pointers.values()];
    return {
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        dist: Math.hypot(a.x - b.x, a.y - b.y),
    };
}

canvas.addEventListener('pointerdown', (event) => {
    canvas.setPointerCapture(event.pointerId); // keep getting moves even if the pointer leaves the canvas
    pointers.set(event.pointerId, devicePos(event));
    lastPinch = pointers.size === 2 ? pinchInfo() : null; // second finger down = pinch starts
    canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return; // this pointer isn't pressed
    const prev = pointers.get(event.pointerId);
    const curr = devicePos(event);
    pointers.set(event.pointerId, curr);

    if (pointers.size === 1) {
        // One pointer: drag
        view = panBy(view, curr.x - prev.x, curr.y - prev.y, canvas.height);
        requestDraw();
    } else if (pointers.size === 2 && lastPinch) {
        // Two fingers: move with the midpoint, zoom by how much the gap changed
        const now = pinchInfo();
        if (now.dist > 0 && lastPinch.dist > 0) {
            view = panBy(view, now.mid.x - lastPinch.mid.x, now.mid.y - lastPinch.mid.y, canvas.height);
            // fingers apart = dist grows = factor below 1 = zoom in
            view = zoomAt(view, now.mid.x, now.mid.y, canvas.width, canvas.height, lastPinch.dist / now.dist);
            requestDraw();
        }
        lastPinch = now;
    }
});

function endPointer(event) {
    pointers.delete(event.pointerId);
    lastPinch = pointers.size === 2 ? pinchInfo() : null;
    if (pointers.size === 0) canvas.style.cursor = 'grab';
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

// Reset: the button, or the R key
function resetView() {
    view = { ...START_VIEW };
    requestDraw();
}
document.getElementById('reset').addEventListener('click', resetView);
window.addEventListener('keydown', (event) => {
    if (event.key === 'r' || event.key === 'R') resetView();
});

window.addEventListener('resize', resize);
resize();