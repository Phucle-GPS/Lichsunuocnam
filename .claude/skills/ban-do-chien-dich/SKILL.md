---
name: ban-do-chien-dich
description: (Xưởng film Lịch sử Việt Nam – câu lệnh nhận dạng "film Lịch Sử Việt Nam") Dựng video lịch sử, trận đánh, chiến dịch theo phong cách BẢN ĐỒ CHIẾN DỊCH bằng HyperFrames – bản đồ 3D địa hình thật làm xương sống, tướng/cờ/lính/ngựa là MÔ HÌNH 3D có khớp (ngựa phi, lính bước, cờ vải bay), mũi tên tiến quân, lửa + khói, máy bay ném bom (chỉ trận thế kỷ 20), đất cháy ở lại sau trận, xen ảnh tư liệu, chuyển cảnh mực bắn; render, tự kiểm phim (clip thiếu, tư liệu lặp, đường dẫn máy) và kiểm độ mượt; xuất bản xem nhẹ. Dùng khi người dùng nói "dựng bản đồ chiến dịch", "làm video HyperFrames trận…", "bản đồ 3D trận…", "render video mẫu <trận>", "làm tiếp phim bản đồ", "sửa video bản đồ bị giật/che/không thật".
---

# BẢN ĐỒ CHIẾN DỊCH (HyperFrames) – Xưởng film Lịch sử Việt Nam

Chỉ dùng trong Xưởng film Lịch sử Việt Nam. **Làm từng trận một, làm 1 tập mẫu cho người dùng duyệt trước** – không tự chạy hàng loạt, dừng ngay khi người dùng nói "dừng". Trận mẫu đã duyệt chất lượng: `chi-lang-1427` (xem `maps/chi-lang-1427/kich-ban-ban-do.json`).

## Quy trình nhanh (khi được gọi "render video mẫu <id>" / "làm tiếp")
```bash
# 0. (lần đầu trên máy) cài: cd hyperframes && npm install ; cd tools && npm install && npx playwright install chromium
node tools/ban-do.mjs <id>                              # nếu chưa có maps/<id>/nen-3d.jpg, do-cao.png, tuyen.json
# viết/sửa maps/<id>/kich-ban-ban-do.json  (bám lời dẫn – xem mục Kịch bản)
node tools/hf-tap.mjs <id>                              # → hyperframes/<id>/ (tự sinh, không commit)
node tools/kiem-phim.mjs hyperframes/<id> --hf          # phải "Không có lỗi"
cd hyperframes && npx hyperframes snapshot <id> --at <các giây> --no-end -o <thư mục tạm>   # XEM KHUNG trước khi render dài
cd hyperframes/<id> && HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1 node ../node_modules/hyperframes/bin/hyperframes.mjs render -o ../<id>.mp4
node tools/kiem-muot.mjs <id> --ban-xem                 # đo giật/khựng + xuất hyperframes/<id>-xem.mp4 (<30 MB) gửi người dùng
```
**Gọn nhất – một lệnh cho cả tập** (dùng khi làm nhiều trận, ít bảng hỏi quyền):
```bash
node tools/tap-ban-do.mjs <id> --snap 25,40,55,70,84        # dựng + kiểm + chụp khung → hyperframes/_snap/<id>/contact-sheet.jpg
node tools/tap-ban-do.mjs <id> --render --app                 # dựng + kiểm + render + kiểm mượt + bản xem + đưa lên app
```
- **Đưa lên app**: `node tools/phim-ban-do-app.mjs <id>` → `phim-ban-do/<id>.mp4` (720p ~14–16 MB) + `<id>.jpg` + `phim-ban-do/danh-sach.json`. App (cột Xưởng Lịch sử → "Phim bản đồ chiến dịch") đọc danh sách và phát trong hộp thoại. Commit cả thư mục `phim-ban-do/` (app trên GitHub Pages). Gỡ: `--xoa`.
- Render ~6 phút cho 95 giây phim → chạy nền, báo người dùng đang render.
- Windows: gọi HyperFrames bằng `node …/hyperframes/bin/hyperframes.mjs` (không có `.bin/hyperframes` chạy trực tiếp). Đường dẫn ổ `C:` trong bộ lọc ffmpeg bị hiểu sai dấu `:` → ghi file tương đối (công cụ đã xử lý).
- Bản gốc 1080p (~150–190 MB) chỉ xem được trên máy; **luôn gửi bản `-xem.mp4`** bằng SendUserFile để người dùng xem trên điện thoại/web.

