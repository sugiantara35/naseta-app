'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'
const CARD_BG = '#FFFFFF'
const INPUT_BG = '#FFFFFF'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function SpkStatusBadge({ status }: { status: string }) {
  const map: Record<string, React.CSSProperties> = {
    DRAFT:   { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' },
    AKTIF:   { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    SELESAI: { backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' },
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
  border: `1px solid rgba(13,46,66,0.2)`, borderRadius: '8px', color: NAVY,
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

  if (loading) return <div style={{ color: SECONDARY, fontSize: '14px', paddingTop: '40px' }}>Memuat data SPK...</div>
  if (error || !spk) return <div style={{ color: '#dc2626', fontSize: '14px', paddingTop: '40px' }}>{error}</div>

  const terbayar = spk.spk_payments.reduce((s, p) => s + (p.jumlah ?? 0), 0)
  const saldo = (spk.deal_spk ?? 0) - terbayar

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700',
    color: NAVY, letterSpacing: '1px', textTransform: 'uppercase',
  }
  const tdStyle: React.CSSProperties = { padding: '13px 16px', fontSize: '13px', color: NAVY, verticalAlign: 'middle' }

  return (
    <div>
      {/* Back */}
      <button onClick={() => router.push(`/dashboard/projects/${projectId}?tab=${spk.divisi}`)}
        style={{ background: 'none', border: 'none', color: SECONDARY, fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '16px' }}>
        ← Kembali ke {spk.divisi}
      </button>

      {/* SPK Info */}
      <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <code style={{ color: '#7a5c00', fontSize: '16px', fontFamily: 'monospace', fontWeight: '700', backgroundColor: 'rgba(212,175,55,0.15)', padding: '2px 8px', borderRadius: '4px' }}>{spk.nomor_spk}</code>
              <SpkStatusBadge status={spk.status} />
              <span style={{ fontSize: '12px', color: SECONDARY, backgroundColor: '#F5F0E8', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${BORDER}` }}>
                {spk.divisi}
              </span>
            </div>
            <p style={{ fontSize: '15px', color: NAVY, margin: '0 0 8px 0', fontWeight: '500' }}>{spk.deskripsi}</p>
            <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>
              Vendor: {spk.vendors?.nama ?? '—'}
              {spk.tanggal_spk && <> &nbsp;·&nbsp; Tanggal: {spk.tanggal_spk}</>}
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'PP / RAP', value: spk.pp_rap != null ? formatRupiah(spk.pp_rap) : '—', color: NAVY },
            { label: 'Deal SPK', value: spk.deal_spk != null ? formatRupiah(spk.deal_spk) : '—', color: NAVY },
            { label: 'Terbayar', value: formatRupiah(terbayar), color: '#166534' },
            { label: 'Saldo', value: formatRupiah(saldo), color: saldo < 0 ? '#dc2626' : '#166534' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: '#F5F0E8', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 16px' }}>
              <p style={{ fontSize: '10px', color: SECONDARY, margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
              <p style={{ fontSize: '16px', fontWeight: '700', color, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: NAVY, margin: '0 0 14px 0' }}>Riwayat Pembayaran</h2>
        <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#F5F0E8' }}>
                {['Tanggal', 'Jumlah', 'Catatan'].map(col => (
                  <th key={col} style={thStyle}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spk.spk_payments.length === 0 ? (
                <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: SECONDARY, padding: '32px' }}>Belum ada pembayaran.</td></tr>
              ) : spk.spk_payments.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < spk.spk_payments.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <td style={{ ...tdStyle, color: SECONDARY, whiteSpace: 'nowrap' }}>{p.tanggal ?? '—'}</td>
                  <td style={{ ...tdStyle, color: '#166534', fontWeight: '600' }}>{formatRupiah(p.jumlah)}</td>
                  <td style={{ ...tdStyle, color: SECONDARY }}>{p.catatan ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Form */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: NAVY, margin: '0 0 14px 0' }}>Tambah Pembayaran</h2>
        <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
          <form onSubmit={handleAddPayment}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: SECONDARY, marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>
                  Jumlah (Rp) *
                </label>
                <input type="number" value={payForm.jumlah} onChange={e => setPayForm(p => ({ ...p, jumlah: e.target.value }))}
                  placeholder="0" min="0" step="1000" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: SECONDARY, marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>
                  Tanggal
                </label>
                <input type="date" value={payForm.tanggal} onChange={e => setPayForm(p => ({ ...p, tanggal: e.target.value }))}
                  style={{ ...inputStyle, colorScheme: 'light' }} />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: SECONDARY, marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>
                Catatan
              </label>
              <input value={payForm.catatan} onChange={e => setPayForm(p => ({ ...p, catatan: e.target.value }))}
                placeholder="Contoh: DP pertama" style={inputStyle} />
            </div>

            {payError && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{payError}</p>}

            <button type="submit" disabled={paying} style={{
              padding: '11px 24px', backgroundColor: paying ? 'rgba(13,46,66,0.4)' : NAVY,
              color: '#FAF5EB', border: 'none', borderRadius: '8px', fontSize: '13px',
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
