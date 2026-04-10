import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

let cachedBrowser: any = null;
const EDGE_PATHS = [
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

const readJsonBody = async (req: any): Promise<any> => {
  const body = await new Promise<string>((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: any) => { raw += chunk; });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
  return JSON.parse(body || '{}');
};

const writeJson = (res: any, statusCode: number, payload: any) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const safeParseJsonFromStdout = (stdout: string) => {
  const text = String(stdout || '').trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const runXhsCli = async (
  skillDir: string,
  pythonExe: string,
  args: string[],
): Promise<{ exitCode: number; stdout: string; stderr: string; json: any }> => {
  return await new Promise((resolve, reject) => {
    const child = spawn(pythonExe, ['scripts/cli.py', ...args], {
      cwd: skillDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += String(d || ''); });
    child.stderr.on('data', (d) => { stderr += String(d || ''); });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({
        exitCode: typeof code === 'number' ? code : 2,
        stdout,
        stderr,
        json: safeParseJsonFromStdout(stdout),
      });
    });
  });
};

const normalizeImageInputs = (input: unknown): string[] => {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(input
    .map((x) => String(x || '').trim())
    .filter(Boolean)));
};

const DATA_URL_IMAGE_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/i;

const imageExtFromMime = (mime: string) => {
  const type = String(mime || '').toLowerCase();
  if (type.includes('png')) return 'png';
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  if (type.includes('bmp')) return 'bmp';
  return 'bin';
};

const materializeCliImageInputs = (images: string[], tmpDir: string): string[] => {
  const resolved: string[] = [];
  for (let i = 0; i < images.length; i += 1) {
    const value = String(images[i] || '').trim();
    if (!value) continue;
    const dataUrlMatch = value.match(DATA_URL_IMAGE_RE);
    if (!dataUrlMatch) {
      resolved.push(value);
      continue;
    }
    const mime = dataUrlMatch[1];
    const base64 = dataUrlMatch[2];
    const ext = imageExtFromMime(mime);
    const outPath = path.join(tmpDir, `image-${i + 1}.${ext}`);
    fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
    resolved.push(outPath);
  }
  return resolved;
};

