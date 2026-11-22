#!/usr/bin/env node
/* XƯỞNG NHẠC AI TỰ ĐỘNG – dựng file nghe cho các bài EDM có lời trong nhac-ai/<ngày>/*.json
   (lời và thông số bài do lịch chạy hằng ngày của Claude viết – xem .claude/skills/xuong-nhac-ai).

   node tools/nhac-ai.mjs mau                    # in khung JSON + đề tài/tiêu đề đã dùng (tránh trùng)
   node tools/nhac-ai.mjs render <YYYY-MM-DD|all> [--co-loi elevenlabs|minimax] [--ghi-de]
        • luôn tạo bản demo nhạc nền <slug>-demo.mp3 bằng bộ tổng hợp của app (không cần mạng, dùng tự do)
        • bản có giọng hát <slug>-loi.mp3 khi có khóa: MINIMAX_API_KEY → MiniMax Music,
          ELEVENLABS_API_KEY → ElevenLabs Music (hoặc ép bằng --co-loi khi khóa do proxy môi trường chèn)
   node tools/nhac-ai.mjs index                  # dựng lại nhac-ai/index.json cho app
*/
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1', NODE_NO_WARNINGS: '1' } });
  process.exit(r.status ?? 1);
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'nhac-ai');
const [cmd, which, ...rest] = process.argv.slice(2);
const flag = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const die = m => { console.error('✖ ' + m); process.exit(1); };
const days = () => fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse() : [];
const songsOf = d => fs.readdirSync(path.join(DIR, d)).filter(f => f.endsWith('.json')).map(f => ({ f, p: path.join(DIR, d, f), j: JSON.parse(fs.readFileSync(path.join(DIR, d, f), 'utf8')) }));
const DEMO_SEC = 150;

function buildIndex() {
  const out = days().map(d => ({ date: d, songs: songsOf(d).map(({ f, j }) => ({ file: `${d}/${f}`, title: j.title, subgenre: j.subgenre || j.genre, bpm: j.bpm, key: j.key, mood: j.mood, theme: j.theme, hook: j.hook, demo: j.files && j.files.demo ? `${d}/${j.files.demo}` : null, loi: j.files && j.files.loi ? `${d}/${j.files.loi}` : null })) }));
  fs.writeFileSync(path.join(DIR, 'index.json'), JSON.stringify({ cap_nhat: new Date().toISOString(), ngay: out }, null, 1));
  console.log(`✔ nhac-ai/index.json: ${out.length} ngày, ${out.reduce((a, x) => a + x.songs.length, 0)} bài.`);
}

if (cmd === 'mau') {
  const used = days().flatMap(d => songsOf(d).map(({ j }) => `${d} · ${j.title} · ${j.subgenre} · ${j.theme}`));
  console.log(JSON.stringify({ title: '', date: new Date().toISOString().slice(0, 10), genre: 'EDM', subgenre: 'future bass', bpm: 124, key: 'La thứ', mood: '', language: 'vi', theme: '', lyrics: '[Intro]\n\n[Verse 1]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Drop]\n(nhạc)\n\n[Verse 2]\n\n[Chorus]\n\n[Outro]\n', hook: '', style_prompt: '', nhac: { style: 'edm', key: 9, tempo: 124, seed: Math.floor(Math.random() * 1e9), lead: 'pluck' } }, null, 2));
  console.log('\nĐÃ DÙNG (tránh trùng):\n' + (used.join('\n') || '(chưa có)'));
  process.exit(0);
}
if (cmd === 'index') { buildIndex(); process.exit(0); }
if (cmd !== 'render') { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace('/*', '').trim()); process.exit(0); }

const list = !which || which === 'all' ? days() : [which];
if (!list.length || !fs.existsSync(path.join(DIR, list[0]))) die('Không thấy thư mục ngày ' + (which || '') + ' trong nhac-ai/.');
const ghiDe = process.argv.includes('--ghi-de');
const prov = flag('--co-loi') || (process.env.MINIMAX_API_KEY ? 'minimax' : process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : null);

