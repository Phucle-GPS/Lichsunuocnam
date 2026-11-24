---
name: ban-do-chien-dich
description: (Xưởng film Lịch sử Việt Nam – câu lệnh nhận dạng "film Lịch Sử Việt Nam") Dựng video lịch sử, trận đánh, chiến dịch theo phong cách BẢN ĐỒ CHIẾN DỊCH bằng HyperFrames – bản đồ 3D địa hình thật làm xương sống, tướng/cờ/lính, ngựa chạy, mũi tên tiến quân, máy bay ném bom (chỉ trận thế kỷ 20), đất cháy ở lại sau trận, xen phim/ảnh tư liệu, chuyển cảnh mực bắn; render và tự kiểm phim (clip thiếu, tư liệu lặp, đường dẫn máy). Dùng khi người dùng nói "dựng bản đồ chiến dịch", "làm video HyperFrames trận…", "bản đồ 3D trận…".
---

# BẢN ĐỒ CHIẾN DỊCH (HyperFrames) – Xưởng film Lịch sử Việt Nam

Chỉ dùng trong Xưởng film Lịch sử Việt Nam. **Làm từng trận một, làm 1 tập mẫu cho người dùng duyệt trước** – không tự chạy hàng loạt, dừng ngay khi người dùng nói "dừng".

## Phong cách
| Thành phần | Cách làm |
|---|---|
| **Xương sống: bản đồ 3D** | Địa hình thật (AWS Terrain Tiles) phóng đại độ cao ×2,6, phủ nền 2K (màu theo độ cao, đổ bóng núi, sông hồ OpenStreetMap). Máy quay bay theo khung hình chính `may_quay`. |
| **Tướng, cờ, lính** | `doan_quan`: tướng cưỡi ngựa cầm cờ chữ (`co`), lính giáo đi theo tuyến; `nga_tai` = tướng ngã (tử trận). `co_cam`: cờ cắm khi chiếm được. `phuc_binh`: phục binh hiện ra kèm cờ. |
| **Con vật chuyển động** | Ngựa phi 4 khung (`ngua` trong đoàn quân). Voi/thuyền: thêm sprite vào `bando3d.js` khi trận cần (Bạch Đằng → thuyền, Hai Bà Trưng → voi). |
| **Mũi tên tiến quân** | `mui_ten` mọc dần theo thời gian, bám mặt đất; ta đỏ `#c8352b` nét liền, địch xanh `#1f5fa8` nét đứt. |
| **Máy bay ném bom** | CHỈ cho chiến dịch thế kỷ 20 (Điện Biên Phủ 1954, Điện Biên Phủ trên không 1972…). Trận cổ – trung đại tuyệt đối không có máy bay. |
| **Đất cháy ở lại** | `lua`: lửa cháy t0→t1, sau đó để lại vết cháy đen trên nền; cảnh "sau trận" (`sau_tran: true`) hiện toàn bộ vết cháy + cờ đã cắm. |
| **Xen phim tư liệu** | Ảnh/clip thật ở `anh/<id>/` (có chú thích + nguồn, giấy phép) – mở đầu, nhân vật, trích dẫn, kết. Máy quay chậm (Ken Burns). |
| **Chuyển cảnh mực bắn** | Vệt mực loang (SVG có hạt giống cố định) phủ kín ở điểm cắt rồi tan ra. |

