import type { RakiaCopy } from './copy';

export const tr: RakiaCopy = {
  footer: 'Meridian Peak Gözlemevi · İlk ışık 2027',
  hero: {
    name: 'Açılış',
    org: 'Meridian Peak Gözlemevi · İlk ışık brifingi',
    title: ['İlk', 'ışık'],
    subtitle: ['2,4 metrelik teleskop gece göğüne gözünü açıyor'],
    meta: 'Meridian Peak · 2.410 metre · 12 Mart 2027',
  },
  section: {
    name: 'Teleskop',
    part: 'Birinci bölüm',
    title: ['Teleskop'],
    subtitle: 'Bir taslaktan bir aynaya on iki yıl.',
  },
  agenda: {
    name: 'Bu akşam',
    title: 'Bu akşam, dört bölümde',
    intro:
      'Bu hafta ilk yıldız ışığını alan teleskop üzerine kırk dakika: ilk sezonunda neleri gözlemleyeceği ve her ortak üniversitenin gecelerini nasıl paylaşacağı. Ardından kubbeyi açıyoruz.',
    items: [
      ['Teleskop: ', 'ilk taslaktan cilalı 2,4 metrelik aynaya uzanan on iki yıl.'],
      ['Gözlem yeri: ', 'Meridian Peak neden ölçtüğümüz her yerden daha karanlık ve durgun.'],
      ['İlk sezon: ', 'üç araştırma programı ve ilk gözlemleyecekleri gök cisimleri.'],
      ['Gecelerin paylaşımı: ', 'bir ortak nasıl gözlem zamanı ister, halk nasıl katılır.'],
    ],
  },
  figures: {
    name: 'Rakamlarla',
    kicker: 'Rakamlarla teleskop',
    title: 'On altı kat daha fazla ışık',
    hero: {
      value: '16×',
      label: 'daha fazla ışık, eski 60 cm’lik teleskopa göre',
      note: 'Dört kat geniş bir ayna on altı kat fazla ışık toplar: sönük bir gökada saatler değil, dakikalar alır.',
    },
    others: [
      ['2,4 m', 'ana aynanın çapı'],
      ['2.410 m', 'deniz seviyesinden, pusun üstünde'],
      ['291', 'yılda ortalama açık gece'],
    ],
  },
  mirror: {
    name: 'Ayna',
    kicker: 'Kubbenin içinde',
    title: 'İki yıl cilalanan bir ayna',
    items: [
      ['Tek parça döküldü', 'Cam, çatlamasın diye kalıbında üç ay boyunca soğudu.'],
      ['18 nanometre hassasiyet', 'Yüzeyin kusursuz eğriden sapması, bir saç telinin binde birinden azdır.'],
      [
        'Alüminyum değil, gümüş',
        'Gümüş kaplama, soğuk yıldızların en parlak olduğu kızılötesini daha iyi yansıtır.',
      ],
    ],
  },
  site: {
    name: 'Gözlem yeri',
    place: 'Meridian Peak, 2.410 metre',
    title: ['Ölçtüğümüz her yerden', 'daha karanlık'],
    body: 'Beş yıllık yer testleri neredeyse hiç şehir ışığı bulmadı; hava ise çoğu gece keskin yıldızlar için yeterince durgun.',
  },
  quote: {
    name: 'İlk ışıkta',
    text: 'On iki yıl boyunca tek bir an için bir makine yaptık: aynasına düşen ilk yıldız ışığı için.',
    who: 'Amara Okafor',
    role: 'Meridian Peak Gözlemevi Müdürü',
  },
  programmes: {
    name: 'İlk sezon',
    kicker: 'Üç araştırma programı',
    title: 'İlk önce neye bakıyoruz',
    cards: [
      [
        'Program 01',
        'Başka dünyalar',
        'Bir gezegen önünden geçerken yıldızın ışığında beliren hafif düşüşü ölçmek.',
      ],
      [
        'Program 02',
        'Dünya’ya yakın asteroitler',
        'Küçük asteroitleri erken bulmak ve yörüngelerini günler içinde belirlemek.',
      ],
      [
        'Program 03',
        'Zonklayan yıldızlar',
        'Parlaklığı artıp azalan yıldızları izlemek: kozmik uzaklıkların cetvelleri.',
      ],
    ],
    note: 'Her program gecelerini ortak üniversitelerle, verilerini ise bir yıl sonra herkesle paylaşır.',
  },
  milestones: {
    name: 'Kilometre taşları',
    kicker: 'Camdan yıldız ışığına',
    title: 'Dört yıl, dört kilometre taşı',
    stops: [
      ['2024', 'Ayna dökülüyor', 'Cilalama başlamadan önce cam üç ay boyunca soğur.'],
      ['2025', 'Kubbe yükseliyor', '14 metrelik kubbe zirvede tek bir sezonda kurulur.'],
      ['2026', 'Optik geliyor', 'Cilalı ayna dağ yolunu yürüme hızında tırmanır.'],
      ['2027', 'İlk ışık', 'Teleskop 12 Mart’ta gökyüzünün ilk görüntüsünü alır.'],
    ],
    note: 'Ayna bu dört yılın ikisini cilalama makinesinde geçirdi.',
  },
  nights: {
    name: 'Gecelerin paylaşımı',
    kicker: 'Geceler nasıl paylaşılır',
    title: 'Bir sorudan bir görüntüye, beş adımda',
    steps: [
      ['Başvuru', 'Bir ortak gece ister'],
      ['Değerlendirme', 'Bir kurul talepleri sıralar'],
      ['Planlama', 'Geceler Ay’a göre seçilir'],
      ['Gözlem', 'Teleskop şafağa dek çalışır'],
      ['Paylaşım', 'Veri önce ortağa, sonra herkese'],
    ],
    note: 'Başvurular yılda iki kez açılır; onaylanan programların çoğu altı hafta içinde gözleme başlar.',
  },
  views: {
    name: 'Eski ve yeni',
    kicker: 'Gökyüzünün aynı parçası',
    title: 'On altı kat ışık neler gösteriyor',
    before: [
      '1998’den beri',
      '60 santimetrelik teleskop',
      'Bir saatlik pozdan sonra: sönük bir gökada lekesi ve birkaç düzine yıldız.',
    ],
    after: [
      '2027’den itibaren',
      '2,4 metrelik teleskop',
      'Dört dakika sonra: gökadanın sarmal kolları ve yüzlerce yıldız.',
    ],
  },
  clear: {
    name: 'Açık geceler',
    kicker: 'Beş yıllık yer testleri',
    title: 'Mevsim mevsim açık geceler',
    source: 'Altı saat ve daha uzun açık kalan geceler; 2022–2026 yer testlerinin ortalaması.',
    seasons: ['Kış', 'İlkbahar', 'Yaz', 'Sonbahar'],
    series: ['Açık geceler', 'Keskin görüş geceleri'],
    figures: [
      ['291', 'yılda açık gece: her beş geceden dördü.'],
      ['0,7″', 'havanın bir yıldızda yarattığı tipik bulanıklık; eski yerimizin yarısı.'],
    ],
  },
  targets: {
    name: 'İlk hedefler',
    kicker: 'İlk sezon',
    title: 'İlk geceler için beş gök cismi',
    note: 'Geceler Mart–Haziran 2027 arasında planlandı; uzaklıklar yuvarlatıldı.',
    header: ['Gök cismi', 'Tür', 'Işık yılı', 'Gece', 'Program'],
    rows: [
      ['Orion Bulutsusu', 'Yıldız doğum bulutu', '1.350', '3', 'İlk ışık'],
      ['Arı Kovanı Kümesi', 'Yıldız kümesi', '577', '5', 'Kalibrasyon'],
      ['Girdap Gökadası', 'Sarmal gökada', '23 milyon', '8', 'Halka açık geceler'],
      ['Delta Cephei', 'Zonklayan yıldız', '890', '10', 'Zonklayan yıldızlar'],
      ['55 Cancri', 'Beş gezegenli yıldız', '41', '12', 'Başka dünyalar'],
    ],
  },
  team: {
    name: 'Ekip',
    kicker: 'Teleskobun başında',
    title: 'İlk ışığın arkasındaki insanlar',
    people: [
      ['Yönetim', 'Amara Okafor', 'Müdür; projeyi ilk taslaktan beri yönetiyor'],
      ['Optik', 'Tomás Arriaga', 'Optik mühendisi; iki yıllık cilalamayı yönetti'],
      ['Veri', 'Hana Sato', 'Veri bilimci; her geceden temiz görüntüler çıkarıyor'],
      ['Halka açık geceler', 'Yonatan Levi', 'Eğitimci; okulları ve ziyaretçileri kubbeye taşıyor'],
    ],
  },
  closing: {
    name: 'Kapanış',
    kicker: 'Teşekkürler',
    title: ['Açık', 'gökler'],
    lines: [
      'Halka açık ilk ışık gecesi: 13 Mart 2027 Cumartesi',
      'Meridian Peak ziyaretçi merkezi, gün batımından itibaren',
      'Ortakların gece başvuruları 1 Nisan 2027’de açılıyor',
    ],
    meta: 'Meridian Peak Gözlemevi · Deniz seviyesinden 2.410 metre',
  },
};
