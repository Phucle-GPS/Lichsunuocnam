---
name: xuong-phim-lich-su
description: Câu lệnh nhận dạng "film Lịch Sử Việt Nam". Xưởng film Lịch sử Việt Nam của app Xưởng Video – thêm trận đánh/nhân vật lịch sử mới vào battles.js, dựng cảnh (bản đồ, sơ đồ trận, lực lượng, mốc thời gian), nạp giọng Manus, xuất video 16:9/9:16, ảnh bìa, prompt AI, chương YouTube. Dùng khi người dùng nói "làm video trận…", "thêm trận mới", "xuất video lịch sử", "prompt Veo cho trận…".
---

# XƯỞNG FILM LỊCH SỬ VIỆT NAM

Phạm vi: khi người dùng gọi "film Lịch Sử Việt Nam" CHỈ làm trong Xưởng film Lịch sử Việt Nam – không tạo mục mới ở 2 xưởng còn lại hay ở thanh bên phải.

Mọi thứ của xưởng này được liệt kê trong `xuong/lich-su.json` (app đọc file đó để hiện **🧰 Lệnh · Skill · Prompt**). Khi thêm lệnh/prompt mới, cập nhật file đó.

## Nguyên tắc
- **Đúng sử:** mỗi trận có `sources` (Đại Việt sử ký toàn thư, Khâm định Việt sử, Nguyên sử…). Chi tiết chưa chắc viết "tương truyền", "theo sử cũ". Số liệu cổ là ước lượng.
- **Giọng đọc: CHỈ giọng Manus** (xem CLAUDE.md, `loi-dan/NGUON.json`, `loi-dan/GIONG.json`).
- **Tất định theo thời gian t** để xuất từng khung (GSAP: timeline `paused` + `tl.time(t)`).
- Hình, nhạc do app tự vẽ/tự tổng hợp ⇒ không vướng bản quyền.

## Bộ phim 40 trận (năm 40 → 1894)
`battles.js`: 10 trận gốc + khối "TẬP 11 – 40" ở cuối file. Khuôn sơ đồ dùng chung: `SONG` (sông/thủy chiến), `AI` (phục kích ở ải), `THANH` (công/thủ thành), `DONG` (đồng bằng, đánh hai cánh, có thể có cầu), `DAM` (đầm lầy/làng chiến đấu), `TAU` (tàu chiến trên sông). Danh sách tự xếp theo năm (`sortKey` để chỉnh thứ tự cùng năm) và tự nối "Tập tiếp theo". Mỗi trận có `hook` (ảnh bìa) và `hookQ` (câu hỏi mở đầu phim người que). 30 trận mới đang chờ giọng Manus (`loi-dan/CAN-GUI-MANUS.txt`).

## Thêm một trận
1. `battles.js`: `{ id, year, name, who, vs, seed, sources, series?, scenes: [...] }`. Cảnh: `title, hero, map, forces, diagram, timeline, quote, points, end` (xem trận có sẵn làm mẫu; tọa độ bản đồ theo `tools/build-map.mjs`).
2. `lib/aiprompt.js` → thêm `ERA[id]` (trang phục, vũ khí, thuyền, địa hình) cho prompt Veo/Flow.
3. `tools/thumbnail.mjs` → thêm câu `HOOK[id]`.
4. Giọng: `node tools/giong-manus.mjs tao <id>` (có ELEVENLABS_API_KEY) hoặc `node tools/nap-giong-manus.mjs --yeu-cau` → gửi Manus → `node tools/nap-giong-manus.mjs goi.zip`.
5. Xuất: `node tools/render-video.mjs <id>` và `--doc` (9:16); thêm `--nguoi-dan` để có người dẫn người que ở góc.
6. Ảnh bìa: `node tools/thumbnail.mjs <id>`; prompt AI: nút "✨ Tải bộ prompt AI cả phim" hoặc `prompt-ai/<id>.txt`.
7. Đăng: nút **Đăng YouTube** (chương + mô tả tự soạn) / **Đăng Facebook** trong app.

## Phim người que lịch sử theo kaomei/stickman-video-director (MIT)
Nguồn: `.claude/skills/directing-stickman-videos/` (đọc `references/historical-cartoon.md` = Style **A5 Historical Cartoon**).
- **Trong app (tự vẽ, không cần AI ngoài):** cột trái, Xưởng film Lịch sử Việt Nam → mục *Phim người que A5* → nút *🕺 Dựng* (hoặc *✨ A5* để tải prompt).
- Người que kiểu A5 (`stickFig`, `drawHorseStick`) và gói Google Flow (`tools/goi-flow.mjs`) chỉ thuộc xưởng này.
- **Bằng Veo / Google Flow (hình đẹp kiểu A5):** `node tools/prompt-nguoi-que.mjs <id|all>` → `prompt-ai/nguoi-que/<id>.txt` (hoặc nút *✨ A5* trong mục Phim người que A5). File gồm:
  - **Phase A – đề xuất đạo diễn:** era pack (thời kỳ, bối cảnh, màu, nhạc), cast card đầy đủ (chỉ huy theo thời kỳ, quân Đại Việt, quân địch), giọng Manus là bản thu ngoài, tách sự thật/minh họa.
  - **Phase B – prompt từng clip 8 giây:** lặp NGUYÊN VĂN khối vẽ A5 (`lib/a5-anchor.js`) + cast card đầy đủ + hành động có mốc giây + âm thanh + cấm kỵ. Hành động chọn theo lời dẫn (`Xuong.guessAction`) và loại cảnh.
- Quy tắc A5 phải giữ: đầu trắng nối cổ ngắn liền mạch, bàn tay đen hình găng không ngón, không chữ/không máu, giọng kể giữ nguyên cả phim (Manus). Khuyên người dùng tự tạo ảnh tham chiếu nhân vật (chính diện/nghiêng/sau) và đính kèm mỗi lần tạo.
- Thêm trận mới: bổ sung `ERA[id]` trong `lib/aiprompt.js`; trang phục chỉ huy theo thời kỳ ở `LEAD` trong `lib/stickprompt.js`.
