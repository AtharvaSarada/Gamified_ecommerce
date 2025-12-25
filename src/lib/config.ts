// lib/config.ts

const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
]

export const validateEnv = () => {
    const missing = requiredEnvVars.filter(key => !import.meta.env[key])

    if (missing.length > 0) {
        console.error('Missing environment variables:', missing)
        // In dev, we might want to throw a visible error
        if (import.meta.env.DEV) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}. Check your .env file in the gamer-gear-guild-main directory.`)
        }
    }
}