## BẢN ĐỒ CỔ – bắt buộc (người dùng yêu cầu: "tận dụng maps thời xưa, bỏ qua OpenStreetMap")
- `maps/<id>/region.json` có `"che_do": "co"` → **không dùng OpenStreetMap** (toàn đối tượng hiện đại: hồ chứa, kênh đào, bờ biển ngày nay). Nền vẽ kiểu bản đồ cổ (giấy dó, núi mực nâu, đường bờ nét mực + nét sóng, tên sông chữ nghiêng Times New Roman – Georgia thiếu dấu Việt).
- `song_xua: [{ten, rong_m, diem:[[lon,lat]…] (thượng nguồn → hạ lưu), hut_thung_lung (m, 0 = vẽ cong trơn cho sông đồng bằng phẳng), nhan}]` – mỗi đoạn giữa 2 điểm được dò **men đáy thung lũng** trên địa hình thật.
- `muc_nuoc_co` (m) + `bien_tai: [[lon,lat]]`: biển xưa = loang từ ngoài khơi qua mọi điểm thấp hơn mực nước cổ (vùng trũng nội địa không ngập). Châu thổ Bắc Bộ thế kỷ 10–13: ~2 m.
- `ho_xua`, `cu_lao` (đảo đất giữa sông – nơi mai phục, thuyền đi vòng).
- Độ rộng sông có thuyền: **phóng đại** (rong_m là độ rộng hiển thị) để đội thuyền vừa lòng sông; ghi rõ trong `ghi_chu`.
- `ban-do.mjs` **tự kiểm chứng** và thoát mã 1 nếu: sông chảy ngược dốc > 20 m (vắt qua đồi – in tọa độ chỗ sai), hoặc tuyến thủy có điểm trên cạn. Có lọc gai địa hình (dữ liệu có điểm nhiễu 5000 m). Xuất `nuoc.bin` (640×360, 1 = nước) để công cụ viết kịch bản kiểm điểm đặt.
- Sông không có trong lời dẫn mà không chắc dòng chảy → **bỏ**, đừng vẽ đoán.

## THUYỀN CHỈ ĐI TRÊN NƯỚC – bắt buộc (lỗi người dùng đã chỉ ra: "thuyền di chuyển trên đất liền là sai")
- Đường thuyền trong kịch bản: lấy từ tuyến thủy rồi **hút từng điểm vào lòng nước** (điểm và 4 điểm cách 5 px đều là nước); không lấy điểm sát bờ. Qua sông hẹp: chỉ lấy điểm nước.
- Máy dựng tự thu hẹp đội hình khi sông hẹp (không lấn bờ); phục binh rơi xuống nước tự lên bờ gần nhất.
- `node tools/kiem-thuy.mjs <id>` tua cả cảnh trên chính máy dựng 3D, báo từng thuyền trên cạn → phải ✔ mới render (`tap-ban-do.mjs` tự chạy, lỗi là dừng).
- Mặt nạ nước được làm sạch (bỏ chấm đất vụn giữa nước) để mặt nạ, bản đồ độ cao và kiểm thủy cùng một định nghĩa.

