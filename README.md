# Xưởng Video

Ứng dụng dựng video từ kịch bản (phim tài liệu, viễn tưởng, hoạt hình), kèm bộ mẫu *Sử Việt · Trận đánh lừng danh*.

Trang web: `https://phucle-gps.github.io/Lichsunuocnam/` (kho riêng `Phucle-GPS/Lichsunuocnam`, bật GitHub Pages từ nhánh `main`)

Mỗi video gồm các cảnh dựng tự động: **tiêu đề** trên nền tranh cổ → **nhân vật** (hoa văn trống đồng) →
**bản đồ** (Đại Việt tô đỏ, đường tiến quân, có QĐ. Hoàng Sa – Trường Sa) → **tương quan lực lượng** →
**sơ đồ diễn biến** (thủy triều, bãi cọc, phục binh, mũi tên tiến công; ta đỏ – địch xanh như sách giáo khoa) →
**trích dẫn** → **ý nghĩa lịch sử** → kết. Có phụ đề, nhạc trống trận tự tổng hợp và hạt phim.

> Giọng dẫn chuyện hiện tại của bộ mẫu *Trận đánh lừng danh*: giọng nam trầm, ấm, tạo bằng Manus từ file `loi-dan/GUI-MANUS.txt` (48 đoạn, `loi-dan/<id>/01–08.mp3`).

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

## Ba xưởng trong một app
Cột trái chia thành 3 xưởng. **Gọi tên xưởng nào thì chỉ làm việc trong xưởng đó** – câu lệnh nhận dạng: *film Lịch Sử Việt Nam* · *film hoạt hình* · *nhạc AI tự động*. Mỗi xưởng có nút **🧰** gom đủ **lệnh, skill, prompt và nguồn mở** của riêng nó (khai báo trong `xuong/*.json`).

| Xưởng | Có gì |
|---|---|
| 🏯 **Film Lịch sử Việt Nam** | Dự án lịch sử của bạn, **bộ 40 trận đánh lừng danh** (năm 40 → 1894). Giọng Manus, bản đồ, sơ đồ trận, prompt Veo/Flow, Blender, phim 3D. Skill `xuong-phim-lich-su`. **Phim người que A5** (skill MIT kaomei/stickman-video-director): dựng trong app, prompt Veo/Flow, gói Google Flow (`tools/goi-flow.mjs`). |
| 🎧 **Nhạc AI tự động** | Mỗi ngày 2 bài **EDM có lời** tiếng Việt do lịch chạy tự động sáng tác: lời, hook, prompt phong cách, bản demo nhạc nền. Có khóa MiniMax/ElevenLabs thì có thêm bản hát. Nút *Làm nhạc nền* đưa bài vào phim. Skill `xuong-nhac-ai`, lệnh `tools/nhac-ai.mjs`. |
| 🎨 **Film hoạt hình** | Phim hoạt hình 2D từ kịch bản (Hoạt hình, Cổ tích, Làng quê, Vũ trụ), Lottie/Rive, skill MIT `animate`. Skill `xuong-hoat-hinh`. |

**Đăng YouTube** (thanh trên): nhập OAuth Client ID của bạn một lần (có hướng dẫn trong hộp) → kết nối kênh → video vừa xuất được tải lên. Tiêu đề, mô tả (có chương), thẻ, ảnh bìa đã soạn sẵn. Đăng được ngay hoặc hẹn giờ, có khai báo nội dung do AI tạo.

