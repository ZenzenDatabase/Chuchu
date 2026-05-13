// js/config.js

// Using 'var' prevents the "already declared" crash
var SUPABASE_URL = 'https://bovqduczvwamwqsjcfef.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvdnFkdWN6dndhbXdxc2pjZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NDI4MTUsImV4cCI6MjA5NDIxODgxNX0.uh5-YFD4o7XfvdLPkUN60RhXoh3PYlSXjka9YzX8onY';

// Check if supabase is already initialized to avoid errors
if (typeof supabase === 'undefined') {
    var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
