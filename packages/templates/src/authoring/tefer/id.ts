import type { TeferCopy } from './copy';

export const id: TeferCopy = {
  footer: 'Ourela · Gugur–Dingin 2027',
  hero: {
    name: 'Pembukaan',
    org: 'Ourela · Mantel buatan Porto',
    title: ['Dibuat untuk', 'bertahan lama'],
    subtitle: ['Dua puluh empat mantel dari kain yang tak terjual di pabrik tenun'],
    meta: 'Presentasi untuk pembeli · Paris · 4 Maret 2027',
  },
  section: {
    name: 'Kain',
    part: 'Bagian satu',
    title: ['Kain'],
    subtitle: 'Dari mana setiap meter koleksi ini berasal.',
  },
  agenda: {
    name: 'Agenda',
    title: 'Di atas meja pagi ini',
    intro:
      'Empat puluh menit tentang koleksi dua puluh empat mantel: dari mana kainnya, bagaimana kami memotongnya hingga hampir tak ada yang tersisa di lantai, dan cara memesannya untuk musim gugur. Lalu mantelnya sendiri, di rak.',
    items: [
      ['Kain: ', '1.840 meter dari tiga pabrik tenun, dan mengapa 86% di antaranya kain sisa.'],
      ['Potongan: ', 'pola yang menyisakan 3% kain di lantai, bukan 15%.'],
      ['Bengkel jahit: ', 'tiga puluh satu jam kerja tangan di setiap mantel, di Porto.'],
      ['Pesanan: ', 'cara memesan untuk September, dan apa yang masih kami buat sesuai ukuran.'],
    ],
  },
  cloth: {
    name: 'Kain dalam angka',
    kicker: 'Kain dalam angka',
    title: 'Koleksi yang dipotong dari kain sisa',
    hero: {
      value: '86%',
      label: 'wol berasal dari stok mati',
      note: '1.582 dari 1.840 meter berasal dari stok tak terjual di gudang tiga pabrik tenun.',
    },
    others: [
      ['24', 'mantel dalam koleksi'],
      ['3', 'pabrik tenun: Biella, Huddersfield, dan Bursa'],
      ['31', 'jam kerja tangan di setiap mantel'],
    ],
  },
  cutting: {
    name: 'Potongan',
    kicker: 'Potong tanpa sisa',
    title: 'Cara memotong sebuah mantel',
    items: [
      [
        'Potongan yang saling mengunci',
        'Setiap pola dirancang agar potongannya saling mengisi di atas kain seperti teka-teki.',
      ],
      ['Sisa kain yang berguna', 'Sisanya menjadi saku, lapisan depan, dan kerah bawah.'],
      ['Satu penjahit, satu mantel', 'Setiap mantel dipotong dan dijahit oleh tangan yang sama.'],
    ],
  },
  workroom: {
    name: 'Bengkel jahit',
    place: 'Bengkel jahit · Porto',
    title: ['Dijahit di tempat', 'ia dipotong'],
    body: 'Dua belas penjahit, satu meja panjang, dan cahaya utara dari bekas pabrik pemintalan kapas.',
  },
  quote: {
    name: 'Dari bengkel',
    text: 'Sebuah mantel selesai di meja potong, jauh sebelum ada yang mengenakannya di atas runway.',
    who: 'Inês Moreira',
    role: 'Kepala bengkel jahit, Ourela',
  },
  cloths: {
    name: 'Tiga kain',
    kicker: 'Tiga kain',
    title: 'Kain-kain musim ini',
    cards: [
      [
        'Kain 01 · Huddersfield',
        'Tweed tulang ikan',
        'Wol tebal merah delima, ditenun untuk pesanan yang tak pernah diambil pembelinya.',
      ],
      [
        'Kain 02 · Biella',
        'Bouclé',
        'Benang ikal dari akhir satu produksi, cukup lembut untuk mantel tanpa furing.',
      ],
      [
        'Kain 03 · Bursa',
        'Melton',
        'Kepar loden yang padat dan dikempa, menahan hujan dan tak perlu dikelim.',
      ],
    ],
    note: 'Setiap mantel mencantumkan nama pabrik dan gulungan kainnya pada label di kerah.',
  },
  season: {
    name: 'Musim',
    kicker: 'Musim',
    title: 'Dari pabrik tenun ke toko',
    stops: [
      ['Jan 2027', 'Kain dipilih', 'Kami membeli 1.582 meter kain sisa dari tiga pabrik.'],
      ['Mar 2027', 'Pesanan dibuka', 'Dua puluh empat mantel diperlihatkan kepada pembeli di Paris.'],
      ['Jun 2027', 'Pemotongan dimulai', 'Setiap pesanan dipotong tangan di bengkel Porto.'],
      ['Sep 2027', 'Di toko', 'Mantel tiba di 40 toko, di 11 negara berbeda.'],
    ],
    note: 'Pesanan yang masuk hingga 30 April 2027 dikirim pada minggu pertama September.',
  },
  making: {
    name: 'Pembuatan',
    kicker: 'Cara membuat sebuah mantel',
    title: 'Tiga puluh satu jam, lima langkah',
    steps: [
      ['1 jam', 'Mengukur', 'Dua puluh dua ukuran, dengan tangan'],
      ['5 jam', 'Membuat pola', 'Pola yang digambar sesuai kain'],
      ['3 jam', 'Memotong', 'Gunting, kapur, dan meja panjang'],
      ['17 jam', 'Menjahit', 'Kanvas, jahitan, dan lengan pasang'],
      ['5 jam', 'Penyelesaian', 'Lubang kancing dijahit tangan'],
    ],
    note: 'Dari ukuran pertama hingga lubang kancing terakhir, satu mantel butuh tiga puluh satu jam.',
  },
  cut: {
    name: 'Potongan biasa, dan potongan kami',
    kicker: 'Mengapa tanpa sisa',
    title: 'Potongan biasa, dan potongan kami',
    before: [
      'Potongan biasa',
      '15% di lantai',
      'Potongan diletakkan satu per satu, dan celah di antaranya disapu di akhir hari.',
    ],
    after: [
      'Potongan Ourela',
      'Sisa kurang dari 3%',
      'Potongan saling mengisi di atas kain, dan setiap sisa dijahit kembali ke mantel.',
    ],
  },
  waste: {
    name: 'Sisa kain',
    kicker: 'Sisa kain per mantel',
    title: 'Makin sedikit kain di lantai tiap musim',
    source: 'Sisa kain per mantel, dalam persen, koleksi Gugur–Dingin 2023–2026.',
    series: ['Potongan biasa', 'Ourela'],
    figures: [
      ['3%', 'kain sebuah mantel tersisa pada 2026, turun dari 12% pada 2023.'],
      ['0,36 m', 'kain dihemat di setiap mantel dibanding potongan biasa.'],
    ],
  },
  mills: {
    name: 'Pabrik tenun',
    kicker: 'Pabrik tenun',
    title: 'Lima kain, tiga pabrik tenun',
    note: 'Kain yang dibeli pada Januari 2027 untuk koleksi Gugur–Dingin 2027.',
    header: ['Kain', 'Pabrik', 'Meter', 'Stok mati', 'Mantel'],
    rows: [
      ['Tweed tulang ikan', 'Huddersfield', '520', '100%', '7'],
      ['Bouclé', 'Biella', '380', '100%', '5'],
      ['Melton', 'Bursa', '460', '70%', '6'],
      ['Flanel', 'Biella', '220', '100%', '4'],
      ['Bulu unta', 'Huddersfield', '260', '54%', '2'],
    ],
  },
  team: {
    name: 'Bengkel jahit',
    kicker: 'Bengkel jahit',
    title: 'Tangan di balik koleksi ini',
    people: [
      ['Bengkel', 'Inês Moreira', 'Kepala bengkel, memotong mantel pertama tiap pola'],
      ['Desain', 'Aiko Mori', 'Desainer, menggambar setiap pola sesuai kainnya'],
      ['Pola', 'Kofi Asante', 'Pembuat pola, menata potongan di atas kain'],
      ['Kain', 'Omar Khalil', 'Pembeli kain, hafal gudang setiap pabrik tenun'],
    ],
  },
  closing: {
    name: 'Penutup',
    kicker: 'Terima kasih',
    title: ['Sampai jumpa', 'di ruang pas'],
    lines: [
      'Pesanan dibuka hingga 30 April 2027',
      'Showroom di Porto, dengan janji temu',
      'Semua mantel ada di rak, siap dicoba',
    ],
    meta: 'Ourela · Mantel dari sisa wol',
  },
};
