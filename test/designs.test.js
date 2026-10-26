import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FRACTALS, PALETTES, nextIndex } from '../public/designs.js';

test('nextIndex steps forward and wraps around', () => {
    assert.equal(nextIndex(0, 3), 1);
    assert.equal(nextIndex(2, 3), 0);
});

test('every fractal has a name, a type, and a start view', () => {
    for (const f of FRACTALS) {
        assert.equal(typeof f.name, 'string');
        assert.ok([0, 1, 2].includes(f.type), `${f.name} has an unknown type`);
        assert.ok(f.start.scale > 0, `${f.name} needs a positive start scale`);
    }
});

test('every cosine palette has four RGB triples', () => {
    for (const p of PALETTES.filter((p) => !p.classic)) {
        for (const key of ['a', 'b', 'c', 'd']) {
            assert.equal(p[key].length, 3, `${p.name}.${key} needs 3 numbers`);
        }
    }
});