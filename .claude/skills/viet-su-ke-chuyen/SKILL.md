---
name: viet-su-ke-chuyen
description: (Xưởng film Lịch sử Việt Nam – câu lệnh nhận dạng "film Lịch Sử Việt Nam") Soạn, biên tập và kiểm tra kịch bản kể chuyện lịch sử Việt Nam bằng tiếng Việt theo phong cách thuyết minh ngắn gọn, rõ mốc thời gian, dễ nghe như mẫu tham khảo. Dùng khi người dùng cần kịch bản audio/video lịch sử, lời dẫn cho ứng dụng học tập, tóm tắt trận đánh, hoặc chỉnh sửa lời thuyết minh lịch sử.
---

# Kể chuyện lịch sử Việt Nam bằng lời thuyết minh

> Skill của người dùng, cài cho **Xưởng film Lịch sử Việt Nam**. Áp dụng cho mọi lời dẫn (`say`) của trận mới hoặc khi biên tập trận cũ trong `battles.js`; lời dẫn xong thì đọc bằng giọng Manus (skill `giong-manus`). Với khuôn 8 cảnh của app: cảnh tựa + nhân vật = *mốc, bối cảnh, nhân vật*; bản đồ + lực lượng + sơ đồ = *diễn biến*; trích dẫn/mốc + ý nghĩa = *kết quả, ý nghĩa*. Ghi chú kiểm chứng đặt ở `sources` hoặc chú thích trong code, KHÔNG đưa vào `say`.

## Mục đích

Tạo lời kể lịch sử bằng tiếng Việt có thể đọc thành tiếng trong ứng dụng, video ngắn, bài học hoặc nội dung audio. Phong cách tham chiếu là giọng thuyết minh rõ ràng, nghiêm túc, dễ tiếp nhận: nêu mốc thời gian và nhân vật, giải thích diễn biến bằng câu ngắn, rồi kết bằng kết quả hoặc ý nghĩa. Không bắt chước danh tính, giọng nói sinh học hay tuyên bố đây là giọng của một người cụ thể; chỉ mô phỏng đặc điểm văn phong được mô tả.

Bản ghi nguồn và bản chép lời nằm tại `references/transcript-tham-khao.md`. Đó là ví dụ về nhịp kể và cấu trúc, không phải nguồn lịch sử có thẩm định. Không sao chép các dữ kiện trong ví dụ như sự thật đã kiểm chứng nếu chưa đối chiếu.

## Khi nhận yêu cầu

1. Xác định chủ đề, đối tượng nghe, độ dài mục tiêu, nền tảng sử dụng và dạng đầu ra. Nếu thiếu chi tiết nhưng có thể tiếp tục, hãy nêu giả định ngắn rồi soạn bản nháp.
2. Xác định phạm vi thời gian và sự kiện. Nếu người dùng yêu cầu một trận đánh hoặc nhân vật, tập trung vào phần đó; không tự mở rộng thành bài tổng quan dài.
3. Nếu yêu cầu chỉ là chỉnh sửa văn bản, giữ nguyên dữ kiện và ý chính người dùng cung cấp. Đánh dấu chỗ mơ hồ hoặc đáng kiểm tra thay vì tự sửa lịch sử.
4. Nếu người dùng muốn nội dung mới có dữ kiện lịch sử cụ thể, kiểm chứng các mốc, tên riêng, con số và quan hệ nhân quả bằng nguồn đáng tin cậy khi có thể tra cứu. Ưu tiên tài liệu học thuật, cơ quan lưu trữ/bảo tàng, văn bản sử liệu được giới thiệu rõ, và nguồn giáo dục có uy tín. Phân biệt sự kiện chắc chắn, cách diễn giải và truyền thuyết.
5. Nếu không thể kiểm chứng, nói rõ giới hạn và tránh khẳng định chi tiết gây tranh cãi như sự thật tuyệt đối. Không bịa trích dẫn, nguồn, số liệu hay lời thoại.

## Giọng điệu và cách viết

- Viết tiếng Việt tự nhiên, chuẩn chính tả, phù hợp văn nói trang trọng vừa phải.
- Ưu tiên câu ngắn, mỗi câu truyền tải một ý chính. Dùng nhịp kể mạch lạc, không dùng quá nhiều tính từ, khẩu hiệu hoặc từ ngữ khoa trương.
- Duy trì cách gọi nhất quán cho nhân vật, lực lượng, địa danh và sự kiện. Giải thích tên gọi khác ở lần xuất hiện đầu tiên khi cần, ví dụ tên húy, tước hiệu hoặc tên thường gọi.
- Đọc thuận miệng: hạn chế câu quá dài, nhiều mệnh đề hoặc chuỗi tên riêng khó phát âm. Chuyển số liệu thành cách đọc tự nhiên nếu đầu ra dành cho TTS; giữ dạng số nếu người dùng yêu cầu văn bản biên tập.
- Dùng mốc thời gian chính xác và rõ ràng. Không trộn âm lịch với dương lịch mà không ghi rõ. Với ngày tháng có thể gây nhầm lẫn, nêu rõ lịch được sử dụng hoặc tránh độ chính xác giả.
- Nói rõ ai làm gì, ở đâu, vì sao quan trọng. Không để đại từ như “ông”, “họ”, “đạo quân ấy” gây nhập nhằng.
- Giữ sắc thái nhân văn và trung tính. Tránh tôn vinh bạo lực, miệt thị dân tộc hoặc biến lời kể thành tuyên truyền. Dùng “quân ta/địch” chỉ khi người dùng yêu cầu giọng kể theo quan điểm lịch sử Việt Nam và ngữ cảnh phù hợp; mặc định dùng tên lực lượng cụ thể.

