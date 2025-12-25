import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useSessionMonitor = (signOut: () => Promise<void>) => {
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                if (session === null && !error) return; // Not logged in
                toast.error('Your session has expired');
                signOut();
                return;
            }

            // Refresh if expiring in < 5 minutes
            const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
            const now = Date.now();
            const timeUntilExpiry = expiresAt - now;

            if (timeUntilExpiry < 5 * 60 * 1000) {
                await supabase.auth.refreshSession();
            }
        };

        // Check every minute
        const interval = setInterval(checkSession, 60000);
        return () => clearInterval(interval);
    }, [signOut]);
};
