import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kgkohfhcqjueufgoqaze.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtna29oZmhjcWp1ZXVmZ29xYXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTQzOTAsImV4cCI6MjA4ODU5MDM5MH0.DULKNkfOZ3cqudqvXhJFKlI0KErPuPbmTFv75yObQTs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
