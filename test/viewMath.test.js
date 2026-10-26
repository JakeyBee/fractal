import { test } from 'node:test';
import assert from 'node:assert/strict';
import { screenToComplex, zoomAt, iterationsForScale, MAX_ITER_CAP } from '../public/viewMath.js';

const view = { cx: -0.5, cy: 0, scale: 3 };
const W = 800;
const H = 600;

test('the center pixel maps to the view center', () => {
    const c = screenToComplex(view, W / 2, H / 2, W, H);
    assert.equal(c.re, -0.5);
    assert.equal(c.im, 0);
});

test('the top edge is half the scale above the center', () => {
    const c = screenToComplex(view, W / 2, 0, W, H);
    assert.equal(c.im, 1.5);
});

test('zooming keeps the point under the mouse in place', () => {
    const before = screenToComplex(view, 123, 456, W, H);
    const zoomed = zoomAt(view, 123, 456, W, H, 0.5);
    const after = screenToComplex(zoomed, 123, 456, W, H);
    assert.ok(Math.abs(before.re - after.re) < 1e-12);
    assert.ok(Math.abs(before.im - after.im) < 1e-12);
});

test('zoomAt(0.5) halves the scale', () => {
    assert.equal(zoomAt(view, 0, 0, W, H, 0.5).scale, 1.5);
});

test('zoomAt rejects a bad factor', () => {
    assert.throws(() => zoomAt(view, 0, 0, W, H, -1), RangeError);
    assert.throws(() => zoomAt(view, 0, 0, W, H, NaN), RangeError);
});

test('iterations start at 100 and grow 100 per 10x zoom', () => {
    assert.equal(iterationsForScale(3), 100);      // no zoom
    assert.equal(iterationsForScale(0.3), 200);    // 10x
    assert.equal(iterationsForScale(0.003), 400);  // 1000x
});

test('iterations never go past the shader cap', () => {
    assert.equal(iterationsForScale(1e-30), MAX_ITER_CAP);
});