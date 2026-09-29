'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface BookingSlot {
  id: string
  title: string
  startAt: string
  endAt: string
  status: 'PENDING' | 'APPROVED'
  requesterName: string
}

interface RoomDayTimelineProps {
  roomId: string
  date: string // YYYY-MM-DD
  selectedStartTime?: string // HH:mm
  selectedEndTime?: string // HH:mm
  onSelectSlot?: (startTime: string, endTime: string) => void
}

const START_HOUR = 8 // 08:00
const END_HOUR = 18 // 18:00
const TOTAL_HOURS = END_HOUR - START_HOUR

export function RoomDayTimeline({
  roomId,
  date,
  selectedStartTime,
  selectedEndTime,
  onSelectSlot,
}: RoomDayTimelineProps) {
  // Fetch schedule for this room and date
  const { data, isLoading } = useQuery({
    queryKey: ['room-schedule-day', roomId, date],
    queryFn: async () => {
      if (!roomId || !date) return { bookings: [] }
      const start = `${date}T00:00:00.000Z`
      const end = `${date}T23:59:59.999Z`
      const res = await fetch(`/api/rooms/${roomId}/schedule?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
      if (!res.ok) throw new Error('Gagal mengambil jadwal')
      return res.json() as Promise<{ bookings: BookingSlot[] }>
    },
    enabled: Boolean(roomId && date),
  })

  const bookings = data?.bookings ?? []

  // Helper to convert time "HH:mm" or ISO string to percentage offset on timeline (0% at 08:00, 100% at 18:00)
  const getTimelinePos = (timeStr: string) => {
    let d: Date
    if (timeStr.includes('T')) {
      d = new Date(timeStr)
    } else {
      const [h, m] = timeStr.split(':').map(Number)
      d = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
    }
    const hours = d.getHours() + d.getMinutes() / 60
    const clamped = Math.max(START_HOUR, Math.min(END_HOUR, hours))
    return ((clamped - START_HOUR) / TOTAL_HOURS) * 100
  }

  // Calculate free time slots during 08:00 - 18:00
  const freeSlots = useMemo(() => {
    if (!date || isLoading) return []

    // Sort existing bookings by start time
    const sorted = [...bookings]
      .map((b) => {
        const s = new Date(b.startAt)
        const e = new Date(b.endAt)
        return {
          startMinutes: s.getHours() * 60 + s.getMinutes(),
          endMinutes: e.getHours() * 60 + e.getMinutes(),
        }
      })
      .sort((a, b) => a.startMinutes - b.startMinutes)

    const workStart = START_HOUR * 60 // 480
    const workEnd = END_HOUR * 60 // 1080

    const slots: { start: string; end: string; durationMin: number }[] = []
    let cursor = workStart

    for (const b of sorted) {
      if (b.startMinutes > cursor) {
        const duration = b.startMinutes - cursor
        if (duration >= 30) {
          const sH = String(Math.floor(cursor / 60)).padStart(2, '0')
          const sM = String(cursor % 60).padStart(2, '0')
          const eH = String(Math.floor(b.startMinutes / 60)).padStart(2, '0')
          const eM = String(b.startMinutes % 60).padStart(2, '0')
          slots.push({
            start: `${sH}:${sM}`,
            end: `${eH}:${eM}`,
            durationMin: duration,
          })
        }
      }
      cursor = Math.max(cursor, b.endMinutes)
    }

    if (cursor < workEnd) {
      const duration = workEnd - cursor
      if (duration >= 30) {
        const sH = String(Math.floor(cursor / 60)).padStart(2, '0')
        const sM = String(cursor % 60).padStart(2, '0')
        const eH = String(Math.floor(workEnd / 60)).padStart(2, '0')
        const eM = String(workEnd % 60).padStart(2, '0')
        slots.push({
          start: `${sH}:${sM}`,
          end: `${eH}:${eM}`,
          durationMin: duration,
        })
      }
    }

    return slots
  }, [bookings, date, isLoading])

  // Check if selected time range collides
  const collision = useMemo(() => {
    if (!selectedStartTime || !selectedEndTime || selectedStartTime >= selectedEndTime) return false
    const selStart = new Date(`${date}T${selectedStartTime}:00`).getTime()
    const selEnd = new Date(`${date}T${selectedEndTime}:00`).getTime()

    return bookings.some((b) => {
      const bStart = new Date(b.startAt).getTime()
      const bEnd = new Date(b.endAt).getTime()
      return selStart < bEnd && selEnd > bStart
    })
  }, [bookings, date, selectedStartTime, selectedEndTime])

  if (!roomId || !date) return null

  // Timeline markers (08:00, 09:00, ..., 18:00)
  const hourTicks = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i)

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Ketersediaan Ruang (Pukul 08:00 – 18:00)
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-gray-600">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
            Tersedia
          </span>
          <span className="flex items-center gap-1 text-gray-600">
            <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
            Disetujui
          </span>
          <span className="flex items-center gap-1 text-gray-600">
            <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
            Pending
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          Memuat jadwal ketersediaan ruang...
        </div>
      ) : (
        <>
          {/* Visual Timeline Bar */}
          <div className="relative pt-6 pb-2">
            {/* Hour labels */}
            <div className="absolute top-0 inset-x-0 flex justify-between text-[11px] font-medium text-gray-400 select-none">
              {hourTicks.map((h) => (
                <span key={h} className="-translate-x-1/2 first:translate-x-0 last:translate-x-0">
                  {String(h).padStart(2, '0')}:00
                </span>
              ))}
            </div>

            {/* Main Bar Track */}
            <div className="h-10 bg-emerald-50 border border-emerald-200 rounded-lg relative overflow-hidden shadow-inner">
              {/* Vertical hour guidelines */}
              {hourTicks.slice(1, -1).map((h) => {
                const left = ((h - START_HOUR) / TOTAL_HOURS) * 100
                return (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 border-l border-emerald-200/60 pointer-events-none"
                    style={{ left: `${left}%` }}
                  />
                )
              })}

              {/* Existing Booked Blocks */}
              {bookings.map((b) => {
                const left = getTimelinePos(b.startAt)
                const right = getTimelinePos(b.endAt)
                const width = Math.max(1, right - left)
                const isApproved = b.status === 'APPROVED'

                return (
                  <div
                    key={b.id}
                    title={`${b.title} (${formatTime(b.startAt)} - ${formatTime(b.endAt)}) oleh ${b.requesterName} [${b.status}]`}
                    className={`absolute top-1 bottom-1 rounded px-1.5 flex flex-col justify-center text-[10px] font-semibold text-white shadow-sm overflow-hidden truncate transition-transform hover:scale-[1.02] cursor-default ${
                      isApproved ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <span className="truncate leading-tight">{b.title}</span>
                    <span className="text-[9px] opacity-90 truncate leading-tight">
                      {formatTime(b.startAt)}–{formatTime(b.endAt)}
                    </span>
                  </div>
                )
              })}

              {/* Selected Booking Indicator (Overlay box) */}
              {selectedStartTime && selectedEndTime && selectedStartTime < selectedEndTime && (
                (() => {
                  const left = getTimelinePos(selectedStartTime)
                  const right = getTimelinePos(selectedEndTime)
                  const width = Math.max(1.5, right - left)

                  return (
                    <div
                      className={`absolute top-0 bottom-0 border-2 rounded pointer-events-none z-10 animate-pulse transition-all ${
                        collision
                          ? 'bg-red-500/30 border-red-600'
                          : 'bg-purple-500/25 border-purple-600'
                      }`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                        Pilihan: {selectedStartTime}–{selectedEndTime}
                      </div>
                    </div>
                  )
                })()
              )}
            </div>
          </div>

          {/* Quick Slot Suggestions / Available Time Pickers */}
          <div className="pt-1">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Slot Kosong Hari Ini (Klik untuk pilih langsung):
              </span>
              {bookings.length > 0 ? (
                <span className="text-xs text-gray-500">
                  {bookings.length} jadwal terisi
                </span>
              ) : (
                <span className="text-xs text-emerald-600 font-medium">
                  Sepanjang hari masih kosong
                </span>
              )}
            </div>

            {freeSlots.length === 0 ? (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Ruang rapat ini sudah penuh untuk jam kerja hari tersebut. Silakan pilih tanggal atau ruang lain.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {freeSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectSlot?.(slot.start, slot.end)}
                    className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 hover:border-emerald-300 rounded-lg px-2.5 py-1.5 transition-colors shadow-xs"
                    title={`Klik untuk mengatur waktu ${slot.start} – ${slot.end}`}
                  >
                    <span>{slot.start} – {slot.end}</span>
                    <span className="text-[10px] text-emerald-600 font-normal">
                      ({slot.durationMin / 60}j)
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {collision && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>
                Peringatan: Rentang jam yang Anda pilih bertabrakan dengan rapat lain yang ada di ruang ini!
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
