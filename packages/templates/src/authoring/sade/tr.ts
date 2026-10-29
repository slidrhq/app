import type { SadeCopy } from './copy';

export const tr: SadeCopy = {
  footer: 'Commonfield · 2026 Hasat Raporu',
  hero: {
    name: 'Açılış',
    org: 'Commonfield · Üretici kooperatifi',
    title: ['Derin kökler,', 'dolu silolar'],
    subtitle: ['212 aile çiftliği daha az suyla', 'nasıl daha çok tahıl yetiştirdi'],
    meta: 'Üyeler genel kurulu · 14 Ocak 2027',
  },
  section: {
    name: 'Sezon',
    part: 'Birinci bölüm',
    title: ['Tarlada', 'bir sezon'],
    subtitle: 'İlk yağmurdan siloya boşaltılan son yüke kadar.',
  },
  agenda: {
    name: 'Gündem',
    title: 'Bu sabah neleri konuşacağız',
    intro:
      '2026 hasadı üzerine kırk dakika: neler yetiştirdik, ne kadar su harcadık ve toprak bize neler anlattı. Ardından 2027 sezonunun planı ve sorularınız için ayrılan zaman.',
    items: [
      ['Hasat: ', '212 çiftlikten 18.400 ton tahıl ve bu tahılın nereye gittiği.'],
      ['Su: ', 'damla sulama ve örtü bitkileri bir ton tahılın suyunu nasıl azalttı.'],
      ['Toprak: ', 'üç yıllık analizler tarlalarımızın altında neler gösteriyor.'],
      ['2027 sezonu: ', 'tohum bankası, ortak makineler ve takvim.'],
    ],
  },
  figures: {
    name: 'Rakamlarla hasat',
    kicker: 'Rakamlarla hasat',
    title: 'Dört rakamla 2026',
    hero: {
      value: '18.400',
      label: 'ton tahıl hasat edildi',
      note: '2025’e göre %12 daha fazla; aynı 9.600 hektardan, daha az suyla.',
    },
    others: [
      ['212', 'kooperatifteki aile çiftliği'],
      ['9.600', 'hektar ekili alan'],
      ['%31', '2023’e göre ton başına daha az su'],
    ],
  },
  project: {
    name: 'Yılın projesi',
    kicker: 'Yılın projesi · Damla sulama',
    title: 'Su köke gitsin, karığa değil',
    items: [
      [
        'Her sıraya bir hat',
        '1.400 hektara gömülü hatlar her sırayı kökünden sular; kaybın en az olduğu gece saatlerinde.',
      ],
      [
        'Topraktaki sensörler',
        '30 ve 60 cm derinlikteki nem sondaları pompalara ne zaman sulayacaklarını, ne zaman bekleyeceklerini söyler.',
      ],
      [
        'Üç sezonda kendini ödüyor',
        'Ortak pompalar ve toptan alınan borular her çiftliğin maliyetini yarıya indiriyor; kalanını tasarruf edilen su karşılıyor.',
      ],
    ],
  },
  fields: {
    name: 'Yukarıdan',
    place: 'Kuzey tarlaları, drondan',
    title: ['Her tarla,', 'her hafta, yukarıdan'],
    body: 'Dronumuz her hafta 9.600 hektarın tamamını haritalıyor; ziraat mühendisi kuru bir lekeyi yoldan görülmeden önce fark ediyor.',
  },
  quote: {
    name: 'Bir üyenin gözünden',
    text: 'Dedem bu tarlayı her sonbahar sürerdi. Biz bıraktık; şimdi toprak yağmuru hiçbirimizin hatırlamadığı kadar uzun süre tutuyor.',
    who: 'Omar Khalil',
    role: '80 hektarda makarnalık buğday yetiştiriyor, 1998’den beri üye',
  },
  programmes: {
    name: 'Programlar',
    kicker: 'Üç program',
    title: 'Birlikte yaptıklarımız',
    cards: [
      [
        'Program 01',
        'Örtü bitkileri',
        'Hasatlar arasında fiğ ve yonca toprağı besler, rüzgârın onu savurmasını önler.',
      ],
      [
        'Program 02',
        'Damla sulama',
        'Ortak pompalar, toptan borular ve bir çiftliği tek haftada donatan ortak bir ekip.',
      ],
      [
        'Program 03',
        'Tohum bankası',
        'Deneme parsellerimizde sınanan ve her ekimde üyelere ödünç verilen kırk yerel çeşit.',
      ],
    ],
    note: 'Her üye çiftlik her programa katılabilir; ilk sezonun maliyetini kooperatif üstlenir.',
  },
  season: {
    name: 'Gelecek sezon',
    kicker: '2027 sezonu',
    title: 'Önümüzdeki yıl, mevsim mevsim',
    stops: [
      ['Kış', 'Tohum bankası açılıyor', 'Üyeler bir sonraki ekim için çeşitlerini ayırtıyor.'],
      ['İlkbahar', 'Damla sulama genişliyor', 'Altmış çiftlik daha ortak pompalara bağlanıyor.'],
      ['Yaz', 'Hasat', 'Ortak biçerdöverler tek bir takvimle çalışıyor.'],
      ['Sonbahar', 'Ekim', 'Örtü bitkileri yerini buğdaya ve nohuta bırakıyor.'],
    ],
    note: 'Her tarih, her sezonun başında üyelerle birlikte belirlenir.',
  },
  joining: {
    name: 'Geçiş',
    kicker: 'Geçişe katılmak',
    title: 'Bir çiftlik beş adımda nasıl geçiş yapar',
    steps: [
      ['Toprak analizi', 'Her tarladan numune'],
      ['Tarla planı', 'Ziraat mühendisiyle'],
      ['Örtü bitkisi', 'Hasattan sonra ekilir'],
      ['Damla hatları', 'Ortak ekip döşer'],
      ['İlk hasat', 'Tartılır, karşılaştırılır'],
    ],
    note: 'İlk toprak analizinden yeni plana göre yapılan ilk hasada kadar yaklaşık on dört ay geçer.',
  },
  soil: {
    name: 'Tarlalarımızın altında',
    kicker: 'Neden sürmeyi bıraktık',
    title: 'Aynı toprak, iki ayrı yöntem',
    before: [
      '2023’e kadar',
      'Her sonbahar sürüm',
      '25 cm derinlikte sert bir taban oluştu. Yağmur çıplak yüzeyden akıp gitti, kökler bu tabanda durdu.',
    ],
    after: [
      '2024’ten beri',
      'Sürümsüz, örtü bitkileriyle',
      'Kökler artık 90 cm’ye iniyor ve solucanlar geri döndü. Aynı toprak iki kat yağmur emiyor.',
    ],
  },
  water: {
    name: 'Su',
    kicker: 'Su',
    title: 'Her ton için daha az su',
    source: 'Ton tahıl başına metreküp sulama suyu, 2023–2026.',
    series: ['Commonfield çiftlikleri', 'Bölge ortalaması'],
    figures: [
      ['%31', '2023’ten beri, 212 çiftlikte ton başına daha az su.'],
      ['359', '2026’da ton başına metreküp; bölge hâlâ 524 kullanıyor.'],
    ],
  },
  crops: {
    name: 'Ürünler',
    kicker: 'Ürünler',
    title: '2026 hasadının beş ürünü',
    note: '2026 verileri; kooperatifin kantarından ve tarla kayıtlarından.',
    header: ['Ürün', 'Hektar', 'Ton', 'Hektar başına ton', 'Su, ton başına m³'],
    rows: [
      ['Makarnalık buğday', '4.200', '9.240', '2,2', '340'],
      ['Arpa', '2.100', '4.410', '2,1', '300'],
      ['Nohut', '1.600', '2.240', '1,4', '410'],
      ['Mercimek', '900', '1.080', '1,2', '380'],
      ['Ayçiçeği', '800', '1.430', '1,8', '570'],
    ],
  },
  team: {
    name: 'Ekip',
    kicker: 'Kooperatifin ekibi',
    title: 'Hasadın arkasındaki insanlar',
    people: [
      ['Yönetim kurulu başkanı', 'Nadia Haddad', '64 hektarlık arazisinde buğday ve nohut yetiştiriyor'],
      ['Baş ziraat mühendisi', 'Tomás Ferreira', 'Toprak laboratuvarını ve dron taramasını yönetiyor'],
      ['Su mühendisi', 'Kwame Asante', 'Ortak damla sulama ağını baştan sona tasarladı'],
      ['Tohum bankası sorumlusu', 'Mei Lin', 'Deneme parsellerinde kırk yerel çeşidi sınıyor'],
    ],
  },
  closing: {
    name: 'Kapanış',
    kicker: 'Teşekkürler',
    title: ['Tarlada', 'görüşmek üzere'],
    lines: [
      'Deneme parsellerinde tarla günü: 22 Nisan 2027',
      'Tohum rezervasyonları 1 Şubat 2027’de açılıyor',
      'Raporun tamamı her üye çiftliğin bürosunda',
    ],
    meta: 'Commonfield · Üretici kooperatifi',
  },
};
