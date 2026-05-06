const DATA_URL_IMAGE_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/i;

const getEnvValue = (env = {}, ...keys) => {
  for (const key of keys) {
    const value = String(env?.[key] || '').trim();
    if (value) return value;
  }
  return '';
};

export const imageExtFromMime = (mime) => {
  const type = String(mime || '').toLowerCase();
  if (type.includes('png')) return 'png';
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  if (type.includes('bmp')) return 'bmp';
  return 'bin';
};

export const parseDataUrlImage = (dataUrl) => {
  const match = String(dataUrl || '').match(DATA_URL_IMAGE_RE);
  if (!match) return null;
  const mime = match[1];
  const base64 = match[2];
  return {
    mime,
    base64,
    ext: imageExtFromMime(mime),
    bytes: Buffer.from(base64, 'base64'),
  };
};

const normalizeUploadedUrl = (url) => String(url || '').trim().replace(/^http:\/\//i, 'https://');

const readResponseText = async (response) => {
  if (!response || typeof response.text !== 'function') return '';
  return String(await response.text()).trim();
};

const parseJsonText = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const readJsonResponse = async (response) => {
  const text = await readResponseText(response);
  return {
    text,
    json: parseJsonText(text),
  };
};

const extractUrlFromPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return '';
  if (typeof payload.secure_url === 'string') return payload.secure_url;
  if (typeof payload.url === 'string') return payload.url;
  if (payload.data && typeof payload.data === 'object') {
    if (typeof payload.data.secure_url === 'string') return payload.data.secure_url;
    if (typeof payload.data.url === 'string') return payload.data.url;
    if (payload.data.data && typeof payload.data.data === 'object' && typeof payload.data.data.url === 'string') {
      return payload.data.data.url;
    }
  }
  return '';
};

const formatProviderFailure = (name, error) => {
  const message = String(error?.message || error || 'Unknown error').trim();
  return `${name} (${message || 'Unknown error'})`;
};

export const buildImageUploadFailureMessage = (failures = [], env = {}) => {
  const details = failures.length > 0
    ? failures.map(({ name, error }) => formatProviderFailure(name, error)).join('; ')
    : 'no providers were attempted';
  const hasCustomProvider = Boolean(
    (
      getEnvValue(
        env,
        'WECHAT_IMAGE_CLOUDINARY_CLOUD_NAME',
        'VITE_WECHAT_IMAGE_CLOUDINARY_CLOUD_NAME',
      )
      && getEnvValue(
        env,
        'WECHAT_IMAGE_CLOUDINARY_UPLOAD_PRESET',
        'VITE_WECHAT_IMAGE_CLOUDINARY_UPLOAD_PRESET',
      )
    )
      || getEnvValue(env, 'WECHAT_IMAGE_UPLOAD_URL', 'VITE_WECHAT_IMAGE_UPLOAD_URL')
      || getEnvValue(env, 'WECHAT_IMAGE_SMMS_TOKEN', 'VITE_WECHAT_IMAGE_SMMS_TOKEN'),
  );
  const hint = hasCustomProvider
    ? ''
    : ' Configure WECHAT_IMAGE_CLOUDINARY_CLOUD_NAME and WECHAT_IMAGE_CLOUDINARY_UPLOAD_PRESET, WECHAT_IMAGE_UPLOAD_URL, or WECHAT_IMAGE_SMMS_TOKEN to use a working uploader.';
  return `Image upload failed via ${details}.${hint}`;
};

