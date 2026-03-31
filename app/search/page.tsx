'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Spa {
  id: string
  name: string
  slug: string
  description: string
  logoUrl?: string
  address?: string
  email?: string
  phone?: string
  averageRating?: number
  reviewCount?: number
}

export default function SearchPage() {
  const [spas, setSpas] = useState<Spa[]>([])
  const [filteredSpas, setFilteredSpas] = useState<Spa[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [minRating, setMinRating] = useState(0)

  useEffect(() => {
    fetchSpas()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, sortBy, minRating, spas])

  const fetchSpas = async () => {
    try {
      const response = await fetch('/api/spas')
      const data = await response.json()
      setSpas(data || [])
    } catch (error) {
      console.error('Failed to fetch spas:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let results = spas.filter((spa) => {
      const matchesSearch =
        spa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spa.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spa.address?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRating = (spa.averageRating || 0) >= minRating

      return matchesSearch && matchesRating
    })

    // Sort results
    switch (sortBy) {
      case 'rating':
        results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        break
      case 'reviews':
        results.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
        break
      default:
        results.sort((a, b) => a.name.localeCompare(b.name))
    }

    setFilteredSpas(results)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-warm-400 to-nude-500 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <Link href="/" className="text-white hover:opacity-80 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4">Find Your Perfect Wellness Experience</h1>
          <p className="text-lg opacity-90">Search and discover wellness locations in Saint Lucia</p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name, location, service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-400"
              >
                <option value="name">Name (A-Z)</option>
                <option value="rating">Highest Rating</option>
                <option value="reviews">Most Reviews</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Min. Rating</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-400"
              >
                <option value={0}>All Ratings</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
                <option value={5}>5 Stars Only</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{filteredSpas.length}</span> result
                {filteredSpas.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading wellness locations...</p>
          </div>
        ) : filteredSpas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No wellness locations found matching your criteria</p>
            <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpas.map((spa) => (
              <Link
                key={spa.id}
                href={`/s/${spa.slug}`}
                className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                {spa.logoUrl && (
                  <div className="relative h-48 w-full bg-gray-200 overflow-hidden">
                    <img
                      src={spa.logoUrl}
                      alt={spa.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-semibold text-lg group-hover:text-warm-500 transition">
                    {spa.name}
                  </h3>

                  {spa.address && (
                    <p className="text-sm text-gray-600 mt-1">📍 {spa.address}</p>
                  )}

                  {spa.description && (
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">{spa.description}</p>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    {spa.averageRating ? (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= Math.round(spa.averageRating || 0)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          ({spa.reviewCount || 0})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">No reviews yet</span>
                    )}

                    <button className="bg-warm-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-warm-500 transition">
                      View Details
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