## Phong cách
| Thành phần | Cách làm |
|---|---|
| **Xương sống: bản đồ 3D** | Địa hình thật (AWS Terrain Tiles) phóng đại ×2,6, phủ nền 2K (màu độ cao, bóng núi, sông hồ OSM). Mép bản đồ hạ dần về 0; ngoài mép là ảnh nền lặp đối xứng (liền mép) → không lộ "tấm bản đồ" trơ trọi. Sương xa nhạt, theo khoảng cách máy quay (không phủ xám đen). |
| **Tướng, cờ, lính, ngựa (MÔ HÌNH 3D)** | `doan_quan`: tướng cưỡi ngựa, cờ vải có chữ (`co`) bay ra sau; kỵ binh (`ngua`) hàng 2 sau tướng; bộ binh (`linh`) hàng 3 sau kỵ binh, bước đi. Ta: áo đỏ, nón chóp đan, khiên tròn; quân Minh/địch: áo xanh, mũ trụ sắt chóp nhọn tua đỏ, khiên chữ nhật. Ngựa phi nước đại 4 chân lệch pha. `nga_tai`: tướng + ngựa đổ nghiêng, lính đổ theo. Bóng đổ dưới chân. Cỡ: `ti_le_nguoi` (mặc định 4,4; tướng ×1,45). |
| **Phục binh / cờ cắm** | `phuc_binh`: 5 lính trồi lên từ sườn núi + cờ, tự quay mặt về đường hành quân gần nhất (`huong_toi: [x,y]` để chỉ định). `co_cam`: cờ cắm trồi lên khi chiếm được. |
| **Thủy quân** | `doan_quan` có `phuong_tien: "thuyen"`: `thuyen` (số thuyền, 2 hàng), `lon: true` = lâu thuyền phương Bắc (buồm cánh dơi, lầu đuôi, 3 lính), mặc định thuyền nhẹ của ta (mái chèo khua nhanh khi đi). Thuyền tướng có cờ chữ. `dam_tai` + `ti_le_dam` (0..1): thuyền nghiêng, chìm lần lượt; `chay: true` bốc cháy khi đắm; `nga_tai` = thuyền tướng chìm. Cỡ: `ti_le_thuyen` (mặc định 0,6 × `ti_le_nguoi`). Tuyến thủy nên khai `cachDi: "thuy"` trong region.json. |
| **Bãi cọc** | `coc: [{tu, den, be_rong, so, huong_nghieng, t0, t_lo, lo_trong, ngap}]`: cọc gỗ đầu bịt sắt chĩa về `huong_nghieng` [dx,dy]; ngập khi triều lên, lộ dần từ `t_lo` (nước rút). Cảnh sau trận cọc lộ hẳn. |
| **Voi chiến** | `voi: n` trong đoàn quân (đi trước bộ binh); `cuoi: "voi"` = tướng cưỡi voi (bành, lọng, cờ). Voi đi bước chậm, vòi đung đưa. |
| **Con vật khác** | Thêm hàm `taoX` cùng kiểu `taoNgua`/`taoVoi` trong `bando3d.js` khi trận cần. Không dùng sprite 2D phẳng cho người/vật. |
| **Mũi tên tiến quân** | `mui_ten` mọc dần, bám mặt đất; ta đỏ `#c8352b` nét liền, địch xanh `#1f5fa8` nét đứt. |
| **Máy bay ném bom** | CHỈ trận thế kỷ 20 (Điện Biên Phủ 1954, ĐBP trên không 1972…). Trận cổ – trung đại tuyệt đối không có máy bay. |
| **Lửa, khói, đất cháy** | `lua`: lưỡi lửa mềm + quầng sáng + khói bốc (cỡ theo `ban_kinh`), co giãn liên tục theo t; sau đó vết cháy đen ở lại; cảnh `sau_tran` hiện toàn bộ vết cháy + cờ đã cắm. |
| **Nhãn** | Địa danh nằm dưới; nhãn diễn biến (`nhan`) nổi cao hơn, có đường dẫn xuống điểm, đè lên địa danh thì địa danh mờ đi. Nhãn mờ dần ở mép khung và vùng phụ đề (không bật/tắt). Cảnh sau trận chỉ hiện địa danh. |
| **Xen ảnh tư liệu** | Ảnh thật ở `anh/<id>/` (chú thích + nguồn, giấy phép) – mở đầu, nhân vật, trích dẫn, kết. Ken Burns chậm. |
| **Chuyển cảnh mực bắn** | Vệt mực mép tròn mềm (đường cong qua trung điểm, hạt giống cố định) + giọt bắn ra trước, loang kín ~0,6 s, rồi mờ dần 0,7 s sang cảnh sau. |

