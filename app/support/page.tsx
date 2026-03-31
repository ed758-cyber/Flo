'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SupportTicket {
  id: string
  subject: string
  message: string
  status: string
  priority: string
  spa?: {
    name: string
  }
  createdAt: string
  updatedAt: string
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'MEDIUM',
    spaId: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/support')
      const data = await response.json()
      setTickets(data || [])
    } catch (error) {
      console.error('Failed to fetch support tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newTicket = await response.json()
        setTickets([newTicket, ...tickets])
        setFormData({
          subject: '',
          message: '',
          priority: 'MEDIUM',
          spaId: '',
        })
        setShowForm(false)
      }
    } catch (error) {
      console.error('Failed to create support ticket:', error)
    } finally {
      setSubmitting(false)
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
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Support & Help</h1>
              <p className="text-gray-600 mt-2">Get help with your bookings and account</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {showForm ? 'Cancel' : 'Create Ticket'}
            </button>
          </div>
        </div>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Message</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Support Tickets List */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No support tickets yet</p>
            <p className="text-gray-400 mt-2">Create one to get help from our support team</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                    {ticket.spa && (
                      <p className="text-sm text-gray-600 mt-1">Related to: {ticket.spa.name}</p>
                    )}
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

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
