'use client'

import { Bell } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timeAgo } from '@/lib/utils'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  body: string
  link?: string
  isRead: boolean
  createdAt: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data } = useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
    refetchInterval: 30_000, // poll setiap 30 detik
  })

  const markAllRead = useMutation({
    mutationFn: () =>
      fetch('/api/notifications/read', { method: 'PATCH', body: JSON.stringify({ all: true }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markRead = useMutation({
    mutationFn: (id: string) =>
      fetch('/api/notifications/read', {
        method: 'PATCH',
        body: JSON.stringify({ id }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = data?.unreadCount ?? 0
  const notifications = data?.notifications ?? []

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifikasi</h3>
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markRead.mutate(n.id)
                    setOpen(false)
                  }}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  {n.link ? (
                    <Link href={n.link} className="block">
                      <NotificationItem n={n} />
                    </Link>
                  ) : (
                    <NotificationItem n={n} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ n }: { n: Notification }) {
  return (
    <>
      <div className="flex items-start gap-2">
        {!n.isRead && (
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
        )}
        <div className={!n.isRead ? '' : 'pl-4'}>
          <p className="text-sm font-medium text-gray-900">{n.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
          <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
        </div>
      </div>
    </>
  )
}
