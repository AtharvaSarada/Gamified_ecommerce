import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Check your .env file.');
}

export const supabase = createClient<Database>(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: window.localStorage
        }
    }
);

/**
 * Direct fetch fallback for public product queries when the SDK hangs.
 */
export async function directFetchProducts(params: string = "select=*") {
    const url = `${supabaseUrl}/rest/v1/products?${params}`;
    const response = await fetch(url, {
        headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
        }
    });
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    return await response.json();
}
