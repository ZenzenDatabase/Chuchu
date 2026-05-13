// ============================================================
//  SUPABASE CONFIGURATION
//  Replace the two values below with your own Supabase project.
//  Find them at: https://supabase.com → Project Settings → API
// ============================================================

const SUPABASE_URL = 'https://abcxyz123.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI...';

// ============================================================
//  DO NOT EDIT BELOW THIS LINE
// ============================================================
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