/* bản demo: chạy Nhac.renderWav trong Chromium (OfflineAudioContext) */
const require = createRequire(import.meta.url);
let browser = null, page = null;
async function demo(song, out) {
  if (!browser) {
    const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(path.join(ROOT, 'tools', 'node_modules', 'playwright')); } })();
    browser = await chromium.launch(); page = await browser.newPage();
    await page.setContent('<html><body></body></html>'); await page.addScriptTag({ path: path.join(ROOT, 'lib', 'nhac.js') });
  }
  const n = Object.assign({ style: 'edm', key: 9, tempo: 124, seed: 1, lead: 'pluck' }, song.nhac || {}); n.layers = Object.assign({ melody: true, chords: true, bass: true, drums: true }, n.layers || {});
  const b64 = await page.evaluate(async ([s, sec]) => { const blob = await Nhac.renderWav(s, sec); const u8 = new Uint8Array(await blob.arrayBuffer()); let bin = ''; for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(bin); }, [n, DEMO_SEC]);
  const wav = out.replace(/\.mp3$/, '.wav'); fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-b:a', '192k', out]); fs.unlinkSync(wav);
}

/* bản có lời qua dịch vụ nhạc AI */
async function voiced(song, out) {
  const lyrics = (song.lyrics || '').trim(), style = (song.style_prompt || `${song.subgenre || 'EDM'}, ${song.bpm || 124} bpm, catchy Vietnamese vocal pop-EDM`).trim();
  if (prov === 'minimax') {
    const r = await fetch('https://api.minimax.io/v1/music_generation', { method: 'POST', headers: { Authorization: 'Bearer ' + (process.env.MINIMAX_API_KEY || 'qua-proxy'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.MINIMAX_MUSIC_MODEL || 'music-2.6', prompt: style.slice(0, 2000), lyrics: lyrics.slice(0, 3000), audio_setting: { sample_rate: 44100, bitrate: 256000, format: 'mp3' }, output_format: 'hex' }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.data || !j.data.audio) throw new Error('MiniMax: ' + ((j.base_resp && j.base_resp.status_msg) || 'HTTP ' + r.status));
    fs.writeFileSync(out, Buffer.from(j.data.audio, 'hex')); return;
  }
  if (prov === 'elevenlabs') {
    const prompt = `${style}. Lead vocal sings in Vietnamese, clear diction. Sing exactly these lyrics, section by section:\n${lyrics}`.slice(0, 4100);
    const r = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || 'qua-proxy', 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ prompt, music_length_ms: Math.round(DEMO_SEC * 1000), model_id: process.env.ELEVENLABS_MUSIC_MODEL || 'music_v1' }) });
    if (!r.ok) throw new Error('ElevenLabs: HTTP ' + r.status + ' ' + (await r.text()).slice(0, 300));
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); return;
  }
}

for (const d of list) {
  for (const { f, p, j } of songsOf(d)) {
    const slug = f.replace(/\.json$/, ''); j.files = j.files || {};
    const dOut = path.join(DIR, d, slug + '-demo.mp3');
    if (!fs.existsSync(dOut) || ghiDe) { process.stdout.write(`🎛  ${d}/${slug}: demo… `); await demo(j, dOut); console.log('xong'); }
    j.files.demo = slug + '-demo.mp3';
    const vOut = path.join(DIR, d, slug + '-loi.mp3');
    if (prov && (!fs.existsSync(vOut) || ghiDe)) {
      process.stdout.write(`🎤 ${d}/${slug}: bản có lời (${prov})… `);
      try { await voiced(j, vOut); j.files.loi = slug + '-loi.mp3'; j.files.loi_nguon = prov; console.log('xong'); } catch (e) { console.log('lỗi – ' + e.message); }
    } else if (fs.existsSync(vOut)) j.files.loi = slug + '-loi.mp3';
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  }
}
if (browser) await browser.close();
if (!prov) console.log('ℹ Chưa có khóa dịch vụ nhạc AI ⇒ chỉ có bản demo nhạc nền. Thêm MINIMAX_API_KEY hoặc ELEVENLABS_API_KEY để có bản hát.');
buildIndex();
