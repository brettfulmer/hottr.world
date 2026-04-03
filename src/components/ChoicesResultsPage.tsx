import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface VoteTally { version: number; count: number }

export default function ChoicesResultsPage() {
  const [pin, setPin] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tallies, setTallies] = useState<VoteTally[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const PIN_CODE = '3450'

  const handlePin = () => {
    if (pin === PIN_CODE) setAuthed(true)
  }

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    supabase.from('track_votes').select('version').then(({ data }) => {
      if (!data) { setLoading(false); return }
      const counts = [0, 0, 0]
      for (const row of data) {
        if (row.version >= 1 && row.version <= 3) counts[row.version - 1]++
      }
      setTallies(counts.map((count, i) => ({ version: i + 1, count })))
      setTotal(data.length)
      setLoading(false)
    })
  }, [authed])

  // Auto-refresh every 10s
  useEffect(() => {
    if (!authed) return
    const id = setInterval(() => {
      supabase.from('track_votes').select('version').then(({ data }) => {
        if (!data) return
        const counts = [0, 0, 0]
        for (const row of data) {
          if (row.version >= 1 && row.version <= 3) counts[row.version - 1]++
        }
        setTallies(counts.map((count, i) => ({ version: i + 1, count })))
        setTotal(data.length)
      })
    }, 10000)
    return () => clearInterval(id)
  }, [authed])

  if (!authed) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center" style={{ fontFamily: "'Sora', sans-serif" }}>
        <div style={{
          borderRadius: '1.5rem',
          background: 'rgba(10,10,10,0.9)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,12,182,0.3)',
          boxShadow: '0 0 30px rgba(255,12,182,0.2)',
          padding: '28px 32px',
          maxWidth: 340,
          width: '90%',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 16 }}>
            RESULTS
          </div>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePin()}
            placeholder="Enter PIN"
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,12,182,0.3)',
              color: '#fff', fontSize: 16, textAlign: 'center',
              fontFamily: "'Sora', sans-serif", letterSpacing: '4px',
              outline: 'none',
            }}
          />
          <button onClick={handlePin} style={{
            display: 'block', width: '100%', marginTop: 12,
            padding: '12px 0', borderRadius: '2rem',
            background: '#FF0CB6', border: 'none', color: '#fff',
            fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(255,12,182,0.4)',
          }}>
            VIEW RESULTS
          </button>
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...tallies.map(t => t.count), 1)

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div style={{
        borderRadius: '1.5rem',
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,12,182,0.3)',
        boxShadow: '0 0 30px rgba(255,12,182,0.2)',
        padding: '28px 28px',
        maxWidth: 440,
        width: '92%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 20, color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 4 }}>
            DANCEFLOOR
          </div>
          <div style={{ fontSize: 12, color: '#a0a0a0', letterSpacing: '0.5px' }}>
            {loading ? 'Loading...' : `${total} votes · auto-refreshes every 10s`}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tallies.map(({ version, count }) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            const isLeader = count === maxCount && count > 0
            return (
              <div key={version}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{
                    fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16,
                    color: isLeader ? '#FF0CB6' : '#e2e2e2',
                  }}>
                    Version {version} {isLeader && ' ★'}
                  </span>
                  <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, color: '#a0a0a0' }}>
                    {count} vote{count !== 1 ? 's' : ''} · {pct}%
                  </span>
                </div>
                <div style={{
                  width: '100%', height: 8, borderRadius: 4,
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%', borderRadius: 4,
                    background: isLeader ? '#FF0CB6' : 'rgba(255,12,182,0.4)',
                    boxShadow: isLeader ? '0 0 10px rgba(255,12,182,0.5)' : 'none',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
