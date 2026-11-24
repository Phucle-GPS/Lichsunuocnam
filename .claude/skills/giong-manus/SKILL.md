---
name: giong-manus
description: Giọng dẫn chuyện Manus của Xưởng film Lịch sử Việt Nam (câu lệnh nhận dạng "film Lịch Sử Việt Nam"). Dùng khi cần lời dẫn cho trận mới, nhân bản lại giọng Manus từ các bản cũ, đọc tự động, hoặc kiểm tra một file giọng có đúng giọng Manus không. CHỈ dùng trong Xưởng film Lịch sử Việt Nam.
---

# GIỌNG MANUS – XƯỞNG FILM LỊCH SỬ VIỆT NAM

Phạm vi: chỉ Xưởng film Lịch sử Việt Nam. Lời dẫn các trận CHỈ được dùng giọng Manus: bản mp3 Manus gửi, hoặc bản đọc tự động bằng giọng đã nhân bản từ chính các bản Manus đó. Không dùng giọng Google Translate hay TTS khác.

## Hồ sơ giọng (đo từ 48 đoạn Manus gốc, 9.1 phút – `loi-dan/GIONG.json` → `dac_tinh`)
- Nam trầm, ấm, kể chậm kiểu phim tài liệu; giọng Bắc.
- Cao độ trung vị **119.4 Hz** (dung sai ±12.0 Hz).
- Tốc độ trung bình **3.05 chữ/giây** (khoảng chấp nhận 2.28–4.12).
- Nghỉ trung bình **0.53 giây** ở dấu câu; âm lượng gốc khoảng -15.9 LUFS.
- Nghe mẫu: `loi-dan/giong-mau.mp3`; bộ mẫu nhân bản 3 phút: `loi-dan/nhan-ban/giong-manus-mau-3-phut.mp3`; thứ tự đoạn mẫu sạch nhất: `loi-dan/nhan-ban/thu-tu-mau.json`.

## Quy trình dùng lâu dài
1. **Nhân bản giọng (1 lần):**
   - Dòng lệnh: `ELEVENLABS_API_KEY=… node tools/giong-manus.mjs nhan-ban` → gửi 20 đoạn Manus sạch nhất lên ElevenLabs (Instant Voice Clone) → lưu `voice_id` vào `loi-dan/GIONG.json`.
   - Trong app: *Giọng Manus đã lưu* → nhập mã truy cập → **🧬 Nhân bản giọng từ các bản Manus cũ** (voice_id lưu trên máy đó).
   - Thủ công: tải `giong-manus-mau-3-phut.mp3` lên ElevenLabs (Voices → Instant Voice Clone), lấy voice_id → `node tools/giong-manus.mjs dat-id <voice_id>`.
2. **Đọc thử & kiểm tra:** `node tools/giong-manus.mjs thu` (tự so với hồ sơ giọng); kiểm tra file bất kỳ: `node tools/giong-manus.mjs kiem-tra <file.mp3> "lời đọc"`.
3. **Đọc lời dẫn trận mới:** `node tools/giong-manus.mjs tao <id-trận>` – chỉ đọc cảnh còn thiếu, giữ nguyên bản Manus gửi, cảnh nào lệch hồ sơ giọng sẽ được cảnh báo để nghe lại.
4. **Làm mẫu trước, đồng loạt sau:** xuất 1 video mẫu (`node tools/render-video.mjs <id>`), chờ người dùng duyệt rồi mới chạy `tao`/`render-video` cho cả loạt.
5. **Người dùng tự làm giọng rồi gửi file (mp3 / mp4 / m4a / wav, video thì lấy phần tiếng):**
   - Mỗi cảnh một file `<id-trận>_<NN>.<đuôi>`, hoặc mỗi trận một file `<id-trận>.<đuôi>` đọc liền các cảnh, nghỉ ~2 giây giữa cảnh → tự cắt theo khoảng lặng và độ dài lời dẫn.
   - Chạy thử trước: `node tools/nap-giong-manus.mjs <file|thư-mục|zip> --thu` (ra `giong-nhap/thu-nap/`), ổn thì chạy lại không có `--thu` để nạp vào `loi-dan/`. Mỗi cảnh được so với hồ sơ giọng Manus.
6. Chưa có khóa: `node tools/nap-giong-manus.mjs --yeu-cau` → gửi `loi-dan/CAN-GUI-MANUS.txt` cho Manus → `node tools/nap-giong-manus.mjs goi.zip`.

## Lưu ý
- Không ghi mã truy cập vào repo; dùng biến môi trường hoặc Network secrets của môi trường.
- Bản nhân bản là giọng AI do Manus tạo cho dự án này – chỉ dùng cho kênh của người dùng, khai báo "nội dung có AI" khi đăng.
- Phân tích lại hồ sơ khi có thêm bản Manus mới: `python3 tools/phan-tich-giong.py hoso`.
