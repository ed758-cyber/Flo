'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  data?: any
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications')
        const data = await response.json()
        setNotifications(data.notifications || [])
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, read: true }),
      })
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
    } catch (error) {
      console.error('Failed to update notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return '✓'
      case 'BOOKING_CANCELLED':
        return '✕'
      case 'BOOKING_REMINDER':
        return '🔔'
      case 'PAYMENT_RECEIVED':
        return '💳'
      case 'REVIEW_RECEIVED':
        return '⭐'
      case 'SUPPORT_RESPONSE':
        return '💬'
      default:
        return '•'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-gray-600 mt-2">Stay updated with your bookings and account activity</p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer transition ${
                  !notification.read ? 'border-l-4 border-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-2xl mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{notification.title}</h3>
                      <p className="text-gray-700 mt-1">{notification.message}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                        {new Date(notification.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
