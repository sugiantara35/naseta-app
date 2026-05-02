import { createServerSupabaseClient } from './supabase-server'
import { redirect } from 'next/navigation'

export type Role = 'ADMIN' | 'ESTIMATOR' | 'DIREKTUR' | 'QS' | 'SITE_MANAGER'

export type Profile = {
  id: string
  nama: string
  email: string | null
  role: Role
  created_at: string
}

export async function getProfile(): Promise<Profile | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    return (data as Profile) ?? null
  } catch {
    return null
  }
}

export async function requireRole(allowedRoles: Role[]): Promise<Profile> {
  const profile = await getProfile()
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized')
  }
  return profile
}
