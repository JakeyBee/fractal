// The fractals and color palettes you can switch between.
// To add a new one, add an entry here. No shader changes needed for palettes.

// type: which formula the shader runs (0 = Mandelbrot, 1 = Burning Ship, 2 = Julia)
// start: where the view begins (and where Reset goes) for this fractal
export const FRACTALS = Object.freeze([
    { name: 'Mandelbrot', type: 0, start: { cx: -0.5, cy: 0, scale: 3 } },
    { name: 'Burning Ship', type: 1, start: { cx: -0.45, cy: 0.5, scale: 3 } },
    { name: 'Julia', type: 2, start: { cx: 0, cy: 0, scale: 3 }, juliaC: [-0.8, 0.156] },
]);

// Cosine palettes: color = a + b * cos(2π * (c * t + d)), one number per red, green, blue.
// "classic" is the original purple formula from milestone 2.
export const PALETTES = Object.freeze([
    { name: 'Purple', classic: true },
    { name: 'Rainbow', a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1.0, 1.0, 1.0], d: [0.0, 0.33, 0.67] },
    { name: 'Fire', a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1.0, 0.7, 0.4], d: [0.0, 0.15, 0.2] },
    { name: 'Ice', a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1.0, 1.0, 0.5], d: [0.8, 0.9, 0.3] },
]);

// Step to the next item in a list, wrapping back to the start after the last one.
export function nextIndex(index, length) {
    return (index + 1) % length;
}