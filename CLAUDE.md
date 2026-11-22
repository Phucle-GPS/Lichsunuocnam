# Xưởng Video – ghi chú cho Claude

- App web tĩnh (không có bước build): `index.html` (trình biên tập), `engine.js` (dựng cảnh theo thời gian t, tất định), `battles.js` (kịch bản mẫu), `lib/*.js`, `phim3d.html` (three.js).
- Mọi chuyển động phải tính từ thời gian `t` (seek được) để công cụ `tools/render-video.mjs` xuất từng khung chính xác. GSAP dùng timeline `paused` rồi `tl.time(t)`.
- Thư viện bên thứ ba đóng gói sẵn trong `lib/vendor/` (xem `lib/vendor/LICENSES.md`); module ESM (Mediabunny, dotLottie) nạp bằng `import()` khi cần.
- Skill GSAP chính thức (MIT) nằm ở `.claude/skills/gsap-*` – dùng khi viết hiệu ứng GSAP.
- Giao diện, lời dẫn, ghi chú: tiếng Việt. Không đặt class CSS trùng với class trong sân khấu (`.ta`, `.dich`…).
- **Giọng đọc mục Trận đánh lừng danh: CHỈ dùng giọng Manus** – bản mp3 Manus gửi, hoặc đọc tự động bằng giọng Manus đã lưu trong `loi-dan/GIONG.json` (mẫu nghe: `loi-dan/giong-mau.mp3`). Không dùng giọng Google Translate/TTS khác. Trận mới: viết kịch bản → `node tools/giong-manus.mjs tao <id>` (cần ELEVENLABS_API_KEY; không ghi key vào repo) → xuất video. Khi chưa có key: `node tools/nap-giong-manus.mjs --yeu-cau` tạo file gửi Manus, nạp lại bằng `node tools/nap-giong-manus.mjs goi.zip`. Bản do Manus gửi (không có `tu_dong`) không bị ghi đè. `loi-dan/NGUON.json` ghi nguồn từng trận; `tools/render-video.mjs` từ chối xuất trận chưa đủ giọng Manus.
