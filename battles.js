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
      id: 'bach-dang-938', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/bach-dang-938/nguon.json
        { file: "01-tranh-dong-ho.jpg", slot: "hook", caption: "Tranh dân gian Đông Hồ: Ngô Quyền đại phá quân Nam Hán trên sông Bạch Đằng", credit: "Ảnh: Nghệ nhân làng Đông Hồ (khuyết danh) · Public domain · Wikimedia Commons" },
        { file: "f-tuong.jpg", slot: "hero", fit: 'contain', caption: "Tượng bán thân Ngô Quyền", credit: "Ảnh: Gary Lee Todd · CC0 · Flickr" },
        { file: "03-cua-song.jpg", slot: "map", caption: "Sông Bạch Đằng đoạn gần cửa biển ngày nay", credit: "Ảnh: Viethavvh · Public domain · Wikimedia Commons" },
        { file: "04-tranh-ghep.jpg", slot: "dienbien", caption: "Tranh ghép tái hiện trận Bạch Đằng năm 938", credit: "Ảnh: thành viên Wikipedia tiếng Việt · Public domain · Wikimedia Commons" },
        { file: "f-coc.jpg", slot: "dienbien2", fit: 'contain', caption: "Cọc gỗ trận Bạch Đằng 1288 – kế cọc ngầm Ngô Quyền dùng đầu tiên năm 938", credit: "Ảnh: Gary Lee Todd · CC0 · Flickr" },
        { file: "06-phu-dieu.jpg", slot: "moc", caption: "Phù điêu: Ngô Quyền đại phá quân Nam Hán", credit: "Ảnh: thành viên Wikipedia tiếng Việt · CC0 · Wikimedia Commons" },
        { file: "07-den-tho.jpg", slot: "ynghia", caption: "Đền thờ Ngô Quyền ở làng cổ Đường Lâm, Hà Nội", credit: "Ảnh: Bùi Thụy Đào Nguyên · CC BY-SA 3.0 · Wikimedia Commons" },
        { file: "08-lang.jpg", slot: "ket", caption: "Lăng Ngô Quyền ở Đường Lâm – nơi hậu thế tưởng nhớ vị vua mở nền độc lập", credit: "Ảnh: Bùi Thụy Đào Nguyên · CC BY-SA 3.0 · Wikimedia Commons" }
      ],
      year: '938', name: 'Bạch Đằng 938', who: 'Ngô Quyền', vs: 'Nam Hán', seed: 3, sources: ['Đại Việt sử ký toàn thư', 'Wikipedia – Trận Bạch Đằng (938)', 'Báo Nhân Dân', 'Báo Giáo dục Việt Nam'],
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
      id: 'nhu-nguyet-1077', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/nhu-nguyet-1077/nguon.json
        { file: "01-hook.jpg", slot: "hook", caption: "Sông Cầu – khúc sông Như Nguyệt xưa là phòng tuyến chặn quân Tống", credit: "Ảnh: Dominic Nelson · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "02-hero.jpg", slot: "hero", fit: 'contain', caption: "Tượng Lý Thường Kiệt tại Bảo tàng Lịch sử Quân sự Việt Nam", credit: "Ảnh: Gary Todd · CC0 · Wikimedia Commons" },
        { file: "03-dienbien.jpg", slot: "dienbien", caption: "Sơ đồ trận Như Nguyệt năm 1077", credit: "Ảnh: Lưu Ly · CC BY 3.0 · Wikimedia Commons" },
        { file: "04-moc.jpg", slot: "moc", fit: 'contain', caption: "Bia chùa Linh Xứng (1126) ghi công Lý Thường Kiệt – Bảo tàng Lịch sử Quốc gia", credit: "Ảnh: Daderot · CC0 · Wikimedia Commons" }
      ],
      year: '1077', name: 'Như Nguyệt 1077', who: 'Lý Thường Kiệt', vs: 'Tống', seed: 11, sources: ['Đại Việt sử ký toàn thư', 'SGK Lịch sử 7', 'Wikipedia – Trận Như Nguyệt', 'Tạp chí Quản lý Nhà nước'],
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
      id: 'dong-bo-dau-1258', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/dong-bo-dau-1258/nguon.json
        { file: "01-dienbien.jpg", slot: "dienbien", caption: "Sa bàn: dân binh Quy Hóa do Hà Bổng chỉ huy chặn đánh quân Mông Cổ rút chạy – Bảo tàng Lịch sử Quốc gia", credit: "Ảnh: Daderot · CC0 · Wikimedia Commons" },
        { file: "02-ynghia.jpg", slot: "ynghia", caption: "Đền Trần ở Hưng Hà, Thái Bình – nơi có lăng mộ vua Trần Thái Tông", credit: "Ảnh: Kien1980v · Public domain · Wikimedia Commons" },
        { file: "03-ket.jpg", slot: "ket", caption: "Đền Thái Vi (Ninh Bình) thờ các vua Trần", credit: "Ảnh: Kien1980v · Public domain · Wikimedia Commons" }
      ],
      year: '1258', name: 'Đông Bộ Đầu 1258', who: 'Trần Thái Tông', vs: 'Mông Cổ', seed: 31, sources: ['Đại Việt sử ký toàn thư', 'SGK Lịch sử 7', 'Báo Giáo dục Việt Nam', 'Wikipedia – Trận Bình Lệ Nguyên'], series: 'SỬ VIỆT · HƯNG ĐẠO VƯƠNG',
      scenes: [
        { type: 'title', title: 'ĐÔNG BỘ ĐẦU', sub: 'TRẬN PHẢN CÔNG NĂM 1258', line: 'LẦN THỨ NHẤT ĐÁNH BẠI QUÂN MÔNG CỔ', stamp: 'ĐẦU THẦN CHƯA RƠI', ships: 3,
          say: 'Đầu năm 1258, đạo quân Mông Cổ đang trên đà chinh phục nhiều nước châu Á tràn vào Đại Việt. Chưa đầy hai tuần sau, chúng bị đánh tan ở bến Đông Bộ Đầu, phải rút chạy về nước.' },
        { type: 'hero', kicker: 'VỊ VUA CẦM QUÂN', name: 'Trần Thái Tông', alt: '1218 – 1277', role: 'Vị vua đầu tiên của nhà Trần',
          say: 'Vua Trần Thái Tông trực tiếp cầm quân. Theo sử cũ, Trần Quốc Tuấn, khi ấy còn trẻ, được giao đem quân thủy bộ ra trấn giữ vùng biên giới phía bắc.' },
        { type: 'map', date: '01.1258', cutLat: 16.8, legendEnemy: 'Mông Cổ', enemy: { countries: ['China', 'Hong Kong', 'Macao', 'Taiwan'] },
          cam: [{ lon: 103.5, lat: 23, z: 1.3 }, { lon: 105.4, lat: 21.5, z: 3.2 }],
          labels: [{ lon: 101.5, lat: 25.3, text: 'MÔNG CỔ', style: 'enemy', at: .05 }, { lon: 105.3, lat: 20.0, text: 'ĐẠI VIỆT', style: 'ours', at: .05 },
            { lon: 100.2, lat: 25.6, text: 'Đại Lý', dot: 1, at: .1 }, { lon: 105.55, lat: 21.3, text: 'Bình Lệ Nguyên', dot: 1, anchor: 'end', at: .45 }],
          routes: [{ pts: [[100.6, 25.2], [102.9, 23.6], [104.3, 22.4], [105.2, 21.6], [105.55, 21.3], [105.82, 21.06]], side: 'dich', at: .15, len: .45 }],
          marker: { lon: 105.86, lat: 21.045, text: 'Thăng Long – bến Đông Bộ Đầu', at: .72 },
          say: 'Từ Vân Nam, tướng Ngột Lương Hợp Thai dẫn quân theo sông Thao tiến xuống. Ngày 17 tháng 1 năm 1258 theo dương lịch, quân ta chặn đánh ở Bình Lệ Nguyên rồi chủ động rút lui, bỏ trống kinh thành Thăng Long.' },
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
      id: 'tay-ket-1285', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/tay-ket-1285/nguon.json
        { file: "01-hook.jpg", slot: "hook", caption: "Sa bàn trận Vạn Kiếp 1285 – Bảo tàng Lịch sử TP. Hồ Chí Minh", credit: "Ảnh: Gary Todd · CC0 · Wikimedia Commons" },
        { file: "02-hero.jpg", slot: "hero", fit: 'contain', caption: "Tượng đài Trần Hưng Đạo ở bến Bạch Đằng, TP. Hồ Chí Minh", credit: "Ảnh: Bùi Thụy Đào Nguyên · CC BY-SA 3.0 · Wikimedia Commons" },
        { file: "03-dienbien.jpg", slot: "dienbien", caption: "Trận Vạn Kiếp (1285): quân Trần đánh bại quân Nguyên lần thứ hai – Bảo tàng Lịch sử TP. Hồ Chí Minh", credit: "Ảnh: Gary Todd · CC0 · Wikimedia Commons" },
        { file: "04-moc.jpg", slot: "moc", caption: "Phù điêu Hịch tướng sĩ – đền thờ Đức Thánh Trần, TP. Hồ Chí Minh", credit: "Ảnh: Phương Huy · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "05-ynghia.jpg", slot: "ynghia", caption: "Cổng chính đền Kiếp Bạc – nơi thờ Hưng Đạo Vương ở Vạn Kiếp xưa", credit: "Ảnh: thành viên Wikipedia · CC BY 3.0 · Wikimedia Commons" },
        { file: "06-ket.jpg", slot: "ket", caption: "Đền Kiếp Bạc năm 1904", credit: "Ảnh: André Salles · Public domain · Wikimedia Commons" }
      ],
      year: '1285', name: 'Tây Kết – Vạn Kiếp 1285', who: 'Trần Hưng Đạo', vs: 'Nguyên Mông', seed: 41, sources: ['Đại Việt sử ký toàn thư', 'SGK Lịch sử 7', 'Wikipedia – Mongol invasions of Vietnam'], series: 'SỬ VIỆT · HƯNG ĐẠO VƯƠNG',
      scenes: [
        { type: 'title', title: 'TÂY KẾT', sub: 'TÂY KẾT – VẠN KIẾP NĂM 1285', line: 'HƯNG ĐẠO VƯƠNG ĐẠI PHÁ QUÂN NGUYÊN', stamp: 'SÁT THÁT', ships: 5,
          say: 'Mùa hè năm 1285, Hưng Đạo Vương mở những đòn quyết định ở Tây Kết và Vạn Kiếp, quét sạch quân Nguyên ra khỏi bờ cõi lần thứ hai.' },
        { type: 'hero', kicker: 'QUỐC CÔNG TIẾT CHẾ', name: 'Trần Hưng Đạo', alt: 'Hưng Đạo Vương Trần Quốc Tuấn', role: 'Tổng chỉ huy kháng chiến chống Nguyên Mông',
          say: 'Trước cuộc kháng chiến lần thứ hai, Hưng Đạo Vương đã soạn Hịch tướng sĩ. Quân sĩ nhà Trần thích lên cánh tay hai chữ Sát Thát, nghĩa là giết giặc Thát Đát, thể hiện ý chí quyết chiến.' },
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
      id: 'bach-dang-1288', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/bach-dang-1288/nguon.json
        { file: "01-hook.jpg", slot: "hook", caption: "Tranh trận Bạch Đằng 1288 – Bảo tàng Lịch sử TP. Hồ Chí Minh", credit: "Ảnh: Gary Todd · CC0 · Wikimedia Commons" },
        { file: "02-hero.jpg", slot: "hero", fit: 'contain', caption: "Tranh chân dung Hưng Đạo Đại vương Trần Quốc Tuấn (thời Nguyễn)", credit: "Ảnh: Khuyết danh · Public domain · Wikimedia Commons" },
        { file: "03-map.jpg", slot: "map", caption: "Sông Bạch Đằng đoạn gần cửa biển ngày nay", credit: "Ảnh: Viethavvh · Public domain · Wikimedia Commons" },
        { file: "04-dienbien.jpg", slot: "dienbien", caption: "Cọc gỗ Bạch Đằng trưng bày trước tranh trận đánh năm 1288", credit: "Ảnh: Gary Todd · CC0 · Wikimedia Commons" },
        { file: "05-dienbien2.jpg", slot: "dienbien2", caption: "Mô hình chiến thuyền Đại Việt – chùa Keo, Thái Bình", credit: "Ảnh: Ptdtch · CC BY-SA 3.0 · Wikimedia Commons" },
        { file: "06-moc.jpg", slot: "moc", fit: 'contain', caption: "Phù điêu bãi cọc Bạch Đằng – đền thờ Đức Thánh Trần, TP. Hồ Chí Minh", credit: "Ảnh: Phương Huy · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "07-ynghia.jpg", slot: "ynghia", fit: 'contain', caption: "Tượng Trần Hưng Đạo ở Nha Trang", credit: "Ảnh: Odessey · CC BY-SA 3.0 · Wikimedia Commons" },
        { file: "08-ket.jpg", slot: "ket", fit: 'contain', caption: "Tượng bán thân Trần Hưng Đạo – Bảo tàng Lịch sử Quân sự Việt Nam", credit: "Ảnh: Gary Todd · CC0 · Wikimedia Commons" }
      ],
      year: '1288', name: 'Bạch Đằng 1288', who: 'Trần Hưng Đạo', vs: 'Nguyên Mông', seed: 7, sources: ['Đại Việt sử ký toàn thư', 'Wikipedia – Trận Bạch Đằng (1288)', 'Báo Giáo dục Việt Nam'],
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
      id: 'chi-lang-1427', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/chi-lang-1427/nguon.json
        { file: "01-hook.jpg", slot: "hook", caption: "Sa bàn chiến thắng của Lê Lợi trước 10 vạn quân Minh năm 1427 – Bảo tàng Lịch sử TP. Hồ Chí Minh", credit: "Ảnh: Daderot · CC0 · Wikimedia Commons" },
        { file: "02-hero.jpg", slot: "hero", fit: 'contain', caption: "Tượng đài Lê Lợi tại TP. Hồ Chí Minh", credit: "Ảnh: Bùi Thụy Đào Nguyên · CC BY-SA 3.0 · Wikimedia Commons" },
        { file: "03-map.jpg", slot: "map", fit: 'contain', caption: "Sơ đồ trận Chi Lăng – Xương Giang năm 1427", credit: "Ảnh: Lưu Ly · CC BY 3.0 · Wikimedia Commons" },
        { file: "04-dienbien.jpg", slot: "dienbien", caption: "Ải Chi Lăng (Lạng Sơn) – đường độc đạo kẹp giữa núi đá", credit: "Ảnh: Viethavvh · Public domain · Wikimedia Commons" },
        { file: "05-dienbien2.jpg", slot: "dienbien2", caption: "Sơ đồ khu di tích lịch sử Chi Lăng", credit: "Ảnh: Viethavvh · Public domain · Wikimedia Commons" },
        { file: "06-moc.jpg", slot: "moc", caption: "Đồng tiền Thuận Thiên nguyên bảo do vua Lê Thái Tổ cho đúc", credit: "Ảnh: Vtduc · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "07-ynghia.jpg", slot: "ynghia", caption: "Tượng voi, tê giác, ngựa đá ở lăng Lê Lợi (Lam Kinh, Thanh Hóa)", credit: "Ảnh: Daderot · CC0 · Wikimedia Commons" },
        { file: "08-ket.jpg", slot: "ket", caption: "Cánh đồng Chi Lăng xưa nay lúa đã xanh", credit: "Ảnh: Bùi Thụy Đào Nguyên · CC BY-SA 3.0 · Wikimedia Commons" }
      ],
      year: '1427', name: 'Chi Lăng – Xương Giang 1427', who: 'Lê Lợi', vs: 'Minh', seed: 19, sources: ['Đại Việt sử ký toàn thư', 'Lam Sơn thực lục', 'Tạp chí Quốc phòng toàn dân', 'Wikipedia – Trận Chi Lăng'],
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
      id: 'rach-gam-1785', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/rach-gam-1785/nguon.json
        { file: "01-hook.jpg", slot: "hook", caption: "Sa bàn trận Rạch Gầm – Xoài Mút (1785) – Bảo tàng Lịch sử TP. Hồ Chí Minh", credit: "Ảnh: Daderot · CC0 · Wikimedia Commons" },
        { file: "02-map.jpg", slot: "map", caption: "Sông Tiền, đoạn Rạch Gầm – Xoài Mút (Tiền Giang) ngày nay", credit: "Ảnh: Bùi Thụy Đào Nguyên · CC BY-SA 3.0 · Wikimedia Commons" },
        { file: "03-dienbien.jpg", slot: "dienbien", caption: "Mô hình chiến thuyền Tây Sơn dùng trong trận đánh", credit: "Ảnh: Liftold · CC BY-SA 3.0 · Wikimedia Commons" },
        { file: "04-dienbien2.jpg", slot: "dienbien2", caption: "Vũ khí của quân Xiêm để lại sau trận Rạch Gầm – Xoài Mút", credit: "Ảnh: Nguyễn Thanh Quang · Public domain · Wikimedia Commons" },
        { file: "05-moc.jpg", slot: "moc", caption: "Di vật trận Rạch Gầm – Xoài Mút tại nhà trưng bày Tiền Giang", credit: "Ảnh: Phương Huy · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "06-ynghia.jpg", slot: "ynghia", caption: "Tượng đài chiến thắng Rạch Gầm – Xoài Mút", credit: "Ảnh: Nguyễn Thanh Quang · Public domain · Wikimedia Commons" },
        { file: "07-ket.jpg", slot: "ket", caption: "Khu di tích chiến thắng Rạch Gầm – Xoài Mút, Châu Thành, Tiền Giang", credit: "Ảnh: Bùi Thụy Đào Nguyên · CC BY-SA 3.0 · Wikimedia Commons" }
      ],
      year: '1785', name: 'Rạch Gầm – Xoài Mút 1785', who: 'Nguyễn Huệ', vs: 'Xiêm', seed: 23, sources: ['SGK Lịch sử 7', 'Báo Giáo dục Việt Nam', 'Wikipedia – Trận Rạch Gầm – Xoài Mút'],
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
      id: 'dong-da-1789', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/dong-da-1789/nguon.json
        { file: "01-hook.jpg", slot: "hook", caption: "Tranh cung đình nhà Thanh vẽ trận đánh bên sông Thọ Xương năm 1789", credit: "Ảnh: thành viên Wikipedia · Public domain · Wikimedia Commons" },
        { file: "02-hero.jpg", slot: "hero", fit: 'contain', caption: "Tượng vua Quang Trung – Bảo tàng Quang Trung, Bình Định", credit: "Ảnh: thành viên Wikipedia · CC BY-SA 3.0 · Wikimedia Commons" },
        { file: "03-map.jpg", slot: "map", fit: 'contain', caption: "Cục diện Đại Việt cuối thế kỷ XVIII", credit: "Ảnh: thành viên Wikipedia · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "04-dienbien.jpg", slot: "dienbien", caption: "Gươm và súng của quân Tây Sơn", credit: "Ảnh: Bùi Thụy Đào Nguyên · CC BY 3.0 · Wikimedia Commons" },
        { file: "05-moc.jpg", slot: "moc", caption: "Gò Đống Đa, Hà Nội – nơi ghi dấu chiến thắng Kỷ Dậu 1789", credit: "Ảnh: thành viên Wikipedia · Public domain · Wikimedia Commons" },
        { file: "06-ynghia.jpg", slot: "ynghia", fit: 'contain', caption: "Tượng đài Hoàng đế Quang Trung tại quê hương Tây Sơn, Bình Định", credit: "Ảnh: Bùi Thụy Đào Nguyên · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "07-ket.jpg", slot: "ket", fit: 'contain', caption: "Tượng Quang Trung – Nguyễn Huệ ở Gò Đống Đa", credit: "Ảnh: Nguyễn Thanh Quang · CC BY-SA 3.0 · Wikimedia Commons" }
      ],
      year: '1789', name: 'Ngọc Hồi – Đống Đa 1789', who: 'Quang Trung', vs: 'Thanh', seed: 29, sources: ['SGK Lịch sử 7', 'Báo Giáo dục Việt Nam', 'Znews', 'Wikipedia – Trận Ngọc Hồi – Đống Đa'],
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

/* =========================================================================
   TẬP 11 – 40 · XƯỞNG FILM LỊCH SỬ VIỆT NAM
   Khuôn sơ đồ dùng chung (khung 1920×1080, mốc 0..1) + 30 trận theo dòng thời gian.
   Chi tiết chưa chắc chắn ghi "theo sử cũ" / "tương truyền"; số liệu cổ là ước lượng.
   ========================================================================= */
(function () {
  const CHINA = ['China', 'Hong Kong', 'Macao', 'Taiwan'];
  const P4 = p => p.map((t, i) => [[0, .26, .5, .72][i], `${i + 1} · ${t}`]);
  const T = (title, sub, line, stamp, extra) => Object.assign({ type: 'title', title, sub, line, stamp, size: title.length > 14 ? 118 : title.length > 10 ? 150 : undefined }, extra || {});
  const END = (sub) => ({ type: 'end', sub, say: 'Cảm ơn bạn đã theo dõi. Hẹn gặp lại ở trận đánh tiếp theo.' });

  /* A · SÔNG: phục kích / thủy chiến trên sông */
  function SONG(o) {
    return { type: 'diagram', title: o.title, oursName: o.ours, enemyName: o.enemy,
      water: ['M0,260 C420,300 720,380 1000,470 C1260,550 1480,610 1920,640 L1920,840 C1480,810 1240,760 980,680 C700,590 400,480 0,460 Z'],
      hills: [[360, 140, 520, 150, 7], [1480, 330, 520, 150, 6], [460, 760, 420, 150, 6], [1500, 940, 480, 120, 5]],
      forest: [[880, 300, 260, 110, 10], [880, 820, 300, 120, 12]],
      stakes: o.stakes ? [{ x1: 1240, y1: 590, x2: 1160, y2: 760, n: 12 }] : undefined,
      labels: [{ x: 360, y: 420, text: o.river, style: 'river' }, ...(o.labels || [])],
      units: [
        { kind: 'ship', side: 'dich', big: o.bigEnemy ? 1 : 0, n: o.enemyN || 9, spread: 140, cmd: 1, label: o.enemyCmd, path: [[.04, 1880, 740], [.3, 1150, 640], [.46, 820, 540]], burn: .62, sink: .78, ly: -90 },
        { kind: 'ship', side: 'ta', n: 4, spread: 60, label: o.lure || 'Thuyền nhẹ khiêu chiến', path: [[.06, 1300, 700], [.3, 600, 470]], until: .5, ly: 70 },
        { kind: 'troop', side: 'ta', n: 5, spread: 90, label: 'Phục binh', path: [[0, 960, 330]], at: .44 },
        { kind: 'troop', side: 'ta', n: 5, spread: 90, label: 'Phục binh', path: [[0, 900, 800]], at: .46, ly: 70 },
        { kind: 'ship', side: 'ta', n: 7, spread: 110, cmd: 1, label: o.oursCmd, path: [[.46, 80, 380], [.64, 560, 500], [.78, 860, 560]], at: .46, ly: 95 }
      ],
      arrows: [{ side: 'dich', d: 'M1860,740 C1500,700 1150,630 860,540', at: .04, len: .3, until: .55 }, { side: 'ta', d: 'M960,360 C990,430 1010,490 1030,560', at: .5, len: .1 }, { side: 'ta', d: 'M900,780 C950,720 990,680 1030,640', at: .52, len: .1 }, { side: 'ta', d: 'M120,400 C420,450 650,510 900,560', at: .55, len: .14, w: 14 }],
      fx: [{ x: 960, y: 590, at: .62, len: .28, s: 1.4 }, { x: 1080, y: 620, at: .66, len: .24 }],
      phases: P4(o.phases), say: o.say, min: 22 };
  }
  /* B · ẢI: phục kích ở đường hẹp giữa núi (địch tiến từ trên xuống) */
  function AI(o) {
    return { type: 'diagram', title: o.title, oursName: o.ours, enemyName: o.enemy,
      hills: [[470, 300, 560, 300, 12], [1450, 320, 560, 300, 12], [430, 720, 460, 220, 8], [1490, 720, 460, 220, 8]],
      forest: [[700, 480, 200, 300, 16], [1220, 480, 200, 300, 16]],
      lines: [{ d: 'M960,0 C930,200 1000,350 960,500 C920,650 990,760 960,900', side: 'road' }],
      forts: o.fort ? [{ x: 960, y: 860, side: o.fortSide || 'dich', label: o.fort, fall: o.fortFall }] : undefined,
      labels: [{ x: 960, y: 40, text: o.top, style: 'warn' }, { x: 1160, y: 360, text: o.pass, style: 'warn' }, ...(o.labels || [])],
      units: [
        { kind: 'troop', side: 'ta', n: 3, spread: 50, cmd: 1, label: o.lure || 'Nhử địch', path: [[.04, 960, 200], [.34, 960, 600]], until: .45, lx: 170, ly: 0 },
        { kind: o.enemyKind || 'horse', side: 'dich', n: 9, spread: 110, cmd: 1, label: o.enemyCmd, path: [[.04, 960, 30], [.34, 960, 420], [.42, 960, 520]], sink: .56, lx: 160, ly: 0 },
        { kind: 'troop', side: 'ta', n: 6, spread: 110, label: 'Phục binh', path: [[0, 660, 520]], at: .38 },
        { kind: 'troop', side: 'ta', n: 6, spread: 110, label: 'Phục binh', path: [[0, 1270, 520]], at: .38 },
        { kind: 'troop', side: 'dich', n: 6, spread: 110, label: o.remnant || 'Tàn quân', path: [[.58, 960, 600], [.74, 960, 760]], at: .58, sink: .9, lx: 180, ly: 0 },
        { kind: 'troop', side: 'ta', n: 5, spread: 90, cmd: 1, label: o.oursCmd, path: [[.72, 560, 800], [.86, 820, 800]], at: .72 },
        { kind: 'troop', side: 'ta', n: 5, spread: 90, path: [[.72, 1380, 800], [.86, 1100, 800]], at: .72 }
      ],
      arrows: [{ side: 'dich', d: 'M960,20 C940,200 990,330 960,440', at: .04, len: .3 }, { side: 'ta', d: 'M700,520 C780,520 860,520 920,520', at: .42, len: .08 }, { side: 'ta', d: 'M1230,520 C1150,520 1070,520 1000,520', at: .43, len: .08 }, { side: 'ta', d: 'M560,800 C640,805 760,805 880,800', at: .74, len: .1 }, { side: 'ta', d: 'M1380,800 C1280,805 1160,805 1040,800', at: .75, len: .1 }],
      fx: [{ x: 960, y: 520, at: .46, len: .2, s: 1.2 }],
      phases: P4(o.phases), say: o.say, min: 22 };
  }
  /* C · THÀNH: công thành (fortSide 'dich', thành thất thủ) hoặc thủ thành (fortSide 'ta') */
  function THANH(o) {
    const atk = o.fortSide === 'ta' ? 'dich' : 'ta', def = o.fortSide === 'ta' ? 'ta' : 'dich';
    return { type: 'diagram', title: o.title, oursName: o.ours, enemyName: o.enemy,
      water: o.river ? ['M0,880 C480,840 960,900 1440,860 C1680,840 1800,850 1920,840 L1920,1080 L0,1080 Z'] : undefined,
      hills: [[260, 220, 380, 140, 6], [1660, 220, 380, 140, 6]], forest: [[300, 760, 260, 110, 10], [1620, 740, 260, 110, 10]],
      forts: [{ x: 960, y: 470, side: def, label: o.fort, fall: o.fall }],
      labels: [...(o.river ? [{ x: 960, y: 960, text: o.river, style: 'river' }] : []), ...(o.labels || [])],
      units: [
        { kind: 'troop', side: def, n: 6, spread: 90, cmd: 1, label: o.defCmd, path: [[0, 960, 470]], until: o.fall || .99, ly: 120 },
        { kind: o.atkKind || 'troop', side: atk, n: 7, spread: 110, cmd: 1, label: o.atkCmd, path: [[.06, 1880, 470], [.4, 1240, 470], [.62, 1080, 470]], ly: -80 },
        { kind: 'troop', side: atk, n: 6, spread: 100, path: [[.12, 960, 40], [.46, 960, 260]], at: .12, label: o.atk2 },
        { kind: 'troop', side: atk, n: 6, spread: 100, path: [[.18, 40, 470], [.5, 680, 470]], at: .18, label: o.atk3 },
        ...(o.ships ? [{ kind: 'ship', side: 'dich', big: 1, n: 3, spread: 120, label: o.ships, path: [[.02, 1880, 930], [.3, 1300, 900]], ly: -70 }] : [])
      ],
      arrows: [{ side: atk, d: 'M1860,470 C1600,470 1360,470 1130,470', at: .06, len: .3, w: 16 }, { side: atk, d: 'M960,30 C960,140 960,250 960,330', at: .12, len: .3 }, { side: atk, d: 'M40,470 C300,470 560,470 790,470', at: .18, len: .3 }],
      fx: [{ x: 960, y: 470, at: (o.fall || .7) - .05, len: .3, s: 1.6 }, { x: 1080, y: 420, at: .55, len: .2 }],
      phases: P4(o.phases), say: o.say, min: 22 };
  }
  /* D · ĐỒNG: giao chiến nơi đồng bằng – giữ giữa, đánh hai cánh, địch tan vỡ */
  function DONG(o) {
    return { type: 'diagram', title: o.title, oursName: o.ours, enemyName: o.enemy,
      water: o.river ? ['M1280,0 C1240,260 1320,520 1260,760 C1220,900 1260,1000 1240,1080 L1340,1080 C1360,1000 1320,900 1360,760 C1420,520 1340,260 1380,0 Z'] : undefined,
      bridge: o.bridge, hills: [[200, 200, 360, 130, 6], [1700, 900, 360, 130, 6]], forest: [[600, 160, 300, 110, 12], [620, 920, 320, 110, 12]],
      labels: [...(o.river ? [{ x: 1500, y: 120, text: o.river, style: 'river' }] : []), ...(o.labels || [])],
      units: [
        { kind: o.enemyKind || 'troop', side: 'dich', n: 9, spread: 140, cmd: 1, label: o.enemyCmd, path: [[.04, 1800, 540], [.32, 1100, 540], [.5, 1000, 540], [.76, 1620, 540]], sink: .86, ly: -90 },
        { kind: 'troop', side: 'ta', n: 6, spread: 110, cmd: 1, label: o.oursCmd, path: [[.04, 200, 540], [.32, 820, 540]], ly: 90 },
        { kind: 'troop', side: 'ta', n: 5, spread: 100, label: 'Cánh trái', path: [[.3, 500, 200], [.56, 1080, 330], [.76, 1500, 420]], at: .3 },
        { kind: o.flankKind || 'troop', side: 'ta', n: 5, spread: 100, label: 'Cánh phải', path: [[.3, 500, 880], [.56, 1080, 750], [.76, 1500, 660]], at: .32 }
      ],
      arrows: [{ side: 'dich', d: 'M1780,540 C1500,540 1250,540 1040,540', at: .04, len: .28, until: .6 }, { side: 'ta', d: 'M520,220 C760,240 960,300 1080,350', at: .32, len: .18 }, { side: 'ta', d: 'M520,860 C760,840 960,780 1080,730', at: .34, len: .18 }, { side: 'ta', d: 'M840,540 C960,540 1100,540 1300,540', at: .56, len: .16, w: 16 }],
      fx: [{ x: 1060, y: 540, at: .52, len: .22, s: 1.4 }, { x: 1300, y: 520, at: .66, len: .2 }],
      phases: P4(o.phases), say: o.say, min: 22 };
  }
  /* E · ĐẦM: căn cứ đầm lầy / làng chiến đấu – địch vào sâu bị đánh tỉa, phản công */
  function DAM(o) {
    return { type: 'diagram', title: o.title, oursName: o.ours, enemyName: o.enemy,
      water: ['M0,0 H1920 V1080 H0Z'],
      isles: o.isles || [[960, 520, 360, 200], [520, 260, 200, 90], [1420, 300, 180, 80], [460, 820, 220, 90], [1450, 820, 220, 100], [180, 520, 120, 60]],
      forts: o.fort ? [{ x: 960, y: 520, side: 'ta', label: o.fort, fall: o.fall }] : undefined,
      labels: [{ x: 960, y: 70, text: o.place, style: 'river' }, ...(o.labels || [])],
      units: [
        { kind: o.enemyKind || 'troop', side: 'dich', n: 9, spread: 140, cmd: 1, label: o.enemyCmd, path: [[.04, 1880, 940], [.36, 1300, 760], [.5, 1180, 680]], sink: o.fall ? undefined : .8, until: o.fall ? .99 : undefined, ly: 80 },
        { kind: 'ship', side: 'ta', n: 4, spread: 60, label: 'Thuyền nan đánh tỉa', path: [[.3, 520, 260], [.52, 980, 420], [.7, 1200, 600]], at: .3 },
        { kind: 'ship', side: 'ta', n: 4, spread: 60, path: [[.34, 460, 820], [.56, 900, 760], [.72, 1150, 720]], at: .34 },
        { kind: 'troop', side: 'ta', n: 6, spread: 100, cmd: 1, label: o.oursCmd, path: [[0, 960, 520]], until: o.fall || .99, ly: -120 }
      ],
      arrows: [{ side: 'dich', d: 'M1860,940 C1600,860 1400,790 1220,700', at: .04, len: .3 }, { side: 'ta', d: 'M560,280 C760,330 960,420 1150,600', at: .36, len: .2 }, { side: 'ta', d: 'M500,800 C760,780 960,740 1130,700', at: .4, len: .2 }],
      fx: [{ x: 1200, y: 680, at: .55, len: .25, s: 1.3 }, ...(o.fall ? [{ x: 960, y: 520, at: o.fall - .05, len: .3, s: 1.6 }] : [])],
      phases: P4(o.phases), say: o.say, min: 22 };
  }
  /* F · TÀU: chiến thuyền / tàu chiến địch trên sông – pháo đài ven bờ hoặc đánh úp ban đêm */
  function TAU(o) {
    return { type: 'diagram', title: o.title, oursName: o.ours, enemyName: o.enemy,
      water: ['M0,380 C480,420 960,360 1440,410 C1680,430 1800,420 1920,400 L1920,760 C1800,770 1680,750 1440,740 C960,700 480,770 0,730 Z'],
      hills: [[300, 180, 420, 140, 6], [1600, 160, 420, 140, 6]], forest: [[900, 160, 360, 110, 12], [900, 920, 400, 120, 14]],
      forts: (o.forts || []).map(f => Object.assign({ side: 'ta' }, f)),
      labels: [{ x: 300, y: 560, text: o.river, style: 'river' }, ...(o.labels || [])],
      units: [
        { kind: 'ship', side: 'dich', big: 1, n: o.enemyN || 4, spread: 160, cmd: 1, label: o.enemyCmd, path: [[.04, 1880, 560], [.34, 1180, 560], [.5, 1060, 560]], burn: o.burn, sink: o.sink, ly: -110 },
        { kind: 'ship', side: 'ta', n: 5, spread: 70, cmd: 1, label: o.oursCmd, path: [[.4, 200, 600], [.6, 900, 580]], at: .4, ly: 80 },
        { kind: 'troop', side: 'ta', n: 6, spread: 110, label: o.shore || 'Quân trên bờ', path: [[0, 1000, 880]], at: .2, ly: 70 }
      ],
      arrows: [{ side: 'dich', d: 'M1860,560 C1600,560 1350,560 1120,560', at: .04, len: .3 }, { side: 'ta', d: 'M240,600 C500,590 760,580 1000,570', at: .42, len: .18, w: 14 }, { side: 'ta', d: 'M1000,860 C1020,780 1040,700 1060,640', at: .5, len: .12 }],
      fx: [{ x: 1060, y: 560, at: .6, len: .3, s: 1.5 }, { x: 980, y: 600, at: .64, len: .24 }],
      phases: P4(o.phases), say: o.say, min: 22 };
  }
  const MAP = (date, cutLat, legendEnemy, countries, cam, labels, routes, marker, say) => ({ type: 'map', date, cutLat, legendEnemy, enemy: { countries }, cam, labels, routes, marker, say });
  const L = (lon, lat, text, o) => Object.assign({ lon, lat, text }, o || {});
  const R = (pts, side, at, len) => ({ pts, side: side || 'dich', at: at == null ? .2 : at, len: len || .3 });
  const F = (ours, enemy, say, title) => ({ type: 'forces', title, ours, enemy, say });
  const HERO = (kicker, name, alt, role, say) => ({ type: 'hero', kicker, name, alt, role, say });
  const Q = (quote, by, say) => ({ type: 'quote', quote, by, say });
  const PTS = (items, say) => ({ type: 'points', items, say });
  const TL = (title, items, say) => ({ type: 'timeline', title, items, say });
  const BAC = 'SỬ VIỆT · THỜI BẮC THUỘC', TU_CHU = 'SỬ VIỆT · DỰNG NỀN TỰ CHỦ', PHAP = 'SỬ VIỆT · CHỐNG PHÁP', TS = 'SỬ VIỆT · TÂY SƠN';

  const NEW = [
    /* 11 */ { id: 'luy-lau-40', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/luy-lau-40/nguon.json
        { file: "01-hook.jpg", slot: "hook", caption: "Tranh dân gian Đông Hồ: Hai Bà Trưng cưỡi voi đánh giặc", credit: "Ảnh: Khuyết danh · Public domain · Wikimedia Commons" },
        { file: "02-hero.jpg", slot: "hero", fit: 'contain', caption: "Tượng thờ Trưng Trắc vương ở chùa Giác Hải, TP. Hồ Chí Minh", credit: "Ảnh: Phương Huy · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "03-map.jpg", slot: "map", fit: 'contain', caption: "Lãnh thổ Lĩnh Nam thế kỷ thứ nhất", credit: "Ảnh: Capon · CC BY 3.0 · Wikimedia Commons" },
        { file: "04-dienbien.jpg", slot: "dienbien", caption: "Tranh vẽ Hai Bà Trưng đánh đuổi quân Hán", credit: "Ảnh: Phucam1999 · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "05-moc.jpg", slot: "moc", fit: 'contain', caption: "Bản đồ Lĩnh Nam thời Trưng Vương (40 – 43)", credit: "Ảnh: I Love Triệu Đà · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "06-ynghia.jpg", slot: "ynghia", caption: "Rước voi trong lễ hội đền Đồng Nhân thờ Hai Bà Trưng, Hà Nội (ảnh xưa)", credit: "Ảnh: Khuyết danh · Public domain · Wikimedia Commons" },
        { file: "07-ket.jpg", slot: "ket", caption: "Đền Hai Bà Trưng (đền Đồng Nhân), Hà Nội", credit: "Ảnh: Tttrung · CC BY-SA 4.0 · Wikimedia Commons" }
      ],
      year: '40', name: 'Khởi nghĩa Hai Bà Trưng 40', who: 'Hai Bà Trưng', vs: 'nhà Đông Hán', seed: 51, series: BAC,
      sources: ['Hậu Hán thư', 'Đại Việt sử ký toàn thư', 'Thiên Nam ngữ lục'], hook: 'HAI NỮ TƯỚNG ĐẦU TIÊN DẤY BINH', hookQ: 'AI LÀ HAI NỮ TƯỚNG ĐẦU TIÊN CỦA SỬ VIỆT?',
      scenes: [
        T('HAI BÀ TRƯNG', 'KHỞI NGHĨA MÙA XUÂN NĂM 40', 'ĐÁNH ĐUỔI THÁI THÚ TÔ ĐỊNH', 'GIÀNH LẠI ĐỘC LẬP', { ships: 2, say: 'Mùa xuân năm 40, từ đất Mê Linh, hai chị em Trưng Trắc và Trưng Nhị phất cờ khởi nghĩa, mở đầu cuộc khởi nghĩa lớn đầu tiên của người Việt thời Bắc thuộc.' }),
        HERO('NỮ ANH HÙNG', 'Trưng Trắc – Trưng Nhị', 'Hai Bà Trưng', 'Con gái Lạc tướng huyện Mê Linh', 'Hai Bà là con gái Lạc tướng huyện Mê Linh. Theo Đại Việt sử ký toàn thư, Thái thú Tô Định giết chồng bà Trưng Trắc là Thi Sách, khiến Hai Bà càng quyết chí đánh giặc cứu nước.'),
        MAP('MÙA XUÂN NĂM 40', 18, 'Nhà Đông Hán', CHINA, [{ lon: 107, lat: 21, z: 1.6 }, { lon: 105.9, lat: 21.1, z: 4.2 }],
          [L(111, 24, 'NHÀ ĐÔNG HÁN', { style: 'enemy', at: .05 }), L(105.73, 21.18, 'Mê Linh', { dot: 1, anchor: 'end', at: .4 }), L(106.07, 21.03, 'Luy Lâu', { dot: 1, anchor: 'start', at: .55 })],
          [R([[105.73, 21.18], [105.95, 21.1], [106.05, 21.04]], 'ta', .45, .25)], { lon: 106.07, lat: 21.03, text: 'Trị sở Luy Lâu', at: .75 },
          'Nghĩa quân từ Mê Linh tiến về Luy Lâu, trị sở của chính quyền đô hộ ở quận Giao Chỉ. Các Lạc tướng khắp Giao Chỉ, Cửu Chân, Nhật Nam, Hợp Phố đồng loạt hưởng ứng.'),
        F({ name: 'NGHĨA QUÂN', rows: [['Thủ lĩnh', 'Trưng Trắc, Trưng Nhị'], ['Lực lượng', 'Lạc tướng và dân bốn quận'], ['Căn cứ', 'Mê Linh']] }, { name: 'NHÀ ĐÔNG HÁN', rows: [['Thái thú', 'Tô Định'], ['Trị sở', 'Luy Lâu'], ['Chính sách', 'Bóc lột, đồng hóa']] },
          'Theo sử sách, nghĩa quân hạ được 65 thành trì. Tô Định phải bỏ ấn tín, cắt tóc cạo râu trốn chạy về nước.'),
        THANH({ title: 'KHỞI NGHĨA HAI BÀ TRƯNG NĂM 40', ours: 'Nghĩa quân Hai Bà', enemy: 'Quân Đông Hán', fort: 'Trị sở Luy Lâu', fall: .7, defCmd: 'Tô Định', atkCmd: 'Hai Bà Trưng', atk2: 'Lạc tướng Giao Chỉ', atk3: 'Nghĩa quân các quận', river: 'SÔNG DÂU',
          phases: ['Phất cờ khởi nghĩa ở Mê Linh', 'Các Lạc tướng đồng loạt hưởng ứng', 'Vây đánh trị sở Luy Lâu', 'Tô Định bỏ chạy, 65 thành trì được giải phóng'],
          say: 'Từ Mê Linh, nghĩa quân kéo về Luy Lâu. Hào kiệt các nơi nổi dậy hưởng ứng, vây chặt trị sở của chính quyền đô hộ. Thái thú Tô Định hoảng sợ bỏ thành chạy trốn. Chỉ trong thời gian ngắn, sáu mươi lăm thành trì được giải phóng, Trưng Trắc được tôn làm vua, đóng đô ở Mê Linh.' }),
        Q('Một xin rửa sạch nước thù, hai xin dựng lại nghiệp xưa họ Hùng.', 'Lời thề của Hai Bà – theo Thiên Nam ngữ lục', 'Lời thề trước khi xuất quân, được ghi lại trong Thiên Nam ngữ lục, nói lên ý chí đòi nợ nước, trả thù nhà của Hai Bà.'),
        PTS(['Lần đầu giành lại độc lập sau thời gian dài bị nhà Hán đô hộ', 'Khẳng định vai trò to lớn của phụ nữ Việt Nam', 'Mở đầu truyền thống đấu tranh chống đô hộ'], 'Cuộc khởi nghĩa Hai Bà Trưng chứng tỏ người Việt không chịu khuất phục, và phụ nữ Việt Nam có vai trò to lớn trong sự nghiệp giữ nước.'),
        END('Khởi nghĩa Hai Bà Trưng · năm 40')] },

    /* 12 */ { id: 'lang-bac-43', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/lang-bac-43/nguon.json
        { file: "01-hook.jpg", slot: "hook", caption: "Tượng Hai Bà Trưng cưỡi voi ra trận (công trình tại Suối Tiên, TP. Hồ Chí Minh)", credit: "Ảnh: TDA · Public domain · Wikimedia Commons" },
        { file: "02-ynghia.jpg", slot: "ynghia", fit: 'contain', caption: "Đền thờ Hai Bà Trưng ở Hà Nội", credit: "Ảnh: Guerinf · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "03-ket.jpg", slot: "ket", caption: "Cổng đền Hai Bà Trưng, Hà Nội", credit: "Ảnh: Tttrung · CC BY-SA 4.0 · Wikimedia Commons" }
      ],
      year: '43', name: 'Lãng Bạc 43', who: 'Hai Bà Trưng', vs: 'nhà Đông Hán', seed: 52, series: BAC,
      sources: ['Hậu Hán thư – Mã Viện truyện', 'Đại Việt sử ký toàn thư'], hook: 'TRẬN CHIẾN CUỐI CÙNG CỦA HAI BÀ', hookQ: 'VÌ SAO HAI BÀ TRƯNG TUẪN TIẾT Ở HÁT MÔN?',
      scenes: [
        T('LÃNG BẠC', 'TRẬN LÃNG BẠC NĂM 42 – 43', 'HAI BÀ CHỐNG QUÂN MÃ VIỆN', 'BI TRÁNG', { say: 'Năm 42, nhà Hán sai Mã Viện đem đại quân sang đàn áp. Trận Lãng Bạc là cuộc đối đầu bi tráng giữa nghĩa quân Hai Bà Trưng và quân xâm lược.' }),
        HERO('NỮ VƯƠNG', 'Trưng Vương', 'Trưng Trắc', 'Đóng đô ở Mê Linh (40 – 43)', 'Sau hai năm làm vua, Trưng Vương phải đối mặt với đạo quân viễn chinh do tướng Mã Viện, người dày dạn trận mạc, chỉ huy.'),
        MAP('NĂM 42', 18, 'Nhà Đông Hán', CHINA, [{ lon: 107.5, lat: 21.5, z: 1.4 }, { lon: 106, lat: 21.1, z: 4 }],
          [L(111, 24, 'NHÀ ĐÔNG HÁN', { style: 'enemy', at: .05 }), L(106.0, 21.12, 'Lãng Bạc', { dot: 1, anchor: 'start', at: .5 }), L(105.45, 21.15, 'Cấm Khê', { dot: 1, anchor: 'end', at: .6 })],
          [R([[109.2, 21.7], [108, 21.5], [106.9, 21.2], [106.05, 21.1]], 'dich', .2, .35)], { lon: 106.0, lat: 21.1, text: 'Lãng Bạc', at: .75 },
          'Mã Viện theo đường ven biển tiến vào, đóng quân ở vùng Lãng Bạc. Vị trí Lãng Bạc còn nhiều ý kiến, thường được xác định ở vùng Tiên Du, Bắc Ninh.'),
        F({ name: 'NGHĨA QUÂN HAI BÀ', rows: [['Chỉ huy', 'Trưng Trắc, Trưng Nhị'], ['Lực lượng', 'Nghĩa quân các quận'], ['Thế trận', 'Đón đánh ở Lãng Bạc']] }, { name: 'NHÀ ĐÔNG HÁN', rows: [['Chỉ huy', 'Phục Ba tướng quân Mã Viện'], ['Lực lượng', 'Khoảng # vạn quân', 2], ['Hậu cần', 'Hơn 2.000 thuyền xe']] },
          'Theo Hậu Hán thư, Mã Viện đem khoảng hai vạn quân cùng hơn hai nghìn thuyền xe, là đạo quân tinh nhuệ của nhà Hán.'),
        DONG({ title: 'TRẬN LÃNG BẠC 42 – 43', ours: 'Nghĩa quân Hai Bà', enemy: 'Quân Mã Viện', enemyCmd: 'Mã Viện', oursCmd: 'Hai Bà Trưng', labels: [{ x: 1500, y: 980, text: '◀ Lui về Cấm Khê', style: 'warn', at: .78 }],
          phases: ['Quân Hán tiến sâu vào Lãng Bạc', 'Nghĩa quân dàn trận nghênh chiến', 'Giao chiến ác liệt nhiều ngày', 'Nghĩa quân lui về Cấm Khê, chiến đấu đến cùng'],
          say: 'Hai Bà đem quân nghênh chiến ở Lãng Bạc. Trận đánh diễn ra ác liệt. Trước đạo quân đông và thiện chiến, nghĩa quân phải lui về Cấm Khê, tiếp tục chiến đấu. Đầu năm 43, trong thế cùng, theo truyền thuyết Hai Bà đã gieo mình xuống dòng Hát Giang, giữ trọn khí tiết.' }),
        TL('DIỄN BIẾN', [['40', 'Khởi nghĩa, Trưng Trắc xưng vương'], ['42', 'Mã Viện đem quân sang'], ['43', 'Hai Bà tuẫn tiết ở Hát Môn']], 'Từ năm 40 đến năm 43, ba năm độc lập ngắn ngủi nhưng để lại dấu ấn không phai trong lịch sử dân tộc.'),
        PTS(['Tinh thần chiến đấu không khuất phục', 'Hai Bà được thờ phụng khắp nơi', 'Ngọn lửa độc lập tiếp tục được thắp lên'], 'Dù thất bại, cuộc kháng chiến của Hai Bà là bản anh hùng ca, nhân dân lập đền thờ Hai Bà ở nhiều nơi, tiêu biểu là đền Hát Môn và đền Đồng Nhân.'),
        END('Lãng Bạc 42 – 43 · Hai Bà Trưng')] },

    /* 13 */ { id: 'bo-dien-248', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/bo-dien-248/nguon.json
        { file: "01-ynghia.jpg", slot: "ynghia", caption: "Đền Bà Triệu ở Triệu Lộc, Hậu Lộc, Thanh Hóa", credit: "Ảnh: Linhcandng · CC BY-SA 3.0 · Wikimedia Commons" },
        { file: "02-ket.jpg", slot: "ket", caption: "Lăng mộ Bà Triệu trên núi Tùng, Hậu Lộc, Thanh Hóa", credit: "Ảnh: Linhcandng · CC BY-SA 3.0 · Wikimedia Commons" }
      ],
      year: '248', name: 'Khởi nghĩa Bà Triệu 248', who: 'Bà Triệu', vs: 'nhà Đông Ngô', seed: 53, series: BAC,
      sources: ['Đại Việt sử ký toàn thư', 'Việt điện u linh', 'Tam quốc chí – Ngô thư'], hook: 'CƯỠI VOI ĐÁNH GIẶC ĐÔNG NGÔ', hookQ: 'NỮ TƯỚNG CƯỠI VOI NÀO KHIẾN GIẶC KHIẾP SỢ?',
      scenes: [
        T('BÀ TRIỆU', 'KHỞI NGHĨA NĂM 248', 'NỮ TƯỚNG CƯỠI VOI ĐÁNH GIẶC ĐÔNG NGÔ', 'KHÍ PHÁCH', { say: 'Năm 248, ở quận Cửu Chân, Triệu Thị Trinh dựng cờ khởi nghĩa chống ách đô hộ của nhà Đông Ngô.' }),
        HERO('NỮ ANH HÙNG', 'Triệu Thị Trinh', 'Bà Triệu (226 – 248)', 'Quê ở quận Cửu Chân', 'Bà Triệu quê ở quận Cửu Chân, nay thuộc Thanh Hóa. Tương truyền bà cưỡi voi trắng, mặc áo giáp vàng ra trận.'),
        MAP('NĂM 248', 18, 'Nhà Đông Ngô', CHINA, [{ lon: 106, lat: 20.5, z: 1.8 }, { lon: 105.8, lat: 20.0, z: 4.5 }],
          [L(111, 24, 'NHÀ ĐÔNG NGÔ', { style: 'enemy', at: .05 }), L(105.85, 20.05, 'Bồ Điền', { dot: 1, anchor: 'start', at: .5 }), L(105.5, 20.25, 'Núi Nưa', { dot: 1, anchor: 'end', at: .4 })],
          [R([[106.9, 21.5], [106.2, 20.8], [105.9, 20.15]], 'dich', .3, .35)], { lon: 105.85, lat: 20.05, text: 'Căn cứ Bồ Điền', at: .75 },
          'Từ núi Nưa, nghĩa quân đánh chiếm nhiều thành ấp ở Cửu Chân rồi Giao Chỉ, lấy Bồ Điền làm căn cứ.'),
        F({ name: 'NGHĨA QUÂN', rows: [['Thủ lĩnh', 'Bà Triệu, Triệu Quốc Đạt'], ['Căn cứ', 'Núi Nưa, Bồ Điền'], ['Cách đánh', 'Đánh nhanh, dựa núi rừng']] }, { name: 'NHÀ ĐÔNG NGÔ', rows: [['Chỉ huy', 'Lục Dận'], ['Lực lượng', 'Khoảng # nghìn quân', 8], ['Thủ đoạn', 'Mua chuộc, chia rẽ']] },
          'Nhà Ngô phải sai tướng Lục Dận đem khoảng tám nghìn quân sang đàn áp, vừa đánh vừa dùng của cải mua chuộc.'),
        AI({ title: 'KHỞI NGHĨA BÀ TRIỆU 248', ours: 'Nghĩa quân Bà Triệu', enemy: 'Quân Đông Ngô', top: '▲ GIAO CHỈ', pass: 'Vùng núi Cửu Chân', enemyKind: 'troop', enemyCmd: 'Lục Dận', oursCmd: 'Bà Triệu', lure: 'Nghĩa quân', fort: 'Căn cứ Bồ Điền', fortSide: 'ta', fortFall: .95,
          phases: ['Quân Ngô kéo vào vùng núi Cửu Chân', 'Nghĩa quân đánh chặn ở đường núi', 'Giao chiến nhiều trận ác liệt', 'Rút về căn cứ Bồ Điền, chiến đấu đến cùng'],
          say: 'Nghĩa quân dựa vào núi rừng Cửu Chân, đánh nhiều trận khiến quân Ngô khiếp sợ. Lục Dận dùng mưu mua chuộc, chia rẽ, rồi dồn quân bao vây căn cứ Bồ Điền. Cuộc chiến kéo dài nhiều tháng, đến khi lực lượng suy kiệt, Bà Triệu hy sinh trên núi Tùng khi mới hai mươi ba tuổi.' }),
        Q('Tôi muốn cưỡi cơn gió mạnh, đạp luồng sóng dữ, chém cá kình ở biển Đông, đánh đuổi quân Ngô, giành lại giang sơn, cởi ách nô lệ.', 'Bà Triệu – lời tương truyền', 'Câu nói tương truyền của Bà Triệu đã trở thành biểu tượng cho khí phách của người phụ nữ Việt Nam.'),
        PTS(['Tiếp nối ngọn lửa của Hai Bà Trưng', 'Khí phách bất khuất của phụ nữ Việt', 'Lăng mộ và đền thờ ở Hậu Lộc, Thanh Hóa'], 'Khởi nghĩa Bà Triệu tuy thất bại nhưng khiến chính quyền đô hộ phải dè chừng, và để lại tấm gương sáng ngời cho muôn đời sau.'),
        END('Khởi nghĩa Bà Triệu · năm 248')] },

    /* 14 */ { id: 'van-xuan-542', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/van-xuan-542/nguon.json
        { file: "01-hero.jpg", slot: "hero", caption: "Tranh thờ vua Lý Nam Đế và hoàng hậu (thế kỷ XVIII, Thái Bình)", credit: "Ảnh: thành viên Wikipedia · Public domain · Wikimedia Commons" },
        { file: "02-map.jpg", slot: "map", fit: 'contain', caption: "Nhà Lương (màu hồng) và các nước phương Bắc giữa thế kỷ VI", credit: "Ảnh: thành viên Wikipedia · CC BY-SA 3.0 · Wikimedia Commons" },
        { file: "03-ket.jpg", slot: "ket", caption: "Chùa Trấn Quốc, Hà Nội – tương truyền dựng từ thời Lý Nam Đế với tên Khai Quốc", credit: "Ảnh: shankar s. · CC BY 2.0 · Wikimedia Commons" }
      ],
      year: '542', name: 'Khởi nghĩa Lý Bí 542', who: 'Lý Bí', vs: 'nhà Lương', seed: 54, series: BAC,
      sources: ['Đại Việt sử ký toàn thư', 'Lương thư', 'Khâm định Việt sử thông giám cương mục'], hook: 'NHÀ NƯỚC VẠN XUÂN RA ĐỜI', hookQ: 'AI LÀ NGƯỜI ĐẦU TIÊN XƯNG ĐẾ CỦA NƯỚC VIỆT?',
      scenes: [
        T('VẠN XUÂN', 'KHỞI NGHĨA LÝ BÍ 542 – 544', 'ĐÁNH ĐUỔI QUÂN LƯƠNG, DỰNG NƯỚC VẠN XUÂN', 'NAM VIỆT ĐẾ', { say: 'Năm 542, Lý Bí khởi nghĩa đánh đuổi chính quyền đô hộ nhà Lương, hai năm sau lên ngôi hoàng đế, đặt tên nước là Vạn Xuân.' }),
        HERO('VỊ HOÀNG ĐẾ ĐẦU TIÊN', 'Lý Nam Đế', 'Lý Bí (503 – 548)', 'Người lập nước Vạn Xuân', 'Lý Bí là hào trưởng huyện Thái Bình thời nhà Lương. Ông liên kết hào kiệt các châu, nổi dậy chống sự cai trị hà khắc của nhà Lương.'),
        MAP('NĂM 542', 18, 'Nhà Lương', CHINA, [{ lon: 107.5, lat: 21.5, z: 1.4 }, { lon: 106.3, lat: 21.2, z: 3.5 }],
          [L(111, 24, 'NHÀ LƯƠNG', { style: 'enemy', at: .05 }), L(105.85, 21.03, 'Long Biên', { dot: 1, anchor: 'end', at: .4 }), L(109.2, 21.66, 'Hợp Phố', { dot: 1, anchor: 'start', at: .55 })],
          [R([[109.4, 22.3], [109.2, 21.75]], 'dich', .5, .2), R([[105.9, 21.05], [107.5, 21.5], [109.1, 21.68]], 'ta', .6, .25)], { lon: 105.85, lat: 21.03, text: 'Thành Long Biên', at: .3 },
          'Nghĩa quân chiếm thành Long Biên, Thứ sử Tiêu Tư bỏ chạy. Nhà Lương hai lần sai quân sang đánh đều bị đánh bại, trận lớn nhất diễn ra ở Hợp Phố.'),
        F({ name: 'NGHĨA QUÂN LÝ BÍ', rows: [['Thủ lĩnh', 'Lý Bí'], ['Tướng', 'Tinh Thiều, Phạm Tu, Triệu Túc'], ['Lực lượng', 'Hào kiệt các châu']] }, { name: 'NHÀ LƯƠNG', rows: [['Thứ sử', 'Tiêu Tư'], ['Viện binh', 'Tôn Quýnh, Lư Tử Hùng'], ['Kết cục', 'Thua to ở Hợp Phố']] },
          'Theo sử cũ, đầu năm 543 quân Lương kéo sang lần nữa, bị nghĩa quân đón đánh tan tác ở Hợp Phố, mười phần chết đến bảy tám.'),
        THANH({ title: 'KHỞI NGHĨA LÝ BÍ 542 – 543', ours: 'Nghĩa quân Lý Bí', enemy: 'Quân Lương', fort: 'Thành Long Biên', fall: .42, defCmd: 'Tiêu Tư', atkCmd: 'Lý Bí', atk2: 'Tinh Thiều', atk3: 'Phạm Tu', river: 'SÔNG HỒNG',
          phases: ['Hào kiệt các châu cùng nổi dậy', 'Vây đánh thành Long Biên', 'Tiêu Tư bỏ thành chạy về nước', 'Đánh tan viện binh Lương ở Hợp Phố'],
          say: 'Nghĩa quân từ nhiều ngả kéo về vây thành Long Biên. Thứ sử Tiêu Tư khiếp sợ, đem của cải trốn về phương Bắc. Năm 543, quân Lương sang báo thù, bị nghĩa quân đánh bại ở Hợp Phố. Cùng năm, tướng Phạm Tu đánh tan quân Lâm Ấp ở Cửu Đức. Mùa xuân năm 544, Lý Bí lên ngôi, xưng Lý Nam Đế, đặt quốc hiệu Vạn Xuân.' }),
        TL('DIỄN BIẾN', [['542', 'Khởi nghĩa, chiếm Long Biên'], ['543', 'Thắng lớn ở Hợp Phố'], ['544', 'Lập nước Vạn Xuân']], 'Chỉ trong hai năm, từ cuộc khởi nghĩa đã ra đời một nhà nước độc lập với quốc hiệu đầy khát vọng.'),
        PTS(['Lần đầu tiên người Việt xưng đế, đặt quốc hiệu', 'Quốc hiệu Vạn Xuân – mong nước muôn đời bền vững', 'Khẳng định ý thức độc lập, tự chủ'], 'Việc xưng đế, đặt quốc hiệu Vạn Xuân khẳng định người Việt có giang sơn riêng, ngang hàng với phương Bắc.'),
        END('Khởi nghĩa Lý Bí · 542 – 544')] },

    /* 15 */ { id: 'da-trach-550', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/da-trach-550/nguon.json
        { file: "01-ynghia.jpg", slot: "ynghia", caption: "Khuôn viên đền thờ Triệu Việt Vương ở Hưng Yên", credit: "Ảnh: Wkpd.donhat89 · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "02-ket.jpg", slot: "ket", caption: "Cổng đền thờ Triệu Việt Vương ở Hưng Yên", credit: "Ảnh: Wkpd.donhat89 · CC BY-SA 4.0 · Wikimedia Commons" }
      ],
      year: '550', name: 'Đầm Dạ Trạch 550', who: 'Triệu Quang Phục', vs: 'nhà Lương', seed: 55, series: BAC,
      sources: ['Đại Việt sử ký toàn thư', 'Khâm định Việt sử thông giám cương mục'], hook: 'ĐẦM LẦY THÀNH MỒ CHÔN GIẶC', hookQ: 'VÌ SAO QUÂN LƯƠNG KHÔNG THỂ VÀO ĐẦM DẠ TRẠCH?',
      scenes: [
        T('DẠ TRẠCH', 'CĂN CỨ ĐẦM DẠ TRẠCH 546 – 550', 'TRIỆU QUANG PHỤC GIỮ NƯỚC VẠN XUÂN', 'DẠ TRẠCH VƯƠNG', { ships: 3, say: 'Giữa vùng đầm lầy mênh mông bên sông Hồng, Triệu Quang Phục đã dùng lối đánh du kích, bảo vệ nền độc lập của nước Vạn Xuân.' }),
        HERO('DẠ TRẠCH VƯƠNG', 'Triệu Quang Phục', 'Triệu Việt Vương', 'Tướng của Lý Nam Đế', 'Triệu Quang Phục là tướng của Lý Nam Đế. Khi Lý Nam Đế thất thế, ông được giao binh quyền, lui về đầm Dạ Trạch kháng chiến.'),
        MAP('NĂM 546', 18, 'Nhà Lương', CHINA, [{ lon: 106.2, lat: 21, z: 2 }, { lon: 106.0, lat: 20.85, z: 5 }],
          [L(111, 24, 'NHÀ LƯƠNG', { style: 'enemy', at: .05 }), L(105.85, 21.03, 'Long Biên', { dot: 1, anchor: 'end', at: .4 }), L(106.02, 20.85, 'Đầm Dạ Trạch', { dot: 1, anchor: 'start', at: .55 })],
          [R([[105.85, 21.03], [105.95, 20.92]], 'dich', .45, .2)], { lon: 106.02, lat: 20.85, text: 'Dạ Trạch', at: .75 },
          'Đầm Dạ Trạch nằm ở vùng Khoái Châu, Hưng Yên ngày nay, lau sậy um tùm, bùn lầy hiểm trở, có bãi nổi ở giữa.'),
        F({ name: 'NGHĨA QUÂN DẠ TRẠCH', rows: [['Chỉ huy', 'Triệu Quang Phục'], ['Lực lượng', 'Khoảng # vạn người', 2], ['Cách đánh', 'Ngày ẩn, đêm đánh']] }, { name: 'NHÀ LƯƠNG', rows: [['Chỉ huy', 'Trần Bá Tiên'], ['Thế mạnh', 'Quân đông, thiện chiến'], ['Điểm yếu', 'Không quen đầm lầy']] },
          'Theo sử cũ, nghĩa quân có khoảng hai vạn người, ngày tắt khói lửa ẩn mình, đêm dùng thuyền độc mộc ra đánh úp trại giặc.'),
        DAM({ title: 'CĂN CỨ ĐẦM DẠ TRẠCH', ours: 'Nghĩa quân Dạ Trạch', enemy: 'Quân Lương', place: 'ĐẦM DẠ TRẠCH', enemyCmd: 'Trần Bá Tiên', oursCmd: 'Triệu Quang Phục', labels: [{ x: 960, y: 640, text: 'Bãi nổi giữa đầm', style: '' }],
          phases: ['Quân Lương vây quanh đầm', 'Nghĩa quân ẩn mình trong lau sậy', 'Đêm đêm dùng thuyền nhỏ đánh úp', 'Quân Lương mệt mỏi, rút về nước, nghĩa quân giành lại Long Biên'],
          say: 'Trần Bá Tiên vây đầm nhưng không sao tiến vào được. Ban ngày nghĩa quân ẩn kín, ban đêm dùng thuyền độc mộc đánh úp, cướp lương, giết giặc rồi rút vào đầm. Cuộc chiến kéo dài nhiều năm. Năm 550, nhân nhà Lương có loạn, Trần Bá Tiên phải về nước, Triệu Quang Phục tung quân đánh lớn, giành lại thành Long Biên.' }),
        TL('DIỄN BIẾN', [['546', 'Lui về đầm Dạ Trạch'], ['548', 'Xưng Triệu Việt Vương'], ['550', 'Giành lại Long Biên']], 'Sau nhiều năm kiên trì trong đầm lầy, Triệu Quang Phục giữ vững nền độc lập của nước Vạn Xuân và xưng là Triệu Việt Vương.'),
        PTS(['Cách đánh du kích dựa vào địa hình', 'Lấy ít địch nhiều, lấy yếu thắng mạnh', 'Giữ vững độc lập cho nước Vạn Xuân'], 'Đầm Dạ Trạch là một trong những căn cứ du kích sớm nhất trong lịch sử, cho thấy trí tuệ dựa vào thiên nhiên để đánh giặc.'),
        END('Đầm Dạ Trạch · Triệu Quang Phục')] },

    /* 16 */ { id: 'van-an-722', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/van-an-722/nguon.json
        { file: "01-hero.jpg", slot: "hero", fit: 'contain', caption: "Tượng đài Mai Hắc Đế", credit: "Ảnh: Bảo bảo 123456789 · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "02-ket.jpg", slot: "ket", caption: "Cổng một đền thờ Mai Hắc Đế", credit: "Ảnh: Vuong Tri Binh · CC BY-SA 4.0 · Wikimedia Commons" }
      ],
      year: '722', name: 'Khởi nghĩa Mai Thúc Loan 722', who: 'Mai Thúc Loan', vs: 'nhà Đường', seed: 56, series: BAC,
      sources: ['Đại Việt sử ký toàn thư', 'Cựu Đường thư', 'Tân Đường thư'], hook: 'MAI HẮC ĐẾ ĐÁNH CHIẾM TỐNG BÌNH', hookQ: 'NGƯỜI GÁNH MUỐI NÀO TRỞ THÀNH HOÀNG ĐẾ?',
      scenes: [
        T('MAI HẮC ĐẾ', 'KHỞI NGHĨA HOAN CHÂU NĂM 722', 'ĐÁNH CHIẾM PHỦ THÀNH TỐNG BÌNH', 'NỔI DẬY', { say: 'Năm 722, từ đất Hoan Châu, Mai Thúc Loan dựng cờ khởi nghĩa chống nhà Đường. Tương truyền, ông kêu gọi những người phu gánh vải quả cống nộp cùng nổi dậy.' }),
        HERO('MAI HẮC ĐẾ', 'Mai Thúc Loan', '? – 723', 'Lập căn cứ Vạn An ở Hoan Châu', 'Mai Thúc Loan xuất thân nghèo khó ở Hoan Châu, nay là Nghệ An. Ông xây thành Vạn An làm căn cứ, xưng đế, sử gọi là Mai Hắc Đế.'),
        MAP('NĂM 722', 18, 'Nhà Đường', CHINA, [{ lon: 106, lat: 20, z: 1.6 }, { lon: 105.6, lat: 20, z: 2.8 }],
          [L(111, 24, 'NHÀ ĐƯỜNG', { style: 'enemy', at: .05 }), L(105.5, 18.7, 'Vạn An', { dot: 1, anchor: 'end', at: .3 }), L(105.85, 21.03, 'Tống Bình', { dot: 1, anchor: 'start', at: .5 })],
          [R([[105.5, 18.75], [105.7, 19.6], [105.9, 20.5], [105.85, 21.0]], 'ta', .35, .35)], { lon: 105.85, lat: 21.03, text: 'Phủ thành Tống Bình', at: .8 },
          'Nghĩa quân từ Hoan Châu tiến ra Bắc, liên kết với nhiều vùng khác, đánh chiếm phủ thành Tống Bình, trung tâm cai trị của An Nam đô hộ phủ.'),
        F({ name: 'NGHĨA QUÂN', rows: [['Thủ lĩnh', 'Mai Thúc Loan'], ['Căn cứ', 'Thành Vạn An'], ['Liên kết', 'Lâm Ấp, Chân Lạp…']] }, { name: 'NHÀ ĐƯỜNG', rows: [['Đô hộ', 'Quang Sở Khách'], ['Viện binh', 'Dương Tư Húc'], ['Lực lượng', 'Khoảng # vạn quân', 10]] },
          'Theo sử Đường, triều đình phải sai Dương Tư Húc đem khoảng mười vạn quân sang đàn áp.'),
        THANH({ title: 'KHỞI NGHĨA MAI THÚC LOAN 722', ours: 'Nghĩa quân Mai Thúc Loan', enemy: 'Quân Đường', fort: 'Phủ thành Tống Bình', fall: .45, defCmd: 'Quang Sở Khách', atkCmd: 'Mai Thúc Loan', atk2: 'Nghĩa quân Diễn, Ái', atk3: 'Quân liên kết',
          phases: ['Khởi nghĩa ở Hoan Châu, xây thành Vạn An', 'Tiến ra Bắc, liên kết các vùng', 'Đánh chiếm phủ thành Tống Bình', 'Viên đô hộ Quang Sở Khách bỏ chạy'],
          say: 'Nghĩa quân từ Hoan Châu tiến ra, hào kiệt các châu Diễn, Ái cùng hưởng ứng. Phủ thành Tống Bình bị vây đánh, viên đô hộ Quang Sở Khách phải bỏ chạy về nước. Mai Thúc Loan làm chủ đất nước một thời gian, cho đến khi nhà Đường dồn đại quân sang đàn áp.' }),
        TL('DIỄN BIẾN', [['722', 'Khởi nghĩa ở Hoan Châu'], ['722', 'Chiếm phủ thành Tống Bình'], ['723', 'Đại quân Đường đàn áp (theo sử Việt)']], 'Cuộc khởi nghĩa tuy ngắn ngủi nhưng đã làm chủ được trung tâm cai trị của nhà Đường.'),
        PTS(['Từ người lao động nghèo trở thành thủ lĩnh', 'Đánh chiếm trung tâm đô hộ của nhà Đường', 'Đền thờ Mai Hắc Đế ở Nam Đàn, Nghệ An'], 'Mai Hắc Đế được nhân dân Nghệ An tôn thờ, cuộc khởi nghĩa là minh chứng cho sức mạnh của những người lao động bị áp bức.'),
        END('Mai Hắc Đế · năm 722')] },

    /* 17 */ { id: 'tong-binh-791', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/tong-binh-791/nguon.json
        { file: "01-hero.jpg", slot: "hero", fit: 'contain', caption: "Tượng thờ Phùng Hưng ở quê hương Đường Lâm, Sơn Tây", credit: "Ảnh: Doãn Hiệu · CC BY 3.0 · Wikimedia Commons" },
        { file: "02-moc.jpg", slot: "moc", caption: "Lăng Phùng Hưng (Phùng đại vương lăng) ở phố Giảng Võ, Hà Nội", credit: "Ảnh: Doãn Hiệu · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "03-ynghia.jpg", slot: "ynghia", caption: "Đền thờ Phùng Hưng ở thôn Mông Phụ, Đường Lâm", credit: "Ảnh: Ngokhong · CC BY-SA 3.0 · Wikimedia Commons" },
        { file: "04-ket.jpg", slot: "ket", caption: "Chính điện đền Phùng Hưng ở Cam Lâm, Đường Lâm", credit: "Ảnh: Doãn Hiệu · CC BY 3.0 · Wikimedia Commons" }
      ],
      year: '791', name: 'Khởi nghĩa Phùng Hưng 791', who: 'Phùng Hưng', vs: 'nhà Đường', seed: 57, series: BAC,
      sources: ['Đại Việt sử ký toàn thư', 'Việt điện u linh', 'Tân Đường thư'], hook: 'BỐ CÁI ĐẠI VƯƠNG GIẢI PHÓNG TỐNG BÌNH', hookQ: 'VÌ SAO NHÂN DÂN TÔN PHÙNG HƯNG LÀ BỐ CÁI?',
      scenes: [
        T('PHÙNG HƯNG', 'KHỞI NGHĨA ĐƯỜNG LÂM NĂM 791', 'VÂY THÀNH TỐNG BÌNH, ĐUỔI CAO CHÍNH BÌNH', 'BỐ CÁI ĐẠI VƯƠNG', { say: 'Cuối thế kỷ tám, từ đất Đường Lâm, Phùng Hưng cùng em là Phùng Hải dấy binh chống chính sách vơ vét của nhà Đường.' }),
        HERO('BỐ CÁI ĐẠI VƯƠNG', 'Phùng Hưng', '? – 791', 'Hào trưởng đất Đường Lâm', 'Phùng Hưng là hào trưởng đất Đường Lâm, nay thuộc Sơn Tây, Hà Nội. Tương truyền ông có sức khỏe phi thường, vật được trâu, đánh được hổ.'),
        MAP('NĂM 791', 18, 'Nhà Đường', CHINA, [{ lon: 106, lat: 21.3, z: 2 }, { lon: 105.7, lat: 21.08, z: 5 }],
          [L(111, 24, 'NHÀ ĐƯỜNG', { style: 'enemy', at: .05 }), L(105.48, 21.13, 'Đường Lâm', { dot: 1, anchor: 'end', at: .35 }), L(105.85, 21.03, 'Tống Bình', { dot: 1, anchor: 'start', at: .5 })],
          [R([[105.48, 21.13], [105.65, 21.08], [105.83, 21.04]], 'ta', .4, .3)], { lon: 105.85, lat: 21.03, text: 'Phủ thành Tống Bình', at: .78 },
          'Từ Đường Lâm, nghĩa quân tiến về vây phủ thành Tống Bình, nơi đóng trụ sở của đô hộ Cao Chính Bình.'),
        F({ name: 'NGHĨA QUÂN', rows: [['Thủ lĩnh', 'Phùng Hưng, Phùng Hải'], ['Mưu sĩ', 'Đỗ Anh Hàn'], ['Căn cứ', 'Đường Lâm']] }, { name: 'NHÀ ĐƯỜNG', rows: [['Đô hộ', 'Cao Chính Bình'], ['Trị sở', 'Phủ thành Tống Bình'], ['Chính sách', 'Tăng thuế, vơ vét']] },
          'Theo sử cũ, nghĩa quân vây thành, Cao Chính Bình lo sợ sinh bệnh mà chết.'),
        THANH({ title: 'KHỞI NGHĨA PHÙNG HƯNG', ours: 'Nghĩa quân Phùng Hưng', enemy: 'Quân Đường', fort: 'Phủ thành Tống Bình', fall: .66, defCmd: 'Cao Chính Bình', atkCmd: 'Phùng Hưng', atk2: 'Phùng Hải', atk3: 'Đỗ Anh Hàn', river: 'SÔNG TÔ LỊCH',
          phases: ['Dấy binh ở Đường Lâm', 'Kéo quân về vây Tống Bình', 'Cao Chính Bình lo sợ mà chết', 'Phùng Hưng vào thành, làm chủ đất nước'],
          say: 'Theo kế của mưu sĩ Đỗ Anh Hàn, nghĩa quân kéo về vây chặt phủ thành Tống Bình. Viên đô hộ Cao Chính Bình lo sợ, lâm bệnh mà chết. Phùng Hưng vào thành, sắp đặt việc cai trị, nhưng chẳng bao lâu thì mất. Nhân dân thương nhớ, tôn ông là Bố Cái Đại Vương, nghĩa là người cha người mẹ của dân.' }),
        TL('DIỄN BIẾN', [['Khoảng 776', 'Dấy binh ở Đường Lâm'], ['791', 'Chiếm phủ thành Tống Bình'], ['791', 'Phùng Hưng mất, được tôn Bố Cái Đại Vương']], 'Sử sách ghi các mốc thời gian của cuộc khởi nghĩa chưa thống nhất, nhưng đều khẳng định Phùng Hưng đã làm chủ Tống Bình.'),
        PTS(['Giành quyền tự chủ trong một thời gian', 'Được nhân dân tôn là Bố Cái Đại Vương', 'Đền thờ ở Đường Lâm và nhiều nơi'], 'Danh hiệu Bố Cái Đại Vương thể hiện tình cảm sâu nặng của nhân dân đối với người anh hùng đất Đường Lâm.'),
        END('Phùng Hưng · Bố Cái Đại Vương')] },

    /* 18 */ { id: 'dai-la-931', year: '931', name: 'Đại La 931', who: 'Dương Đình Nghệ', vs: 'Nam Hán', seed: 58, series: TU_CHU,
      sources: ['Đại Việt sử ký toàn thư', 'Tân Ngũ đại sử'], hook: '3.000 GIẢ TỬ ĐÁNH TAN NAM HÁN', hookQ: 'ĐỘI QUÂN 3.000 GIẢ TỬ ĐÃ LÀM GÌ?',
      scenes: [
        T('ĐẠI LA', 'TRẬN THÀNH ĐẠI LA NĂM 931', 'DƯƠNG ĐÌNH NGHỆ ĐÁNH ĐUỔI NAM HÁN', 'GIÀNH QUYỀN TỰ CHỦ', { say: 'Năm 931, từ đất Ái Châu, Dương Đình Nghệ đem quân ra Bắc, đánh chiếm thành Đại La, đuổi quân Nam Hán về nước.' }),
        HERO('TIẾT ĐỘ SỨ', 'Dương Đình Nghệ', '? – 937', 'Hào trưởng đất Ái Châu', 'Dương Đình Nghệ là hào trưởng đất Ái Châu, nay là Thanh Hóa. Ông nuôi ba nghìn giả tử, tức những người con nuôi sẵn sàng chết vì nghĩa lớn.'),
        MAP('NĂM 931', 18, 'Nam Hán', CHINA, [{ lon: 106, lat: 20.6, z: 1.8 }, { lon: 105.8, lat: 20.5, z: 3.2 }],
          [L(112, 24, 'NAM HÁN', { style: 'enemy', at: .05 }), L(105.75, 19.85, 'Ái Châu', { dot: 1, anchor: 'end', at: .3 }), L(105.85, 21.03, 'Thành Đại La', { dot: 1, anchor: 'start', at: .5 })],
          [R([[105.75, 19.9], [105.85, 20.5], [105.85, 21.0]], 'ta', .35, .3), R([[108.5, 22.4], [107, 21.6], [105.95, 21.05]], 'dich', .6, .25)], { lon: 105.85, lat: 21.03, text: 'Đại La', at: .8 },
          'Quân Ái Châu tiến ra vây thành Đại La. Nam Hán sai quân sang cứu, nhưng bị chặn đánh tan trước khi kịp tới nơi.'),
        F({ name: 'QUÂN DƯƠNG ĐÌNH NGHỆ', rows: [['Chỉ huy', 'Dương Đình Nghệ'], ['Lực lượng', '3.000 giả tử và nghĩa binh'], ['Tướng', 'Ngô Quyền, Đinh Công Trứ']] }, { name: 'NAM HÁN', rows: [['Thứ sử', 'Lý Tiến'], ['Viện binh', 'Trần Bảo'], ['Kết cục', 'Trần Bảo tử trận']] },
          'Trong hàng ngũ của Dương Đình Nghệ có những tướng trẻ tài giỏi, trong đó có Ngô Quyền, người sau này lập nên chiến thắng Bạch Đằng năm 938.'),
        THANH({ title: 'TRẬN THÀNH ĐẠI LA 931', ours: 'Quân Dương Đình Nghệ', enemy: 'Quân Nam Hán', fort: 'Thành Đại La', fall: .45, defCmd: 'Lý Tiến', atkCmd: 'Dương Đình Nghệ', atk2: 'Giả tử Ái Châu', atk3: 'Nghĩa binh', river: 'SÔNG HỒNG', ships: 'Viện binh Trần Bảo',
          phases: ['Từ Ái Châu tiến ra Bắc', 'Vây thành Đại La', 'Lý Tiến bỏ thành chạy trốn', 'Đánh tan viện binh, chém Trần Bảo'],
          say: 'Dương Đình Nghệ đem ba nghìn giả tử cùng nghĩa binh vây thành Đại La. Thứ sử Lý Tiến hoảng sợ bỏ chạy về nước. Vua Nam Hán sai Trần Bảo đem quân sang cứu, Dương Đình Nghệ đón đánh, quân Nam Hán thua to, Trần Bảo tử trận. Dương Đình Nghệ tự xưng Tiết độ sứ, nắm quyền tự chủ.' }),
        TL('DIỄN BIẾN', [['931', 'Chiếm thành Đại La'], ['931', 'Diệt viện binh Trần Bảo'], ['937', 'Bị Kiều Công Tiễn sát hại']], 'Năm 937 Dương Đình Nghệ bị nha tướng Kiều Công Tiễn giết hại, dẫn đến cuộc chiến của Ngô Quyền và trận Bạch Đằng năm 938.'),
        PTS(['Tiếp nối nền tự chủ của họ Khúc', 'Đào tạo lớp tướng tài như Ngô Quyền', 'Mở đường cho chiến thắng Bạch Đằng 938'], 'Chiến thắng Đại La giữ vững quyền tự chủ, là bước chuẩn bị quan trọng cho nền độc lập lâu dài của dân tộc.'),
        END('Đại La 931 · Dương Đình Nghệ')] },

    /* 19 */ { id: 'chi-lang-981', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/chi-lang-981/nguon.json
        { file: "01-hero.jpg", slot: "hero", fit: 'contain', caption: "Tượng thờ vua Lê Đại Hành (Lê Hoàn) ở đền Hoa Lư", credit: "Ảnh: Kien1980v · Public domain · Wikimedia Commons" },
        { file: "02-map.jpg", slot: "map", caption: "Phủ Vườn Thiên ở cố đô Hoa Lư – kinh đô nhà Tiền Lê", credit: "Ảnh: Kien1980v · Public domain · Wikimedia Commons" },
        { file: "03-ynghia.jpg", slot: "ynghia", caption: "Đền vua Lê Đại Hành ở cố đô Hoa Lư, Ninh Bình", credit: "Ảnh: Nguoivuban · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "04-ket.jpg", slot: "ket", caption: "Lăng vua Lê Đại Hành ở Hoa Lư", credit: "Ảnh: Nguyễn Thanh Quang · CC BY-SA 4.0 · Wikimedia Commons" }
      ],
      year: '981', name: 'Chi Lăng – Bạch Đằng 981', who: 'Lê Hoàn', vs: 'nhà Tống', seed: 59, series: TU_CHU,
      sources: ['Đại Việt sử ký toàn thư', 'Tống sử'], hook: 'LẦN ĐẦU ĐÁNH BẠI QUÂN TỐNG', hookQ: 'VÌ SAO HẦU NHÂN BẢO BỎ MẠNG Ở CHI LĂNG?',
      scenes: [
        T('CHI LĂNG – BẠCH ĐẰNG', 'KHÁNG CHIẾN CHỐNG TỐNG NĂM 981', 'LÊ HOÀN PHÁ TAN QUÂN XÂM LƯỢC', 'TRẬN ĐẦU CHỐNG TỐNG', { stakes: 1, ships: 5, say: 'Năm 981, nhà Tống chia hai đường thủy bộ sang xâm lược. Lê Hoàn chỉ huy quân dân Đại Cồ Việt đánh bại cuộc xâm lược đầu tiên của nhà Tống.' }),
        HERO('VUA LÊ ĐẠI HÀNH', 'Lê Hoàn', '941 – 1005', 'Thập đạo tướng quân, lên ngôi năm 980', 'Lê Hoàn vốn là Thập đạo tướng quân thời nhà Đinh. Trước nguy cơ ngoại xâm, ông được tôn lên ngôi, mở ra nhà Tiền Lê.'),
        MAP('MÙA XUÂN NĂM 981', 17.5, 'Nhà Tống', CHINA, [{ lon: 107, lat: 21.5, z: 1.4 }, { lon: 106.7, lat: 21.3, z: 3.6 }],
          [L(111, 24, 'NHÀ TỐNG', { style: 'enemy', at: .05 }), L(106.55, 21.68, 'Chi Lăng', { dot: 1, anchor: 'start', at: .45 }), L(106.8, 20.9, 'Bạch Đằng', { dot: 1, anchor: 'start', at: .55 })],
          [R([[106.8, 22.6], [106.6, 22.0], [106.55, 21.7]], 'dich', .2, .3), R([[109, 21.4], [108, 21.2], [106.85, 20.95]], 'dich', .25, .3)], { lon: 106.55, lat: 21.68, text: 'Ải Chi Lăng', at: .78 },
          'Quân bộ của Hầu Nhân Bảo theo đường Lạng Sơn tiến vào, quân thủy của Lưu Trừng theo đường biển vào sông Bạch Đằng.'),
        F({ name: 'ĐẠI CỒ VIỆT – TIỀN LÊ', rows: [['Chỉ huy', 'Lê Hoàn'], ['Thủy chiến', 'Đóng cọc chặn sông Bạch Đằng'], ['Bộ chiến', 'Trá hàng, phục kích Chi Lăng']] }, { name: 'NHÀ TỐNG', rows: [['Quân bộ', 'Hầu Nhân Bảo, Tôn Toàn Hưng'], ['Quân thủy', 'Lưu Trừng'], ['Kết cục', 'Hầu Nhân Bảo bị chém']] },
          'Lê Hoàn cho đóng cọc ở sông Bạch Đằng để chặn thủy quân, còn trên bộ thì dùng kế trá hàng.'),
        AI({ title: 'CHI LĂNG 981', ours: 'Quân Đại Cồ Việt', enemy: 'Quân Tống', top: '▲ ĐƯỜNG LẠNG SƠN', pass: 'ẢI CHI LĂNG', enemyCmd: 'Hầu Nhân Bảo', oursCmd: 'Lê Hoàn', lure: 'Sứ giả trá hàng', remnant: 'Quân Tống tan vỡ',
          labels: [{ x: 690, y: 610, text: '✕ Hầu Nhân Bảo bị chém', style: 'warn', at: .5 }],
          phases: ['Quân Tống theo đường bộ tiến vào', 'Lê Hoàn sai người trá hàng, nhử địch', 'Phục binh hai bên ải đổ ra', 'Hầu Nhân Bảo bị chém, quân Tống tan vỡ'],
          say: 'Trên sông Bạch Đằng, bãi cọc khiến thủy quân Lưu Trừng không tiến lên được. Trên bộ, Lê Hoàn sai người giả vờ xin hàng để nhử Hầu Nhân Bảo vào sâu. Theo Đại Việt sử ký toàn thư, khi quân Tống tới ải Chi Lăng, phục binh đổ ra đánh, Hầu Nhân Bảo bị chém. Hai cánh quân còn lại hoảng sợ rút chạy, quân ta truy kích, bắt sống nhiều tướng giặc.' }),
        TL('DIỄN BIẾN', [['980', 'Lê Hoàn lên ngôi'], ['981', 'Quân Tống hai đường tiến vào'], ['981', 'Thắng lớn ở Chi Lăng, Bạch Đằng']], 'Cuộc kháng chiến diễn ra nhanh chóng, chỉ trong mùa xuân năm 981 quân Tống đã phải rút về.'),
        PTS(['Đập tan cuộc xâm lược đầu tiên của nhà Tống', 'Bảo vệ nền độc lập non trẻ', 'Kết hợp thủy chiến và bộ chiến tài tình'], 'Chiến thắng năm 981 khiến nhà Tống phải công nhận Đại Cồ Việt, giữ yên bờ cõi suốt nhiều chục năm.'),
        END('Chi Lăng – Bạch Đằng 981 · Lê Hoàn')] },

    /* 20 */ { id: 'ung-chau-1075', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/ung-chau-1075/nguon.json
        { file: "01-hero.jpg", slot: "hero", fit: 'contain', caption: "Tượng Lý Thường Kiệt tại Bảo tàng Lịch sử Quân sự Việt Nam", credit: "Ảnh: Phương Huy · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "02-map.jpg", slot: "map", caption: "Tường thành cổ Nam Ninh (Quảng Tây) – vùng đất Ung Châu thời Tống; đoạn tường hiện nay xây thời sau", credit: "Ảnh: EditQ · CC BY-SA 4.0 · Wikimedia Commons" },
        { file: "03-ket.jpg", slot: "ket", fit: 'contain', caption: "Bia chùa Linh Xứng (1126) ghi công Lý Thường Kiệt – Bảo tàng Lịch sử Quốc gia", credit: "Ảnh: Daderot · CC0 · Wikimedia Commons" }
      ],
      year: '1075', name: 'Ung Châu 1075', who: 'Lý Thường Kiệt', vs: 'nhà Tống', seed: 60, series: 'SỬ VIỆT · NHÀ LÝ',
      sources: ['Đại Việt sử ký toàn thư', 'Tống sử', 'Việt sử lược'], hook: 'TIÊN PHÁT CHẾ NHÂN', hookQ: 'VÌ SAO QUÂN LÝ ĐÁNH SANG ĐẤT TỐNG TRƯỚC?',
      scenes: [
        T('UNG CHÂU', 'CUỘC TẬP KÍCH ĐẤT TỐNG 1075 – 1076', 'TIÊN PHÁT CHẾ NHÂN', 'ĐÁNH ĐỂ PHÒNG THỦ', { say: 'Biết nhà Tống đang chuẩn bị xâm lược, cuối năm 1075 Lý Thường Kiệt chủ động đem quân đánh sang các căn cứ của Tống ở Ung Châu, Khâm Châu, Liêm Châu.' }),
        HERO('THÁI ÚY', 'Lý Thường Kiệt', '1019 – 1105', 'Tổng chỉ huy quân đội nhà Lý', 'Lý Thường Kiệt chủ trương ngồi yên đợi giặc không bằng đem quân ra trước để chặn mũi nhọn của giặc.'),
        MAP('CUỐI NĂM 1075', 17, 'Nhà Tống', CHINA, [{ lon: 107.5, lat: 22, z: 1.6 }, { lon: 108.4, lat: 22.2, z: 3.2 }],
          [L(111, 24.5, 'NHÀ TỐNG', { style: 'enemy', at: .05 }), L(108.37, 22.82, 'Ung Châu', { dot: 1, anchor: 'start', at: .5 }), L(108.6, 21.95, 'Khâm Châu', { dot: 1, anchor: 'start', at: .35 }), L(109.2, 21.66, 'Liêm Châu', { dot: 1, anchor: 'start', at: .4 })],
          [R([[106.9, 21.1], [108.2, 21.7], [108.6, 21.95]], 'ta', .2, .25), R([[106.5, 22.2], [107.6, 22.6], [108.3, 22.8]], 'ta', .3, .3)], { lon: 108.37, lat: 22.82, text: 'Thành Ung Châu', at: .78 },
          'Quân thủy đánh chiếm Khâm Châu, Liêm Châu, quân bộ theo đường núi tiến lên. Hai cánh hợp lại vây thành Ung Châu.'),
        F({ name: 'ĐẠI VIỆT – NHÀ LÝ', rows: [['Chỉ huy', 'Lý Thường Kiệt'], ['Phối hợp', 'Tông Đản đem quân bộ'], ['Lực lượng', 'Khoảng # vạn quân', 10]] }, { name: 'NHÀ TỐNG', rows: [['Giữ Ung Châu', 'Tô Giam'], ['Kho tàng', 'Lương thảo chuẩn bị xâm lược'], ['Kết cục', 'Ung Châu thất thủ']] },
          'Theo sử cũ, quân nhà Lý có khoảng mười vạn người. Ở Ung Châu, Tô Giam cố thủ hơn bốn mươi ngày.'),
        THANH({ title: 'TRẬN UNG CHÂU 1075 – 1076', ours: 'Quân nhà Lý', enemy: 'Quân Tống', fort: 'Thành Ung Châu', fall: .7, defCmd: 'Tô Giam', atkCmd: 'Lý Thường Kiệt', atk2: 'Tông Đản', atk3: 'Quân thủy', river: 'SÔNG UẤT',
          phases: ['Thủy quân chiếm Khâm Châu, Liêm Châu', 'Quân bộ vượt núi tiến lên', 'Vây thành Ung Châu hơn 40 ngày', 'Phá thành, triệt căn cứ chuẩn bị xâm lược'],
          say: 'Quân Lý đánh nhanh chiếm Khâm Châu, Liêm Châu, rồi hợp vây Ung Châu. Tô Giam cố thủ hơn bốn mươi ngày. Quân ta dùng hỏa công và đắp đất sát chân thành mà leo lên. Đầu năm 1076, thành vỡ, các căn cứ tập trung lương thảo, vũ khí để xâm lược Đại Việt đều bị phá hủy, rồi quân ta rút về nước.' }),
        TL('DIỄN BIẾN', [['Cuối 1075', 'Xuất quân đánh sang đất Tống'], ['03.1076', 'Hạ thành Ung Châu sau hơn 40 ngày vây'], ['1077', 'Thắng lớn ở sông Như Nguyệt']], 'Đòn tập kích phủ đầu năm 1075 đã làm chậm kế hoạch xâm lược của nhà Tống, để rồi quân Tống thất bại ở sông Như Nguyệt năm 1077.'),
        PTS(['Chiến lược "tiên phát chế nhân" độc đáo', 'Phá hủy căn cứ xâm lược của địch', 'Chuẩn bị thế chủ động cho trận Như Nguyệt'], 'Cuộc tập kích Ung Châu là một trong những trận tiến công táo bạo hiếm có trong lịch sử giữ nước của dân tộc.'),
        END('Ung Châu 1075 – 1076 · Lý Thường Kiệt')] },

    /* 21 */ { id: 'thien-mac-1285', anh: [ // ảnh tư liệu (phim tài liệu) – nguồn & giấy phép: anh/thien-mac-1285/nguon.json
        { file: "01-ynghia.jpg", slot: "ynghia", caption: "Ngai thờ các vua Trần trong Đền Trần, Nam Định", credit: "Ảnh: Hoangvantoanajc · CC0 · Wikimedia Commons" },
        { file: "02-ket.jpg", slot: "ket", caption: "Đền Trần ở Nam Định – nơi tưởng nhớ vua tôi nhà Trần", credit: "Ảnh: Hoangvantoanajc · CC0 · Wikimedia Commons" }
      ],
      year: '1285', sortKey: 1284.5, name: 'Thiên Mạc 1285', who: 'Trần Bình Trọng', vs: 'Nguyên Mông', seed: 61, series: 'SỬ VIỆT · HƯNG ĐẠO VƯƠNG',
      sources: ['Đại Việt sử ký toàn thư', 'An Nam chí lược'], hook: 'THÀ LÀM QUỶ NƯỚC NAM', hookQ: 'AI ĐÃ NÓI "THÀ LÀM QUỶ NƯỚC NAM"?',
      scenes: [
        T('THIÊN MẠC', 'TRẬN BÃI THIÊN MẠC NĂM 1285', 'TRẦN BÌNH TRỌNG CHẶN GIẶC CHO VUA RÚT LUI', 'KHÍ TIẾT', { ships: 3, say: 'Đầu năm 1285, khi quân Nguyên ồ ạt tràn xuống, tướng Trần Bình Trọng đã chiến đấu đến cùng ở bãi Thiên Mạc để bảo vệ cuộc rút lui của triều đình.' }),
        HERO('BẢO NGHĨA VƯƠNG', 'Trần Bình Trọng', '1259 – 1285', 'Tướng nhà Trần', 'Trần Bình Trọng vốn dòng dõi vua Lê Đại Hành, được ban quốc tính họ Trần và gả công chúa.'),
        MAP('ĐẦU NĂM 1285', 16.8, 'Nhà Nguyên', CHINA, [{ lon: 106.2, lat: 21, z: 2 }, { lon: 106.0, lat: 20.7, z: 4.5 }],
          [L(111, 24, 'NHÀ NGUYÊN', { style: 'enemy', at: .05 }), L(105.85, 21.03, 'Thăng Long', { dot: 1, anchor: 'end', at: .35 }), L(105.98, 20.62, 'Bãi Thiên Mạc', { dot: 1, anchor: 'start', at: .55 })],
          [R([[106.2, 22], [106.0, 21.4], [105.9, 21.05]], 'dich', .2, .3), R([[105.9, 21.0], [105.97, 20.65]], 'dich', .5, .2)], { lon: 105.98, lat: 20.62, text: 'Thiên Mạc', at: .78 },
          'Quân Nguyên chiếm Thăng Long rồi truy đuổi triều đình về phía nam. Bãi Thiên Mạc, nay thuộc Duy Tiên, Hà Nam, là nơi Trần Bình Trọng đặt trận chặn giặc.'),
        F({ name: 'ĐẠI VIỆT – NHÀ TRẦN', rows: [['Chỉ huy', 'Trần Bình Trọng'], ['Nhiệm vụ', 'Chặn giặc, bảo vệ vua rút lui'], ['Lực lượng', 'Ít quân']] }, { name: 'NHÀ NGUYÊN', rows: [['Chỉ huy', 'Thoát Hoan, Ô Mã Nhi'], ['Lực lượng', 'Khoảng # vạn quân', 50], ['Thế', 'Đang thắng thế, truy đuổi']] },
          'Theo sử cũ, cuộc xâm lược lần thứ hai có khoảng năm mươi vạn quân, thế giặc lúc đầu rất mạnh.'),
        SONG({ title: 'TRẬN BÃI THIÊN MẠC 1285', ours: 'Quân Trần Bình Trọng', enemy: 'Quân Nguyên', river: 'SÔNG HỒNG', enemyCmd: 'Quân Nguyên truy đuổi', oursCmd: 'Trần Bình Trọng', lure: 'Thuyền vua rút lui',
          phases: ['Triều đình rút về phía nam', 'Trần Bình Trọng ở lại chặn giặc', 'Giao chiến ác liệt trên bãi sông', 'Bị bắt nhưng không khuất phục, hy sinh anh dũng'],
          say: 'Để triều đình kịp rút lui an toàn, Trần Bình Trọng đem quân chặn đánh ở bãi Thiên Mạc. Quân ta ít, giặc đông, ông chiến đấu đến cùng thì bị bắt. Giặc dụ hàng, hứa phong vương ở đất Bắc. Ông khảng khái từ chối rồi hy sinh. Nhờ sự hy sinh ấy, vua tôi nhà Trần bảo toàn lực lượng, chờ thời cơ phản công.' }),
        Q('Ta thà làm quỷ nước Nam chứ không thèm làm vương đất Bắc.', 'Trần Bình Trọng – Đại Việt sử ký toàn thư', 'Câu nói bất hủ của Trần Bình Trọng khi bị giặc dụ hàng, được ghi lại trong Đại Việt sử ký toàn thư.'),
        PTS(['Tấm gương trung nghĩa bất khuất', 'Bảo vệ an toàn cho triều đình rút lui', 'Góp phần vào thắng lợi năm 1285'], 'Chỉ vài tháng sau, quân dân nhà Trần phản công, thắng lớn ở Hàm Tử, Chương Dương, Tây Kết, đuổi quân Nguyên về nước.'),
        END('Thiên Mạc 1285 · Trần Bình Trọng')] },

    /* 22 */ { id: 'hai-trieu-1390', year: '1390', name: 'Hải Triều 1390', who: 'Trần Khát Chân', vs: 'Chiêm Thành', seed: 62, series: 'SỬ VIỆT · NHÀ TRẦN',
      sources: ['Đại Việt sử ký toàn thư', 'Khâm định Việt sử thông giám cương mục'], hook: 'HỎA KHÍ HẠ CHẾ BỒNG NGA', hookQ: 'LOẠT HỎA KHÍ NÀO CHẤM DỨT NHỮNG CUỘC TẤN CÔNG VÀO THĂNG LONG?',
      scenes: [
        T('HẢI TRIỀU', 'TRẬN SÔNG HẢI TRIỀU NĂM 1390', 'CHẤM DỨT NHỮNG CUỘC TẤN CÔNG VÀO THĂNG LONG', 'BẢO VỆ KINH THÀNH', { ships: 6, say: 'Cuối thế kỷ mười bốn, kinh thành Thăng Long nhiều lần bị tấn công. Năm 1390, trên sông Hải Triều, tướng Trần Khát Chân đã chấm dứt mối đe dọa ấy.' }),
        HERO('THƯỢNG TƯỚNG', 'Trần Khát Chân', '1370 – 1399', 'Tướng nhà Trần', 'Trần Khát Chân là hậu duệ của danh tướng Trần Bình Trọng, được giao trọng trách đánh giặc khi kinh thành lâm nguy.'),
        MAP('THÁNG GIÊNG NĂM 1390', 16.5, 'Chiêm Thành', [], [{ lon: 106, lat: 19.5, z: 1.4 }, { lon: 106.3, lat: 20.65, z: 4.5 }],
          [L(108.5, 14, 'CHIÊM THÀNH', { style: 'enemy', at: .05 }), L(105.85, 21.03, 'Thăng Long', { dot: 1, anchor: 'end', at: .4 }), L(106.3, 20.65, 'Sông Hải Triều', { dot: 1, anchor: 'start', at: .55 })],
          [R([[108, 15], [107.4, 17.5], [106.6, 19.8], [106.3, 20.62]], 'dich', .2, .35)], { lon: 106.3, lat: 20.65, text: 'Hải Triều', at: .78 },
          'Quân Chiêm Thành theo đường biển tiến ra, vào sông Hải Triều, tức sông Luộc ngày nay, hướng về kinh thành.'),
        F({ name: 'ĐẠI VIỆT – NHÀ TRẦN', rows: [['Chỉ huy', 'Trần Khát Chân'], ['Vũ khí', 'Hỏa khí, súng thần cơ thời ấy'], ['Thế trận', 'Chờ ở sông Hải Triều']] }, { name: 'CHIÊM THÀNH', rows: [['Chỉ huy', 'Chế Bồng Nga'], ['Lực lượng', 'Hơn # chiến thuyền', 100], ['Kết cục', 'Chế Bồng Nga tử trận']] },
          'Theo sử cũ, Chế Bồng Nga đem hơn một trăm chiến thuyền ra quan sát trận địa.'),
        SONG({ title: 'TRẬN SÔNG HẢI TRIỀU 1390', ours: 'Quân nhà Trần', enemy: 'Thủy quân Chiêm Thành', river: 'SÔNG HẢI TRIỀU', enemyCmd: 'Chế Bồng Nga', oursCmd: 'Trần Khát Chân', lure: 'Quân giữ trận',
          phases: ['Thủy quân Chiêm tiến vào sông Hải Triều', 'Quân Trần dàn trận chờ sẵn', 'Hỏa khí đồng loạt nhả đạn vào thuyền chỉ huy', 'Chế Bồng Nga tử trận, quân Chiêm tan vỡ'],
          say: 'Trần Khát Chân dàn quân chờ ở sông Hải Triều. Theo sử cũ, nhờ có người chỉ điểm chiếc thuyền sơn xanh của Chế Bồng Nga, quân Trần tập trung hỏa khí bắn vào. Chế Bồng Nga trúng đạn chết ngay trên thuyền. Quân Chiêm mất chủ tướng, tan vỡ rút chạy. Từ đó các cuộc tấn công vào Thăng Long chấm dứt.' }),
        TL('DIỄN BIẾN', [['1371', 'Thăng Long bị tấn công lần đầu'], ['1377', 'Vua Trần Duệ Tông tử trận'], ['1390', 'Chế Bồng Nga tử trận ở Hải Triều']], 'Sau gần hai mươi năm bị đe dọa, chiến thắng Hải Triều đem lại sự yên ổn cho kinh thành.'),
        PTS(['Chấm dứt nhiều năm kinh thành bị đe dọa', 'Sử dụng hỏa khí hiệu quả trong thủy chiến', 'Ổn định biên cương phía nam'], 'Trận Hải Triều là một trong những trận đầu tiên sử sách ghi việc dùng hỏa khí mang tính quyết định trong chiến tranh ở nước ta.'),
        END('Hải Triều 1390 · Trần Khát Chân')] },

    /* 23 */ { id: 'bo-co-1408', year: '1408', name: 'Bô Cô 1408', who: 'Đặng Tất', vs: 'nhà Minh', seed: 63, series: 'SỬ VIỆT · NHÀ HẬU TRẦN',
      sources: ['Đại Việt sử ký toàn thư', 'Minh thực lục'], hook: 'ĐẠI THẮNG ĐẦU TIÊN CHỐNG MINH', hookQ: 'TRẬN NÀO KHIẾN TƯỚNG MINH MỘC THẠNH THÁO CHẠY?',
      scenes: [
        T('BÔ CÔ', 'TRẬN BẾN BÔ CÔ NĂM 1408', 'NHÀ HẬU TRẦN ĐÁNH TAN QUÂN MỘC THẠNH', 'ĐẠI THẮNG', { ships: 4, say: 'Cuối năm 1408, trên bến Bô Cô, nghĩa quân nhà Hậu Trần đã giành chiến thắng lớn đầu tiên trước quân Minh xâm lược.' }),
        HERO('QUỐC CÔNG', 'Đặng Tất', '? – 1409', 'Đại tướng của Giản Định Đế', 'Sau khi nhà Hồ thất bại, Giản Định Đế Trần Ngỗi dấy binh khôi phục nhà Trần. Đặng Tất là một trong những đại tướng tài giỏi của ông.'),
        MAP('CUỐI NĂM 1408', 16.5, 'Nhà Minh', CHINA, [{ lon: 106.3, lat: 21, z: 1.8 }, { lon: 106.05, lat: 20.4, z: 4.5 }],
          [L(111, 24, 'NHÀ MINH', { style: 'enemy', at: .05 }), L(105.85, 21.03, 'Đông Quan', { dot: 1, anchor: 'end', at: .35 }), L(106.05, 20.32, 'Bến Bô Cô', { dot: 1, anchor: 'start', at: .55 })],
          [R([[105.85, 21.0], [105.98, 20.7], [106.04, 20.36]], 'dich', .3, .3)], { lon: 106.05, lat: 20.32, text: 'Bô Cô', at: .78 },
          'Tướng Minh Mộc Thạnh đem quân từ Đông Quan xuống phía nam để dẹp nghĩa quân, gặp quân Hậu Trần ở bến Bô Cô, vùng Nam Định ngày nay.'),
        F({ name: 'NHÀ HẬU TRẦN', rows: [['Chỉ huy', 'Giản Định Đế, Đặng Tất'], ['Tướng', 'Nguyễn Cảnh Chân'], ['Lực lượng', 'Quân Nghệ An, Thuận Hóa']] }, { name: 'NHÀ MINH', rows: [['Chỉ huy', 'Mộc Thạnh'], ['Lực lượng', 'Khoảng # vạn quân', 4], ['Tướng tử trận', 'Lữ Nghị']] },
          'Theo sử cũ, quân Minh có khoảng bốn vạn người. Trong trận này, Thượng thư Lưu Tuấn và Đô đốc Lữ Nghị của Minh tử trận.'),
        SONG({ title: 'TRẬN BẾN BÔ CÔ 1408', ours: 'Quân Hậu Trần', enemy: 'Quân Minh', river: 'SÔNG ĐÁY', enemyCmd: 'Mộc Thạnh', oursCmd: 'Đặng Tất', bigEnemy: 1,
          phases: ['Quân Minh tiến xuống phía nam', 'Quân Hậu Trần đón đánh ở Bô Cô', 'Đặng Tất thúc quân giáp chiến từ sáng đến chiều', 'Quân Minh đại bại, Mộc Thạnh chạy về Cổ Lộng'],
          say: 'Hai bên giao chiến ở bến Bô Cô từ giờ Tỵ đến giờ Dậu, tức từ sáng đến chiều tối. Giản Định Đế tự đánh trống thúc quân, Đặng Tất và Nguyễn Cảnh Chân dốc sức xung trận. Quân Minh đại bại, Lữ Nghị và Lưu Tuấn tử trận, Mộc Thạnh phải bỏ chạy vào thành Cổ Lộng.' }),
        TL('DIỄN BIẾN', [['1407', 'Nhà Hồ thất bại trước quân Minh'], ['1407', 'Trần Ngỗi xưng Giản Định Đế'], ['12.1408', 'Đại thắng Bô Cô']], 'Chiến thắng Bô Cô làm sống lại niềm tin khôi phục đất nước.'),
        PTS(['Chiến thắng lớn đầu tiên trước quân Minh', 'Tinh thần quật cường sau khi nhà Hồ thất bại', 'Tiếp nối ý chí độc lập cho khởi nghĩa Lam Sơn'], 'Tuy nhà Hậu Trần sau đó thất bại, chiến thắng Bô Cô vẫn là minh chứng cho ý chí không chịu làm nô lệ của người Việt.'),
        END('Bô Cô 1408 · Đặng Tất')] },

    /* 24 */ { id: 'kha-luu-1424', year: '1424', name: 'Khả Lưu – Bồ Ải 1424', who: 'Lê Lợi', vs: 'nhà Minh', seed: 64, series: 'SỬ VIỆT · KHỞI NGHĨA LAM SƠN',
      sources: ['Đại Việt sử ký toàn thư', 'Lam Sơn thực lục'], hook: 'ĐỐT TRẠI GIẢ RÚT, PHỤC KÍCH DIỆT ĐỊCH', hookQ: 'MẸO ĐỐT TRẠI NÀO KHIẾN QUÂN MINH SẬP BẪY?',
      scenes: [
        T('KHẢ LƯU', 'TRẬN KHẢ LƯU – BỒ ẢI CUỐI NĂM 1424', 'NGHĨA QUÂN LAM SƠN TIẾN VÀO NGHỆ AN', 'MƯU KẾ', { ships: 2, say: 'Cuối năm 1424, nghĩa quân Lam Sơn chuyển vào Nghệ An. Ở Khả Lưu và Bồ Ải, Lê Lợi dùng mưu đốt trại giả rút để đánh bại quân Minh.' }),
        HERO('BÌNH ĐỊNH VƯƠNG', 'Lê Lợi', '1385 – 1433', 'Lãnh tụ khởi nghĩa Lam Sơn', 'Theo kế của tướng Nguyễn Chích, Lê Lợi đưa nghĩa quân vào Nghệ An, vùng đất rộng người đông, làm bàn đạp tiến ra Bắc.'),
        MAP('CUỐI NĂM 1424', 15.8, 'Nhà Minh', CHINA, [{ lon: 105.6, lat: 19.5, z: 2 }, { lon: 105.2, lat: 19.0, z: 4 }],
          [L(111, 24, 'NHÀ MINH', { style: 'enemy', at: .05 }), L(105.35, 19.95, 'Lam Sơn', { dot: 1, anchor: 'end', at: .3 }), L(105.1, 18.95, 'Khả Lưu', { dot: 1, anchor: 'end', at: .55 }), L(105.68, 18.67, 'Nghệ An', { dot: 1, anchor: 'start', at: .5 })],
          [R([[105.35, 19.9], [105.2, 19.4], [105.1, 19.0]], 'ta', .25, .3)], { lon: 105.1, lat: 18.95, text: 'Ải Khả Lưu', at: .78 },
          'Nghĩa quân từ miền tây Thanh Hóa tiến vào Nghệ An, đóng ở bờ sông Lam gần ải Khả Lưu, vùng Anh Sơn ngày nay.'),
        F({ name: 'NGHĨA QUÂN LAM SƠN', rows: [['Chỉ huy', 'Lê Lợi'], ['Mưu', 'Đốt trại, giả rút lui'], ['Tướng', 'Nguyễn Chích, Lê Sát…']] }, { name: 'NHÀ MINH', rows: [['Chỉ huy', 'Trần Trí, Phương Chính'], ['Đóng ở', 'Bờ bắc sông Lam'], ['Kết cục', 'Thua to, rút về thành Nghệ An']] },
          'Hai bên đóng quân cách sông nhiều ngày. Quân Minh đông, chiếm giữ ải hiểm.'),
        AI({ title: 'TRẬN KHẢ LƯU – BỒ ẢI 1424', ours: 'Nghĩa quân Lam Sơn', enemy: 'Quân Minh', top: '▲ THÀNH NGHỆ AN', pass: 'ẢI KHẢ LƯU', enemyKind: 'troop', enemyCmd: 'Phương Chính', oursCmd: 'Lê Lợi', lure: 'Đốt trại giả rút', remnant: 'Quân Minh thua chạy',
          labels: [{ x: 700, y: 760, text: '🔥 Trại bị đốt', style: 'warn', at: .1 }],
          phases: ['Hai bên đóng quân hai bờ sông Lam', 'Ban đêm nghĩa quân đốt trại, giả vờ rút', 'Quân Minh đuổi theo, lọt ổ phục kích', 'Quân Minh thua to, chạy về thành Nghệ An'],
          say: 'Thấy quân Minh giữ chỗ hiểm, Lê Lợi cho đốt trại, giả vờ rút lui, nhưng ngầm đặt phục binh ở chỗ hiểm yếu. Quân Minh tưởng nghĩa quân bỏ chạy, vượt sông đuổi theo, lọt vào trận địa mai phục. Nghĩa quân đổ ra đánh, quân Minh thua to, bị chém và chết đuối rất nhiều, tàn quân chạy về cố thủ thành Nghệ An.' }),
        TL('DIỄN BIẾN', [['1418', 'Dựng cờ khởi nghĩa ở Lam Sơn'], ['1424', 'Thắng ở Khả Lưu – Bồ Ải'], ['1425', 'Giải phóng Nghệ An, Tân Bình, Thuận Hóa']], 'Sau chiến thắng này, nghĩa quân làm chủ phần lớn Nghệ An, rồi giải phóng cả một vùng rộng lớn ở phía nam.'),
        PTS(['Chuyển hướng chiến lược vào Nghệ An thành công', 'Nghệ thuật nghi binh, phục kích', 'Tạo thế mạnh để tiến ra Bắc'], 'Trận Khả Lưu – Bồ Ải mở ra bước ngoặt, đưa khởi nghĩa Lam Sơn từ thế cầm cự sang thế tấn công.'),
        END('Khả Lưu – Bồ Ải 1424 · Lê Lợi')] },

    /* 25 */ { id: 'tot-dong-1426', year: '1426', name: 'Tốt Động – Chúc Động 1426', who: 'Lê Lợi', vs: 'nhà Minh', seed: 65, series: 'SỬ VIỆT · KHỞI NGHĨA LAM SƠN',
      sources: ['Đại Việt sử ký toàn thư', 'Lam Sơn thực lục', 'Bình Ngô đại cáo'], hook: 'VƯƠNG THÔNG THẢM BẠI', hookQ: 'VƯƠNG THÔNG THẢM BẠI Ở ĐÂU NĂM 1426?',
      scenes: [
        T('TỐT ĐỘNG – CHÚC ĐỘNG', 'TRẬN TỐT ĐỘNG – CHÚC ĐỘNG NĂM 1426', 'ĐÁNH TAN ĐẠO QUÂN VƯƠNG THÔNG', 'BƯỚC NGOẶT', { say: 'Cuối năm 1426, ở vùng Chương Mỹ ngày nay, nghĩa quân Lam Sơn giáng đòn mạnh vào đạo quân viện binh của Vương Thông.' }),
        HERO('TƯỚNG LAM SƠN', 'Đinh Lễ', '? – 1427', 'Cùng Nguyễn Xí chỉ huy trận đánh', 'Trận đánh do các tướng Đinh Lễ, Nguyễn Xí cùng nhiều tướng khác của nghĩa quân Lam Sơn chỉ huy, dưới sự lãnh đạo của Lê Lợi.'),
        MAP('THÁNG 11.1426', 15.8, 'Nhà Minh', CHINA, [{ lon: 106, lat: 21, z: 2 }, { lon: 105.75, lat: 20.92, z: 5 }],
          [L(111, 24, 'NHÀ MINH', { style: 'enemy', at: .05 }), L(105.85, 21.03, 'Đông Quan', { dot: 1, anchor: 'start', at: .35 }), L(105.68, 20.88, 'Tốt Động', { dot: 1, anchor: 'end', at: .55 }), L(105.75, 20.9, 'Chúc Động', { dot: 1, anchor: 'start', at: .6 })],
          [R([[105.84, 21.0], [105.78, 20.93], [105.7, 20.88]], 'dich', .3, .3)], { lon: 105.7, lat: 20.88, text: 'Tốt Động', at: .78 },
          'Vương Thông từ Đông Quan chia quân tiến đánh nghĩa quân ở Cao Bộ. Nghĩa quân bố trí phục binh ở Tốt Động và Chúc Động.'),
        F({ name: 'NGHĨA QUÂN LAM SƠN', rows: [['Chỉ huy', 'Đinh Lễ, Nguyễn Xí'], ['Thế trận', 'Phục kích vùng đồng lầy'], ['Lực lượng', 'Ít hơn địch']] }, { name: 'NHÀ MINH', rows: [['Chỉ huy', 'Vương Thông'], ['Lực lượng', 'Khoảng # vạn quân', 10], ['Thiệt hại', 'Hơn 5 vạn tử trận (theo sử cũ)']] },
          'Theo sử cũ, quân Minh có khoảng mười vạn. Bình Ngô đại cáo viết về trận này: Ninh Kiều máu chảy thành sông, Tốt Động thây chất đầy nội.'),
        DONG({ title: 'TRẬN TỐT ĐỘNG – CHÚC ĐỘNG 1426', ours: 'Nghĩa quân Lam Sơn', enemy: 'Quân Minh', river: 'SÔNG ĐÁY', enemyCmd: 'Vương Thông', oursCmd: 'Nghĩa quân', labels: [{ x: 700, y: 540, text: 'Đồng lầy Tốt Động', style: 'warn' }],
          phases: ['Quân Minh chia đường tiến vào', 'Lọt vào vùng đồng lầy có phục binh', 'Phục binh hai cánh đổ ra đánh', 'Quân Minh tan vỡ, Vương Thông chạy về Đông Quan'],
          say: 'Quân Minh hành quân vào vùng đồng lầy Tốt Động, Chúc Động thì phục binh của nghĩa quân bất ngờ đổ ra từ hai cánh. Quân Minh bị dồn xuống bùn lầy, sông ngòi, đội hình rối loạn. Theo sử cũ, hơn năm vạn quân Minh tử trận, hơn một vạn bị bắt. Vương Thông bị thương, chạy về cố thủ thành Đông Quan.' }),
        Q('Ninh Kiều máu chảy thành sông, tanh trôi vạn dặm; Tốt Động thây chất đầy nội, nhơ để ngàn năm.', 'Nguyễn Trãi – Bình Ngô đại cáo', 'Nguyễn Trãi đã khắc họa thất bại thảm hại của quân Minh trong áng thiên cổ hùng văn Bình Ngô đại cáo.'),
        PTS(['Tiêu diệt phần lớn sinh lực địch', 'Dồn quân Minh vào thế bị vây ở Đông Quan', 'Mở đường cho chiến thắng Chi Lăng – Xương Giang'], 'Sau Tốt Động, quân Minh chỉ còn co cụm trong các thành, chờ viện binh, để rồi viện binh bị tiêu diệt ở Chi Lăng – Xương Giang năm 1427.'),
        END('Tốt Động – Chúc Động 1426')] },

    /* 26 */ { id: 'quy-nhon-1773', year: '1773', name: 'Thành Quy Nhơn 1773', who: 'Nguyễn Nhạc', vs: 'Chúa Nguyễn', seed: 66, series: TS,
      sources: ['Đại Nam thực lục', 'Hoàng Lê nhất thống chí', 'Tây Sơn thuật lược'], hook: 'MƯU NẰM CŨI LẤY THÀNH', hookQ: 'VÌ SAO NGUYỄN NHẠC TỰ NẰM TRONG CŨI ĐỂ LẤY THÀNH?',
      scenes: [
        T('QUY NHƠN', 'TÂY SƠN LẤY THÀNH QUY NHƠN NĂM 1773', 'MƯU KẾ NẰM CŨI CỦA NGUYỄN NHẠC', 'DẤY NGHIỆP', { say: 'Năm 1773, phong trào Tây Sơn từ vùng núi Tây Sơn thượng đạo tiến xuống đồng bằng, chiếm thành Quy Nhơn bằng một mưu kế táo bạo.' }),
        HERO('THÁI ĐỨC HOÀNG ĐẾ', 'Nguyễn Nhạc', '1743 – 1793', 'Anh cả trong ba anh em Tây Sơn', 'Nguyễn Nhạc cùng hai em Nguyễn Huệ, Nguyễn Lữ dấy binh năm 1771, chống sự hà khắc của quyền thần Trương Phúc Loan ở Đàng Trong.'),
        MAP('NĂM 1773', 8.6, 'Chúa Nguyễn', [], [{ lon: 108.5, lat: 14.5, z: 1.8 }, { lon: 109.0, lat: 13.9, z: 4.5 }],
          [L(108.85, 14.0, 'Tây Sơn thượng đạo', { dot: 1, anchor: 'end', at: .3 }), L(109.2, 13.78, 'Thành Quy Nhơn', { dot: 1, anchor: 'start', at: .5 })],
          [R([[108.65, 14.05], [108.9, 13.95], [109.15, 13.8]], 'ta', .35, .3)], { lon: 109.2, lat: 13.78, text: 'Quy Nhơn', at: .78 },
          'Từ vùng núi An Khê, nghĩa quân Tây Sơn tiến xuống đồng bằng, nhắm vào phủ thành Quy Nhơn.'),
        F({ name: 'TÂY SƠN', rows: [['Chỉ huy', 'Nguyễn Nhạc, Nguyễn Huệ'], ['Khẩu hiệu', 'Lấy của nhà giàu chia cho dân nghèo'], ['Mưu', 'Nằm cũi vào thành']] }, { name: 'QUÂN CHÚA NGUYỄN', rows: [['Tuần phủ', 'Nguyễn Khắc Tuyên'], ['Giữ thành', 'Phủ thành Quy Nhơn'], ['Kết cục', 'Bỏ thành chạy']] },
          'Phong trào Tây Sơn được dân nghèo hưởng ứng mạnh mẽ nhờ chủ trương lấy của nhà giàu chia cho dân nghèo.'),
        THANH({ title: 'TÂY SƠN LẤY THÀNH QUY NHƠN 1773', ours: 'Nghĩa quân Tây Sơn', enemy: 'Quân chúa Nguyễn', fort: 'Phủ thành Quy Nhơn', fall: .55, defCmd: 'Nguyễn Khắc Tuyên', atkCmd: 'Nguyễn Huệ', atk2: 'Nghĩa quân', atk3: 'Nguyễn Lữ',
          labels: [{ x: 960, y: 300, text: 'Nguyễn Nhạc nằm cũi vào thành', style: 'warn', at: .26 }],
          phases: ['Nguyễn Nhạc giả bị bắt, nằm trong cũi', 'Được đưa vào thành nộp cho quan giữ thành', 'Đêm xuống, phá cũi, mở cổng thành', 'Quân Tây Sơn ập vào, làm chủ Quy Nhơn'],
          say: 'Theo các sách sử, Nguyễn Nhạc cho người giả bắt mình bỏ vào cũi, đem nộp cho quan giữ thành. Đêm đến, ông phá cũi, cùng những người theo vào làm nội ứng, mở cổng thành. Nghĩa quân mai phục bên ngoài ập vào. Quân giữ thành tan vỡ, Tây Sơn làm chủ thành Quy Nhơn.' }),
        TL('DIỄN BIẾN', [['1771', 'Dấy binh ở Tây Sơn thượng đạo'], ['1773', 'Lấy thành Quy Nhơn'], ['1778', 'Nguyễn Nhạc lên ngôi hoàng đế']], 'Chiếm được Quy Nhơn, phong trào Tây Sơn có căn cứ vững chắc để phát triển thành một thế lực lớn.'),
        PTS(['Mưu trí táo bạo, ít tổn thất', 'Phong trào nông dân có căn cứ vững chắc', 'Mở đầu sự nghiệp của nhà Tây Sơn'], 'Vùng Quy Nhơn sau này là nơi Nguyễn Nhạc xây thành Hoàng Đế trên nền thành Đồ Bàn cũ, trung tâm của phong trào Tây Sơn.'),
        END('Quy Nhơn 1773 · Nguyễn Nhạc')] },

    /* 27 */ { id: 'phu-xuan-1786', year: '1786', name: 'Phú Xuân 1786', who: 'Nguyễn Huệ', vs: 'quân Trịnh', seed: 67, series: TS,
      sources: ['Hoàng Lê nhất thống chí', 'Đại Nam thực lục', 'Khâm định Việt sử thông giám cương mục'], hook: 'NƯỚC SÔNG HƯƠNG DÂNG CAO', hookQ: 'TÂY SƠN LẤY THÀNH PHÚ XUÂN NHƯ THẾ NÀO?',
      scenes: [
        T('PHÚ XUÂN', 'TÂY SƠN LẤY THÀNH PHÚ XUÂN NĂM 1786', 'NGUYỄN HUỆ TIẾN RA BẮC', 'THẦN TỐC', { ships: 6, say: 'Mùa hè năm 1786, Nguyễn Huệ đem thủy bộ ra đánh thành Phú Xuân, khi ấy do quân Trịnh chiếm giữ.' }),
        HERO('BẮC BÌNH VƯƠNG', 'Nguyễn Huệ', '1753 – 1792', 'Danh tướng Tây Sơn', 'Nguyễn Huệ là thiên tài quân sự của phong trào Tây Sơn, nổi tiếng với lối đánh thần tốc, bất ngờ.'),
        MAP('THÁNG 6.1786', 8.6, 'Quân Trịnh', [], [{ lon: 108, lat: 15.5, z: 1.6 }, { lon: 107.55, lat: 16.45, z: 4.5 }],
          [L(109.2, 13.78, 'Quy Nhơn', { dot: 1, anchor: 'start', at: .2 }), L(107.58, 16.46, 'Phú Xuân', { dot: 1, anchor: 'end', at: .5 })],
          [R([[109.3, 13.8], [109.2, 15], [108.5, 15.9], [107.65, 16.45]], 'ta', .25, .4)], { lon: 107.58, lat: 16.46, text: 'Thành Phú Xuân', at: .78 },
          'Quân Tây Sơn từ Quy Nhơn theo đường thủy, đường bộ tiến ra, nhắm vào thành Phú Xuân bên bờ sông Hương.'),
        F({ name: 'TÂY SƠN', rows: [['Chỉ huy', 'Nguyễn Huệ'], ['Phó tướng', 'Vũ Văn Nhậm'], ['Lực lượng', 'Thủy bộ phối hợp']] }, { name: 'QUÂN TRỊNH', rows: [['Trấn thủ', 'Phạm Ngô Cầu'], ['Phó tướng', 'Hoàng Đình Thể'], ['Kết cục', 'Thành Phú Xuân thất thủ']] },
          'Quân Trịnh chiếm giữ Phú Xuân từ năm 1775, nhưng nội bộ chia rẽ, tướng sĩ chán nản.'),
        THANH({ title: 'TÂY SƠN LẤY THÀNH PHÚ XUÂN 1786', ours: 'Quân Tây Sơn', enemy: 'Quân Trịnh', fort: 'Thành Phú Xuân', fall: .62, defCmd: 'Phạm Ngô Cầu', atkCmd: 'Nguyễn Huệ', atk2: 'Vũ Văn Nhậm', atk3: 'Bộ binh', river: 'SÔNG HƯƠNG', ships: 'Thủy quân Tây Sơn',
          phases: ['Thủy quân tiến vào cửa Thuận An', 'Gặp mưa lớn, nước sông Hương dâng cao', 'Chiến thuyền áp sát chân thành mà đánh', 'Thành vỡ, Tây Sơn làm chủ Phú Xuân'],
          say: 'Quân Tây Sơn tiến vào cửa Thuận An. Theo sử cũ, gặp lúc mưa to, nước sông Hương dâng cao, chiến thuyền áp sát được chân thành. Phó tướng Hoàng Đình Thể ra đánh và tử trận, Phạm Ngô Cầu phải đầu hàng. Chỉ trong thời gian ngắn, Tây Sơn làm chủ thành Phú Xuân và toàn bộ vùng Thuận Hóa.' }),
        TL('DIỄN BIẾN', [['1775', 'Quân Trịnh chiếm Phú Xuân'], ['06.1786', 'Tây Sơn lấy lại Phú Xuân'], ['07.1786', 'Tiến ra Thăng Long']], 'Ngay sau khi lấy Phú Xuân, Nguyễn Huệ quyết định tiến thẳng ra Bắc với danh nghĩa phù Lê diệt Trịnh.'),
        PTS(['Chấm dứt sự chiếm đóng của quân Trịnh ở Thuận Hóa', 'Phối hợp thủy bộ, chớp thời cơ thời tiết', 'Mở đường tiến ra Bắc'], 'Phú Xuân sau này trở thành kinh đô của vua Quang Trung, trung tâm của vương triều Tây Sơn.'),
        END('Phú Xuân 1786 · Nguyễn Huệ')] },

    /* 28 */ { id: 'thang-long-1786', year: '1786', name: 'Thăng Long 1786', who: 'Nguyễn Huệ', vs: 'quân Trịnh', seed: 68, series: TS,
      sources: ['Hoàng Lê nhất thống chí', 'Khâm định Việt sử thông giám cương mục'], hook: 'CHẤM DỨT 200 NĂM HỌ TRỊNH', hookQ: 'VÌ SAO HỌ TRỊNH SỤP ĐỔ CHỈ TRONG MỘT MÙA HÈ?',
      scenes: [
        T('THĂNG LONG', 'TÂY SƠN RA BẮC NĂM 1786', 'PHÙ LÊ DIỆT TRỊNH', 'CHẤM DỨT HỌ TRỊNH', { ships: 7, say: 'Mùa hè năm 1786, đoàn quân Tây Sơn của Nguyễn Huệ tiến ra Bắc, chấm dứt hơn hai trăm năm cát cứ của họ Trịnh.' }),
        HERO('BẮC BÌNH VƯƠNG', 'Nguyễn Huệ', '1753 – 1792', 'Chỉ huy quân Tây Sơn ra Bắc', 'Nghe lời khuyên của Nguyễn Hữu Chỉnh, Nguyễn Huệ quyết định tiến ra Bắc với danh nghĩa phù Lê diệt Trịnh.'),
        MAP('THÁNG 7.1786', 8.6, 'Quân Trịnh', [], [{ lon: 106.5, lat: 18.5, z: 1.3 }, { lon: 105.9, lat: 21.0, z: 4.5 }],
          [L(107.58, 16.46, 'Phú Xuân', { dot: 1, anchor: 'start', at: .15 }), L(105.85, 21.03, 'Thăng Long', { dot: 1, anchor: 'end', at: .55 }), L(105.95, 20.4, 'Vị Hoàng', { dot: 1, anchor: 'start', at: .4 })],
          [R([[107.7, 16.6], [107, 17.8], [106.3, 19.4], [106.05, 20.35], [105.9, 21.0]], 'ta', .2, .45)], { lon: 105.85, lat: 21.03, text: 'Thăng Long', at: .8 },
          'Quân Tây Sơn theo đường biển ra Bắc, đánh chiếm kho lương Vị Hoàng ở Sơn Nam rồi tiến thẳng về Thăng Long.'),
        F({ name: 'TÂY SƠN', rows: [['Chỉ huy', 'Nguyễn Huệ'], ['Tiên phong', 'Nguyễn Hữu Chỉnh'], ['Cách đánh', 'Thần tốc, thủy bộ']] }, { name: 'QUÂN TRỊNH', rows: [['Chúa', 'Trịnh Khải'], ['Tình trạng', 'Kiêu binh lộng hành, rối ren'], ['Kết cục', 'Tan rã nhanh chóng']] },
          'Quân Trịnh khi ấy suy yếu, kiêu binh lộng hành, triều chính rối ren, lòng người không theo.'),
        SONG({ title: 'TÂY SƠN RA BẮC 1786', ours: 'Quân Tây Sơn', enemy: 'Quân Trịnh', river: 'SÔNG HỒNG', enemyCmd: 'Thủy quân Trịnh', oursCmd: 'Nguyễn Huệ', lure: 'Tiên phong Nguyễn Hữu Chỉnh',
          phases: ['Thủy quân Tây Sơn ngược sông tiến lên', 'Quân Trịnh dàn trận chặn đánh', 'Tây Sơn đánh mạnh, quân Trịnh tan vỡ', 'Vào Thăng Long, Trịnh Khải tự vẫn'],
          say: 'Thủy quân Tây Sơn ngược dòng sông Hồng tiến lên. Quân Trịnh dàn thủy quân chặn đánh nhưng nhanh chóng tan vỡ. Trịnh Khải chạy lên Sơn Tây, bị bắt và tự vẫn. Nguyễn Huệ vào Thăng Long, yết kiến vua Lê Hiển Tông, chấm dứt hơn hai trăm năm cát cứ của họ Trịnh.' }),
        TL('DIỄN BIẾN', [['06.1786', 'Lấy thành Phú Xuân'], ['07.1786', 'Vào Thăng Long'], ['1786', 'Vua Lê gả công chúa Ngọc Hân']], 'Vua Lê Hiển Tông gả công chúa Lê Ngọc Hân cho Nguyễn Huệ, mối lương duyên đi vào văn học và lịch sử.'),
        PTS(['Chấm dứt thời kỳ cát cứ của họ Trịnh', 'Xóa bỏ ranh giới sông Gianh chia cắt đất nước', 'Bước đầu thống nhất đất nước'], 'Cuộc tiến quân ra Bắc năm 1786 xóa bỏ ranh giới sông Gianh đã chia cắt đất nước hơn một trăm năm mươi năm.'),
        END('Thăng Long 1786 · Nguyễn Huệ')] },

    /* 29 */ { id: 'da-nang-1858', year: '1858', name: 'Đà Nẵng 1858', who: 'Nguyễn Tri Phương', vs: 'Pháp – Tây Ban Nha', seed: 69, series: PHAP,
      sources: ['Đại Nam thực lục', 'Việt Nam sử lược', 'Lịch sử Việt Nam – NXB Khoa học xã hội'], hook: 'CẦM CHÂN LIÊN QUÂN Ở BÁN ĐẢO SƠN TRÀ', hookQ: 'VÌ SAO LIÊN QUÂN PHÁP KHÔNG TIẾN NỔI KHỎI ĐÀ NẴNG?',
      scenes: [
        T('ĐÀ NẴNG', 'KHÁNG CHIẾN Ở ĐÀ NẴNG 1858 – 1859', 'NGUYỄN TRI PHƯƠNG CẦM CHÂN LIÊN QUÂN', 'MỞ ĐẦU CHỐNG PHÁP', { ships: 6, say: 'Ngày 1 tháng 9 năm 1858, liên quân Pháp và Tây Ban Nha nổ súng tấn công Đà Nẵng, mở đầu cuộc xâm lược Việt Nam.' }),
        HERO('TỔNG THỐNG QUÂN VỤ', 'Nguyễn Tri Phương', '1800 – 1873', 'Chỉ huy mặt trận Đà Nẵng', 'Triều đình Huế cử Nguyễn Tri Phương vào chỉ huy mặt trận Đà Nẵng, chặn bước tiến của liên quân.'),
        MAP('01.09.1858', 8.6, 'Liên quân Pháp – Tây Ban Nha', [], [{ lon: 109, lat: 15.5, z: 1.4 }, { lon: 108.2, lat: 16.08, z: 4.8 }],
          [L(111, 14, 'HẠM ĐỘI LIÊN QUÂN', { style: 'enemy', at: .05 }), L(108.22, 16.07, 'Đà Nẵng', { dot: 1, anchor: 'end', at: .4 }), L(108.27, 16.12, 'Bán đảo Sơn Trà', { dot: 1, anchor: 'start', at: .55 }), L(107.58, 16.46, 'Huế', { dot: 1, anchor: 'end', at: .5 })],
          [R([[111, 15.2], [109.5, 15.9], [108.35, 16.1]], 'dich', .15, .35)], { lon: 108.22, lat: 16.07, text: 'Cửa biển Đà Nẵng', at: .78 },
          'Liên quân định đánh nhanh chiếm Đà Nẵng làm bàn đạp, rồi tiến ra kinh thành Huế.'),
        F({ name: 'TRIỀU NGUYỄN', rows: [['Chỉ huy', 'Nguyễn Tri Phương'], ['Cách đánh', 'Đắp lũy, vườn không nhà trống'], ['Lực lượng', 'Quân triều đình và dân binh']] }, { name: 'LIÊN QUÂN', rows: [['Chỉ huy', 'Rigault de Genouilly'], ['Lực lượng', 'Khoảng # nghìn quân', 3], ['Tàu chiến', 'Hơn 10 chiến hạm']] },
          'Liên quân có khoảng ba nghìn quân và hơn mười chiến hạm, vũ khí hiện đại hơn hẳn.'),
        TAU({ title: 'MẶT TRẬN ĐÀ NẴNG 1858 – 1859', ours: 'Quân dân Đà Nẵng', enemy: 'Liên quân Pháp – Tây Ban Nha', river: 'VỊNH ĐÀ NẴNG', enemyCmd: 'Hạm đội liên quân', oursCmd: 'Dân binh', shore: 'Lũy Liên Trì',
          forts: [{ x: 1180, y: 300, label: 'Đồn An Hải', fall: .3 }, { x: 760, y: 880, label: 'Lũy Nguyễn Tri Phương' }],
          phases: ['Hạm đội bắn phá, đổ bộ bán đảo Sơn Trà', 'Nguyễn Tri Phương đắp lũy dài chặn đường', 'Vườn không nhà trống, quấy rối ngày đêm', 'Liên quân sa lầy, phải chuyển hướng vào Gia Định'],
          say: 'Liên quân bắn phá, chiếm bán đảo Sơn Trà. Nguyễn Tri Phương cho đắp lũy dài, đặt đồn chặn đường tiến công, thực hiện vườn không nhà trống. Quân dân Đà Nẵng ngày đêm quấy rối, khiến liên quân bị cầm chân suốt nhiều tháng, bệnh tật hoành hành. Kế hoạch đánh nhanh thắng nhanh thất bại, đầu năm 1859 địch phải chuyển hướng vào Gia Định.' }),
        TL('DIỄN BIẾN', [['01.09.1858', 'Liên quân nổ súng ở Đà Nẵng'], ['1858', 'Bị cầm chân ở Sơn Trà'], ['02.1859', 'Chuyển hướng vào Gia Định']], 'Sau năm tháng sa lầy ở Đà Nẵng, liên quân phải thay đổi kế hoạch, đánh vào Gia Định.'),
        PTS(['Làm thất bại kế hoạch đánh nhanh thắng nhanh', 'Tinh thần chống ngoại xâm của nhân dân', 'Mở đầu gần 100 năm chống Pháp'], 'Mặt trận Đà Nẵng mở đầu cho cuộc đấu tranh chống thực dân Pháp kéo dài gần một thế kỷ của dân tộc.'),
        END('Đà Nẵng 1858 · Nguyễn Tri Phương')] },

    /* 30 */ { id: 'ky-hoa-1861', year: '1861', name: 'Đại đồn Chí Hòa 1861', who: 'Nguyễn Tri Phương', vs: 'Pháp', seed: 70, series: PHAP,
      sources: ['Đại Nam thực lục', 'Việt Nam sử lược'], hook: 'ĐẠI ĐỒN CHÍ HÒA KIÊN CƯỜNG', hookQ: 'ĐẠI ĐỒN NÀO CẦM CỰ HAI NGÀY TRƯỚC PHÁO PHÁP?',
      scenes: [
        T('CHÍ HÒA', 'TRẬN ĐẠI ĐỒN CHÍ HÒA NĂM 1861', 'BẢO VỆ GIA ĐỊNH', 'BI TRÁNG', { say: 'Tháng 2 năm 1861, quân Pháp tấn công Đại đồn Chí Hòa, phòng tuyến lớn nhất của triều Nguyễn ở Gia Định.' }),
        HERO('TỔNG THỐNG QUÂN VỤ', 'Nguyễn Tri Phương', '1800 – 1873', 'Chỉ huy Đại đồn Chí Hòa', 'Từ Đà Nẵng, Nguyễn Tri Phương được điều vào Gia Định, xây dựng Đại đồn Chí Hòa làm phòng tuyến chống giặc.'),
        MAP('THÁNG 2.1861', 8.6, 'Quân Pháp', [], [{ lon: 106.8, lat: 11, z: 1.8 }, { lon: 106.66, lat: 10.78, z: 5 }],
          [L(108.5, 9.5, 'HẠM ĐỘI PHÁP', { style: 'enemy', at: .05 }), L(106.66, 10.78, 'Đại đồn Chí Hòa', { dot: 1, anchor: 'end', at: .45 }), L(106.7, 10.77, 'Thành Gia Định', { dot: 1, anchor: 'start', at: .35 })],
          [R([[107.1, 10.3], [106.85, 10.6], [106.68, 10.77]], 'dich', .2, .35)], { lon: 106.66, lat: 10.78, text: 'Chí Hòa', at: .78 },
          'Đại đồn Chí Hòa nằm ở vùng Kỳ Hòa, phía tây bắc thành Gia Định, dài nhiều cây số, có hào, lũy và chông.'),
        F({ name: 'TRIỀU NGUYỄN', rows: [['Chỉ huy', 'Nguyễn Tri Phương'], ['Phòng tuyến', 'Đại đồn dài, nhiều lớp hào lũy'], ['Lực lượng', 'Hàng vạn quân, vũ khí thô sơ']] }, { name: 'QUÂN PHÁP', rows: [['Chỉ huy', 'Charner'], ['Vũ khí', 'Đại bác, súng trường hiện đại'], ['Kết cục', 'Chiếm đại đồn sau 2 ngày']] },
          'Quân Pháp được tăng viện từ chiến trường Trung Quốc, có đại bác và súng trường vượt trội.'),
        THANH({ title: 'TRẬN ĐẠI ĐỒN CHÍ HÒA 1861', ours: 'Quân triều Nguyễn', enemy: 'Quân Pháp', fortSide: 'ta', fort: 'Đại đồn Chí Hòa', fall: .74, defCmd: 'Nguyễn Tri Phương', atkCmd: 'Quân Pháp', atk2: 'Pháo binh Pháp', atk3: 'Bộ binh Pháp',
          phases: ['Pháo binh Pháp bắn phá dữ dội', 'Quân giữ đồn chống trả quyết liệt', 'Nguyễn Duy tử trận, Nguyễn Tri Phương bị thương', 'Đại đồn thất thủ sau hai ngày chiến đấu'],
          say: 'Quân Pháp dùng đại bác bắn phá rồi xung phong. Quân giữ đồn chống trả quyết liệt suốt hai ngày. Em trai Nguyễn Tri Phương là Nguyễn Duy tử trận, bản thân ông bị thương. Trước hỏa lực vượt trội, Đại đồn Chí Hòa thất thủ, quân Pháp mở rộng đánh chiếm các tỉnh miền Đông Nam Kỳ.' }),
        TL('DIỄN BIẾN', [['1859', 'Pháp chiếm thành Gia Định'], ['24 – 25.02.1861', 'Trận Đại đồn Chí Hòa'], ['1862', 'Pháp chiếm ba tỉnh miền Đông']], 'Sau trận Chí Hòa, triều đình Huế ký Hòa ước Nhâm Tuất năm 1862, cắt ba tỉnh miền Đông cho Pháp.'),
        PTS(['Tinh thần chiến đấu kiên cường', 'Bài học về sự chênh lệch vũ khí, chiến lược phòng thủ thụ động', 'Phong trào kháng chiến của nhân dân lan rộng'], 'Dù đại đồn thất thủ, phong trào kháng chiến của nhân dân Nam Kỳ bùng lên mạnh mẽ, với những tên tuổi như Trương Định, Nguyễn Trung Trực.'),
        END('Đại đồn Chí Hòa 1861 · Nguyễn Tri Phương')] },

    /* 31 */ { id: 'nhat-tao-1861', year: '1861', name: 'Nhật Tảo 1861', who: 'Nguyễn Trung Trực', vs: 'Pháp', seed: 71, series: PHAP,
      sources: ['Đại Nam thực lục', 'Việt Nam sử lược', 'Tài liệu tàu Espérance'], hook: 'LỬA BỪNG TRÊN SÔNG NHẬT TẢO', hookQ: 'AI ĐÃ ĐỐT CHÁY TÀU CHIẾN PHÁP TRÊN SÔNG NHẬT TẢO?',
      scenes: [
        T('NHẬT TẢO', 'TRẬN ĐỐT TÀU TRÊN SÔNG NHẬT TẢO', 'NGÀY 10 THÁNG 12 NĂM 1861', 'LỬA BỪNG VÀM NHẬT TẢO', { ships: 3, say: 'Ngày 10 tháng 12 năm 1861, trên vàm Nhật Tảo, nghĩa quân của Nguyễn Trung Trực đã đốt cháy chiếc tàu chiến Pháp mang tên Hy Vọng.' }),
        HERO('ANH HÙNG KHÁNG PHÁP', 'Nguyễn Trung Trực', '1838 – 1868', 'Quản cơ, thủ lĩnh nghĩa quân', 'Nguyễn Trung Trực vốn là người làm nghề chài lưới ở Long An, đứng lên chiêu mộ nghĩa quân chống Pháp.'),
        MAP('10.12.1861', 8.6, 'Quân Pháp', [], [{ lon: 106.5, lat: 10.6, z: 2 }, { lon: 106.45, lat: 10.5, z: 6 }],
          [L(106.66, 10.78, 'Sài Gòn', { dot: 1, anchor: 'start', at: .3 }), L(106.42, 10.52, 'Vàm Nhật Tảo', { dot: 1, anchor: 'end', at: .5 })],
          [R([[106.7, 10.76], [106.55, 10.6], [106.43, 10.52]], 'dich', .2, .3)], { lon: 106.42, lat: 10.52, text: 'Nhật Tảo', at: .78 },
          'Tàu Hy Vọng, tiếng Pháp là Espérance, đậu ở vàm Nhật Tảo, thuộc Long An ngày nay, làm nhiệm vụ canh giữ đường sông.'),
        F({ name: 'NGHĨA QUÂN', rows: [['Chỉ huy', 'Nguyễn Trung Trực'], ['Lực lượng', 'Khoảng # nghĩa quân', 150], ['Vũ khí', 'Giáo mác, lửa, thuyền nhỏ']] }, { name: 'QUÂN PHÁP', rows: [['Mục tiêu', 'Tàu Hy Vọng'], ['Lính trên tàu', 'Lính Pháp và lính đánh thuê'], ['Kết cục', 'Tàu bị đốt cháy']] },
          'Nghĩa quân chỉ có giáo mác và lửa, nhưng có lòng gan dạ và sự bất ngờ.'),
        TAU({ title: 'TRẬN ĐỐT TÀU HY VỌNG 1861', ours: 'Nghĩa quân Nguyễn Trung Trực', enemy: 'Quân Pháp', river: 'VÀM NHẬT TẢO', enemyCmd: 'Tàu Hy Vọng', enemyN: 1, oursCmd: 'Nguyễn Trung Trực', shore: 'Nghĩa quân mai phục', burn: .62, sink: .86,
          phases: ['Tàu Pháp đậu canh giữ vàm sông', 'Nghĩa quân cải trang, chèo thuyền áp sát', 'Bất ngờ nhảy lên tàu, giao chiến', 'Phóng hỏa, tàu Hy Vọng chìm trong biển lửa'],
          say: 'Nghĩa quân chia thành nhiều toán, đi thuyền nhỏ áp sát tàu Hy Vọng. Khi tới gần, họ bất ngờ nhảy lên tàu đánh giáp lá cà. Sau một hồi chiến đấu, nghĩa quân phóng hỏa đốt tàu. Chiếc tàu chiến bốc cháy dữ dội rồi chìm, phần lớn lính trên tàu bị tiêu diệt. Tiếng vang của trận đánh khiến quân Pháp bàng hoàng.' }),
        Q('Bao giờ người Tây nhổ hết cỏ nước Nam thì mới hết người Nam đánh Tây.', 'Nguyễn Trung Trực – trước khi hy sinh năm 1868', 'Năm 1868, sau khi đánh chiếm đồn Kiên Giang, Nguyễn Trung Trực bị bắt. Trước khi hy sinh, ông khẳng khái để lại câu nói bất hủ này.'),
        PTS(['Lấy vũ khí thô sơ thắng tàu chiến hiện đại', 'Cổ vũ phong trào kháng chiến Nam Kỳ', 'Hỏa hồng Nhật Tảo đi vào thơ ca'], 'Nhà thơ Huỳnh Mẫn Đạt đã ca ngợi chiến công này bằng câu: Hỏa hồng Nhật Tảo oanh thiên địa, kiếm bạt Kiên Giang khấp quỷ thần.'),
        END('Nhật Tảo 1861 · Nguyễn Trung Trực')] },

    /* 32 */ { id: 'ha-noi-1873', year: '1873', name: 'Thành Hà Nội 1873', who: 'Nguyễn Tri Phương', vs: 'Pháp', seed: 72, series: PHAP,
      sources: ['Đại Nam thực lục', 'Việt Nam sử lược'], hook: 'KHÍ TIẾT NGUYỄN TRI PHƯƠNG', hookQ: 'VÌ SAO NGUYỄN TRI PHƯƠNG KHÔNG CHỊU ĐỂ PHÁP CHỮA THƯƠNG?',
      scenes: [
        T('HÀ NỘI 1873', 'PHÁP ĐÁNH THÀNH HÀ NỘI LẦN THỨ NHẤT', 'NGUYỄN TRI PHƯƠNG GIỮ THÀNH', 'KHÍ TIẾT', { size: 150, say: 'Ngày 20 tháng 11 năm 1873, quân Pháp do Francis Garnier chỉ huy nổ súng đánh thành Hà Nội, mở đầu cuộc xâm lược Bắc Kỳ lần thứ nhất.' }),
        HERO('KHÂM SAI ĐẠI THẦN', 'Nguyễn Tri Phương', '1800 – 1873', 'Trấn giữ thành Hà Nội', 'Khi ấy đã hơn bảy mươi tuổi, Nguyễn Tri Phương được cử ra Bắc giữ thành Hà Nội.'),
        MAP('20.11.1873', 8.6, 'Quân Pháp', [], [{ lon: 106.5, lat: 20.8, z: 2 }, { lon: 105.85, lat: 21.03, z: 6 }],
          [L(107.8, 20.2, 'TÀU CHIẾN PHÁP', { style: 'enemy', at: .05 }), L(105.84, 21.035, 'Thành Hà Nội', { dot: 1, anchor: 'end', at: .45 })],
          [R([[106.7, 20.6], [106.2, 20.85], [105.88, 21.02]], 'dich', .2, .35)], { lon: 105.84, lat: 21.035, text: 'Hà Nội', at: .78 },
          'Lấy cớ giải quyết vụ Jean Dupuis, Garnier đem quân ra Bắc rồi bất ngờ nổ súng đánh thành.'),
        F({ name: 'TRIỀU NGUYỄN', rows: [['Chỉ huy', 'Nguyễn Tri Phương'], ['Cùng giữ thành', 'Con trai Nguyễn Lâm'], ['Lực lượng', 'Khoảng # nghìn quân', 7]] }, { name: 'QUÂN PHÁP', rows: [['Chỉ huy', 'Francis Garnier'], ['Lực lượng', 'Hơn 200 quân, tàu chiến'], ['Vũ khí', 'Đại bác, súng trường']] },
          'Quân Pháp ít nhưng có tàu chiến và đại bác. Quân giữ thành đông hơn nhưng vũ khí lạc hậu.'),
        THANH({ title: 'THÀNH HÀ NỘI 20.11.1873', ours: 'Quân triều Nguyễn', enemy: 'Quân Pháp', fortSide: 'ta', fort: 'Thành Hà Nội', fall: .5, defCmd: 'Nguyễn Tri Phương', atkCmd: 'Garnier', atk2: 'Pháo từ tàu chiến', atk3: 'Lính Pháp', river: 'SÔNG HỒNG', ships: 'Tàu chiến Pháp',
          phases: ['Tàu chiến Pháp nã pháo vào thành', 'Lính Pháp xông vào cửa Nam', 'Nguyễn Lâm tử trận, Nguyễn Tri Phương trọng thương', 'Thành thất thủ, Nguyễn Tri Phương tuyệt thực mà mất'],
          say: 'Sáng sớm, tàu chiến Pháp nã pháo vào thành, lính Pháp xông vào cửa Nam. Quân giữ thành chống trả nhưng không cầm cự được lâu. Con trai Nguyễn Tri Phương là Nguyễn Lâm tử trận. Ông bị thương nặng, bị bắt. Giặc đưa thuốc chữa, ông kiên quyết từ chối, nhịn ăn cho đến chết.' }),
        TL('DIỄN BIẾN', [['20.11.1873', 'Pháp đánh thành Hà Nội'], ['12.1873', 'Nguyễn Tri Phương tuyệt thực mà mất'], ['21.12.1873', 'Garnier tử trận ở Cầu Giấy']], 'Khi bị bắt, Nguyễn Tri Phương khẳng khái khước từ mọi sự cứu chữa của kẻ thù, giữ trọn khí tiết của một vị lão tướng.'),
        PTS(['Tấm gương khí tiết của vị lão tướng', 'Khởi đầu cuộc xâm lược Bắc Kỳ lần thứ nhất', 'Nhân dân tiếp tục đứng lên kháng chiến'], 'Chỉ một tháng sau, quân dân ta phục kích ở Cầu Giấy, tiêu diệt Garnier, buộc Pháp phải trả lại các thành đã chiếm.'),
        END('Hà Nội 1873 · Nguyễn Tri Phương')] },

    /* 33 */ { id: 'cau-giay-1873', year: '1873', name: 'Cầu Giấy 1873', who: 'Hoàng Kế Viêm', vs: 'Pháp', seed: 73, series: PHAP,
      sources: ['Đại Nam thực lục', 'Việt Nam sử lược'], hook: 'GARNIER BỎ MẠNG Ở CẦU GIẤY', hookQ: 'TRẬN PHỤC KÍCH NÀO KHIẾN QUÂN PHÁP HOẢNG LOẠN NĂM 1873?',
      scenes: [
        T('CẦU GIẤY', 'TRẬN CẦU GIẤY LẦN THỨ NHẤT', 'NGÀY 21 THÁNG 12 NĂM 1873', 'GARNIER TỬ TRẬN', { say: 'Ngày 21 tháng 12 năm 1873, quân ta phục kích ở Cầu Giấy, phía tây thành Hà Nội, tiêu diệt Francis Garnier.' }),
        HERO('THỐNG ĐỐC QUÂN VỤ', 'Hoàng Kế Viêm', '1820 – 1909', 'Chỉ huy quân triều đình ở Bắc Kỳ', 'Hoàng Kế Viêm phối hợp với quân Cờ Đen của Lưu Vĩnh Phúc, bày trận phục kích quân Pháp ở Cầu Giấy.'),
        MAP('21.12.1873', 8.6, 'Quân Pháp', [], [{ lon: 105.9, lat: 21.0, z: 4 }, { lon: 105.8, lat: 21.035, z: 7 }],
          [L(105.84, 21.035, 'Thành Hà Nội', { dot: 1, anchor: 'start', at: .3 }), L(105.79, 21.035, 'Cầu Giấy', { dot: 1, anchor: 'end', at: .5 })],
          [R([[105.84, 21.035], [105.8, 21.035]], 'dich', .45, .25)], { lon: 105.79, lat: 21.035, text: 'Cầu Giấy', at: .78 },
          'Cầu Giấy bắc qua sông Tô Lịch, nằm trên đường từ thành Hà Nội đi Sơn Tây.'),
        F({ name: 'QUÂN TA', rows: [['Chỉ huy', 'Hoàng Kế Viêm'], ['Phối hợp', 'Quân Cờ Đen – Lưu Vĩnh Phúc'], ['Thế trận', 'Phục kích hai bên đường']] }, { name: 'QUÂN PHÁP', rows: [['Chỉ huy', 'Francis Garnier'], ['Lực lượng', 'Một toán lính truy kích'], ['Kết cục', 'Garnier tử trận']] },
          'Quân ta dùng mưu khiêu chiến để nhử Garnier ra khỏi thành.'),
        DONG({ title: 'TRẬN CẦU GIẤY 1873', ours: 'Quân ta', enemy: 'Quân Pháp', river: 'SÔNG TÔ LỊCH', bridge: { at: [1230, 540, 1410, 540], fall: 2 }, enemyCmd: 'Garnier', oursCmd: 'Quân phục kích',
          labels: [{ x: 1320, y: 470, text: 'CẦU GIẤY', style: 'warn' }, { x: 1700, y: 960, text: '▶ Thành Hà Nội', style: '' }],
          phases: ['Quân ta khiêu chiến gần thành', 'Garnier đem quân đuổi theo ra Cầu Giấy', 'Phục binh hai bên đường đổ ra', 'Garnier tử trận, quân Pháp tháo chạy về thành'],
          say: 'Quân ta kéo đến gần thành khiêu chiến rồi giả vờ rút lui. Garnier đem quân đuổi theo ra tới Cầu Giấy thì lọt vào trận phục kích. Quân ta từ hai bên đường đổ ra đánh. Garnier và nhiều sĩ quan, binh lính Pháp tử trận, số còn lại hoảng loạn tháo chạy về thành.' }),
        TL('DIỄN BIẾN', [['20.11.1873', 'Pháp đánh thành Hà Nội'], ['21.12.1873', 'Garnier tử trận ở Cầu Giấy'], ['1874', 'Pháp trả lại các thành ở Bắc Kỳ']], 'Sau chiến thắng, thay vì thừa thắng xông lên, triều đình lại ký Hòa ước Giáp Tuất 1874, nhân dân vô cùng bất bình.'),
        PTS(['Tiêu diệt chỉ huy đạo quân xâm lược', 'Khiến quân Pháp hoang mang, lo sợ', 'Nhân dân càng hăng hái kháng chiến'], 'Chiến thắng Cầu Giấy lần thứ nhất cho thấy quân Pháp không phải là không thể đánh bại.'),
        END('Cầu Giấy 1873 · Hoàng Kế Viêm')] },

    /* 34 */ { id: 'ha-noi-1882', year: '1882', name: 'Thành Hà Nội 1882', who: 'Hoàng Diệu', vs: 'Pháp', seed: 74, series: PHAP,
      sources: ['Đại Nam thực lục', 'Việt Nam sử lược'], hook: 'THÀNH MẤT, NGƯỜI KHÔNG HÀNG', hookQ: 'VỊ TỔNG ĐỐC NÀO TUẪN TIẾT CÙNG THÀNH HÀ NỘI?',
      scenes: [
        T('HÀ NỘI 1882', 'PHÁP ĐÁNH THÀNH HÀ NỘI LẦN THỨ HAI', 'TỔNG ĐỐC HOÀNG DIỆU GIỮ THÀNH', 'TUẪN TIẾT', { size: 150, say: 'Ngày 25 tháng 4 năm 1882, quân Pháp do Henri Rivière chỉ huy đánh thành Hà Nội lần thứ hai.' }),
        HERO('TỔNG ĐỐC HÀ NINH', 'Hoàng Diệu', '1829 – 1882', 'Trấn giữ thành Hà Nội', 'Hoàng Diệu là Tổng đốc Hà Ninh. Biết giặc sắp đánh, ông ra sức củng cố thành trì, kiên quyết không nộp thành.'),
        MAP('25.04.1882', 8.6, 'Quân Pháp', [], [{ lon: 106.5, lat: 20.8, z: 2 }, { lon: 105.85, lat: 21.03, z: 6 }],
          [L(107.8, 20.2, 'TÀU CHIẾN PHÁP', { style: 'enemy', at: .05 }), L(105.84, 21.035, 'Thành Hà Nội', { dot: 1, anchor: 'end', at: .45 })],
          [R([[106.7, 20.6], [106.2, 20.85], [105.88, 21.02]], 'dich', .2, .35)], { lon: 105.84, lat: 21.035, text: 'Hà Nội', at: .78 },
          'Rivière gửi tối hậu thư đòi nộp thành. Không đợi trả lời, quân Pháp nổ súng tấn công.'),
        F({ name: 'TRIỀU NGUYỄN', rows: [['Chỉ huy', 'Hoàng Diệu'], ['Tinh thần', 'Quyết giữ thành đến cùng'], ['Khó khăn', 'Kho thuốc súng bị nổ']] }, { name: 'QUÂN PHÁP', rows: [['Chỉ huy', 'Henri Rivière'], ['Lực lượng', 'Lính thủy đánh bộ, tàu chiến'], ['Kết cục', 'Chiếm thành Hà Nội']] },
          'Trận đánh đang diễn ra thì kho thuốc súng trong thành bị nổ, quân giữ thành hoảng loạn.'),
        THANH({ title: 'THÀNH HÀ NỘI 25.04.1882', ours: 'Quân triều Nguyễn', enemy: 'Quân Pháp', fortSide: 'ta', fort: 'Thành Hà Nội', fall: .6, defCmd: 'Hoàng Diệu', atkCmd: 'Rivière', atk2: 'Pháo tàu chiến', atk3: 'Lính Pháp', river: 'SÔNG HỒNG', ships: 'Tàu chiến Pháp',
          phases: ['Tàu chiến Pháp nã pháo vào thành', 'Hoàng Diệu trực tiếp chỉ huy chống trả', 'Kho thuốc súng bốc cháy, quân hỗn loạn', 'Thành mất, Hoàng Diệu tuẫn tiết'],
          say: 'Tàu chiến Pháp nã pháo, lính Pháp xông vào. Hoàng Diệu trực tiếp chỉ huy quân sĩ chống trả từ sáng đến trưa. Bất ngờ kho thuốc súng nổ, quân giữ thành hỗn loạn. Biết không thể giữ thành, Hoàng Diệu viết tờ di biểu gửi vua rồi tuẫn tiết, quyết không để rơi vào tay giặc.' }),
        Q('Thành mất không cứu được, thực có phụ lòng ủy thác của triều đình.', 'Hoàng Diệu – trích Di biểu gửi vua Tự Đức (bản dịch)', 'Trong tờ di biểu, Hoàng Diệu nhận lỗi không giữ được thành, nhưng tấm lòng trung nghĩa của ông khiến người đời kính phục.'),
        PTS(['Tấm gương trung nghĩa, tuẫn tiết cùng thành', 'Pháp mở rộng xâm lược Bắc Kỳ', 'Tên ông được đặt cho nhiều con đường'], 'Ngày nay, con đường Hoàng Diệu ở Hà Nội chạy dọc khu Hoàng thành Thăng Long, nơi ông từng trấn giữ.'),
        END('Hà Nội 1882 · Hoàng Diệu')] },

    /* 35 */ { id: 'cau-giay-1883', year: '1883', name: 'Cầu Giấy 1883', who: 'Lưu Vĩnh Phúc', vs: 'Pháp', seed: 75, series: PHAP,
      sources: ['Đại Nam thực lục', 'Việt Nam sử lược'], hook: 'RIVIÈRE BỎ MẠNG Ở CẦU GIẤY', hookQ: 'CẦU GIẤY CHỨNG KIẾN QUÂN PHÁP THẤT BẠI LẦN THỨ HAI THẾ NÀO?',
      scenes: [
        T('CẦU GIẤY', 'TRẬN CẦU GIẤY LẦN THỨ HAI', 'NGÀY 19 THÁNG 5 NĂM 1883', 'RIVIÈRE TỬ TRẬN', { say: 'Mười năm sau trận Cầu Giấy lần thứ nhất, ngày 19 tháng 5 năm 1883, quân Pháp lại thất bại tại chính nơi này.' }),
        HERO('THỦ LĨNH QUÂN CỜ ĐEN', 'Lưu Vĩnh Phúc', '1837 – 1917', 'Phối hợp với quân triều đình', 'Quân Cờ Đen của Lưu Vĩnh Phúc phối hợp với quân của Hoàng Kế Viêm, bày trận phục kích ở Cầu Giấy.'),
        MAP('19.05.1883', 8.6, 'Quân Pháp', [], [{ lon: 105.9, lat: 21.0, z: 4 }, { lon: 105.8, lat: 21.035, z: 7 }],
          [L(105.84, 21.035, 'Thành Hà Nội', { dot: 1, anchor: 'start', at: .3 }), L(105.79, 21.035, 'Cầu Giấy', { dot: 1, anchor: 'end', at: .5 })],
          [R([[105.84, 21.035], [105.8, 21.035]], 'dich', .45, .25)], { lon: 105.79, lat: 21.035, text: 'Cầu Giấy', at: .78 },
          'Rivière đem quân từ thành Hà Nội ra đánh, hòng phá vòng vây của quân ta ở phía tây thành.'),
        F({ name: 'QUÂN TA', rows: [['Chỉ huy', 'Lưu Vĩnh Phúc, Hoàng Kế Viêm'], ['Thế trận', 'Phục kích quanh Cầu Giấy'], ['Lợi thế', 'Thông thạo địa hình']] }, { name: 'QUÂN PHÁP', rows: [['Chỉ huy', 'Henri Rivière'], ['Lực lượng', 'Khoảng # trăm quân', 5], ['Kết cục', 'Rivière tử trận']] },
          'Theo các tài liệu, đạo quân của Rivière có khoảng năm trăm người, có pháo dã chiến.'),
        DONG({ title: 'TRẬN CẦU GIẤY 1883', ours: 'Quân ta', enemy: 'Quân Pháp', river: 'SÔNG TÔ LỊCH', bridge: { at: [1230, 540, 1410, 540], fall: 2 }, enemyCmd: 'Rivière', oursCmd: 'Quân Cờ Đen',
          labels: [{ x: 1320, y: 470, text: 'CẦU GIẤY', style: 'warn' }, { x: 1700, y: 960, text: '▶ Thành Hà Nội', style: '' }],
          phases: ['Rivière đem quân ra khỏi thành', 'Qua Cầu Giấy, lọt vào trận địa', 'Quân ta đổ ra từ ba phía', 'Rivière tử trận, quân Pháp tháo chạy'],
          say: 'Quân Pháp vượt qua Cầu Giấy thì bị quân ta chặn đánh từ ba phía. Trận chiến ác liệt diễn ra quanh cầu. Rivière cùng nhiều sĩ quan tử trận. Quân Pháp hoảng loạn tháo chạy về thành Hà Nội, một lần nữa thất bại thảm hại tại Cầu Giấy.' }),
        TL('DIỄN BIẾN', [['04.1882', 'Rivière chiếm thành Hà Nội'], ['19.05.1883', 'Rivière tử trận ở Cầu Giấy'], ['08.1883', 'Pháp đánh Thuận An']], 'Sau thất bại này, Pháp tăng viện, đánh thẳng vào cửa Thuận An, ép triều đình Huế ký Hòa ước Hác Măng năm 1883.'),
        PTS(['Lần thứ hai chỉ huy Pháp tử trận ở Cầu Giấy', 'Khẳng định sức mạnh của lối đánh phục kích', 'Cổ vũ tinh thần kháng chiến'], 'Hai trận Cầu Giấy là những chiến thắng tiêu biểu của quân dân ta trong những năm đầu chống Pháp ở Bắc Kỳ.'),
        END('Cầu Giấy 1883 · Lưu Vĩnh Phúc')] },

    /* 36 */ { id: 'kinh-thanh-hue-1885', year: '1885', name: 'Kinh thành Huế 1885', who: 'Tôn Thất Thuyết', vs: 'Pháp', seed: 76, series: PHAP,
      sources: ['Đại Nam thực lục', 'Việt Nam sử lược', 'Chiếu Cần Vương'], hook: 'ĐÊM PHẢN CÔNG MỞ ĐẦU CẦN VƯƠNG', hookQ: 'ĐÊM 4 THÁNG 7 NĂM 1885 Ở KINH THÀNH HUẾ ĐÃ XẢY RA ĐIỀU GÌ?',
      scenes: [
        T('KINH THÀNH HUẾ', 'CUỘC PHẢN CÔNG ĐÊM 4 RẠNG 5.7.1885', 'MỞ ĐẦU PHONG TRÀO CẦN VƯƠNG', 'CẦN VƯƠNG', { size: 140, say: 'Đêm 4 rạng sáng 5 tháng 7 năm 1885, phái chủ chiến trong triều đình Huế do Tôn Thất Thuyết đứng đầu đã mở cuộc tấn công quân Pháp ở kinh thành.' }),
        HERO('PHỤ CHÍNH ĐẠI THẦN', 'Tôn Thất Thuyết', '1839 – 1913', 'Thủ lĩnh phái chủ chiến', 'Tôn Thất Thuyết là phụ chính đại thần, người đứng đầu phái chủ chiến, ngầm xây dựng lực lượng chống Pháp.'),
        MAP('05.07.1885', 8.6, 'Quân Pháp', [], [{ lon: 107.6, lat: 16.5, z: 4 }, { lon: 107.58, lat: 16.47, z: 7 }],
          [L(107.58, 16.47, 'Kinh thành Huế', { dot: 1, anchor: 'end', at: .4 }), L(107.59, 16.46, 'Tòa Khâm sứ', { dot: 1, anchor: 'start', at: .5 }), L(107.58, 16.48, 'Đồn Mang Cá', { dot: 1, anchor: 'start', at: .55 })],
          [], { lon: 107.58, lat: 16.47, text: 'Huế', at: .78 },
          'Quân Pháp đóng ở đồn Mang Cá trong kinh thành và Tòa Khâm sứ bên kia sông Hương.'),
        F({ name: 'PHÁI CHỦ CHIẾN', rows: [['Chỉ huy', 'Tôn Thất Thuyết'], ['Mục tiêu', 'Đồn Mang Cá, Tòa Khâm sứ'], ['Thời điểm', 'Đêm 4 rạng 5.7.1885']] }, { name: 'QUÂN PHÁP', rows: [['Chỉ huy', 'De Courcy'], ['Vị trí', 'Mang Cá, Tòa Khâm sứ'], ['Vũ khí', 'Súng trường, đại bác']] },
          'Tướng Pháp De Courcy kéo quân vào Huế, đòi triều đình phải theo ý Pháp, khiến cuộc đối đầu không thể tránh khỏi.'),
        THANH({ title: 'KINH THÀNH HUẾ 1885', ours: 'Quân phái chủ chiến', enemy: 'Quân Pháp', fort: 'Đồn Mang Cá', fall: 2, defCmd: 'De Courcy', atkCmd: 'Tôn Thất Thuyết', atk2: 'Quân tấn công Tòa Khâm sứ', atk3: 'Quân phục kích', river: 'SÔNG HƯƠNG',
          phases: ['Nửa đêm, nổ súng tấn công đồn Mang Cá', 'Đánh vào Tòa Khâm sứ', 'Trời sáng, Pháp phản công dữ dội', 'Tôn Thất Thuyết đưa vua Hàm Nghi ra Tân Sở'],
          say: 'Nửa đêm, quân ta nổ súng tấn công đồn Mang Cá và Tòa Khâm sứ. Quân Pháp lúc đầu rối loạn, nhưng đến sáng thì củng cố được lực lượng và phản công. Kinh thành bị chiếm, bị cướp phá. Tôn Thất Thuyết đưa vua Hàm Nghi rời kinh thành ra căn cứ Tân Sở ở Quảng Trị.' }),
        Q('Người giàu bỏ của, người khỏe bỏ sức, người mạnh giúp lực, kẻ nghèo giúp công, đồng tâm hiệp lực, giải nguy cứu khốn.', 'Chiếu Cần Vương – 13.7.1885', 'Ngày 13 tháng 7 năm 1885, nhân danh vua Hàm Nghi, Tôn Thất Thuyết ban Chiếu Cần Vương, kêu gọi văn thân và nhân dân cả nước đứng lên giúp vua cứu nước.'),
        PTS(['Mở đầu phong trào Cần Vương rộng khắp', 'Vua Hàm Nghi trở thành biểu tượng kháng chiến', 'Hàng loạt cuộc khởi nghĩa nổ ra sau đó'], 'Phong trào Cần Vương với các cuộc khởi nghĩa Ba Đình, Bãi Sậy, Hương Khê kéo dài hơn mười năm.'),
        END('Kinh thành Huế 1885 · Tôn Thất Thuyết')] },

    /* 37 */ { id: 'ba-dinh-1887', year: '1887', name: 'Ba Đình 1886 – 1887', who: 'Đinh Công Tráng', vs: 'Pháp', seed: 77, series: 'SỬ VIỆT · CẦN VƯƠNG',
      sources: ['Lịch sử Việt Nam – NXB Khoa học xã hội', 'Việt Nam sử lược'], hook: 'BA LÀNG THÀNH PHÁO ĐÀI', hookQ: 'VÌ SAO BA LÀNG NHỎ CẦM CỰ ĐƯỢC HÀNG THÁNG TRỜI?',
      scenes: [
        T('BA ĐÌNH', 'KHỞI NGHĨA BA ĐÌNH 1886 – 1887', 'CĂN CỨ GIỮA ĐỒNG CHIÊM TRŨNG', 'CẦN VƯƠNG', { say: 'Hưởng ứng Chiếu Cần Vương, cuối năm 1886 nghĩa quân Ba Đình ở Thanh Hóa đã biến ba làng nhỏ thành một pháo đài kiên cố.' }),
        HERO('THỦ LĨNH NGHĨA QUÂN', 'Đinh Công Tráng', '1842 – 1887', 'Chỉ huy căn cứ Ba Đình', 'Đinh Công Tráng cùng Phạm Bành và nhiều văn thân khác xây dựng căn cứ Ba Đình ở huyện Nga Sơn, Thanh Hóa.'),
        MAP('THÁNG 1.1887', 8.6, 'Quân Pháp', [], [{ lon: 106, lat: 20.2, z: 3 }, { lon: 105.97, lat: 20.02, z: 6 }],
          [L(105.97, 20.02, 'Ba Đình', { dot: 1, anchor: 'start', at: .45 }), L(105.78, 19.8, 'Thanh Hóa', { dot: 1, anchor: 'end', at: .35 })],
          [R([[105.8, 19.82], [105.9, 19.95], [105.96, 20.01]], 'dich', .3, .3)], { lon: 105.97, lat: 20.02, text: 'Căn cứ Ba Đình', at: .78 },
          'Ba Đình gồm ba làng Mậu Thịnh, Thượng Thọ, Mỹ Khê, nằm giữa vùng đồng chiêm trũng, mùa nước như một hòn đảo.'),
        F({ name: 'NGHĨA QUÂN BA ĐÌNH', rows: [['Chỉ huy', 'Đinh Công Tráng, Phạm Bành'], ['Công sự', 'Lũy tre, tường đất, hào nước'], ['Lực lượng', 'Nghĩa quân và dân ba làng']] }, { name: 'QUÂN PHÁP', rows: [['Chỉ huy', 'Brissaud'], ['Lực lượng', 'Hàng nghìn quân, nhiều pháo'], ['Kết cục', 'Chiếm Ba Đình đầu 1887']] },
          'Nghĩa quân đắp lũy, trồng tre dày, đào hào sâu, biến ba làng thành công sự liên hoàn.'),
        DAM({ title: 'CĂN CỨ BA ĐÌNH 1886 – 1887', ours: 'Nghĩa quân Ba Đình', enemy: 'Quân Pháp', place: 'ĐỒNG CHIÊM TRŨNG NGA SƠN', fort: 'Căn cứ Ba Đình', fall: .8, enemyCmd: 'Brissaud', oursCmd: 'Đinh Công Tráng',
          isles: [[960, 520, 300, 170], [600, 300, 130, 60], [1350, 300, 120, 50], [520, 820, 150, 60], [1450, 820, 160, 60]],
          phases: ['Quân Pháp tiến vào đồng chiêm trũng', 'Nghĩa quân bắn tỉa từ sau lũy tre', 'Đẩy lùi nhiều đợt tấn công', 'Pháp vây chặt, dùng pháo phá lũy, nghĩa quân mở đường rút'],
          say: 'Quân Pháp nhiều lần tấn công đều bị đẩy lùi. Nghĩa quân ẩn sau lũy tre, bắn tỉa chính xác. Tháng 12 năm 1886, Pháp huy động lực lượng lớn, vây chặt và dùng đại bác bắn phá. Đến tháng 1 năm 1887, nghĩa quân mở đường máu rút lên Mã Cao, tiếp tục kháng chiến.' }),
        TL('DIỄN BIẾN', [['1886', 'Xây dựng căn cứ Ba Đình'], ['12.1886', 'Pháp bắt đầu vây đánh'], ['01.1887', 'Nghĩa quân rút khỏi Ba Đình']], 'Cuộc chiến đấu ở Ba Đình kéo dài nhiều tháng, gây cho quân Pháp nhiều thiệt hại.'),
        PTS(['Nghệ thuật xây dựng làng chiến đấu', 'Tinh thần kiên cường của phong trào Cần Vương', 'Đi vào ký ức nhân dân Thanh Hóa'], 'Tên Ba Đình sau này được đặt cho quảng trường lịch sử ở Hà Nội, nơi Chủ tịch Hồ Chí Minh đọc Tuyên ngôn độc lập.'),
        END('Ba Đình 1886 – 1887 · Đinh Công Tráng')] },

    /* 38 */ { id: 'bai-say-1885', year: '1885', name: 'Bãi Sậy 1885 – 1889', who: 'Nguyễn Thiện Thuật', vs: 'Pháp', seed: 78, series: 'SỬ VIỆT · CẦN VƯƠNG',
      sources: ['Lịch sử Việt Nam – NXB Khoa học xã hội', 'Việt Nam sử lược'], hook: 'LAU SẬY THÀNH CĂN CỨ', hookQ: 'VÌ SAO QUÂN PHÁP KHIẾP SỢ VÙNG LAU SẬY HƯNG YÊN?',
      scenes: [
        T('BÃI SẬY', 'KHỞI NGHĨA BÃI SẬY 1885 – 1889', 'ĐÁNH DU KÍCH GIỮA ĐỒNG BẰNG', 'CẦN VƯƠNG', { say: 'Giữa đồng bằng Bắc Bộ, vùng lau sậy um tùm ở Hưng Yên đã trở thành căn cứ của một cuộc khởi nghĩa lớn hưởng ứng Chiếu Cần Vương.' }),
        HERO('TÁN TƯƠNG QUÂN VỤ', 'Nguyễn Thiện Thuật', '1844 – 1926', 'Thủ lĩnh khởi nghĩa Bãi Sậy', 'Nguyễn Thiện Thuật quê Hải Dương, là người lãnh đạo cuộc khởi nghĩa Bãi Sậy, sau khi các cuộc chống Pháp trước đó thất bại.'),
        MAP('NĂM 1885', 8.6, 'Quân Pháp', [], [{ lon: 106.1, lat: 20.95, z: 3 }, { lon: 106.03, lat: 20.88, z: 6 }],
          [L(106.03, 20.88, 'Bãi Sậy', { dot: 1, anchor: 'start', at: .45 }), L(105.85, 21.03, 'Hà Nội', { dot: 1, anchor: 'end', at: .3 })],
          [], { lon: 106.03, lat: 20.88, text: 'Căn cứ Bãi Sậy', at: .78 },
          'Căn cứ chính ở vùng Văn Lâm, Yên Mỹ, Khoái Châu, tỉnh Hưng Yên, gần các tuyến giao thông quan trọng của Pháp.'),
        F({ name: 'NGHĨA QUÂN BÃI SẬY', rows: [['Chỉ huy', 'Nguyễn Thiện Thuật'], ['Tướng', 'Đốc Tít, Đốc Tuấn…'], ['Cách đánh', 'Du kích, phục kích nhỏ']] }, { name: 'QUÂN PHÁP', rows: [['Chiến thuật', 'Càn quét, lập đồn bốt'], ['Lợi thế', 'Vũ khí hiện đại'], ['Khó khăn', 'Địa hình lau sậy, đầm lầy']] },
          'Nghĩa quân hoạt động thành từng toán nhỏ, lúc ẩn lúc hiện, phối hợp với nhân dân các làng.'),
        DAM({ title: 'CĂN CỨ BÃI SẬY', ours: 'Nghĩa quân Bãi Sậy', enemy: 'Quân Pháp', place: 'VÙNG LAU SẬY HƯNG YÊN', enemyCmd: 'Quân Pháp càn quét', oursCmd: 'Nguyễn Thiện Thuật',
          phases: ['Quân Pháp càn quét vào vùng lau sậy', 'Nghĩa quân ẩn mình, phân tán thành toán nhỏ', 'Phục kích, đánh tỉa trên đường hành quân', 'Quân Pháp thiệt hại, phải rút ra'],
          say: 'Mỗi khi quân Pháp càn quét, nghĩa quân phân tán vào lau sậy, đầm lầy. Khi địch mỏi mệt, họ bất ngờ phục kích, đánh tỉa trên đường hành quân, tập kích đồn bốt. Cuộc khởi nghĩa làm chủ một vùng rộng lớn, uy hiếp đường giao thông của Pháp suốt nhiều năm, cho đến khi Pháp tập trung lực lượng lớn đàn áp vào năm 1889.' }),
        TL('DIỄN BIẾN', [['1885', 'Khởi nghĩa bùng nổ'], ['1885 – 1887', 'Giai đoạn phát triển mạnh'], ['1889', 'Cuộc khởi nghĩa bị đàn áp']], 'Sau khi khởi nghĩa thất bại, Nguyễn Thiện Thuật sang Trung Quốc, tiếp tục hoạt động cho đến cuối đời.'),
        PTS(['Lối đánh du kích linh hoạt giữa đồng bằng', 'Uy hiếp tuyến giao thông của Pháp', 'Tiêu biểu cho phong trào Cần Vương ở Bắc Kỳ'], 'Khởi nghĩa Bãi Sậy cho thấy đồng bằng, nếu dựa vào nhân dân và địa hình, vẫn có thể trở thành căn cứ kháng chiến.'),
        END('Bãi Sậy · Nguyễn Thiện Thuật')] },

    /* 39 */ { id: 'ho-chuoi-1890', year: '1890', name: 'Hố Chuối 1890', who: 'Hoàng Hoa Thám', vs: 'Pháp', seed: 79, series: 'SỬ VIỆT · CHỐNG PHÁP',
      sources: ['Lịch sử Việt Nam – NXB Khoa học xã hội', 'Khởi nghĩa Yên Thế'], hook: 'HÙM XÁM YÊN THẾ', hookQ: 'VÌ SAO QUÂN PHÁP GỌI HOÀNG HOA THÁM LÀ HÙM XÁM YÊN THẾ?',
      scenes: [
        T('HỐ CHUỐI', 'TRẬN HỐ CHUỐI NĂM 1890', 'KHỞI NGHĨA YÊN THẾ', 'HÙM XÁM YÊN THẾ', { say: 'Tháng 12 năm 1890, ở rừng Yên Thế, nghĩa quân của Hoàng Hoa Thám đã giáng cho quân Pháp một đòn nặng nề tại Hố Chuối.' }),
        HERO('ĐỀ THÁM', 'Hoàng Hoa Thám', '1858 – 1913', 'Thủ lĩnh khởi nghĩa Yên Thế', 'Hoàng Hoa Thám, thường gọi là Đề Thám, lãnh đạo cuộc khởi nghĩa nông dân Yên Thế kéo dài gần ba mươi năm.'),
        MAP('THÁNG 12.1890', 8.6, 'Quân Pháp', [], [{ lon: 106.1, lat: 21.3, z: 3 }, { lon: 106.2, lat: 21.5, z: 6 }],
          [L(106.2, 21.5, 'Hố Chuối', { dot: 1, anchor: 'start', at: .45 }), L(106.2, 21.27, 'Bắc Giang', { dot: 1, anchor: 'end', at: .3 })],
          [R([[106.2, 21.28], [106.2, 21.4], [106.2, 21.48]], 'dich', .3, .3)], { lon: 106.2, lat: 21.5, text: 'Rừng Yên Thế', at: .78 },
          'Yên Thế là vùng đồi núi, rừng rậm thuộc Bắc Giang ngày nay. Nghĩa quân dựng nhiều đồn lũy trong rừng.'),
        F({ name: 'NGHĨA QUÂN YÊN THẾ', rows: [['Chỉ huy', 'Hoàng Hoa Thám'], ['Công sự', 'Đồn lũy, giao thông hào trong rừng'], ['Cách đánh', 'Phục kích, chặn đánh']] }, { name: 'QUÂN PHÁP', rows: [['Lực lượng', 'Lính Pháp và lính khố đỏ'], ['Mục tiêu', 'Đánh vào đồn Hố Chuối'], ['Kết cục', 'Thua, phải rút']] },
          'Đồn Hố Chuối được xây dựng kiên cố, có giao thông hào nối liền với các đồn khác.'),
        AI({ title: 'TRẬN HỐ CHUỐI 1890', ours: 'Nghĩa quân Yên Thế', enemy: 'Quân Pháp', top: '▲ PHỦ LẠNG THƯƠNG', pass: 'RỪNG YÊN THẾ', enemyKind: 'troop', enemyCmd: 'Quân Pháp', oursCmd: 'Đề Thám', lure: 'Toán nghĩa quân nhỏ', fort: 'Đồn Hố Chuối', fortSide: 'ta',
          phases: ['Quân Pháp tiến vào rừng Yên Thế', 'Nghĩa quân nhử địch tới đồn Hố Chuối', 'Bắn chặn từ giao thông hào hai bên', 'Quân Pháp thiệt hại nặng, phải rút lui'],
          say: 'Quân Pháp chia nhiều mũi tiến vào rừng, nhắm đánh đồn Hố Chuối. Nghĩa quân dựa vào đồn lũy và giao thông hào, bắn chặn quyết liệt, rồi bất ngờ đánh vào sườn địch. Quân Pháp thiệt hại nặng, nhiều sĩ quan bị thương vong, phải rút lui. Tên tuổi Hùm xám Yên Thế từ đó vang khắp nơi.' }),
        TL('DIỄN BIẾN', [['1884', 'Khởi nghĩa Yên Thế bùng nổ'], ['12.1890', 'Thắng lớn ở Hố Chuối'], ['1913', 'Hoàng Hoa Thám bị sát hại']], 'Cuộc khởi nghĩa Yên Thế kéo dài từ năm 1884 đến năm 1913, là cuộc khởi nghĩa nông dân dài nhất thời kỳ này.'),
        PTS(['Nghệ thuật đánh giặc trong rừng, dựa vào đồn lũy', 'Cuộc khởi nghĩa nông dân kéo dài gần 30 năm', 'Hoàng Hoa Thám – biểu tượng của ý chí bất khuất'], 'Khởi nghĩa Yên Thế cho thấy sức mạnh to lớn của người nông dân trong cuộc đấu tranh chống thực dân.'),
        END('Hố Chuối 1890 · Hoàng Hoa Thám')] },

    /* 40 */ { id: 'vu-quang-1894', year: '1894', name: 'Vụ Quang 1894', who: 'Phan Đình Phùng', vs: 'Pháp', seed: 80, series: 'SỬ VIỆT · CẦN VƯƠNG',
      sources: ['Lịch sử Việt Nam – NXB Khoa học xã hội', 'Việt Nam sử lược'], hook: 'ĐỈNH CAO KHỞI NGHĨA HƯƠNG KHÊ', hookQ: 'TRẬN VỤ QUANG ĐÃ KHIẾN QUÂN PHÁP THẤT BẠI RA SAO?',
      scenes: [
        T('VỤ QUANG', 'TRẬN VỤ QUANG NĂM 1894', 'ĐỈNH CAO KHỞI NGHĨA HƯƠNG KHÊ', 'CẦN VƯƠNG', { say: 'Tháng 10 năm 1894, ở vùng núi Vụ Quang, Hà Tĩnh, nghĩa quân Hương Khê của Phan Đình Phùng giành thắng lợi lớn trước quân Pháp.' }),
        HERO('ĐÌNH NGUYÊN TIẾN SĨ', 'Phan Đình Phùng', '1847 – 1895', 'Lãnh tụ khởi nghĩa Hương Khê', 'Phan Đình Phùng đỗ đình nguyên tiến sĩ, hưởng ứng Chiếu Cần Vương, lãnh đạo khởi nghĩa Hương Khê suốt mười năm.'),
        MAP('THÁNG 10.1894', 8.6, 'Quân Pháp', [], [{ lon: 105.6, lat: 18.5, z: 3 }, { lon: 105.4, lat: 18.35, z: 6 }],
          [L(105.4, 18.35, 'Vụ Quang', { dot: 1, anchor: 'end', at: .45 }), L(105.9, 18.34, 'Hà Tĩnh', { dot: 1, anchor: 'start', at: .3 })],
          [R([[105.9, 18.34], [105.65, 18.36], [105.45, 18.35]], 'dich', .3, .3)], { lon: 105.4, lat: 18.35, text: 'Căn cứ Vụ Quang', at: .78 },
          'Căn cứ Vụ Quang nằm ở miền núi Hương Khê, Hà Tĩnh, hiểm trở, rừng rậm.'),
        F({ name: 'NGHĨA QUÂN HƯƠNG KHÊ', rows: [['Lãnh tụ', 'Phan Đình Phùng'], ['Danh tướng', 'Cao Thắng (mất năm 1893)'], ['Vũ khí', 'Súng tự chế theo mẫu Pháp']] }, { name: 'QUÂN PHÁP', rows: [['Mục tiêu', 'Tiêu diệt căn cứ Vụ Quang'], ['Lực lượng', 'Lính Pháp và lính khố xanh'], ['Kết cục', 'Bị đánh bại']] },
          'Tướng Cao Thắng đã tổ chức chế tạo được súng trường theo mẫu súng Pháp, một thành tựu đặc biệt của nghĩa quân.'),
        AI({ title: 'TRẬN VỤ QUANG 1894', ours: 'Nghĩa quân Hương Khê', enemy: 'Quân Pháp', top: '▲ HÀ TĨNH', pass: 'NÚI VỤ QUANG', enemyKind: 'troop', enemyCmd: 'Quân Pháp', oursCmd: 'Phan Đình Phùng', lure: 'Nghĩa quân giả rút', remnant: 'Quân Pháp tháo chạy',
          phases: ['Quân Pháp tiến đánh căn cứ Vụ Quang', 'Nghĩa quân giả rút, nhử địch vào thung lũng', 'Phục binh hai bên núi nổ súng', 'Quân Pháp thua to, phải rút về'],
          say: 'Quân Pháp kéo vào đánh căn cứ Vụ Quang. Nghĩa quân giả vờ rút lui, nhử địch vào sâu trong thung lũng giữa núi. Khi quân Pháp lọt vào trận địa, phục binh hai bên núi đồng loạt nổ súng bằng những khẩu súng tự chế. Quân Pháp thua to, phải rút chạy, nhiều binh lính bị tiêu diệt.' }),
        Q('Tôi chỉ còn một ngôi mộ phải giữ, đó là ngôi mộ lớn: đất nước Việt Nam.', 'Phan Đình Phùng – thư trả lời Hoàng Cao Khải', 'Khi bị dụ hàng, uy hiếp bằng mồ mả tổ tiên, Phan Đình Phùng đã trả lời bằng một bức thư nổi tiếng, khẳng định ý chí giữ nước.'),
        PTS(['Đỉnh cao của phong trào Cần Vương', 'Nghĩa quân tự chế tạo được súng trường', 'Tấm gương sáng của sĩ phu yêu nước'], 'Cuối năm 1895, Phan Đình Phùng mất trong rừng Vụ Quang. Khởi nghĩa Hương Khê là cuộc khởi nghĩa lớn và kéo dài nhất của phong trào Cần Vương.'),
        END('Vụ Quang 1894 · Phan Đình Phùng')] }
  ];

  // nối vào danh sách, xếp theo năm, nối "Tập tiếp theo"
  const B = window.BATTLES;
  NEW.forEach(b => { if (!B.some(x => x.id === b.id)) B.push(b); });
  const ord = B.map((b, i) => [b, i]).sort((x, y) => ((x[0].sortKey || parseInt(x[0].year, 10)) - (y[0].sortKey || parseInt(y[0].year, 10))) || (x[1] - y[1])).map(x => x[0]);
  B.length = 0; ord.forEach(b => B.push(b));
  B.forEach((b, i) => { const e = b.scenes.find(s => s.type === 'end'); if (e) { if (B[i + 1]) e.next = B[i + 1].name; else delete e.next; } });
})();
