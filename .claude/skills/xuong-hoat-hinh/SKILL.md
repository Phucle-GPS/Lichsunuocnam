---
name: xuong-hoat-hinh
description: Xưởng film hoạt hình của app Xưởng Video – phim người que (stickman) và các phong cách Hoạt hình/Cổ tích/Làng quê/Vũ trụ: dựng từ kịch bản hoặc từ trận lịch sử, chọn hành động người que, viết prompt hoạt hình 2D cho Veo/Flow theo "era pack" Đại Việt. Dùng khi nói "phim hoạt hình", "người que", "stickman", "prompt hoạt hình".
---

# XƯỞNG FILM HOẠT HÌNH

## Trong app (không cần AI ngoài)
- `engine.js` → `SCENES.stick` + `STICK_ACTS`: noi, di, chay, danh (kiếm – giáo), hanhquan, cheo, ban, cuoingua, phatco, vui, nghi. Quân ta: nón lá, dải đỏ; giặc: mũ trụ (`side: 'giac'`). Mọi chuyển động tính từ t.
- `lib/xuong.js` → `guessAction(text)` nhận hành động từ lời dẫn (thêm từ khóa vào `ACT_RX`).
- Dựng phim từ trận mẫu: `cloneStick()` trong `index.html` (giữ giọng Manus, khối + tỉ trọng `w`).
- Phong cách nền: `styleBG` (tailieu, hoathinh, cotich, langque, vutru, vientuong).
- Người dẫn ở góc (`opts.pip`), thẻ giới thiệu góc dưới (`sc.lower`), hiệu ứng chữ `go`.

## Skill nguồn mở đi kèm (MIT)
- `.claude/skills/directing-stickman-videos/` (kaomei/stickman-video-director): quy trình đạo diễn phim người que, 15 phong cách, mẫu storyboard, **A5 Historical Cartoon** (ngữ pháp vẽ cố định + era pack).
- `.claude/skills/animate/` (cth9191/animate): phim hoạt hình thủ tục bằng canvas, nhiều phong cách (cut paper, ink, riso, pixel…), có công cụ review.

## Era pack ĐẠI VIỆT (dùng với A5 khi viết prompt Veo/Flow)
- **Thời/nơi:** Đại Việt thời Trần (thế kỷ 13), sông Bạch Đằng, Vạn Kiếp, Thăng Long; ghi rõ năm của trận.
- **Quân Đại Việt:** nón lá hoặc khăn chít, áo vải nâu/chàm cổ đứng, thắt lưng đỏ, giáo cán gỗ, khiên mây, chữ "Sát Thát" chỉ được gợi bằng nét mực trừu tượng (KHÔNG chữ đọc được).
- **Tướng:** áo giáp vảy đồng, khăn đỏ, cờ hiệu đỏ viền vàng (không chữ).
- **Quân Nguyên:** mũ trụ có chóp lông, áo da, cung ngắn, ngựa thảo nguyên – vẽ như nhân vật hoạt hình, không bôi nhọ dân tộc.
- **Bối cảnh:** sông nước triều cường, bãi cọc gỗ, thuyền chiến mũi cong, núi đá vôi, rừng tre.
- **Màu:** đỏ son, vàng đồng, nâu đất, xanh chàm, xanh rêu, xám sông.
- **Nhạc:** trống trận, kèn, sáo, đàn bầu (phòng nhạc: Hùng ca / Bi tráng / Cung đình).
- **Sự thật:** tách lời dẫn có nguồn và cảnh minh họa; không bịa câu nói hay số liệu.
