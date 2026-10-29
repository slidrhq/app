import type { DofekCopy } from './copy';

export const id: DofekCopy = {
  footer: 'Dinas Kesehatan Distrik Pesisir · Paparan 2027',
  hero: {
    name: 'Pembuka',
    org: 'Dinas Kesehatan Distrik Pesisir · Paparan kesehatan masyarakat',
    title: ['Empat menit', 'demi jantung'],
    subtitle: ['Bagaimana distrik berpenduduk 640.000 jiwa', 'belajar bertindak sebelum ambulans tiba'],
    meta: 'Paparan untuk dewan distrik · 15 April 2027',
  },
  agenda: {
    name: 'Agenda',
    title: 'Yang akan kita bahas hari ini',
    intro:
      'Dua puluh menit tentang apa yang telah diubah program ini, apa yang kini terjadi di jalan saat jantung seseorang berhenti, dan apa yang kami minta dari dewan untuk 2027. Setelah itu, sesi tanya jawab.',
    items: [
      ['Angka: ', 'apa yang berubah bagi mereka yang mengalami henti jantung di luar rumah sakit.'],
      ['Di jalan: ', 'bagaimana tetangga, relawan, dan defibrilator kini bekerja bersama.'],
      ['Orang-orangnya: ', 'tim yang menjalankan program dan para relawan di sampingnya.'],
      ['Tahun depan: ', 'apa yang kami minta dari dewan, dan kapan.'],
    ],
  },
  section: {
    name: 'Menit-menit pertama',
    part: 'Bagian satu',
    title: ['Menit-menit', 'pertama'],
    subtitle: 'Mengapa menit-menit sebelum ambulans tiba menentukan siapa yang bisa pulang.',
  },
  figures: {
    name: 'Setahun dalam angka',
    kicker: 'Setahun dalam angka',
    title: '2026 dalam empat angka',
    hero: {
      value: '72',
      label: 'orang pulang ke rumah setelah jantungnya berhenti',
      note: 'Dua kali lipat dari 2023, setahun sebelum program dimulai.',
    },
    others: [
      ['6 menit', 'hingga kejut pertama, dulu 11'],
      ['920', 'defibrilator publik di peta'],
      ['58.000', 'warga terlatih RJP'],
    ],
  },
  change: {
    name: 'Dulu dan kini',
    kicker: 'Apa yang berubah',
    title: 'Dari menunggu ke bertindak',
    before: [
      '2023',
      'Menunggu ambulans',
      'Saksi menelepon lalu menunggu. Dua dari tiga pasien tidak mendapat RJP sampai paramedis tiba, rata-rata sebelas menit kemudian.',
    ],
    after: [
      '2026',
      'Bertindak di menit pertama',
      'Tetangga memulai RJP dan seorang relawan membawa defibrilator. Kejut pertama datang di menit keenam, bukan kesebelas.',
    ],
  },
  chain: {
    name: 'Rantai kelangsungan hidup',
    kicker: 'Rantai kelangsungan hidup',
    title: 'Delapan menit, langkah demi langkah',
    steps: [
      ['00:00', 'Panggilan', 'Petugas 119 tetap di telepon'],
      ['00:30', 'Peringatan', 'Relawan dalam radius 500 meter'],
      ['01:00', 'Kompresi', 'RJP sampai bantuan datang'],
      ['04:00', 'Kejut', 'Defibrilator publik terdekat'],
      ['08:00', 'Serah terima', 'Paramedis mengambil alih'],
    ],
    note: 'Setiap panggilan ditinjau dalam seminggu, bersama para relawan yang datang.',
  },
  responders: {
    name: 'Relawan siaga',
    kicker: 'Relawan siaga',
    title: 'Bantuan dari ujung jalan',
    items: [
      ['Dikabari dalam hitungan detik', 'Aplikasi langsung mengabari relawan terlatih yang berada dalam radius 500 meter.'],
      ['Defibrilator dalam perjalanan', 'Relawan kedua mengambil defibrilator publik terdekat.'],
      ['Tiba sebelum sirene', 'Dalam enam dari sepuluh panggilan, relawanlah yang pertama tiba di sisi pasien.'],
    ],
  },
  park: {
    name: 'Di taman',
    place: 'Taman Tepi Sungai, Distrik Pesisir',
    title: ['Dua jam di taman,', 'bekal seumur hidup'],
    body: 'Sebulan sekali, warga segala usia belajar RJP bersama di taman: sudah 58.000 orang.',
  },
  quote: {
    name: 'Kata seorang penyintas',
    text: 'Jantung saya berhenti di halte. Orang asing memompanya dengan tangan sampai tetangga berlari membawa\u00a0defibrilator.',
    who: 'Elif Kaya',
    role: 'Guru musik dari Kota Lama, kini juga menjadi relawan',
  },
  programmes: {
    name: 'Program',
    kicker: 'Tiga program',
    title: 'Apa yang dikerjakan program ini',
    cards: [
      [
        'Program 01',
        'RJP untuk semua',
        'Kelas gratis dua jam di sekolah, tempat kerja, dan balai warga.',
      ],
      [
        'Program 02',
        'Relawan siaga',
        'Relawan di sekitar langsung dikabari begitu ada yang memanggil ambulans.',
      ],
      [
        'Program 03',
        'Defibrilator di setiap jalan',
        '920 defibrilator publik, dipetakan dan diperiksa setiap bulan.',
      ],
    ],
    note: 'Dijalankan bersama layanan ambulans, sekolah, dan pemerintah daerah.',
  },
  milestones: {
    name: 'Tonggak',
    kicker: 'Tonggak',
    title: 'Empat tahun, empat langkah',
    stops: [
      ['2024', 'RJP di sekolah', 'Kelas dimulai di semua 38 sekolah menengah.'],
      ['2025', 'Aplikasi siaga', 'Aplikasi peringatan meluncur dengan 1.200 relawan.'],
      ['2026', '920 defibrilator', 'Masing-masing dipetakan dan diperiksa tiap bulan.'],
      ['2027', 'Mulai usia sepuluh', 'Pelajaran RJP dimulai di setiap sekolah dasar.'],
    ],
    note: 'Dipilih bersama para penyintas dan kru ambulans.',
  },
  trend: {
    name: 'Hasil',
    kicker: 'Hasil',
    title: 'RJP naik, yang selamat bertambah',
    source:
      'Persentase dari henti jantung di luar rumah sakit, 2023–2026. Registri henti jantung distrik.',
    series: ['RJP sebelum ambulans tiba', 'Pulang dari rumah sakit'],
    figures: [
      ['67%', 'pasien mendapat RJP dari saksi pada 2026, naik dari 36%.'],
      ['16%', 'pulang dari rumah sakit, dua kali lipat angka 2023.'],
    ],
  },
  areas: {
    name: 'Lima wilayah',
    kicker: 'Lima wilayah',
    title: 'Posisi setiap wilayah',
    note: 'Data 2026 dari registri henti jantung distrik, Januari 2027.',
    header: ['Wilayah', 'Defibrilator', 'Warga terlatih', 'RJP sebelum ambulans', 'Kejut pertama'],
    rows: [
      ['Pelabuhan', '240', '16.200', '72%', '5 menit'],
      ['Kota Lama', '210', '13.900', '70%', '5 menit'],
      ['Ladang Utara', '180', '11.400', '66%', '6 menit'],
      ['Tepi Sungai', '170', '10.300', '63%', '7 menit'],
      ['Desa Perbukitan', '120', '6.200', '58%', '9 menit'],
    ],
  },
  team: {
    name: 'Tim',
    kicker: 'Tim program',
    title: 'Orang-orang di balik empat menit',
    people: [
      ['Kardiologi', 'dr. Amara Mensah', 'Dokter jantung, pimpinan klinis program'],
      ['Layanan ambulans', 'Tomás Herrera', 'Kepala paramedis, memimpin pusat panggilan darurat'],
      ['Relawan', 'Noa Katz', 'Perawat, melatih dan mendampingi para relawan'],
      ['Registri', 'Kenji Morita', 'Ahli epidemiologi, mengelola registri henti jantung'],
    ],
  },
  closing: {
    name: 'Penutup',
    kicker: 'Terima kasih',
    title: ['Setiap menit', 'berarti'],
    lines: [
      'Kelas RJP gratis setiap bulan di Taman Tepi Sungai',
      'Paparan berikutnya: 14 Oktober 2027, Balai Distrik',
      'Daftar menjadi relawan di klinik mana pun di distrik ini',
    ],
    meta: 'Dinas Kesehatan Distrik Pesisir · Program Empat Menit',
  },
};
