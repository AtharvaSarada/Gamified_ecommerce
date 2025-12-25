export const AUTH_ERRORS = {
    'invalid_credentials': 'Invalid email or password',
    'email_not_confirmed': 'Please verify your email before logging in',
    'user_already_exists': 'An account with this email already exists',
    'weak_password': 'Password must be at least 8 characters with uppercase and number',
    'invalid_email': 'Please enter a valid email address',
    'network_error': 'Network error. Please check your connection.',
    'session_expired': 'Your session has expired. Please log in again.',
    'rate_limit_exceeded': 'Too many attempts. Please try again in 5 minutes.',
};

export const getErrorMessage = (error: any): string => {
    if (!error) return 'An unexpected error occurred';

    // Handle Supabase error messages or codes
    const message = error.message?.toLowerCase() || '';

    if (message.includes('invalid login credentials')) return AUTH_ERRORS['invalid_credentials'];
    if (message.includes('email not confirmed')) return AUTH_ERRORS['email_not_confirmed'];
    if (message.includes('user already registered')) return AUTH_ERRORS['user_already_exists'];
    if (message.includes('password should be')) return AUTH_ERRORS['weak_password'];
    if (message.includes('rate limit exceeded')) return AUTH_ERRORS['rate_limit_exceeded'];

    return error.message || 'An unexpected error occurred';
};
