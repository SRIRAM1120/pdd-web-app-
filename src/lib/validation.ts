export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_PATTERN = /^[+]?[\d\s()-]{7,20}$/

export function passwordIssues(password: string) {
  const issues: string[] = []
  if (password.length < 8) issues.push('at least 8 characters')
  if (!/[A-Z]/.test(password)) issues.push('one uppercase letter')
  if (!/[a-z]/.test(password)) issues.push('one lowercase letter')
  if (!/\d/.test(password)) issues.push('one number')
  return issues
}

export function friendlyAuthError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/email-already-in-use': 'An account already exists for this email. Try signing in instead.',
    'auth/weak-password': 'Choose a stronger password.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before completion.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups and try again.',
    'auth/network-request-failed': 'A network error occurred. Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/missing-continue-uri': 'The password-reset link is not configured correctly.',
    'auth/requires-recent-login': 'For your security, sign in again before making this change.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase yet.',
    'auth/configuration-not-found': 'Firebase Authentication is not configured for this project yet.',
    'auth/unauthorized-domain': 'This local address is not listed as an authorized Firebase domain.',
    'permission-denied': 'Your account works, but the profile database permissions need to be configured.'
  }
  return messages[code] ?? 'Something went wrong. Please try again.'
}