## Cấu trúc kịch bản mặc định

Với một sự kiện ngắn, triển khai theo trình tự sau, điều chỉnh linh hoạt theo độ dài:

1. **Mở bằng mốc và bối cảnh:** thời gian, địa điểm, lực lượng hoặc vấn đề đang diễn ra.
2. **Nêu nhân vật và mục tiêu:** ai chỉ huy, bên nào muốn đạt điều gì.
3. **Kể diễn biến:** 2–5 bước theo thứ tự thời gian; làm rõ chiến thuật chỉ khi có căn cứ.
4. **Nêu kết quả:** kết cục trực tiếp và tổn thất/quy mô chỉ khi dữ liệu đáng tin cậy.
5. **Kết bằng ý nghĩa:** hệ quả lịch sử hoặc điều người nghe nên ghi nhớ, không phóng đại quan hệ nhân quả.

Với chuỗi nhiều sự kiện, chia thành các đoạn riêng. Mỗi đoạn nên có một chủ đề và không chuyển thời đại đột ngột nếu không có câu nối.

## Độ dài và định dạng

- Khi được yêu cầu lời đọc 30 giây, nhắm khoảng 60–75 từ tiếng Việt; 1 phút khoảng 120–150 từ. Đây là ước lượng, điều chỉnh theo tốc độ đọc và khoảng nghỉ.
- Nếu người dùng chưa nêu độ dài, đưa ra một bản thuyết minh cô đọng khoảng 100–180 từ cho một sự kiện, trừ khi ngữ cảnh cho thấy cần độ dài khác.
- Mặc định chỉ trả phần lời thuyết minh sạch, không chèn tiêu đề kỹ thuật, nhãn người nói hay chỉ dẫn sân khấu vào giữa lời đọc.
- Khi cần, trình bày theo cấu trúc: `Tiêu đề`, `Lời thuyết minh`, `Ghi chú kiểm chứng`. Không trộn ghi chú biên tập hoặc trích dẫn nguồn vào phần TTS.
- Nếu người dùng yêu cầu phụ đề, cung cấp câu ngắn theo cụm ý; không tự tạo timecode chính xác khi chưa có dữ liệu đồng bộ.
- Nếu người dùng yêu cầu nhiều phương án, tạo các bản khác nhau về cách mở hoặc mức độ cô đọng nhưng không thay đổi sự kiện cơ bản.

## Quy trình tự kiểm tra trước khi trả lời

- Các năm, ngày tháng, địa danh, tên người và chức vụ có nhất quán không?
- Sự kiện có đúng thứ tự thời gian không?
- Có đang gán chiến thuật, động cơ hoặc con số cho nhân vật mà không có nguồn không?
- Câu có dễ đọc thành tiếng không? Đại từ có tham chiếu rõ không?
- Phần kết có phản ánh ý nghĩa hợp lý mà không cường điệu không?
- Có tách rõ lời thuyết minh và ghi chú dành cho người biên tập/TTS không?

## Quy tắc với bản chép lời mẫu

Bản chép lời mẫu là bản nhận dạng tự động từ một tệp audio. Nó có thể sai ở tên riêng, chữ số, cách viết địa danh hoặc dấu câu. Dùng nó để tham khảo nhịp kể: mở bằng mốc thời gian, nêu nhân vật và diễn biến, rồi kết bằng kết quả hoặc ý nghĩa. Không coi bản chép lời là nguồn xác minh; không tiếp tục truyền đi lỗi có thể có trong bản gốc. Khi trích hoặc biên tập sát nội dung đó, nêu rõ dữ kiện nào cần người dùng xác nhận hoặc cần đối chiếu nguồn.

## Mẫu đầu ra

### Lời thuyết minh

[Đoạn văn có thể đọc thành tiếng, đúng độ dài và chủ đề người dùng yêu cầu.]

### Ghi chú kiểm chứng

[Chỉ thêm khi có dữ kiện cần lưu ý, bất đồng sử liệu hoặc giới hạn xác minh. Nếu không có ghi chú quan trọng, bỏ mục này.]
