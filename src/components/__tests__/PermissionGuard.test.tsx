import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PermissionGuard from '../PermissionGuard'
import * as PermissionContext from '../../context/PermissionContext'

// Mock the usePermissions hook
vi.mock('../../context/PermissionContext', async () => {
  const actual = await vi.importActual('../../context/PermissionContext')
  return {
    ...actual,
    usePermissions: vi.fn(),
  }
})

// Mock Navigate component
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      mockNavigate(to)
      return <div data-testid="navigate-mock">Redirecting to {to}</div>
    },
  }
})

const ProtectedContent = () => <div>Protected Content</div>

describe('PermissionGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderWithRouter = (children: React.ReactElement) => {
    return render(<BrowserRouter>{children}</BrowserRouter>)
  }

  it('should show nothing while loading permissions', () => {
    vi.mocked(PermissionContext.usePermissions).mockReturnValue({
      userPermissions: [],
      isAdmin: false,
      userRole: null,
      userGroups: [],
      loading: true,
      error: null,
      hasPermission: vi.fn(() => false),
      refreshPermissions: vi.fn(),
    })

    const { container } = renderWithRouter(
      <PermissionGuard requiredPermission="view_sales" fallbackPath="/dashboard">
        <ProtectedContent />
      </PermissionGuard>
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('should render children when user is admin', () => {
    vi.mocked(PermissionContext.usePermissions).mockReturnValue({
      userPermissions: [],
      isAdmin: true,
      userRole: 'Admin',
      userGroups: ['Admins'],
      loading: false,
      error: null,
      hasPermission: vi.fn(() => true),
      refreshPermissions: vi.fn(),
    })

    renderWithRouter(
      <PermissionGuard requiredPermission="any_permission" fallbackPath="/dashboard">
        <ProtectedContent />
      </PermissionGuard>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should render children when user has required permission', () => {
    const hasPermissionMock = vi.fn((permission: string) => permission === 'view_sales')
    
    vi.mocked(PermissionContext.usePermissions).mockReturnValue({
      userPermissions: ['view_sales'],
      isAdmin: false,
      userRole: 'Sales Manager',
      userGroups: ['Sales'],
      loading: false,
      error: null,
      hasPermission: hasPermissionMock,
      refreshPermissions: vi.fn(),
    })

    renderWithRouter(
      <PermissionGuard requiredPermission="view_sales" fallbackPath="/dashboard">
        <ProtectedContent />
      </PermissionGuard>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(hasPermissionMock).toHaveBeenCalledWith('view_sales')
  })

  it('should redirect to fallback path when permission denied', () => {
    const hasPermissionMock = vi.fn(() => false)
    
    vi.mocked(PermissionContext.usePermissions).mockReturnValue({
      userPermissions: ['view_products'],
      isAdmin: false,
      userRole: 'Inventory Manager',
      userGroups: ['Inventory'],
      loading: false,
      error: null,
      hasPermission: hasPermissionMock,
      refreshPermissions: vi.fn(),
    })

    renderWithRouter(
      <PermissionGuard requiredPermission="view_sales" fallbackPath="/dashboard">
        <ProtectedContent />
      </PermissionGuard>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('should redirect to root when permission denied and no fallback specified', () => {
    const hasPermissionMock = vi.fn(() => false)
    
    vi.mocked(PermissionContext.usePermissions).mockReturnValue({
      userPermissions: [],
      isAdmin: false,
      userRole: null,
      userGroups: [],
      loading: false,
      error: null,
      hasPermission: hasPermissionMock,
      refreshPermissions: vi.fn(),
    })

    renderWithRouter(
      <PermissionGuard requiredPermission="admin_only" fallbackPath="/">
        <ProtectedContent />
      </PermissionGuard>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should handle multiple permissions correctly', () => {
    const hasPermissionMock = vi.fn((perm: string) => 
      ['view_sales', 'add_sale', 'change_sale'].includes(perm)
    )
    
    vi.mocked(PermissionContext.usePermissions).mockReturnValue({
      userPermissions: ['view_sales', 'add_sale', 'change_sale'],
      isAdmin: false,
      userRole: 'Sales Agent',
      userGroups: ['Sales'],
      loading: false,
      error: null,
      hasPermission: hasPermissionMock,
      refreshPermissions: vi.fn(),
    })

    renderWithRouter(
      <PermissionGuard requiredPermission="change_sale" fallbackPath="/dashboard">
        <ProtectedContent />
      </PermissionGuard>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(hasPermissionMock).toHaveBeenCalledWith('change_sale')
  })

  it('should work with app-prefixed permissions', () => {
    const hasPermissionMock = vi.fn((perm: string) => perm === 'sales.view_sale')
    
    vi.mocked(PermissionContext.usePermissions).mockReturnValue({
      userPermissions: ['sales.view_sale'],
      isAdmin: false,
      userRole: 'Sales Agent',
      userGroups: ['Sales'],
      loading: false,
      error: null,
      hasPermission: hasPermissionMock,
      refreshPermissions: vi.fn(),
    })

    renderWithRouter(
      <PermissionGuard requiredPermission="sales.view_sale" fallbackPath="/dashboard">
        <ProtectedContent />
      </PermissionGuard>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
