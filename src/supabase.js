import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kgkohfhcqjueufgoqaze.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtna29oZmhjcWp1ZXVmZ29xYXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NzA3ODcsImV4cCI6MjA1NzA0Njc4N30.HnFLeq0VcDkOdFxMEQi9DPiFxfQqmGpHQoY2Dmt4fHU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
