'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.2)'

export function SpkApprovalActions({ spkId, canApprove }: { spkId: string; canApprove: boolean }) {
  const router = useRouter()
  const [showReject, setShowReject] = useState(false)
  const [alasan, setAlasan] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!canApprove) {
    return <span style={{ fontSize: '12px', color: SECONDARY, opacity: 0.6 }}>Menunggu persetujuan</span>
  }

  async function approve() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.from('spk').update({ status: 'AKTIF' }).eq('id', spkId)
    if (error) { setError(error.message); setLoading(false); return }
    router.refresh()
  }

  async function reject() {
    if (!alasan.trim()) { setError('Alasan penolakan wajib diisi.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.from('spk').update({ status: 'BATAL', alasan_batal: alasan.trim() }).eq('id', spkId)
    if (error) { setError(error.message); setLoading(false); return }
    router.refresh()
  }

  return (
    <div>
      {error && <p style={{ color: '#dc2626', fontSize: '12px', margin: '0 0 8px 0' }}>{error}</p>}
      {!showReject ? (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={approve} disabled={loading} style={{
            padding: '7px 16px', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0',
            borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#166534',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? '...' : 'Setujui'}
          </button>
          <button onClick={() => setShowReject(true)} disabled={loading} style={{
            padding: '7px 16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca',
            borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#991b1b',
            cursor: 'pointer',
          }}>
            Tolak
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            value={alasan}
            onChange={e => setAlasan(e.target.value)}
            placeholder="Alasan penolakan..."
            rows={2}
            style={{
              width: '100%', padding: '8px 12px', backgroundColor: '#FFFFFF',
              border: `1px solid ${BORDER}`, borderRadius: '6px', color: NAVY,
              fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={reject} disabled={loading} style={{
              padding: '7px 16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca',
              borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#991b1b',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? '...' : 'Konfirmasi Tolak'}
            </button>
            <button onClick={() => { setShowReject(false); setAlasan(''); setError('') }} disabled={loading} style={{
              padding: '7px 12px', backgroundColor: '#FFFFFF', border: `1px solid ${BORDER}`,
              borderRadius: '6px', fontSize: '12px', color: NAVY, cursor: 'pointer',
            }}>
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