const buildUploadProviders = ({ dataUrl, fileName, mime, blob, env, fetchFn }) => {
  const cloudinaryCloudName = getEnvValue(
    env,
    'WECHAT_IMAGE_CLOUDINARY_CLOUD_NAME',
    'VITE_WECHAT_IMAGE_CLOUDINARY_CLOUD_NAME',
  );
  const cloudinaryUploadPreset = getEnvValue(
    env,
    'WECHAT_IMAGE_CLOUDINARY_UPLOAD_PRESET',
    'VITE_WECHAT_IMAGE_CLOUDINARY_UPLOAD_PRESET',
  );
  const cloudinaryFolder = getEnvValue(
    env,
    'WECHAT_IMAGE_CLOUDINARY_FOLDER',
    'VITE_WECHAT_IMAGE_CLOUDINARY_FOLDER',
  );
  const customUrl = getEnvValue(env, 'WECHAT_IMAGE_UPLOAD_URL', 'VITE_WECHAT_IMAGE_UPLOAD_URL');
  const customAuthorization = getEnvValue(
    env,
    'WECHAT_IMAGE_UPLOAD_AUTHORIZATION',
    'VITE_WECHAT_IMAGE_UPLOAD_AUTHORIZATION',
  );
  const smmsToken = getEnvValue(env, 'WECHAT_IMAGE_SMMS_TOKEN', 'VITE_WECHAT_IMAGE_SMMS_TOKEN');

  const providers = [];

  if (cloudinaryCloudName && cloudinaryUploadPreset) {
    providers.push({
      name: 'cloudinary',
      upload: async () => {
        const fd = new FormData();
        fd.append('file', dataUrl);
        fd.append('upload_preset', cloudinaryUploadPreset);
        if (cloudinaryFolder) fd.append('folder', cloudinaryFolder);
        const response = await fetchFn(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
          method: 'POST',
          body: fd,
        });
        const { text, json } = await readJsonResponse(response);
        const url = normalizeUploadedUrl(extractUrlFromPayload(json));
        if (!response.ok || !/^https?:\/\//i.test(url)) {
          throw new Error(text || response.statusText || 'Upload failed');
        }
        return url;
      },
    });
  }

  if (customUrl) {
    providers.push({
      name: 'custom uploader',
      upload: async () => {
        const headers = { 'Content-Type': 'application/json' };
        if (customAuthorization) headers.Authorization = customAuthorization;
        const response = await fetchFn(customUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ dataUrl, fileName, mimeType: mime }),
        });
        const { text, json } = await readJsonResponse(response);
        const url = normalizeUploadedUrl(extractUrlFromPayload(json));
        if (!response.ok || !/^https?:\/\//i.test(url)) {
          throw new Error(text || response.statusText || 'Upload failed');
        }
        return url;
      },
    });
  }

  if (smmsToken) {
    providers.push({
      name: 'sm.ms',
      upload: async () => {
        const fd = new FormData();
        fd.append('smfile', blob, fileName);
        const response = await fetchFn('https://sm.ms/api/v2/upload', {
          method: 'POST',
          headers: { Authorization: smmsToken },
          body: fd,
        });
        const { text, json } = await readJsonResponse(response);
        const url = normalizeUploadedUrl(extractUrlFromPayload(json));
        if (!response.ok || !/^https?:\/\//i.test(url)) {
          throw new Error(text || response.statusText || 'Upload failed');
        }
        return url;
      },
    });
  }

  providers.push({
    name: 'tmpfiles.org',
    upload: async () => {
      const fd = new FormData();
      fd.append('file', blob, fileName);
      const response = await fetchFn('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: fd,
      });
      const { text, json } = await readJsonResponse(response);
      const rawUrl = normalizeUploadedUrl(extractUrlFromPayload(json));
      if (!response.ok || !/^https?:\/\//i.test(rawUrl)) {
        throw new Error(text || response.statusText || 'Upload failed');
      }
      return rawUrl.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
    },
  });

  providers.push({
    name: '0x0.st',
    upload: async () => {
      const fd = new FormData();
      fd.append('file', blob, fileName);
      const response = await fetchFn('https://0x0.st', {
        method: 'POST',
        body: fd,
      });
      const text = await readResponseText(response);
      const url = normalizeUploadedUrl(text);
      if (!response.ok || !/^https?:\/\//i.test(url)) {
        throw new Error(text || response.statusText || 'Upload failed');
      }
      return url;
    },
  });

  return providers;
};

export const uploadDataUrlToPublicUrl = async (dataUrl, env = {}, fetchFn = fetch) => {
  const parsed = parseDataUrlImage(dataUrl);
  if (!parsed) {
    throw new Error('Invalid dataUrl');
  }

  const fileName = `wechat-image-${Date.now()}.${parsed.ext}`;
  const blob = new Blob([parsed.bytes], { type: parsed.mime });
  const providers = buildUploadProviders({
    dataUrl,
    fileName,
    mime: parsed.mime,
    blob,
    env,
    fetchFn,
  });
  const failures = [];

  for (const provider of providers) {
    try {
      return await provider.upload();
    } catch (error) {
      failures.push({ name: provider.name, error });
    }
  }

  throw new Error(buildImageUploadFailureMessage(failures, env));
};

export { DATA_URL_IMAGE_RE };
