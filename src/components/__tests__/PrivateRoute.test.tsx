import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PrivateRoute from '../PrivateRoute'
import * as authApi from '../../services/api/auth.api'

// Mock the auth API
vi.mock('../../services/api/auth.api', () => ({
  checkAuthentication: vi.fn(),
}))

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div data-testid="loading-box">{children}</div>,
  CircularProgress: () => <div data-testid="loading-spinner">Loading...</div>,
}))

// Mock react-router-dom Navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to, state }: { to: string; state?: unknown }) => {
      mockNavigate(to, state)
      return <div data-testid="navigate-mock">Redirecting to {to}</div>
    },
  }
})

// Test component that will be protected
const ProtectedContent = () => <div>Protected Content</div>

describe('PrivateRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderPrivateRoute = () => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PrivateRoute />}>
            <Route index element={<ProtectedContent />} />
          </Route>
        </Routes>
      </BrowserRouter>
    )
  }

  it('should show loading spinner while checking authentication', async () => {
    const token = 'mock_token'
    const getItemSpy = vi.fn(() => token)
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: getItemSpy,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    })
    
    // Create a promise that we can control
    let resolveAuth: (value: unknown) => void
    const authPromise = new Promise((resolve) => {
      resolveAuth = resolve
    })
    
    vi.mocked(authApi.checkAuthentication).mockReturnValue(authPromise as Promise<{ authenticated: boolean }>)

    renderPrivateRoute()

    // Check loading state immediately
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    
    // Cleanup - resolve the promise
    resolveAuth!({ authenticated: true })
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })
  })

  it('should redirect to login when no token exists', async () => {
    const getItemSpy = vi.fn(() => null) // No token
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: getItemSpy,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    })

    renderPrivateRoute()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({
        from: expect.any(Object)
      }))
    })
  })

  it('should redirect to login when authentication fails', async () => {
    const removeItemSpy = vi.fn()
    const getItemSpy = vi.fn(() => 'invalid_token')
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: getItemSpy,
        setItem: vi.fn(),
        removeItem: removeItemSpy,
        clear: vi.fn(),
      },
      writable: true
    })
    
    vi.mocked(authApi.checkAuthentication).mockResolvedValue({
      authenticated: false,
      reason: 'Token expired',
    })

    renderPrivateRoute()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', expect.any(Object))
      expect(removeItemSpy).toHaveBeenCalledWith('access_token')
      expect(removeItemSpy).toHaveBeenCalledWith('refresh_token')
    })
  })

  it('should render protected content when authenticated', async () => {
    const getItemSpy = vi.fn(() => 'valid_token')
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: getItemSpy,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    })
    
    vi.mocked(authApi.checkAuthentication).mockResolvedValue({
      authenticated: true,
      user: { id: 1, username: 'testuser' },
    })

    renderPrivateRoute()

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('should clear tokens and redirect on API error', async () => {
    const removeItemSpy = vi.fn()
    const getItemSpy = vi.fn(() => 'token')
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: getItemSpy,
        setItem: vi.fn(),
        removeItem: removeItemSpy,
        clear: vi.fn(),
      },
      writable: true
    })

    vi.mocked(authApi.checkAuthentication).mockRejectedValue(
      new Error('Network error')
    )

    renderPrivateRoute()

    await waitFor(() => {
      expect(removeItemSpy).toHaveBeenCalledWith('access_token')
      expect(removeItemSpy).toHaveBeenCalledWith('refresh_token')
      expect(removeItemSpy).toHaveBeenCalledWith('token_expiration')
      expect(mockNavigate).toHaveBeenCalledWith('/login', expect.any(Object))
    })
  })

  it('should preserve location state for redirect after login', async () => {
    const getItemSpy = vi.fn(() => null) // No token
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: getItemSpy,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    })

    // Need to render at a specific path
    window.history.pushState({}, 'Test page', '/protected')
    
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<PrivateRoute />}>
            <Route path="protected" element={<ProtectedContent />} />
          </Route>
        </Routes>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
      const calls = mockNavigate.mock.calls
      expect(calls[0][0]).toBe('/login')
      expect(calls[0][1]).toHaveProperty('from')
    }, { timeout: 2000 })
  })
})
