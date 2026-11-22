---
name: xuong-phim-lich-su
description: Xưởng film Lịch sử Việt Nam của app Xưởng Video – thêm trận đánh/nhân vật lịch sử mới vào battles.js, dựng cảnh (bản đồ, sơ đồ trận, lực lượng, mốc thời gian), nạp giọng Manus, xuất video 16:9/9:16, ảnh bìa, prompt AI, chương YouTube. Dùng khi người dùng nói "làm video trận…", "thêm trận mới", "xuất video lịch sử", "prompt Veo cho trận…".
---

# XƯỞNG FILM LỊCH SỬ VIỆT NAM

Mọi thứ của xưởng này được liệt kê trong `xuong/lich-su.json` (app đọc file đó để hiện **🧰 Lệnh · Skill · Prompt**). Khi thêm lệnh/prompt mới, cập nhật file đó.

## Nguyên tắc
- **Đúng sử:** mỗi trận có `sources` (Đại Việt sử ký toàn thư, Khâm định Việt sử, Nguyên sử…). Chi tiết chưa chắc viết "tương truyền", "theo sử cũ". Số liệu cổ là ước lượng.
- **Giọng đọc: CHỈ giọng Manus** (xem CLAUDE.md, `loi-dan/NGUON.json`, `loi-dan/GIONG.json`).
- **Tất định theo thời gian t** để xuất từng khung (GSAP: timeline `paused` + `tl.time(t)`).
- Hình, nhạc do app tự vẽ/tự tổng hợp ⇒ không vướng bản quyền.

## Thêm một trận
1. `battles.js`: `{ id, year, name, who, vs, seed, sources, series?, scenes: [...] }`. Cảnh: `title, hero, map, forces, diagram, timeline, quote, points, end` (xem trận có sẵn làm mẫu; tọa độ bản đồ theo `tools/build-map.mjs`).
2. `lib/aiprompt.js` → thêm `ERA[id]` (trang phục, vũ khí, thuyền, địa hình) cho prompt Veo/Flow.
3. `tools/thumbnail.mjs` → thêm câu `HOOK[id]`.
4. Giọng: `node tools/giong-manus.mjs tao <id>` (có ELEVENLABS_API_KEY) hoặc `node tools/nap-giong-manus.mjs --yeu-cau` → gửi Manus → `node tools/nap-giong-manus.mjs goi.zip`.
5. Xuất: `node tools/render-video.mjs <id>` và `--doc` (9:16); thêm `--nguoi-dan` để có người dẫn người que ở góc.
6. Ảnh bìa: `node tools/thumbnail.mjs <id>`; prompt AI: nút "✨ Tải bộ prompt AI cả phim" hoặc `prompt-ai/<id>.txt`.
7. Đăng: nút **Đăng YouTube** (chương + mô tả tự soạn) / **Đăng Facebook** trong app.
