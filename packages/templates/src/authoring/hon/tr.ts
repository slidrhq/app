import type { HonCopy } from './copy';

export const tr: HonCopy = {
  footer: 'Larkfield Mutual · 2026 yılı sonuçları',
  hero: {
    name: 'Açılış',
    org: 'Larkfield Mutual · 2026 yılı sonuçları',
    title: ['Evine yakın', 'kalan sermaye'],
    subtitle: ['412.000 üyesinin sahibi olduğu', 'bir bankanın yılı'],
    meta: 'Genel Kurul · 18 Mart 2027',
  },
  agenda: {
    name: 'Gündem',
    title: 'Bu akşamın gündemi',
    intro:
      'Kırk dakika boyunca sahibi olduğunuz bankanın 2026 yılını konuşacağız: ne kadar kredi verdik, ne kadarını sermaye olarak tuttuk ve üyeler olarak size ne geri döndü. Ardından oylamalar ve sorularınız.',
    items: [
      ['Rakamlarla yıl: ', 'krediler, sermaye ve üyelere geri dönenler.'],
      ['Yeşil evler: ', 'bu yıl en hızlı büyüyen kalem olan yenileme kredileri.'],
      ['İş başındaki birikiminiz: ', 'bir mevduat beş adımda nasıl bir komşunun kredisine dönüşür.'],
      ['Oylamalar: ', 'yönetim kurulu, denetçiler ve üyelere dağıtılacak pay.'],
    ],
  },
  section: {
    name: 'Rakamlarla yıl',
    part: 'Birinci bölüm',
    title: ['Rakamlarla yıl'],
    subtitle: 'Krediler büyüdü, sermaye daha da hızlı büyüdü.',
  },
  figures: {
    name: 'Dört rakam',
    kicker: 'Rakamlarla yıl',
    title: 'Dört rakamla 2026',
    hero: {
      value: '1,84 milyar €',
      label: 'üyelerin evlerine ve işletmelerine verilen kredi',
      note: '2025’e göre %12 artış; bu kredilerin her avrosu üyelerin kendi birikiminden geliyor.',
    },
    others: [
      ['412.000', 'üye; bir yıl öncesine göre 23.300 fazla'],
      ['%19,2', 'çekirdek sermaye oranı; gereken %10,5'],
      ['22 milyon €', 'daha iyi faizlerle üyelere geri döndü'],
    ],
  },
  savings: {
    name: 'Birikim ve kredi',
    kicker: 'Birikim ve kredi',
    title: 'Her kredi üyelerin birikiminden',
    source: 'Yıl sonu bakiyeleri, milyar €, 2023–2026.',
    series: ['Üyelerin birikimi', 'Üyelere krediler'],
    figures: [
      ['%81', 'üye birikiminin kredi olarak üyelere dönen payı; kalanı güvenlik marjı olarak tutulur.'],
      ['+%21', '2023’ten bu yana birikimdeki artış; piyasalardan tek avro borç almadan.'],
    ],
  },
  lines: {
    name: 'Beş kalem',
    kicker: 'Bilanço',
    title: 'Üyelerin parası nerede duruyor',
    note: '31 Aralık 2026 itibarıyla bakiyeler; faizler, üyelerin yıl boyunca ortalama aldığı veya ödediği oranlardır.',
    header: ['Kalem', 'Bakiye, milyon €', 'Değişim', 'Üye', 'Ortalama faiz'],
    rows: [
      ['Tasarruf hesapları', '4.120', '+%6', '351.000', '%2,1'],
      ['Vadeli mevduat', '2.180', '+%9', '96.000', '%3,0'],
      ['Konut kredileri', '3.690', '+%5', '41.500', '%3,4'],
      ['Küçük işletme kredileri', '1.050', '+%11', '8.200', '%5,2'],
      ['Yeşil yenileme kredileri', '360', '+%64', '6.900', '%2,9'],
    ],
  },
  profit: {
    name: 'Kâr nereye gitti',
    kicker: '2026 kârı',
    title: '58 milyon € kâr nereye gitti',
    cards: [
      [
        '22 milyon € · %38',
        'Üyelere geri döndü',
        'Yıl boyunca birikimde ve kredide piyasa ortalamasından daha iyi faizler.',
      ],
      [
        '31 milyon € · %53',
        'Sermayede tutuldu',
        'Tutulan her avro bankayı güçlendirir ve gelecek yıl daha fazla kredi verilmesini sağlar.',
      ],
      [
        '5 milyon € · %9',
        'Topluluk fonu',
        'Her biri üyelerin oyuyla seçilen 140 yerel projeye destek.',
      ],
    ],
    note: 'Kooperatif bankanın kâr payı ödeyeceği dışarıdan hissedarı yoktur; bu yüzden kârın tamamı üyelerinde kalır.',
  },
  owners: {
    name: 'Neden kooperatif',
    kicker: 'Neden kooperatif banka',
    title: 'Hissedarların mı, üyelerin mi',
    before: [
      'Halka açık bir banka',
      'Kâr şehri terk eder',
      'Temettü, nerede yaşarlarsa yaşasınlar hissedarlara gider; yönetim hisse fiyatına bakar ve kâr etmeyi bırakan şube kapanır.',
    ],
    after: [
      'Larkfield Mutual',
      'Kâr üyelerde kalır',
      'Bakiyesi ne olursa olsun her üyenin bir oyu vardır; kâr ona daha iyi faiz olarak döner ve şehrindeki şubeler açık kalır.',
    ],
  },
  homes: {
    name: 'Yeşil evler',
    kicker: 'En hızlı büyüyen kalem · Yeşil evler',
    title: 'Faturayı düşüren krediler',
    items: [
      [
        '6.900 ev yenilendi',
        'Yalıtım, ısı pompası ve güneş çatıları, %2,9 faizle, standart konut kredimizin altında.',
      ],
      [
        'Üçte bir daha az enerji',
        'İşler bittikten sonra üyelerin evleri ortalama %31 daha az enerji tüketiyor.',
      ],
      [
        'Krediden önce danışmanlık',
        'Bir enerji uzmanı önce her evi ziyaret eder; ziyaretin ücretini banka öder.',
      ],
    ],
  },
  street: {
    name: 'Eve yakın',
    place: 'Ana Cadde, Larkfield',
    title: ['Her kredi', '20 km içinde'],
    body: 'Yalnızca üyelerimizin yaşadığı ve çalıştığı yerlerde kredi veriyoruz; böylece birikimleri, her gün yürüdükleri sokakları inşa ediyor.',
  },
  quote: {
    name: 'Bir üyenin sesi',
    text: 'Banka evet dediğinde, masanın karşısındaki kişi sokağımızı zaten tanıyordu. O kredi bugün dört fırın ve on bir kişiye iş demek.',
    who: 'Amara Osei',
    role: 'Fırıncı, 2012’den beri üye',
  },
  lending: {
    name: 'İş başındaki birikim',
    kicker: 'Kredi nasıl işler',
    title: 'Birikimden komşunun kredisine',
    steps: [
      ['Birikim', 'Bir üye tasarruf hesabı açar'],
      ['Havuz', 'Birikim şehirde kalır, alınıp satılmaz'],
      ['İnceleme', 'Yerel danışman borçluyla görüşür'],
      ['Kredi', 'On iş günü içinde karar'],
      ['Getiri', 'Faiz, birikim sahiplerine geri döner'],
    ],
    note: 'Her krediye Larkfield’de, burada yaşayan insanlar karar verir; asla yalnızca uzaktaki bir kredi modeline bırakılmaz.',
  },
  history: {
    name: 'Tarihimiz',
    kicker: 'Doksan altı yıl',
    title: 'Üye üye büyüyen bir banka',
    stops: [
      ['1931', 'Liman işçilerince kuruldu', 'İki yüz aile, birbirine borç vermek için ücretlerini bir araya getirir.'],
      ['1974', 'İlk konut kredileri', 'Üyeler, onlarca yıldır kirada oturdukları evleri satın almaya başlar.'],
      ['2009', 'Kurtarma gerekmedi', 'Finansal krizi tek bir kuruş kamu parası almadan atlatır.'],
      ['2026', '412.000 üye', 'Son yirmi yılın en hızlı büyüme yılı.'],
    ],
    note: 'Banka doksan altı yılda hiçbir dış hissedara ödeme yapmadı, çünkü hiç dış hissedarı olmadı.',
  },
  team: {
    name: 'Yönetim ekibi',
    kicker: 'Yönetim ekibi',
    title: 'Size hesap veren insanlar',
    people: [
      ['Genel müdür', 'Margit Lindqvist', '1994’te şube memuru olarak başladı'],
      ['Finans', 'Kwame Asante', 'Finans direktörü, sermayeyi güçlü tutar'],
      ['Risk', 'Priya Raman', 'Risk direktörü, her büyük krediyi onaylar'],
      ['Üyeler', 'Tomás Herrera', '26 şubeyi ve üye konseyini yönetir'],
    ],
  },
  closing: {
    name: 'Kapanış',
    kicker: 'Teşekkürler',
    title: ['Sizin bankanız,', 'sizin oyunuz'],
    lines: [
      'Oylama bu akşam açılır ve 25 Mart 2027’de kapanır',
      'Sonuçlar 26 Mart 2027’de her şubede',
      'Sorularınız için her şubede üye konseyi',
    ],
    meta: 'Larkfield Mutual · 1931’den beri üyelerinin',
  },
};