## Quy trình 1 trận
1. **Lời dẫn**: `battles.js` (viết theo skill `viet-su-ke-chuyen`); **giọng Manus** đủ 8 đoạn ở `loi-dan/<id>/01–08.mp3`.
2. **Bản đồ**: khai báo `maps/<id>/region.json` (vùng kinh/vĩ độ, địa danh lịch sử, tuyến hành quân) → `node tools/ban-do.mjs <id>` → `nen-2k.jpg` (có chữ, để duyệt), `nen-3d.jpg` (không chữ, cho 3D), `do-cao.png`, `tuyen.json` (tọa độ điểm ảnh 2560×1440).
3. **Kịch bản bản đồ**: viết `maps/<id>/kich-ban-ban-do.json` (mẫu: `maps/chi-lang-1427/`). Thời gian tính theo đồng hồ cảnh bản đồ (bắt đầu ở đoạn giọng 3, dài = giọng 3+4+5 + 3 giây). Bám đúng lời dẫn: mỗi câu nói gì thì trên bản đồ hiện đúng cái đó.
   - `may_quay`: `[t, x, y, xa, nghiêng°, xoay°]` (x, y = điểm nhìn trên nền 2K; xa = khoảng cách). `may_quay_sau` cho cảnh sau trận.
   - `doan_quan`, `mui_ten`, `phuc_binh`, `lua`, `co_cam`, `nhan` (nhãn chữ), `chu_co_ta`, `an_dia_danh`.
4. **Dựng dự án**: `node tools/hf-tap.mjs <id>` → `hyperframes/<id>/` (index.html + compositions/ + assets/). Khung 6 cảnh: mở đầu (tư liệu) · nhân vật (tư liệu) · BẢN ĐỒ 3D · trích dẫn (tư liệu) · SAU TRẬN (bản đồ 3D, đất cháy) · kết (tư liệu); phụ đề theo lời; nhạc Hùng ca của app tự sinh.
5. **Tự kiểm**: `node tools/kiem-phim.mjs hyperframes/<id> --hf` – lỗi thì sửa rồi kiểm lại. Xem khung: `cd hyperframes && npx hyperframes snapshot <id> --at 2,30,55,84`.
6. **Render**: `cd hyperframes/<id> && ../node_modules/.bin/hyperframes render -o ../<id>.mp4` (1920×1080, 30 fps). Gửi người dùng xem, chờ duyệt.

## Luật HyperFrames (bắt buộc)
- Mỗi phần tử có thời gian: `class="clip"`, `id`, `data-start`, `data-duration`, `data-track-index`. Không tween chính `.clip` – tween phần tử con.
- Timeline: `gsap.timeline({ paused: true })`, đăng ký `window.__timelines["<id>"]` cuối cùng; dùng `fromTo`, không `from`.
- Cấm `Date.now`, `Math.random` không hạt giống, `setTimeout`, tải mạng (fetch/CDN). Mọi tài nguyên trong `assets/` (GSAP, three.js, font Việt, ảnh, giọng). Dữ liệu bản đồ nạp bằng `assets/du-lieu.js`, không fetch JSON.
- Three.js vẽ theo `t` (hàm `bd.ve(t)` gọi từ tween), dựng nặng đợi bằng `window.__hf.buildReady[...]`.
- Font Việt: `@font-face` trỏ `assets/fonts/` (font có sẵn của HyperFrames thiếu dấu tiếng Việt).
- Không gửi telemetry: đặt `HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1`.

## Kiểm phim (`tools/kiem-phim.mjs`)
- **Clip thiếu**: file được trỏ tới không có; khoảng hở trên dòng thời gian chính (màn hình đen); clip thiếu id/thời gian; âm thanh rỗng/ngắn hơn khe.
- **Tư liệu lặp**: cùng một ảnh/clip dùng ở nhiều cảnh, hoặc trùng nội dung khác tên (băm SHA-1). Nền bản đồ được phép dùng lại cho cảnh trước & sau trận.
- **Đường dẫn máy**: `/home/`, `/Users/`, `/root/`, `/tmp/`, `C:\`, `file://`, `localhost`, `127.0.0.1`, hoặc tài nguyên `http…` trong HTML/CSS.

## Tệp
- `hyperframes/_chung/bando3d.js` – máy dựng bản đồ chiến dịch 3D (`window.BanDo3D(khung, {nen, doCao, du_lieu, kich_ban, sau_tran}) → {ve(t)}`).
- `tools/hf-tap.mjs`, `tools/kiem-phim.mjs`, `tools/ban-do.mjs`.
- `hyperframes/package.json` (hyperframes, cài: `cd hyperframes && npm install`; cần Node 22+, FFmpeg, Chrome).
