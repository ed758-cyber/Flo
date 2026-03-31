'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SupportTicket {
  id: string
  subject: string
  message: string
  status: string
  priority: string
  user: {
    name: string
    email: string
  }
  createdAt: string
}

export default function ManagerSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('OPEN')

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  const fetchTickets = async () => {
    try {
      const response = await fetch(`/api/manager/support?status=${statusFilter}`)
      const data = await response.json()
      setTickets(data || [])
    } catch (error) {
      console.error('Failed to fetch support tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await fetch(`/api/manager/support/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchTickets()
    } catch (error) {
      console.error('Failed to update ticket:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600'
      case 'MEDIUM':
        return 'text-yellow-600'
      case 'LOW':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Link href="/manager" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Manager
          </Link>
          <h1 className="text-3xl font-bold">Customer Support Tickets</h1>
          <p className="text-gray-600 mt-2">Manage and respond to customer support requests</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white border-b max-w-6xl mx-auto px-6 py-4">
        <div className="flex gap-2">
          {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Support Tickets List */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No {statusFilter.toLowerCase()} support tickets</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      From: {ticket.user.name} ({ticket.user.email})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{ticket.message}</p>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Created: {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    {ticket.status !== 'CLOSED' && (
                      <>
                        {ticket.status !== 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateTicketStatus(ticket.id, 'IN_PROGRESS')}
                            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm"
                          >
                            Start
                          </button>
                        )}
                        {ticket.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateTicketStatus(ticket.id, 'RESOLVED')}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => updateTicketStatus(ticket.id, 'CLOSED')}
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
                        >
                          Close
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