const resolveXhsPythonExe = (env: Record<string, string>, skillDir: string) => {
  const envPython = String(env.XHS_PYTHON_EXE || '').trim();
  if (envPython && fs.existsSync(envPython)) return envPython;
  const venvPython = path.join(skillDir, '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(venvPython)) return venvPython;
  return envPython || 'python';
};

const extractXhsCliErrorMessage = (result: { json: any; stderr: string; stdout: string }) => {
  const jsonError = String(result?.json?.error || '').trim();
  if (jsonError) return jsonError;
  const stderr = String(result?.stderr || '').trim();
  if (stderr) return stderr.split('\n').slice(-1)[0] || stderr;
  const stdout = String(result?.stdout || '').trim();
  if (stdout) return stdout.split('\n').slice(-1)[0] || stdout;
  return 'Unknown CLI error';
};

const isTransientBridgeFrameError = (msg: string) => {
  const text = String(msg || '').toLowerCase();
  return text.includes('frame with id') && text.includes('was removed');
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const runXhsCliWithRetry = async (
  skillDir: string,
  pythonExe: string,
  args: string[],
  maxRetry = 1,
): Promise<{ exitCode: number; stdout: string; stderr: string; json: any }> => {
  let result = await runXhsCli(skillDir, pythonExe, args);
  for (let attempt = 1; attempt <= maxRetry; attempt += 1) {
    if (result.exitCode === 0) return result;
    const errMsg = extractXhsCliErrorMessage(result);
    if (!isTransientBridgeFrameError(errMsg)) return result;
    await sleep(700);
    result = await runXhsCli(skillDir, pythonExe, args);
  }
  return result;
};

const isBridgeConnectionError = (msg: string) => {
  const text = String(msg || '').toLowerCase();
  return (
    text.includes('extension 未连接'.toLowerCase()) ||
    text.includes('no close frame received or sent') ||
    text.includes('无法连接到 bridge server'.toLowerCase()) ||
    text.includes('bridge 错误'.toLowerCase())
  );
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        strictPort: true,
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

            server.middlewares.use('/local-browser-snapshot', async (req, res) => {
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
                const html = String(parsed?.html || '');
                const width = Number(parsed?.width || 1080);
                const height = Number(parsed?.height || 1440);
                const backgroundColor = String(parsed?.backgroundColor || '#ffffff');
                const fontCss = String(parsed?.fontCss || '');

                if (!html) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ message: 'Missing html' }));
                  return;
                }

                const { chromium } = await import('playwright-core');

                if (!cachedBrowser || !cachedBrowser.isConnected()) {
                  const fs = await import('fs');
                  const edgePath = EDGE_PATHS.find((p) => fs.existsSync(p));
                  if (!edgePath) throw new Error('未找到系统 Edge 浏览器，无法执行浏览器截图');
                  cachedBrowser = await chromium.launch({
                    headless: true,
                    executablePath: edgePath,
                    args: ['--disable-gpu', '--font-render-hinting=none'],
                  });
                }

                const page = await cachedBrowser.newPage({
                  viewport: { width, height },
                  deviceScaleFactor: 1,
                });

                await page.setContent(
                  `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:${backgroundColor};}*{box-sizing:border-box;}${fontCss}</style></head><body>${html}</body></html>`,
                  { waitUntil: 'networkidle' }
                );
                await page.waitForTimeout(80);
                const png = await page.screenshot({ fullPage: false, type: 'png' });
                await page.close();

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ dataUrl: `data:image/png;base64,${png.toString('base64')}` }));
              } catch (error: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ message: error?.message || 'Browser snapshot failed' }));
              }
            });

            // Local Xiaohongshu adapter:
            // frontend -> local endpoint -> xiaohongshu-skills CLI
            server.middlewares.use('/local-xhs/check-login', async (req, res) => {
              if (req.method !== 'POST') {
                writeJson(res, 405, { success: false, message: 'Method Not Allowed' });
                return;
              }

              const skillDir = env.XHS_SKILLS_DIR || 'd:\\AIcode\\_tmp_xhs_skills';
              const pythonExe = resolveXhsPythonExe(env, skillDir);
              const bridgeUrl = env.XHS_BRIDGE_URL || 'ws://localhost:9333';

              if (!fs.existsSync(path.join(skillDir, 'scripts', 'cli.py'))) {
                writeJson(res, 500, {
                  success: false,
                  code: 'XHS_SKILL_NOT_FOUND',
                  message: `未找到小红书 skill，请检查 XHS_SKILLS_DIR：${skillDir}`,
                });
                return;
              }

              try {
                const result = await runXhsCli(skillDir, pythonExe, ['--bridge-url', bridgeUrl, 'check-login']);
                if (result.exitCode === 0 && result.json?.logged_in) {
                  writeJson(res, 200, { success: true, data: result.json });
                  return;
                }
                if (result.exitCode === 1 && result.json?.logged_in === false) {
                  writeJson(res, 200, {
                    success: false,
                    code: 'XHS_LOGIN_REQUIRED',
                    message: '请扫码登录小红书',
                    data: result.json,
                  });
                  return;
                }
                const errMsg = extractXhsCliErrorMessage(result);
                if (isBridgeConnectionError(errMsg)) {
                  writeJson(res, 200, {
                    success: false,
                    code: 'XHS_BRIDGE_NOT_CONNECTED',
                    message: '浏览器扩展未连接，请确认 XHS Bridge 扩展已启用并刷新小红书页面后重试',
                    data: { detail: errMsg },
                  });
                  return;
                }
                writeJson(res, 500, {
                  success: false,
                  code: 'XHS_CHECK_LOGIN_FAILED',
                  message: errMsg || '检查登录状态失败',
                });
              } catch (error: any) {
                writeJson(res, 500, {
                  success: false,
                  code: 'XHS_CHECK_LOGIN_FAILED',
                  message: error?.message || '检查登录状态失败',
                });
              }
            });

            server.middlewares.use('/local-xhs/wait-login', async (req, res) => {
              if (req.method !== 'POST') {
                writeJson(res, 405, { success: false, message: 'Method Not Allowed' });
                return;
              }

              const skillDir = env.XHS_SKILLS_DIR || 'd:\\AIcode\\_tmp_xhs_skills';
              const pythonExe = resolveXhsPythonExe(env, skillDir);
              const bridgeUrl = env.XHS_BRIDGE_URL || 'ws://localhost:9333';

              if (!fs.existsSync(path.join(skillDir, 'scripts', 'cli.py'))) {
                writeJson(res, 500, {
                  success: false,
                  code: 'XHS_SKILL_NOT_FOUND',
                  message: `未找到小红书 skill，请检查 XHS_SKILLS_DIR：${skillDir}`,
                });
                return;
              }

              try {
                const parsed = await readJsonBody(req);
                const timeoutSec = Math.max(30, Number(parsed?.timeoutSec || 120));
                const result = await runXhsCli(skillDir, pythonExe, [
                  '--bridge-url', bridgeUrl, 'wait-login', '--timeout', String(timeoutSec),
                ]);

                if (result.exitCode === 0 && result.json?.logged_in) {
                  writeJson(res, 200, { success: true, data: result.json });
                  return;
                }
                writeJson(res, 200, {
                  success: false,
                  code: 'XHS_LOGIN_TIMEOUT',
                  message: result.json?.message || '扫码登录超时，请重新扫码',
                  data: result.json || null,
                });
              } catch (error: any) {
                writeJson(res, 500, {
                  success: false,
                  code: 'XHS_WAIT_LOGIN_FAILED',
                  message: error?.message || '等待扫码登录失败',
                });
              }
            });

            server.middlewares.use('/local-xhs/publish', async (req, res) => {
              if (req.method !== 'POST') {
                writeJson(res, 405, { success: false, message: 'Method Not Allowed' });
                return;
              }

              const skillDir = env.XHS_SKILLS_DIR || 'd:\\AIcode\\_tmp_xhs_skills';
              const pythonExe = resolveXhsPythonExe(env, skillDir);
              const bridgeUrl = env.XHS_BRIDGE_URL || 'ws://localhost:9333';
              const publishAction = String(env.XHS_LOCAL_PUBLISH_ACTION || 'publish').trim() === 'fill'
                ? 'fill-publish'
                : 'publish';

              if (!fs.existsSync(path.join(skillDir, 'scripts', 'cli.py'))) {
                writeJson(res, 500, {
                  success: false,
                  code: 'XHS_SKILL_NOT_FOUND',
                  message: `未找到小红书 skill，请检查 XHS_SKILLS_DIR：${skillDir}`,
                });
                return;
              }

              let tmpDir = '';
              try {
                const parsed = await readJsonBody(req);
                const title = String(parsed?.title || '').trim();
                const content = String(parsed?.content || '').trim();
                const coverImage = String(parsed?.coverImage || '').trim();
                const images = normalizeImageInputs(parsed?.images);
                const tags = normalizeImageInputs(parsed?.tags);
                const noteId = String(parsed?.noteId || '').trim();

                const mergedImages = Array.from(new Set([coverImage, ...images].filter(Boolean)));
                if (mergedImages.length === 0) {
                  writeJson(res, 400, {
                    success: false,
                    code: 'XHS_IMAGES_REQUIRED',
                    message: '小红书发布至少需要一张图片',
                  });
                  return;
                }

                // 先检查登录态，未登录时直接返回二维码给前端弹窗
                const loginCheck = await runXhsCliWithRetry(
                  skillDir,
                  pythonExe,
                  ['--bridge-url', bridgeUrl, 'check-login'],
                  1,
                );
                if (loginCheck.exitCode === 1 && loginCheck.json?.logged_in === false) {
                  writeJson(res, 200, {
                    success: false,
                    code: 'XHS_LOGIN_REQUIRED',
                    message: '请扫码登录小红书',
                    data: loginCheck.json,
                  });
                  return;
                }
                const loginErr = extractXhsCliErrorMessage(loginCheck);
                if (isBridgeConnectionError(loginErr)) {
                  writeJson(res, 200, {
                    success: false,
                    code: 'XHS_BRIDGE_NOT_CONNECTED',
                    message: '浏览器扩展未连接，请先在 Chrome 启用 XHS Bridge 扩展，再重试发布',
                    data: { detail: loginErr },
                  });
                  return;
                }
                if (!(loginCheck.exitCode === 0 && loginCheck.json?.logged_in)) {
                  writeJson(res, 500, {
                    success: false,
                    code: 'XHS_CHECK_LOGIN_FAILED',
                    message: loginErr || '检查登录状态失败',
                  });
                  return;
                }

                tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xhs-publish-'));
                const titleFile = path.join(tmpDir, 'title.txt');
                const contentFile = path.join(tmpDir, 'content.txt');
                fs.writeFileSync(titleFile, title || '未命名笔记', 'utf8');
                fs.writeFileSync(contentFile, content || '', 'utf8');

                const cliImages = materializeCliImageInputs(mergedImages, tmpDir);
                const cliArgs = [
                  '--bridge-url', bridgeUrl,
                  publishAction,
                  '--title-file', titleFile,
                  '--content-file', contentFile,
                  '--images', ...cliImages,
                ];
                if (tags.length > 0) {
                  cliArgs.push('--tags', ...tags);
                }

                const publishResult = await runXhsCliWithRetry(skillDir, pythonExe, cliArgs, 1);
                if (publishResult.exitCode === 0 && publishResult.json?.success) {
                  writeJson(res, 200, {
                    success: true,
                    data: {
                      note_id: noteId || undefined,
                      publish_url: undefined,
                      xiaohongshu_qr_image_url: undefined,
                      local_mode: publishAction,
                    },
                    message: publishAction === 'fill-publish'
                      ? '已自动填充到发布页，请在浏览器中手动确认发布'
                      : '已提交发布',
                  });
                  return;
                }

                writeJson(res, 500, {
                  success: false,
                  code: 'XHS_PUBLISH_FAILED',
                  message: extractXhsCliErrorMessage(publishResult) || '发布失败',
                  data: publishResult.json || null,
                });
              } catch (error: any) {
                writeJson(res, 500, {
                  success: false,
                  code: 'XHS_PUBLISH_FAILED',
                  message: error?.message || '发布失败',
                });
              } finally {
                if (tmpDir && fs.existsSync(tmpDir)) {
                  fs.rmSync(tmpDir, { recursive: true, force: true });
                }
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
