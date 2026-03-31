'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Review {
  id: string
  rating: number
  title: string
  comment: string
  verified: boolean
  user: {
    name: string
    image?: string
  }
  createdAt: string
}

export default function ReviewsPage() {
  const params = useParams()
  const slug = params.slug as string
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState(0)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews?spaSlug=${slug}`)
        const data = await response.json()
        setReviews(data.reviews || [])
        setAverageRating(data.averageRating || 0)
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [slug])

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link href={`/s/${slug}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold mb-4">Customer Reviews</h1>
          {reviews.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold text-yellow-400">{averageRating.toFixed(1)}</div>
              <div>
                <div>{renderStars(Math.round(averageRating))}</div>
                <p className="text-gray-600 mt-2">Based on {reviews.length} reviews</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      {review.user.image && (
                        <img
                          src={review.user.image}
                          alt={review.user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{review.user.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  {review.verified && (
                    <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                      Verified Purchase
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  {renderStars(review.rating)}
                </div>

                <h3 className="font-semibold text-lg mb-2">{review.title}</h3>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
