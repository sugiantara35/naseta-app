'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveOverride, rejectOverride } from '@/app/dashboard/projects/[id]/spk/[spkId]/override-actions'

const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.2)'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', backgroundColor: '#FFFFFF',
  border: `1px solid ${BORDER}`, borderRadius: '8px', color: NAVY,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical',
}

export function OverrideActionButtons({ overrideId }: { overrideId: string }) {
  const router = useRouter()
  const [modal, setModal] = useState<'approve' | 'reject' | null>(null)
  const [alasan, setAlasan] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function openModal(type: 'approve' | 'reject') {
    setModal(type)
    setAlasan('')
    setError('')
  }

  function closeModal() {
    setModal(null)
    setAlasan('')
    setError('')
  }

  async function handleConfirm() {
    if (!alasan.trim()) { setError('Alasan keputusan wajib diisi.'); return }
    setLoading(true)
    setError('')
    try {
      if (modal === 'approve') {
        await approveOverride(overrideId, alasan.trim())
      } else {
        await rejectOverride(overrideId, alasan.trim())
      }
      closeModal()
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.')
      setLoading(false)
    }
  }

  const isApprove = modal === 'approve'

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => openModal('approve')}
          style={{
            padding: '8px 18px', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0',
            borderRadius: '7px', fontSize: '13px', fontWeight: '700', color: '#166534', cursor: 'pointer',
          }}
        >
          ✓ Setujui
        </button>
        <button
          onClick={() => openModal('reject')}
          style={{
            padding: '8px 18px', backgroundColor: '#FFFFFF', border: '1px solid #fecaca',
            borderRadius: '7px', fontSize: '13px', fontWeight: '700', color: '#991b1b', cursor: 'pointer',
          }}
        >
          ✗ Tolak
        </button>
      </div>

      {modal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px',
            maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{
              fontSize: '17px', fontWeight: '700',
              color: isApprove ? '#166534' : '#991b1b',
              margin: '0 0 6px 0',
            }}>
              {isApprove ? '✓ Setujui Override' : '✗ Tolak Override'}
            </h2>
            <p style={{ fontSize: '13px', color: SECONDARY, margin: '0 0 20px 0' }}>
              {isApprove
                ? 'SPK akan kembali ke status DRAFT dan masuk ke antrian approval Site Manager.'
                : 'SPK akan dibatalkan (status BATAL).'}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontSize: '11px', color: SECONDARY,
                marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600',
              }}>
                Alasan Keputusan *
              </label>
              <textarea
                value={alasan}
                onChange={e => setAlasan(e.target.value)}
                rows={3}
                placeholder={isApprove
                  ? 'Alasan persetujuan override...'
                  : 'Alasan penolakan override...'}
                style={inputStyle}
                autoFocus
              />
            </div>

            {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                style={{
                  padding: '10px 20px', backgroundColor: '#FFFFFF', color: NAVY,
                  border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading
                    ? 'rgba(0,0,0,0.3)'
                    : isApprove ? '#166534' : '#991b1b',
                  color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
