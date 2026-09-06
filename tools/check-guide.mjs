import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import { LANDMARKS, measurementContour } from '../body3d.js';

const model = JSON.parse(fs.readFileSync(new URL('../assets/human.json', import.meta.url)));
const body = model.meshes.find(mesh => mesh.name === 'body');
assert.equal(body.positions.length / 3, 13380);
assert(body.positions.every(Number.isFinite));
assert(body.indices.every(index => Number.isInteger(index) && index >= 0 && index < body.positions.length / 3));
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(body.positions, 3));
geometry.setIndex(body.indices);
for (const sex of ['male', 'female']) {
  for (const part of Object.keys(LANDMARKS)) {
    const { curve } = measurementContour(geometry, part, sex);
    assert(curve.points.length >= 5, `${sex}/${part} has a usable contour`);
    assert(curve.getPoint(0).distanceTo(curve.getPoint(1)) < 1e-8, 'tape is closed');
    assert(curve.getPoints(160).every(point => [point.x, point.y, point.z].every(Number.isFinite)));
    assert(curve.getLength() > .2 && curve.getLength() < 1.3, 'tape has a plausible reference-model circumference');
  }
}
const male = measurementContour(geometry, 'waist', 'male');
const female = measurementContour(geometry, 'waist', 'female');
assert(female.center.y > male.center.y, 'female guide uses natural waist above the male abdomen landmark');
console.log('PASS: mesh integrity and all 12 measurement contours; sex-specific waist landmarks.');
