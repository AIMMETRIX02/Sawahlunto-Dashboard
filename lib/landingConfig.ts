export interface HeroConfig {
  badge: string
  headlineTop: string
  headlineHighlight: string
  headlineBottom: string
  description: string
  pills: string[]
  ctaPrimaryText: string
  ctaSecondaryText: string
}

export interface ScreenshotItem {
  id: string
  title: string
  subtitle: string
  desc: string
  image: string
  tag: string
}

export interface SopStepItem {
  no: string
  title: string
  desc: string
}

export interface HardwareConfig {
  badge: string
  title: string
  description: string
  standaloneTitle: string
  standaloneText: string
  pcTitle: string
  pcText: string
}

export interface DownloadConfig {
  badge: string
  title: string
  description: string
  fileMeta: string[]
  buttonText: string
  fileName: string
}

export interface CustomBlockItem {
  id: string
  badge: string
  title: string
  subtitle: string
  content: string
  image?: string
}

export interface ArticleItem {
  id: string
  category: string
  title: string
  subtitle: string
  content: string
  image?: string
  date: string
  author: string
}

export interface FooterConfig {
  institutionName: string
  ministryName: string
  address: string
  version: string
  engine: string
}

export interface LandingConfig {
  hero: HeroConfig
  screenshots: ScreenshotItem[]
  sopSteps: SopStepItem[]
  hardware: HardwareConfig
  download: DownloadConfig
  customBlocks: CustomBlockItem[]
  articles: ArticleItem[]
  footer: FooterConfig
}

