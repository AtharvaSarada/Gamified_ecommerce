
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
    console.log('Attempting login...');
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'atharvasarada47@gmail.com',
        password: 'Password123!'
    });

    if (loginError) {
        console.error('Login failed:', loginError);
        return;
    }

    console.log('Login successful. User ID:', session?.user.id);
    console.log('Fetching profile...');

    const start = Date.now();
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single();

    const duration = Date.now() - start;

    if (profileError) {
        console.error('Profile fetch failed:', profileError);
    } else {
        console.log('Profile fetched successfully in', duration, 'ms');
        console.log('Profile data:', profile);
    }
}

testFetch();
