const normalizeImage = (value) => String(value || '').trim();

const unique = (values) => Array.from(new Set(values.filter(Boolean)));

export const normalizeHttpImages = (images = []) => {
  return unique(images.map(normalizeImage).filter((value) => /^https?:\/\//i.test(value)));
};

export const normalizeRawWechatImages = (images = []) => {
  return unique(images.map(normalizeImage).filter((value) => /^data:image\//i.test(value)));
};

export const buildWechatImagePayload = ({ wechatType, images = [] } = {}) => {
  if (wechatType !== 'greenbook') {
    return {
      mainImages: normalizeHttpImages(images),
      rawMainImages: [],
    };
  }

  return {
    mainImages: normalizeHttpImages(images),
    rawMainImages: normalizeRawWechatImages(images),
  };
};
