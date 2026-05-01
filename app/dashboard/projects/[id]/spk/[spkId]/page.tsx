'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const GOLD = '#D4AF37'
const CREAM = '#FAF5EB'
const BORDER = 'rgba(212,175,55,0.2)'
const CARD_BG = 'rgba(13,46,66,0.6)'
const INPUT_BG = 'rgba(255,255,255,0.06)'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function SpkStatusBadge({ status }: { status: string }) {
  const map: Record<string, React.CSSProperties> = {
    DRAFT:   { backgroundColor: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.3)' },
    AKTIF:   { backgroundColor: 'rgba(34,197,94,0.15)',   color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' },
    SELESAI: { backgroundColor: 'rgba(212,175,55,0.15)',  color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' },
  }
  return (
    <span style={{ ...(map[status] ?? map.DRAFT), padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
      {status}
    </span>
  )
}

type Payment = {
  id: string
  jumlah: number
  tanggal: string | null
  catatan: string | null
  created_at: string
}

type SpkDetail = {
  id: string
  nomor_spk: string
  deskripsi: string
  divisi: string
  pp_rap: number | null
  deal_spk: number | null
  status: string
  tanggal_spk: string | null
  project_id: string
  vendors: { nama: string } | null
  spk_payments: Payment[]
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', backgroundColor: INPUT_BG,
  border: `1px solid ${BORDER}`, borderRadius: '8px', color: CREAM,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

export default function SpkDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const spkId = params.spkId as string

  const [spk, setSpk] = useState<SpkDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [payForm, setPayForm] = useState({ jumlah: '', tanggal: '', catatan: '' })
  const [payError, setPayError] = useState('')
  const [paying, setPaying] = useState(false)

  const fetchSpk = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('spk')
      .select('*, vendors(nama), spk_payments(*)')
      .eq('id', spkId)
      .order('created_at', { ascending: false, referencedTable: 'spk_payments' })
      .single()

    if (error || !data) {
      setError('SPK tidak ditemukan.')
    } else {
      setSpk(data as SpkDetail)
    }
    setLoading(false)
  }, [spkId])

  useEffect(() => { fetchSpk() }, [fetchSpk])

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault()
    setPayError('')
    if (!payForm.jumlah) return setPayError('Jumlah pembayaran wajib diisi.')

    setPaying(true)
    const supabase = createClient()
    const { error } = await supabase.from('spk_payments').insert({
      spk_id: spkId,
      jumlah: parseFloat(payForm.jumlah),
      tanggal: payForm.tanggal || null,
      catatan: payForm.catatan.trim() || null,
    })

    if (error) {
      setPayError(error.message)
      setPaying(false)
      return
    }

    setPayForm({ jumlah: '', tanggal: '', catatan: '' })
    setPaying(false)
    await fetchSpk()
  }

  if (loading) return <div style={{ color: CREAM, opacity: 0.5, fontSize: '14px', paddingTop: '40px' }}>Memuat data SPK...</div>
  if (error || !spk) return <div style={{ color: '#f87171', fontSize: '14px', paddingTop: '40px' }}>{error}</div>

  const terbayar = spk.spk_payments.reduce((s, p) => s + (p.jumlah ?? 0), 0)
  const saldo = (spk.deal_spk ?? 0) - terbayar

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600',
    color: GOLD, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.85,
  }
  const tdStyle: React.CSSProperties = { padding: '13px 16px', fontSize: '13px', color: CREAM, verticalAlign: 'middle' }

  return (
    <div>
      {/* Back */}
      <button onClick={() => router.push(`/dashboard/projects/${projectId}?tab=${spk.divisi}`)}
        style={{ background: 'none', border: 'none', color: CREAM, opacity: 0.5, fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '16px' }}>
        ← Kembali ke {spk.divisi}
      </button>

      {/* SPK Info */}
      <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <code style={{ color: GOLD, fontSize: '16px', fontFamily: 'monospace', fontWeight: '700' }}>{spk.nomor_spk}</code>
              <SpkStatusBadge status={spk.status} />
              <span style={{ fontSize: '12px', color: CREAM, opacity: 0.45, backgroundColor: 'rgba(212,175,55,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                {spk.divisi}
              </span>
            </div>
            <p style={{ fontSize: '15px', color: CREAM, margin: '0 0 8px 0' }}>{spk.deskripsi}</p>
            <p style={{ fontSize: '13px', color: CREAM, opacity: 0.55, margin: 0 }}>
              Vendor: {spk.vendors?.nama ?? '—'}
              {spk.tanggal_spk && <> &nbsp;·&nbsp; Tanggal: {spk.tanggal_spk}</>}
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'PP / RAP', value: spk.pp_rap != null ? formatRupiah(spk.pp_rap) : '—', color: CREAM },
            { label: 'Deal SPK', value: spk.deal_spk != null ? formatRupiah(spk.deal_spk) : '—', color: CREAM },
            { label: 'Terbayar', value: formatRupiah(terbayar), color: '#4ade80' },
            { label: 'Saldo', value: formatRupiah(saldo), color: saldo < 0 ? '#f87171' : GOLD },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 16px' }}>
              <p style={{ fontSize: '10px', color: CREAM, opacity: 0.5, margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
              <p style={{ fontSize: '16px', fontWeight: '700', color, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: CREAM, margin: '0 0 14px 0' }}>Riwayat Pembayaran</h2>
        <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Tanggal', 'Jumlah', 'Catatan'].map(col => (
                  <th key={col} style={thStyle}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spk.spk_payments.length === 0 ? (
                <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', opacity: 0.4, padding: '32px' }}>Belum ada pembayaran.</td></tr>
              ) : spk.spk_payments.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < spk.spk_payments.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <td style={{ ...tdStyle, opacity: 0.7, whiteSpace: 'nowrap' }}>{p.tanggal ?? '—'}</td>
                  <td style={{ ...tdStyle, color: '#4ade80', fontWeight: '600' }}>{formatRupiah(p.jumlah)}</td>
                  <td style={{ ...tdStyle, opacity: 0.65 }}>{p.catatan ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Form */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: CREAM, margin: '0 0 14px 0' }}>Tambah Pembayaran</h2>
        <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px' }}>
          <form onSubmit={handleAddPayment}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: CREAM, opacity: 0.6, marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Jumlah (Rp) *
                </label>
                <input type="number" value={payForm.jumlah} onChange={e => setPayForm(p => ({ ...p, jumlah: e.target.value }))}
                  placeholder="0" min="0" step="1000" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: CREAM, opacity: 0.6, marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Tanggal
                </label>
                <input type="date" value={payForm.tanggal} onChange={e => setPayForm(p => ({ ...p, tanggal: e.target.value }))}
                  style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: CREAM, opacity: 0.6, marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Catatan
              </label>
              <input value={payForm.catatan} onChange={e => setPayForm(p => ({ ...p, catatan: e.target.value }))}
                placeholder="Contoh: DP pertama" style={inputStyle} />
            </div>

            {payError && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{payError}</p>}

            <button type="submit" disabled={paying} style={{
              padding: '11px 24px', backgroundColor: paying ? 'rgba(212,175,55,0.5)' : GOLD,
              color: '#0D2E42', border: 'none', borderRadius: '8px', fontSize: '13px',
              fontWeight: '700', cursor: paying ? 'not-allowed' : 'pointer', letterSpacing: '0.5px',
            }}>
              {paying ? 'Menyimpan...' : '+ Catat Pembayaran'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
