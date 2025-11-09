import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  decodeToken,
  isTokenExpired,
  getTokenTimeToExpire,
  shouldRefreshToken,
  clearAuthData,
} from '../tokenValidation'

describe('tokenValidation utils', () => {
  // Helper function to create a mock JWT token
  const createMockToken = (expirationInSeconds: number) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(
      JSON.stringify({
        user_id: 1,
        exp: Math.floor(Date.now() / 1000) + expirationInSeconds,
        token_type: 'access',
      })
    )
    const signature = 'mock_signature'
    return `${header}.${payload}.${signature}`
  }

  beforeEach(() => {
    localStorage.clear()
  })

  describe('decodeToken', () => {
    it('should decode a valid JWT token', () => {
      const token = createMockToken(3600)
      const decoded = decodeToken(token)

      expect(decoded).not.toBeNull()
      expect(decoded?.user_id).toBe(1)
      expect(decoded?.token_type).toBe('access')
      expect(decoded?.exp).toBeDefined()
    })

    it('should return null for invalid token format', () => {
      const invalidToken = 'invalid.token'
      const decoded = decodeToken(invalidToken)

      expect(decoded).toBeNull()
    })

    it('should return null for empty token', () => {
      const decoded = decodeToken('')
      expect(decoded).toBeNull()
    })

    it('should return null for malformed payload', () => {
      const malformedToken = 'header.invalid_base64.signature'
      const decoded = decodeToken(malformedToken)

      expect(decoded).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for a valid non-expired token', () => {
      const token = createMockToken(3600) // Expires in 1 hour
      expect(isTokenExpired(token)).toBe(false)
    })

    it('should return true for an expired token', () => {
      const token = createMockToken(-3600) // Expired 1 hour ago
      expect(isTokenExpired(token)).toBe(true)
    })

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid')).toBe(true)
    })

    it('should return true for token without expiration', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ user_id: 1 })) // No exp field
      const signature = 'mock_signature'
      const token = `${header}.${payload}.${signature}`

      expect(isTokenExpired(token)).toBe(true)
    })
  })

  describe('getTokenTimeToExpire', () => {
    it('should return positive time for non-expired token', () => {
      const token = createMockToken(3600) // Expires in 1 hour
      const timeToExpire = getTokenTimeToExpire(token)

      expect(timeToExpire).toBeGreaterThan(0)
      expect(timeToExpire).toBeLessThanOrEqual(3600000) // 1 hour in ms
    })

    it('should return negative time for expired token', () => {
      const token = createMockToken(-3600) // Expired 1 hour ago
      const timeToExpire = getTokenTimeToExpire(token)

      expect(timeToExpire).toBeLessThan(0)
    })

    it('should return -1 for invalid token', () => {
      expect(getTokenTimeToExpire('invalid')).toBe(-1)
    })

    it('should return -1 for token without expiration', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ user_id: 1 }))
      const signature = 'mock_signature'
      const token = `${header}.${payload}.${signature}`

      expect(getTokenTimeToExpire(token)).toBe(-1)
    })
  })

  describe('shouldRefreshToken', () => {
    it('should return true for token expiring in less than 2 minutes', () => {
      const token = createMockToken(60) // Expires in 1 minute
      expect(shouldRefreshToken(token)).toBe(true)
    })

    it('should return false for token with more than 2 minutes remaining', () => {
      const token = createMockToken(300) // Expires in 5 minutes
      expect(shouldRefreshToken(token)).toBe(false)
    })

    it('should return false for expired token', () => {
      const token = createMockToken(-3600) // Already expired
      expect(shouldRefreshToken(token)).toBe(false)
    })

    it('should return false for invalid token', () => {
      expect(shouldRefreshToken('invalid')).toBe(false)
    })

    it('should return true at 119 seconds (edge case)', () => {
      const token = createMockToken(119)
      expect(shouldRefreshToken(token)).toBe(true)
    })

    it('should return false at 121 seconds (edge case)', () => {
      const token = createMockToken(121)
      expect(shouldRefreshToken(token)).toBe(false)
    })
  })

  describe('clearAuthData', () => {
    it('should clear all authentication data from localStorage', () => {
      // Create a storage object to track values
      const storage: Record<string, string> = {}
      
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: (key: string) => storage[key] || null,
          setItem: (key: string, value: string) => {
            storage[key] = value
          },
          removeItem: (key: string) => {
            delete storage[key]
          },
          clear: () => {
            Object.keys(storage).forEach(key => delete storage[key])
          },
          length: 0,
          key: vi.fn(),
        },
        writable: true,
      })

      // Set mock auth data
      localStorage.setItem('access_token', 'mock_access_token')
      localStorage.setItem('refresh_token', 'mock_refresh_token')
      localStorage.setItem('token_expiration', '12345678')
      localStorage.setItem('user_permissions', '["read", "write"]')
      localStorage.setItem('user_role', 'admin')
      localStorage.setItem('is_admin', 'true')
      localStorage.setItem('user_groups', '["admins"]')
      localStorage.setItem('current_user', '{"id": 1}')

      // Clear auth data
      clearAuthData()

      // Verify all items are removed (getItem returns null)
      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
      expect(localStorage.getItem('token_expiration')).toBeNull()
      expect(localStorage.getItem('user_permissions')).toBeNull()
      expect(localStorage.getItem('user_role')).toBeNull()
      expect(localStorage.getItem('is_admin')).toBeNull()
      expect(localStorage.getItem('user_groups')).toBeNull()
      expect(localStorage.getItem('current_user')).toBeNull()
    })

    it('should not throw error if localStorage is empty', () => {
      expect(() => clearAuthData()).not.toThrow()
    })
  })
})
