# Sử Việt · Trận đánh lừng danh — Xưởng dựng video

Trang web: `https://phucle-gps.github.io/tran-danh/` (kho riêng `Phucle-GPS/tran-danh`, bật GitHub Pages từ nhánh `main`)

Mỗi video gồm các cảnh dựng tự động: **tiêu đề** trên nền tranh cổ → **nhân vật** (hoa văn trống đồng) →
**bản đồ** (Đại Việt tô đỏ, đường tiến quân, có QĐ. Hoàng Sa – Trường Sa) → **tương quan lực lượng** →
**sơ đồ diễn biến** (thủy triều, bãi cọc, phục binh, mũi tên tiến công; ta đỏ – địch xanh như sách giáo khoa) →
**trích dẫn** → **ý nghĩa lịch sử** → kết. Có phụ đề, nhạc trống trận tự tổng hợp và hạt phim.

## 1. Làm video ngay trên điện thoại
1. Mở trang, chọn trận.
2. Bật **Giọng đọc** (dùng giọng tiếng Việt có sẵn của máy; nếu chưa có: Cài đặt › Ngôn ngữ › Chuyển văn bản thành giọng nói › tải tiếng Việt).
3. Chọn **Dọc** nếu đăng TikTok / Reels / Shorts.
4. Bấm **Chế độ quay** → bật trình ghi màn hình (chọn ghi *âm thanh nội bộ*) → chạm ▶.

## 2. Xuất MP4 chất lượng cao (máy tính)
Cần Node 18+, ffmpeg và Playwright (`npm i -g playwright && npx playwright install chromium`).

```bash
node tools/render-video.mjs bach-dang-1288          # một trận, khung ngang 1920×1080
node tools/render-video.mjs all --doc               # tất cả, khung dọc 1080×1920
node tools/render-video.mjs dong-da-1789 --preview  # chỉ xuất ảnh duyệt nhanh
node tools/render-video.mjs bach-dang-938 --voice loi-dan   # ghép giọng thu sẵn
node tools/tts-google.mjs all                       # tự tạo giọng đọc tiếng Việt (Google) vào loi-dan/
node tools/render-video.mjs all --voice loi-dan     # xuất video có lồng tiếng
```
Video ra thư mục `video/`. Với `--voice loi-dan`, đặt file thu âm từng cảnh vào
`loi-dan/<id-trận>/01.mp3, 02.mp3…` (thu bằng điện thoại hoặc AI giọng đọc); cảnh tự kéo dài theo giọng, nhạc tự hạ nhỏ.

## 3. Thêm trận mới
Mở `battles.js`, sao chép một khối `{ id: ..., scenes: [...] }` rồi sửa:
- `say`: lời dẫn — thời lượng cảnh tự tính theo số chữ.
- `map`: tọa độ kinh/vĩ độ thật; `cutLat` = vĩ độ biên giới phía Nam Đại Việt thời đó; `cam` = máy quay (z = độ phóng).
- `diagram`: tọa độ khung 1920×1080, mốc thời gian là tỉ lệ 0→1 của cảnh (`at`, `sink`, `burn`, `path: [[tỉ-lệ, x, y], …]`).

Các trận hiện có: Bạch Đằng 938 · Như Nguyệt 1077 · Bạch Đằng 1288 · Chi Lăng – Xương Giang 1427 · Rạch Gầm – Xoài Mút 1785 · Ngọc Hồi – Đống Đa 1789.

Nguồn: sách giáo khoa Lịch sử, Đại Việt sử ký toàn thư. Bản đồ & sơ đồ mang tính minh họa; số quân thời cổ là con số ước lượng theo sử sách.
Bản đồ nền: Natural Earth (public domain). Font: Oswald, Be Vietnam Pro, Playfair Display (SIL OFL).
