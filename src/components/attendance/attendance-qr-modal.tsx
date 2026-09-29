'use client'

import { useState, useEffect } from 'react'
import {
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
  Users,
} from 'lucide-react'
import Image from 'next/image'

interface AttendanceQrModalProps {
  bookingId: string
  meetingTitle: string
  roomName: string
  dateTimeText: string
  isOpen: boolean
  onClose: () => void
  onAttendeeUpdated?: () => void
}

export function AttendanceQrModal({
  bookingId,
  meetingTitle,
  roomName,
  dateTimeText,
  isOpen,
  onClose,
  onAttendeeUpdated,
}: AttendanceQrModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{
    token: string
    checkInUrl: string
    qrDataUrl: string
    stats: { total: number; attended: number; percentage: number }
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isProjectorMode, setIsProjectorMode] = useState(false)

  const fetchQr = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/attendance-qr`)
      if (!res.ok) {
        throw new Error('Gagal memuat QR Code presensi')
      }
      const json = await res.json()
      setData(json)
      if (onAttendeeUpdated) {
        onAttendeeUpdated()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchQr()
    } else {
      setIsProjectorMode(false)
    }
  }, [isOpen, bookingId])

  // Optional: Auto refresh every 10 seconds while modal is open
  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      fetchQr()
    }, 10000)
    return () => clearInterval(interval)
  }, [isOpen, bookingId])

  if (!isOpen) return null

  const handleCopy = () => {
    if (!data?.checkInUrl) return
    navigator.clipboard.writeText(data.checkInUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!data?.qrDataUrl) return
    const link = document.createElement('a')
    link.href = data.qrDataUrl
    link.download = `QR-Presensi-${meetingTitle.replace(/\s+/g, '-').slice(0, 30)}.png`
    link.click()
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${
          isProjectorMode
            ? 'w-full h-full max-w-none max-h-none rounded-none'
            : 'w-full max-w-lg max-h-[90vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">QR Presensi Rapat</h2>
              <p className="text-xs text-gray-500">Scan barcode untuk mencatat kehadiran peserta</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsProjectorMode(!isProjectorMode)}
              title={isProjectorMode ? 'Tampilan Standar' : 'Mode Proyektor / Layar Penuh'}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 rounded-lg transition-colors"
            >
              {isProjectorMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
          {loading && !data ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Membuat Barcode Presensi...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <button
                onClick={fetchQr}
                className="mt-3 px-4 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700"
              >
                Coba Lagi
              </button>
            </div>
          ) : data ? (
            <div className="w-full flex flex-col items-center">
              {/* Meeting info context */}
              <div className="mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200/60 px-2.5 py-0.5 rounded-full">
                  {roomName}
                </span>
                <h3
                  className={`font-black text-gray-900 mt-2 ${
                    isProjectorMode ? 'text-2xl sm:text-3xl' : 'text-lg'
                  }`}
                >
                  {meetingTitle}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{dateTimeText}</p>
              </div>

              {/* QR Image Box */}
              <div
                className={`p-3 bg-white border-2 border-dashed border-gray-200 rounded-2xl shadow-sm inline-block transition-all ${
                  isProjectorMode ? 'p-6 scale-110 sm:scale-125 my-4' : 'my-2'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.qrDataUrl}
                  alt="QR Code Presensi Rapat"
                  className={isProjectorMode ? 'w-72 h-72 sm:w-80 sm:h-80' : 'w-56 h-56'}
                />
              </div>

              {/* Instructions */}
              <p className="text-xs text-gray-500 mt-2 max-w-sm">
                Arahkan kamera ponsel atau pemindai QR ke barcode di atas untuk mengisi daftar kehadiran.
              </p>

              {/* Live Attendance Counter */}
              <div className="mt-4 flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200/80 rounded-xl px-4 py-2 text-emerald-900">
                <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-medium">Kehadiran Saat Ini:</span>
                <span className="text-xs font-bold text-emerald-700">
                  {data.stats.attended} dari {data.stats.total} Orang ({data.stats.percentage}%)
                </span>
                <button
                  onClick={fetchQr}
                  title="Segarkan data kehadiran"
                  disabled={loading}
                  className="ml-1 text-emerald-700 hover:text-emerald-900 transition-transform active:rotate-180"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Link Box */}
              {!isProjectorMode && (
                <div className="w-full mt-5 bg-gray-50 border border-gray-200 rounded-xl p-3 text-left">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase">
                      Tautan Presensi Manual / Alternatif
                    </span>
                    <a
                      href={data.checkInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium"
                    >
                      Buka Tautan <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={data.checkInUrl}
                      className="text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 flex-1 select-all font-mono"
                    />
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex-shrink-0 shadow-2xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={!data?.qrDataUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Gambar</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!data?.qrDataUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
