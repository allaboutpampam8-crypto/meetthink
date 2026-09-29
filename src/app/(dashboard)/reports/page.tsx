import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ReportsView } from '@/components/reports/reports-view'

export const metadata: Metadata = {
  title: 'Laporan & Analitik Rapat',
  description: 'Statistik eksekutif, utilisasi ruang, dan rekapitulasi operasional rapat',
}

interface PageProps {
  searchParams: Promise<{
    range?: string
    division?: string
  }>
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const session = await auth()
  const role = session?.user?.role ?? 'USER'

  // Hanya SUPER_ADMIN dan ADMIN yang diizinkan mengakses laporan
  if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
    redirect('/dashboard')
  }

  const resolvedParams = await searchParams
  const currentRange = resolvedParams?.range || '30d'
  const currentDivision = resolvedParams?.division || ''

  // 1. Hitung Rentang Tanggal Filter
  const now = new Date()
  let startDate: Date | undefined

  if (currentRange === '30d') {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  } else if (currentRange === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (currentRange === 'quarter') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  } else if (currentRange === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1)
  } else if (currentRange === 'all') {
    startDate = undefined
  } else {
    // Default 30 hari
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }

  // 2. Susun Query Prisma (Hanya rapat yang sudah terlaksana / sedang berjalan)
  const whereClause: any = {
    status: { in: ['APPROVED', 'COMPLETED'] },
    startAt: {
      ...(startDate ? { gte: startDate } : {}),
      lte: now,
    },
  }

  if (currentDivision) {
    whereClause.requester = {
      division: {
        equals: currentDivision,
        mode: 'insensitive',
      },
    }
  }

  const [bookings, usersWithDivisions] = await Promise.all([
    prisma.booking.findMany({
      where: whereClause,
      include: {
        room: {
          select: {
            id: true,
            name: true,
            floor: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            division: true,
          },
        },
        participants: {
          select: {
            id: true,
            attendedAt: true,
          },
        },
        meeting: {
          select: {
            id: true,
            actionItems: {
              select: {
                id: true,
                status: true,
                deadline: true,
              },
            },
          },
        },
      },
      orderBy: {
        startAt: 'desc',
      },
    }),
    prisma.user.findMany({
      where: {
        division: { not: null },
        isActive: true,
      },
      select: { division: true },
      distinct: ['division'],
    }),
  ])

  // Ambil daftar divisi unik yang tersedia
  const availableDivisions = usersWithDivisions
    .map((u) => u.division?.trim())
    .filter((d): d is string => !!d && d.length > 0)
    .sort()

  // 3. Agregasi Metrik & Data Visualisasi
  let totalMinutes = 0
  let attendedCount = 0
  let totalExpectedAttendees = 0
  let totalPortions = 0
  const allActionItems: { id: string; status: string; deadline: Date }[] = []

  const roomMap = new Map<string, { count: number; minutes: number }>()
  const divisionMap = new Map<string, { count: number; minutes: number }>()
  const trendMap = new Map<string, { count: number; minutes: number }>()

  const tableData = bookings.map((b) => {
    const duration = Math.max(0, Math.round((b.endAt.getTime() - b.startAt.getTime()) / (60 * 1000)))
    totalMinutes += duration

    const totalInvited = b.participants.length + 1
    const totalAttended =
      (b.requesterAttendedAt ? 1 : 0) + b.participants.filter((p) => p.attendedAt !== null).length

    totalExpectedAttendees += totalInvited
    attendedCount += totalAttended
    totalPortions += totalInvited

    if (b.meeting?.actionItems) {
      allActionItems.push(...b.meeting.actionItems)
    }

    // Room stats
    const rName = b.room.name
    const rStat = roomMap.get(rName) || { count: 0, minutes: 0 }
    rStat.count += 1
    rStat.minutes += duration
    roomMap.set(rName, rStat)

    // Division stats
    const dName = b.requester.division?.trim() || 'Umum'
    const dStat = divisionMap.get(dName) || { count: 0, minutes: 0 }
    dStat.count += 1
    dStat.minutes += duration
    divisionMap.set(dName, dStat)

    // Trend stats by date (format: YYYY-MM-DD)
    const dateKey = b.startAt.toISOString().split('T')[0]
    const tStat = trendMap.get(dateKey) || { count: 0, minutes: 0 }
    tStat.count += 1
    tStat.minutes += duration
    trendMap.set(dateKey, tStat)

    const attendanceRate = totalInvited > 0 ? Math.round((totalAttended / totalInvited) * 100) : 0

    return {
      id: b.id,
      title: b.title,
      roomName: b.room.name,
      requesterName: b.requester.name,
      division: b.requester.division?.trim() || 'Umum',
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      durationMinutes: duration,
      status: b.status,
      totalInvited,
      totalAttended,
      attendanceRate,
      portions: totalInvited,
    }
  })

  // KPI Calculations
  const totalMeetings = bookings.length
  const totalHours = Number((totalMinutes / 60).toFixed(1))
  const attendancePercentage =
    totalExpectedAttendees > 0 ? Math.round((attendedCount / totalExpectedAttendees) * 100) : 0

  const totalActionItems = allActionItems.length
  const completedActionItems = allActionItems.filter((a) => a.status === 'DONE').length
  const actionItemCompletionRate =
    totalActionItems > 0 ? Math.round((completedActionItems / totalActionItems) * 100) : 0

  // Format Room Stats
  const roomStats = Array.from(roomMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      hours: Number((data.minutes / 60).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count)

  // Format Division Stats
  const divisionStats = Array.from(divisionMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      hours: Number((data.minutes / 60).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count)

  // Format Trend Stats
  const trendStats = Array.from(trendMap.entries())
    .map(([date, data]) => {
      const d = new Date(date)
      const formattedDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      return {
        rawDate: date,
        date: formattedDate,
        meetings: data.count,
        hours: Number((data.minutes / 60).toFixed(1)),
      }
    })
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
    .map(({ date, meetings, hours }) => ({
      date,
      meetings,
      hours,
    }))

  // Format Action Item Stats dengan kalkulasi keterlambatan dinamis
  const isItemOverdue = (a: { status: string; deadline: Date }) =>
    a.status !== 'DONE' && new Date(a.deadline) < now

  const actionItemCounts = {
    DONE: allActionItems.filter((a) => a.status === 'DONE').length,
    OVERDUE: allActionItems.filter((a) => isItemOverdue(a)).length,
    IN_PROGRESS: allActionItems.filter((a) => a.status === 'IN_PROGRESS' && !isItemOverdue(a)).length,
    OPEN: allActionItems.filter((a) => a.status === 'OPEN' && !isItemOverdue(a)).length,
  }

  const actionItemStats = [
    { name: 'Selesai (Done)', value: actionItemCounts.DONE, color: '#10b981' },
    { name: 'Sedang Proses', value: actionItemCounts.IN_PROGRESS, color: '#f59e0b' },
    { name: 'Terbuka (Open)', value: actionItemCounts.OPEN, color: '#3b82f6' },
    { name: 'Terlambat (Overdue)', value: actionItemCounts.OVERDUE, color: '#ef4444' },
  ].filter((item) => item.value > 0)

  return (
    <ReportsView
      currentRange={currentRange}
      currentDivision={currentDivision}
      availableDivisions={availableDivisions}
      kpi={{
        totalMeetings,
        totalHours,
        attendancePercentage,
        attendedCount,
        totalExpectedAttendees,
        actionItemCompletionRate,
        completedActionItems,
        totalActionItems,
        totalPortions,
      }}
      roomStats={roomStats}
      divisionStats={divisionStats}
      trendStats={trendStats}
      actionItemStats={actionItemStats}
      tableData={tableData}
    />
  )
}
