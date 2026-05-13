// ============================================================
//  SUPABASE CONFIGURATION
// ============================================================

const SUPABASE_URL = 'https://bovqduczvwamwqsjcfef.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvdnFkdWN6dndhbXdxc2pjZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NDI4MTUsImV4cCI6MjA5NDIxODgxNX0.uh5-YFD4o7XfvdLPkUN60RhXoh3PYlSXjka9YzX8onY';

// Create the client only ONCE
// We use 'window.supabase' to ensure we are calling the library loaded from the CDN
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
//  DO NOT EDIT BELOW THIS LINE
// ============================================================
