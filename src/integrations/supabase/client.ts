// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://fiaozxuccfbjpbzvrpzj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpYW96eHVjY2ZianBienZycHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5MTgxMzgsImV4cCI6MjA1NTQ5NDEzOH0.r9PyWCpwaAvIUQtpRiE1X2tQaPz4xnBiDw7Abg10xtg";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);