'use server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function generateRapScaffold(projectId: string, selectedKategori: string[]) {
  if (selectedKategori.length === 0) return { inserted: 0, skipped: 0 }

  const supabase = await createServerSupabaseClient()

  const [{ data: hargaItems }, { data: existingItems }] = await Promise.all([
    supabase
      .from('harga_upah')
      .select('id, nama_pekerjaan, kategori, sub_kategori, satuan, harga')
      .in('kategori', selectedKategori),
    supabase
      .from('rap_items')
      .select('divisi, sub_divisi, deskripsi')
      .eq('project_id', projectId),
  ])

  if (!hargaItems || hargaItems.length === 0) return { inserted: 0, skipped: 0 }

  const existingSet = new Set(
    (existingItems ?? []).map(i => `${i.divisi}||${i.sub_divisi ?? ''}||${i.deskripsi}`)
  )

  const toInsert = hargaItems
    .filter(h => !existingSet.has(`${h.kategori}||${h.sub_kategori ?? ''}||${h.nama_pekerjaan}`))
    .map(h => ({
      project_id: projectId,
      divisi: h.kategori,
      sub_divisi: h.sub_kategori ?? null,
      deskripsi: h.nama_pekerjaan,
      satuan: h.satuan ?? null,
      volume: 0,
      harga_satuan: h.harga ?? null,
      harga_upah_id: h.id,
    }))

  const skipped = hargaItems.length - toInsert.length

  if (toInsert.length > 0) {
    await supabase.from('rap_items').insert(toInsert)
  }

  revalidatePath(`/dashboard/projects/${projectId}/rap`)
  return { inserted: toInsert.length, skipped }
}