## Kịch bản bản đồ (`maps/<id>/kich-ban-ban-do.json`)
Thời gian theo đồng hồ cảnh bản đồ (bắt đầu ở đoạn giọng 3, dài = giọng 3+4+5 + 3 giây). **Bám đúng lời dẫn: câu nào nói gì thì trên bản đồ hiện đúng cái đó** (đối chiếu phụ đề trong `hyperframes/<id>/compositions/phu-de.html`, đổi sang đồng hồ cảnh = giây phim − data-start của cảnh `ban-do`).
- `may_quay`: `[t, x, y, xa, nghiêng°, xoay°]` (x, y = điểm nhìn trên nền 2K 2560×1440). Máy quay đi theo spline Hermite → **không khựng ở mỗi khóa**; muốn dừng hẳn thì đặt 2 khóa giống nhau.
  - Nghiêng **54–70°** (dưới `nghieng_toi_thieu` = 46° bị chặn); thấp hơn sẽ thấy chân trời, nửa khung trống.
  - Cảnh toàn vùng: `xa` ≈ 740–800, nghiêng 68–70, xoay 0. Cận cảnh giao chiến: `xa` 320–440, nghiêng 52–58.
  - Mọi lực lượng đang được nhắc trong lời phải nằm trong khung (vd. "Mộc Thạnh theo đường Vân Nam" → khung phải rộng sang mép trái).
  - `may_quay_sau` (cảnh sau trận): đẩy các điểm chính sang PHẢI khung – khối chữ tổng kết nằm bên trái phía dưới (x 110–1200 px, đáy 210 px).
- `doan_quan` `{ten, ben, tuong, co, duong, t0, cho, t1, linh, ngua, gian_cach, nga_tai, an_sau}` · `mui_ten` `{duong, ben, net:"dut", t0, t1, day, bat_dau, an_sau}` · `phuc_binh` `{xy, ben, t0, so, huong_toi}` · `lua` `{xy, ban_kinh, t0, t1, ngon}` · `co_cam` `{xy, ben, t0}` · `nhan` `{xy, chu, ben, t0, t1}` · `chu_co_ta`, `an_dia_danh`, `ti_le_nguoi`, `nghieng_toi_thieu`, `phong_dai_do_cao`.
- `duong`: số = tuyến trong `tuyen.json`, hoặc danh sách điểm `[[x,y],…]`.

## Kiểm tra chất lượng (bắt buộc trước khi gửi)
1. `kiem-phim --hf`: clip thiếu, tư liệu lặp, đường dẫn máy, HyperFrames check.
2. **Snapshot** các mốc: đầu cảnh bản đồ, từng câu lời dẫn quan trọng, lúc giao chiến, cảnh sau trận. Xem bảng ghép (`contact-sheet.jpg`) và **phóng to vùng giao chiến** (ffmpeg crop) để kiểm người/ngựa/lửa. Soát: bản đồ có bị che/tối, mép lộ, nhãn đè nhau, chữ đè điểm chính, lực lượng được nhắc có trong khung không.
3. Sau render: `kiem-muot <id>` phải "Không có chỗ giật/khựng ngoài vùng cố ý". Nếu có: nhãn bật/tắt → làm mờ dần; máy quay khựng → bớt khóa/đặt khóa đều; vật đổi hình rời rạc → đổi sang biến đổi liên tục theo t.
4. Gửi `-xem.mp4`, liệt kê đã sửa gì, chờ duyệt. Chưa duyệt thì chưa commit, chưa làm trận khác.

