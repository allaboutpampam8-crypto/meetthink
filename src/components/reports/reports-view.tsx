'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BarChart3,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Utensils,
  Download,
  Printer,
  Building2,
  TrendingUp,
  Layers,
  Filter,
  ArrowUpRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts'
import { formatDateTime, formatTime } from '@/lib/utils'

interface ReportsViewProps {
  currentRange: string
  currentDivision: string
  availableDivisions: string[]
  kpi: {
    totalMeetings: number
    totalHours: number
    attendancePercentage: number
    attendedCount: number
    totalExpectedAttendees: number
    actionItemCompletionRate: number
    completedActionItems: number
    totalActionItems: number
    totalPortions: number
  }
  roomStats: Array<{
    name: string
    count: number
    hours: number
  }>
  divisionStats: Array<{
    name: string
    count: number
    hours: number
  }>
  trendStats: Array<{
    date: string
    meetings: number
    hours: number
  }>
  actionItemStats: Array<{
    name: string
    value: number
    color: string
  }>
  tableData: Array<{
    id: string
    title: string
    roomName: string
    requesterName: string
    division: string
    startAt: string
    endAt: string
    durationMinutes: number
    status: string
    totalInvited: number
    totalAttended: number
    attendanceRate: number
    portions: number
  }>
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#64748b']

export function ReportsView({
  currentRange,
  currentDivision,
  availableDivisions,
  kpi,
  roomStats,
  divisionStats,
  trendStats,
  actionItemStats,
  tableData,
}: ReportsViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filterRange, setFilterRange] = useState(currentRange)
  const [filterDivision, setFilterDivision] = useState(currentDivision)

  const applyFilter = (newRange: string, newDivision: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newRange) params.set('range', newRange)
    else params.delete('range')

    if (newDivision) params.set('division', newDivision)
    else params.delete('division')

