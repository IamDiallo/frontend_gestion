import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, logout, checkAuthentication, refreshToken } from '../auth.api'
import { api } from '../config'

// Mock the api config module
vi.mock('../config', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: {
      headers: {
        common: {}
      }
    },
    interceptors: {
      request: {
        use: vi.fn(),
        eject: vi.fn(),
      },
      response: {
        use: vi.fn(),
        eject: vi.fn(),
      },
    },
  },
  debugAPI: {
    logRequest: vi.fn(),
    logResponse: vi.fn(),
    logError: vi.fn(),
  },
}))

// Helper function to create mock JWT tokens
function createMockToken(expirationInSeconds: number): string {
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

describe('auth.api', () => {
  let localStorageData: Record<string, string> = {}

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageData = {}
    
    // Mock localStorage properly
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => localStorageData[key] || null,
        setItem: (key: string, value: string) => {
          localStorageData[key] = value
        },
        removeItem: (key: string) => {
          delete localStorageData[key]
        },
        clear: () => {
          localStorageData = {}
        },
      },
      writable: true
    })
  })

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const mockResponse = {
        data: {
          access: 'mock_access_token',
          refresh: 'mock_refresh_token',
        },
      }

      const mockUserResponse = {
        data: {
          id: 1,
          username: 'testuser',
          role: 'admin',
        },
      }

      vi.mocked(api.post).mockResolvedValueOnce(mockResponse)
      vi.mocked(api.get).mockResolvedValueOnce(mockUserResponse)

      const result = await login('testuser', 'testpass123')

      expect(result).toEqual({
        ...mockResponse.data,
        user: mockUserResponse.data,
      })
      expect(localStorageData['access_token']).toBe('mock_access_token')
      expect(localStorageData['refresh_token']).toBe('mock_refresh_token')
    })

    it('should throw error on login failure', async () => {
      const mockError = new Error('Invalid credentials')
      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(login('testuser', 'wrongpass')).rejects.toThrow(
        'Invalid credentials'
      )
    })
  })

  describe('logout', () => {
    it('should clear authentication data', () => {
      localStorageData['access_token'] = 'token'
      localStorageData['refresh_token'] = 'refresh'
      localStorageData['user_permissions'] = '[]'

      logout()

      expect(localStorageData['access_token']).toBeUndefined()
      expect(localStorageData['refresh_token']).toBeUndefined()
      expect(localStorageData['user_permissions']).toBeUndefined()
    })
  })

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        data: {
          access: 'new_access_token',
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await refreshToken('mock_refresh_token')

      expect(result).toBe('new_access_token')
      expect(localStorageData['access_token']).toBe('new_access_token')
    })

    it('should throw error when refresh fails', async () => {
      const mockError = new Error('Refresh token expired')
      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(refreshToken('expired_token')).rejects.toThrow()
    })
  })

  describe('checkAuthentication', () => {
    it('should return authenticated false without token', async () => {
      delete localStorageData['access_token']

      const result = await checkAuthentication()

      expect(result.authenticated).toBe(false)
      expect(result.reason).toContain('No token')
    })

    it('should return authenticated true with valid token', async () => {
      const validToken = createMockToken(3600)
      localStorageData['access_token'] = validToken

      const mockUserResponse = {
        data: {
          id: 1,
          username: 'testuser',
          profile_data: {
            role: 'admin',
          },
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockUserResponse)

      const result = await checkAuthentication()

      expect(result.authenticated).toBe(true)
      expect(result.user).toEqual(mockUserResponse.data)
      expect(result.role).toBe('admin')
      expect(result.isAdmin).toBe(true)
    })

    it('should handle 401 unauthorized response', async () => {
      const validToken = createMockToken(3600)
      localStorageData['access_token'] = validToken

      const mockError = {
        response: {
          status: 401,
        },
      }

      vi.mocked(api.get).mockRejectedValue(mockError)

      const result = await checkAuthentication()

      expect(result.authenticated).toBe(false)
      expect(result.reason).toContain('Invalid token')
      expect(localStorageData['access_token']).toBeUndefined()
    })
  })
})