## Phim hoạt hình người que lịch sử · nhạc AI tự sáng tác
- **🕺 Dựng phim hoạt hình người que từ trận này** (bảng *Dự án* của mỗi trận mẫu): app giữ giọng Manus, bản đồ và sơ đồ trận, rồi xen các cảnh người que diễn đúng lời dẫn. Thẻ cảnh và giọng của từng khối khớp nhau.
- **Người que đề tài lịch sử:** quân ta đội nón lá, quân giặc đội mũ trụ; vũ khí gồm kiếm, giáo, cung, cờ. Các cảnh: hành quân, chèo thuyền chiến, bắn cung (tên bay), cưỡi ngựa xung trận, giao chiến kiếm – giáo, chỉ huy phất cờ, ăn mừng, chạy, đi, suy nghĩ, kể chuyện bên bảng. App tự nhận hành động từ lời dẫn (chèo, thủy quân, kỵ binh, bắn tên, hành quân, truyền hịch…).
- **Người dẫn người que ở góc** (mục *Hiển thị*): người que khăn đóng kể chuyện ở góc trái dưới trong các cảnh bản đồ, sơ đồ, số liệu. Công cụ dòng lệnh: thêm `--nguoi-dan`.
- **Thẻ giới thiệu nhân vật ở góc dưới:** tên, chức danh và 2 cặp nhãn/giá trị, sửa được trong từng cảnh.
- **Hiệu ứng chữ Gõ chữ từng ký tự.**
- **Nhạc nền:**
  - Phòng nhạc có thêm *Hùng ca chiến trận*, *Bi tráng* (đàn bầu) và *Nhã nhạc cung đình*.
  - *✨ AI tự sáng tác bài mới cho phim này* chọn thể loại hợp nội dung và tạo một bài hoàn toàn mới.
  - *📁 Tải nhạc AI của bạn* (mp3/wav, ví dụ nhạc tự tạo bằng công cụ AI có quyền dùng): nhạc tự lặp theo độ dài phim.
  - Nhạc **tự hạ khi có giọng đọc** và nâng lại ở khoảng nghỉ, cả trong app lẫn khi xuất bằng `render-video.mjs`.

## Video giải thích / podcast: thẻ thông tin, dự án khối, chuẩn âm lượng
- **6 kiểu thẻ mới:** Mở chương, Cảnh báo, Chuỗi bước (nguyên nhân → hệ quả), Danh sách tự kiểm tra, So sánh hai bên, Chữ/con số thật to. Bọc cụm từ trong `*dấu sao*` để tô màu nổi bật.
- **Kịch bản chia khối:** dán hoặc tải file có dòng `=== AVATAR 01 ===`, `=== SLIDE 02 ===`. Mỗi khối thành một cảnh mang mã khối.
- **Nạp nhiều file giọng cùng lúc:** chọn một lúc nhiều file. App khớp theo mã khối (`AVATAR-01.mp3`, `SLIDE-02_full.mp3`) hoặc theo số thứ tự (`01.mp3`).
- **Nhập dự án khối:** `timeline.json`, hoặc file `.zip` gồm `timeline.json`, kịch bản khối và các thư mục `voice/`, `images/`, `stock/`, `avatar/`. Mỗi khối có một file giọng; các thẻ trong khối chia nhau thời lượng giọng theo tỉ trọng `w`. Lời dẫn được chia theo câu để làm phụ đề. Ảnh, video và giọng được nạp tự động.
- **Chuẩn âm lượng:** `tools/render-video.mjs` chuẩn hóa tiếng về −14 LUFS (đỉnh −1,5 dBTP), mức YouTube, Facebook và TikTok dùng.

## Phong cách Cổ tích · Làng quê · Vũ trụ, người que, YouTube dài
- **Dự án mới từ kịch bản** có thêm 3 phong cách. Mỗi phong cách có nền vẽ động, màu chữ, chuyển cảnh và nhạc nền riêng:
  - **Cổ tích:** trăng rằm, cây đa, mái đình, đom đóm, nhạc hộp nhạc.
  - **Làng quê:** lũy tre, ruộng lúa, con đò, cánh diều, cò bay, nhạc ngũ cung.
  - **Vũ trụ:** ngân hà, thiên hà xoắn ốc, Trái Đất, sao chổi, nhạc nền vũ trụ.
- **Người que hành động:** bật *Minh họa bằng người que* khi tạo dự án, app tự đọc lời dẫn để chọn hành động: đánh nhau, chạy, đi bộ, suy nghĩ, ăn mừng hoặc thuyết trình (người que chỉ vào bảng chữ). Mỗi cảnh cũng đổi được sang *Người que hành động* và tự chọn hành động.
- **YouTube video dài:** bảng *Dự án* → **▶ Chương & mô tả YouTube**. App tự chia chương theo đúng thời lượng phim (mốc đầu 00:00, mỗi chương ≥ 10 giây), soạn sẵn tiêu đề, mô tả có chương, nguồn tham khảo và thẻ. Có nút chép từng phần hoặc tải gói .txt.

## Giọng dẫn chuyện: chỉ dùng giọng Manus
Mục **Trận đánh lừng danh** chỉ dùng giọng nam trầm của **Manus**. Giọng đã được **lưu vào app** (`loi-dan/GIONG.json`, nghe mẫu `loi-dan/giong-mau.mp3`) nên không cần gửi Manus mỗi lần.

