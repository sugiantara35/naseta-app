'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'
const CARD_BG = '#FFFFFF'
const INPUT_BG = '#FFFFFF'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

const STATUS_BADGE: Record<string, React.CSSProperties> = {
  MENUNGGU_SM:      { backgroundColor: '#fef9c3', color: '#854d0e' },
  DISETUJUI_SM:     { backgroundColor: '#dbeafe', color: '#1e40af' },
  RENUMERASI_SM:    { backgroundColor: '#dbeafe', color: '#1e40af' },
  DITOLAK_SM:       { backgroundColor: '#fee2e2', color: '#991b1b' },
  DITOLAK_FINANCE:  { backgroundColor: '#fee2e2', color: '#991b1b' },
  DITOLAK_DIREKTUR: { backgroundColor: '#fee2e2', color: '#991b1b' },
  DISETUJUI_FINANCE:   { backgroundColor: '#e0e7ff', color: '#3730a3' },
  DISETUJUI_DIREKTUR:  { backgroundColor: '#dcfce7', color: '#166534' },
  SELESAI:             { backgroundColor: '#f0fdf4', color: '#15803d' },
}

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU_SM:      'Menunggu SM',
  DISETUJUI_SM:     'Disetujui SM',
  RENUMERASI_SM:    'Renumerasi SM',
  DITOLAK_SM:       'Ditolak SM',
  DITOLAK_FINANCE:  'Ditolak Finance',
  DITOLAK_DIREKTUR: 'Ditolak Direktur',
  DISETUJUI_FINANCE:   'Disetujui Finance',
  DISETUJUI_DIREKTUR:  'Disetujui Direktur',
  SELESAI:             'Selesai',
}

