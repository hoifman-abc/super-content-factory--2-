import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // 解决开发环境下调用微信开放接口的 CORS 问题
          '/wechat-openapi': {
            target: 'https://wx.limyai.com/api/openapi',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/wechat-openapi/, ''),
          },
        },
      },
      plugins: [
        react(),
        {
          name: 'local-image-upload-endpoint',
          configureServer(server) {
            server.middlewares.use('/local-upload-image', async (req, res) => {
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ message: 'Method Not Allowed' }));
                return;
              }

              try {
                const body = await new Promise<string>((resolve, reject) => {
                  let raw = '';
                  req.on('data', (chunk) => { raw += chunk; });
                  req.on('end', () => resolve(raw));
                  req.on('error', reject);
                });

                const parsed = JSON.parse(body || '{}');
                const dataUrl = String(parsed?.dataUrl || '');
                const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
                if (!match) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ message: 'Invalid dataUrl' }));
                  return;
                }

                const mime = match[1];
                const base64 = match[2];
                const bytes = Buffer.from(base64, 'base64');
                const ext = mime.includes('png') ? 'png' : mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'bin';
                const fileName = `wechat-image-${Date.now()}.${ext}`;
                const blob = new Blob([bytes], { type: mime });
                let uploadedUrl = '';

                // Primary: tmpfiles (returns JSON + stable direct URL via /dl/)
                try {
                  const fd = new FormData();
                  fd.append('file', blob, fileName);
                  const resp = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: fd });
                  const raw = await resp.text();
                  const data = JSON.parse(raw || '{}');
                  const url = String(data?.data?.url || '').trim();
                  if (resp.ok && /^https?:\/\//i.test(url)) {
                    const normalized = url.replace(/^http:\/\//i, 'https://');
                    uploadedUrl = normalized.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
                  }
                } catch {
                  // noop, fallback below
                }

                // Fallback: 0x0.st
                if (!uploadedUrl) {
                  const fd = new FormData();
                  fd.append('file', blob, fileName);
                  const uploadResp = await fetch('https://0x0.st', { method: 'POST', body: fd });
                  const text = (await uploadResp.text()).trim();
                  if (uploadResp.ok && /^https?:\/\//i.test(text)) {
                    uploadedUrl = text.replace(/^http:\/\//i, 'https://');
                  } else {
                    throw new Error(text || 'Upload failed');
                  }
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ url: uploadedUrl }));
              } catch (error: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ message: error?.message || 'Upload failed' }));
              }
            });
          },
        },
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
