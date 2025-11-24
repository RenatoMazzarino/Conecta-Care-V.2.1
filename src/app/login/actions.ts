'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function login(formData: FormData) {
  const data = Object.fromEntries(formData)
  const parsed = LoginSchema.safeParse(data)

  if (!parsed.success) {
    redirect('/login?error=invalid')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    redirect('/login?error=auth')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
