import type { DofekCopy } from './copy';

export const tr: DofekCopy = {
  footer: 'Sahil İlçesi Sağlık Müdürlüğü · Bilgilendirme 2027',
  hero: {
    name: 'Açılış',
    org: 'Sahil İlçesi Sağlık Müdürlüğü · Halk sağlığı bilgilendirmesi',
    title: ['Bir kalp için', 'dört dakika'],
    subtitle: ['640.000 nüfuslu bir ilçe, ambulanstan önce', 'harekete geçmeyi nasıl öğrendi'],
    meta: 'İlçe meclisine bilgilendirme · 15 Nisan 2027',
  },
  agenda: {
    name: 'Gündem',
    title: 'Bugün neleri konuşacağız',
    intro:
      'Yirmi dakika boyunca programın neleri değiştirdiğini, bugün sokakta bir kalp durduğunda neler olduğunu ve 2027 için meclisten ne istediğimizi anlatacağız. Ardından sorularınızı yanıtlayacağız.',
    items: [
      ['Rakamlar: ', 'hastane dışında kalbi duran kişiler için neler değişti.'],
      ['Sokakta: ', 'komşular, gönüllüler ve defibrilatörler artık nasıl birlikte çalışıyor.'],
      ['İnsanlar: ', 'programı yürüten ekip ve yanındaki gönüllüler.'],
      ['Gelecek yıl: ', 'meclisten ne istiyoruz, hangi tarihe kadar.'],
    ],
  },
  section: {
    name: 'İlk dakikalar',
    part: 'Birinci bölüm',
    title: ['İlk', 'dakikalar'],
    subtitle: 'Ambulans gelmeden önceki dakikalar, kimin evine döneceğini belirler.',
  },
  figures: {
    name: 'Rakamlarla yıl',
    kicker: 'Rakamlarla yıl',
    title: 'Dört rakamla 2026',
    hero: {
      value: '72',
      label: 'kişi kalbi durduktan sonra evine döndü',
      note: 'Programdan önceki yıl olan 2023’ün iki katı.',
    },
    others: [
      ['6 dk', 'ilk şoka kadar, önceden 11'],
      ['920', 'haritada halka açık defibrilatör'],
      ['58.000', 'KPR eğitimi almış sakin'],
    ],
  },
  change: {
    name: 'Önce ve sonra',
    kicker: 'Ne değişti',
    title: 'Beklemekten harekete',
    before: [
      '2023',
      'Ambulansı beklemek',
      'Görenler arayıp bekliyordu. Her üç hastadan ikisine, sağlık ekibi ortalama on bir dakika sonra gelene kadar KPR yapılmıyordu.',
    ],
    after: [
      '2026',
      'İlk dakikalarda harekete geçmek',
      'Komşular KPR’ye başlıyor, bir gönüllü defibrilatörü getiriyor. İlk şok on birinci değil, altıncı dakikada yapılıyor.',
    ],
  },
  chain: {
    name: 'Hayatta kalma zinciri',
    kicker: 'Hayatta kalma zinciri',
    title: 'Adım adım ilk sekiz dakika',
    steps: [
      ['00:00', 'Arama', '112 görevlisi hatta kalır'],
      ['00:30', 'Uyarı', '500 metre içindeki gönüllüler'],
      ['01:00', 'Kalp masajı', 'Yardım gelene kadar KPR'],
      ['04:00', 'Şok', 'En yakın halka açık defibrilatör'],
      ['08:00', 'Devir', 'Sağlık ekibi devralır'],
    ],
    note: 'Her vaka bir hafta içinde, olay yerine giden gönüllülerle birlikte değerlendirilir.',
  },
  responders: {
    name: 'Nöbetteki gönüllüler',
    kicker: 'Nöbetteki gönüllüler',
    title: 'Yardım bir sokak ötede',
    items: [
      ['Saniyeler içinde uyarı', 'Bir uygulama, çağrı yerine 500 metreden yakın olan eğitimli gönüllüleri anında uyarır.'],
      ['Defibrilatör yolda', 'İkinci bir gönüllü en yakın halka açık defibrilatörü getirir.'],
      ['Sirenden önce orada', 'On vakanın altısında hastaya ilk ulaşan bir gönüllü oldu.'],
    ],
  },
  park: {
    name: 'Parkta',
    place: 'Nehir Kıyısı Parkı, Sahil İlçesi',
    title: ['Parkta iki saat,', 'ömür boyu bir beceri'],
    body: 'Her ay, her yaştan sakin parkta birlikte KPR öğreniyor. Bugüne kadar 58.000 kişi öğrendi.',
  },
  quote: {
    name: 'Hayata dönen birinin sözleri',
    text: 'Otobüs beklerken kalbim durdu. Bir komşu koşarak defibrilatörü getirene dek, tanımadığım biri kalbimi elleriyle\u00a0çalıştırdı.',
    who: 'Elif Kaya',
    role: 'Eski Şehir’den bir müzik öğretmeni, bugün kendisi de gönüllü',
  },
  programmes: {
    name: 'Programlar',
    kicker: 'Üç program',
    title: 'Program neler yapıyor',
    cards: [
      [
        'Program 01',
        'Herkes için KPR',
        'Okullarda, iş yerlerinde ve mahalle salonlarında iki saatlik ücretsiz dersler.',
      ],
      [
        'Program 02',
        'Nöbetteki gönüllüler',
        'Ambulans çağrıldığı anda, yakındaki eğitimli gönüllülere de uyarı gider.',
      ],
      [
        'Program 03',
        'Her sokakta defibrilatör',
        'Haritada işaretli, her ay kontrol edilen 920 halka açık defibrilatör.',
      ],
    ],
    note: 'Ambulans servisi, okullar ve belediyelerle birlikte yürütülür.',
  },
  milestones: {
    name: 'Dönüm noktaları',
    kicker: 'Dönüm noktaları',
    title: 'Dört yıl, dört adım',
    stops: [
      ['2024', 'Okulda KPR', '38 lisenin hepsinde dersler başlar.'],
      ['2025', 'Uyarı uygulaması', 'Uygulama 1.200 gönüllüyle yayına girer.'],
      ['2026', '920 defibrilatör', 'Her biri haritada, her ay kontrol edilir.'],
      ['2027', 'On yaşından itibaren', 'Tüm ilkokullarda KPR dersleri başlar.'],
    ],
    note: 'Hayata dönenler ve ambulans ekipleriyle birlikte seçildi.',
  },
  trend: {
    name: 'Sonuçlar',
    kicker: 'Sonuçlar',
    title: 'Daha çok KPR, daha çok hayat',
    source:
      'Hastane dışı kalp durmalarında oran, yüzde, 2023–2026. İlçe kalp durması kayıt sistemi.',
    series: ['Ambulanstan önce KPR', 'Hastaneden eve dönüş'],
    figures: [
      ['%67', 'hastaya 2026’da olayı görenlerce KPR yapıldı; 2023’te %36’ydı.'],
      ['%16', 'hastaneden evine döndü; 2023’ün iki katı.'],
    ],
  },
  areas: {
    name: 'Beş bölge',
    kicker: 'Beş bölge',
    title: 'Her bölge ne durumda',
    note: '2026 verileri, ilçe kalp durması kayıt sistemi, Ocak 2027.',
    header: ['Bölge', 'Defibrilatör', 'Eğitimli sakin', 'Ambulanstan önce KPR', 'İlk şok'],
    rows: [
      ['Liman', '240', '16.200', '%72', '5 dk'],
      ['Eski Şehir', '210', '13.900', '%70', '5 dk'],
      ['Kuzey Tarlaları', '180', '11.400', '%66', '6 dk'],
      ['Nehir Kıyısı', '170', '10.300', '%63', '7 dk'],
      ['Dağ Köyleri', '120', '6.200', '%58', '9 dk'],
    ],
  },
  team: {
    name: 'Ekip',
    kicker: 'Program ekibi',
    title: 'Dört dakikanın arkasındaki insanlar',
    people: [
      ['Kardiyoloji', 'Dr. Amara Mensah', 'Kardiyolog, programın klinik sorumlusu'],
      ['Ambulans servisi', 'Tomás Herrera', 'Baş paramedik, komuta merkezini yönetir'],
      ['Gönüllüler', 'Noa Katz', 'Hemşire, gönüllüleri eğitir ve destekler'],
      ['Kayıt sistemi', 'Kenji Morita', 'Epidemiyolog, kalp durması kayıtlarını tutar'],
    ],
  },
  closing: {
    name: 'Kapanış',
    kicker: 'Teşekkürler',
    title: ['Her dakika', 'önemli'],
    lines: [
      'Nehir Kıyısı Parkı’nda her ay ücretsiz KPR dersleri',
      'Sonraki bilgilendirme: 14 Ekim 2027, İlçe Konağı',
      'İlçedeki her sağlık merkezinde gönüllü olabilirsiniz',
    ],
    meta: 'Sahil İlçesi Sağlık Müdürlüğü · Dört Dakika programı',
  },
};
