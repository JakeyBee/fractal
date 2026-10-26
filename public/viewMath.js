// Pure math for the view. No canvas, no DOM, so it can be tested in Node.

// Turn a pixel position into a complex number.
// view = { cx, cy, scale }: center point and how tall the view is.
export function screenToComplex(view, px, py, width, height) {
    const unitsPerPixel = view.scale / height;
    return {
        re: view.cx + (px - width / 2) * unitsPerPixel,
        im: view.cy - (py - height / 2) * unitsPerPixel, // minus: screen y goes down, math y goes up
    };
}

// Zoom by `factor` (below 1 = zoom in, above 1 = zoom out)
// while keeping the point under the mouse in the same spot on screen.
export function zoomAt(view, px, py, width, height, factor) {
    if (!Number.isFinite(factor) || factor <= 0) {
        throw new RangeError(`zoom factor must be a positive number, got ${factor}`);
    }
    const p = screenToComplex(view, px, py, width, height); // point under the mouse
    return {
        cx: p.re + (view.cx - p.re) * factor, // pull the center toward p
        cy: p.im + (view.cy - p.im) * factor,
        scale: view.scale * factor,
    };
}

// Move the view by a mouse drag of (dx, dy) pixels.
// Dragging right should slide the picture right, so the center moves LEFT.
export function panBy(view, dx, dy, height) {
    const unitsPerPixel = view.scale / height;
    return {
        cx: view.cx - dx * unitsPerPixel,
        cy: view.cy + dy * unitsPerPixel, // plus: screen y goes down, math y goes up
        scale: view.scale,
    };
}

// The most iterations the shader will ever run (must match MAX_ITER_CAP in shaders.js)
export const MAX_ITER_CAP = 2000;

// Deeper zoom needs more steps to tell "inside" from "escapes slowly".
// 100 at the start, +100 for every 10x of zoom, never more than MAX_ITER_CAP.
export function iterationsForScale(scale) {
    const zoom = Math.max(3 / scale, 1); // 3 = the starting scale
    const iterations = Math.round(100 + 100 * Math.log10(zoom));
    return Math.min(iterations, MAX_ITER_CAP);
}