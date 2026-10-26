import { screenToComplex, zoomAt } from './viewMath.js';

const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');

// How many times to run z = z² + c before giving up
const MAX_ITER = 100;

// Which part of the complex plane is on screen (let, because zooming changes it)
let view = { cx: -0.5, cy: 0, scale: 3 };

function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    requestDraw();
}

// Count how many steps until z escapes (|z| > 2)
function escapeTime(re, im) {
    let zr = 0;
    let zi = 0;
    for (let n = 0; n < MAX_ITER; n++) {
        if (zr * zr + zi * zi > 4) return n;
        const newZr = zr * zr - zi * zi + re;
        zi = 2 * zr * zi + im;
        zr = newZr;
    }
    return MAX_ITER;
}

function draw() {
    const width = canvas.width;
    const height = canvas.height;
    const image = ctx.createImageData(width, height);
    const data = image.data;

    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            const c = screenToComplex(view, px, py, width, height);
            const n = escapeTime(c.re, c.im);
            const i = (py * width + px) * 4;

            if (n === MAX_ITER) {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
            } else {
                const t = Math.sqrt(n / MAX_ITER);
                data[i] = 255 * t;
                data[i + 1] = 200 * t;
                data[i + 2] = 80 + 175 * t;
            }
            data[i + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);
}

// Scrolling fires many events per second, but a draw is slow.
// This makes sure we draw at most once per screen frame.
let drawQueued = false;
function requestDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(() => {
        drawQueued = false;
        draw();
    });
}

// Scroll wheel: zoom toward the mouse
canvas.addEventListener('wheel', (event) => {
    event.preventDefault(); // stop the page itself from scrolling

    // Mouse position comes in CSS pixels; the canvas uses device pixels
    const dpr = window.devicePixelRatio || 1;
    const px = event.offsetX * dpr;
    const py = event.offsetY * dpr;

    // Scroll up (deltaY < 0) = zoom in, scroll down = zoom out
    const factor = event.deltaY < 0 ? 0.8 : 1.25;
    view = zoomAt(view, px, py, canvas.width, canvas.height, factor);
    requestDraw();
}, { passive: false });

window.addEventListener('resize', resize);
resize();