**Trong app:** bảng phải → *Giọng & âm thanh* → **🎙 Giọng Manus đã lưu**. Nhập API key (chỉ lưu trên máy đó) và voice_id một lần. Sau đó, trong dự án của bạn, bấm **🎙 Giọng Manus** ở từng cảnh hoặc **Đọc lời dẫn mọi cảnh bằng giọng Manus**.

**Dòng lệnh (trận mẫu):**
1. Chọn giọng một lần: `node tools/giong-manus.mjs dat-id <voice_id>`. Nếu chưa có voice_id, chạy `thiet-ke`, nghe các file trong `giong-nhap/thiet-ke/`, rồi chạy `chon <số>`. Script gốc của Manus: `tools/create_male_voice_elevenlabs.py`.
2. Thêm trận vào `battles.js` → `ELEVENLABS_API_KEY=… node tools/giong-manus.mjs tao <id>`. Lệnh chỉ đọc những cảnh còn thiếu; bản Manus gửi trước đó được giữ nguyên.
3. `node tools/render-video.mjs <id>`. Trận chưa đủ giọng Manus sẽ **không được xuất**.

Không có key thì vẫn làm theo cách cũ: `node tools/nap-giong-manus.mjs --yeu-cau` → gửi `loi-dan/CAN-GUI-MANUS.txt` cho Manus → `node tools/nap-giong-manus.mjs goi.zip`.
`tools/tts-google.mjs` chỉ tạo giọng *nháp* vào `giong-nhap/`, không dùng cho mục này.

## Đăng Facebook (Fanpage) – đăng ngay, hẹn giờ, lên lịch hàng loạt
1. Tạo app tại developers.facebook.com (loại Business, thêm Facebook Login; tên miền `phucle-gps.github.io`), để chế độ **Development** là đủ cho chính bạn dùng. Copy **App ID**.
2. Trong Xưởng Video bấm **Đăng Facebook** → dán App ID → **Kết nối Facebook** → chọn Fanpage.
3. Chọn *video vừa xuất* hoặc nhiều file MP4 → chọn **Đăng ngay / Hẹn giờ / Lên lịch hàng loạt** (VD mỗi ngày 20:00) → **Đăng lên Facebook**.
- Tiêu đề, mô tả, hashtag, nguồn tự soạn từ kịch bản (theo tên file `id-trận.mp4`).
- Hẹn giờ do Facebook thực hiện (10 phút – 30 ngày), tắt máy vẫn đăng đúng giờ.
- Chỉ đăng được lên **Fanpage** (Facebook không cho ứng dụng đăng lên trang cá nhân). Mã truy cập chỉ lưu trong trình duyệt của bạn.

## Thư viện & công cụ đã tích hợp
| Nguồn | Dùng trong app |
|---|---|
| **GSAP** + SplitText + ScrambleText | *Hiệu ứng chữ*: tách chữ bay 3D, giải mã chữ, bật nảy từng từ, mờ nét, quét lộ (Hiển thị → Hiệu ứng chữ) |
| **Mediabunny** | Xuất MP4 ngay trong trình duyệt: phim 3D xuất từng khung kèm giọng & nhạc (nút ⬇ Xuất MP4); video quay ở app tự chuyển sang MP4 chuẩn |
| **dotLottie** (LottieFiles) | Gắn hoạt hình Lottie (.lottie/.json) vào cảnh, tua từng khung chính xác |
| **Rive** (rive-wasm) | Gắn hoạt hình Rive (.riv) vào cảnh |
| **Motion** | Chuyển động giao diện (hộp thoại, thông báo) |
| **Satori** + resvg + **SVGO** | `node tools/thumbnail.mjs` tạo ảnh bìa YouTube 1280×720 & TikTok 1080×1920 (thư mục `thumbnails/`) |
| **Three.js** | Phim 3D `phim3d.html` |
| **FFmpeg** | Công cụ `tools/render-video.mjs` |
| **GSAP Skills** | Cài trong `.claude/skills/` để Claude viết GSAP đúng chuẩn khi sửa app |

Chưa tích hợp (lý do): **Remotion**, **Motion Canvas**, **React Three Fiber / Drei / Rapier / React Postprocessing** cần React + bước build (viết lại toàn bộ app); **Anime.js** trùng chức năng GSAP/Motion; **Howler.js** không xuất được âm thanh offline (app đã dùng WebAudio). **Remotion Skills** và **Motion AI Kit** là skill cho dự án Remotion/Motion – cài bằng `npx skills add remotion-dev/skills` nếu sau này chuyển sang Remotion.

