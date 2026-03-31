'use client'

import { useState } from 'react'

interface ReviewFormProps {
  spaId: string
  bookingId?: string
  onSubmitSuccess?: () => void
}

export default function ReviewForm({ spaId, bookingId, onSubmitSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaId,
          bookingId,
          rating,
          title,
          comment,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setTitle('')
        setComment('')
        setRating(5)
        onSubmitSuccess?.()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError('Failed to submit review')
      }
    } catch (error) {
      setError('An error occurred while submitting the review')
      console.error('Review submission error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Share Your Experience</h3>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Thank you! Your review has been submitted.
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-3xl transition ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-semibold mb-2">
            Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your experience"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500"
          />
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-semibold mb-2">
            Your Review
          </label>
          <textarea
            id="comment"
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..."
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-warm-600 text-white py-2 rounded-lg hover:bg-warm-700 disabled:opacity-50 font-semibold transition"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}
