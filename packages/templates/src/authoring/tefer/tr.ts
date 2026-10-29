import type { TeferCopy } from './copy';

export const tr: TeferCopy = {
  footer: 'Ourela · Sonbahar-Kış 2027',
  hero: {
    name: 'Açılış',
    org: 'Ourela · Porto’da dikilen paltolar',
    title: ['Ömürlük', 'paltolar'],
    subtitle: ['Dokuma fabrikalarının satamadığı kumaşlardan kesilmiş yirmi dört palto'],
    meta: 'Alıcılara sunum · Paris · 4 Mart 2027',
  },
  section: {
    name: 'Kumaş',
    part: 'Birinci bölüm',
    title: ['Kumaş'],
    subtitle: 'Koleksiyondaki her metrenin hikâyesi.',
  },
  agenda: {
    name: 'Gündem',
    title: 'Bu sabah masada neler var',
    intro:
      'Yirmi dört paltoluk bir koleksiyon üzerine kırk dakika: kumaşı nereden geldi, yerde neredeyse hiçbir şey kalmayacak şekilde onu nasıl kesiyoruz ve sonbahar için nasıl sipariş verilir. Ardından askıdaki paltoların kendisi.',
    items: [
      ['Kumaş: ', 'üç dokuma fabrikasından 1.840 metre ve neden %86’sı stok fazlasıydı.'],
      ['Kesim: ', 'kumaşın %15’ini değil, yalnızca %3’ünü yerde bırakan kalıplar.'],
      ['Atölye: ', 'Porto’da, her paltoda otuz bir saatlik el emeği.'],
      ['Siparişler: ', 'eylül için nasıl sipariş verilir ve hâlâ neleri ölçüye göre dikiyoruz.'],
    ],
  },
  cloth: {
    name: 'Rakamlarla kumaş',
    kicker: 'Rakamlarla kumaş',
    title: 'Stok fazlasından kesilen bir koleksiyon',
    hero: {
      value: '%86',
      label: 'yün ölü stoktan geliyor',
      note: '1.840 metrenin 1.582’si üç fabrikanın satılmamış depolarından geldi.',
    },
    others: [
      ['24', 'palto koleksiyonda yer alıyor'],
      ['3', 'fabrika: Biella, Huddersfield ve Bursa'],
      ['31', 'saatlik el emeği her paltoda'],
    ],
  },
  cutting: {
    name: 'Kesim',
    kicker: 'Sıfır atık kesim',
    title: 'Bir palto nasıl kesilir',
    items: [
      [
        'Birbirine geçen parçalar',
        'Her kalıp, parçaları kumaşın üzerinde bir yapboz gibi birbirine geçecek şekilde çizilir.',
      ],
      ['Her artığın bir görevi var', 'Kalan kumaş cep, pervaz ve alt yaka olur.'],
      ['Bir terzi, bir palto', 'Her palto aynı ellerde kesilir ve dikilir.'],
    ],
  },
  workroom: {
    name: 'Atölye',
    place: 'Atölye · Porto',
    title: ['Kesildiği yerde', 'dikiliyor'],
    body: 'On iki terzi, uzun bir masa ve eski bir pamuk iplik fabrikasının kuzey ışığı.',
  },
  quote: {
    name: 'Atölyeden',
    text: 'Bir palto, biri onu podyumda giymeden çok önce, kesim masasında tamamlanır.',
    who: 'Inês Moreira',
    role: 'Atölye şefi, Ourela',
  },
  cloths: {
    name: 'Üç kumaş',
    kicker: 'Üç kumaş',
    title: 'Sezonun kumaşları',
    cards: [
      [
        'Kumaş 01 · Huddersfield',
        'Balıksırtı tüvit',
        'Hiç teslim alınmayan bir sipariş için dokunmuş, ağır, nar kırmızısı bir yün.',
      ],
      [
        'Kumaş 02 · Biella',
        'Bukle',
        'Bir üretimin sonundan kalan ilmekli iplik; astarsız bir palto için yeterince yumuşak.',
      ],
      [
        'Kumaş 03 · Bursa',
        'Melton',
        'Yağmuru geçirmeyen, baskı gerektirmeyen yoğun ve keçeleşmiş bir loden dimi.',
      ],
    ],
    note: 'Her paltonun yakasındaki etikette fabrikasının ve kumaş topunun adı yazar.',
  },
  season: {
    name: 'Sezon',
    kicker: 'Sezon',
    title: 'Fabrikadan mağaza rafına',
    stops: [
      ['Ocak 2027', 'Kumaş seçildi', 'Üç fabrikadan 1.582 metre stok fazlası alıyoruz.'],
      ['Mart 2027', 'Siparişler açılıyor', 'Yirmi dört palto Paris’te alıcılara sunuluyor.'],
      ['Haziran 2027', 'Kesim başlıyor', 'Her sipariş Porto atölyesinde elle kesiliyor.'],
      ['Eylül 2027', 'Mağazalarda', 'Paltolar 11 ülkede 40 mağazaya teslim ediliyor.'],
    ],
    note: '30 Nisan 2027’ye kadar verilen siparişler eylülün ilk haftasında teslim edilir.',
  },
  making: {
    name: 'Dikim',
    kicker: 'Bir paltonun yapımı',
    title: 'Beş adımda otuz bir saat',
    steps: [
      ['1 saat', 'Ölçü', 'Elle alınan yirmi iki ölçü'],
      ['5 saat', 'Kalıp', 'Kumaşa özel kalıp'],
      ['3 saat', 'Kesim', 'Makas, tebeşir ve uzun bir masa'],
      ['17 saat', 'Dikiş', 'Tela, dikiş, kol takma'],
      ['5 saat', 'Bitiş', 'Elde işlenen ilikler'],
    ],
    note: 'İlk ölçüden son iliğe kadar bir paltonun yapımı otuz bir saat sürer.',
  },
  cut: {
    name: 'Alışılmış kesim ve bizimki',
    kicker: 'Neden sıfır atık',
    title: 'Alışılmış kesim ve bizimki',
    before: [
      'Alışılmış kesim',
      '%15’i yerde',
      'Parçalar tek tek yerleştirilir, aralarındaki boşluklar gün sonunda süpürülür.',
    ],
    after: [
      'Ourela kesimi',
      '%3’ten az artık',
      'Parçalar kumaş boyunca birbirine geçer, her artık paltoya geri dikilir.',
    ],
  },
  waste: {
    name: 'Atık',
    kicker: 'Palto başına atık',
    title: 'Her sezon yerde daha az kumaş',
    source: 'Palto başına artan kumaş, yüzde olarak, 2023–2026 Sonbahar-Kış koleksiyonları.',
    series: ['Alışılmış kesim', 'Ourela'],
    figures: [
      ['%3', 'bir paltonun kumaşından 2026’da artan pay; 2023’te %12’ydi.'],
      ['0,36 m', 'kumaş, alışılmış kesime göre her paltoda tasarruf ediliyor.'],
    ],
  },
  mills: {
    name: 'Fabrikalar',
    kicker: 'Fabrikalar',
    title: 'Beş kumaş, üç fabrika',
    note: 'Sonbahar-Kış 2027 koleksiyonu için Ocak 2027’de alınan kumaşlar.',
    header: ['Kumaş', 'Fabrika', 'Metre', 'Ölü stok', 'Palto'],
    rows: [
      ['Balıksırtı tüvit', 'Huddersfield', '520', '%100', '7'],
      ['Bukle', 'Biella', '380', '%100', '5'],
      ['Melton', 'Bursa', '460', '%70', '6'],
      ['Flanel', 'Biella', '220', '%100', '4'],
      ['Deve tüyü', 'Huddersfield', '260', '%54', '2'],
    ],
  },
  team: {
    name: 'Atölye',
    kicker: 'Atölye',
    title: 'Koleksiyonun ardındaki eller',
    people: [
      ['Atölye', 'Inês Moreira', 'Atölye şefi, her kalıbın ilk paltosunu o keser'],
      ['Tasarım', 'Aiko Mori', 'Tasarımcı, her kalıbı kumaşına göre çizer'],
      ['Kalıp', 'Kofi Asante', 'Kalıpçı, parçaları kumaşa boşluksuz yerleştirir'],
      ['Kumaş', 'Omar Khalil', 'Kumaş alıcısı, her fabrikanın deposunu bilir'],
    ],
  },
  closing: {
    name: 'Kapanış',
    kicker: 'Teşekkürler',
    title: ['Provada', 'görüşmek üzere'],
    lines: [
      'Siparişler 30 Nisan 2027’ye kadar açık',
      'Porto’daki showroom, randevuyla',
      'Tüm paltolar askıda, denemeye hazır',
    ],
    meta: 'Ourela · Fazla yünden kesilen paltolar',
  },
};
