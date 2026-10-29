import type { TeferCopy } from './copy';

export const vi: TeferCopy = {
  footer: 'Ourela · Thu Đông 2027',
  hero: {
    name: 'Mở đầu',
    org: 'Ourela · Áo khoác may tại Porto',
    title: ['Cắt may', 'để bền lâu'],
    subtitle: ['Hai mươi bốn chiếc áo khoác cắt từ vải mà các xưởng dệt không bán được'],
    meta: 'Giới thiệu với nhà mua hàng · Paris · 4 tháng 3 năm 2027',
  },
  section: {
    name: 'Vải',
    part: 'Phần một',
    title: ['Vải'],
    subtitle: 'Từng mét vải của bộ sưu tập đến từ đâu.',
  },
  agenda: {
    name: 'Chương trình',
    title: 'Trên bàn sáng nay',
    intro:
      'Bốn mươi phút về bộ sưu tập hai mươi bốn chiếc áo khoác: vải đến từ đâu, chúng tôi cắt thế nào để gần như không còn gì trên sàn, và cách đặt hàng cho mùa thu. Sau đó là chính những chiếc áo, trên giá treo.',
    items: [
      ['Vải: ', '1.840 mét từ ba xưởng dệt, và vì sao 86% trong đó là hàng tồn kho.'],
      ['Đường cắt: ', 'bộ rập chỉ để lại 3% vải trên sàn, thay vì 15%.'],
      ['Xưởng may: ', 'ba mươi mốt giờ làm thủ công trong mỗi chiếc áo, tại Porto.'],
      ['Đặt hàng: ', 'cách đặt hàng cho tháng 9, và những gì chúng tôi vẫn may đo.'],
    ],
  },
  cloth: {
    name: 'Vải qua những con số',
    kicker: 'Vải qua những con số',
    title: 'Bộ sưu tập cắt từ vải tồn kho',
    hero: {
      value: '86%',
      label: 'lượng len là hàng tồn kho',
      note: '1.582 trên 1.840 mét đến từ kho hàng chưa bán của ba xưởng dệt.',
    },
    others: [
      ['24', 'áo khoác trong bộ sưu tập'],
      ['3', 'xưởng dệt: Biella, Huddersfield và Bursa'],
      ['31', 'giờ làm thủ công cho mỗi chiếc áo'],
    ],
  },
  cutting: {
    name: 'Đường cắt',
    kicker: 'Cắt không lãng phí',
    title: 'Áo khoác được cắt thế nào',
    items: [
      [
        'Những mảnh ghép khít nhau',
        'Mỗi bộ rập được vẽ để các mảnh ghép khít trên khổ vải như một trò xếp hình.',
      ],
      ['Vải vụn cũng có việc', 'Phần còn lại thành túi, nẹp ve và lá cổ lót.'],
      ['Một thợ may, một chiếc áo', 'Mỗi chiếc áo do cùng một đôi tay cắt và may.'],
    ],
  },
  workroom: {
    name: 'Xưởng may',
    place: 'Xưởng may · Porto',
    title: ['May ngay tại', 'nơi cắt vải'],
    body: 'Mười hai thợ may, một chiếc bàn dài và ánh sáng phương bắc của một nhà máy sợi bông cũ.',
  },
  quote: {
    name: 'Từ xưởng may',
    text: 'Chiếc áo khoác hoàn thành ngay trên bàn cắt, rất lâu trước khi ai đó mặc nó lên sàn diễn.',
    who: 'Inês Moreira',
    role: 'Trưởng xưởng, Ourela',
  },
  cloths: {
    name: 'Ba loại vải',
    kicker: 'Ba loại vải',
    title: 'Những loại vải của mùa này',
    cards: [
      [
        'Vải 01 · Huddersfield',
        'Tweed xương cá',
        'Len dày màu đỏ lựu, dệt cho một đơn hàng không ai đến nhận.',
      ],
      [
        'Vải 02 · Biella',
        'Bouclé',
        'Sợi xoắn vòng từ cuối một mẻ dệt, đủ mềm cho áo khoác không lót.',
      ],
      [
        'Vải 03 · Bursa',
        'Melton',
        'Vải chéo loden dày, nén chặt, cản được mưa và không cần viền gấu.',
      ],
    ],
    note: 'Nhãn trong cổ mỗi chiếc áo ghi tên xưởng dệt và cây vải của nó.',
  },
  season: {
    name: 'Mùa hàng',
    kicker: 'Mùa hàng',
    title: 'Từ xưởng dệt đến cửa hàng',
    stops: [
      ['01/2027', 'Chọn vải', 'Mua 1.582 mét vải tồn kho từ ba xưởng dệt.'],
      ['03/2027', 'Mở nhận đơn', 'Hai mươi bốn chiếc áo ra mắt nhà mua hàng ở Paris.'],
      ['06/2027', 'Bắt đầu cắt', 'Mỗi đơn hàng được cắt tay tại xưởng ở Porto.'],
      ['09/2027', 'Lên kệ', 'Áo được giao đến 40 cửa hàng ở 11 quốc gia.'],
    ],
    note: 'Đơn đặt trước ngày 30 tháng 4 năm 2027 sẽ được giao trong tuần đầu tháng 9.',
  },
  making: {
    name: 'Cắt may',
    kicker: 'Cách may một chiếc áo khoác',
    title: 'Ba mươi mốt giờ, năm bước',
    steps: [
      ['1 giờ', 'Đo', 'Hai mươi hai số đo, đo bằng tay'],
      ['5 giờ', 'Vẽ rập', 'Bộ rập vẽ theo từng loại vải'],
      ['3 giờ', 'Cắt', 'Kéo, phấn và bàn dài'],
      ['17 giờ', 'May', 'Dựng canh, đường may và tra tay áo'],
      ['5 giờ', 'Hoàn thiện', 'Thùa khuyết bằng tay'],
    ],
    note: 'Từ số đo đầu tiên đến chiếc khuyết cuối cùng, một chiếc áo cần ba mươi mốt giờ.',
  },
  cut: {
    name: 'Cách cắt thường, và cách của chúng tôi',
    kicker: 'Vì sao không lãng phí',
    title: 'Cách cắt thường, và cách của chúng tôi',
    before: [
      'Cách cắt thông thường',
      '15% rơi xuống sàn',
      'Các mảnh xếp riêng lẻ, phần vải giữa chúng bị quét đi vào cuối ngày.',
    ],
    after: [
      'Cách cắt của Ourela',
      'Dư dưới 3%',
      'Các mảnh ghép khít trên khổ vải, mọi mẩu vụn được may trở lại vào áo.',
    ],
  },
  waste: {
    name: 'Vải thừa',
    kicker: 'Vải thừa trên mỗi áo',
    title: 'Mỗi mùa ít vải rơi xuống sàn hơn',
    source: 'Vải thừa trên mỗi áo khoác, tính theo phần trăm, các bộ sưu tập Thu Đông 2023–2026.',
    series: ['Cách cắt thường', 'Ourela'],
    figures: [
      ['3%', 'vải của một chiếc áo bị thừa năm 2026, giảm từ 12% năm 2023.'],
      ['0,36 m', 'vải tiết kiệm được trên mỗi chiếc áo so với cách cắt thường.'],
    ],
  },
  mills: {
    name: 'Các xưởng dệt',
    kicker: 'Các xưởng dệt',
    title: 'Năm loại vải, ba xưởng dệt',
    note: 'Vải mua vào tháng 1 năm 2027 cho bộ sưu tập Thu Đông 2027.',
    header: ['Vải', 'Xưởng dệt', 'Mét', 'Hàng tồn', 'Áo khoác'],
    rows: [
      ['Tweed xương cá', 'Huddersfield', '520', '100%', '7'],
      ['Bouclé', 'Biella', '380', '100%', '5'],
      ['Melton', 'Bursa', '460', '70%', '6'],
      ['Flannel', 'Biella', '220', '100%', '4'],
      ['Lông lạc đà', 'Huddersfield', '260', '54%', '2'],
    ],
  },
  team: {
    name: 'Xưởng may',
    kicker: 'Xưởng may',
    title: 'Những đôi tay đứng sau bộ sưu tập',
    people: [
      ['Xưởng may', 'Inês Moreira', 'Trưởng xưởng, cắt chiếc áo đầu tiên của mỗi bộ rập'],
      ['Thiết kế', 'Aiko Mori', 'Nhà thiết kế, vẽ từng bộ rập theo vải'],
      ['Rập', 'Kofi Asante', 'Thợ cắt rập, xếp các mảnh khít trên vải'],
      ['Vải', 'Omar Khalil', 'Người mua vải, nắm rõ kho của mọi xưởng dệt'],
    ],
  },
  closing: {
    name: 'Kết thúc',
    kicker: 'Cảm ơn',
    title: ['Hẹn gặp lại', 'ở buổi thử đồ'],
    lines: [
      'Nhận đơn đến hết ngày 30/4/2027',
      'Showroom tại Porto, theo lịch hẹn',
      'Mọi chiếc áo đều trên giá, mời bạn thử',
    ],
    meta: 'Ourela · Áo khoác từ len tồn kho',
  },
};