function PengajuanStatusBadge({ status }: { status: string }) {
  const style = STATUS_BADGE[status] ?? { backgroundColor: '#f3f4f6', color: '#374151' }
  return (
    <span style={{ ...style, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

type PengajuanDetail = {
  id: string
  spk_id: string
  jumlah_diajukan: number
  jumlah_disetujui: number | null
  status: string
  catatan_pengaju: string | null
  catatan_sm: string | null
  catatan_finance: string | null
  catatan_direktur: string | null
  created_at: string
  spk: {
    nomor_spk: string
    divisi: string
    project_id: string
    vendors: { nama: string } | null
    projects: { nama: string } | null
  } | null
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', backgroundColor: INPUT_BG,
  border: `1px solid rgba(13,46,66,0.2)`, borderRadius: '8px', color: NAVY,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

function StageCard({
  title, stepNum, done, active, rejected, children,
}: {
  title: string
  stepNum: string
  done: boolean
  active: boolean
  rejected: boolean
  children?: React.ReactNode
}) {
  const dotBg = rejected ? '#ef4444' : done ? '#22c55e' : active ? '#D4AF37' : '#d1d5db'
  const dotColor = (done || active || rejected) ? '#fff' : '#9ca3af'
  const borderColor = rejected ? '#fecaca' : done ? '#bbf7d0' : active ? 'rgba(212,175,55,0.5)' : BORDER

  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', backgroundColor: dotBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: '700', color: dotColor, flexShrink: 0,
        }}>
          {rejected ? '✕' : done ? '✓' : stepNum}
        </div>
        <div style={{ width: '2px', flex: 1, backgroundColor: BORDER, marginTop: '6px', minHeight: '20px' }} />
      </div>
      <div style={{
        flex: 1, backgroundColor: CARD_BG,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px', padding: '20px', marginBottom: '0',
        boxShadow: active ? '0 0 0 3px rgba(212,175,55,0.08)' : 'none',
      }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', color: NAVY, margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}

export default function PengajuanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [pengajuan, setPengajuan] = useState<PengajuanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [smAction, setSmAction] = useState<'none' | 'setujui' | 'renumerasi' | 'tolak'>('none')
  const [renumerasiAmount, setRenumerasiAmount] = useState('')
  const [smReason, setSmReason] = useState('')

  const [financeAction, setFinanceAction] = useState<'none' | 'tolak'>('none')
  const [financeReason, setFinanceReason] = useState('')

  const [dirAction, setDirAction] = useState<'none' | 'tolak'>('none')
  const [dirReason, setDirReason] = useState('')

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('pengajuan')
      .select('*, spk:spk_id(nomor_spk, divisi, project_id, vendors(nama), projects(nama))')
      .eq('id', id)
      .single()

    if (error || !data) {
      setFetchError('Pengajuan tidak ditemukan.')
    } else {
      setPengajuan(data as PengajuanDetail)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  async function updateStatus(updates: Record<string, unknown>) {
    setSaving(true)
    setSaveError('')
    const supabase = createClient()
    const { error } = await supabase.from('pengajuan').update(updates).eq('id', id)
    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return false
    }
    setSaving(false)
    setSmAction('none'); setFinanceAction('none'); setDirAction('none')
    setSmReason(''); setFinanceReason(''); setDirReason(''); setRenumerasiAmount('')
    await fetchData()
    return true
  }

  async function handleSmSetujui() {
    if (!pengajuan) return
    await updateStatus({ status: 'DISETUJUI_SM', jumlah_disetujui: pengajuan.jumlah_diajukan })
  }

  async function handleSmRenumerasi() {
    if (!renumerasiAmount) return setSaveError('Masukkan jumlah renumerasi.')
    await updateStatus({ status: 'RENUMERASI_SM', jumlah_disetujui: parseFloat(renumerasiAmount) })
  }

  async function handleSmTolak() {
    if (!smReason.trim()) return setSaveError('Masukkan alasan penolakan.')
    await updateStatus({ status: 'DITOLAK_SM', catatan_sm: smReason.trim() })
  }

  async function handleFinanceApprove() {
    await updateStatus({ status: 'DISETUJUI_FINANCE' })
  }

  async function handleFinanceTolak() {
    if (!financeReason.trim()) return setSaveError('Masukkan alasan penolakan.')
    await updateStatus({ status: 'DITOLAK_FINANCE', catatan_finance: financeReason.trim() })
  }

  async function handleDirApprove() {
    await updateStatus({ status: 'DISETUJUI_DIREKTUR' })
  }

  async function handleDirTolak() {
    if (!dirReason.trim()) return setSaveError('Masukkan alasan penolakan.')
    await updateStatus({ status: 'DITOLAK_DIREKTUR', catatan_direktur: dirReason.trim() })
  }

  async function handleTandaiLunas() {
    if (!pengajuan) return
    setSaving(true)
    setSaveError('')
    const supabase = createClient()

    const { error: payErr } = await supabase.from('spk_payments').insert({
      spk_id: pengajuan.spk_id,
      jumlah: pengajuan.jumlah_disetujui ?? pengajuan.jumlah_diajukan,
      tanggal: new Date().toISOString().split('T')[0],
      catatan: `Lunas — Pengajuan disetujui Direktur`,
    })

    if (payErr) {
      setSaveError(payErr.message)
      setSaving(false)
      return
    }

    await updateStatus({ status: 'SELESAI' })
  }

  if (loading) return <div style={{ color: SECONDARY, fontSize: '14px', paddingTop: '40px' }}>Memuat data...</div>
  if (fetchError || !pengajuan) return <div style={{ color: '#dc2626', fontSize: '14px', paddingTop: '40px' }}>{fetchError}</div>

  const status = pengajuan.status
  const smDone = status !== 'MENUNGGU_SM'
  const smRejected = status === 'DITOLAK_SM'
  const financeVisible = !['MENUNGGU_SM', 'DITOLAK_SM'].includes(status)
  const financeActive = ['DISETUJUI_SM', 'RENUMERASI_SM'].includes(status)
  const financeRejected = status === 'DITOLAK_FINANCE'
  const financeComplete = financeVisible && !financeActive && !financeRejected
  const dirVisible = ['DISETUJUI_FINANCE', 'DISETUJUI_DIREKTUR', 'DITOLAK_DIREKTUR', 'SELESAI'].includes(status)
  const dirActive = status === 'DISETUJUI_FINANCE'
  const dirRejected = status === 'DITOLAK_DIREKTUR'
  const dirComplete = dirVisible && !dirActive && !dirRejected
  const selesaiVisible = ['DISETUJUI_DIREKTUR', 'SELESAI'].includes(status)
  const isSelesai = status === 'SELESAI'

  const btnPrimary = (disabled: boolean): React.CSSProperties => ({
    padding: '8px 18px', backgroundColor: disabled ? 'rgba(13,46,66,0.4)' : NAVY,
    color: '#FAF5EB', border: 'none', borderRadius: '8px', fontSize: '13px',
    fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer',
  })
  const btnDanger = (disabled: boolean): React.CSSProperties => ({
    padding: '8px 18px', backgroundColor: disabled ? 'rgba(153,27,27,0.4)' : '#991b1b',
    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px',
    fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer',
  })
  const btnGhost: React.CSSProperties = {
    padding: '8px 18px', backgroundColor: 'transparent', color: SECONDARY,
    border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
  }
  const btnSuccess: React.CSSProperties = {
    padding: '8px 18px', backgroundColor: '#dcfce7', color: '#166534',
    border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  }
  const btnWarn: React.CSSProperties = {
    padding: '8px 18px', backgroundColor: '#fee2e2', color: '#991b1b',
    border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  }
  const btnInfo: React.CSSProperties = {
    padding: '8px 18px', backgroundColor: '#dbeafe', color: '#1e40af',
    border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  }

  return (
    <div>
      <button onClick={() => router.back()}
        style={{ background: 'none', border: 'none', color: SECONDARY, fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '16px' }}>
        ← Kembali
      </button>

      {/* Header card */}
      <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <code style={{ fontSize: '15px', fontFamily: 'monospace', fontWeight: '700', backgroundColor: 'rgba(212,175,55,0.15)', color: '#7a5c00', padding: '2px 8px', borderRadius: '4px' }}>
                {pengajuan.spk?.nomor_spk ?? '—'}
              </code>
              <PengajuanStatusBadge status={status} />
            </div>
            <p style={{ fontSize: '14px', color: SECONDARY, margin: '0 0 4px 0' }}>
              Project: <strong style={{ color: NAVY }}>{pengajuan.spk?.projects?.nama ?? '—'}</strong>
            </p>
            <p style={{ fontSize: '14px', color: SECONDARY, margin: '0 0 4px 0' }}>
              Vendor: <strong style={{ color: NAVY }}>{pengajuan.spk?.vendors?.nama ?? '—'}</strong>
              &nbsp;·&nbsp; Divisi: <strong style={{ color: NAVY }}>{pengajuan.spk?.divisi ?? '—'}</strong>
            </p>
            <p style={{ fontSize: '12px', color: SECONDARY, margin: 0, opacity: 0.7 }}>
              Dibuat: {new Date(pengajuan.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: SECONDARY, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Jumlah Diajukan</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: NAVY, margin: '0 0 12px 0' }}>{formatRupiah(pengajuan.jumlah_diajukan)}</p>
            {pengajuan.jumlah_disetujui != null && (
              <>
                <p style={{ fontSize: '11px', color: SECONDARY, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Jumlah Disetujui</p>
                <p style={{ fontSize: '22px', fontWeight: '700', color: '#166534', margin: 0 }}>{formatRupiah(pengajuan.jumlah_disetujui)}</p>
              </>
            )}
          </div>
        </div>

        {pengajuan.catatan_pengaju && (
          <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#F5F0E8', borderRadius: '8px', border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: '11px', color: SECONDARY, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Catatan Pengaju</p>
            <p style={{ fontSize: '13px', color: NAVY, margin: 0 }}>{pengajuan.catatan_pengaju}</p>
          </div>
        )}
      </div>

      {saveError && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#fee2e2', borderRadius: '8px', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px' }}>
          {saveError}
        </div>
      )}

      {/* TAHAP 1 — SM */}
      <StageCard title="Tahap 1 — Site Manager" stepNum="1" done={smDone} active={!smDone} rejected={smRejected}>
        {!smDone && smAction === 'none' && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setSmAction('setujui')} style={btnSuccess}>✓ Setujui</button>
            <button onClick={() => setSmAction('renumerasi')} style={btnInfo}>↔ Renumerasi</button>
            <button onClick={() => setSmAction('tolak')} style={btnWarn}>✕ Tolak</button>
          </div>
        )}

        {!smDone && smAction === 'setujui' && (
          <div>
            <p style={{ fontSize: '13px', color: SECONDARY, marginBottom: '14px' }}>
              Konfirmasi setujui pengajuan sebesar <strong style={{ color: NAVY }}>{formatRupiah(pengajuan.jumlah_diajukan)}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSmSetujui} disabled={saving} style={btnPrimary(saving)}>
                {saving ? 'Menyimpan...' : 'Ya, Setujui'}
              </button>
              <button onClick={() => setSmAction('none')} style={btnGhost}>Batal</button>
            </div>
          </div>
        )}

        {!smDone && smAction === 'renumerasi' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: SECONDARY, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                Jumlah Disetujui (Rp) *
              </label>
              <input type="number" value={renumerasiAmount} onChange={e => setRenumerasiAmount(e.target.value)}
                placeholder="0" min="0" step="1000" style={{ ...inputStyle, maxWidth: '300px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSmRenumerasi} disabled={saving} style={btnPrimary(saving)}>
                {saving ? 'Menyimpan...' : 'Simpan Renumerasi'}
              </button>
              <button onClick={() => setSmAction('none')} style={btnGhost}>Batal</button>
            </div>
          </div>
        )}

        {!smDone && smAction === 'tolak' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: SECONDARY, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                Alasan Penolakan *
              </label>
              <textarea value={smReason} onChange={e => setSmReason(e.target.value)}
                rows={3} placeholder="Tuliskan alasan..."
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSmTolak} disabled={saving} style={btnDanger(saving)}>
                {saving ? 'Menyimpan...' : 'Tolak Pengajuan'}
              </button>
              <button onClick={() => setSmAction('none')} style={btnGhost}>Batal</button>
            </div>
          </div>
        )}

        {smDone && !smRejected && (
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <PengajuanStatusBadge status={status === 'RENUMERASI_SM' || (smDone && pengajuan.jumlah_disetujui !== pengajuan.jumlah_diajukan && pengajuan.jumlah_disetujui != null) ? 'RENUMERASI_SM' : 'DISETUJUI_SM'} />
            {pengajuan.jumlah_disetujui != null && (
              <div>
                <p style={{ fontSize: '11px', color: SECONDARY, margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Disetujui</p>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#166534', margin: 0 }}>{formatRupiah(pengajuan.jumlah_disetujui)}</p>
              </div>
            )}
          </div>
        )}

        {smRejected && (
          <div style={{ backgroundColor: '#fee2e2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <p style={{ fontSize: '11px', color: '#991b1b', margin: '0 0 4px 0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Ditolak oleh SM</p>
            <p style={{ fontSize: '13px', color: '#7f1d1d', margin: 0 }}>{pengajuan.catatan_sm ?? '—'}</p>
          </div>
        )}
      </StageCard>

      {/* TAHAP 2 — Finance */}
      {financeVisible && (
        <StageCard title="Tahap 2 — Finance" stepNum="2" done={financeComplete} active={financeActive} rejected={financeRejected}>
          {financeActive && financeAction === 'none' && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={handleFinanceApprove} disabled={saving} style={saving ? btnPrimary(true) : btnSuccess}>
                {saving ? 'Menyimpan...' : '✓ Approve'}
              </button>
              <button onClick={() => setFinanceAction('tolak')} style={btnWarn}>✕ Tolak</button>
            </div>
          )}

          {financeActive && financeAction === 'tolak' && (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: SECONDARY, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                  Alasan Penolakan *
                </label>
                <textarea value={financeReason} onChange={e => setFinanceReason(e.target.value)}
                  rows={3} placeholder="Tuliskan alasan..."
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleFinanceTolak} disabled={saving} style={btnDanger(saving)}>
                  {saving ? 'Menyimpan...' : 'Tolak'}
                </button>
                <button onClick={() => setFinanceAction('none')} style={btnGhost}>Batal</button>
              </div>
            </div>
          )}

          {financeComplete && (
            <p style={{ fontSize: '13px', color: '#166534', margin: 0, fontWeight: '600' }}>✓ Disetujui Finance</p>
          )}

          {financeRejected && (
            <div style={{ backgroundColor: '#fee2e2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <p style={{ fontSize: '11px', color: '#991b1b', margin: '0 0 4px 0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Ditolak oleh Finance</p>
              <p style={{ fontSize: '13px', color: '#7f1d1d', margin: 0 }}>{pengajuan.catatan_finance ?? '—'}</p>
            </div>
          )}
        </StageCard>
      )}

      {/* TAHAP 3 — Direktur */}
      {dirVisible && (
        <StageCard title="Tahap 3 — Direktur" stepNum="3" done={dirComplete} active={dirActive} rejected={dirRejected}>
          {dirActive && dirAction === 'none' && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={handleDirApprove} disabled={saving} style={saving ? btnPrimary(true) : btnSuccess}>
                {saving ? 'Menyimpan...' : '✓ Approve Final'}
              </button>
              <button onClick={() => setDirAction('tolak')} style={btnWarn}>✕ Tolak</button>
            </div>
          )}

          {dirActive && dirAction === 'tolak' && (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: SECONDARY, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                  Alasan Penolakan *
                </label>
                <textarea value={dirReason} onChange={e => setDirReason(e.target.value)}
                  rows={3} placeholder="Tuliskan alasan..."
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleDirTolak} disabled={saving} style={btnDanger(saving)}>
                  {saving ? 'Menyimpan...' : 'Tolak'}
                </button>
                <button onClick={() => setDirAction('none')} style={btnGhost}>Batal</button>
              </div>
            </div>
          )}

          {dirComplete && (
            <p style={{ fontSize: '13px', color: '#166534', margin: 0, fontWeight: '600' }}>✓ Disetujui Direktur</p>
          )}

          {dirRejected && (
            <div style={{ backgroundColor: '#fee2e2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <p style={{ fontSize: '11px', color: '#991b1b', margin: '0 0 4px 0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Ditolak oleh Direktur</p>
              <p style={{ fontSize: '13px', color: '#7f1d1d', margin: 0 }}>{pengajuan.catatan_direktur ?? '—'}</p>
            </div>
          )}
        </StageCard>
      )}

      {/* TAHAP 4 — Pembayaran */}
      {selesaiVisible && (
        <StageCard title="Tahap 4 — Pembayaran" stepNum="4" done={isSelesai} active={!isSelesai} rejected={false}>
          {!isSelesai && (
            <div>
              <p style={{ fontSize: '13px', color: SECONDARY, marginBottom: '14px' }}>
                Tandai lunas. Otomatis menambah record pembayaran sebesar{' '}
                <strong style={{ color: NAVY }}>{formatRupiah(pengajuan.jumlah_disetujui ?? pengajuan.jumlah_diajukan)}</strong>{' '}
                ke riwayat pembayaran SPK.
              </p>
              <button onClick={handleTandaiLunas} disabled={saving} style={{
                padding: '10px 24px',
                backgroundColor: saving ? 'rgba(13,46,66,0.4)' : NAVY,
                color: '#FAF5EB', border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '0.5px',
              }}>
                {saving ? 'Memproses...' : '✓ Tandai Lunas'}
              </button>
            </div>
          )}
          {isSelesai && (
            <p style={{ fontSize: '13px', color: '#166634', margin: 0, fontWeight: '600' }}>✓ Pembayaran telah dicatat sebagai lunas.</p>
          )}
        </StageCard>
      )}
    </div>
  )
}
