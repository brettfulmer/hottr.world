import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function submitSignup(email: string, name: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('early_access_signups').insert({ email, name })
  if (error) {
    // Unique constraint = already signed up, treat as success
    if (error.code === '23505') return { ok: true }
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
  return { ok: true }
}

export async function validateAccessCode(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('validate_access_code', { input_code: code })
  if (error) throw new Error("Couldn't verify your code. Check your connection and try again.")
  return data === true
}
