// ============================================================
//  SUPABASE CONFIGURATION
// ============================================================

// 1. Use the long key starting with eyJ... from Project Settings -> API
const SUPABASE_URL = 'https://bovqduczvwamwqsjcfef.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvdnFkdWN6dndhbXdxc2pjZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NDI4MTUsImV4cCI6MjA5NDIxODgxNX0.uh5-YFD4o7XfvdLPkUN60RhXoh3PYlSXjka9YzX8onY';

// 2. ONLY declare this once. 
// Use 'window.supabase' to ensure it uses the library from the <script> tag.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
//  DO NOT ADD ANY MORE "const supabase =" LINES BELOW
// ============================================================
