'use server'

import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export async function createUserAction(formData: FormData): Promise<{ error: string } | void> {
  const nama = (formData.get('nama') as string ?? '').trim()
  const email = (formData.get('email') as string ?? '').trim()
  const password = formData.get('password') as string ?? ''
  const role = formData.get('role') as string ?? ''

  if (!nama || !email || !password || !role) {
    return { error: 'Semua field wajib diisi.' }
  }
  if (password.length < 8) {
    return { error: 'Password minimal 8 karakter.' }
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !user) {
    return { error: authError?.message ?? 'Gagal membuat akun.' }
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({ id: user.id, nama, email, role })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(user.id)
    return { error: profileError.message }
  }

  redirect('/dashboard/users')
}

export async function updateRoleAction(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  const role = formData.get('role') as string

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabaseAdmin.from('profiles').update({ role }).eq('id', id)
  redirect('/dashboard/users')
}