    router.push(`/reports?${params.toString()}`)
  }

  const handleRangeChange = (val: string) => {
    setFilterRange(val)
    applyFilter(val, filterDivision)
  }

  const handleDivisionChange = (val: string) => {
    setFilterDivision(val)
    applyFilter(filterRange, val)
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (!tableData.length) {
      alert('Tidak ada data rapat untuk diekspor pada filter ini.')
      return
    }

    const headers = [
      'No',
      'Judul Rapat',
      'Ruang Rapat',
      'Divisi Pemohon',
      'Pemohon',
      'Tanggal Mulai',
      'Tanggal Selesai',
      'Durasi (Menit)',
      'Total Undangan',
      'Total Hadir',
      'Kehadiran (%)',
      'Porsi Konsumsi',
      'Status',
    ]

    const rows = tableData.map((item, idx) => [
      idx + 1,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.roomName.replace(/"/g, '""')}"`,
      `"${(item.division || 'Umum').replace(/"/g, '""')}"`,
      `"${item.requesterName.replace(/"/g, '""')}"`,
      new Date(item.startAt).toLocaleString('id-ID'),
      new Date(item.endAt).toLocaleString('id-ID'),
      item.durationMinutes,
      item.totalInvited,
      item.totalAttended,
      `${item.attendanceRate}%`,
      item.portions,
      item.status,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Laporan-MeetThink-${filterRange}-${filterDivision || 'Semua-Divisi'}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan & Analisis Rapat</h1>
          <p className="text-gray-500 mt-1">
            Statistik pemakaian ruang rapat, tingkat kehadiran, dan pemantauan tindak lanjut
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Ekspor CSV / Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-xl shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* Print only banner */}
      <div className="hidden print:block mb-4 pb-2 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Laporan Operasional Rapat — MeetThink</h1>
        <p className="text-xs text-gray-500">
          Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} · Periode:{' '}
          {filterRange} · Divisi: {filterDivision || 'Semua Divisi'}
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        {/* Periode options */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mr-1.5 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Periode:
          </span>
          {[
            { id: '30d', label: '30 Hari Terakhir' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'quarter', label: 'Kuartal Ini' },
            { id: 'year', label: 'Tahun Ini' },
            { id: 'all', label: 'Semua Waktu' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleRangeChange(btn.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                filterRange === btn.id
                  ? 'bg-orange-500 text-white font-bold shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Division Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Divisi:</span>
          <select
            value={filterDivision}
            onChange={(e) => handleDivisionChange(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 outline-none focus:border-orange-500"
          >
            <option value="">Semua Divisi</option>
            {availableDivisions.map((div) => (
              <option key={div} value={div}>
                {div}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Rapat</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{kpi.totalMeetings}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Rapat disetujui / terlaksana</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Jam Ruang</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">
            {kpi.totalHours} <span className="text-xs font-bold text-gray-500">Jam</span>
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Akumulasi penggunaan ruang</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Tingkat Hadir</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            {kpi.attendancePercentage}%
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {kpi.attendedCount} dari {kpi.totalExpectedAttendees} hadir
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Tindak Lanjut</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">
            {kpi.actionItemCompletionRate}%
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {kpi.completedActionItems} dari {kpi.totalActionItems} tugas selesai
          </p>
        </div>

        {/* Card 5 */}
        <div className="col-span-2 lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Konsumsi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2">
            {kpi.totalPortions} <span className="text-xs font-bold text-amber-700">Porsi</span>
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Total persiapan konsumsi</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Utilisasi Ruangan */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-500" />
                Utilisasi Ruang Rapat
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Frekuensi rapat dan total jam pemakaian masing-masing ruangan
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {roomStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Belum ada data pemakaian ruangan pada periode ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      name === 'count' ? `${value} Kali Rapat` : `${value} Jam`,
                      name === 'count' ? 'Frekuensi' : 'Total Durasi',
                    ]}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} name="count" />
                  <Bar dataKey="hours" fill="#3b82f6" radius={[6, 6, 0, 0]} name="hours" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-orange-500" /> Jumlah Rapat (Kali)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500" /> Durasi Terpakai (Jam)
            </span>
          </div>
        </div>

        {/* Chart 2: Distribusi Rapat Berdasarkan Divisi */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                Distribusi Rapat Berdasarkan Divisi
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Perbandingan jumlah kegiatan rapat yang diselenggarakan tiap divisi
              </p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {divisionStats.length === 0 ? (
              <div className="text-xs text-gray-400">
                Belum ada data divisi pada periode ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={divisionStats}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {divisionStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} Rapat`, `Divisi ${name}`]}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val) => <span className="text-xs text-gray-700">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Tren Intensitas Rapat */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Tren Intensitas Rapat dari Waktu ke Waktu
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Perkembangan jumlah rapat dan akumulasi jam per tanggal
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            {trendStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Belum ada data tren rapat
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val} Rapat`, 'Jumlah Rapat']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="meetings"
                    stroke="#f97316"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMeetings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Kepatuhan Status Tindak Lanjut */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                Status Penyelesaian Tindak Lanjut (Action Items)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Proporsi tugas hasil notulensi rapat yang sudah selesai vs masih dalam proses
              </p>
            </div>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {kpi.totalActionItems === 0 ? (
              <div className="text-xs text-gray-400">
                Belum ada tugas tindak lanjut pada periode ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={actionItemStats}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ name, percent }: any) =>
                      percent ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={false}
                  >
                    {actionItemStats.map((entry, index) => (
                      <Cell key={`cell-action-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} Tugas`, name]}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val) => <span className="text-xs text-gray-700">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Rekapitulasi Agenda Rapat Terinci</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Daftar kegiatan rapat sesuai kriteria filter ({tableData.length} data)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Agenda Rapat</th>
                <th className="py-3 px-4">Ruangan</th>
                <th className="py-3 px-4">Divisi & Pemohon</th>
                <th className="py-3 px-4">Waktu Pelaksanaan</th>
                <th className="py-3 px-4 text-center">Kehadiran</th>
                <th className="py-3 px-4 text-center">Konsumsi</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Tidak ditemukan data rapat pada periode dan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                tableData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{item.title}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800">{item.roomName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{item.division || 'Umum'}</p>
                      <p className="text-[11px] text-gray-400">{item.requesterName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">
                        {new Date(item.startAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {formatTime(item.startAt)} – {formatTime(item.endAt)} ({item.durationMinutes} mnt)
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full ${
                          item.attendanceRate >= 75
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.attendanceRate > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.totalAttended}/{item.totalInvited} ({item.attendanceRate}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-800">
                      {item.portions} porsi
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'APPROVED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.status === 'COMPLETED' ? 'Selesai' : 'Disetujui'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
