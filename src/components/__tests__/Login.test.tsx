import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../Login'
import { AuthService } from '../../services/auth'

// Mock AuthService
vi.mock('../../services/auth', () => ({
  AuthService: {
    login: vi.fn(),
  },
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  }
})

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
  }

  it('should render login form', () => {
    renderLogin()

    expect(screen.getByLabelText(/nom d'utilisateur/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('should show password when visibility toggle is clicked', () => {
    renderLogin()

    const passwordInput = screen.getByLabelText(/mot de passe/i) as HTMLInputElement
    expect(passwordInput.type).toBe('password')

    const toggleButton = screen.getByLabelText(/toggle password visibility/i)
    fireEvent.click(toggleButton)

    expect(passwordInput.type).toBe('text')
  })

  it('should handle successful login', async () => {
    const mockLogin = vi.mocked(AuthService.login)
    mockLogin.mockResolvedValue({
      access: 'mock_access_token',
      refresh: 'mock_refresh_token',
    })

    // Mock localStorage.getItem to return the token after login
    const originalGetItem = localStorage.getItem
    localStorage.getItem = vi.fn((key: string) => {
      if (key === 'access_token') return 'mock_access_token'
      return originalGetItem.call(localStorage, key)
    })

    renderLogin()

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const loginButton = screen.getByRole('button', { name: /se connecter/i })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass123' } })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpass123')
    }, { timeout: 3000 })
    
    // Wait for the setTimeout in handleSubmit (100ms)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    }, { timeout: 3000 })
  })

  it('should display error message on login failure', async () => {
    const mockLogin = vi.mocked(AuthService.login)
    mockLogin.mockRejectedValue({
      response: {
        data: {
          detail: 'Invalid credentials',
        },
      },
    })

    renderLogin()

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const loginButton = screen.getByRole('button', { name: /se connecter/i })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('should disable login button while loading', async () => {
    const mockLogin = vi.mocked(AuthService.login)
    mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)))

    renderLogin()

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const loginButton = screen.getByRole('button', { name: /se connecter/i })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass123' } })
    fireEvent.click(loginButton)

    expect(loginButton).toBeDisabled()
  })

  it('should not submit form with empty fields', () => {
    renderLogin()

    const loginButton = screen.getByRole('button', { name: /se connecter/i })
    fireEvent.click(loginButton)

    expect(AuthService.login).not.toHaveBeenCalled()
  })

  it('should redirect if already logged in with valid token', async () => {
    const validToken = createMockToken(3600)
    
    // Create a proper storage mock
    const storage: Record<string, string> = { access_token: validToken }
    Storage.prototype.getItem = vi.fn((key: string) => storage[key] || null)
    Storage.prototype.setItem = vi.fn((key: string, value: string) => {
      storage[key] = value
    })
    Storage.prototype.removeItem = vi.fn((key: string) => {
      delete storage[key]
    })

    renderLogin()

    // The useEffect navigation happens immediately but uses Navigate internally
    // We need to wait for the effect to run
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    }, { timeout: 2000 })
  })

  it('should clear expired token on mount', async () => {
    const expiredToken = createMockToken(-3600)
    
    // Track what gets removed
    const removedKeys: string[] = []
    const storage: Record<string, string | null> = {
      access_token: expiredToken,
      refresh_token: 'mock_refresh',
      user_permissions: '[]',
      user_role: 'user',
      is_admin: 'false',
      token_expiration: Date.now().toString()
    }
    
    const mockGetItem = vi.fn((key: string) => storage[key] || null)
    const mockSetItem = vi.fn((key: string, value: string) => {
      storage[key] = value
    })
    const mockRemoveItem = vi.fn((key: string) => {
      removedKeys.push(key)
      storage[key] = null
    })
    
    // Override Storage prototype
    Storage.prototype.getItem = mockGetItem
    Storage.prototype.setItem = mockSetItem
    Storage.prototype.removeItem = mockRemoveItem

    renderLogin()

    // Wait for useEffect to run and verify that auth data removal was called
    await waitFor(() => {
      expect(removedKeys.length).toBeGreaterThan(0)
    }, { timeout: 1000 })
    
    // Verify the expired token was cleared
    expect(removedKeys).toContain('access_token')
    expect(removedKeys).toContain('refresh_token')
    expect(removedKeys).toContain('token_expiration')
  })

  it('should handle network error gracefully', async () => {
    const mockLogin = vi.mocked(AuthService.login)
    mockLogin.mockRejectedValue(new Error('Une erreur est survenue lors de la connexion. Veuillez réessayer.'))

    renderLogin()

    const usernameInput = screen.getByLabelText(/nom d'utilisateur/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const loginButton = screen.getByRole('button', { name: /se connecter/i })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass123' } })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/une erreur est survenue lors de la connexion/i)).toBeInTheDocument()
    })
  })
})

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