## Bài học từ trận mẫu Chi Lăng (lỗi người dùng đã chỉ ra – không lặp lại)
- "Bản đồ bị che, không hiện hết": do sương mù cố định (near 700) + máy quay xa 1250 + nghiêng thấp 36–40° → mở cảnh xám đen, nửa trên là chân trời. → sương theo `xa`, nghiêng ≥ 54°, mép bản đồ liền.
- "Chuyển cảnh giật lag": máy quay nội suy từng đoạn có tăng/giảm tốc riêng (dừng ở mỗi khóa), nhãn bật/tắt, lửa đổi khung 10 hình/s, mực bắn đa giác răng cưa. → spline Hermite, mọi thứ mờ/co giãn liên tục, mực mép mềm + mờ dần.
- "Người và ngựa nhìn không thật": sprite que 2D. → mô hình 3D có khớp + bóng đổ (người que A5 chỉ dùng trong phim tài liệu `render-video.mjs`, không dùng trên bản đồ 3D).
- Muốn thật hơn nữa (mô hình glTF chi tiết) phải tải tài sản bên ngoài có giấy phép → hỏi người dùng trước.

## Luật HyperFrames (bắt buộc)
- Mỗi phần tử có thời gian: `class="clip"`, `id`, `data-start`, `data-duration`, `data-track-index`. Không tween chính `.clip` – tween phần tử con.
- Timeline: `gsap.timeline({ paused: true })`, đăng ký `window.__timelines["<id>"]` cuối cùng; dùng `fromTo`, không `from` (tween thứ hai trên cùng thuộc tính: `immediateRender: false`).
- Cấm `Date.now`, `Math.random` không hạt giống, `setTimeout`, tải mạng (fetch/CDN), trạng thái nhớ giữa các khung (phải tua tới bất kỳ t nào cũng ra đúng hình). Mọi tài nguyên trong `assets/`. Dữ liệu bản đồ qua `assets/du-lieu.js`.
- Three.js vẽ theo `t` (`bd.ve(t)` gọi từ tween), dựng nặng đợi bằng `window.__hf.buildReady[...]`.
- Font Việt: `@font-face` trỏ `assets/fonts/` (font sẵn của HyperFrames thiếu dấu).
- Không gửi telemetry: `HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1`.

## Tệp
- `hyperframes/_chung/bando3d.js` – máy dựng bản đồ 3D (`window.BanDo3D(khung, {nen, doCao, du_lieu, kich_ban, sau_tran}) → {ve(t)}`): địa hình, mô hình `taoNguoi`/`taoNgua`/`taoCo`, tư thế `tuThe`/`tuTheNgua`/`bayCo`, kho mô hình `lay()`, máy quay `mayQuay`, nhãn.
- `tools/tap-ban-do.mjs` (chạy trọn quy trình 1 tập), `tools/phim-ban-do-app.mjs` (đưa phim lên app), `tools/hf-tap.mjs` (dựng dự án 6 cảnh + phụ đề + mực bắn + nhạc Hùng ca), `tools/kiem-phim.mjs` (kiểm trước render), `tools/kiem-muot.mjs` (kiểm độ mượt sau render + bản xem), `tools/ban-do.mjs` (nền bản đồ).
- `hyperframes/package.json` (cần Node 22+, FFmpeg). Nhạc nền Hùng ca lưu ở `maps/<id>/nhac-nen.mp3` (commit kèm trận); chỉ trận chưa có file này mới cần Chromium của Playwright để `hf-tap` sinh nhạc. `hyperframes/<id>/` và `*.mp4` không commit (đã có trong `.gitignore`).
