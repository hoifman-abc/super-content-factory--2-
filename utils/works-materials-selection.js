const getMaterialIds = (materials = []) => {
  return materials.map((material) => material.id);
};

export const countSelectedMaterials = (selectedIds, materials = []) => {
  const ids = new Set(getMaterialIds(materials));
  let count = 0;
  for (const id of selectedIds) {
    if (ids.has(id)) count += 1;
  }
  return count;
};

export const areAllMaterialsSelected = (selectedIds, materials = []) => {
  const ids = getMaterialIds(materials);
  if (ids.length === 0) return false;
  return ids.every((id) => selectedIds.has(id));
};

export const buildMaterialSelectionSet = (materials = []) => {
  return new Set(getMaterialIds(materials));
};

export const clampSelectionToMaterials = (selectedIds, materials = []) => {
  const ids = new Set(getMaterialIds(materials));
  const next = new Set();
  for (const id of selectedIds) {
    if (ids.has(id)) next.add(id);
  }
  return next;
};
