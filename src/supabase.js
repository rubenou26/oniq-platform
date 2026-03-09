import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kgkohfhcqjueufgoqaze.supabase.co'
const SUPABASE_KEY = 'sb_publishable_fpHIFud2upSH2DZS0OWM5g_wuG9erqz'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
