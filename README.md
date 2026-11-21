# Xưởng Video

Ứng dụng dựng video từ kịch bản (phim tài liệu, viễn tưởng, hoạt hình), kèm bộ mẫu *Sử Việt · Trận đánh lừng danh*.

Trang web: `https://phucle-gps.github.io/Lichsunuocnam/` (kho riêng `Phucle-GPS/Lichsunuocnam`, bật GitHub Pages từ nhánh `main`)

Mỗi video gồm các cảnh dựng tự động: **tiêu đề** trên nền tranh cổ → **nhân vật** (hoa văn trống đồng) →
**bản đồ** (Đại Việt tô đỏ, đường tiến quân, có QĐ. Hoàng Sa – Trường Sa) → **tương quan lực lượng** →
**sơ đồ diễn biến** (thủy triều, bãi cọc, phục binh, mũi tên tiến công; ta đỏ – địch xanh như sách giáo khoa) →
**trích dẫn** → **ý nghĩa lịch sử** → kết. Có phụ đề, nhạc trống trận tự tổng hợp và hạt phim.

## Xưởng phim: tự làm video từ kịch bản
1. Bấm **＋ Dự án mới từ kịch bản** (cột trái).
2. Chọn **phong cách**: Phim tài liệu · Viễn tưởng · Hoạt hình. Hình nền, chữ, chuyển cảnh và nhạc do app tự vẽ, tự tạo.
3. Chọn **chia tập** (60 giây / 90 giây / 3 phút / 10 phút) và **khung hình** (dọc 9:16 hoặc ngang 16:9).
4. **Tải file kịch bản** (.docx, .pdf, .srt, .txt, .md) hoặc **dán chữ**. App tự nhận diện:
   - dòng VIẾT HOA, "Cảnh 1…", "Phần 2…", "# …", tiêu đề trong Word/PDF → **tiêu đề cảnh**
   - dòng bắt đầu bằng "-", "•", "1." → cảnh **Ý chính**
   - đoạn trong ngoặc kép (có thể kèm "— Tác giả") → cảnh **Trích dẫn**
   - đoạn văn thường → cảnh **Thẻ nội dung** (tự cắt khoảng 40 chữ một cảnh)
5. Bấm từng cảnh để **sửa lời dẫn, đổi loại cảnh, thêm ảnh/video, thêm file giọng thu**, đưa lên/xuống, nhân đôi, xóa.
6. Chọn **tập** ở thanh trên rồi **Xuất video** lần lượt từng tập.

Dự án, ảnh, video, giọng được lưu ngay trong trình duyệt của máy (không gửi lên mạng). Đổi máy / xóa dữ liệu trình duyệt sẽ mất dự án.
Bản quyền: phần hình, chữ, nhạc do app tạo ra là của bạn; **nội dung kịch bản, ảnh, video, giọng bạn đưa vào** phải do bạn sở hữu hoặc được phép dùng.

## 0. Dùng như ứng dụng trên máy tính
1. Mở trang bằng **Chrome** hoặc **Edge** trên máy tính.
2. Bấm **⬇ Cài ứng dụng vào máy** (hoặc biểu tượng ⊕ cuối thanh địa chỉ) → app có biểu tượng trên màn hình, mở thành cửa sổ riêng, chạy cả khi không có mạng.
3. Chọn trận → chọn giọng (mặc định: *Giọng dẫn chuyện có sẵn*) → bấm **⬇ Xuất video** → chọn **thẻ này**, bật **Chia sẻ âm thanh của thẻ** → video tự ghi đến hết và lưu vào thư mục *Tải xuống* (.mp4 hoặc .webm).
   Phóng to cửa sổ (hoặc màn hình 2K/4K) để video nét hơn.

## 1. Làm video ngay trên điện thoại
1. Mở trang, chọn trận.
2. Chọn giọng: **Giọng dẫn chuyện (có sẵn)** – file thu sẵn trong `loi-dan/`, hoặc giọng tiếng Việt của máy (bản thường / bản trầm).
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
