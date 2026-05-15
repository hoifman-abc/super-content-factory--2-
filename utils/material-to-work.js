const normalizeText = (value) => String(value || '').trim();

const buildPreview = (material) => {
  const explicitPreview = normalizeText(material?.preview);
  if (explicitPreview) return explicitPreview;

  const content = normalizeText(material?.content);
  if (!content) return '';

  return content.length > 100 ? `${content.slice(0, 100)}...` : content;
};

export const buildWorkFromMaterial = (material, options = {}) => {
  const nowLabel = options.nowLabel || 'Just now';
  const createId = options.createId || (() => `work-${Date.now()}`);

  return {
    id: createId(),
    title: normalizeText(material?.title) || 'Untitled Item',
    type: material?.type || 'Note',
    date: nowLabel,
    content: material?.content || '',
    preview: buildPreview(material),
    ...(material?.author ? { author: material.author } : {}),
    imageUrl: material?.imageUrl,
    mediaUrl: material?.mediaUrl,
    images: material?.images,
    sourceUrl: material?.sourceUrl,
    sourceMaterialId: material?.id,
  };
};

export const findWorkBySourceMaterialId = (works = [], materialId) => {
  if (!materialId) return undefined;
  return works.find((work) => work?.sourceMaterialId === materialId);
};
