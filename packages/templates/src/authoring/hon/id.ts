import type { HonCopy } from './copy';

export const id: HonCopy = {
  footer: 'Larkfield Mutual · Hasil tahunan 2026',
  hero: {
    name: 'Pembukaan',
    org: 'Larkfield Mutual · Hasil tahunan 2026',
    title: ['Modal yang tetap', 'dekat rumah'],
    subtitle: ['Setahun sebuah bank yang dimiliki', 'oleh 412.000 anggotanya'],
    meta: 'Rapat Anggota Tahunan · 18 Maret 2027',
  },
  agenda: {
    name: 'Agenda',
    title: 'Agenda malam ini',
    intro:
      'Empat puluh menit tentang tahun 2026 bank milik Anda: berapa yang kami pinjamkan, berapa yang kami simpan sebagai modal, dan apa yang kembali kepada Anda sebagai anggota. Lalu pemungutan suara dan pertanyaan Anda.',
    items: [
      ['Angka tahun ini: ', 'kredit, modal, dan apa yang kembali ke anggota.'],
      ['Rumah hijau: ', 'pinjaman renovasi yang tumbuh paling cepat tahun ini.'],
      ['Tabungan Anda bekerja: ', 'bagaimana simpanan menjadi pinjaman bagi tetangga, dalam lima langkah.'],
      ['Pemungutan suara: ', 'pengurus, auditor, dan dividen anggota.'],
    ],
  },
  section: {
    name: 'Angka tahun ini',
    part: 'Bagian satu',
    title: ['Angka tahun ini'],
    subtitle: 'Kredit tumbuh, dan modal tumbuh lebih cepat.',
  },
  figures: {
    name: 'Empat angka',
    kicker: 'Angka tahun ini',
    title: '2026 dalam empat angka',
    hero: {
      value: '€1,84 miliar',
      label: 'dipinjamkan untuk rumah dan usaha anggota',
      note: 'Naik 12% dari 2025, dan tiap euronya didanai tabungan anggota sendiri.',
    },
    others: [
      ['412.000', 'anggota, 23.300 lebih banyak dari setahun lalu'],
      ['19,2%', 'rasio modal inti, dari 10,5% yang diwajibkan'],
      ['€22 juta', 'kembali ke anggota lewat bunga yang lebih baik'],
    ],
  },
  savings: {
    name: 'Tabungan dan pinjaman',
    kicker: 'Tabungan dan kredit',
    title: 'Pinjaman dari tabungan anggota',
    source: 'Saldo akhir tahun, miliar €, 2023–2026.',
    series: ['Tabungan anggota', 'Pinjaman ke anggota'],
    figures: [
      ['81%', 'tabungan anggota dipinjamkan kembali ke anggota; sisanya disimpan sebagai margin aman.'],
      ['+21%', 'pertumbuhan tabungan sejak 2023, tanpa satu euro pun dipinjam dari pasar.'],
    ],
  },
  lines: {
    name: 'Lima pos',
    kicker: 'Neraca',
    title: 'Di mana uang anggota berada',
    note: 'Saldo per 31 Desember 2026; suku bunga adalah rata-rata yang diterima atau dibayar anggota sepanjang tahun.',
    header: ['Pos', 'Saldo, juta €', 'Perubahan', 'Anggota', 'Bunga rata-rata'],
    rows: [
      ['Rekening tabungan', '4.120', '+6%', '351.000', '2,1%'],
      ['Deposito berjangka', '2.180', '+9%', '96.000', '3,0%'],
      ['Kredit rumah', '3.690', '+5%', '41.500', '3,4%'],
      ['Kredit usaha kecil', '1.050', '+11%', '8.200', '5,2%'],
      ['Kredit renovasi hijau', '360', '+64%', '6.900', '2,9%'],
    ],
  },
  profit: {
    name: 'Ke mana laba pergi',
    kicker: 'Laba 2026',
    title: 'Ke mana laba €58 juta pergi',
    cards: [
      [
        '€22 juta · 38%',
        'Kembali ke anggota',
        'Sepanjang tahun, bunga tabungan dan pinjaman lebih baik dari pasar.',
      ],
      [
        '€31 juta · 53%',
        'Disimpan sebagai modal',
        'Setiap euro yang disimpan memperkuat bank dan menambah pinjaman tahun depan.',
      ],
      [
        '€5 juta · 9%',
        'Dana komunitas',
        'Hibah untuk 140 proyek lokal pilihan suara anggota.',
      ],
    ],
    note: 'Bank milik anggota tidak punya pemegang saham luar yang harus dibayar, jadi seluruh laba tetap pada anggotanya.',
  },
  owners: {
    name: 'Mengapa bank anggota',
    kicker: 'Mengapa bank milik anggota',
    title: 'Pemegang saham atau anggota',
    before: [
      'Bank yang tercatat di bursa',
      'Laba meninggalkan kota',
      'Pemegang saham menerima dividen di mana pun mereka tinggal. Direksi tunduk pada harga saham, dan cabang ditutup begitu tidak lagi menguntungkan.',
    ],
    after: [
      'Larkfield Mutual',
      'Laba tetap pada anggota',
      'Setiap anggota punya satu suara, berapa pun saldonya; laba kembali kepadanya lewat bunga yang lebih baik, dan cabang di kotanya tetap buka.',
    ],
  },
  homes: {
    name: 'Rumah hijau',
    kicker: 'Pos yang tumbuh tercepat · Rumah hijau',
    title: 'Pinjaman penghemat energi',
    items: [
      [
        '6.900 rumah direnovasi',
        'Insulasi, pompa panas, dan atap surya dengan bunga 2,9%, di bawah bunga kredit rumah biasa kami.',
      ],
      [
        'Sepertiga lebih hemat energi',
        'Setelah renovasi, rumah anggota rata-rata memakai energi 31% lebih sedikit.',
      ],
      [
        'Konsultasi sebelum pinjaman',
        'Seorang auditor energi mengunjungi setiap rumah lebih dulu, dan bank yang membayar kunjungannya.',
      ],
    ],
  },
  street: {
    name: 'Dekat rumah',
    place: 'Jalan Utama, Larkfield',
    title: ['Semua pinjaman', 'dalam 20 km'],
    body: 'Kami hanya meminjamkan di tempat anggota tinggal dan bekerja, agar tabungan mereka membangun jalan yang mereka lalui setiap hari.',
  },
  quote: {
    name: 'Suara anggota',
    text: 'Yang berkata ya di bank sudah mengenal jalan kami. Kini pinjaman itu menjadi empat oven dan sebelas lapangan kerja.',
    who: 'Amara Osei',
    role: 'Pembuat roti, anggota sejak 2012',
  },
  lending: {
    name: 'Tabungan bekerja',
    kicker: 'Cara kami meminjamkan',
    title: 'Tabungan jadi pinjaman tetangga',
    steps: [
      ['Menabung', 'Anggota membuka rekening tabungan'],
      ['Menghimpun', 'Tabungan tetap di kota, tak diperdagangkan'],
      ['Menilai', 'Penasihat lokal menemui peminjam'],
      ['Meminjamkan', 'Keputusan dalam sepuluh hari kerja'],
      ['Mengembalikan', 'Bunga kembali kepada penabung'],
    ],
    note: 'Setiap pinjaman diputuskan di Larkfield oleh orang yang tinggal di sini, tidak pernah oleh model kredit yang jauh semata.',
  },
  history: {
    name: 'Sejarah kami',
    kicker: 'Sembilan puluh enam tahun',
    title: 'Tumbuh, anggota demi anggota',
    stops: [
      ['1931', 'Didirikan buruh pelabuhan', 'Dua ratus keluarga menghimpun upah untuk saling meminjamkan.'],
      ['1974', 'Kredit rumah pertama', 'Anggota mulai membeli rumah yang puluhan tahun mereka sewa.'],
      ['2009', 'Tanpa dana talangan', 'Melewati krisis keuangan tanpa satu sen pun uang publik.'],
      ['2026', '412.000 anggota', 'Tahun dengan pertumbuhan tercepat dalam dua dekade.'],
    ],
    note: 'Dalam 96 tahun, bank ini tak pernah membayar pemegang saham luar, karena memang tak pernah punya.',
  },
  team: {
    name: 'Tim eksekutif',
    kicker: 'Tim eksekutif',
    title: 'Bertanggung jawab kepada Anda',
    people: [
      ['Direktur utama', 'Margit Lindqvist', 'Bergabung sebagai teller cabang pada 1994'],
      ['Keuangan', 'Kwame Asante', 'Direktur keuangan, menjaga modal tetap kuat'],
      ['Risiko', 'Priya Raman', 'Direktur risiko, menyetujui setiap pinjaman besar'],
      ['Anggota', 'Tomás Herrera', 'Memimpin 26 cabang dan dewan anggota'],
    ],
  },
  closing: {
    name: 'Penutup',
    kicker: 'Terima kasih',
    title: ['Bank Anda,', 'suara Anda'],
    lines: [
      'Pemungutan suara dibuka malam ini dan ditutup 25 Maret 2027',
      'Hasil diumumkan di setiap cabang pada 26 Maret 2027',
      'Pertanyaan untuk dewan anggota, di cabang mana pun',
    ],
    meta: 'Larkfield Mutual · Milik anggotanya sejak 1931',
  },
};
