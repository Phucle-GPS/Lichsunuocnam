#!/usr/bin/env python3
"""Phân tích "dấu vân tay" giọng đọc (cao độ, tốc độ, ngắt nghỉ, âm lượng) – dùng cho skill giọng Manus.
   python3 tools/phan-tich-giong.py hoso                 → đo 48 đoạn Manus gốc, ghi loi-dan/GIONG.json["dac_tinh"]
   python3 tools/phan-tich-giong.py kiemtra a.mp3 "lời"  → so một file mới với hồ sơ giọng (in JSON)
Cần: ffmpeg, numpy."""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 16000

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0

def pitch_track(x):
    """Cao độ (Hz) theo khung 40 ms bằng tự tương quan – chỉ lấy khung có tiếng."""
    win, hop, out = int(.04 * SR), int(.01 * SR), []
    lo, hi = int(SR / 260), int(SR / 60)            # 60–260 Hz: giọng nam
    rms_all = np.sqrt(np.mean(x ** 2)) + 1e-9
    for i in range(0, len(x) - win, hop):
        f = x[i:i + win] * np.hanning(win)
        if np.sqrt(np.mean(f ** 2)) < rms_all * .6: continue
        ac = np.correlate(f, f, 'full')[win - 1:]
        if ac[0] <= 0: continue
        seg = ac[lo:hi]; k = int(np.argmax(seg)) + lo
        if ac[k] / ac[0] > .45: out.append(SR / k)
    return np.array(out)

def pauses(x):
    """Các quãng lặng > 0,25 s (giây)."""
    hop = int(.02 * SR); e = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    thr = max(np.percentile(e, 20) * 2, 1e-3); quiet = e < thr; out, run = [], 0
    for q in quiet[5:-5]:
        if q: run += 1
        else:
            if run * .02 > .25: out.append(run * .02)
            run = 0
    return out

def loudness(path):
    r = subprocess.run(['ffmpeg', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r); return float(m[-1]) if m else None

def stats(path, text):
    x = load(path); dur = len(x) / SR; f0 = pitch_track(x); p = pauses(x)
    words = len(text.split()) if text else 0
    return {'giay': round(dur, 2), 'f0_trung_vi': round(float(np.median(f0)), 1) if len(f0) else None,
            'f0_bien_do': round(float(np.percentile(f0, 90) - np.percentile(f0, 10)), 1) if len(f0) else None,
            'chu_moi_giay': round(words / dur, 2) if words else None, 'so_quang_nghi': len(p),
            'nghi_tb': round(float(np.mean(p)), 2) if p else 0, 'lufs': loudness(path)}

def battles():
    import subprocess as sp
    js = "const vm=require('vm'),fs=require('fs');const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync('battles.js','utf8'),c);console.log(JSON.stringify(c.window.BATTLES.map(b=>({id:b.id,say:b.scenes.map(s=>s.say)}))))"
    return json.loads(sp.run(['node', '-e', js], cwd=ROOT, capture_output=True, text=True, check=True).stdout)

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'hoso'
    if cmd == 'kiemtra':
        s = stats(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else '')
        prof = json.load(open(os.path.join(ROOT, 'loi-dan', 'GIONG.json')))['dac_tinh']
        ok = {'cao_do': abs(s['f0_trung_vi'] - prof['f0_trung_vi']) <= prof['f0_dung_sai'] if s['f0_trung_vi'] else False,
              'toc_do': (prof['chu_moi_giay'][0] <= s['chu_moi_giay'] <= prof['chu_moi_giay'][1]) if s['chu_moi_giay'] else True}
        print(json.dumps({'file': s, 'ho_so': {k: prof[k] for k in ('f0_trung_vi', 'f0_dung_sai', 'chu_moi_giay')}, 'dat': all(ok.values()), 'chi_tiet': ok}, ensure_ascii=False, indent=1))
        sys.exit(0 if all(ok.values()) else 2)
    src = json.load(open(os.path.join(ROOT, 'loi-dan', 'NGUON.json')))['tran']
    rows = []
    for b in battles():
        if b['id'] not in src or src[b['id']].get('tu_dong'): continue
        for i, say in enumerate(b['say']):
            f = os.path.join(ROOT, 'loi-dan', b['id'], f'{i + 1:02d}.mp3')
            if os.path.exists(f): rows.append(dict(stats(f, say), file=os.path.relpath(f, ROOT)))
    f0 = np.array([r['f0_trung_vi'] for r in rows if r['f0_trung_vi']]); wps = np.array([r['chu_moi_giay'] for r in rows if r['chu_moi_giay']])
    prof = {'so_doan_mau': len(rows), 'tong_giay': round(sum(r['giay'] for r in rows), 1),
            'f0_trung_vi': round(float(np.median(f0)), 1), 'f0_dung_sai': round(float(max(12, 2 * np.std(f0))), 1),
            'f0_bien_do_tb': round(float(np.mean([r['f0_bien_do'] for r in rows if r['f0_bien_do']])), 1),
            'chu_moi_giay': [round(float(np.percentile(wps, 5)) * .9, 2), round(float(np.percentile(wps, 95)) * 1.1, 2)],
            'chu_moi_giay_tb': round(float(np.mean(wps)), 2), 'nghi_tb': round(float(np.mean([r['nghi_tb'] for r in rows if r['nghi_tb']])), 2),
            'lufs_tb': round(float(np.mean([r['lufs'] for r in rows if r['lufs'] is not None])), 1)}
    g = json.load(open(os.path.join(ROOT, 'loi-dan', 'GIONG.json'))); g['dac_tinh'] = prof
    json.dump(g, open(os.path.join(ROOT, 'loi-dan', 'GIONG.json'), 'w'), ensure_ascii=False, indent=2)
    # chọn đoạn mẫu sạch nhất (cao độ gần trung vị, tốc độ gần trung bình) cho việc nhân bản
    rows.sort(key=lambda r: abs((r['f0_trung_vi'] or 0) - prof['f0_trung_vi']) / prof['f0_dung_sai'] + abs((r['chu_moi_giay'] or 0) - prof['chu_moi_giay_tb']))
    json.dump([r['file'] for r in rows], open(os.path.join(ROOT, 'loi-dan', 'nhan-ban', 'thu-tu-mau.json'), 'w'), indent=1)
    print(json.dumps(prof, ensure_ascii=False, indent=1))