## Làm video THẬT HƠN bằng AI và Blender
### 1. Clip AI (Google Flow / Veo 3.1, Gemini, Kling, Runway)
- Trong app: bấm cảnh → **✨ Prompt AI** → chép *prompt video* (dán vào Flow), *prompt ảnh* (tạo khung đầu bằng Gemini rồi dùng Frames to Video) hoặc *yêu cầu gửi Gemini* (nhờ Gemini viết prompt).
- Bộ prompt cả phim cho 6 trận: thư mục `prompt-ai/` (hoặc nút **Tải bộ prompt AI cả phim**).
- Prompt theo cấu trúc Veo: khung hình → chủ thể & hành động → bối cảnh → máy quay → phong cách & ánh sáng; mỗi clip 8 giây; có phần *Negative* để tránh đồ vật hiện đại, chữ, máu me.
- Ghép clip: trận mẫu → **Dùng mẫu này làm dự án của bạn** (giữ giọng đọc) → bấm cảnh → **Thêm ảnh/video** → clip tự phủ toàn khung; phụ đề, giọng, nhạc, chuyển cảnh vẫn giữ.
- Trang phục trong prompt là tái hiện ước lượng theo sử liệu (VD lính Trần thích chữ "Sát Thát" trên tay); nên đối chiếu tư liệu bảo tàng khi cần chính xác.

### 2. Blender
- `tools/blender/bach_dang_1288.py`: dựng cảnh Bạch Đằng 1288 (địa hình núi đá vôi, mặt nước Ocean, trời vật lý, sương thể tích, bãi cọc, hạm đội, lửa, khói, phục binh) và render Cycles:
  `blender -b -P tools/blender/bach_dang_1288.py -- --shot 2 --res 1920x1080 --samples 128 --gpu --out bachdang.png`
  (`--anim --frames 120` để xuất 5 giây hoạt cảnh). Ảnh mẫu: `tools/blender/mau-shot2.png`.
- Muốn chân thực hơn: cài **Blender MCP** (github.com/ahujasid/blender-mcp) để Claude điều khiển Blender trên máy bạn, tải mô hình thuyền/người từ Sketchfab hoặc tạo bằng Hunyuan3D, thêm HDRI bầu trời.

## Phim 3D: Bạch Đằng 1288
Trang `phim3d.html` dựng lại trận Bạch Đằng 1288 bằng 3D (three.js): sông núi, thủy triều lên xuống, bãi cọc, hạm đội Nguyên rút từ thượng nguồn ra biển, thuyền nhẹ nhử địch, phục binh hai bờ, tên lửa, thuyền cháy. Dùng giọng dẫn chuyện trong `loi-dan/bach-dang-1288/`.
Xuất MP4: `node tools/render-video.mjs bach-dang-1288 --page phim3d.html --fps 24`

## Chuyển cảnh kiểu After Effects
Mục **Hiển thị → Chuyển cảnh**: Tự động theo phong cách, Phóng xuyên cảnh (zoom blur), Chớp sáng (light leak), Lia máy (whip pan), Quét lộ cảnh (wipe), Đẩy trượt, Mở tròn (iris), Nhiễu sóng (glitch), Hòa mờ, Mờ qua đen, Cắt thẳng.
Với dự án của bạn, có thể chọn kiểu chuyển riêng cho từng cảnh.

## Phòng nhạc
App **tự sáng tác bài mới** theo phong cách xưa: Bolero xưa · Valse tiền chiến · Dân ca ngũ cung · Lofi hoài niệm.
Chọn nhạc cụ chính (vĩ cầm, sáo trúc, piano, guitar, harmonica), giọng, nhịp độ, bật/tắt từng lớp (giai điệu, hòa âm, bass, nhịp).
Bấm **Giai điệu khác** để ra bài mới; **Lưu**, **Tải WAV**, hoặc **Dùng cho dự án đang mở** làm nhạc nền.
Nhạc do app sáng tác không lấy từ bài có sẵn nên tự do sử dụng. Lưu ý: phối lại (kể cả bằng AI) một bài nhạc xưa có thật vẫn cần phép của tác giả – quyền tác giả ở Việt Nam kéo dài suốt đời tác giả + 50 năm.

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
