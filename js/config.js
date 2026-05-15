// ============================================================
//  SUPABASE CONFIGURATION
//  Replace the two values below with your own Supabase project.
//  Find them at: https://supabase.com → Project Settings → API
// ============================================================

var  SUPABASE_URL = 'https://bovqduczvwamwqsjcfef.supabase.co';       // e.g. https://abcdefgh.supabase.co
var  SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvdnFkdWN6dndhbXdxc2pjZmVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY0MjgxNSwiZXhwIjoyMDk0MjE4ODE1fQ.CVCs5qAFSrx1L_oWBbHRmvl7UxhN7fgCriGjTj_dNjA'; // starts with "eyJ..."

// ============================================================
//  DO NOT EDIT BELOW THIS LINE
// ============================================================
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
