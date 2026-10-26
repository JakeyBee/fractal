import { zoomAt, iterationsForScale } from './viewMath.js';
import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders.js';

const canvas = document.getElementById('view');
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

let view = { cx: -0.5, cy: 0, scale: 3 };

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
    gl.uniform1i(uMaxIter, iterationsForScale(view.scale));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
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

window.addEventListener('resize', resize);
resize();