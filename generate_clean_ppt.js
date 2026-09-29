const pptxgen = require('pptxgenjs');
const path = require('path');

async function generateCleanPPT() {
  const pres = new pptxgen();

  // Standard Modern Widescreen 16:9 in PowerPoint (13.333" x 7.5")
  pres.defineLayout({ name: 'WIDE_16_9', width: 13.333, height: 7.5 });
  pres.layout = 'WIDE_16_9';

  pres.title = 'MeetThink - Smart Meeting Management System';
  pres.author = 'MeetThink Development Team';
  pres.company = 'MeetThink';

  // Professional Executive Theme (Clean, High Contrast, Universally Compatible)
  const C_BG = 'F8FAFC';         // Soft off-white / light slate
  const C_WHITE = 'FFFFFF';      // Pure White cards
  const C_DARK = '0F172A';       // Deep Navy / Slate 900
  const C_NAVY = '1E293B';       // Slate 800
  const C_PRIMARY = '1D4ED8';    // Royal Blue 700
  const C_PRIMARY_LIGHT = 'EFF6FF'; // Blue 50
  const C_ORANGE = 'EA580C';     // Vibrant Orange 600
  const C_ORANGE_LIGHT = 'FFF7ED'; // Orange 50
  const C_GREEN = '15803D';      // Emerald 700
  const C_GREEN_LIGHT = 'F0FDF4';// Emerald 50
  const C_BORDER = 'E2E8F0';     // Slate 200
  const C_BORDER_DARK = 'CBD5E1';// Slate 300
  const C_MUTED = '64748B';      // Slate 500
  const C_MUTED_DARK = '475569'; // Slate 600

  const FONT_TITLE = 'Segoe UI';
  const FONT_BODY = 'Segoe UI';

  // Master Slide Template
  function addSlideHeader(slide, title, category) {
    slide.background = { color: C_BG };

    // Top Category Pill
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 0.5,
      w: 3.2,
      h: 0.32,
      rectRadius: 0.1,
      fill: { color: C_ORANGE_LIGHT },
      line: { color: 'FDBA74', width: 1 },
    });
    slide.addText(category.toUpperCase(), {
      x: 0.8,
      y: 0.5,
      w: 3.2,
      h: 0.32,
      fontSize: 9.5,
      bold: true,
      color: C_ORANGE,
      align: 'center',
      valign: 'middle',
      fontFace: FONT_TITLE,
    });

    // Main Slide Title
    slide.addText(title, {
      x: 0.8,
      y: 0.9,
      w: 11.7,
      h: 0.65,
      fontSize: 22,
      bold: true,
      color: C_DARK,
      fontFace: FONT_TITLE,
      valign: 'top',
    });

    // Subtle horizontal divider line
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8,
      y: 1.55,
      w: 11.7,
      h: 0.02,
      fill: { color: C_BORDER },
    });

    // Bottom Footer
    slide.addText('MeetThink  |  Smart Meeting Management System  |  https://meetthink.vercel.app', {
      x: 0.8,
      y: 6.9,
      w: 10.0,
      h: 0.3,
      fontSize: 9,
      color: C_MUTED,
      fontFace: FONT_BODY,
      valign: 'middle',
    });
  }

  // ==========================================
  // SLIDE 1: COVER SLIDE
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: '0F172A' }; // Luxury Navy Cover

    // Accent line top
    slide.addShape(pres.ShapeType.rect, {
      x: 0.0,
      y: 0.0,
      w: 13.333,
      h: 0.1,
      fill: { color: 'F97316' },
    });

    // Category Pill
    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.0,
      y: 1.2,
      w: 2.4,
      h: 0.36,
      rectRadius: 0.1,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 },
    });
    slide.addText('ENTERPRISE SOLUTION', {
      x: 1.0,
      y: 1.2,
      w: 2.4,
      h: 0.36,
      fontSize: 10,
      bold: true,
      color: 'FB923C',
      align: 'center',
      valign: 'middle',
      fontFace: FONT_TITLE,
    });

    // Title: MeetThink
    slide.addText([
      { text: 'Meet', options: { color: 'FFFFFF', bold: true } },
      { text: 'Think', options: { color: 'F97316', bold: true } },
    ], {
      x: 1.0,
      y: 1.7,
      w: 11.0,
      h: 1.2,
      fontSize: 52,
      fontFace: FONT_TITLE,
    });

    // Subtitle
    slide.addText('Smart Meeting Management & Collaboration System', {
      x: 1.0,
      y: 2.9,
      w: 11.0,
      h: 0.6,
      fontSize: 22,
      bold: true,
      color: '38BDF8',
      fontFace: FONT_TITLE,
    });

    // Paragraph Description
    slide.addText(
      'Solusi komprehensif transformasi manajemen rapat perusahaan:\nPemesanan Ruangan Bebas Bentrok, Multi-Level Approval, Absensi Digital QR Code, hingga Notulensi & Action Items.',
      {
        x: 1.0,
        y: 3.6,
        w: 9.8,
        h: 1.0,
        fontSize: 13.5,
        color: '94A3B8',
        lineSpacing: 20,
        fontFace: FONT_BODY,
      }
    );

    // Box 1: Live Domain
    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.0,
      y: 4.9,
      w: 5.2,
      h: 1.2,
      rectRadius: 0.15,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 },
    });
    slide.addText('🌐 LIVE PRODUCTION APPLICATION', {
      x: 1.3,
      y: 5.1,
      w: 4.6,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: '94A3B8',
      fontFace: FONT_TITLE,
    });
    slide.addText('https://meetthink.vercel.app', {
      x: 1.3,
      y: 5.45,
      w: 4.6,
      h: 0.45,
      fontSize: 15,
      bold: true,
      color: '60A5FA',
      fontFace: FONT_TITLE,
    });

    // Box 2: Tech Specs
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.5,
      y: 4.9,
      w: 5.2,
      h: 1.2,
      rectRadius: 0.15,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 },
    });
    slide.addText('⚡ ARSITEKTUR MODERN', {
      x: 6.8,
      y: 5.1,
      w: 4.6,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: '94A3B8',
      fontFace: FONT_TITLE,
    });
    slide.addText('Next.js 15 • PostgreSQL Neon • NextAuth v5', {
      x: 6.8,
      y: 5.45,
      w: 4.6,
      h: 0.45,
      fontSize: 13.5,
      bold: true,
      color: 'FFFFFF',
      fontFace: FONT_TITLE,
    });
  }

  // ==========================================
  // SLIDE 2: PERMASALAHAN (THE PROBLEM)
  // ==========================================
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Tantangan Klasik Manajemen Rapat di Perusahaan', 'Latar Belakang & Masalah');

    const problems = [
      {
        num: '01',
        title: 'Jadwal Bentrok & Ruangan Ganda',
        desc: 'Pemesanan ruangan melalui WhatsApp atau catatan manual sering tumpang tindih, memicu perebutan ruangan mendadak di jam-jam sibuk.',
        color: 'DC2626',
        bg: 'FEF2F2',
      },
      {
        num: '02',
        title: 'Birokrasi Persetujuan Berbelit',
        desc: 'Proses perizinan peminjaman ruangan, konsumsi, dan fasilitas pendukung lambat, hilang jejak, dan membingungkan pemohon rapat.',
        color: 'EA580C',
        bg: 'FFF7ED',
      },
      {
        num: '03',
        title: 'Absensi Kertas Tidak Akurat',
        desc: 'Daftar hadir fisik rawan tercecer, menyita waktu sebelum rapat dimulai, sulit direkapitulasi, dan rentan terhadap praktik titip absen.',
        color: 'D97706',
        bg: 'FFFBEB',
      },
      {
        num: '04',
        title: 'Komitmen Notulensi Terlupakan',
        desc: 'Keputusan rapat dan pembagian tugas (action items) sering menguap tanpa pengawasan PIC, deadline tugas, dan status penyelesaian.',
        color: '4F46E5',
        bg: 'EEF2FF',
      },
    ];

    problems.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.95;
      const y = 1.8 + row * 2.35;

      // Card Background
      slide.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 5.75,
        h: 2.1,
        rectRadius: 0.15,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1.2 },
      });

      // Left Accent Strip
      slide.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 0.15,
        h: 2.1,
        rectRadius: 0.05,
        fill: { color: p.color },
      });

      // Number badge
      slide.addShape(pres.ShapeType.roundRect, {
        x: x + 0.35,
        y: y + 0.25,
        w: 0.6,
        h: 0.45,
        rectRadius: 0.08,
        fill: { color: p.bg },
      });
      slide.addText(p.num, {
        x: x + 0.35,
        y: y + 0.25,
        w: 0.6,
        h: 0.45,
        fontSize: 13,
        bold: true,
        color: p.color,
        align: 'center',
        valign: 'middle',
        fontFace: FONT_TITLE,
      });

      // Title
      slide.addText(p.title, {
        x: x + 1.1,
        y: y + 0.25,
        w: 4.4,
        h: 0.45,
        fontSize: 14.5,
        bold: true,
        color: C_DARK,
        fontFace: FONT_TITLE,
        valign: 'middle',
      });

      // Description
      slide.addText(p.desc, {
        x: x + 1.1,
        y: y + 0.8,
        w: 4.4,
        h: 1.1,
        fontSize: 11,
        color: C_MUTED_DARK,
        lineSpacing: 16,
        fontFace: FONT_BODY,
      });
    });
  }

  // ==========================================
  // SLIDE 3: SOLUSI MEETTHINK
  // ==========================================
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'MeetThink: Solusi Terpadu Manajemen Rapat Perusahaan', 'Solusi Komprehensif');

    const pillars = [
      {
        num: '01',
        title: 'Smart Booking & Availability',
        tag: 'Pemesanan Cerdas',
        desc: 'Deteksi bentrok ruangan otomatis dan peringatan dini ketersediaan jadwal peserta (pegawai).',
        color: '1D4ED8',
      },
      {
        num: '02',
        title: 'Multi-Level Approval',
        tag: 'Persetujuan Berjenjang',
        desc: 'Alur persetujuan berjenjang yang fleksibel dengan catatan audit dan pemantauan persiapan fasilitas/konsumsi.',
        color: 'EA580C',
      },
      {
        num: '03',
        title: 'QR Code Attendance',
        tag: 'Absensi Mandiri',
        desc: 'Presensi digital nirsentuh dengan validasi waktu cerdas (dibuka 30 menit sebelum rapat) dan rekap live.',
        color: '15803D',
      },
      {
        num: '04',
        title: 'Action Item Tracking',
        tag: 'Tindak Lanjut Tugas',
        desc: 'Notulensi resmi terkunci, pembagian tugas langsung ke PIC berbatas waktu, dan notifikasi email otomatis.',
        color: '7C3AED',
      },
    ];

    pillars.forEach((p, idx) => {
      const x = 0.8 + idx * 2.98;
      const y = 1.8;

      // Card
      slide.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 2.8,
        h: 4.7,
        rectRadius: 0.15,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1.2 },
      });

      // Top colored bar
      slide.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 2.8,
        h: 0.1,
        rectRadius: 0.05,
        fill: { color: p.color },
      });

      // Number
      slide.addText(p.num, {
        x: x + 0.3,
        y: y + 0.3,
        w: 2.2,
        h: 0.6,
        fontSize: 28,
        bold: true,
        color: p.color,
        fontFace: FONT_TITLE,
      });

      // Tag
      slide.addText(p.tag.toUpperCase(), {
        x: x + 0.3,
        y: y + 0.95,
        w: 2.2,
        h: 0.25,
        fontSize: 9,
        bold: true,
        color: C_MUTED,
        fontFace: FONT_TITLE,
      });

      // Title
      slide.addText(p.title, {
        x: x + 0.3,
        y: y + 1.25,
        w: 2.2,
        h: 0.65,
        fontSize: 15,
        bold: true,
        color: C_DARK,
        fontFace: FONT_TITLE,
      });

      // Divider
      slide.addShape(pres.ShapeType.rect, {
        x: x + 0.3,
        y: y + 2.05,
        w: 2.2,
        h: 0.02,
        fill: { color: C_BORDER },
      });

      // Desc
      slide.addText(p.desc, {
        x: x + 0.3,
        y: y + 2.2,
        w: 2.2,
        h: 2.1,
        fontSize: 11.5,
        color: C_MUTED_DARK,
        lineSpacing: 17,
        fontFace: FONT_BODY,
      });
    });
  }

  // ==========================================
  // SLIDE 4: SMART BOOKING
  // ==========================================
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Fitur 1: Pemesanan Ruangan & Proteksi Bentrok Ganda', 'Pilar Operasional');

    // Left Main Card
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 1.8,
      w: 7.2,
      h: 4.8,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: C_BORDER, width: 1.2 },
    });

    const items = [
      {
        title: 'Pencegahan Bentrok Ruangan (Room Conflict Check)',
        desc: 'Sistem mengevaluasi interval waktu secara otomatis. Jika ruangan sudah terpakai pada jam tersebut, pengajuan langsung dicegah sebelum submit.',
      },
      {
        title: 'Peringatan Jadwal Pegawai (Participant Conflict Advisory)',
        desc: 'Memberikan peringatan visual instan jika peserta yang diundang sudah memiliki agenda rapat lain di jam yang sama, lengkap dengan rincian jadwal yang bentrok.',
      },
      {
        title: 'Katalog Ruangan Komprehensif',
        desc: 'Mencakup kapasitas peserta, denah gedung, lantai, foto ruangan, dan kelengkapan fasilitas (TV/Monitor, Proyektor, Video Conf, AC, Sound System).',
      },
      {
        title: 'Integrasi Fasilitas Khusus, Konsumsi & Timeline',
        desc: 'Request konsumsi rapat dan peralatan IT dalam satu formulir, dilengkapi visualisasi jadwal harian (timeline) per ruangan.',
      },
    ];

    items.forEach((item, idx) => {
      const iy = 2.1 + idx * 1.1;

      slide.addShape(pres.ShapeType.ellipse, {
        x: 1.1,
        y: iy + 0.05,
        w: 0.18,
        h: 0.18,
        fill: { color: C_PRIMARY },
      });

      slide.addText(item.title, {
        x: 1.4,
        y: iy,
        w: 6.3,
        h: 0.35,
        fontSize: 13,
        bold: true,
        color: C_DARK,
        fontFace: FONT_TITLE,
      });

      slide.addText(item.desc, {
        x: 1.4,
        y: iy + 0.32,
        w: 6.3,
        h: 0.65,
        fontSize: 10.5,
        color: C_MUTED_DARK,
        lineSpacing: 15,
        fontFace: FONT_BODY,
      });
    });

    // Right Callout Card
    slide.addShape(pres.ShapeType.roundRect, {
      x: 8.3,
      y: 1.8,
      w: 4.2,
      h: 4.8,
      rectRadius: 0.15,
      fill: { color: '1E3A8A' }, // Deep Blue
    });

    slide.addText('PROTEKSI BENTROK GANDA', {
      x: 8.7,
      y: 2.2,
      w: 3.4,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: 'FDBA74',
      fontFace: FONT_TITLE,
    });

    slide.addText('Ruangan & Pegawai Aman', {
      x: 8.7,
      y: 2.6,
      w: 3.4,
      h: 0.8,
      fontSize: 22,
      bold: true,
      color: 'FFFFFF',
      fontFace: FONT_TITLE,
    });

    slide.addText(
      'Sistem tidak hanya mencegah tumpang tindih penggunaan fasilitas fisik, tetapi juga melindungi jadwal kerja pegawai dari penumpukan rapat di jam yang sama.',
      {
        x: 8.7,
        y: 3.5,
        w: 3.4,
        h: 1.3,
        fontSize: 12,
        color: 'BFDBFE',
        lineSpacing: 18,
        fontFace: FONT_BODY,
      }
    );

    slide.addShape(pres.ShapeType.roundRect, {
      x: 8.7,
      y: 5.2,
      w: 3.4,
      h: 1.0,
      rectRadius: 0.1,
      fill: { color: '172554' },
      line: { color: '3B82F6', width: 1 },
    });
    slide.addText([
      { text: 'Ketersediaan Real-Time\n', options: { fontSize: 10, color: '93C5FD', bold: true } },
      { text: 'Sinkronisasi instan ke seluruh pengguna.', options: { fontSize: 11, color: 'FFFFFF' } },
    ], {
      x: 8.9,
      y: 5.3,
      w: 3.0,
      h: 0.8,
      fontFace: FONT_BODY,
    });
  }

  // ==========================================
  // SLIDE 5: MULTI-LEVEL APPROVAL
  // ==========================================
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Fitur 2: Alur Persetujuan Berjenjang & Hak Akses', 'Manajemen Alur Kerja');

    // 4 Steps Horizontal
    const steps = [
      { step: 'Tahap 1', role: 'Pembuat Rapat', act: 'Pengajuan Jadwal', desc: 'Memilih ruang, jadwal, peserta, & fasilitas khusus.' },
      { step: 'Tahap 2', role: 'Kepala Divisi', act: 'Persetujuan Lv 1', desc: 'Verifikasi urgensi agenda dan izin kegiatan divisi.' },
      { step: 'Tahap 3', role: 'Admin Fasilitas', act: 'Persetujuan Lv 2', desc: 'Alokasi ruangan, persiapan alat IT, dan konsumsi.' },
      { step: 'Tahap 4', role: 'Sistem Terpadu', act: 'Rapat Resmi Terbit', desc: 'QR code absensi & notifikasi email peserta aktif.' },
    ];

    steps.forEach((s, idx) => {
      const x = 0.8 + idx * 2.98;
      const y = 1.8;

      slide.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 2.8,
        h: 2.8,
        rectRadius: 0.15,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1.2 },
      });

      slide.addText(s.step.toUpperCase(), {
        x: x + 0.25,
        y: y + 0.25,
        w: 2.3,
        h: 0.25,
        fontSize: 9.5,
        bold: true,
        color: C_ORANGE,
        fontFace: FONT_TITLE,
      });

      slide.addText(s.act, {
        x: x + 0.25,
        y: y + 0.55,
        w: 2.3,
        h: 0.45,
        fontSize: 14.5,
        bold: true,
        color: C_DARK,
        fontFace: FONT_TITLE,
      });

      slide.addText(`Aktor: ${s.role}`, {
        x: x + 0.25,
        y: y + 1.05,
        w: 2.3,
        h: 0.35,
        fontSize: 11,
        bold: true,
        color: C_PRIMARY,
        fontFace: FONT_TITLE,
      });

      slide.addText(s.desc, {
        x: x + 0.25,
        y: y + 1.45,
        w: 2.3,
        h: 1.1,
        fontSize: 10.5,
        color: C_MUTED_DARK,
        lineSpacing: 15,
        fontFace: FONT_BODY,
      });
    });

    // Lower Visibility Box
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 4.85,
      w: 11.7,
      h: 1.8,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: C_BORDER, width: 1.2 },
    });

    slide.addText('🔒 Hak Akses Cerdas & Transparansi Operasional', {
      x: 1.1,
      y: 5.0,
      w: 11.0,
      h: 0.35,
      fontSize: 13.5,
      bold: true,
      color: C_DARK,
      fontFace: FONT_TITLE,
    });

    slide.addText(
      '• Pembuat Rapat & Tim Fasilitas: Memantau detail status persetujuan, catatan penolakan/approval, dan kesiapan fasilitas & konsumsi.\n• Peserta Rapat Umum: Hanya melihat status resmi [Disetujui] tanpa terganggu oleh detail birokrasi dan logistik internal perusahaan.',
      {
        x: 1.1,
        y: 5.45,
        w: 11.0,
        h: 1.0,
        fontSize: 11.5,
        color: C_MUTED_DARK,
        lineSpacing: 18,
        fontFace: FONT_BODY,
      }
    );
  }

  // ==========================================
  // SLIDE 6: QR CODE ATTENDANCE
  // ==========================================
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Fitur 3: Absensi Real-Time & QR Code Mandiri', 'Efisiensi Kehadiran');

    // Left List
    const cards = [
      {
        tag: 'CONTACTLESS & CEPAT',
        title: 'Scan Mandiri via Kamera Smartphone',
        desc: 'Peserta cukup memindai QR Code yang ditampilkan panitia di layar proyektor atau tablet. Kehadiran tercatat instan tanpa antrean tanda tangan.',
      },
      {
        tag: 'INTEGRITAS DATA',
        title: 'Smart Window Validation (30 Menit)',
        desc: 'Sesi check-in hanya dibuka mulai 30 menit sebelum rapat dimulai hingga rapat selesai. Mencegah manipulasi absensi sebelum waktu pelaksanaan.',
      },
      {
        tag: 'FLEKSIBILITAS LAPANGAN',
        title: 'Opsi Check-In Manual oleh Organizer',
        desc: 'Penyelenggara rapat tetap memiliki wewenang mencatat kehadiran secara manual untuk tamu eksternal atau peserta dengan kendala teknis.',
      },
    ];

    cards.forEach((c, idx) => {
      const y = 1.8 + idx * 1.58;

      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.8,
        y,
        w: 7.2,
        h: 1.45,
        rectRadius: 0.15,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1.2 },
      });

      slide.addText(c.tag, {
        x: 1.1,
        y: y + 0.18,
        w: 6.6,
        h: 0.25,
        fontSize: 9.5,
        bold: true,
        color: C_ORANGE,
        fontFace: FONT_TITLE,
      });

      slide.addText(c.title, {
        x: 1.1,
        y: y + 0.45,
        w: 6.6,
        h: 0.35,
        fontSize: 13.5,
        bold: true,
        color: C_DARK,
        fontFace: FONT_TITLE,
      });

      slide.addText(c.desc, {
        x: 1.1,
        y: y + 0.8,
        w: 6.6,
        h: 0.55,
        fontSize: 10.5,
        color: C_MUTED_DARK,
        lineSpacing: 15,
        fontFace: FONT_BODY,
      });
    });

    // Right Green Box
    slide.addShape(pres.ShapeType.roundRect, {
      x: 8.3,
      y: 1.8,
      w: 4.2,
      h: 4.8,
      rectRadius: 0.15,
      fill: { color: '065F46' }, // Emerald 800
    });

    slide.addText('REKAPITULASI LIVE', {
      x: 8.7,
      y: 2.2,
      w: 3.4,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: 'A7F3D0',
      fontFace: FONT_TITLE,
    });

    slide.addText('100% Real-Time Rekap', {
      x: 8.7,
      y: 2.6,
      w: 3.4,
      h: 0.8,
      fontSize: 22,
      bold: true,
      color: 'FFFFFF',
      fontFace: FONT_TITLE,
    });

    slide.addText(
      'Setiap scan terverifikasi saat itu juga. Notulensi rapat langsung menampilkan daftar peserta yang hadir tepat waktu vs terlambat tanpa rekap manual berulang.',
      {
        x: 8.7,
        y: 3.5,
        w: 3.4,
        h: 1.3,
        fontSize: 12,
        color: 'D1FAE5',
        lineSpacing: 18,
        fontFace: FONT_BODY,
      }
    );

    slide.addShape(pres.ShapeType.roundRect, {
      x: 8.7,
      y: 5.1,
      w: 3.4,
      h: 1.2,
      rectRadius: 0.1,
      fill: { color: '064E3B' },
      line: { color: '34D399', width: 1 },
    });
    slide.addText([
      { text: 'Kategori Kehadiran:\n', options: { fontSize: 10, color: 'A7F3D0', bold: true } },
      { text: '• Tepat Waktu / Terlambat\n', options: { fontSize: 11, color: 'FFFFFF' } },
      { text: '• Ekspor Laporan PDF & Excel', options: { fontSize: 11, color: 'FDE047', bold: true } },
    ], {
      x: 8.9,
      y: 5.2,
      w: 3.0,
      h: 1.0,
      fontFace: FONT_BODY,
    });
  }

  // ==========================================
  // SLIDE 7: NOTULENSI & ACTION ITEMS
  // ==========================================
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Fitur 4: Notulensi Digital & Pelacakan Tindak Lanjut', 'Akuntabilitas Hasil');

    const cards = [
      {
        num: 'A',
        title: 'Notulensi Terstruktur & Finalisasi',
        desc: 'Pencatatan poin bahasan dan keputusan rapat. Fitur penguncian (Lock Finalized Notes) menjamin integritas data rapat yang telah disahkan.',
      },
      {
        num: 'B',
        title: 'Delegasi Tugas (Action Items) & PIC',
        desc: 'Setiap keputusan rapat langsung dihubungkan ke PIC (Person in Charge) spesifik lengkap dengan tanggal batas waktu (deadline).',
      },
      {
        num: 'C',
        title: 'Notifikasi Email Otomatis',
        desc: 'PIC langsung menerima email notifikasi resmi saat ditunjuk, berisi rincian tugas dan tautan langsung untuk memperbarui progres di sistem.',
      },
      {
        num: 'D',
        title: 'Peringatan Overdue Dinamis',
        desc: 'Tugas yang melewati batas waktu ditandai secara visual (badge merah Overdue) agar manajemen dapat segera mengambil tindakan mitigasi.',
      },
    ];

    cards.forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.95;
      const y = 1.8 + row * 2.35;

      slide.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 5.75,
        h: 2.1,
        rectRadius: 0.15,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1.2 },
      });

      // Icon circle
      slide.addShape(pres.ShapeType.ellipse, {
        x: x + 0.35,
        y: y + 0.25,
        w: 0.5,
        h: 0.5,
        fill: { color: C_PRIMARY_LIGHT },
        line: { color: 'BFDBFE', width: 1 },
      });
      slide.addText(c.num, {
        x: x + 0.35,
        y: y + 0.25,
        w: 0.5,
        h: 0.5,
        fontSize: 13,
        bold: true,
        color: C_PRIMARY,
        align: 'center',
        valign: 'middle',
        fontFace: FONT_TITLE,
      });

      slide.addText(c.title, {
        x: x + 1.05,
        y: y + 0.25,
        w: 4.4,
        h: 0.45,
        fontSize: 14,
        bold: true,
        color: C_DARK,
        fontFace: FONT_TITLE,
        valign: 'middle',
      });

      slide.addText(c.desc, {
        x: x + 1.05,
        y: y + 0.8,
        w: 4.4,
        h: 1.1,
        fontSize: 11,
        color: C_MUTED_DARK,
        lineSpacing: 16,
        fontFace: FONT_BODY,
      });
    });
  }

  // ==========================================
  // SLIDE 8: DASHBOARD & REPORTING
  // ==========================================
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Fitur 5: Dashboard Eksekutif & Laporan Analitik', 'Visibilitas Manajemen');

    const metrics = [
      {
        tag: 'UTILISASI RUANGAN',
        title: 'Efisiensi Fasilitas',
        desc: 'Mengetahui ruangan paling sering digunakan, jam puncak operasional, dan efisiensi alokasi fasilitas kerja.',
        color: '1D4ED8',
      },
      {
        tag: 'DISIPLIN KEHADIRAN',
        title: 'Rasio Kehadiran Divisi',
        desc: 'Tingkat kehadiran peserta rapat per unit kerja, rasio ketepatan waktu, dan rekapitulasi absensi komprehensif.',
        color: 'EA580C',
      },
      {
        tag: 'TINDAK LANJUT TUGAS',
        title: 'Penyelesaian Action Items',
        desc: 'Persentase tugas yang diselesaikan tepat waktu vs tertunda untuk memastikan keputusan rapat tereksekusi.',
        color: '15803D',
      },
    ];

    metrics.forEach((m, idx) => {
      const x = 0.8 + idx * 3.98;
      const y = 1.8;

      slide.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 3.75,
        h: 2.8,
        rectRadius: 0.15,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1.2 },
      });

      slide.addText(m.tag, {
        x: x + 0.3,
        y: y + 0.3,
        w: 3.15,
        h: 0.25,
        fontSize: 9.5,
        bold: true,
        color: m.color,
        fontFace: FONT_TITLE,
      });

      slide.addText(m.title, {
        x: x + 0.3,
        y: y + 0.65,
        w: 3.15,
        h: 0.55,
        fontSize: 17,
        bold: true,
        color: C_DARK,
        fontFace: FONT_TITLE,
      });

      slide.addText(m.desc, {
        x: x + 0.3,
        y: y + 1.3,
        w: 3.15,
        h: 1.2,
        fontSize: 11,
        color: C_MUTED_DARK,
        lineSpacing: 16,
        fontFace: FONT_BODY,
      });
    });

    // Bottom Banner
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 4.85,
      w: 11.7,
      h: 1.8,
      rectRadius: 0.15,
      fill: { color: '312E81' }, // Indigo 900
    });

    slide.addText('📈 Pengambilan Keputusan Berbasis Data (Data-Driven Decision)', {
      x: 1.1,
      y: 5.0,
      w: 11.0,
      h: 0.35,
      fontSize: 13.5,
      bold: true,
      color: 'C7D2FE',
      fontFace: FONT_TITLE,
    });

    slide.addText(
      'Manajemen dapat mengevaluasi efektivitas setiap pertemuan kerja, mengidentifikasi rapat yang tidak produktif, dan merencanakan penambahan kapasitas ruangan berdasarkan data utilisasi riil perusahaan.',
      {
        x: 1.1,
        y: 5.45,
        w: 11.0,
        h: 1.0,
        fontSize: 11.5,
        color: 'E0E7FF',
        lineSpacing: 18,
        fontFace: FONT_BODY,
      }
    );
  }

  // ==========================================
  // SLIDE 9: ARSITEKTUR TEKNOLOGI
  // ==========================================
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Arsitektur Teknologi Modern & Keamanan Terpercaya', 'Keunggulan Teknis');

    const techs = [
      {
        tag: 'FRONTEND & APP RUNTIME',
        title: 'Next.js 15 (React 19, App Router)',
        desc: 'Performa super cepat dengan Server-Side Rendering (RSC) dan tampilan responsif di desktop maupun smartphone.',
      },
      {
        tag: 'DATABASE CLOUD & ORM',
        title: 'Neon PostgreSQL & Prisma ORM',
        desc: 'Penyimpanan terisolasi aman dengan enkripsi SSL/TLS, proteksi foreign key, dan integritas transaksi ACID tinggi.',
      },
      {
        tag: 'OTENTIKASI & KEAMANAN',
        title: 'NextAuth.js v5 & RBAC',
        desc: 'Hierarki 4 peran (Super Admin, Admin, Approver, User), sandi terenkripsi bcrypt, dan proteksi sesi terenkripsi penuh.',
      },
      {
        tag: 'DEPLOYMENT & GLOBAL CDN',
        title: 'Vercel Edge Network',
        desc: 'Ketersediaan tinggi (high availability) 99.9%, sertifikat SSL otomatis, dan perlindungan DDoS bawaan.',
      },
    ];

    techs.forEach((t, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.95;
      const y = 1.8 + row * 2.35;

      slide.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 5.75,
        h: 2.1,
        rectRadius: 0.15,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1.2 },
      });

      slide.addText(t.tag, {
        x: x + 0.35,
        y: y + 0.25,
        w: 5.0,
        h: 0.25,
        fontSize: 9.5,
        bold: true,
        color: C_ORANGE,
        fontFace: FONT_TITLE,
      });

      slide.addText(t.title, {
        x: x + 0.35,
        y: y + 0.55,
        w: 5.0,
        h: 0.45,
        fontSize: 14,
        bold: true,
        color: C_DARK,
        fontFace: FONT_TITLE,
      });

      slide.addText(t.desc, {
        x: x + 0.35,
        y: y + 1.05,
        w: 5.0,
        h: 0.85,
        fontSize: 11,
        color: C_MUTED_DARK,
        lineSpacing: 16,
        fontFace: FONT_BODY,
      });
    });
  }

  // ==========================================
  // SLIDE 10: BUSINESS IMPACT & ROI
  // ==========================================
  {
    const slide = pres.addSlide();
    addSlideHeader(slide, 'Dampak Bisnis & Nilai Tambah bagi Perusahaan', 'Return on Investment');

    const impacts = [
      {
        metric: '70%',
        label: 'Efisiensi Waktu Koordinasi',
        desc: 'Memangkas waktu approval & koordinasi ruangan dari hitungan hari menjadi hitungan menit.',
        color: '1D4ED8',
      },
      {
        metric: '100%',
        label: 'Bebas Kertas (Paperless)',
        desc: 'Mengeliminasi lembar absensi fisik, formulir peminjaman manual, dan notulensi cetak.',
        color: '15803D',
      },
      {
        metric: '0 Kasus',
        label: 'Nol Ruangan Bentrok',
        desc: 'Menghilangkan miskomunikasi ruangan dan mengoptimalkan pemanfaatan fasilitas kerja.',
        color: 'EA580C',
      },
      {
        metric: 'Tuntas',
        label: 'Tindak Lanjut Terukur',
        desc: 'Seluruh komitmen dan tugas rapat terpantau transparan hingga eksekusi akhir.',
        color: '7C3AED',
      },
    ];

    impacts.forEach((item, idx) => {
      const x = 0.8 + idx * 2.98;
      const y = 1.8;

      slide.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: 2.8,
        h: 4.7,
        rectRadius: 0.15,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1.2 },
      });

      slide.addText(item.metric, {
        x: x + 0.2,
        y: y + 0.5,
        w: 2.4,
        h: 0.8,
        fontSize: 30,
        bold: true,
        color: item.color,
        align: 'center',
        fontFace: FONT_TITLE,
      });

      slide.addText(item.label, {
        x: x + 0.2,
        y: y + 1.4,
        w: 2.4,
        h: 0.6,
        fontSize: 13,
        bold: true,
        color: C_DARK,
        align: 'center',
        fontFace: FONT_TITLE,
      });

      slide.addShape(pres.ShapeType.rect, {
        x: x + 0.4,
        y: y + 2.15,
        w: 2.0,
        h: 0.02,
        fill: { color: C_BORDER },
      });

      slide.addText(item.desc, {
        x: x + 0.25,
        y: y + 2.35,
        w: 2.3,
        h: 2.0,
        fontSize: 11,
        color: C_MUTED_DARK,
        lineSpacing: 17,
        align: 'center',
        fontFace: FONT_BODY,
      });
    });
  }

  // ==========================================
  // SLIDE 11: PENUTUP & DEMO
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: '0F172A' }; // Dark Closing Slide

    slide.addText('TERIMA KASIH', {
      x: 0.8,
      y: 1.4,
      w: 11.7,
      h: 0.4,
      fontSize: 13,
      bold: true,
      color: 'FB923C',
      align: 'center',
      fontFace: FONT_TITLE,
    });

    slide.addText([
      { text: 'Mulai Kolaborasi Rapat Lebih Pintar Bersama ', options: { color: 'FFFFFF' } },
      { text: 'MeetThink', options: { color: 'F97316', bold: true } },
    ], {
      x: 0.8,
      y: 1.9,
      w: 11.7,
      h: 0.9,
      fontSize: 28,
      bold: true,
      align: 'center',
      fontFace: FONT_TITLE,
    });

    // Box Container for Demo & Links
    slide.addShape(pres.ShapeType.roundRect, {
      x: 2.2,
      y: 3.2,
      w: 8.9,
      h: 2.7,
      rectRadius: 0.15,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1.5 },
    });

    slide.addText('🔗 Tautan & Akun Uji Coba Demo', {
      x: 2.5,
      y: 3.45,
      w: 8.3,
      h: 0.35,
      fontSize: 13,
      bold: true,
      color: '38BDF8',
      fontFace: FONT_TITLE,
    });

    slide.addText([
      { text: '• Website Live (Production): ', options: { bold: true, color: 'FFFFFF' } },
      { text: 'https://meetthink.vercel.app\n', options: { color: '60A5FA', bold: true } },
      { text: '• Repositori GitHub: ', options: { bold: true, color: 'FFFFFF' } },
      { text: 'https://github.com/allaboutpampam8-crypto/meetthink\n', options: { color: '60A5FA' } },
      { text: '• Akun Super Admin: ', options: { bold: true, color: 'FFFFFF' } },
      { text: 'superadmin@company.com  /  Admin@1234\n', options: { color: '94A3B8' } },
      { text: '• Akun Approver: ', options: { bold: true, color: 'FFFFFF' } },
      { text: 'kepala@company.com  /  Admin@1234', options: { color: '94A3B8' } },
    ], {
      x: 2.5,
      y: 3.9,
      w: 8.3,
      h: 1.8,
      fontSize: 11.5,
      fontFace: FONT_BODY,
      lineSpacing: 18,
    });

    slide.addText('Sesi Tanya Jawab (Q&A)', {
      x: 0.8,
      y: 6.3,
      w: 11.7,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: '94A3B8',
      align: 'center',
      fontFace: FONT_TITLE,
    });
  }

  const outputPath = path.resolve('MeetThink_Presentation.pptx');
  await pres.writeFile({ fileName: outputPath });
  console.log('✅ Clean Presentation successfully written to:', outputPath);
}

generateCleanPPT().catch(console.error);
