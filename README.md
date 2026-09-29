# MeetThink - Meeting Management System

MeetThink adalah sistem manajemen rapat komprehensif yang dirancang untuk merencanakan, mengelola persetujuan berjenjang, absensi berbasis QR code, notulensi rapat, serta pelacakan action items secara terpadu.

## 🚀 Fitur Utama

- **Dashboard Interaktif**: Statistik rapat harian, ruangan aktif, tingkat kehadiran, dan pelacakan action item.
- **Pemesanan Ruangan**: Pemilihan ruangan dengan pengecekan bentrok jadwal otomatis (*calendar conflict detection*).
- **Multi-Level Approval**: Alur persetujuan berjenjang yang fleksibel dengan catatan penolakan/persetujuan (*audit trail*).
- **Absensi Real-Time & QR Code**:
  - Check-in peserta via QR code atau manual oleh organizer.
  - Window check-in cerdas (dibuka 30 menit sebelum rapat dimulai).
- **Notulensi & Action Items**: Pencatatan notulensi rapat, penguncian status finalisasi, dan delegasi tugas (*action items*) dengan deadline.
- **Pelaporan & Analisis**: Laporan tingkat utilisasi ruangan, tingkat kehadiran peserta, dan efektivitas tindak lanjut rapat.
- **Role-Based Access Control**: Mendukung multi-peran (`SUPER_ADMIN`, `ADMIN`, `APPROVER`, `USER`).

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Database**: PostgreSQL (Neon Database)
- **ORM**: Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Styling**: Tailwind CSS & Lucide Icons
- **Deployment**: Vercel

## 📦 Menjalankan Secara Lokal

1. **Clone repositori**:
   ```bash
   git clone https://github.com/allaboutpampam8-crypto/meetthink.git
   cd meetthink
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**:
   Salin `.env.example` ke `.env` dan lengkapi konfigurasi database serta kredensial auth.

4. **Generate Prisma Client & Migrasi**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Jalankan development server**:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser.
