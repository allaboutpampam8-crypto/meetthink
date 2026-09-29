'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Building2,
  Users,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  X,
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

interface Room {
  id: string
  name: string
  code: string
  location: string
  capacity: number
  facilities: { id: string; name: string }[]
}

interface CalendarBooking {
  id: string
  title: string
  agenda?: string | null
  roomId: string
  roomName: string
  roomCode: string
  roomLocation: string
  capacity: number
  startAt: string
  endAt: string
  status: 'PENDING' | 'APPROVED'
  requesterName: string
  requesterDivision?: string | null
  participantCount: number
}

interface BlockedPeriod {
  id: string
  roomId: string
  roomName: string
  startAt: string
  endAt: string
  reason?: string | null
}

interface Props {
  initialRooms?: Room[]
  onSelectSlot?: (roomId: string, date: string, startTime: string, endTime: string) => void
}

type ViewMode = 'timeline' | 'week' | 'month'

const WORK_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]

export function BookingCalendar({ initialRooms, onSelectSlot }: Props) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL')
  const [minCapacity, setMinCapacity] = useState<number>(0)
  const [selectedFacility, setSelectedFacility] = useState<string>('')
  const [detailBooking, setDetailBooking] = useState<CalendarBooking | null>(null)

  // Calculate range for query based on viewMode and selectedDate
  const { queryStart, queryEnd } = useMemo(() => {
    const base = new Date(selectedDate)
    if (viewMode === 'timeline') {
      const s = new Date(base)
      s.setHours(0, 0, 0, 0)
      const e = new Date(base)
      e.setHours(23, 59, 59, 999)
      return { queryStart: s.toISOString(), queryEnd: e.toISOString() }
    } else if (viewMode === 'week') {
      const day = base.getDay() // 0 = Sun
      const diffToMon = day === 0 ? -6 : 1 - day
      const s = new Date(base)
      s.setDate(base.getDate() + diffToMon)
      s.setHours(0, 0, 0, 0)
      const e = new Date(s)
      e.setDate(s.getDate() + 6)
      e.setHours(23, 59, 59, 999)
      return { queryStart: s.toISOString(), queryEnd: e.toISOString() }
    } else {
      // month
      const s = new Date(base.getFullYear(), base.getMonth(), 1)
      const e = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999)
      return { queryStart: s.toISOString(), queryEnd: e.toISOString() }
    }
  }, [selectedDate, viewMode])

  // Fetch calendar data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['booking-calendar', queryStart, queryEnd, selectedRoomId],
    queryFn: async () => {
      const roomParam = selectedRoomId !== 'ALL' ? `&roomId=${selectedRoomId}` : ''
      const res = await fetch(
        `/api/bookings/calendar?start=${encodeURIComponent(queryStart)}&end=${encodeURIComponent(queryEnd)}${roomParam}`,
      )
      if (!res.ok) throw new Error('Gagal mengambil data kalender')
      return res.json() as Promise<{
        rooms: Room[]
        bookings: CalendarBooking[]
        blockedPeriods: BlockedPeriod[]
      }>
    },
  })

  const rooms = data?.rooms ?? initialRooms ?? []
  const bookings = data?.bookings ?? []
  const blockedPeriods = data?.blockedPeriods ?? []

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (selectedRoomId !== 'ALL' && r.id !== selectedRoomId) return false
      if (minCapacity > 0 && r.capacity < minCapacity) return false
      if (selectedFacility && !r.facilities.some((f) => f.name.toLowerCase().includes(selectedFacility.toLowerCase()))) {
        return false
      }
      return true
    })
  }, [rooms, selectedRoomId, minCapacity, selectedFacility])

  // All distinct facilities for filter dropdown
  const allFacilities = useMemo(() => {
    const set = new Set<string>()
    rooms.forEach((r) => r.facilities.forEach((f) => set.add(f.name)))
    return Array.from(set)
  }, [rooms])

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(selectedDate)
    if (viewMode === 'timeline') d.setDate(d.getDate() - 1)
    else if (viewMode === 'week') d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleNext = () => {
    const d = new Date(selectedDate)
    if (viewMode === 'timeline') d.setDate(d.getDate() + 1)
    else if (viewMode === 'week') d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  // Handle clicking an empty slot to book
  const handleSlotClick = (roomId: string, dateStr: string, hour: number) => {
    const startStr = `${String(hour).padStart(2, '0')}:00`
    const endStr = `${String(Math.min(18, hour + 1)).padStart(2, '0')}:00`

    if (onSelectSlot) {
      onSelectSlot(roomId, dateStr, startStr, endStr)
    } else {
      router.push(`/bookings/new?roomId=${roomId}&date=${dateStr}&startTime=${startStr}&endTime=${endStr}`)
    }
  }

  // Week days helper (Monday to Sunday)
  const weekDays = useMemo(() => {
    const base = new Date(selectedDate)
    const day = base.getDay()
    const diffToMon = day === 0 ? -6 : 1 - day
    const mon = new Date(base)
    mon.setDate(base.getDate() + diffToMon)

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon)
      d.setDate(mon.getDate() + i)
      return {
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
      }
    })
  }, [selectedDate])

  // Month grid helper
  const monthData = useMemo(() => {
    const base = new Date(selectedDate)
    const year = base.getFullYear()
    const month = base.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const startDayIndex = (firstDay.getDay() + 6) % 7 // Monday = 0
    const totalDays = lastDay.getDate()

    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = []

    // Padding from previous month
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({ dateStr: d.toISOString().split('T')[0], dayNumber: d.getDate(), isCurrentMonth: false })
    }
    // Days in current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i)
      days.push({ dateStr: d.toISOString().split('T')[0], dayNumber: i, isCurrentMonth: true })
    }
    // Padding to complete grid
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ dateStr: d.toISOString().split('T')[0], dayNumber: i, isCurrentMonth: false })
    }

    return { year, month, days }
  }, [selectedDate])

  return (
    <div className="space-y-4">
      {/* Top Controls Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs"
            >
              Hari Ini
            </button>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={handlePrev}
                className="p-1 rounded hover:bg-white text-gray-600 transition-colors"
                title="Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded hover:bg-white text-gray-600 transition-colors"
                title="Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 pl-2">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="text-sm font-bold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-600 outline-none cursor-pointer"
              />
              <span className="text-xs text-gray-500 hidden sm:inline">
                ({formatDate(selectedDate, 'EEEE, dd MMMM yyyy')})
              </span>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 text-xs font-medium">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Matriks Ruang (Hari)
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mingguan
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bulanan
              </button>
            </div>

            <button
              onClick={() => router.push('/bookings/new')}
              className="hidden sm:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Booking Baru
            </button>
          </div>
        </div>

        {/* Filters & Legend Bar */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            {/* Room Filter */}
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 text-xs outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Ruang ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code}) · {r.capacity} org
                </option>
              ))}
            </select>

            {/* Capacity Filter */}
            <select
              value={minCapacity}
              onChange={(e) => setMinCapacity(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 text-xs outline-none focus:border-blue-500"
            >
              <option value={0}>Semua Kapasitas</option>
              <option value={6}>Min. 6 orang</option>
              <option value={10}>Min. 10 orang</option>
              <option value={20}>Min. 20 orang</option>
            </select>

            {/* Facility Filter */}
            {allFacilities.length > 0 && (
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 text-xs outline-none focus:border-blue-500"
              >
                <option value="">Semua Fasilitas</option>
                {allFacilities.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            )}

            {(selectedRoomId !== 'ALL' || minCapacity > 0 || selectedFacility) && (
              <button
                onClick={() => {
                  setSelectedRoomId('ALL')
                  setMinCapacity(0)
                  setSelectedFacility('')
                }}
                className="text-blue-600 hover:underline font-medium ml-1"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              Tersedia (Bisa diklik)
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
              Disetujui
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
              Menunggu Approval
            </span>
          </div>
        </div>
      </div>

      {/* Main Calendar View Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Memuat jadwal dan ketersediaan ruang rapat...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-700 font-semibold">Tidak ada ruang yang sesuai filter</p>
          <p className="text-xs text-gray-400 mt-1">Coba ubah filter kapasitas atau fasilitas</p>
        </div>
      ) : (
        <>
          {/* 1. TIMELINE MULTI-ROOM GRID VIEW */}
          {viewMode === 'timeline' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="p-3 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600">
                <span className="font-semibold text-gray-800">
                  Jadwal Semua Ruang — {formatDate(selectedDate, 'EEEE, dd MMMM yyyy')}
                </span>
                <span className="text-gray-500">
                  💡 Tips: Klik pada slot hijau kosong untuk langsung booking jam tersebut
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-700">
                      <th className="py-3 px-4 w-48 border-r border-gray-200 bg-gray-100/60 sticky left-0 z-10">
                        Ruang Rapat
                      </th>
                      {WORK_HOURS.map((hour) => (
                        <th
                          key={hour}
                          className="py-3 px-2 text-center border-r border-gray-200 last:border-r-0 min-w-[70px] text-[11px] font-medium text-gray-500"
                        >
                          {String(hour).padStart(2, '0')}:00
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredRooms.map((room) => {
                      // Get all bookings on selectedDate for this room
                      const dayBookings = bookings.filter((b) => {
                        if (b.roomId !== room.id) return false
                        const bDate = b.startAt.split('T')[0]
                        return bDate === selectedDate
                      })

                      return (
                        <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Room Column */}
                          <td className="py-3 px-4 border-r border-gray-200 bg-white sticky left-0 z-10 shadow-xs">
                            <p className="font-semibold text-gray-900 leading-tight">{room.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{room.location}</p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                              <span className="flex items-center gap-0.5">
                                <Users className="w-3 h-3 text-gray-400" />
                                {room.capacity} org
                              </span>
                              {room.facilities.length > 0 && (
                                <span className="truncate text-gray-400" title={room.facilities.map((f) => f.name).join(', ')}>
                                  · {room.facilities[0].name}
                                  {room.facilities.length > 1 ? ` +${room.facilities.length - 1}` : ''}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Hourly Slot Cells */}
                          {WORK_HOURS.map((hour) => {
                            const slotStart = new Date(`${selectedDate}T${String(hour).padStart(2, '0')}:00:00`).getTime()
                            const slotEnd = new Date(`${selectedDate}T${String(hour + 1).padStart(2, '0')}:00:00`).getTime()

                            // Check if any booking overlaps with this hour slot
                            const matchedBooking = dayBookings.find((b) => {
                              const bStart = new Date(b.startAt).getTime()
                              const bEnd = new Date(b.endAt).getTime()
                              return slotStart < bEnd && slotEnd > bStart
                            })

                            if (matchedBooking) {
                              const isApproved = matchedBooking.status === 'APPROVED'
                              return (
                                <td
                                  key={hour}
                                  onClick={() => setDetailBooking(matchedBooking)}
                                  className={`p-1 border-r border-gray-100 last:border-r-0 cursor-pointer select-none transition-transform hover:opacity-90 ${
                                    isApproved ? 'bg-blue-50/80' : 'bg-amber-50/80'
                                  }`}
                                >
                                  <div
                                    className={`h-12 rounded px-1.5 py-1 flex flex-col justify-center overflow-hidden border shadow-2xs ${
                                      isApproved
                                        ? 'bg-blue-600 border-blue-700 text-white'
                                        : 'bg-amber-500 border-amber-600 text-white'
                                    }`}
                                    title={`${matchedBooking.title}\n${formatTime(matchedBooking.startAt)} - ${formatTime(matchedBooking.endAt)}\nOleh: ${matchedBooking.requesterName} (${matchedBooking.status})`}
                                  >
                                    <span className="font-bold text-[10px] truncate leading-tight">
                                      {matchedBooking.title}
                                    </span>
                                    <span className="text-[9px] opacity-90 truncate leading-tight">
                                      {formatTime(matchedBooking.startAt)}–{formatTime(matchedBooking.endAt)}
                                    </span>
                                  </div>
                                </td>
                              )
                            }

                            // Empty Available Slot
                            return (
                              <td
                                key={hour}
                                onClick={() => handleSlotClick(room.id, selectedDate, hour)}
                                className="p-1 border-r border-gray-100 last:border-r-0 cursor-pointer group hover:bg-emerald-50/80 transition-colors"
                              >
                                <div className="h-12 rounded border border-transparent group-hover:border-emerald-300 group-hover:bg-emerald-100/60 flex flex-col items-center justify-center text-emerald-700 transition-all">
                                  <span className="hidden group-hover:flex items-center gap-0.5 text-[10px] font-bold">
                                    <Plus className="w-3 h-3" /> Booking
                                  </span>
                                  <span className="text-[10px] text-gray-300 group-hover:hidden">
                                    —
                                  </span>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. WEEKLY CALENDAR VIEW */}
          {viewMode === 'week' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="p-3 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600">
                <span className="font-semibold text-gray-800">
                  Tampilan Mingguan ({selectedRoomId === 'ALL' ? 'Semua Ruang' : rooms.find((r) => r.id === selectedRoomId)?.name})
                </span>
                <span className="text-gray-500">
                  Klik slot kosong untuk reservasi
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-700">
                      <th className="py-3 px-3 w-20 border-r border-gray-200 bg-gray-100/60 text-center">
                        Jam
                      </th>
                      {weekDays.map((w) => (
                        <th
                          key={w.dateStr}
                          className={`py-2 px-2 text-center border-r border-gray-200 last:border-r-0 ${
                            w.isToday ? 'bg-blue-50/80 text-blue-800' : ''
                          }`}
                        >
                          <p className="text-[11px] font-medium text-gray-500 uppercase">{w.dayName}</p>
                          <p className={`text-sm font-bold ${w.isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                            {w.dayNumber}
                          </p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {WORK_HOURS.map((hour) => (
                      <tr key={hour} className="hover:bg-slate-50/40">
                        <td className="py-2.5 px-2 text-center font-medium text-gray-500 border-r border-gray-200 bg-gray-50/60 text-[11px]">
                          {String(hour).padStart(2, '0')}:00
                        </td>
                        {weekDays.map((w) => {
                          const slotStart = new Date(`${w.dateStr}T${String(hour).padStart(2, '0')}:00:00`).getTime()
                          const slotEnd = new Date(`${w.dateStr}T${String(hour + 1).padStart(2, '0')}:00:00`).getTime()

                          const dayBookings = bookings.filter((b) => {
                            if (selectedRoomId !== 'ALL' && b.roomId !== selectedRoomId) return false
                            const bStart = new Date(b.startAt).getTime()
                            const bEnd = new Date(b.endAt).getTime()
                            return slotStart < bEnd && slotEnd > bStart
                          })

                          if (dayBookings.length > 0) {
                            const b = dayBookings[0]
                            const isApproved = b.status === 'APPROVED'
                            return (
                              <td
                                key={w.dateStr}
                                onClick={() => setDetailBooking(b)}
                                className={`p-1 border-r border-gray-100 last:border-r-0 cursor-pointer ${
                                  isApproved ? 'bg-blue-50/50' : 'bg-amber-50/50'
                                }`}
                              >
                                <div
                                  className={`rounded p-1.5 flex flex-col justify-center text-white shadow-2xs ${
                                    isApproved ? 'bg-blue-600' : 'bg-amber-500'
                                  }`}
                                >
                                  <span className="font-semibold text-[10px] truncate">{b.title}</span>
                                  <span className="text-[9px] opacity-90 truncate">
                                    {b.roomName} · {formatTime(b.startAt)}
                                  </span>
                                </div>
                              </td>
                            )
                          }

                          return (
                            <td
                              key={w.dateStr}
                              onClick={() => {
                                const targetRoom = selectedRoomId !== 'ALL' ? selectedRoomId : rooms[0]?.id
                                if (targetRoom) handleSlotClick(targetRoom, w.dateStr, hour)
                              }}
                              className="p-1 border-r border-gray-100 last:border-r-0 cursor-pointer group hover:bg-emerald-50/70"
                            >
                              <div className="h-10 rounded border border-transparent group-hover:border-emerald-300 group-hover:bg-emerald-100/50 flex items-center justify-center text-emerald-700">
                                <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. MONTHLY CALENDAR VIEW */}
          {viewMode === 'month' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="p-3 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600">
                <span className="font-semibold text-gray-800">
                  Kalender Bulan{' '}
                  {new Date(monthData.year, monthData.month).toLocaleDateString('id-ID', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-gray-500">Klik tanggal untuk melihat matriks jam</span>
              </div>

              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-600 py-2.5">
                <span>Senin</span>
                <span>Selasa</span>
                <span>Rabu</span>
                <span>Kamis</span>
                <span>Jumat</span>
                <span>Sabtu</span>
                <span>Minggu</span>
              </div>

              <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
                {monthData.days.map((d, idx) => {
                  const dayBookings = bookings.filter((b) => b.startAt.split('T')[0] === d.dateStr)
                  const isSelected = d.dateStr === selectedDate
                  const isToday = d.dateStr === new Date().toISOString().split('T')[0]

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDate(d.dateStr)
                        setViewMode('timeline')
                      }}
                      className={`min-h-[90px] p-2 cursor-pointer transition-colors relative group ${
                        !d.isCurrentMonth
                          ? 'bg-gray-50/60 text-gray-300'
                          : isSelected
                          ? 'bg-blue-50/60'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                            isToday
                              ? 'bg-blue-600 text-white'
                              : isSelected
                              ? 'text-blue-700 font-bold'
                              : 'text-gray-700'
                          }`}
                        >
                          {d.dayNumber}
                        </span>
                        {dayBookings.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full">
                            {dayBookings.length} rapat
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 overflow-hidden max-h-[55px]">
                        {dayBookings.slice(0, 2).map((b) => (
                          <div
                            key={b.id}
                            className={`text-[10px] px-1 py-0.5 rounded truncate font-medium text-white ${
                              b.status === 'APPROVED' ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                          >
                            {formatTime(b.startAt)} {b.title}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <p className="text-[9px] text-gray-400 font-medium pl-1">
                            +{dayBookings.length - 2} lainnya
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL POPOVER */}
      {detailBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    detailBooking.status === 'APPROVED'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {detailBooking.status === 'APPROVED' ? 'Disetujui' : 'Menunggu Approval'}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{detailBooking.title}</h3>
              </div>
              <button
                onClick={() => setDetailBooking(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-sm text-gray-600 bg-gray-50 rounded-xl p-3.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  <strong>{detailBooking.roomName}</strong> ({detailBooking.roomLocation})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  {formatDate(detailBooking.startAt, 'EEEE, dd MMMM yyyy')} ·{' '}
                  {formatTime(detailBooking.startAt)} – {formatTime(detailBooking.endAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  Penyelenggara: <strong>{detailBooking.requesterName}</strong>
                  {detailBooking.requesterDivision ? ` (${detailBooking.requesterDivision})` : ''} ·{' '}
                  {detailBooking.participantCount} peserta
                </span>
              </div>
              {detailBooking.agenda && (
                <div className="pt-2 border-t border-gray-200/60">
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">Agenda:</p>
                  <p className="text-xs text-gray-600 line-clamp-3">{detailBooking.agenda}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDetailBooking(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => router.push(`/bookings/${detailBooking.id}`)}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Lihat Detail Rapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
