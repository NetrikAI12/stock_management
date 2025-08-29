// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mhigdzpmliurqyxeeshm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaWdkenBtbGl1cnF5eGVlc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2ODI3OTgsImV4cCI6MjA3MTI1ODc5OH0.W9gdrXwfaKcH57CY62r_dSv-o_aw7VgpTzNYtXf9nkM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);