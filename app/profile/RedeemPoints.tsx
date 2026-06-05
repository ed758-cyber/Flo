'use client'
import { useState } from 'react'

export default function RedeemPoints({ currentPoints }: { currentPoints: number }) {
  const [points, setPoints] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch('/api/redeemPoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ ok: false, error: 'Network error' })
    }
    setLoading(false)
  }

  return (
    <div className='p-4 bg-white rounded-xl shadow'>
      <h3 className='font-semibold mb-2'>Redeem Points</h3>
      <div className='text-sm text-gray-600 mb-3'>You have <span className='font-medium'>{currentPoints}</span> points.</div>
      <form onSubmit={submit} className='flex items-center gap-2'>
        <input type='number' min={1} max={currentPoints} value={points} onChange={(e) => setPoints(Number(e.target.value))} className='border px-3 py-2 rounded-lg w-28' />
        <button disabled={loading || points <= 0} className='px-3 py-2 bg-warm-500 text-white rounded-lg'>{loading ? 'Redeeming...' : 'Redeem'}</button>
      </form>
      {result && (
        <div className={`mt-3 p-2 rounded ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.ok ? `Redeemed: $${(result.discountCents/100).toFixed(2)} — Remaining points: ${result.remainingPoints}` : result.error}
        </div>
      )}
    </div>
  )
}
