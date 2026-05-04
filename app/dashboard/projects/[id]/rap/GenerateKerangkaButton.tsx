'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateRapScaffold } from './actions'

const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'

const SCAFFOLDABLE = ['PERSIAPAN', 'STRUKTUR', 'ARSITEKTUR', 'MEP'] as const

type Props = {
  projectId: string
  counts: Record<string, number>
}

export default function GenerateKerangkaButton({ projectId, counts }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set(SCAFFOLDABLE))
  const [toast, setToast] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggle(k: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(k) ? next.delete(k) : next.add(k)
      return next
    })
  }

  function handleGenerate() {
    startTransition(async () => {
      const { inserted, skipped } = await generateRapScaffold(projectId, [...selected])
      setOpen(false)
      setToast(`Berhasil! ${inserted} item baru ditambahkan, ${skipped} item di-skip (sudah ada).`)
      router.refresh()
      setTimeout(() => setToast(null), 5000)
    })
  }

  const totalWillInsert = [...selected].reduce((s, k) => s + (counts[k] ?? 0), 0)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '7px 14px',
          backgroundColor: 'transparent',
          border: `1px solid ${GOLD}`,
          borderRadius: '8px',
          color: NAVY,
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        📋 Generate Kerangka
      </button>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534',
          padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)', maxWidth: '380px',
        }}>
          {toast}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'rgba(13,46,66,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF', borderRadius: '14px',
              padding: '28px 32px', width: '420px', maxWidth: '92vw',
              boxShadow: '0 20px 60px rgba(13,46,66,0.3)',
              border: `1px solid ${BORDER}`,
            }}
          >
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: NAVY, margin: '0 0 8px 0' }}>
              Generate Kerangka RAP
            </h2>
            <p style={{ fontSize: '13px', color: SECONDARY, margin: '0 0 24px 0', lineHeight: '1.6' }}>
              Pilih kategori yang ingin di-generate. Item yang sudah ada (cek by kategori + sub_kategori + deskripsi) akan di-skip otomatis.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {SCAFFOLDABLE.map(k => (
                <label key={k} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: selected.has(k) ? '#F5F0E8' : '#FAFAFA',
                  border: `1px solid ${selected.has(k) ? 'rgba(212,175,55,0.4)' : BORDER}`,
                  transition: 'background 0.1s',
                }}>
                  <input
                    type="checkbox"
                    checked={selected.has(k)}
                    onChange={() => toggle(k)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: GOLD }}
                  />
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: NAVY }}>{k}</span>
                  <span style={{
                    fontSize: '11px', fontWeight: '600', color: '#7a5c00',
                    backgroundColor: 'rgba(212,175,55,0.15)', padding: '2px 8px',
                    borderRadius: '12px', border: '1px solid rgba(212,175,55,0.3)',
                  }}>
                    {counts[k] ?? 0} item
                  </span>
                </label>
              ))}
            </div>

            <div style={{ fontSize: '12px', color: SECONDARY, marginBottom: '20px' }}>
              Total estimasi: <strong style={{ color: NAVY }}>{totalWillInsert} item</strong> akan dicek & di-insert jika belum ada.
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                style={{
                  padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  backgroundColor: '#FFFFFF', border: `1px solid ${BORDER}`, color: NAVY,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleGenerate}
                disabled={isPending || selected.size === 0}
                style={{
                  padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  backgroundColor: selected.size === 0 || isPending ? 'rgba(212,175,55,0.4)' : GOLD,
                  border: 'none', color: '#FFFFFF', cursor: selected.size === 0 || isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Memproses...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
