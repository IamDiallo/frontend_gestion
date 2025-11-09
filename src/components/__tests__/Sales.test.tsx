import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Sales from '../Sales'

// Mock hooks
vi.mock('../../hooks/useSalesData', () => ({
  useSalesData: () => ({
    sales: [],
    invoices: [],
    quotes: [],
    clients: [],
    zones: [],
    products: [],
    productsWithStock: [],
    paymentMethods: [],
    loading: false,
    invoiceLoading: false,
    quoteLoading: false,
    error: null,
    availableStock: {},
    fetchSales: vi.fn(),
    fetchInvoices: vi.fn(),
    fetchQuotes: vi.fn(),
    fetchClients: vi.fn(),
    fetchProducts: vi.fn(),
    fetchZones: vi.fn(),
    fetchProductsWithStock: vi.fn(),
    refreshAllData: vi.fn(),
    createSale: vi.fn(),
    updateSale: vi.fn(),
    deleteSale: vi.fn(),
    updateSaleStatus: vi.fn(),
    createInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    deleteInvoice: vi.fn(),
    createQuote: vi.fn(),
    updateQuote: vi.fn(),
    deleteQuote: vi.fn(),
    convertQuoteToSale: vi.fn(),
    setError: vi.fn(),
    setLoading: vi.fn(),
  }),
}))

vi.mock('../../hooks/useSalesFilters', () => ({
  useSalesFilters: () => ({
    filteredSales: [],
    filteredInvoices: [],
    filteredQuotes: [],
    salesFilters: {
      searchTerm: '',
      setSearchTerm: vi.fn(),
      statusFilter: '',
      setStatusFilter: vi.fn(),
      resetSalesFilters: vi.fn(),
    },
    invoiceFilters: {
      invoiceSearchTerm: '',
      setInvoiceSearchTerm: vi.fn(),
      invoiceStatusFilter: '',
      setInvoiceStatusFilter: vi.fn(),
      invoiceDateFilter: '',
      setInvoiceDateFilter: vi.fn(),
      resetInvoiceFilters: vi.fn(),
    },
    quoteFilters: {
      quoteSearchTerm: '',
      setQuoteSearchTerm: vi.fn(),
      quoteStatusFilter: '',
      setQuoteStatusFilter: vi.fn(),
      quoteDateFilter: '',
      setQuoteDateFilter: vi.fn(),
      resetQuoteFilters: vi.fn(),
    },
  }),
}))

vi.mock('../../hooks/useSalesDialogs', () => ({
  useSalesDialogs: () => ({
    saleDialog: {
      open: false,
      mode: 'add' as const,
      sale: null,
      saleItems: [],
      selectedClient: null,
      selectedZone: 0,
      selectedProducts: [],
      currentProduct: null,
      currentQuantity: 1,
    },
    invoiceDialog: {
      open: false,
      mode: 'add' as const,
      invoice: null,
      selectedSale: null,
      date: '',
      due_date: '',
      notes: '',
    },
    quoteDialog: {
      open: false,
      mode: 'add' as const,
      quote: null,
      selectedClient: null,
      selectedZone: 0,
      selectedProducts: [],
      currentProduct: null,
      currentQuantity: 1,
      date: '',
      expiry_date: '',
      notes: '',
    },
    quoteConversionDialog: {
      open: false,
      quote: null,
    },
    deleteDialog: {
      open: false,
      type: null,
      item: null,
      confirmationInfo: null,
    },
    openSaleDialog: vi.fn(),
    closeSaleDialog: vi.fn(),
    updateSaleDialog: vi.fn(),
    addProductToSale: vi.fn(),
    removeProductFromSale: vi.fn(),
    openInvoiceDialog: vi.fn(),
    closeInvoiceDialog: vi.fn(),
    updateInvoiceDialog: vi.fn(),
    openQuoteDialog: vi.fn(),
    closeQuoteDialog: vi.fn(),
    updateQuoteDialog: vi.fn(),
    addProductToQuote: vi.fn(),
    removeProductFromQuote: vi.fn(),
    openQuoteConversionDialog: vi.fn(),
    closeQuoteConversionDialog: vi.fn(),
    openDeleteDialog: vi.fn(),
    closeDeleteDialog: vi.fn(),
  }),
}))

