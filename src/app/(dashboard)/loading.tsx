import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Loading Indicator & Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="space-y-2">
          {/* Badge skeleton */}
          <div className="h-5 w-32 bg-slate-200 rounded-full animate-pulse" />
          {/* Title skeleton */}
          <div className="h-8 w-64 sm:w-80 bg-slate-200 rounded-xl animate-pulse" />
          {/* Subtitle skeleton */}
          <div className="h-4 w-48 sm:w-96 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        
        {/* Active loading pill status */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100/80 text-blue-700 text-xs font-semibold self-start sm:self-center shadow-2xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          <span>Memuat data sistem...</span>
        </div>
      </div>

      {/* KPI / Stat Cards Skeleton (4 columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 bg-slate-200 rounded-md animate-pulse" />
              <div className="w-8 h-8 rounded-xl bg-slate-100 animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-3 w-28 bg-slate-100 rounded-md animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Section (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="h-5 w-36 bg-slate-200 rounded-md animate-pulse" />
              <div className="h-4 w-20 bg-slate-100 rounded-md animate-pulse" />
            </div>

            {/* List items placeholders */}
            <div className="space-y-3 pt-1">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse flex-shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="h-4 w-3/4 max-w-xs bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-1/2 max-w-sm bg-slate-100 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Section (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="h-5 w-32 bg-slate-200 rounded-md animate-pulse pb-3 border-b border-slate-100" />
            
            <div className="space-y-3">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2"
                >
                  <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
