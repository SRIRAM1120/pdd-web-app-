import { describe, expect, it } from 'vitest'
import { EMAIL_PATTERN, PHONE_PATTERN, friendlyAuthError, passwordIssues } from './validation'

describe('account validation', () => {
  it('accepts sensible email and phone formats', () => {
    expect(EMAIL_PATTERN.test('person@example.com')).toBe(true)
    expect(PHONE_PATTERN.test('+91 98765 43210')).toBe(true)
  })
  it('describes every missing password requirement', () => {
    expect(passwordIssues('tiny')).toEqual(['at least 8 characters', 'one uppercase letter', 'one number'])
    expect(passwordIssues('Secure123')).toEqual([])
  })
  it('maps Firebase errors without exposing internals', () => {
    expect(friendlyAuthError({ code: 'auth/email-already-in-use' })).toContain('already exists')
    expect(friendlyAuthError({ code: 'unknown' })).toBe('Something went wrong. Please try again.')
  })
})
