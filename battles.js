/* =========================================================================
   KỊCH BẢN CÁC TRẬN ĐÁNH
   Mỗi trận = danh sách cảnh. Thêm trận mới: sao chép một khối và sửa.
   - say: lời dẫn (thành phụ đề + giọng đọc). Thời lượng cảnh tự tính theo số chữ.
   - map: lon/lat thật; cutLat = vĩ độ ước lượng biên giới phía Nam Đại Việt thời đó.
   - diagram: tọa độ khung 1920×1080; mốc thời gian là tỉ lệ 0..1 của cảnh.
   Số liệu theo sách giáo khoa / Đại Việt sử ký toàn thư (các con số cổ mang tính ước lượng).
   ========================================================================= */
(function () {
  const CHINA = ['China', 'Hong Kong', 'Macao', 'Taiwan'];

  /* Sơ đồ sông Bạch Đằng dùng chung cho 938 và 1288 */
  function bachDangDiagram(o) {
    return {
      type: 'diagram', title: o.title, oursName: o.ours, enemyName: o.enemy,
      water: ['M0,200 C400,240 700,330 1000,440 C1250,530 1450,600 1700,640 L1920,640 L1920,1080 L1500,1080 C1350,900 1150,780 950,680 C700,560 400,400 0,340 Z'],
      hills: [[400, 560, 500, 160, 7], [1500, 380, 500, 160, 6], [200, 900, 300, 100, 4]],
      forest: [[700, 700, 300, 140, 16], [1150, 330, 300, 120, 12]],
      stakes: [{ x1: 1185, y1: 545, x2: 1060, y2: 770, n: 15 }, { x1: 1275, y1: 585, x2: 1150, y2: 820, n: 15 }],
      tide: [[0, 1], [.44, 1], [.6, .05], [1, .05]],
      labels: [
        { x: 470, y: 330, text: 'SÔNG BẠCH ĐẰNG', style: 'river' },
        { x: 1780, y: 760, text: 'CỬA BIỂN', style: 'river' },
        { x: 1340, y: 520, text: 'BÃI CỌC NGẦM', style: 'warn', at: .02 },
        ...(o.extraLabels || [])
      ],
      units: [
        { kind: 'ship', side: 'ta', n: 4, spread: 60, label: o.lureLabel || 'Thuyền nhẹ nhử địch', path: [[.06, 1520, 860], [.2, 1250, 720], [.4, 650, 420]], until: .5 },
        { kind: 'ship', side: 'dich', big: 1, n: 11, spread: 150, label: o.enemyFleet, path: [[.1, 1880, 990], [.26, 1380, 780], [.44, 840, 520], [.5, 820, 510], [.66, 1130, 680]], sink: .74, burn: .7, ly: -95 },
        { kind: 'troop', side: 'ta', n: 5, spread: 90, label: 'Phục binh', path: [[0, 1000, 330]], at: .44 },
        { kind: 'troop', side: 'ta', n: 5, spread: 90, label: 'Phục binh', path: [[0, 820, 760]], at: .46, ly: 70 },
        { kind: 'ship', side: 'ta', n: 7, spread: 110, label: o.mainFleet, path: [[.46, 120, 270], [.62, 620, 430], [.8, 930, 560]], at: .46 }
      ],
      arrows: [
        { side: 'dich', d: 'M1860,960 C1600,840 1250,700 880,520', at: .1, len: .3, until: .5 },
        { side: 'ta', d: 'M1000,360 C1020,430 1050,520 1100,610', at: .5, len: .1 },
        { side: 'ta', d: 'M840,740 C900,700 980,660 1060,650', at: .52, len: .1 },
        { side: 'ta', d: 'M200,290 C500,360 750,460 1000,600', at: .55, len: .15, w: 14 }
      ],
      fx: [{ x: 1120, y: 670, at: .7, len: .25, s: 1.4 }, { x: 1200, y: 720, at: .73, len: .22 }],
      phases: [[0, '1 · Đóng cọc gỗ bịt sắt dưới lòng sông'], [.1, '2 · Nước lên – nhử địch vào sâu'], [.46, '3 · Nước rút – phản công từ thượng nguồn và hai bờ'], [.68, o.phase4 || '4 · Thuyền địch vướng cọc, vỡ đắm']],
      say: o.say, min: 22
    };
  }

  window.BATTLES = [
    /* =================================================================== */
    {
      id: 'bach-dang-938', year: '938', name: 'Bạch Đằng 938', who: 'Ngô Quyền', vs: 'Nam Hán', seed: 3,
      scenes: [
        { type: 'title', title: 'BẠCH ĐẰNG', sub: 'TRẬN THỦY CHIẾN NĂM 938', line: 'NGÔ QUYỀN · KẾT THÚC HƠN MỘT NGHÌN NĂM BẮC THUỘC', stamp: 'CHIẾN THẮNG LỊCH SỬ', stakes: 1,
          say: 'Năm 938, trên dòng sông Bạch Đằng, quân dân ta dưới sự chỉ huy của Ngô Quyền đã đánh tan đạo thủy quân Nam Hán, mở ra kỷ nguyên độc lập lâu dài cho dân tộc.' },
        { type: 'hero', kicker: 'ANH HÙNG DÂN TỘC', name: 'Ngô Quyền', alt: '898 – 944', role: 'Người khai sinh nhà Ngô, đóng đô ở Cổ Loa',
          say: 'Ngô Quyền là người Đường Lâm, là tướng giỏi dưới quyền Dương Đình Nghệ. Khi Kiều Công Tiễn giết Dương Đình Nghệ rồi cầu cứu nhà Nam Hán, Ngô Quyền đem quân ra Bắc trừng trị kẻ phản bội.' },
        { type: 'map', date: 'CUỐI NĂM 938', cutLat: 18.2, legendEnemy: 'Nam Hán', enemy: { countries: CHINA },
          cam: [{ lon: 108, lat: 19, z: 1 }, { lon: 107.2, lat: 21.2, z: 2.6 }],
          labels: [{ lon: 113.3, lat: 23.6, text: 'NAM HÁN', style: 'enemy', at: .1 }, { lon: 105.4, lat: 20.3, text: 'TĨNH HẢI QUÂN', style: 'ours', at: .15 },
            { lon: 105.87, lat: 21.12, text: 'Đại La', dot: 1, at: .5 }],
          routes: [{ pts: [[113.2, 22.6], [110.5, 21.0], [107.6, 20.7], [106.85, 20.9]], side: 'dich', at: .25, len: .4 }],
          marker: { lon: 106.8, lat: 20.88, text: 'Cửa sông Bạch Đằng', at: .7 },
          say: 'Vua Nam Hán sai con là Lưu Hoằng Tháo đem thủy quân theo đường biển sang xâm lược. Ngô Quyền đã giết Kiều Công Tiễn, rồi chọn cửa sông Bạch Đằng làm nơi quyết chiến.' },
        { type: 'forces', ours: { name: 'QUÂN NGÔ QUYỀN', rows: [['Chỉ huy', 'Ngô Quyền'], ['Lực lượng', 'Quân dân Tĩnh Hải quân'], ['Lợi thế', 'Thông thạo thủy triều, địa hình']] },
          enemy: { name: 'NAM HÁN', rows: [['Chỉ huy', 'Lưu Hoằng Tháo'], ['Lực lượng', 'Đạo thủy quân lớn, thuyền cao to'], ['Điểm yếu', 'Không quen sông nước Bạch Đằng']] },
          say: 'Địch có thuyền lớn, quân đông. Ngô Quyền lại nắm chắc quy luật thủy triều trên sông Bạch Đằng, biến chính dòng sông thành cái bẫy khổng lồ.' },
        bachDangDiagram({ title: 'TRẬN BẠCH ĐẰNG 938', ours: 'Quân Ngô Quyền', enemy: 'Thủy quân Nam Hán', enemyFleet: 'Lưu Hoằng Tháo', mainFleet: 'Ngô Quyền',
          say: 'Ngô Quyền cho đóng cọc gỗ đầu bịt sắt nhọn xuống lòng sông. Khi nước triều lên, cọc bị che lấp, thuyền nhẹ ra khiêu chiến rồi giả thua, nhử địch vượt qua bãi cọc. Chờ nước triều rút, quân ta từ thượng nguồn và hai bên bờ đổ ra đánh dữ dội. Thuyền giặc tháo chạy ra biển, va vào cọc nhọn, vỡ đắm vô số. Lưu Hoằng Tháo tử trận.' }),
        { type: 'timeline', title: 'DẤU MỐC', items: [['937', 'Kiều Công Tiễn giết Dương Đình Nghệ'], ['938', 'Ngô Quyền diệt Kiều Công Tiễn'], ['Cuối 938', 'Đại thắng Bạch Đằng'], ['939', 'Ngô Quyền xưng vương, đóng đô Cổ Loa']],
          say: 'Đầu năm 939, Ngô Quyền xưng vương, đóng đô ở Cổ Loa, đặt nền móng cho một quốc gia độc lập.' },
        { type: 'points', items: ['Chấm dứt hơn một nghìn năm Bắc thuộc', 'Mở ra thời kỳ độc lập, tự chủ lâu dài', 'Khởi đầu nghệ thuật dùng cọc và thủy triều trên sông Bạch Đằng'],
          say: 'Chiến thắng Bạch Đằng năm 938 chấm dứt hơn một nghìn năm Bắc thuộc, mở ra thời kỳ độc lập lâu dài, và để lại bài học dùng thủy triều, bãi cọc cho các thế hệ sau.' },
        { type: 'end', sub: 'Bạch Đằng 938 · Ngô Quyền', next: 'Như Nguyệt 1077', say: 'Cảm ơn bạn đã theo dõi. Hẹn gặp lại ở trận đánh tiếp theo.' }
      ]
    },
    /* =================================================================== */
    {
      id: 'nhu-nguyet-1077', year: '1077', name: 'Như Nguyệt 1077', who: 'Lý Thường Kiệt', vs: 'Tống', seed: 11,
      scenes: [
        { type: 'title', title: 'NHƯ NGUYỆT', sub: 'PHÒNG TUYẾN SÔNG CẦU NĂM 1077', line: 'LÝ THƯỜNG KIỆT · ĐẠI PHÁ QUÂN TỐNG', stamp: 'NAM QUỐC SƠN HÀ', ships: 4,
          say: 'Năm 1077, bên bờ sông Như Nguyệt, quân dân Đại Việt thời Lý đã chặn đứng mười vạn quân Tống, buộc kẻ thù phải rút về nước.' },
        { type: 'hero', kicker: 'DANH TƯỚNG NHÀ LÝ', name: 'Lý Thường Kiệt', alt: '1019 – 1105', role: 'Thái úy, tổng chỉ huy kháng chiến chống Tống',
          say: 'Lý Thường Kiệt tên thật là Ngô Tuấn, là danh tướng tài ba của triều Lý. Ông chủ trương tiến công trước để tự vệ, chủ động đánh vào nơi tập kết quân lương của địch.' },
        { type: 'map', date: '1075 – 1077', cutLat: 17.0, legendEnemy: 'Nhà Tống', enemy: { countries: CHINA },
          cam: [{ lon: 107.5, lat: 21, z: 1.6 }, { lon: 106.2, lat: 21.3, z: 2.8 }],
          labels: [{ lon: 112, lat: 24.5, text: 'NHÀ TỐNG', style: 'enemy', at: .05 }, { lon: 105.3, lat: 20.0, text: 'ĐẠI VIỆT', style: 'ours', at: .05 },
            { lon: 108.3, lat: 22.82, text: 'Ung Châu', dot: 1, at: .15 }, { lon: 108.62, lat: 21.95, text: 'Khâm Châu', dot: 1, at: .17 }, { lon: 109.2, lat: 21.66, text: 'Liêm Châu', dot: 1, at: .19 },
            { lon: 105.85, lat: 21.03, text: 'Thăng Long', dot: 1, anchor: 'end', at: .5 }],
          routes: [{ pts: [[106.3, 21.0], [107.3, 21.6], [108.2, 22.6]], side: 'ta', at: .15, len: .25 },
            { pts: [[108.3, 22.9], [107.2, 22.4], [106.5, 21.6], [106.05, 21.3]], side: 'dich', at: .45, len: .3 }],
          marker: { lon: 106.03, lat: 21.2, text: 'Sông Như Nguyệt', at: .78 },
          say: 'Cuối năm 1075, quân Lý bất ngờ đánh sang Khâm Châu, Liêm Châu, hạ thành Ung Châu rồi rút về. Đầu năm 1077, quân Tống kéo sang báo thù, nhưng bị chặn lại ở sông Như Nguyệt.' },
        { type: 'forces', ours: { name: 'ĐẠI VIỆT – NHÀ LÝ', rows: [['Chỉ huy', 'Lý Thường Kiệt'], ['Lực lượng', 'Khoảng # vạn quân', 10], ['Thế trận', 'Phòng tuyến dọc bờ nam sông']] },
          enemy: { name: 'NHÀ TỐNG', rows: [['Chỉ huy', 'Quách Quỳ, Triệu Tiết'], ['Lực lượng', '# vạn quân, 1 vạn ngựa', 10], ['Hậu cần', '20 vạn dân phu']] },
          say: 'Quân Tống do Quách Quỳ và Triệu Tiết chỉ huy, gồm mười vạn quân, một vạn ngựa cùng hai mươi vạn dân phu. Lý Thường Kiệt cho đắp lũy, đóng cọc tre dày đặc dọc bờ nam sông Như Nguyệt.' },
        { type: 'diagram', title: 'PHÒNG TUYẾN NHƯ NGUYỆT 1077', oursName: 'Quân nhà Lý', enemyName: 'Quân Tống',
          water: ['M0,470 C400,430 800,520 1200,480 C1500,450 1700,500 1920,470 L1920,580 C1700,610 1500,560 1200,590 C800,630 400,540 0,580Z'],
          hills: [[1600, 200, 500, 120, 6], [300, 160, 400, 100, 5]],
          forest: [[1500, 850, 400, 150, 14]],
          lines: [{ d: 'M60,620 C400,585 800,670 1200,632 C1500,605 1700,655 1880,625', side: 'ta' }],
          forts: [{ x: 520, y: 290, side: 'dich', label: 'Doanh trại Tống', fall: .8 }, { x: 1080, y: 260, side: 'dich', label: 'Quách Quỳ' }, { x: 1520, y: 320, side: 'dich' },
            { x: 700, y: 800, side: 'ta', label: 'Phòng tuyến' }, { x: 1300, y: 790, side: 'ta' }],
          labels: [{ x: 1500, y: 545, text: 'SÔNG NHƯ NGUYỆT (SÔNG CẦU)', style: 'river' }, { x: 1780, y: 720, text: '▼ THĂNG LONG', style: 'warn' }],
          units: [
            { kind: 'ship', side: 'dich', n: 7, spread: 140, label: 'Quân Tống vượt sông', path: [[.12, 980, 360], [.3, 980, 530]], sink: .4, at: .12 },
            { kind: 'troop', side: 'dich', n: 6, spread: 140, path: [[0, 1250, 380]] },
            { kind: 'troop', side: 'ta', n: 6, spread: 150, label: 'Quân giữ lũy', path: [[0, 980, 700]], ly: 70 },
            { kind: 'troop', side: 'ta', n: 6, spread: 100, label: 'Lý Thường Kiệt', path: [[.52, 260, 760], [.64, 260, 530], [.8, 470, 330]], at: .52, until: .98 }
          ],
          arrows: [
            { side: 'dich', d: 'M980,330 L980,480', at: .12, len: .12, until: .42 },
            { side: 'ta', d: 'M900,680 Q930,600 960,540', at: .3, len: .06, until: .5 },
            { side: 'ta', d: 'M1060,680 Q1030,600 1000,540', at: .31, len: .06, until: .5 },
            { side: 'ta', d: 'M260,780 C200,600 300,420 470,330', at: .54, len: .22, w: 14 }
          ],
          fx: [{ x: 980, y: 540, at: .36, len: .1 }, { x: 520, y: 290, at: .78, len: .22, s: 1.5 }],
          phases: [[0, '1 · Lập phòng tuyến dọc bờ nam sông Như Nguyệt'], [.12, '2 · Quân Tống nhiều lần vượt sông – đều bị đánh bật'], [.52, '3 · Quân ta bất ngờ vượt sông, đánh úp doanh trại địch'], [.82, '4 · Quân Tống kiệt quệ, phải rút về nước']],
          say: 'Quân Tống nhiều lần đóng bè vượt sông, có lúc chọc thủng phòng tuyến, nhưng đều bị đánh bật trở lại. Bị cầm chân hàng tháng trời, quân Tống lâm vào cảnh mệt mỏi, thiếu lương, chết vì bệnh tật. Lý Thường Kiệt mở cuộc tấn công lớn sang bờ bắc, khiến địch thua to.', min: 22 },
        { type: 'quote', quote: 'Sông núi nước Nam vua Nam ở, rành rành định phận tại sách trời. Cớ sao lũ giặc sang xâm phạm? Chúng bay sẽ bị đánh tơi bời!', by: 'Nam quốc sơn hà – tương truyền của Lý Thường Kiệt',
          say: 'Tương truyền, giữa lúc trận chiến căng thẳng, bài thơ Nam quốc sơn hà vang lên trong đêm, cổ vũ tinh thần quân sĩ, được xem như bản tuyên ngôn độc lập đầu tiên của dân tộc.' },
        { type: 'points', items: ['Đập tan ý đồ xâm lược của nhà Tống', 'Nghệ thuật "tiên phát chế nhân" – tiến công trước để tự vệ', 'Chủ động giảng hòa, kết thúc chiến tranh có lợi cho Đại Việt'],
          say: 'Lý Thường Kiệt chủ động đề nghị giảng hòa, mở lối thoát cho quân Tống rút về. Cách kết thúc chiến tranh mềm dẻo ấy giữ vững nền độc lập, tránh thêm hy sinh cho cả hai bên.' },
        { type: 'end', sub: 'Như Nguyệt 1077 · Lý Thường Kiệt', next: 'Bạch Đằng 1288', say: 'Cảm ơn bạn đã theo dõi. Hẹn gặp lại ở trận đánh tiếp theo.' }
      ]
    },
    /* =================================================================== */
    {
      id: 'bach-dang-1288', year: '1288', name: 'Bạch Đằng 1288', who: 'Trần Hưng Đạo', vs: 'Nguyên Mông', seed: 7,
      scenes: [
        { type: 'title', title: 'BẠCH ĐẰNG', sub: 'TRẬN THỦY CHIẾN NĂM 1288', line: 'BA LẦN ĐẠI THẮNG QUÂN NGUYÊN MÔNG', stamp: 'CHIẾN THẮNG VĨ ĐẠI', stakes: 1, ships: 7,
          say: 'Trận chiến Bạch Đằng năm 1288 là một trong những chiến thắng quân sự vĩ đại nhất trong lịch sử dân tộc Việt Nam.' },
        { type: 'hero', kicker: 'ANH HÙNG DÂN TỘC', name: 'Trần Hưng Đạo', alt: 'Trần Quốc Tuấn', role: 'Quốc công Tiết chế, thống lĩnh quân đội nhà Trần',
          say: 'Chiến thắng gắn liền với tên tuổi của vị anh hùng dân tộc Trần Hưng Đạo, hay còn gọi là Trần Quốc Tuấn, tổng chỉ huy quân đội nhà Trần.' },
        { type: 'map', date: '09.04.1288', cutLat: 16.8, legendEnemy: 'Nhà Nguyên', enemy: { countries: CHINA },
          cam: [{ lon: 108, lat: 19, z: 1 }, { lon: 106.7, lat: 20.9, z: 4 }],
          labels: [{ lon: 111.5, lat: 24.4, text: 'NHÀ NGUYÊN', style: 'enemy', at: .05 }, { lon: 105.3, lat: 20.0, text: 'ĐẠI VIỆT', style: 'ours', at: .05 },
            { lon: 105.85, lat: 21.03, text: 'Thăng Long', dot: 1, anchor: 'end', at: .45 }, { lon: 106.4, lat: 21.1, text: 'Vạn Kiếp', dot: 1, at: .5 }, { lon: 107.45, lat: 21.07, text: 'Vân Đồn', dot: 1, anchor: 'start', at: .55 }],
          routes: [{ pts: [[108.3, 22.9], [107.2, 22.3], [106.4, 21.3]], side: 'dich', at: .2, len: .3 }, { pts: [[110.2, 21.2], [108.5, 21.2], [107.5, 21.1], [106.9, 20.95]], side: 'dich', at: .3, len: .3 }],
          marker: { lon: 106.8, lat: 20.88, text: 'Sông Bạch Đằng', at: .75, },
          say: 'Cuối năm 1287, quân Nguyên chia hai đường thủy bộ tràn sang lần thứ ba. Trận chiến diễn ra vào ngày 9 tháng 4 năm 1288 trên sông Bạch Đằng.' },
        { type: 'forces', ours: { name: 'ĐẠI VIỆT – NHÀ TRẦN', rows: [['Tổng chỉ huy', 'Trần Hưng Đạo'], ['Lực lượng', 'Toàn dân đánh giặc'], ['Chiến lược', 'Vườn không nhà trống, đánh vào lương thảo']] },
          enemy: { name: 'NHÀ NGUYÊN', rows: [['Chỉ huy', 'Thoát Hoan, Ô Mã Nhi'], ['Lực lượng', 'Hàng chục vạn quân thủy bộ'], ['Lương thảo', 'Đoàn thuyền Trương Văn Hổ']] },
          say: 'Trận Vân Đồn, Trần Khánh Dư đánh tan đoàn thuyền lương của Trương Văn Hổ. Thiếu lương, quân Nguyên ở Vạn Kiếp buộc phải tính đường rút về nước.' },
        bachDangDiagram({ title: 'TRẬN BẠCH ĐẰNG 1288', ours: 'Quân nhà Trần', enemy: 'Thủy quân Nguyên', enemyFleet: 'Ô Mã Nhi', mainFleet: 'Trần Hưng Đạo', lureLabel: 'Thuyền nhử địch',
          phase4: '4 · Hơn 400 chiến thuyền bị bắt – Ô Mã Nhi bị bắt sống',
          say: 'Trần Hưng Đạo cho bố trí bãi cọc lớn ở cửa sông. Khi đoàn thuyền của Ô Mã Nhi rút qua Bạch Đằng lúc nước lên, quân ta khiêu chiến, nhử địch vào trận địa. Nước triều rút, thuyền nhẹ của ta từ khắp nơi đổ ra tấn công, phục binh hai bờ đánh xuống. Thuyền giặc dồn về bãi cọc, đắm và bị đốt cháy. Ô Mã Nhi bị bắt sống, hơn bốn trăm chiến thuyền rơi vào tay quân ta.' }),
        { type: 'quote', quote: 'Dẫu cho trăm thân này phơi ngoài nội cỏ, nghìn xác này gói trong da ngựa, ta cũng vui lòng.', by: 'Trần Hưng Đạo – Hịch tướng sĩ',
          say: 'Tinh thần ấy đã được Trần Hưng Đạo hun đúc từ trước qua bài Hịch tướng sĩ, khích lệ ý chí quyết chiến của toàn quân.' },
        { type: 'points', items: ['Lần thứ ba đánh bại đế chế Nguyên Mông hùng mạnh', 'Đỉnh cao nghệ thuật lợi dụng thủy triều và địa hình', 'Khẳng định sức mạnh đoàn kết "vua tôi đồng lòng, anh em hòa thuận"'],
          say: 'Đại thắng Bạch Đằng 1288 khép lại ba lần kháng chiến chống Nguyên Mông, đập tan mộng xâm lược của đế chế hùng mạnh bậc nhất thời bấy giờ.' },
        { type: 'end', sub: 'Bạch Đằng 1288 · Trần Hưng Đạo', next: 'Chi Lăng – Xương Giang 1427', say: 'Cảm ơn bạn đã theo dõi. Hẹn gặp lại ở trận đánh tiếp theo.' }
      ]
    },
    /* =================================================================== */
    {
      id: 'chi-lang-1427', year: '1427', name: 'Chi Lăng – Xương Giang 1427', who: 'Lê Lợi', vs: 'Minh', seed: 19,
      scenes: [
        { type: 'title', title: 'CHI LĂNG', sub: 'CHI LĂNG – XƯƠNG GIANG NĂM 1427', line: 'KHỞI NGHĨA LAM SƠN · KẾT THÚC 20 NĂM ĐÔ HỘ CỦA NHÀ MINH', stamp: 'BÌNH NGÔ', ships: 2,
          say: 'Mùa thu năm 1427, nghĩa quân Lam Sơn tiêu diệt hơn mười vạn viện binh nhà Minh tại ải Chi Lăng và thành Xương Giang, kết thúc hai mươi năm đô hộ.' },
        { type: 'hero', kicker: 'LÃNH TỤ KHỞI NGHĨA LAM SƠN', name: 'Lê Lợi', alt: '1385 – 1433', role: 'Bình Định Vương, sau là vua Lê Thái Tổ',
          say: 'Lê Lợi dựng cờ khởi nghĩa ở Lam Sơn năm 1418. Sau mười năm gian khổ, nghĩa quân đã vây chặt quân Minh trong thành Đông Quan.' },
        { type: 'map', date: 'THÁNG 10.1427', cutLat: 15.8, legendOurs: 'Đại Việt', legendEnemy: 'Nhà Minh', enemy: { countries: CHINA },
          cam: [{ lon: 105, lat: 22.5, z: 1.4 }, { lon: 106.3, lat: 21.5, z: 3.6 }],
          labels: [{ lon: 111, lat: 25, text: 'NHÀ MINH', style: 'enemy', at: .05 }, { lon: 105.3, lat: 20.0, text: 'ĐẠI VIỆT', style: 'ours', at: .05 },
            { lon: 105.85, lat: 21.03, text: 'Đông Quan', dot: 1, anchor: 'end', at: .3 }, { lon: 102.7, lat: 25.0, text: 'Vân Nam', dot: 1, at: .2 }, { lon: 106.2, lat: 21.29, text: 'Xương Giang', dot: 1, anchor: 'end', at: .65 }],
          routes: [{ pts: [[108.3, 22.9], [107.1, 22.2], [106.58, 21.62]], side: 'dich', at: .2, len: .3 }, { pts: [[102.7, 24.8], [103.6, 23.2], [104.6, 22.2]], side: 'dich', at: .25, len: .3 }],
          marker: { lon: 106.58, lat: 21.62, text: 'Ải Chi Lăng', at: .62 },
          say: 'Tháng 10 năm 1427, nhà Minh cử hai đạo viện binh: Liễu Thăng theo đường Lạng Sơn, Mộc Thạnh theo đường Vân Nam, hòng giải vây cho Đông Quan.' },
        { type: 'forces', ours: { name: 'NGHĨA QUÂN LAM SƠN', rows: [['Lãnh đạo', 'Lê Lợi, Nguyễn Trãi'], ['Tướng chặn đánh', 'Lê Sát, Lưu Nhân Chú, Trần Lựu'], ['Kế sách', 'Diệt viện binh trước, vây thành sau']] },
          enemy: { name: 'VIỆN BINH MINH', rows: [['Đạo Lạng Sơn', '# vạn quân – Liễu Thăng', 10], ['Đạo Vân Nam', '# vạn quân – Mộc Thạnh', 5], ['Trong thành', 'Vương Thông cố thủ Đông Quan']] },
          say: 'Đạo quân của Liễu Thăng có mười vạn người, Mộc Thạnh có năm vạn. Lê Lợi và Nguyễn Trãi quyết định tập trung lực lượng tiêu diệt viện binh trước.' },
        { type: 'diagram', title: 'CHI LĂNG – XƯƠNG GIANG 1427', oursName: 'Nghĩa quân Lam Sơn', enemyName: 'Quân Minh',
          hills: [[480, 300, 560, 300, 12], [1440, 320, 560, 300, 12], [430, 700, 460, 220, 8], [1480, 700, 460, 220, 8]],
          forest: [[700, 480, 200, 300, 16], [1220, 480, 200, 300, 16]],
          water: ['M0,920 C400,880 700,950 1000,930 C1300,910 1600,950 1920,920 L1920,980 C1600,1010 1300,970 1000,990 C700,1010 400,940 0,980Z'],
          lines: [{ d: 'M960,0 C930,200 1000,350 960,500 C920,650 990,740 960,840', side: 'road' }],
          forts: [{ x: 960, y: 820, side: 'dich', label: 'Thành Xương Giang', fall: .88 }],
          labels: [{ x: 960, y: 40, text: '▲ LẠNG SƠN', style: 'warn' }, { x: 1140, y: 360, text: 'ẢI CHI LĂNG', style: 'warn' }, { x: 1180, y: 640, text: 'Núi Mã Yên', style: '' },
            { x: 1100, y: 600, text: '✕ Liễu Thăng tử trận', style: 'warn', at: .56 }],
          units: [
            { kind: 'troop', side: 'ta', n: 3, spread: 50, label: 'Trần Lựu giả thua', path: [[.04, 960, 200], [.36, 960, 600]], until: .45, lx: 170, ly: 0 },
            { kind: 'horse', side: 'dich', n: 9, spread: 110, label: 'Liễu Thăng', path: [[.04, 960, 30], [.36, 960, 430], [.42, 960, 530]], sink: .55, lx: 150, ly: 0 },
            { kind: 'troop', side: 'ta', n: 6, spread: 110, label: 'Phục binh', path: [[0, 660, 520]], at: .38 },
            { kind: 'troop', side: 'ta', n: 6, spread: 110, label: 'Phục binh', path: [[0, 1270, 520]], at: .38 },
            { kind: 'troop', side: 'dich', n: 7, spread: 120, label: 'Tàn quân Minh', path: [[.58, 960, 600], [.72, 960, 760]], at: .58, sink: .9, lx: 180, ly: 0 },
            { kind: 'troop', side: 'ta', n: 5, spread: 90, path: [[.72, 560, 800], [.86, 820, 820]], at: .72 },
            { kind: 'troop', side: 'ta', n: 5, spread: 90, path: [[.72, 1380, 800], [.86, 1100, 820]], at: .72 }
          ],
          arrows: [
            { side: 'dich', d: 'M960,20 C940,200 990,330 960,440', at: .04, len: .3 },
            { side: 'ta', d: 'M700,520 C780,520 860,520 920,520', at: .42, len: .08 },
            { side: 'ta', d: 'M1230,520 C1150,520 1070,520 1000,520', at: .43, len: .08 },
            { side: 'ta', d: 'M560,800 C640,815 760,820 880,820', at: .74, len: .1 },
            { side: 'ta', d: 'M1380,800 C1280,815 1160,820 1040,820', at: .75, len: .1 }
          ],
          fx: [{ x: 960, y: 520, at: .48, len: .12, s: 1.3 }, { x: 960, y: 800, at: .86, len: .14, s: 1.4 }],
          phases: [[0, '1 · Liễu Thăng dẫn quân tràn qua biên giới'], [.06, '2 · Quân ta giả thua, nhử địch vào ải Chi Lăng'], [.4, '3 · Phục binh hai bên núi đổ ra – Liễu Thăng bị chém'], [.6, '4 · Truy kích, vây diệt tàn quân ở Xương Giang']],
          say: 'Tướng Trần Lựu giao chiến rồi giả thua, nhử Liễu Thăng đuổi theo vào ải Chi Lăng. Phục binh hai bên sườn núi đổ ra, Liễu Thăng bị chém ở núi Mã Yên. Tàn quân cố chạy về thành Xương Giang thì bị bao vây và tiêu diệt. Hay tin, Mộc Thạnh hoảng sợ rút chạy về nước.', min: 22 },
        { type: 'quote', quote: 'Như nước Đại Việt ta từ trước, vốn xưng nền văn hiến đã lâu. Núi sông bờ cõi đã chia, phong tục Bắc Nam cũng khác.', by: 'Nguyễn Trãi – Bình Ngô đại cáo',
          say: 'Tuyệt vọng, Vương Thông xin hòa, rút quân về nước. Nguyễn Trãi thay lời Lê Lợi viết Bình Ngô đại cáo, áng thiên cổ hùng văn tuyên bố độc lập.' },
        { type: 'points', items: ['Đập tan hơn 10 vạn viện binh, kết thúc 20 năm đô hộ', 'Hội thề Đông Quan – quân Minh rút khỏi Đại Việt', 'Mở ra triều Hậu Lê, đất nước bước vào thời kỳ hưng thịnh'],
          say: 'Thắng lợi Chi Lăng – Xương Giang kết thúc hai mươi năm đô hộ của nhà Minh, mở ra triều Hậu Lê với gần một trăm năm phát triển rực rỡ.' },
        { type: 'end', sub: 'Chi Lăng – Xương Giang 1427 · Lê Lợi', next: 'Rạch Gầm – Xoài Mút 1785', say: 'Cảm ơn bạn đã theo dõi. Hẹn gặp lại ở trận đánh tiếp theo.' }
      ]
    },
    /* =================================================================== */
    {
      id: 'rach-gam-1785', year: '1785', name: 'Rạch Gầm – Xoài Mút 1785', who: 'Nguyễn Huệ', vs: 'Xiêm', seed: 23,
      scenes: [
        { type: 'title', title: 'RẠCH GẦM', sub: 'RẠCH GẦM – XOÀI MÚT NĂM 1785', line: 'NGUYỄN HUỆ · TRẬN THỦY CHIẾN TRÊN SÔNG TIỀN', stamp: 'ĐẠI PHÁ QUÂN XIÊM', ships: 8,
          say: 'Đầu năm 1785, trên sông Tiền, nghĩa quân Tây Sơn do Nguyễn Huệ chỉ huy đã tiêu diệt gần như toàn bộ đạo quân xâm lược Xiêm.' },
        { type: 'hero', kicker: 'THIÊN TÀI QUÂN SỰ', name: 'Nguyễn Huệ', alt: '1753 – 1792', role: 'Tướng Tây Sơn, sau là Hoàng đế Quang Trung',
          say: 'Nguyễn Huệ là một trong ba anh em Tây Sơn, nổi tiếng với lối hành quân thần tốc và cách đánh bất ngờ, táo bạo.' },
        { type: 'map', date: '19.01.1785', cutLat: 8, legendOurs: 'Lãnh thổ Việt Nam', legendEnemy: 'Xiêm', enemy: { countries: ['Thailand'] },
          cam: [{ lon: 104, lat: 13, z: 1.3 }, { lon: 106, lat: 10.5, z: 3 }],
          labels: [{ lon: 101, lat: 15.2, text: 'XIÊM', style: 'enemy', at: .05 }, { lon: 100.5, lat: 13.75, text: 'Băng Cốc', dot: 1, at: .1 },
            { lon: 106.7, lat: 10.78, text: 'Gia Định', dot: 1, at: .4 }, { lon: 109.2, lat: 13.77, text: 'Quy Nhơn', dot: 1, at: .3 }],
          routes: [{ pts: [[100.6, 13.4], [102.5, 11.2], [104.5, 10.4], [106.1, 10.35]], side: 'dich', at: .15, len: .35 },
            { pts: [[109.1, 13.6], [108.6, 11.4], [107.2, 10.1], [106.4, 10.3]], side: 'ta', at: .35, len: .3, bend: -1 }],
          marker: { lon: 106.25, lat: 10.33, text: 'Rạch Gầm – Xoài Mút', at: .7 },
          say: 'Nguyễn Ánh cầu viện Xiêm. Vua Xiêm sai hàng vạn quân thủy bộ sang chiếm miền Tây Gia Định. Nguyễn Huệ được lệnh đem quân từ Quy Nhơn vào Nam đánh giặc.' },
        { type: 'forces', ours: { name: 'NGHĨA QUÂN TÂY SƠN', rows: [['Chỉ huy', 'Nguyễn Huệ'], ['Căn cứ', 'Mỹ Tho'], ['Kế sách', 'Mai phục trên sông Tiền']] },
          enemy: { name: 'QUÂN XIÊM', rows: [['Lực lượng', '# vạn quân thủy bộ', 5], ['Chiến thuyền', '# chiếc', 300], ['Hành vi', 'Cướp bóc, gây oán hận trong dân']] },
          say: 'Quân Xiêm gồm năm vạn quân thủy bộ và ba trăm chiến thuyền, đi đến đâu cũng cướp phá, khiến nhân dân căm ghét. Nguyễn Huệ đóng quân ở Mỹ Tho, chọn khúc sông Rạch Gầm – Xoài Mút làm trận địa.' },
        { type: 'diagram', title: 'RẠCH GẦM – XOÀI MÚT 1785', oursName: 'Quân Tây Sơn', enemyName: 'Quân Xiêm',
          water: ['M0,390 C400,360 800,410 1200,380 C1500,360 1700,400 1920,380 L1920,700 C1600,720 1300,680 1000,710 C700,740 300,680 0,700Z',
            'M640,0 C660,120 690,260 720,395 L780,395 C740,260 710,120 700,0Z', 'M1230,695 C1250,800 1280,950 1300,1080 L1360,1080 C1330,950 1300,800 1290,695Z'],
          isles: [[900, 470, 170, 38], [1100, 615, 150, 34], [520, 610, 110, 26]],
          forest: [[300, 220, 500, 160, 20], [1000, 230, 500, 140, 18], [600, 870, 600, 170, 22], [1600, 860, 500, 160, 16]],
          labels: [{ x: 600, y: 150, text: 'RẠCH GẦM', style: 'warn' }, { x: 1430, y: 900, text: 'XOÀI MÚT', style: 'warn' }, { x: 360, y: 560, text: 'SÔNG TIỀN', style: 'river' }, { x: 1800, y: 340, text: 'MỸ THO ▶', style: 'warn' }],
          units: [
            { kind: 'ship', side: 'dich', big: 1, n: 14, spread: 170, label: 'Thủy binh Xiêm', path: [[.06, 40, 540], [.3, 560, 540], [.46, 1000, 545]], burn: .6, sink: .7, ly: -100 },
            { kind: 'ship', side: 'ta', n: 4, spread: 60, label: 'Thuyền phục', path: [[0, 700, 250], [.46, 700, 250], [.56, 860, 470]], at: .02 },
            { kind: 'ship', side: 'ta', n: 4, spread: 60, label: 'Thuyền phục', path: [[0, 1280, 850], [.46, 1280, 850], [.56, 1150, 620]], at: .02, ly: 70 },
            { kind: 'troop', side: 'ta', n: 4, spread: 80, path: [[0, 900, 470]], at: .02 },
            { kind: 'troop', side: 'ta', n: 6, spread: 140, label: 'Bộ binh trên bờ', path: [[0, 1050, 300]], at: .02 },
            { kind: 'troop', side: 'ta', n: 6, spread: 140, path: [[0, 820, 790]], at: .02 },
            { kind: 'ship', side: 'ta', big: 1, n: 6, spread: 90, label: 'Nguyễn Huệ', path: [[.42, 1880, 540], [.58, 1320, 540]], at: .42 }
          ],
          arrows: [
            { side: 'dich', d: 'M30,540 C300,530 600,550 900,545', at: .06, len: .32, until: .5 },
            { side: 'ta', d: 'M1050,330 C1040,400 1030,450 1020,500', at: .48, len: .06 },
            { side: 'ta', d: 'M840,760 C880,690 920,640 960,590', at: .49, len: .06 },
            { side: 'ta', d: 'M1800,540 C1600,540 1400,540 1180,545', at: .46, len: .12, w: 14 }
          ],
          fx: [{ x: 1000, y: 540, at: .6, len: .3, s: 1.5 }, { x: 860, y: 520, at: .63, len: .25 }],
          phases: [[0, '1 · Bố trí trận địa mai phục trên khúc sông dài khoảng 6 km'], [.06, '2 · Thủy binh Xiêm xuôi dòng tiến vào trận địa'], [.46, '3 · Quân Tây Sơn đồng loạt tấn công từ bờ, cù lao và mặt sông'], [.7, '4 · Quân Xiêm gần như bị tiêu diệt hoàn toàn']],
          say: 'Rạng sáng ngày 19 tháng 1 năm 1785, Nguyễn Huệ nhử thủy binh Xiêm tiến vào khúc sông Rạch Gầm – Xoài Mút. Bộ binh và thủy binh Tây Sơn mai phục trên bờ, trên các cù lao bất ngờ đổ ra đánh tạt sườn, chặn đầu khóa đuôi. Thuyền giặc bị đánh tan, bốc cháy giữa dòng.', min: 22 },
        { type: 'timeline', title: 'DIỄN BIẾN', items: [['1784', 'Quân Xiêm kéo vào Gia Định'], ['Cuối 1784', 'Nguyễn Huệ vào Nam, đóng ở Mỹ Tho'], ['19.01.1785', 'Đại thắng Rạch Gầm – Xoài Mút'], ['Sau trận', 'Chỉ vài nghìn quân Xiêm thoát về nước']],
          say: 'Phần lớn quân Xiêm bị tiêu diệt, chỉ còn vài nghìn tên sống sót, theo đường bộ chạy về nước.' },
        { type: 'points', items: ['Đập tan âm mưu xâm lược của quân Xiêm', 'Một trong những trận thủy chiến lớn nhất lịch sử Việt Nam', 'Khẳng định tài cầm quân kiệt xuất của Nguyễn Huệ'],
          say: 'Trận Rạch Gầm – Xoài Mút đập tan mộng xâm lược của quân Xiêm, trở thành một trong những trận thủy chiến lẫy lừng nhất lịch sử dân tộc.' },
        { type: 'end', sub: 'Rạch Gầm – Xoài Mút 1785 · Nguyễn Huệ', next: 'Ngọc Hồi – Đống Đa 1789', say: 'Cảm ơn bạn đã theo dõi. Hẹn gặp lại ở trận đánh tiếp theo.' }
      ]
    },
    /* =================================================================== */
    {
      id: 'dong-da-1789', year: '1789', name: 'Ngọc Hồi – Đống Đa 1789', who: 'Quang Trung', vs: 'Thanh', seed: 29,
      scenes: [
        { type: 'title', title: 'ĐỐNG ĐA', sub: 'NGỌC HỒI – ĐỐNG ĐA XUÂN KỶ DẬU 1789', line: 'QUANG TRUNG · ĐẠI PHÁ 29 VẠN QUÂN THANH', stamp: 'THẦN TỐC', ships: 2,
          say: 'Mùa xuân Kỷ Dậu năm 1789, chỉ trong vài ngày Tết, vua Quang Trung đã đại phá hai mươi chín vạn quân Thanh, giải phóng Thăng Long.' },
        { type: 'hero', kicker: 'HOÀNG ĐẾ', name: 'Quang Trung', plate: 'NGUYỄN HUỆ', alt: 'Nguyễn Huệ · 1753 – 1792', role: 'Lên ngôi năm 1788 tại Phú Xuân',
          say: 'Được tin quân Thanh chiếm Thăng Long, Nguyễn Huệ lên ngôi Hoàng đế, lấy niên hiệu Quang Trung, rồi lập tức thân chinh cầm quân ra Bắc.' },
        { type: 'map', date: 'TẾT KỶ DẬU 1789', cutLat: 8, legendOurs: 'Lãnh thổ Việt Nam', legendEnemy: 'Nhà Thanh', enemy: { countries: CHINA },
          cam: [{ lon: 106.5, lat: 18.5, z: 1.5 }, { lon: 105.9, lat: 20.6, z: 2.6 }],
          labels: [{ lon: 111, lat: 24.5, text: 'NHÀ THANH', style: 'enemy', at: .05 }, { lon: 107.58, lat: 16.46, text: 'Phú Xuân', dot: 1, anchor: 'start', at: .1 },
            { lon: 105.68, lat: 18.67, text: 'Nghệ An', dot: 1, at: .3 }, { lon: 105.78, lat: 19.8, text: 'Thanh Hóa', dot: 1, anchor: 'end', at: .4 }, { lon: 105.9, lat: 20.15, text: 'Tam Điệp', dot: 1, anchor: 'start', at: .48 }],
          routes: [{ pts: [[107.55, 16.5], [106.3, 17.6], [105.6, 18.7], [105.8, 19.8], [105.9, 20.2], [105.85, 20.9]], side: 'ta', at: .15, len: .5, bend: .4 },
            { pts: [[108.3, 22.9], [107, 22.2], [106.2, 21.4], [105.9, 21.1]], side: 'dich', at: .05, len: .25 }],
          marker: { lon: 105.84, lat: 21.0, text: 'Thăng Long', at: .72 },
          say: 'Từ Phú Xuân, đại quân hành quân thần tốc, vừa đi vừa tuyển thêm quân ở Nghệ An, Thanh Hóa. Đến Tam Điệp, Quang Trung cho quân ăn Tết trước, hẹn ngày mùng 7 vào Thăng Long mở tiệc ăn mừng.' },
        { type: 'forces', ours: { name: 'QUÂN TÂY SƠN', rows: [['Tổng chỉ huy', 'Vua Quang Trung'], ['Lực lượng', 'Hơn # vạn quân', 10], ['Voi chiến', 'Vài trăm thớt']] },
          enemy: { name: 'NHÀ THANH', rows: [['Chỉ huy', 'Tôn Sĩ Nghị'], ['Lực lượng', '# vạn quân', 29], ['Tâm lý', 'Chủ quan, mải ăn Tết']] },
          say: 'Tôn Sĩ Nghị cầm đầu hai mươi chín vạn quân Thanh, kiêu căng, chủ quan, mải mê ăn Tết. Quân Tây Sơn có hơn mười vạn người cùng hàng trăm voi chiến.' },
        { type: 'diagram', title: 'NGỌC HỒI – ĐỐNG ĐA 1789', oursName: 'Quân Tây Sơn', enemyName: 'Quân Thanh',
          water: ['M1480,0 C1430,300 1590,600 1490,1080 L1630,1080 C1730,600 1570,300 1620,0Z'],
          forest: [[300, 300, 300, 200, 12], [1200, 600, 200, 300, 10]],
          bridge: { at: [1440, 230, 1680, 230], fall: .82 },
          forts: [{ x: 960, y: 190, side: 'dich', label: 'Thăng Long', fall: .92 }, { x: 960, y: 690, side: 'dich', label: 'Đồn Ngọc Hồi', fall: .5 },
            { x: 960, y: 860, side: 'dich', label: 'Đồn Hà Hồi', fall: .2 }, { x: 600, y: 430, side: 'dich', label: 'Khương Thượng (Đống Đa)', fall: .6 }],
          labels: [{ x: 1700, y: 860, text: 'SÔNG NHỊ HÀ', style: 'river' }, { x: 1560, y: 200, text: 'Cầu phao', style: 'warn' }, { x: 1300, y: 700, text: 'Mộc ván bọc rơm ướt', style: 'warn', at: .3 },
            { x: 600, y: 520, text: '✕ Sầm Nghi Đống tự tử', style: 'warn', at: .62 }],
          units: [
            { kind: 'troop', side: 'ta', n: 6, spread: 110, label: 'Quang Trung', path: [[.02, 960, 1060], [.16, 960, 930], [.32, 960, 800], [.48, 960, 740], [.8, 960, 270]], ly: 75 },
            { kind: 'troop', side: 'ta', n: 4, spread: 80, label: 'Đô đốc Long', path: [[.3, 240, 1000], [.56, 560, 520], [.78, 820, 250]], at: .3, lx: -160, ly: 0 },
            { kind: 'troop', side: 'ta', n: 3, spread: 60, label: 'Chặn đường rút', path: [[.25, 1300, 1060], [.6, 1780, 380]], at: .25, lx: 0, ly: -40 },
            { kind: 'troop', side: 'dich', n: 5, spread: 80, path: [[0, 960, 640]], sink: .5 },
            { kind: 'troop', side: 'dich', n: 4, spread: 70, path: [[0, 640, 360]], sink: .6 },
            { kind: 'troop', side: 'dich', n: 8, spread: 120, label: 'Tôn Sĩ Nghị tháo chạy', path: [[0, 1130, 330], [.62, 1130, 330], [.8, 1500, 240], [.84, 1560, 240]], sink: .84, ly: -50 }
          ],
          arrows: [
            { side: 'ta', d: 'M960,1060 C950,980 970,940 960,900', at: .04, len: .1 },
            { side: 'ta', d: 'M960,840 C950,800 970,770 960,725', at: .32, len: .14, w: 14 },
            { side: 'ta', d: 'M240,980 C300,800 460,620 580,470', at: .32, len: .22 },
            { side: 'ta', d: 'M960,660 C950,500 970,350 960,240', at: .62, len: .16, w: 14 },
            { side: 'dich', d: 'M1130,300 C1250,260 1400,240 1560,235', at: .64, len: .14 }
          ],
          fx: [{ x: 960, y: 860, at: .16, len: .1 }, { x: 960, y: 690, at: .46, len: .14, s: 1.4 }, { x: 600, y: 430, at: .56, len: .14, s: 1.3 }, { x: 1560, y: 235, at: .82, len: .1 }],
          phases: [[0, '1 · Đêm mùng 3 Tết: bí mật vây và hạ đồn Hà Hồi'], [.3, '2 · Mờ sáng mùng 5: tấn công đồn Ngọc Hồi'], [.5, '3 · Đô đốc Long đánh Khương Thượng (Đống Đa)'], [.66, '4 · Quân Thanh tháo chạy, cầu phao sập – trưa mùng 5 vào Thăng Long']],
          say: 'Đêm mùng 3 Tết, quân ta bí mật vây đồn Hà Hồi, địch hoảng sợ xin hàng. Mờ sáng mùng 5, Quang Trung đánh đồn Ngọc Hồi; quân ta che mộc ván bọc rơm ướt, xông thẳng vào trận địa. Cùng lúc, cánh quân Đô đốc Long đánh Khương Thượng, tướng giặc Sầm Nghi Đống thắt cổ tự tử. Tôn Sĩ Nghị hoảng hồn tháo chạy, cầu phao trên sông Nhị Hà sập, quân giặc chết đuối rất nhiều.', min: 24 },
        { type: 'quote', quote: 'Đánh cho để dài tóc, đánh cho để đen răng, đánh cho nó chích luân bất phản, đánh cho nó phiến giáp bất hoàn, đánh cho sử tri Nam quốc anh hùng chi hữu chủ.', by: 'Lời hiệu triệu của vua Quang Trung',
          say: 'Lời hiệu triệu của vua Quang Trung trước giờ xuất quân đã khơi dậy lòng yêu nước và ý chí quyết thắng của toàn quân.' },
        { type: 'points', items: ['Trưa mùng 5 Tết, đại quân tiến vào Thăng Long – sớm hơn dự định', 'Đập tan 29 vạn quân Thanh chỉ trong vài ngày', 'Đỉnh cao nghệ thuật hành quân thần tốc, bất ngờ'],
          say: 'Trưa mùng 5 Tết, vua Quang Trung cùng đoàn quân chiến thắng tiến vào Thăng Long, sớm hơn hai ngày so với dự định. Ngày mùng 5 Tết vẫn được kỷ niệm là ngày giỗ trận Đống Đa.' },
        { type: 'end', sub: 'Ngọc Hồi – Đống Đa 1789 · Quang Trung', say: 'Cảm ơn bạn đã theo dõi loạt video những trận đánh lừng danh trong lịch sử dân tộc.' }
      ]
    }
  ];
})();
