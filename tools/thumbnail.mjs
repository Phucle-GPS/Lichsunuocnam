#!/usr/bin/env node
/* Tạo ẢNH BÌA (thumbnail) cho video: YouTube 1280×720 và TikTok/Reels 1080×1920.
   Dùng Satori (vercel/satori) dựng bố cục → SVG, SVGO tối ưu SVG, resvg xuất PNG.
   Ảnh nền lấy từ chính video (chụp cảnh sơ đồ trận đánh bằng Playwright).

   Cài một lần:   cd tools && npm install
   Chạy:          node tools/thumbnail.mjs [id-trận | all] [--out thumbnails]
*/
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const req = m => { try { return require(m); } catch (e) { return require(path.join(ROOT, 'tools', 'node_modules', m)); } };
const satoriMod = await import(pathToFileURL(require.resolve('satori', { paths: [ROOT + '/tools', process.cwd()] })).href);
const satori = satoriMod.default?.default || satoriMod.default || satoriMod.satori;
const { Resvg } = req('@resvg/resvg-js');
const { optimize } = req('svgo');
const { chromium } = req('playwright');

const args = process.argv.slice(2);
const which = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out') || 'all';
const outDir = path.resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(ROOT, 'thumbnails'));
fs.mkdirSync(outDir, { recursive: true });

// phông chữ đầy đủ chữ Việt (Google Fonts, SIL OFL) – Satori cần .ttf/.otf/.woff có đủ glyph trong MỘT file
const F = f => fs.readFileSync(path.join(ROOT, 'tools', 'fonts', f));
const fonts = [
  { name: 'Oswald', weight: 700, style: 'normal', data: F('Oswald-700.ttf') },
  { name: 'BVP', weight: 600, style: 'normal', data: F('BeVietnamPro-600.ttf') },
  { name: 'BVP', weight: 800, style: 'normal', data: F('BeVietnamPro-800.ttf') }
];

const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'battles.js'), 'utf8'), ctx);
const BATTLES = ctx.window.BATTLES.filter(b => which === 'all' || which.split(',').includes(b.id));
const HOOK = { 'bach-dang-938': 'CHẤM DỨT NGÀN NĂM BẮC THUỘC', 'nhu-nguyet-1077': '10 VẠN QUÂN TỐNG BỊ CHẶN ĐỨNG', 'bach-dang-1288': 'BÃI CỌC NHẤN CHÌM HẠM ĐỘI NGUYÊN', 'chi-lang-1427': 'LIỄU THĂNG BỎ MẠNG Ở ẢI CHI LĂNG', 'rach-gam-1785': 'TRẬN THỦY CHIẾN TRÊN SÔNG TIỀN', 'dong-da-1789': 'ĐẠI PHÁ 29 VẠN QUÂN THANH', 'dong-bo-dau-1258': 'ĐẦU THẦN CHƯA RƠI XUỐNG ĐẤT', 'ham-tu-1285': 'CHƯƠNG DƯƠNG CƯỚP GIÁO GIẶC', 'tay-ket-1285': 'TOA ĐÔ BỎ MẠNG, THOÁT HOAN CHUI ỐNG ĐỒNG', 'van-don-1288': 'NHẤN CHÌM ĐOÀN THUYỀN LƯƠNG GIẶC' };
const el = (type, style, children) => ({ type, props: { style, children } });

// chụp khung nền từ video
const browser = await chromium.launch();
async function grab(b, W, H) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href + `?render=${b.id}&fx=none`);
  await page.waitForFunction(() => window.STUDIO);
  const i = b.scenes.findIndex(s => s.type === 'diagram');
  const t = await page.evaluate(i => { const s = window.STUDIO.starts; return s[i] + (s[i + 1] - s[i]) * .72; }, i);
  await page.evaluate(x => window.STUDIO.seek(x), t);
  await page.addStyleTag({ content: '.subs,.d-phase,.d-title,.d-legend,.tide{display:none!important}' });
  const png = await page.screenshot({ type: 'jpeg', quality: 85 }); await page.close();
  return 'data:image/jpeg;base64,' + png.toString('base64');
}

for (const b of BATTLES) {
  const bg = await grab(b);
  const name = b.name.replace(/\s\d{3,4}$/, '').toUpperCase();
  for (const [kind, W, H] of [['youtube', 1280, 720], ['tiktok', 1080, 1920]]) {
    const tall = H > W;
    const tree = el('div', { width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#120e0a', fontFamily: 'BVP' }, [
      { type: 'img', props: { src: bg, width: tall ? 3413 : W, height: tall ? 1920 : H, style: { position: 'absolute', left: tall ? -1100 : 0, top: 0, objectFit: 'cover' } } },
      el('div', { position: 'absolute', left: 0, top: 0, width: W, height: H, display: 'flex', backgroundImage: tall ? 'linear-gradient(180deg, rgba(10,6,4,.85) 0%, rgba(10,6,4,.15) 35%, rgba(10,6,4,.2) 60%, rgba(10,6,4,.95) 100%)' : 'linear-gradient(90deg, rgba(10,6,4,.95) 0%, rgba(10,6,4,.75) 42%, rgba(10,6,4,0) 75%)' }, []),
      el('div', { position: 'absolute', left: tall ? 70 : 64, top: tall ? 1230 : 110, width: tall ? 940 : 760, display: 'flex', flexDirection: 'column' }, [
        el('div', { display: 'flex', fontFamily: 'Oswald', fontSize: tall ? 40 : 30, color: '#e2c27a', letterSpacing: 6 }, b.series || 'SỬ VIỆT · TRẬN ĐÁNH LỪNG DANH'),
        el('div', { display: 'flex', fontFamily: 'Oswald', fontSize: tall ? (name.length > 12 ? 128 : 170) : (name.length > 12 ? 104 : 140), lineHeight: 1.02, color: '#fff', marginTop: 10, textShadow: '0 6px 24px rgba(0,0,0,.8)' }, name),
        el('div', { display: 'flex', marginTop: 18, alignItems: 'center' }, [
          el('div', { display: 'flex', backgroundColor: '#c8352b', color: '#fff', fontFamily: 'Oswald', fontSize: tall ? 64 : 50, padding: '2px 22px', letterSpacing: 4 }, b.year),
          el('div', { display: 'flex', marginLeft: 18, color: '#efe4cc', fontSize: tall ? 34 : 26, fontWeight: 800, letterSpacing: 1 }, b.who.toUpperCase())
        ]),
        el('div', { display: 'flex', marginTop: 26, fontSize: tall ? 52 : 40, fontWeight: 800, color: '#ffd36b', lineHeight: 1.15, textShadow: '0 4px 14px rgba(0,0,0,.8)' }, HOOK[b.id] || '')
      ])
    ]);
    let svg = await satori(tree, { width: W, height: H, fonts });
    const raw = svg.length;
    svg = optimize(svg, { multipass: true }).data;
    fs.writeFileSync(path.join(outDir, `${b.id}-${kind}.svg`), svg);
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
    fs.writeFileSync(path.join(outDir, `${b.id}-${kind}.png`), png);
    console.log(`✔ ${b.id}-${kind}.png  (SVG ${Math.round(raw / 1024)} KB → SVGO ${Math.round(svg.length / 1024)} KB)`);
  }
}
await browser.close();
