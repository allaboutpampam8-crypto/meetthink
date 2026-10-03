import { Loader2 } from 'lucide-react'

export default function BookingDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top back button skeleton & indicator */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-28 bg-slate-200 rounded-md animate-pulse" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/80 text-blue-700 text-xs font-semibold shadow-2xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          <span>Memuat detail rapat...</span>
        </div>
      </div>

      {/* Main Detail Header Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2.5 flex-1">
            <div className="flex items-center gap-3">
              <div className="h-7 w-64 sm:w-96 bg-slate-200 rounded-xl animate-pulse" />
              <div className="h-6 w-24 bg-slate-100 rounded-full animate-pulse" />
            </div>
            <div className="h-4 w-48 bg-slate-100 rounded-md animate-pulse" />
          </div>
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Info Grid (4 columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Attendance & Timeline Section Skeletons */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="h-5 w-40 bg-slate-200 rounded animate-pulse pb-2 border-b border-slate-100" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
