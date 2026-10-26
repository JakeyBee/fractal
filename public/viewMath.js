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