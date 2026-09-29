import { prisma } from '@/lib/db'
import { Resend } from 'resend'
import { NotificationType } from '@prisma/client'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@meeting.app'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'MeetThink'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// Lazy-initialized — hanya dibuat saat pertama kali email akan dikirim
let resendClient: Resend | null = null
function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY ?? 'dummy')
  }
  return resendClient
}

interface CreateNotificationOptions {
  userId: string
  bookingId?: string
  type: NotificationType
  title: string
  body: string
  link?: string
  sendEmail?: boolean
  emailSubject?: string
  emailHtml?: string
}

export async function createNotification(opts: CreateNotificationOptions) {
  // 1. Simpan notifikasi in-app ke DB
  const notification = await prisma.notification.create({
    data: {
      userId: opts.userId,
      bookingId: opts.bookingId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      link: opts.link,
    },
  })

  // 2. Kirim email jika diminta dan user punya preferensi email on
  if (opts.sendEmail && opts.emailHtml) {
    const user = await prisma.user.findUnique({
      where: { id: opts.userId },
      select: { email: true, name: true, notifEmail: true },
    })
    if (user?.notifEmail) {
      await getResend().emails.send({
        from: `${APP_NAME} <${FROM}>`,
        to: user.email,
        subject: opts.emailSubject ?? opts.title,
        html: opts.emailHtml,
      }).catch((err) => console.error('Email send error:', err))
    }
  }

  return notification
}

// ─── Event-specific helpers ────────────────────────────────────────────────

export async function notifyBookingSubmitted(bookingId: string, approverId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { requester: true, room: true },
  })
  if (!booking) return

  await createNotification({
    userId: approverId,
    bookingId,
    type: 'APPROVAL_REQUEST',
    title: 'Pengajuan Booking Baru',
    body: `${booking.requester.name} mengajukan booking ruang ${booking.room.name}.`,
    link: `/approvals/${bookingId}`,
    sendEmail: true,
    emailSubject: `[MMS] Pengajuan Booking: ${booking.title}`,
    emailHtml: buildEmailTemplate({
      title: 'Pengajuan Booking Baru',
      body: `
        <p>Halo,</p>
        <p><strong>${booking.requester.name}</strong> mengajukan peminjaman ruang rapat dan membutuhkan persetujuan Anda.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Judul</td><td style="padding:8px;border:1px solid #eee">${booking.title}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Ruang</td><td style="padding:8px;border:1px solid #eee">${booking.room.name}</td></tr>
        </table>
      `,
      cta: { label: 'Tinjau Pengajuan', url: `${APP_URL}/approvals/${bookingId}` },
    }),
  })
}

export async function notifyBookingApproved(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      requester: true,
      room: true,
      participants: { include: { user: true } },
    },
  })
  if (!booking) return

  // Notify requester
  await createNotification({
    userId: booking.requesterId,
    bookingId,
    type: 'BOOKING_APPROVED',
    title: 'Booking Disetujui ✅',
    body: `Booking "${booking.title}" di ${booking.room.name} telah disetujui.`,
    link: `/bookings/${bookingId}`,
    sendEmail: true,
    emailSubject: `[MMS] Booking Disetujui: ${booking.title}`,
    emailHtml: buildEmailTemplate({
      title: 'Booking Disetujui!',
      body: `<p>Booking Anda untuk <strong>${booking.title}</strong> di ruang <strong>${booking.room.name}</strong> telah disetujui oleh semua approver.</p>`,
      cta: { label: 'Lihat Detail', url: `${APP_URL}/bookings/${bookingId}` },
    }),
  })

  // Notify all participants
  for (const participant of booking.participants) {
    if (participant.userId && participant.userId !== booking.requesterId) {
      await createNotification({
        userId: participant.userId,
        bookingId,
        type: 'BOOKING_APPROVED',
        title: 'Undangan Rapat',
        body: `Anda diundang ke rapat "${booking.title}" di ${booking.room.name}.`,
        link: `/bookings/${bookingId}`,
      })
    }
  }
}

export async function notifyBookingRejected(bookingId: string, reason: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { requester: true, room: true },
  })
  if (!booking) return

  await createNotification({
    userId: booking.requesterId,
    bookingId,
    type: 'BOOKING_REJECTED',
    title: 'Booking Ditolak ❌',
    body: `Booking "${booking.title}" ditolak. Alasan: ${reason}`,
    link: `/bookings/${bookingId}`,
    sendEmail: true,
    emailSubject: `[MMS] Booking Ditolak: ${booking.title}`,
    emailHtml: buildEmailTemplate({
      title: 'Booking Ditolak',
      body: `
        <p>Maaf, booking Anda untuk <strong>${booking.title}</strong> ditolak.</p>
        <p><strong>Alasan:</strong> ${reason}</p>
        <p>Anda dapat mengajukan booking baru dengan penyesuaian.</p>
      `,
      cta: { label: 'Lihat Detail', url: `${APP_URL}/bookings/${bookingId}` },
    }),
  })
}

export async function notifyActionItemAssigned(actionItemId: string) {
  const item = await prisma.actionItem.findUnique({
    where: { id: actionItemId },
    include: {
      pic: true,
      meeting: { include: { booking: true } },
    },
  })
  if (!item) return

  await createNotification({
    userId: item.picId,
    bookingId: item.meeting.bookingId,
    type: 'ACTION_ITEM_ASSIGNED',
    title: 'Tindak Lanjut Baru Ditugaskan 📋',
    body: `Anda ditugaskan tindak lanjut: "${item.description}" dari rapat "${item.meeting.booking.title}". Deadline: ${new Date(item.deadline).toLocaleDateString('id-ID')}.`,
    link: `/action-items`,
    sendEmail: true,
    emailSubject: `[MMS] Tindak Lanjut Baru: ${item.description}`,
    emailHtml: buildEmailTemplate({
      title: 'Tindak Lanjut Baru Ditugaskan',
      body: `
        <p>Halo <strong>${item.pic.name}</strong>,</p>
        <p>Anda telah ditugaskan untuk menindaklanjuti hasil rapat <strong>${item.meeting.booking.title}</strong>.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Tugas</td><td style="padding:8px;border:1px solid #eee">${item.description}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Batas Waktu (Deadline)</td><td style="padding:8px;border:1px solid #eee">${new Date(item.deadline).toLocaleDateString('id-ID', { dateStyle: 'full' })}</td></tr>
        </table>
      `,
      cta: { label: 'Buka Tindak Lanjut', url: `${APP_URL}/action-items` },
    }),
  })
}

// ─── Email template builder ────────────────────────────────────────────────

function buildEmailTemplate(opts: {
  title: string
  body: string
  cta?: { label: string; url: string }
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#1d4ed8;padding:24px;color:#fff">
      <h1 style="margin:0;font-size:20px">${APP_NAME}</h1>
    </div>
    <div style="padding:24px">
      <h2 style="margin:0 0 16px;color:#111">${opts.title}</h2>
      ${opts.body}
      ${opts.cta ? `<a href="${opts.cta.url}" style="display:inline-block;margin-top:16px;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600">${opts.cta.label}</a>` : ''}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #eee;color:#888;font-size:12px">
      Email ini dikirim otomatis oleh ${APP_NAME}. Mohon tidak membalas email ini.
    </div>
  </div>
</body>
</html>`
}
