import test from 'node:test';
import assert from 'node:assert/strict';

import {
  areAllMaterialsSelected,
  buildMaterialSelectionSet,
  clampSelectionToMaterials,
  countSelectedMaterials,
} from '../utils/works-materials-selection.js';

test('counts only selections that exist in current project materials', () => {
  const projectMaterials = [{ id: 'p1' }, { id: 'p2' }];
  const selected = new Set(['p1', 'legacy-mock-id']);
  assert.equal(countSelectedMaterials(selected, projectMaterials), 1);
});

test('treats all selected only when every current project material is selected', () => {
  const projectMaterials = [{ id: 'p1' }, { id: 'p2' }];
  assert.equal(areAllMaterialsSelected(new Set(['p1']), projectMaterials), false);
  assert.equal(areAllMaterialsSelected(new Set(['p1', 'p2']), projectMaterials), true);
});

test('select all uses only current project material ids', () => {
  const projectMaterials = [{ id: 'p1' }, { id: 'p2' }];
  assert.deepEqual(Array.from(buildMaterialSelectionSet(projectMaterials)).sort(), ['p1', 'p2']);
});

test('clamps stale selections to current project material ids', () => {
  const projectMaterials = [{ id: 'p2' }, { id: 'p3' }];
  const selected = new Set(['p1', 'p2', 'legacy-mock-id']);
  assert.deepEqual(Array.from(clampSelectionToMaterials(selected, projectMaterials)).sort(), ['p2']);
});
