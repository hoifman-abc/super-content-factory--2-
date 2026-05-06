const normalizeImage = (value) => String(value || '').trim();

const unique = (values) => Array.from(new Set(values.filter(Boolean)));

export const normalizeWechatImages = (images = []) => {
  return unique(images.map(normalizeImage));
};

export const normalizeHttpImages = (images = []) => {
  return unique(images.map(normalizeImage).filter((value) => /^https?:\/\//i.test(value)));
};

export const normalizeRawWechatImages = (images = []) => {
  return unique(images.map(normalizeImage).filter((value) => /^data:image\//i.test(value)));
};

export const pickWechatCoverImage = ({ preferredCoverImage, images = [] } = {}) => {
  const normalizedPreferredCoverImage = normalizeImage(preferredCoverImage);
  const safePreferredCoverImage = /^https?:\/\//i.test(normalizedPreferredCoverImage)
    ? normalizedPreferredCoverImage
    : '';

  if (safePreferredCoverImage) {
    return safePreferredCoverImage;
  }

  const httpImages = normalizeHttpImages(images);
  return httpImages[0];
};

export const requiresWechatImageUploadBridge = ({
  wechatType,
  mainImages = [],
  rawMainImages = [],
} = {}) => {
  return wechatType === 'greenbook'
    && normalizeHttpImages(mainImages).length === 0
    && normalizeRawWechatImages(rawMainImages).length > 0;
};

export const resolveWechatPublishableImages = async ({
  images = [],
  uploadDataImage,
} = {}) => {
  const normalizedImages = normalizeWechatImages(images);
  const uploadedByRawImage = new Map();
  const publishableImages = [];

  for (const image of normalizedImages) {
    if (/^https?:\/\//i.test(image)) {
      publishableImages.push(image);
      continue;
    }
    if (!/^data:image\//i.test(image)) {
      continue;
    }
    if (!uploadedByRawImage.has(image)) {
      uploadedByRawImage.set(image, Promise.resolve(uploadDataImage(image)));
    }
    const uploadedUrl = normalizeImage(await uploadedByRawImage.get(image));
    if (/^https?:\/\//i.test(uploadedUrl)) {
      publishableImages.push(uploadedUrl);
    }
  }

  return unique(publishableImages);
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
