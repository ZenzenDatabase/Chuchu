// ============================================================
//  SUPABASE CONFIGURATION
// ============================================================

const SUPABASE_URL = 'https://bovqduczvwamwqsjcfef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fYkvSH0-f2CII9Oc5ow08g_0iz5g7rb';

// Create the client only ONCE
// We use 'window.supabase' to ensure we are calling the library loaded from the CDN
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
//  DO NOT EDIT BELOW THIS LINE
// ============================================================
