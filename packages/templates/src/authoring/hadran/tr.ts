import type { HadranCopy } from './copy';

export const tr: HadranCopy = {
  footer: 'Night Tram Records · 2027 Sezonu',
  hero: {
    name: 'Açılış',
    org: 'Night Tram Records · Lizbon',
    title: ['Sezon bu gece', 'başlıyor'],
    subtitle: ['On iki yeni plak, on sekiz şehirlik bir turne ve yeni sesler için bir okul'],
    meta: 'Sezon açılışı · Tramvay Deposu · 21 Ocak 2027',
  },
  section: {
    name: 'Geçen sezon',
    part: 'Birinci bölüm',
    title: ['Geçen sezonu', 'geri saralım'],
    subtitle: '2026 sezonumuz, rakamlarla ve sesle.',
  },
  setlist: {
    name: 'Set listesi',
    title: 'Bu gecenin set listesi',
    intro:
      'Önümüzdeki sezon üzerine kırk dakika: geçen sezonun bize öğrettikleri, çıkaracağımız on iki plak, turnenin on sekiz şehri ve okulumuz. Ardından bar açılıyor ve grup sahneye çıkıyor.',
    items: [
      ['Geçen sezon: ', 'otuz bir konser, dokuz plak, neredeyse bütün koltuklar satıldı.'],
      ['Nasıl kaydediyoruz: ', 'tek oda, tek kayıt, 1974 yapımı bir makaralı teyp.'],
      ['2027 sezonu: ', 'on iki albüm ve on sekiz şehirlik bir turne.'],
      ['Okul: ', 'altmış dört genç, çalmayı ve kayıt yapmayı öğreniyor.'],
    ],
  },
  season: {
    name: 'Rakamlarla geçen sezon',
    kicker: '2026 sezonu',
    title: 'Dört rakamla geçen sezon',
    hero: {
      value: '%92',
      label: 'koltuk doluluğu',
      note: 'Otuz bir konserdeki 37.200 koltuk üzerinden; 2025’te bu oran %78’di.',
    },
    others: [
      ['9', 'yeni plak, hepsi vinil'],
      ['31', 'konser, dokuz şehirde'],
      ['18.500', 'plak Porto’da basıldı'],
    ],
  },
  room: {
    name: 'Nasıl kaydediyoruz',
    kicker: 'Nasıl kaydediyoruz',
    title: 'Tek oda, tek kayıt',
    items: [
      [
        'Grup birlikte çalıyor',
        'Üst kayıt yok, metronom yok: her şey sahnedeki gibi.',
      ],
      [
        'Doğrudan banda',
        '1974 yapımı makaralı teyp, her plağa o sıcak sesini veriyor.',
      ],
      [
        'Her albüme bir hafta',
        'Beş gün kayıt, iki gün miks: kararı oda veriyor.',
      ],
    ],
  },
  depot: {
    name: 'Sahnemiz',
    place: 'Tramvay Deposu, Lizbon',
    title: ['Işıklar', 'dokuzda yanar'],
    body: '1901’den kalma bir tramvay deposu, bugün kendi sahnemiz: demir bir çatının altında 1.400 kişilik ayakta alan.',
  },
  quote: {
    name: 'Bir sanatçının gözünden',
    text: 'Her şarkıyı, salon bizi bir şarkı daha için geri çağıracakmış gibi çalıyoruz. Bütün iş bu.',
    who: 'Amara Diallo',
    role: 'Şarkıcı ve gitarist, 2023’ten beri Night Tram’de',
  },
  stages: {
    name: '2027 sezonu',
    kicker: '2027 sezonu',
    title: 'Üç sahne, tek sezon',
    cards: [
      [
        'Plakta',
        'On iki albüm',
        'Yeşil Burun mornasından Kore cazına; hepsi canlı kayıt, hepsi vinil.',
      ],
      [
        'Sahnede',
        'On sekiz şehir',
        'Lizbon’dan Dakar’a, her gece açılışı yeni bir sanatçı yapıyor.',
      ],
      [
        'Sınıfta',
        'Altmış dört öğrenci',
        'Gençlere ücretsiz akşam dersleri: gitar, vokal, davul ve kayıt.',
      ],
    ],
    note: 'Her turne biletinden bir avro okula gidiyor.',
  },
  calendar: {
    name: 'Sezon',
    kicker: 'Durak durak',
    title: 'Sezon, marttan ekime',
    stops: [
      ['Mart', 'İlk plak', 'Maré Alta’nın tek gecede kaydedilen albümü.'],
      ['Mayıs', 'Kendi okulumuz', 'Dört prova odası altmış dört öğrenciye açılıyor.'],
      ['Temmuz', 'Depo Geceleri', 'Deponun avlusunda üç açık hava gecesi.'],
      ['Ekim', 'Yola çıkıyoruz', 'Turne Lizbon’da başlıyor ve on\u00a0sekiz şehri geziyor.'],
    ],
    note: 'Her plak önce vinil olarak çıkıyor, bir ay sonra da her yerde.',
  },
  making: {
    name: 'Demodan plağa',
    kicker: 'Bir plak yapmak',
    title: 'Beş adımda bir plak',
    steps: [
      ['Dinle', 'Her demo sonuna kadar'],
      ['Kaydet', 'Tek oda, canlı banda'],
      ['Miksle', 'Kulakla, iki günde'],
      ['Bas', 'Porto’da, 300 kopyadan'],
      ['Çal', 'Lansmanı depoda'],
    ],
    note: 'İlk dinlemeden lansman gecesine: dört ay.',
  },
  school: {
    name: 'Okul',
    kicker: 'Okul',
    title: 'Tek odadan bir topluluğa',
    before: [
      '2025',
      'On iki öğrenci, tek oda',
      'Ödünç aldığımız bir prova odasında haftada üç akşam ders, iki öğretmenle.',
    ],
    after: [
      '2027',
      'Altmış dört öğrenci, bir topluluk',
      'Kendimize ait dört oda, sekiz öğretmen ve turneyi açan bir gençlik topluluğu.',
    ],
  },
  growth: {
    name: 'Plaklar ve biletler',
    kicker: 'Vinil ve canlı',
    title: 'Plaklar da biletler de artışta',
    source: 'Basılan vinil plaklar ve satılan konser biletleri, bin adet, 2023–2026.',
    series: ['Vinil plaklar', 'Konser biletleri'],
    figures: [
      ['3 kat', '2023’e göre daha fazla plak basıldı.'],
      ['34.200', 'bilet 2026’da satıldı; en iyi sezonumuz.'],
    ],
  },
  tour: {
    name: 'Turne',
    kicker: 'Turne',
    title: 'On sekiz tarihten beşi',
    note: '2 Ekim – 28 Kasım 2027 arasında on sekiz konser; biletler 1 Şubat’tan itibaren satışta.',
    header: ['Şehir', 'Tarih', 'Kişi', 'Ana sanatçı', 'Açılış'],
    rows: [
      ['Lizbon', '2 Ekim', '1.400', 'Amara Diallo', 'Okulun topluluğu'],
      ['Porto', '6 Ekim', '900', 'Maré Alta', 'Tomás Reis'],
      ['Madrid', '10 Ekim', '1.100', 'Seo-yeon Park Trio', 'Mira Kaplan'],
      ['Paris', '15 Ekim', '1.600', 'Amara Diallo', 'Kofi Mensah'],
      ['Dakar', '7 Kasım', '2.000', 'Amara Diallo', 'Maré Alta'],
    ],
  },
  team: {
    name: 'Ekip',
    kicker: 'Ekip',
    title: 'Plakların arkasındaki insanlar',
    people: [
      ['Lizbon', 'Inês Carvalho', 'Kurucu, her demoyu hâlâ kendisi dinliyor'],
      ['Dakar', 'Moussa Ndiaye', 'Yapımcı, her albümü canlı olarak kaydediyor'],
      ['Seul', 'Ji-woo Han', 'Turne müdürü, 2027’de on\u00a0sekiz şehir'],
      ['Hayfa', 'Eitan Mizrahi', 'Okul müdürü, aynı zamanda gitar öğretmeni'],
    ],
  },
  closing: {
    name: 'Kapanış',
    kicker: 'Teşekkürler',
    title: ['Bir şarkı', 'daha?'],
    lines: [
      'Maré Alta’nın albümü 5 Mart 2027’de çıkıyor',
      'Turne biletleri 1 Şubat’tan itibaren satışta',
      'Okul başvuruları 15 Nisan’a kadar açık',
    ],
    meta: 'Night Tram Records · Tramvay Deposu, Lizbon',
  },
};