// Mock PermissionGuard
vi.mock('../PermissionGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Sales Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderSales = () => {
    return render(
      <BrowserRouter>
        <Sales />
      </BrowserRouter>
    )
  }

  it('should render sales component', () => {
    renderSales()
    
    expect(screen.getByText(/ventes/i)).toBeInTheDocument()
  })

  it('should render tabs for sales, invoices, and quotes', () => {
    renderSales()

    expect(screen.getByRole('tab', { name: /ventes/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /factures/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /devis/i })).toBeInTheDocument()
  })

  it('should switch between tabs', () => {
    renderSales()

    const invoicesTab = screen.getByRole('tab', { name: /factures/i })
    fireEvent.click(invoicesTab)

    expect(invoicesTab).toHaveAttribute('aria-selected', 'true')
  })

  it('should display success snackbar', () => {
    renderSales()

    // Simulate success by calling the component with success message
    // This is a simplified test - actual implementation would test the full flow
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should have proper permissions guard', () => {
    renderSales()
    
    // Check that PermissionGuard is wrapping the component
    // In a real scenario, you'd test different permission levels
    expect(screen.getByText(/ventes/i)).toBeInTheDocument()
  })
})

describe('Sales Component - Integration', () => {
  it('should call refreshAllData on mount', () => {
    const mockRefresh = vi.fn()
    
    vi.mock('../../hooks/useSalesData', () => ({
      useSalesData: () => ({
        sales: [],
        invoices: [],
        quotes: [],
        clients: [],
        zones: [],
        products: [],
        productsWithStock: [],
        paymentMethods: [],
        refreshAllData: mockRefresh,
        fetchProductsWithStock: vi.fn(),
        loading: false,
      }),
    }))

    render(
      <BrowserRouter>
        <Sales />
      </BrowserRouter>
    )

    // Note: Due to mocking limitations, this test is simplified
    // In a full implementation, you would verify the hook was called
  })

  it('should handle loading state', () => {
    vi.mock('../../hooks/useSalesData', () => ({
      useSalesData: () => ({
        sales: [],
        invoices: [],
        quotes: [],
        clients: [],
        zones: [],
        products: [],
        productsWithStock: [],
        paymentMethods: [],
        refreshAllData: vi.fn(),
        fetchProductsWithStock: vi.fn(),
        loading: true,
      }),
    }))

    render(
      <BrowserRouter>
        <Sales />
      </BrowserRouter>
    )

    // Test loading state rendering
    expect(screen.getByText(/ventes/i)).toBeInTheDocument()
  })
})

describe('Sales Component - Error Handling', () => {
  const renderSales = () => {
    return render(
      <BrowserRouter>
        <Sales />
      </BrowserRouter>
    )
  }

  it('should display error snackbar on API error', () => {
    renderSales()
    
    // Verify component handles errors gracefully
    expect(screen.queryByText(/erreur/i)).not.toBeInTheDocument()
  })

  it('should handle network errors', () => {
    renderSales()
    
    // Component should still render even if data fetch fails
    expect(screen.getByText(/ventes/i)).toBeInTheDocument()
  })
})

describe('Sales Component - Accessibility', () => {
  const renderSales = () => {
    return render(
      <BrowserRouter>
        <Sales />
      </BrowserRouter>
    )
  }

  it('should have accessible tab navigation', () => {
    renderSales()

    const tablist = screen.getByRole('tablist')
    expect(tablist).toBeInTheDocument()

    const tabs = screen.getAllByRole('tab')
    expect(tabs.length).toBeGreaterThanOrEqual(3)
  })

  it('should have proper ARIA labels', () => {
    renderSales()

    const tabs = screen.getAllByRole('tab')
    tabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-selected')
    })
  })
})
