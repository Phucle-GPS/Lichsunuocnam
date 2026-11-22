---
name: xuong-nhac-ai
description: Câu lệnh nhận dạng "nhạc AI tự động". Xưởng nhạc AI tự động của app Xưởng Video – mỗi ngày sáng tác 2 bài EDM có lời (tiếng Việt, bắt tai, nguyên tác), lưu vào nhac-ai/<ngày>/, dựng bản demo nhạc nền bằng bộ tổng hợp của app và (nếu có khóa) bản có giọng hát qua ElevenLabs Music hoặc MiniMax Music. Dùng cho lịch chạy hằng ngày hoặc khi người dùng nói "viết nhạc EDM", "sáng tác bài mới", "tạo bài hát có lời".
---

# XƯỞNG NHẠC AI TỰ ĐỘNG

Phạm vi: khi người dùng gọi "nhạc AI tự động" CHỈ làm trong Xưởng nhạc AI tự động – không tạo mục mới ở 2 xưởng còn lại hay ở thanh bên phải.

## Mỗi lần chạy (hằng ngày)
1. `node tools/nhac-ai.mjs mau` → in khung JSON và danh sách đề tài đã dùng (tránh trùng).
2. Viết **2 bài EDM mới**, mỗi bài một file `nhac-ai/<YYYY-MM-DD>/<slug>.json` đúng khung (xem dưới).
3. `node tools/nhac-ai.mjs render <YYYY-MM-DD>` → bản demo nhạc nền `*-demo.mp3` (tự tổng hợp, không cần mạng) và, nếu có `ELEVENLABS_API_KEY` hoặc `MINIMAX_API_KEY`, bản có lời `*-loi.mp3`. Cuối cùng tự cập nhật `nhac-ai/index.json`.
4. Commit `nhac-ai/` và push lên `main`.

## Khung JSON một bài
```json
{ "title": "Tên bài", "date": "2026-11-23", "genre": "EDM", "subgenre": "future bass | progressive house | tropical house | melodic dubstep | big room",
  "bpm": 124, "key": "La thứ", "mood": "…", "language": "vi", "theme": "đề tài 1 câu",
  "lyrics": "[Intro]\n…\n[Verse 1]\n…\n[Pre-Chorus]\n…\n[Chorus]\n…\n[Drop]\n(nhạc)\n[Verse 2]\n…\n[Chorus]\n…\n[Outro]\n…",
  "hook": "câu điệp khúc dễ nhớ nhất",
  "style_prompt": "English style prompt for the music model: genre, bpm, instruments, vocal type, energy arc, mix",
  "nhac": { "style": "edm", "key": 9, "tempo": 124, "seed": 123456, "lead": "pluck" } }
```

## Chuẩn chất lượng
- Lời **nguyên tác**, tiếng Việt có dấu, 1 hook ngắn lặp ở điệp khúc, câu 5–9 chữ, vần cuối câu; không chép lời/giai điệu bài có thật, không nhắc tên ca sĩ/nghệ sĩ trong `style_prompt` (dịch vụ sẽ từ chối và vi phạm bản quyền).
- Đề tài tích cực, hợp đăng mạng xã hội: tuổi trẻ, quê hương, lễ hội, tình yêu, vượt khó, mùa, thành phố đêm… Hai bài trong ngày phải khác thể loại con và tâm trạng.
- BPM 100–128; cấu trúc có Drop sau điệp khúc; độ dài mục tiêu 2:30–3:00.
- `nhac.key` là số 0–11 (0 = Đô), `nhac.seed` ngẫu nhiên.

## Giấy phép
Bản demo do app tự tổng hợp: dùng tự do. Bản có lời tạo bằng ElevenLabs/MiniMax: theo điều khoản gói trả phí của dịch vụ (kiểm tra trước khi kiếm tiền).
