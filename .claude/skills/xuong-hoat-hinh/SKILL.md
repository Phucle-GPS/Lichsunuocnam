---
name: xuong-hoat-hinh
description: Xưởng film hoạt hình của app Xưởng Video. Câu lệnh nhận dạng "film hoạt hình". Phim hoạt hình 2D dựng từ kịch bản với các phong cách Hoạt hình, Cổ tích, Làng quê, Vũ trụ; hoạt hình Lottie/Rive; phim hoạt hình bằng code (skill animate). CHỈ làm trong xưởng này khi người dùng gọi "film hoạt hình".
---

# XƯỞNG FILM HOẠT HÌNH  (câu lệnh nhận dạng: "film hoạt hình")

Phạm vi: chỉ thay đổi những gì thuộc xưởng này – dự án `xuong: 'hh'`, `xuong/hoat-hinh.json`, skill này. Không thêm mục vào Xưởng film Lịch sử Việt Nam hay Xưởng nhạc AI tự động.

- Dự án mới: nút **＋ Phim hoạt hình mới** (cột trái, xưởng hoạt hình) → kịch bản (.docx/.pdf/.srt/.txt hoặc dán chữ).
- Phong cách nền: `styleBG` trong `engine.js` – hoathinh, cotich, langque, vutru, vientuong.
- Người que kiểu nét đơn của xưởng này: `stickFigClassic` / `drawHorseClassic` (`SCENES.stick` dùng khi `B.xuong === 'hh'`). Kiểu A5 thuộc Xưởng Lịch sử, không dùng ở đây.
- Hoạt hình chèn cảnh: Lottie (.lottie/.json), Rive (.riv) – nút *Thêm hoạt hình* trong cảnh.
- Phim hoạt hình bằng code: skill `.claude/skills/animate/` (MIT, cth9191/animate).