export const DEFAULT_LANDING_CONFIG: LandingConfig = {
  hero: {
    badge: 'BALAI DIKLAT TAMBANG BAWAH TANAH • KEMENTERIAN ESDM RI',
    headlineTop: 'Simulator Peledakan',
    headlineHighlight: 'Tambang Bawah Tanah',
    headlineBottom: 'Berbasis Virtual Reality (VR)',
    description: 'Platform pembelajaran simulasi 3D interaktif berstandar K3 Pertambangan Nasional. Mempraktikkan 11 prosedur kritis peledakan bawah tanah Sawahlunto: dari deteksi gas, perakitan primer, sirkuit delay milidetik, hingga pengoperasian mesin blast box tanpa risiko keselamatan fatal di dunia nyata.',
    pills: [
      '11 Prosedur Peledakan',
      'Delay Milidetik (ms)',
      '2 Penandatangan Sertifikat'
    ],
    ctaPrimaryText: 'Masuk ke Dashboard LMS',
    ctaSecondaryText: 'Unduh Buku Panduan & SOP'
  },
  screenshots: [
    {
      id: 'hero',
      title: 'Targeting & Inspeksi Lubang Ledak (Face Tunnel)',
      subtitle: 'First-Person VR View • Telemetri Gas CH4/CO/O2',
      desc: 'Peserta mengarahkan penanda laser pada lubang ledak (blast hole) terowongan tambang bawah tanah sembari memantau level gas metana secara interaktif.',
      image: '/images/simulator/hero.jpg',
      tag: 'VR INTERFACE'
    },
    {
      id: 'wiring',
      title: 'Pemasangan Detonator Delay & Tie-In Nonel',
      subtitle: 'SOP Rangkaian Peledakan • Timing Milidetik',
      desc: 'Simulasi penyambungan kabel detonator non-listrik (shock tube) sesuai diagram delay berurutan untuk meminimalkan getaran batuan dan mengontrol fragmentasi.',
      image: '/images/simulator/wiring.jpg',
      tag: 'RANGKAIAN DELAY'
    },
    {
      id: 'blastbox',
      title: 'Konsol Mesin Peledak (Blast Box Exploder)',
      subtitle: 'Safety Shelter • Kunci Pengaman & Uji Hambatan',
      desc: 'Pengoperasian mesin peledak di ruang pengawas. Meliputi uji sirkuit Ohm, pemutaran saklar pengisian muatan (charge), dan tombol eksekusi tembak (fire).',
      image: '/images/simulator/blastbox.jpg',
      tag: 'CONTROL UNIT'
    },
    {
      id: 'training',
      title: 'Pusat Diklat VR Tambang Bawah Tanah ESDM',
      subtitle: 'Laboratorium Simulasi • Evaluasi Kompetensi',
      desc: 'Siswa diklat BDTBT mempraktikkan skenario peledakan menggunakan perangkat VR dengan pemantauan visual telemetri fragmentasi batuan 3D secara langsung.',
      image: '/images/simulator/training.jpg',
      tag: 'LABORATORIUM ESDM'
    }
  ],
  sopSteps: [
    { no: '01', title: 'Safety & APD', desc: 'Pengecekan helm, kacamata pelindung, rompi, dan deteksi gas metana/CO.' },
    { no: '02', title: 'Scaling Loose Rock', desc: 'Pembersihan batuan renggang di atap dan dinding terowongan sebelum pengisian.' },
    { no: '03', title: 'Primer Assembly', desc: 'Perakitan primer dengan memasukkan detonator ke dalam booster dinamit/emulsi.' },
    { no: '04', title: 'Tie-In & Delay Circuit', desc: 'Penyambungan sirkuit lead line dan penyesuaian delay milidetik (ms).' },
    { no: '05', title: 'Cord & Cable Test', desc: 'Pemeriksaan integritas dan nilai tahanan kabel tembak menggunakan ohmmeter.' },
    { no: '06', title: 'ANFO Charging', desc: 'Pengisian bahan peledak butiran ke dalam lubang ledak dan tamping batuan.' },
    { no: '07', title: 'Blasting Cap Check', desc: 'Verifikasi penempatan tutup detonator dan sambungan shock tube nonel.' },
    { no: '08', title: 'Cap Line Hookup', desc: 'Penarikan garis tembak utama menuju shelter tempat perlindungan yang aman.' },
    { no: '09', title: 'Blastbox Ignition', desc: 'Pemasangan safety key, pengisian muatan kondensator mesin peledak.' },
    { no: '10', title: 'Controlled Blasting', desc: 'Pemberian sirine peringatan, hitungan mundur, dan eksekusi peledakan aman.' },
    { no: '11', title: 'Exhaust Motor Fan', desc: 'Pengaktifan ventilasi penghisap untuk membersihkan asap dan gas beracun tambang.' }
  ],
  hardware: {
    badge: 'Spesifikasi Perangkat',
    title: 'Kompatibilitas Perangkat Virtual Reality',
    description: 'Simulator Blasting Tambang Bawah Tanah BDTBT dikembangkan dengan Unreal Engine & OpenXR. Dapat dijalankan langsung pada headset VR mandiri (standalone) maupun tersambung ke komputer grafis tinggi.',
    standaloneTitle: 'Standalone VR Headset:',
    standaloneText: 'Meta Quest 2, Quest 3, Quest Pro (Format APK langsung tanpa kabel)',
    pcTitle: 'PC VR (SteamVR / Link Cable):',
    pcText: 'NVIDIA RTX 2060 / GTX 1660 Ti, RAM 16GB, Intel Core i5 / Ryzen 5 ke atas'
  },
  download: {
    badge: 'Pusat Unduhan Resmi BDTBT',
    title: 'Unduh Buku Panduan & SOP Blasting VR',
    description: 'Buku pedoman resmi berisikan standar operasional prosedur keselamatan peledakan tambang bawah tanah Sawahlunto.',
    fileMeta: ['Format: PDF', 'Ukuran: 14.5 MB', 'Edisi 2024 • Rev 3.2'],
    buttonText: 'Unduh Buku Panduan & SOP (PDF)',
    fileName: 'SOP_Blasting_VR_BDTBT_ESDM.pdf'
  },
  customBlocks: [],
  articles: [
    {
      id: 'art-1',
      category: 'PENGUMUMAN RESMI',
      title: 'Pemberlakuan Standar Uji Kompetensi VR Blasting BDTBT ESDM 2024',
      subtitle: 'Sawahlunto • 11 Tahapan K3 Wajib Terpenuhi',
      content: 'Balai Diklat Tambang Bawah Tanah (BDTBT) Kementerian ESDM secara resmi memberlakukan evaluasi simulasi Virtual Reality sebagai syarat kelulusan praktikum peledakan bawah tanah. Setiap peserta diwajibkan menyelesaikan seluruh 11 rangkaian keselamatan kerja mulai dari deteksi gas berbahaya hingga aktivasi ventilasi exhaust fan pasca-peledakan sebelum sertifikat kompetensi diterbitkan.',
      date: '2024-09-01',
      author: 'BDTBT ESDM'
    },
    {
      id: 'art-2',
      category: 'INOVASI TEKNOLOGI',
      title: 'Digitalisasi Diklat Bawah Tanah Berbasis Imersif & Zero Accident',
      subtitle: 'Teknologi VR Terkini • Unreal Engine 5',
      content: 'Simulasi VR memungkinkan siswa diklat mempraktikkan skenario peledakan berisiko tinggi tanpa bahaya fatal di dunia nyata. Melalui simulasi ini, pemahaman pola delay milidetik dan handling blastbox exploder dapat diuji berulang kali hingga mencapai tingkat akurasi dan kepatuhan prosedur 100%.',
      date: '2024-09-15',
      author: 'BDTBT ESDM'
    }
  ],
  footer: {
    institutionName: 'BALAI DIKLAT TAMBANG BAWAH TANAH',
    ministryName: 'KEMENTERIAN ENERGI DAN SUMBER DAYA MINERAL',
    address: 'Jl. Saringan No. 1, Kota Sawahlunto, Sumatera Barat 27424',
    version: 'Simulator VR Blasting v2.4',
    engine: 'Unreal Engine 5 • OpenXR Standard'
  }
}
