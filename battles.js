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
        { kind: 'ship', side: 'dich', big: 1, n: 11, spread: 150, cmd: 1, label: o.enemyFleet, path: [[.1, 1880, 990], [.26, 1380, 780], [.44, 840, 520], [.5, 820, 510], [.66, 1130, 680]], sink: .74, burn: .7, ly: -95 },
        { kind: 'troop', side: 'ta', n: 5, spread: 90, label: 'Phục binh', path: [[0, 1000, 330]], at: .44 },
        { kind: 'troop', side: 'ta', n: 5, spread: 90, label: 'Phục binh', path: [[0, 820, 760]], at: .46, ly: 70 },
        { kind: 'ship', side: 'ta', n: 7, spread: 110, cmd: 1, label: o.mainFleet, path: [[.46, 120, 270], [.62, 620, 430], [.8, 930, 560]], at: .46 }
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
      id: 'bach-dang-938', year: '938', name: 'Bạch Đằng 938', who: 'Ngô Quyền', vs: 'Nam Hán', seed: 3, sources: ['Đại Việt sử ký toàn thư', 'Wikipedia – Trận Bạch Đằng (938)', 'Báo Nhân Dân', 'Báo Giáo dục Việt Nam'],
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
      id: 'nhu-nguyet-1077', year: '1077', name: 'Như Nguyệt 1077', who: 'Lý Thường Kiệt', vs: 'Tống', seed: 11, sources: ['Đại Việt sử ký toàn thư', 'SGK Lịch sử 7', 'Wikipedia – Trận Như Nguyệt', 'Tạp chí Quản lý Nhà nước'],
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
          say: 'Cuối năm 1075, quân Lý bất ngờ đánh sang Khâm Châu, Liêm Châu. Đầu năm 1076, sau hơn bốn mươi ngày vây hãm, thành Ung Châu thất thủ. Đầu năm 1077, quân Tống kéo sang báo thù, nhưng bị chặn lại ở sông Như Nguyệt.' },
        { type: 'forces', ours: { name: 'ĐẠI VIỆT – NHÀ LÝ', rows: [['Chỉ huy', 'Lý Thường Kiệt'], ['Chủ lực', 'Khoảng # vạn quân', 6], ['Thế trận', 'Phòng tuyến dọc bờ nam sông']] },
          enemy: { name: 'NHÀ TỐNG', rows: [['Chỉ huy', 'Quách Quỳ, Triệu Tiết'], ['Lực lượng', '# vạn quân (theo SGK)', 10], ['Hậu cần', 'Khoảng 20 vạn dân phu']] },
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
            { kind: 'troop', side: 'dich', n: 6, spread: 140, path: [[0, 1250, 400]] },
            { kind: 'troop', side: 'ta', n: 6, spread: 150, label: 'Quân giữ lũy', path: [[0, 980, 700]], ly: 70 },
            { kind: 'troop', side: 'ta', n: 6, spread: 100, cmd: 1, label: 'Lý Thường Kiệt', path: [[.52, 260, 760], [.64, 260, 540], [.8, 330, 360]], at: .52, until: .98, lx: -10, ly: 70 }
          ],
          arrows: [
            { side: 'dich', d: 'M980,330 L980,480', at: .12, len: .12, until: .42 },
            { side: 'ta', d: 'M900,680 Q930,600 960,540', at: .3, len: .06, until: .5 },
            { side: 'ta', d: 'M1060,680 Q1030,600 1000,540', at: .31, len: .06, until: .5 },
            { side: 'ta', d: 'M260,780 C200,600 300,420 455,320', at: .54, len: .22, w: 14 }
          ],
          fx: [{ x: 980, y: 540, at: .36, len: .1 }, { x: 520, y: 290, at: .78, len: .22, s: 1.5 }],
          phases: [[0, '1 · Lập phòng tuyến dọc bờ nam sông Như Nguyệt'], [.12, '2 · Quân Tống nhiều lần vượt sông – đều bị đánh bật'], [.52, '3 · Quân ta bất ngờ vượt sông, đánh úp doanh trại địch'], [.82, '4 · Quân Tống kiệt quệ, phải rút về nước']],
          say: 'Quân Tống nhiều lần đóng bè vượt sông, có lúc chọc thủng phòng tuyến, nhưng đều bị đánh bật trở lại. Bị cầm chân hàng tháng trời, quân Tống lâm vào cảnh mệt mỏi, thiếu lương, chết vì bệnh tật. Lý Thường Kiệt mở cuộc tấn công lớn sang bờ bắc, khiến địch thua to.', min: 22 },
        { type: 'quote', quote: 'Sông núi nước Nam vua Nam ở, rành rành định phận tại sách trời. Cớ sao lũ giặc sang xâm phạm? Chúng bay sẽ bị đánh tơi bời!', by: 'Nam quốc sơn hà – tương truyền của Lý Thường Kiệt',
          say: 'Tương truyền, giữa lúc trận chiến căng thẳng, bài thơ Nam quốc sơn hà vang lên trong đêm, cổ vũ tinh thần quân sĩ, được xem như bản tuyên ngôn độc lập đầu tiên của dân tộc.' },
        { type: 'points', items: ['Đập tan ý đồ xâm lược của nhà Tống', 'Nghệ thuật "tiên phát chế nhân" – tiến công trước để tự vệ', 'Chủ động giảng hòa, kết thúc chiến tranh có lợi cho Đại Việt'],
          say: 'Lý Thường Kiệt chủ động đề nghị giảng hòa, mở lối thoát cho quân Tống rút về. Cách kết thúc chiến tranh mềm dẻo ấy giữ vững nền độc lập, tránh thêm hy sinh cho cả hai bên.' },
        { type: 'end', sub: 'Như Nguyệt 1077 · Lý Thường Kiệt', next: 'Đông Bộ Đầu 1258', say: 'Cảm ơn bạn đã theo dõi. Hẹn gặp lại ở trận đánh tiếp theo.' }
      ]
    },

    /* ======================= HƯNG ĐẠO VƯƠNG & BA LẦN KHÁNG CHIẾN CHỐNG NGUYÊN MÔNG ======================= */
    {
      id: 'dong-bo-dau-1258', year: '1258', name: 'Đông Bộ Đầu 1258', who: 'Trần Thái Tông', vs: 'Mông Cổ', seed: 31, sources: ['Đại Việt sử ký toàn thư', 'SGK Lịch sử 7', 'Báo Giáo dục Việt Nam', 'Wikipedia – Trận Bình Lệ Nguyên'], series: 'SỬ VIỆT · HƯNG ĐẠO VƯƠNG',
      scenes: [
        { type: 'title', title: 'ĐÔNG BỘ ĐẦU', sub: 'TRẬN PHẢN CÔNG NĂM 1258', line: 'LẦN THỨ NHẤT ĐÁNH BẠI QUÂN MÔNG CỔ', stamp: 'ĐẦU THẦN CHƯA RƠI', ships: 3,
          say: 'Đầu năm 1258, đội quân Mông Cổ từng làm khiếp sợ cả châu Á tràn vào Đại Việt. Chưa đầy hai tuần sau, chúng bị đánh tan ở bến Đông Bộ Đầu, phải rút chạy về nước.' },
        { type: 'hero', kicker: 'VỊ VUA CẦM QUÂN', name: 'Trần Thái Tông', alt: '1218 – 1277', role: 'Vị vua đầu tiên của nhà Trần',
          say: 'Vua Trần Thái Tông trực tiếp cầm quân. Theo sử cũ, Trần Quốc Tuấn, khi ấy còn trẻ, được giao đem quân thủy bộ ra trấn giữ vùng biên giới phía bắc.' },
        { type: 'map', date: '01.1258', cutLat: 16.8, legendEnemy: 'Mông Cổ', enemy: { countries: ['China', 'Hong Kong', 'Macao', 'Taiwan'] },
          cam: [{ lon: 103.5, lat: 23, z: 1.3 }, { lon: 105.4, lat: 21.5, z: 3.2 }],
          labels: [{ lon: 101.5, lat: 25.3, text: 'MÔNG CỔ', style: 'enemy', at: .05 }, { lon: 105.3, lat: 20.0, text: 'ĐẠI VIỆT', style: 'ours', at: .05 },
            { lon: 100.2, lat: 25.6, text: 'Đại Lý', dot: 1, at: .1 }, { lon: 105.55, lat: 21.3, text: 'Bình Lệ Nguyên', dot: 1, anchor: 'end', at: .45 }],
          routes: [{ pts: [[100.6, 25.2], [102.9, 23.6], [104.3, 22.4], [105.2, 21.6], [105.55, 21.3], [105.82, 21.06]], side: 'dich', at: .15, len: .45 }],
          marker: { lon: 105.86, lat: 21.045, text: 'Thăng Long – bến Đông Bộ Đầu', at: .72 },
          say: 'Từ Vân Nam, tướng Ngột Lương Hợp Thai dẫn quân theo sông Thao tiến xuống. Ngày 17 tháng 1 năm 1258, quân ta chặn đánh ở Bình Lệ Nguyên rồi chủ động rút lui, bỏ trống kinh thành Thăng Long.' },
        { type: 'forces', ours: { name: 'ĐẠI VIỆT – NHÀ TRẦN', rows: [['Chỉ huy', 'Vua Trần Thái Tông'], ['Phối hợp', 'Thái tử Trần Hoảng, Lê Phụ Trần'], ['Kế sách', 'Vườn không nhà trống']] },
          enemy: { name: 'MÔNG CỔ', rows: [['Chỉ huy', 'Ngột Lương Hợp Thai'], ['Lực lượng', 'Kỵ binh Mông Cổ thiện chiến'], ['Điểm yếu', 'Thiếu lương, không quen thủy thổ']] },
          say: 'Quân Mông Cổ vào Thăng Long chỉ thấy thành trống, không lương thực. Giữa lúc ấy, Thái sư Trần Thủ Độ khẳng khái tâu vua: Đầu thần chưa rơi xuống đất, xin bệ hạ đừng lo.' },
        { type: 'diagram', title: 'TRẬN ĐÔNG BỘ ĐẦU 1258', oursName: 'Quân nhà Trần', enemyName: 'Quân Mông Cổ',
          water: ['M1240,0 C1180,220 1330,420 1260,620 C1200,800 1320,940 1280,1080 L1420,1080 C1460,940 1340,800 1400,620 C1470,420 1320,220 1380,0Z'],
          hills: [[260, 160, 360, 120, 6], [1700, 220, 320, 160, 6]], forest: [[420, 760, 420, 200, 18], [1650, 760, 300, 220, 12]],
          forts: [{ x: 560, y: 300, side: 'ta', label: 'Thăng Long (bỏ trống)' }],
          labels: [{ x: 1470, y: 120, text: 'SÔNG HỒNG', style: 'river' }, { x: 1060, y: 430, text: 'Bến Đông Bộ Đầu', style: 'warn' }, { x: 250, y: 680, text: '◀ Quy Hóa – đường về Vân Nam', style: 'warn', at: .7 }],
          units: [
            { kind: 'horse', side: 'dich', n: 9, spread: 150, cmd: 1, label: 'Ngột Lương Hợp Thai', path: [[0, 950, 420], [.55, 950, 420], [.74, 640, 520], [.92, 200, 600]], sink: .97, lx: 0, ly: -70 },
            { kind: 'ship', side: 'ta', big: 1, n: 8, spread: 90, cmd: 1, label: 'Trần Thái Tông', path: [[.06, 1330, 1060], [.3, 1310, 760], [.44, 1290, 470]], lx: 170, ly: 0 },
            { kind: 'troop', side: 'ta', n: 6, spread: 110, label: 'Đổ bộ tập kích', path: [[.44, 1220, 470], [.58, 1060, 440], [.76, 820, 520]], at: .44, ly: 70 },
            { kind: 'troop', side: 'ta', n: 4, spread: 80, label: 'Dân binh chặn đánh', path: [[0, 470, 800]], at: .72, ly: 70 }
          ],
          arrows: [
            { side: 'ta', d: 'M1330,1050 C1290,860 1330,660 1290,480', at: .08, len: .3, w: 14 },
            { side: 'ta', d: 'M1230,470 C1150,460 1080,450 1010,440', at: .46, len: .1 },
            { side: 'dich', d: 'M900,430 C760,480 520,560 230,600', at: .6, len: .25 },
            { side: 'ta', d: 'M450,770 C390,700 320,650 250,620', at: .8, len: .08 }
          ],
          fx: [{ x: 960, y: 420, at: .5, len: .15, s: 1.3 }],
          phases: [[0, '1 · Vườn không nhà trống – quân Mông Cổ vào thành trống'], [.06, '2 · Đêm tối, thủy quân nhà Trần ngược sông Hồng'], [.44, '3 · Rạng sáng 29/1: tập kích bến Đông Bộ Đầu'], [.66, '4 · Quân Mông Cổ tháo chạy, bị chặn đánh ở Quy Hóa']],
          say: 'Đêm 28 tháng 1, vua Trần Thái Tông cùng thái tử Trần Hoảng dẫn thủy quân ngược sông Hồng. Rạng sáng ngày 29, quân ta bất ngờ tập kích quân Mông Cổ ở bến Đông Bộ Đầu. Địch không kịp trở tay, tháo chạy theo đường cũ về Vân Nam, dọc đường lại bị dân binh vùng Quy Hóa chặn đánh tơi bời.', min: 22 },
        { type: 'quote', quote: 'Đầu thần chưa rơi xuống đất, xin bệ hạ đừng lo.', by: 'Thái sư Trần Thủ Độ',
          say: 'Câu nói của Thái sư Trần Thủ Độ trở thành biểu tượng cho bản lĩnh và ý chí sắt đá của vua tôi nhà Trần trước kẻ thù hùng mạnh.' },
        { type: 'points', items: ['Lần đầu đánh bại quân Mông Cổ hùng mạnh', 'Kế sách vườn không nhà trống phát huy hiệu quả', 'Bài học quý cho hai cuộc kháng chiến sau'],
          say: 'Chiến thắng Đông Bộ Đầu chứng minh đội quân bách chiến bách thắng cũng có thể bị đánh bại, để lại bài học quý cho hai cuộc kháng chiến tiếp theo.' },
        { type: 'end', sub: 'Đông Bộ Đầu 1258 · Trần Thái Tông', next: 'Hàm Tử – Chương Dương 1285', say: 'Cảm ơn bạn đã theo dõi. Hẹn gặp lại ở trận đánh tiếp theo.' }
      ]
    },
    {
      id: 'ham-tu-1285', year: '1285', name: 'Hàm Tử – Chương Dương 1285', who: 'Trần Quang Khải', vs: 'Nguyên Mông', seed: 37, sources: ['Đại Việt sử ký toàn thư', 'SGK Lịch sử 7', 'Báo Nhân Dân', 'Znews', 'Wikipedia – Trận Chương Dương'], series: 'SỬ VIỆT · HƯNG ĐẠO VƯƠNG',
      scenes: [
        { type: 'title', title: 'HÀM TỬ', sub: 'HÀM TỬ – CHƯƠNG DƯƠNG NĂM 1285', line: 'LẦN THỨ HAI KHÁNG CHIẾN CHỐNG NGUYÊN MÔNG', stamp: 'ĐOẠT SÁO CHƯƠNG DƯƠNG', ships: 6,
          say: 'Năm 1285, trên dòng sông Hồng, quân dân nhà Trần liên tiếp đánh tan quân Nguyên ở Hàm Tử và Chương Dương, mở màn cuộc tổng phản công giải phóng kinh thành.' },
        { type: 'hero', kicker: 'THƯỢNG TƯỚNG THÁI SƯ', name: 'Trần Quang Khải', alt: '1241 – 1294', role: 'Tướng chỉ huy trận Chương Dương',
          say: 'Dưới sự tổng chỉ huy của Hưng Đạo Vương Trần Quốc Tuấn, các tướng Trần Nhật Duật và Trần Quang Khải lập nên hai chiến công vang dội ở Hàm Tử và Chương Dương.' },
        { type: 'map', date: '04 – 06.1285', cutLat: 16.8, legendEnemy: 'Nhà Nguyên', enemy: { countries: ['China', 'Hong Kong', 'Macao', 'Taiwan'] },
          cam: [{ lon: 106.5, lat: 18, z: 1.2 }, { lon: 105.95, lat: 20.9, z: 3.8 }],
          labels: [{ lon: 111.5, lat: 24.4, text: 'NHÀ NGUYÊN', style: 'enemy', at: .05 }, { lon: 105.85, lat: 21.03, text: 'Thăng Long', dot: 1, anchor: 'end', at: .5 },
            { lon: 109.2, lat: 13.8, text: 'Chăm-pa', dot: 1, at: .15 }],
          routes: [{ pts: [[108.3, 22.9], [107.2, 22.3], [106.3, 21.3], [105.9, 21.08]], side: 'dich', at: .1, len: .25 },
            { pts: [[109.1, 13.9], [108.0, 16.3], [106.3, 17.8], [105.7, 18.8], [105.8, 19.9], [105.98, 20.8]], side: 'dich', at: .3, len: .35, bend: .5 }],
          marker: { lon: 105.98, lat: 20.84, text: 'Hàm Tử – Chương Dương', at: .75 },
          say: 'Đầu năm 1285, hơn năm mươi vạn quân Nguyên do Thoát Hoan chỉ huy tràn sang. Ở phía nam, đạo quân của Toa Đô từ Chăm-pa đánh ra Nghệ An, Thanh Hóa, hòng hợp vây quân ta.' },
        { type: 'forces', ours: { name: 'ĐẠI VIỆT – NHÀ TRẦN', rows: [['Tổng chỉ huy', 'Hưng Đạo Vương Trần Quốc Tuấn'], ['Hàm Tử', 'Trần Nhật Duật, Trần Quốc Toản'], ['Chương Dương', 'Trần Quang Khải, Phạm Ngũ Lão']] },
          enemy: { name: 'NHÀ NGUYÊN', rows: [['Tổng chỉ huy', 'Thoát Hoan'], ['Lực lượng', 'Hơn # vạn quân (theo SGK)', 50], ['Cánh phía nam', 'Toa Đô, Ô Mã Nhi']] },
          say: 'Khi quân Nguyên bắt đầu mệt mỏi, thiếu lương, Hưng Đạo Vương quyết định phản công, nhằm thẳng vào đạo quân Toa Đô đang ngược sông Hồng.' },
        { type: 'diagram', title: 'HÀM TỬ – CHƯƠNG DƯƠNG 1285', oursName: 'Quân nhà Trần', enemyName: 'Quân Nguyên',
          water: ['M880,0 C820,200 1000,380 920,560 C840,740 1000,900 940,1080 L1080,1080 C1140,900 980,740 1060,560 C1140,380 960,200 1020,0Z'],
          hills: [[1650, 200, 380, 160, 6]], forest: [[300, 640, 380, 260, 18], [1450, 760, 420, 240, 16]],
          forts: [{ x: 470, y: 160, side: 'dich', label: 'Thăng Long', fall: .92 }, { x: 700, y: 430, side: 'dich', label: 'Đồn Chương Dương', fall: .6 }],
          labels: [{ x: 1180, y: 80, text: 'SÔNG HỒNG', style: 'river' }, { x: 1230, y: 860, text: 'Bến Hàm Tử', style: 'warn' }],
          units: [
            { kind: 'ship', side: 'dich', big: 1, n: 8, spread: 110, cmd: 1, label: 'Toa Đô', path: [[.03, 1000, 1070], [.2, 990, 800]], burn: .3, sink: .38, lx: 170, ly: 0 },
            { kind: 'troop', side: 'ta', n: 6, spread: 120, cmd: 1, label: 'Trần Nhật Duật', path: [[0, 780, 820]], at: .1, lx: -190, ly: 0 },
            { kind: 'ship', side: 'ta', n: 5, spread: 70, path: [[.12, 960, 560], [.26, 985, 740]], at: .12 },
            { kind: 'troop', side: 'ta', n: 6, spread: 100, cmd: 1, label: 'Trần Quang Khải', path: [[.42, 1300, 600], [.52, 1000, 480], [.6, 790, 440]], at: .42, lx: 0, ly: -70 },
            { kind: 'troop', side: 'dich', n: 4, spread: 70, path: [[0, 640, 380]], sink: .6 },
            { kind: 'troop', side: 'dich', n: 5, spread: 80, label: 'Viện binh Nguyên', path: [[.58, 470, 220], [.7, 560, 320]], at: .58, sink: .74, ly: -50 },
            { kind: 'troop', side: 'ta', n: 4, spread: 70, label: 'Phục binh', path: [[0, 330, 360]], at: .6, ly: 70 },
            { kind: 'troop', side: 'ta', n: 7, spread: 120, label: 'Tiến vào kinh thành', path: [[.8, 820, 470], [.94, 560, 250]], at: .8, lx: 200, ly: 0 }
          ],
          arrows: [
            { side: 'dich', d: 'M1000,1060 C980,960 1000,880 990,820', at: .03, len: .15, until: .4 },
            { side: 'ta', d: 'M800,800 C860,800 910,800 960,800', at: .16, len: .08 },
            { side: 'ta', d: 'M1320,600 C1200,560 1050,500 820,450', at: .44, len: .14, w: 14 },
            { side: 'ta', d: 'M360,340 C430,320 480,310 540,300', at: .62, len: .08 },
            { side: 'ta', d: 'M760,420 C700,360 600,270 520,210', at: .8, len: .12 }
          ],
          fx: [{ x: 990, y: 790, at: .3, len: .15, s: 1.4 }, { x: 700, y: 430, at: .56, len: .14, s: 1.3 }],
          phases: [[0, '1 · Đoàn thuyền Toa Đô ngược sông Hồng'], [.12, '2 · Trần Nhật Duật đánh tan giặc ở Hàm Tử'], [.42, '3 · Trần Quang Khải tập kích đồn Chương Dương'], [.6, '4 · Phục binh chặn đứng viện binh từ Thăng Long'], [.78, '5 · Tiến vào giải phóng kinh thành']],
          say: 'Tháng 4 năm 1285, Trần Nhật Duật cùng Trần Quốc Toản đón đánh đoàn thuyền của Toa Đô ở bến Hàm Tử, quân giặc thua to. Tiếp đó, Trần Quang Khải đem thủy quân bất ngờ đánh vào đồn Chương Dương, phục binh chặn đứng viện binh từ Thăng Long kéo ra. Quân ta thừa thắng tiến vào giải phóng kinh thành.', min: 24 },
        { type: 'quote', quote: 'Chương Dương cướp giáo giặc, Hàm Tử bắt quân thù. Thái bình nên gắng sức, non nước ấy ngàn thu.', by: 'Trần Quang Khải – Tụng giá hoàn kinh sư',
          say: 'Sau chiến thắng, Thượng tướng Trần Quang Khải viết bài thơ Tụng giá hoàn kinh sư, ghi lại niềm tự hào của cả dân tộc.' },
        { type: 'points', items: ['Chặn đứng ý đồ hợp vây của quân Nguyên', 'Giải phóng kinh thành Thăng Long', 'Mở đầu cuộc tổng phản công năm 1285'],
          say: 'Chiến thắng Hàm Tử – Chương Dương phá tan ý đồ hợp vây của quân Nguyên, giải phóng Thăng Long và mở đầu cuộc tổng phản công năm 1285.' },
        { type: 'end', sub: 'Hàm Tử – Chương Dương 1285 · Trần Quang Khải', next: 'Tây Kết – Vạn Kiếp 1285', say: 'Cảm ơn bạn đã theo dõi. Hẹn gặp lại ở trận đánh tiếp theo.' }
      ]
    },
    {
      id: 'tay-ket-1285', year: '1285', name: 'Tây Kết – Vạn Kiếp 1285', who: 'Trần Hưng Đạo', vs: 'Nguyên Mông', seed: 41, sources: ['Đại Việt sử ký toàn thư', 'SGK Lịch sử 7', 'Wikipedia – Mongol invasions of Vietnam'], series: 'SỬ VIỆT · HƯNG ĐẠO VƯƠNG',
      scenes: [
        { type: 'title', title: 'TÂY KẾT', sub: 'TÂY KẾT – VẠN KIẾP NĂM 1285', line: 'HƯNG ĐẠO VƯƠNG ĐẠI PHÁ QUÂN NGUYÊN', stamp: 'SÁT THÁT', ships: 5,
          say: 'Mùa hè năm 1285, Hưng Đạo Vương mở những đòn quyết định ở Tây Kết và Vạn Kiếp, quét sạch quân Nguyên ra khỏi bờ cõi lần thứ hai.' },
        { type: 'hero', kicker: 'QUỐC CÔNG TIẾT CHẾ', name: 'Trần Hưng Đạo', alt: 'Hưng Đạo Vương Trần Quốc Tuấn', role: 'Tổng chỉ huy kháng chiến chống Nguyên Mông',
          say: 'Trước giờ quyết chiến, Hưng Đạo Vương soạn Hịch tướng sĩ. Quân sĩ nhà Trần thích lên cánh tay hai chữ Sát Thát, nghĩa là giết giặc Thát Đát, thể hiện ý chí quyết chiến.' },
        { type: 'map', date: '06.1285', cutLat: 16.8, legendEnemy: 'Nhà Nguyên', enemy: { countries: ['China', 'Hong Kong', 'Macao', 'Taiwan'] },
          cam: [{ lon: 107, lat: 21.5, z: 1.8 }, { lon: 106.2, lat: 21.3, z: 3.6 }],
          labels: [{ lon: 111.5, lat: 24.4, text: 'NHÀ NGUYÊN', style: 'enemy', at: .05 }, { lon: 105.85, lat: 21.03, text: 'Thăng Long', dot: 1, anchor: 'end', at: .3 },
            { lon: 106.0, lat: 20.8, text: 'Tây Kết', dot: 1, anchor: 'end', at: .45 }, { lon: 106.76, lat: 21.85, text: 'Lạng Sơn', dot: 1, anchor: 'start', at: .55 }],
          routes: [{ pts: [[105.88, 21.03], [106.15, 21.08], [106.4, 21.12], [106.6, 21.5], [106.76, 21.95], [107.0, 22.4]], side: 'dich', at: .3, len: .4, bend: .5 }],
          marker: { lon: 106.4, lat: 21.1, text: 'Vạn Kiếp', at: .7 },
          say: 'Mất Thăng Long, Thoát Hoan tính đường rút về phía bắc. Đạo quân Toa Đô ở phía nam không hay biết, vẫn ngược sông Hồng định hội quân.' },
        { type: 'forces', ours: { name: 'ĐẠI VIỆT – NHÀ TRẦN', rows: [['Tổng chỉ huy', 'Hưng Đạo Vương'], ['Tây Kết', 'Quân nhà vua và các vương hầu'], ['Vạn Kiếp', 'Hưng Đạo Vương trực tiếp chỉ huy']] },
          enemy: { name: 'NHÀ NGUYÊN', rows: [['Phía nam', 'Toa Đô, Ô Mã Nhi'], ['Phía bắc', 'Thoát Hoan, Lý Hằng'], ['Tình thế', 'Mất Thăng Long, quân rã rời']] },
          say: 'Hưng Đạo Vương bố trí quân chặn hai ngả: đón đánh đạo quân phía nam ở Tây Kết, và chặn đường rút của Thoát Hoan ở Vạn Kiếp, căn cứ quan trọng bên sông Lục Đầu.' },
        { type: 'diagram', title: 'TÂY KẾT – VẠN KIẾP 1285', oursName: 'Quân nhà Trần', enemyName: 'Quân Nguyên',
          water: ['M440,0 C400,260 560,520 470,760 C420,900 520,1000 480,1080 L580,1080 C620,1000 520,900 580,760 C660,520 500,260 540,0Z',
            'M1180,0 C1230,180 1250,320 1290,430 L1340,430 C1300,320 1280,180 1240,0Z', 'M1290,430 C1420,470 1600,470 1920,440 L1920,500 C1600,530 1420,520 1310,480Z', 'M1290,450 C1180,520 1060,560 900,620 L910,660 C1080,600 1200,560 1320,480Z'],
          hills: [[1600, 150, 420, 160, 7], [1100, 900, 400, 160, 6]], forest: [[250, 400, 280, 380, 16], [760, 300, 260, 240, 12], [1600, 760, 380, 240, 14]],
          forts: [{ x: 1380, y: 380, side: 'ta', label: 'Vạn Kiếp' }],
          labels: [{ x: 650, y: 330, text: 'SÔNG HỒNG', style: 'river' }, { x: 1700, y: 540, text: 'SÔNG LỤC ĐẦU', style: 'river' }, { x: 640, y: 860, text: 'Tây Kết', style: 'warn' },
            { x: 300, y: 700, text: '✕ Toa Đô tử trận', style: 'warn', at: .3 }, { x: 1700, y: 70, text: 'Thoát Hoan trốn chạy (tương truyền chui ống đồng)', style: 'warn', at: .86 }],
          units: [
            { kind: 'ship', side: 'dich', big: 1, n: 7, spread: 90, cmd: 1, label: 'Toa Đô', path: [[.02, 510, 1070], [.16, 520, 760]], burn: .26, sink: .32, lx: 170, ly: 0 },
            { kind: 'troop', side: 'ta', n: 5, spread: 90, label: 'Phục binh', path: [[0, 380, 780]], at: .12, ly: 70 },
            { kind: 'troop', side: 'ta', n: 5, spread: 90, label: 'Phục binh', path: [[0, 680, 760]], at: .12, ly: 70 },
            { kind: 'ship', side: 'dich', n: 1, label: 'Ô Mã Nhi trốn ra biển', path: [[.3, 520, 760], [.44, 520, 1060]], at: .3, until: .46, lx: 220, ly: 0 },
            { kind: 'troop', side: 'dich', n: 8, spread: 130, cmd: 1, label: 'Thoát Hoan', path: [[.46, 640, 160], [.6, 1000, 330], [.72, 1240, 260], [.9, 1550, 80]], at: .46, ly: -60 },
            { kind: 'troop', side: 'dich', n: 4, spread: 70, label: '✕ Lý Hằng trúng tên độc', path: [[.46, 700, 220], [.62, 1050, 390], [.7, 1150, 420]], at: .46, sink: .76, ly: 60 },
            { kind: 'troop', side: 'ta', n: 7, spread: 120, cmd: 1, label: 'Hưng Đạo Vương', path: [[0, 1420, 620]], at: .5, lx: 0, ly: 80 },
            { kind: 'troop', side: 'ta', n: 5, spread: 90, label: 'Chặn đường rút', path: [[0, 1050, 150]], at: .52, ly: -40 }
          ],
          arrows: [
            { side: 'dich', d: 'M510,1060 C520,940 510,850 520,780', at: .02, len: .12, until: .34 },
            { side: 'ta', d: 'M400,770 C440,768 470,766 500,764', at: .17, len: .06 }, { side: 'ta', d: 'M660,750 C620,752 590,756 545,760', at: .18, len: .06 },
            { side: 'dich', d: 'M640,170 C850,250 1100,330 1240,270 C1350,220 1450,150 1550,90', at: .48, len: .35 },
            { side: 'ta', d: 'M1400,590 C1330,530 1240,470 1170,430', at: .62, len: .1, w: 14 }, { side: 'ta', d: 'M1060,180 C1100,220 1140,250 1190,265', at: .66, len: .08 }
          ],
          fx: [{ x: 520, y: 760, at: .25, len: .16, s: 1.4 }, { x: 1150, y: 410, at: .7, len: .14, s: 1.2 }],
          phases: [[0, '1 · Toa Đô ngược sông Hồng, không hay Thăng Long đã mất'], [.14, '2 · Phục binh Tây Kết – Toa Đô tử trận'], [.3, '3 · Ô Mã Nhi bỏ chạy ra biển'], [.46, '4 · Thoát Hoan tháo chạy qua Vạn Kiếp'], [.64, '5 · Hưng Đạo Vương chặn đánh, quân Nguyên tan tác']],
          say: 'Tại Tây Kết, quân ta mai phục đánh tan đạo quân phía nam, chém đầu Toa Đô; Ô Mã Nhi phải lẻn ra biển trốn về. Ở phía bắc, Thoát Hoan tháo chạy qua Vạn Kiếp thì bị Hưng Đạo Vương chặn đánh. Phó tướng Lý Hằng trúng tên độc tử trận; tương truyền Thoát Hoan phải chui vào ống đồng cho quân khiêng chạy về nước.', min: 26 },
        { type: 'quote', quote: 'Ta thường tới bữa quên ăn, nửa đêm vỗ gối; ruột đau như cắt, nước mắt đầm đìa; chỉ căm tức chưa xả thịt lột da, nuốt gan uống máu quân thù.', by: 'Trần Hưng Đạo – Hịch tướng sĩ',
          say: 'Lời hịch năm xưa của Hưng Đạo Vương đã trở thành ngọn lửa thôi thúc ý chí quyết chiến của quân dân nhà Trần.' },
        { type: 'points', items: ['Quét sạch quân Nguyên khỏi bờ cõi lần thứ hai', 'Tiêu diệt chủ tướng Toa Đô', 'Khẳng định tài thao lược của Hưng Đạo Vương'],
          say: 'Thắng lợi Tây Kết – Vạn Kiếp kết thúc cuộc kháng chiến lần thứ hai, khẳng định tài thao lược kiệt xuất của Hưng Đạo Vương Trần Quốc Tuấn.' },
        { type: 'end', sub: 'Tây Kết – Vạn Kiếp 1285 · Trần Hưng Đạo', next: 'Vân Đồn 1288', say: 'Cảm ơn bạn đã theo dõi. Hẹn gặp lại ở trận đánh tiếp theo.' }
      ]
    },
    {
      id: 'van-don-1288', year: '1288', name: 'Vân Đồn 1288', who: 'Trần Khánh Dư', vs: 'Nguyên Mông', seed: 43, sources: ['Đại Việt sử ký toàn thư', 'Nguyên sử', 'Báo Giáo dục Việt Nam', 'Znews', 'Wikipedia – Trần Khánh Dư'], series: 'SỬ VIỆT · HƯNG ĐẠO VƯƠNG',
      scenes: [
        { type: 'title', title: 'VÂN ĐỒN', sub: 'TRẬN VÂN ĐỒN CUỐI 1287 – ĐẦU 1288', line: 'NHẤN CHÌM ĐOÀN THUYỀN LƯƠNG QUÂN NGUYÊN', stamp: 'CẮT ĐỨT HẬU CẦN', ships: 8,
          say: 'Giữa vùng biển đảo Vân Đồn, một trận đánh chớp nhoáng đã cắt đứt nguồn lương thực của quân Nguyên, mở đường cho đại thắng Bạch Đằng năm 1288.' },
        { type: 'hero', kicker: 'PHÓ TƯỚNG', name: 'Trần Khánh Dư', alt: '? – 1340', role: 'Trấn giữ vùng biển Vân Đồn',
          say: 'Trận Vân Đồn gắn với tên tuổi phó tướng Trần Khánh Dư, người từng bị cách chức, được nhà Trần tha tội và giao trấn giữ vùng biển Đông Bắc.' },
        { type: 'map', date: 'CUỐI 1287', cutLat: 16.8, legendEnemy: 'Nhà Nguyên', enemy: { countries: ['China', 'Hong Kong', 'Macao', 'Taiwan'] },
          cam: [{ lon: 108, lat: 20.8, z: 1.5 }, { lon: 107.15, lat: 21.1, z: 3.8 }],
          labels: [{ lon: 111.5, lat: 24.4, text: 'NHÀ NGUYÊN', style: 'enemy', at: .05 }, { lon: 106.4, lat: 21.1, text: 'Vạn Kiếp', dot: 1, anchor: 'end', at: .5 }],
          routes: [{ pts: [[109.8, 21.4], [108.6, 21.5], [107.7, 21.2], [107.0, 20.95], [106.45, 21.1]], side: 'dich', at: .15, len: .35, bend: .4 }],
          marker: { lon: 107.45, lat: 21.07, text: 'Vân Đồn', at: .7 },
          say: 'Cuối năm 1287, quân Nguyên sang xâm lược lần thứ ba. Thủy quân của Ô Mã Nhi vượt biển tiến vào, phía sau là đoàn thuyền chở lương thực của Trương Văn Hổ.' },
        { type: 'forces', ours: { name: 'ĐẠI VIỆT – NHÀ TRẦN', rows: [['Chỉ huy', 'Phó tướng Trần Khánh Dư'], ['Lực lượng', 'Thủy quân vùng Vân Đồn'], ['Kế sách', 'Đánh vào đoàn thuyền lương']] },
          enemy: { name: 'NHÀ NGUYÊN', rows: [['Thủy quân', 'Ô Mã Nhi, Phàn Tiếp'], ['Thuyền lương', 'Trương Văn Hổ'], ['Lương thực', 'Khoảng # vạn thạch', 17]] },
          say: 'Theo sử sách, đoàn thuyền lương chở khoảng mười bảy vạn thạch lương. Ô Mã Nhi chủ quan, tiến vội về Vạn Kiếp, bỏ đoàn thuyền lương lại phía sau, không có hộ tống.' },
        { type: 'diagram', title: 'TRẬN VÂN ĐỒN 1287 – 1288', oursName: 'Thủy quân nhà Trần', enemyName: 'Quân Nguyên',
          water: ['M0,0 H1920 V1080 H0Z'],
          isles: [[1000, 850, 230, 110], [1180, 220, 200, 90], [640, 760, 150, 80], [1500, 820, 160, 70], [380, 180, 170, 80], [1620, 230, 120, 60], [820, 120, 120, 50], [180, 600, 140, 260]],
          labels: [{ x: 1780, y: 180, text: 'BIỂN ĐÔNG ▶', style: 'river' }, { x: 120, y: 340, text: '◀ VẠN KIẾP', style: 'warn' }, { x: 1000, y: 860, text: 'Vân Đồn', style: 'warn' }],
          units: [
            { kind: 'ship', side: 'dich', big: 1, n: 10, spread: 140, cmd: 1, label: 'Ô Mã Nhi', path: [[.03, 1880, 380], [.3, 330, 400]], until: .4, ly: -95 },
            { kind: 'ship', side: 'ta', n: 4, spread: 60, label: 'Chặn không nổi', path: [[.08, 900, 640], [.16, 950, 470], [.26, 900, 660]], at: .08, until: .3, ly: 70 },
            { kind: 'ship', side: 'dich', n: 9, spread: 130, label: 'Thuyền lương Trương Văn Hổ', path: [[.32, 1880, 560], [.54, 1120, 560]], at: .32, burn: .66, sink: .78, ly: -70 },
            { kind: 'ship', side: 'ta', big: 1, n: 6, spread: 80, cmd: 1, label: 'Trần Khánh Dư', path: [[.48, 980, 760], [.62, 1080, 630]], at: .48, lx: -190, ly: 0 },
            { kind: 'ship', side: 'ta', n: 5, spread: 70, path: [[.5, 1180, 290], [.62, 1140, 490]], at: .5 },
            { kind: 'ship', side: 'dich', n: 1, label: 'Trương Văn Hổ trốn thoát', path: [[.74, 1180, 560], [.92, 1880, 470]], at: .74, until: .96, ly: -50 }
          ],
          arrows: [
            { side: 'dich', d: 'M1860,380 C1400,370 900,410 360,400', at: .03, len: .25, until: .42 },
            { side: 'dich', d: 'M1860,560 C1600,560 1400,560 1160,560', at: .32, len: .2, until: .7 },
            { side: 'ta', d: 'M970,760 C1010,700 1040,660 1070,630', at: .52, len: .1, w: 14 }, { side: 'ta', d: 'M1180,300 C1170,380 1160,440 1150,500', at: .53, len: .1, w: 14 }
          ],
          fx: [{ x: 1120, y: 560, at: .64, len: .3, s: 1.5 }, { x: 1020, y: 540, at: .67, len: .25 }],
          phases: [[0, '1 · Thủy quân Ô Mã Nhi vượt biển tiến vào'], [.3, '2 · Đoàn thuyền lương đi sau, không hộ tống'], [.48, '3 · Trần Khánh Dư phục kích ở Vân Đồn'], [.66, '4 · Lương thực giặc bị nhấn chìm, Trương Văn Hổ bỏ chạy']],
          say: 'Lúc đầu, quân của Trần Khánh Dư không chặn nổi thủy quân Ô Mã Nhi, Thượng hoàng sai người về bắt ông hỏi tội. Trần Khánh Dư xin hoãn để lập công chuộc tội. Ông đoán đoàn thuyền lương sẽ theo sau, bèn mai phục ở Vân Đồn rồi bất ngờ tập kích. Lương thực của giặc bị chiếm hoặc nhấn chìm, Trương Văn Hổ chỉ kịp lên một chiếc thuyền nhỏ trốn về.', min: 26 },
        { type: 'quote', quote: 'Năm nay đánh giặc nhàn.', by: 'Hưng Đạo Vương tâu vua Trần trước cuộc kháng chiến lần thứ ba',
          say: 'Trước cuộc kháng chiến lần thứ ba, khi vua Trần hỏi về thế giặc, Hưng Đạo Vương đã điềm tĩnh tâu: Năm nay đánh giặc nhàn.' },
        { type: 'points', items: ['Cắt đứt nguồn tiếp tế của quân Nguyên', 'Đẩy quân Nguyên vào cảnh đói, buộc phải rút lui', 'Mở đường cho đại thắng Bạch Đằng 1288'],
          say: 'Mất lương thực, quân Nguyên lâm vào cảnh đói khát, buộc phải rút lui, để rồi bị tiêu diệt trên sông Bạch Đằng vào tháng 4 năm 1288.' },
        { type: 'end', sub: 'Vân Đồn 1288 · Trần Khánh Dư', next: 'Bạch Đằng 1288', say: 'Cảm ơn bạn đã theo dõi. Hẹn gặp lại ở trận đánh tiếp theo.' }
      ]
    },
    /* =================================================================== */
    {
      id: 'bach-dang-1288', year: '1288', name: 'Bạch Đằng 1288', who: 'Trần Hưng Đạo', vs: 'Nguyên Mông', seed: 7, sources: ['Đại Việt sử ký toàn thư', 'Wikipedia – Trận Bạch Đằng (1288)', 'Báo Giáo dục Việt Nam'],
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
      id: 'chi-lang-1427', year: '1427', name: 'Chi Lăng – Xương Giang 1427', who: 'Lê Lợi', vs: 'Minh', seed: 19, sources: ['Đại Việt sử ký toàn thư', 'Lam Sơn thực lục', 'Tạp chí Quốc phòng toàn dân', 'Wikipedia – Trận Chi Lăng'],
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
            { x: 690, y: 610, text: '✕ Liễu Thăng tử trận', style: 'warn', at: .56 }],
          units: [
            { kind: 'troop', side: 'ta', n: 3, spread: 50, cmd: 1, label: 'Trần Lựu giả thua', path: [[.04, 960, 200], [.36, 960, 600]], until: .45, lx: 170, ly: 0 },
            { kind: 'horse', side: 'dich', n: 9, spread: 110, cmd: 1, label: 'Liễu Thăng', path: [[.04, 960, 30], [.36, 960, 430], [.42, 960, 530]], sink: .55, lx: 150, ly: 0 },
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
      id: 'rach-gam-1785', year: '1785', name: 'Rạch Gầm – Xoài Mút 1785', who: 'Nguyễn Huệ', vs: 'Xiêm', seed: 23, sources: ['SGK Lịch sử 7', 'Báo Giáo dục Việt Nam', 'Wikipedia – Trận Rạch Gầm – Xoài Mút'],
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
        { type: 'forces', ours: { name: 'NGHĨA QUÂN TÂY SƠN', rows: [['Chỉ huy', 'Nguyễn Huệ'], ['Lực lượng', 'Khoảng # vạn quân', 2], ['Kế sách', 'Mai phục trên sông Tiền']] },
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
            { kind: 'ship', side: 'ta', big: 1, n: 6, spread: 90, cmd: 1, label: 'Nguyễn Huệ', path: [[.42, 1880, 540], [.58, 1320, 540]], at: .42 }
          ],
          arrows: [
            { side: 'dich', d: 'M30,540 C300,530 600,550 900,545', at: .06, len: .32, until: .5 },
            { side: 'ta', d: 'M1050,330 C1040,400 1030,450 1020,500', at: .48, len: .06 },
            { side: 'ta', d: 'M840,760 C880,690 920,640 960,590', at: .49, len: .06 },
            { side: 'ta', d: 'M1800,540 C1600,540 1400,540 1180,545', at: .46, len: .12, w: 14 }
          ],
          fx: [{ x: 1000, y: 540, at: .6, len: .3, s: 1.5 }, { x: 860, y: 520, at: .63, len: .25 }],
          phases: [[0, '1 · Bố trí trận địa mai phục trên khúc sông dài khoảng 6 km'], [.06, '2 · Thủy binh Xiêm xuôi dòng tiến vào trận địa'], [.46, '3 · Quân Tây Sơn đồng loạt tấn công từ bờ, cù lao và mặt sông'], [.7, '4 · Quân Xiêm gần như bị tiêu diệt hoàn toàn']],
          say: 'Đêm 18 rạng sáng ngày 19 tháng 1 năm 1785, Nguyễn Huệ nhử thủy binh Xiêm tiến vào khúc sông Rạch Gầm – Xoài Mút. Bộ binh và thủy binh Tây Sơn mai phục trên bờ, trên các cù lao bất ngờ đổ ra đánh tạt sườn, chặn đầu khóa đuôi. Thuyền giặc bị đánh tan, bốc cháy giữa dòng.', min: 22 },
        { type: 'timeline', title: 'DIỄN BIẾN', items: [['1784', 'Quân Xiêm kéo vào Gia Định'], ['Cuối 1784', 'Nguyễn Huệ vào Nam, đóng ở Mỹ Tho'], ['19.01.1785', 'Đại thắng Rạch Gầm – Xoài Mút'], ['Sau trận', 'Chỉ vài nghìn quân Xiêm thoát về nước']],
          say: 'Phần lớn quân Xiêm bị tiêu diệt, chỉ còn vài nghìn tên sống sót, theo đường bộ chạy về nước.' },
        { type: 'points', items: ['Đập tan âm mưu xâm lược của quân Xiêm', 'Một trong những trận thủy chiến lớn nhất lịch sử Việt Nam', 'Khẳng định tài cầm quân kiệt xuất của Nguyễn Huệ'],
          say: 'Trận Rạch Gầm – Xoài Mút đập tan mộng xâm lược của quân Xiêm, trở thành một trong những trận thủy chiến lẫy lừng nhất lịch sử dân tộc.' },
        { type: 'end', sub: 'Rạch Gầm – Xoài Mút 1785 · Nguyễn Huệ', next: 'Ngọc Hồi – Đống Đa 1789', say: 'Cảm ơn bạn đã theo dõi. Hẹn gặp lại ở trận đánh tiếp theo.' }
      ]
    },
    /* =================================================================== */
    {
      id: 'dong-da-1789', year: '1789', name: 'Ngọc Hồi – Đống Đa 1789', who: 'Quang Trung', vs: 'Thanh', seed: 29, sources: ['SGK Lịch sử 7', 'Báo Giáo dục Việt Nam', 'Znews', 'Wikipedia – Trận Ngọc Hồi – Đống Đa'],
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
        { type: 'forces', ours: { name: 'QUÂN TÂY SƠN', rows: [['Tổng chỉ huy', 'Vua Quang Trung'], ['Lực lượng', 'Khoảng # vạn quân', 10], ['Voi chiến', 'Vua cưỡi voi chỉ huy']] },
          enemy: { name: 'NHÀ THANH', rows: [['Chỉ huy', 'Tôn Sĩ Nghị'], ['Lực lượng', '# vạn quân', 29], ['Tâm lý', 'Chủ quan, mải ăn Tết']] },
          say: 'Tôn Sĩ Nghị cầm đầu hai mươi chín vạn quân Thanh, kiêu căng, chủ quan, mải mê ăn Tết. Quân Tây Sơn khoảng mười vạn người, có cả voi chiến; vua Quang Trung trực tiếp cưỡi voi chỉ huy.' },
        { type: 'diagram', title: 'NGỌC HỒI – ĐỐNG ĐA 1789', oursName: 'Quân Tây Sơn', enemyName: 'Quân Thanh',
          water: ['M1480,0 C1430,300 1590,600 1490,1080 L1630,1080 C1730,600 1570,300 1620,0Z'],
          forest: [[300, 300, 300, 200, 12], [1200, 600, 200, 300, 10]],
          bridge: { at: [1440, 230, 1680, 230], fall: .82 },
          forts: [{ x: 960, y: 190, side: 'dich', label: 'Thăng Long', fall: .92 }, { x: 960, y: 690, side: 'dich', label: 'Đồn Ngọc Hồi', fall: .5 },
            { x: 960, y: 860, side: 'dich', label: 'Đồn Hà Hồi', fall: .2 }, { x: 600, y: 430, side: 'dich', label: 'Khương Thượng (Đống Đa)', fall: .6 }],
          labels: [{ x: 1700, y: 860, text: 'SÔNG NHỊ HÀ', style: 'river' }, { x: 1560, y: 200, text: 'Cầu phao', style: 'warn' }, { x: 1300, y: 700, text: 'Mộc ván bọc rơm ướt', style: 'warn', at: .3 },
            { x: 600, y: 520, text: '✕ Sầm Nghi Đống tự tử', style: 'warn', at: .62 }],
          units: [
            { kind: 'troop', side: 'ta', n: 6, spread: 110, cmd: 1, label: 'Quang Trung', path: [[.02, 960, 1060], [.16, 960, 930], [.32, 960, 800], [.48, 960, 740], [.8, 960, 270]], lx: 0, ly: 72 },
            { kind: 'troop', side: 'ta', n: 4, spread: 80, cmd: 1, label: 'Đô đốc Long', path: [[.3, 240, 1000], [.56, 560, 520], [.78, 820, 250]], at: .3, lx: -160, ly: 0 },
            { kind: 'troop', side: 'ta', n: 3, spread: 60, label: 'Chặn đường rút', path: [[.25, 1300, 1060], [.6, 1780, 380]], at: .25, lx: 0, ly: -40 },
            { kind: 'troop', side: 'dich', n: 5, spread: 80, path: [[0, 960, 640]], sink: .5 },
            { kind: 'troop', side: 'dich', n: 4, spread: 70, path: [[0, 640, 360]], sink: .6 },
            { kind: 'troop', side: 'dich', n: 8, spread: 120, cmd: 1, label: 'Tôn Sĩ Nghị tháo chạy', path: [[0, 1130, 330], [.62, 1130, 330], [.8, 1500, 240], [.84, 1560, 240]], sink: .84, ly: -50 }
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
