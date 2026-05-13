// ============================================================
//  SUPABASE CONFIGURATION
//  Replace the two values below with your own Supabase project.
//  Find them at: https://supabase.com → Project Settings → API
// ============================================================

const SUPABASE_URL = 'YOUR_SUPABASE_URL';       // e.g. https://abcdefgh.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // starts with "eyJ..."

// ============================================================
//  DO NOT EDIT BELOW THIS LINE
// ============================================================
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
