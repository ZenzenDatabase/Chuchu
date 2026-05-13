// ============================================================
//  SUPABASE CONFIGURATION
//  Replace the two values below with your own Supabase project.
//  Find them at: https://supabase.com → Project Settings → API
// ============================================================

const SUPABASE_URL = 'https://bovqduczvwamwqsjcfef.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'sb_publishable_fYkvSH0-f2CII9Oc5ow08g_0iz5g7rb';


// ============================================================
//  DO NOT EDIT BELOW THIS LINE
// ============================================================
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
