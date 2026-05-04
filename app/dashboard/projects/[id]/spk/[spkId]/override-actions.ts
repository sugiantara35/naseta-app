'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function approveOverride(overrideId: string, alasanKeputusan: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: override, error: fetchError } = await supabase
    .from('rap_overrides')
    .select('spk_id')
    .eq('id', overrideId)
    .single()

  if (fetchError || !override) throw new Error('Override tidak ditemukan')

  await supabase.from('rap_overrides').update({
    status: 'APPROVED',
    approved_by: user.id,
    alasan_keputusan: alasanKeputusan,
    decided_at: new Date().toISOString(),
  }).eq('id', overrideId)

  await supabase.from('spk').update({ status: 'DRAFT' }).eq('id', override.spk_id)

  const { data: spk } = await supabase.from('spk').select('project_id').eq('id', override.spk_id).single()
  if (spk?.project_id) revalidatePath(`/dashboard/projects/${spk.project_id}`)
}

export async function rejectOverride(overrideId: string, alasanKeputusan: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: override, error: fetchError } = await supabase
    .from('rap_overrides')
    .select('spk_id')
    .eq('id', overrideId)
    .single()

  if (fetchError || !override) throw new Error('Override tidak ditemukan')

  await supabase.from('rap_overrides').update({
    status: 'REJECTED',
    approved_by: user.id,
    alasan_keputusan: alasanKeputusan,
    decided_at: new Date().toISOString(),
  }).eq('id', overrideId)

  await supabase.from('spk').update({
    status: 'BATAL',
    alasan_batal: alasanKeputusan,
  }).eq('id', override.spk_id)

  const { data: spk } = await supabase.from('spk').select('project_id').eq('id', override.spk_id).single()
  if (spk?.project_id) revalidatePath(`/dashboard/projects/${spk.project_id}`)
}
