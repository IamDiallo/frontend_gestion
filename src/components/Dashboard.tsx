import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Alert,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Tab,
  Tabs,
  LinearProgress,
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Assessment,
  CalendarToday,
  TrendingUp,
  ShoppingCart,
  Category as CategoryIcon,
  Inventory,
  AttachMoney,
  ShowChart,
  ArrowUpward,
  ArrowDownward,
  Refresh,  CloudDownload,
  AccountBalanceWallet as AccountBalanceWalletIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart, 
  Area
} from 'recharts';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface SalesData {
  month: string;
  amount: number;
}

interface CategoryData {
  name: string;
  value: number;
  category?: string;
  amount?: number;
}

interface TopProduct {
  id: number;
  name: string;
  quantity: number;
  revenue: number;
}

interface ReportData {
  monthly_data: SalesData[];
  category_data: CategoryData[];
  top_products: TopProduct[];
}

interface DashboardStats {
  total_sales: number;
  total_clients: number;
  total_products: number;
  total_suppliers: number;
}

interface LowStockProduct {
  id: number;
  name: string;
  category: string;
  quantity: number;
  threshold: number;
  zone: string;
  unit: string;
}

interface InventoryStats {
  inventory_value: number;
  low_stock_products: LowStockProduct[];
  inflow: number;
  outflow: number;
  category_data: { category: string; value: number; }[];
  zone_data: { zone: string; value: number; }[];
  historical_value?: { name: string; value: number; }[];
}

interface ClientWithAccount {
  id: number;
  name: string;
  account: number;
  account_balance: number;
  last_transaction_date?: string;
}

interface AccountStatement {
  id: number;
  date: string;
  transaction_type: string;
  transaction_type_display: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
  client_id: number;
}

// TabPanel component for tabbed navigation

// Add type definitions for API responses
interface CategoryDataItem {
  category: string;
  amount: number;
}

interface SalesResponseData {
  category_data: CategoryDataItem[];
  monthly_data: SalesData[];
  [key: string]: unknown;
}

interface ClientResponseItem {
  id: number;
  name: string;
  account: number | null;
  account_balance: number;
  [key: string]: unknown;
}



const Dashboard = () => {
  const theme = useTheme();
  const [reportType, setReportType] = useState('sales');
  const [period, setPeriod] = useState('year');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [accountTabValue, setAccountTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData>({
    monthly_data: [],
    category_data: [],
    top_products: []
  });
  const [tabValue, setTabValue] = useState(0);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);const [accountStatements, setAccountStatements] = useState<AccountStatement[]>([]);
  const [clientBalances, setClientBalances] = useState<ClientWithAccount[]>([]);
  const [salesTrendData, setSalesTrendData] = useState<SalesData[]>([]);
  const [inventoryValueTrend, setInventoryValueTrend] = useState<{name: string; value: number}[]>([]);

  // Helper function to generate placeholder trend data when API doesn't provide it
  const generateInventoryTrendData = (currentValue: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Generate data for the last 7 months
    return Array.from({ length: 7 }, (_, i) => {
      const monthIndex = (currentMonth - 6 + i + 12) % 12; // Get the correct month index, accounting for year wrapping
      // Create some variation in the data
      const variationFactor = 0.85 + (i * 0.05);
      return {
        name: months[monthIndex],
        value: Math.round(currentValue * variationFactor)
      };
    });
  };

  const fetchInventoryStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await axios.get(`${API_URL}/dashboard/inventory/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setInventoryStats(response.data);
      
      // If the API response includes historical inventory value data, use it
      if (response.data && response.data.historical_value) {
        setInventoryValueTrend(response.data.historical_value);
      } else {
        // Generate placeholder data based on current inventory value
        const currentValue = response.data?.inventory_value || 0;
        const placeholderData = generateInventoryTrendData(currentValue);
        setInventoryValueTrend(placeholderData);
      }
    } catch (err) {
      console.error('Error fetching inventory stats:', err);
      throw err;
    }
  }, []);

  const fetchSalesReport = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const url = `${API_URL}/reports/sales/`;
      
      const params = new URLSearchParams();
      params.append('period', period);
      
      if (period === 'custom') {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      
      const response = await axios.get(`${url}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
        const transformedData = {
        ...response.data,
        category_data: (response.data as SalesResponseData).category_data.map((item: CategoryDataItem) => ({
          name: item.category,
          value: item.amount
        }))
      };
      
      setReportData(transformedData);
      setSalesTrendData(response.data.monthly_data);
    } catch (err) {
      console.error('Error fetching sales report:', err);
      throw err;
    }  }, [period, startDate, endDate]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await axios.get(`${API_URL}/dashboard/stats/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setDashboardStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      throw err;
    }
  };
  const fetchRecentSales = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await axios.get(`${API_URL}/dashboard/recent-sales/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Recent sales data is no longer needed as we removed the state
      console.log('Recent sales data:', response.data);
    } catch (err) {
      console.error('Error fetching recent sales:', err);
      throw err;
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await axios.get(`${API_URL}/dashboard/low-stock/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setLowStockProducts(response.data);
    } catch (err) {
      console.error('Error fetching low stock products:', err);
      throw err;
    }  };

  const fetchClientAccountStatements = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      // First, get all clients with their balances
      const clientsResponse = await axios.get(`${API_URL}/clients/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Log the response to help with debugging
      console.log('Clients API Response:', clientsResponse.data);
      
      // Ensure data is an array before filtering
      const responseData = Array.isArray(clientsResponse.data) ? clientsResponse.data : 
                          (clientsResponse.data.results ? clientsResponse.data.results : []);
      console.log('Processed response data:', responseData);
      
      const clientsWithAccounts = (responseData as ClientResponseItem[]).filter((client: ClientResponseItem) => client.account !== null);
      setClientBalances(clientsWithAccounts);
        // Get example account statements for the first client if any exists
      if (clientsWithAccounts.length > 0) {
        const clientId = clientsWithAccounts[0].id;
        try {
          const statementsResponse = await axios.get(`${API_URL}/account-statements/client_balance/?client_id=${clientId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Check if the response has statements property or is an array itself
          const statements = statementsResponse.data.statements 
            ? statementsResponse.data.statements 
            : (Array.isArray(statementsResponse.data) ? statementsResponse.data : []);
            
          setAccountStatements(statements);
        } catch (statementError) {
          console.error('Error fetching client statements:', statementError);
          setAccountStatements([]);
        }      }    } catch (err: unknown) {
      console.error('Error fetching account statements:', err);
      // Provide more detailed error information
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Unknown error';
      console.error('Detailed error:', errorMessage);
      setError(`Une erreur est survenue lors du chargement des données des comptes clients: ${errorMessage}`);
        // Make sure we don't leave the UI in a broken state
      setClientBalances([]);
      setAccountStatements([]);
    }
  };
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Only fetch dashboard stats if we don't have them yet
      if (dashboardStats === null) {
        await fetchDashboardStats();
      }
      
      switch(reportType) {
        case 'sales':
          await Promise.all([
            fetchSalesReport(),
            fetchRecentSales()
          ]);
          break;
        case 'products':
          await fetchLowStockProducts();
          break;
        case 'inventory':
          await fetchInventoryStats();
          break;
        case 'accounts':
          await fetchClientAccountStatements();
          break;
        case 'production':
          break;
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Une erreur est survenue lors du chargement des données du tableau de bord');
    } finally {
      setLoading(false);
    }
  }, [reportType, fetchInventoryStats, fetchSalesReport, dashboardStats]);
  // Initial load and when report type changes
  useEffect(() => {
    loadDashboardData();
    console.log('Report type changed to:', reportType, 'Tab value:', tabValue);
  }, [reportType, loadDashboardData, tabValue]);
  
  // Reload when period/date filters change (but only for sales reports)
  useEffect(() => {
    if (reportType === 'sales') {
      loadDashboardData();
    }
  }, [period, startDate, endDate, reportType, loadDashboardData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log('Tab clicked, changing to index:', newValue);
    setTabValue(newValue);
    const newReportType = ['sales', 'products', 'inventory', 'accounts'][newValue];
    console.log('Setting report type to:', newReportType);
    setReportType(newReportType);
  };
  
  const handleAccountTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setAccountTabValue(newValue);
  };
  const handlePeriodChange = (event: SelectChangeEvent) => {
    setPeriod(event.target.value);
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(event.target.value);
  };

  const generateReport = () => {
    loadDashboardData();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0
    }).format(value);
  };

  const renderPercentChange = (value: number) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {value >= 0 ? (
          <ArrowUpward sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
        ) : (
          <ArrowDownward sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
        )}
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600, 
            color: value >= 0 ? 'success.main' : 'error.main'
          }}
        >
          {Math.abs(value)}%
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        variant="scrollable"
        scrollButtons="auto"
        sx={{ 
          mb: 3,
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: 3
          },
          '& .MuiTab-root': {
            minHeight: 54,
            borderRadius: 2,
            mr: 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            }
          },
          '& .Mui-selected': {
            bgcolor: `${theme.palette.primary.main}10`,
          }
        }}
      >
        <Tab 
          icon={<ShoppingCart sx={{ mr: 1 }} />} 
          label="Ventes" 
          iconPosition="start"
        />
        <Tab 
          icon={<CategoryIcon sx={{ mr: 1 }} />} 
          label="Produits" 
          iconPosition="start"
        />        <Tab 
          icon={<Inventory sx={{ mr: 1 }} />} 
          label="Inventaire" 
          iconPosition="start"
        />
        <Tab 
          icon={<AccountBalanceWalletIcon sx={{ mr: 1 }} />} 
          label="Comptes Clients" 
          iconPosition="start"
        />
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', mr: 2 }}>
          <Tooltip title="Exporter">
            <IconButton color="primary">
              <CloudDownload />
            </IconButton>
          </Tooltip>
          <Tooltip title="Actualiser">
            <IconButton color="primary" onClick={generateReport} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : <Refresh />}
            </IconButton>
          </Tooltip>
        </Box>
      </Tabs>
         
      <Card 
        sx={{ 
          p: 2, 
          mb: 4, 
          borderRadius: 2, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        <CardContent sx={{ p: 1 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                <InputLabel id="period-label">Période</InputLabel>
                <Select
                  labelId="period-label"
                  id="period"
                  value={period}
                  label="Période"
                  onChange={handlePeriodChange}
                  startAdornment={<CalendarToday sx={{ color: 'action.active', mr: 1, ml: -0.5 }} />}
                >
                  <MenuItem value="month">Mois en cours</MenuItem>
                  <MenuItem value="quarter">Trimestre en cours</MenuItem>
                  <MenuItem value="semester">Semestre en cours</MenuItem>
                  <MenuItem value="year">Année en cours</MenuItem>
                  <MenuItem value="custom">Personnalisée</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Date de début"
                type="date"
                fullWidth
                value={startDate}
                onChange={handleStartDateChange}
                disabled={period !== 'custom'}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Date de fin"
                type="date"
                fullWidth
                value={endDate}
                onChange={handleEndDateChange}
                disabled={period !== 'custom'}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Assessment />}
                sx={{ 
                  py: 1.5, 
                  borderRadius: 2,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.15)'
                  }
                }}
                onClick={generateReport}
                disabled={loading}
              >
                {loading ? 'Génération...' : 'Générer le rapport'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}
        >
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <LinearProgress sx={{ borderRadius: 1, height: 6 }} />
        </Box>
      )}

      {reportType === 'sales' && !loading && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '6px',
                  height: '100%',
                  backgroundColor: theme.palette.primary.main,
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" variant="subtitle2" fontWeight={600}>
                        Ventes totales
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight={700} sx={{ my: 1 }}>
                        {dashboardStats ? formatCurrency(dashboardStats.total_sales) : '0 GNF'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {renderPercentChange(12.5)} {/* This would need to come from the API in a real implementation */}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          vs période précédente
                        </Typography>
                      </Box>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: `${theme.palette.primary.main}15`,
                        color: theme.palette.primary.main,
                        width: 48,
                        height: 48
                      }}
                    >
                      <AttachMoney />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '6px',
                  height: '100%',
                  backgroundColor: theme.palette.success.main,
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" variant="subtitle2" fontWeight={600}>
                        Nombre de clients
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight={700} sx={{ my: 1 }}>
                        {dashboardStats?.total_clients || 0}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {renderPercentChange(8.2)} {/* This would need to come from the API in a real implementation */}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          vs période précédente
                        </Typography>
                      </Box>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: `${theme.palette.success.main}15`,
                        color: theme.palette.success.main,
                        width: 48,
                        height: 48
                      }}
                    >
                      <ShoppingCart />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '6px',
                  height: '100%',
                  backgroundColor: theme.palette.warning.main,
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" variant="subtitle2" fontWeight={600}>
                        Nombre de produits
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight={700} sx={{ my: 1 }}>
                        {dashboardStats?.total_products || 0}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {renderPercentChange(3.7)} {/* This would need to come from the API in a real implementation */}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          vs période précédente
                        </Typography>
                      </Box>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: `${theme.palette.warning.main}15`,
                        color: theme.palette.warning.main,
                        width: 48,
                        height: 48
                      }}
                    >
                      <ShowChart />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '6px',
                  height: '100%',
                  backgroundColor: theme.palette.secondary.main,
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" variant="subtitle2" fontWeight={600}>
                        Nombre de fournisseurs
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight={700} sx={{ my: 1 }}>
                        {dashboardStats?.total_suppliers || 0}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {renderPercentChange(-1.3)} {/* This would need to come from the API in a real implementation */}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          vs période précédente
                        </Typography>
                      </Box>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: `${theme.palette.secondary.main}15`,
                        color: theme.palette.secondary.main,
                        width: 48,
                        height: 48
                      }}
                    >
                      <TrendingUp />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  height: '100%'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      Évolution des ventes
                    </Typography>
                    <Chip 
                      icon={<TrendingUp />} 
                      label={`+12.5% vs période précédente`} 
                      color="success" 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                  <ResponsiveContainer width="100%" height={340}>
                    <LineChart
                      data={salesTrendData.length > 0 ? salesTrendData : reportData.monthly_data}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: theme.palette.text.secondary }}
                        axisLine={{ stroke: theme.palette.divider }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${value} GNF`}
                        tick={{ fill: theme.palette.text.secondary }}
                        axisLine={{ stroke: theme.palette.divider }}
                      />                      <RechartsTooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Ventes']}
                        contentStyle={{ 
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: 15 }} />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        name="Ventes mensuelles" 
                        stroke={theme.palette.primary.main} 
                        strokeWidth={3}
                        dot={{ r: 6, strokeWidth: 2 }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  height: '100%'
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Répartition des ventes par catégorie
                  </Typography>
                  <Box sx={{ 
                    height: 260, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    mb: 2 
                  }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.category_data.length > 0 ? 
                            reportData.category_data : 
                            [] 
                          }
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          cornerRadius={4}                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={{ stroke: theme.palette.text.secondary, strokeWidth: 1, strokeDasharray: '2 2' }}
                        >
                          {reportData.category_data.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                              stroke={theme.palette.background.paper}
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    {(reportData.category_data.length > 0 ? 
                      reportData.category_data : 
                      []
                    ).slice(0, 3).map((category, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{category.name}</Typography>
                          <Typography variant="body2" fontWeight={600}>{formatCurrency(category.value)}</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={category.value > 0 ? 
                            (category.value / Math.max(...reportData.category_data.map(c => c.value))) * 100 : 
                            10 + index * 30} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 5,
                            backgroundColor: `${theme.palette.divider}50`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: COLORS[index % COLORS.length]
                            }
                          }} 
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Produits les plus vendus
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                        <TableRow>
                          <TableCell>Produit</TableCell>
                          <TableCell align="right">Quantité vendue</TableCell>
                          <TableCell align="right">Chiffre d'affaires</TableCell>
                          <TableCell align="right">Évolution</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.top_products.length > 0 ? 
                          reportData.top_products.map((product) => (
                            <TableRow key={product.id} hover sx={{ 
                              '&:hover': { 
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                transition: 'background-color 0.2s ease'
                              }
                            }}>
                              <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                              <TableCell align="right">{product.quantity}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(product.revenue)}</TableCell>
                              <TableCell align="right">
                                {renderPercentChange(Math.floor(Math.random() * 30) - 10)}
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={4} align="center">Aucun produit vendu</TableCell>
                            </TableRow>
                          )
                        }
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {reportType === 'products' && !loading && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  height: '100%'
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Produits en stock faible
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                        <TableRow>
                          <TableCell>Produit</TableCell>
                          <TableCell align="right">Stock actuel</TableCell>
                          <TableCell align="right">Stock minimum</TableCell>
                          <TableCell align="center">Statut</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lowStockProducts.length > 0 ? (
                          lowStockProducts.map(product => (
                            <TableRow key={product.id} hover>
                              <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                              <TableCell align="right">{product.quantity} {product.unit}</TableCell>
                              <TableCell align="right">{product.threshold} {product.unit}</TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={product.quantity <= product.threshold * 0.5 ? "Critique" : "Faible"} 
                                  size="small"
                                  color={product.quantity <= product.threshold * 0.5 ? "error" : "warning"}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center">Aucun produit en stock faible</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  height: '100%'
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Produits les plus rentables
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                        <TableRow>
                          <TableCell>Produit</TableCell>
                          <TableCell align="right">Marge (%)</TableCell>
                          <TableCell align="right">Profit</TableCell>
                          <TableCell align="center">Tendance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.top_products.length > 0 ? (
                          reportData.top_products.slice(0, 3).map((product) => (
                            <TableRow key={product.id} hover>
                              <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                              <TableCell align="right">{Math.floor(30 + Math.random() * 20)}%</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(product.revenue * 0.4)}</TableCell>
                              <TableCell align="center">
                                {renderPercentChange((Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 15))}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center">Aucune donnée disponible</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                    Performance des produits
                  </Typography>
                  <ResponsiveContainer width="100%" height={360}>
                    <BarChart
                      data={reportData.top_products.length > 0 ? 
                        reportData.top_products.map(p => ({
                          name: p.name,
                          ventes: p.quantity,
                          profit: Math.round(p.revenue * 0.4),
                          marge: Math.floor(30 + Math.random() * 15)
                        })) : 
                        [] // Remove static fallback data
                      }
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="name" tick={{ fill: theme.palette.text.secondary }} />
                      <YAxis yAxisId="left" tick={{ fill: theme.palette.text.secondary }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: theme.palette.text.secondary }} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="ventes" name="Nombre de ventes" fill="#1976d2" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="profit" name="Profit (GNF)" fill="#2e7d32" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="marge" name="Marge (%)" fill="#ed6c02" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {reportType === 'inventory' && !loading && (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  mb: 3
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Évolution de la valeur d'inventaire
                  </Typography>
                  <Box sx={{ height: 340 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={inventoryValueTrend} // We're still using mock data for the trend as it's time-based
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: theme.palette.text.secondary }}
                        />
                        <YAxis 
                          tickFormatter={(value) => `${value} GNF`}
                          tick={{ fill: theme.palette.text.secondary }}
                        />                        <RechartsTooltip 
                          formatter={(value: number) => [formatCurrency(value), 'Valeur']}
                          contentStyle={{ 
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={theme.palette.primary.main} 
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
              
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Valeur de l'inventaire par catégorie
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                        <TableRow>
                          <TableCell>Catégorie</TableCell>
                          <TableCell align="right">Valeur totale</TableCell>
                          <TableCell align="right">Proportion</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inventoryStats?.category_data && inventoryStats.category_data.length > 0 ? (
                          inventoryStats.category_data.map((item, index) => {
                            const percentage = inventoryStats.inventory_value > 0 
                              ? (item.value / inventoryStats.inventory_value * 100).toFixed(1) 
                              : '0';
                              
                            return (
                              <TableRow key={index} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{item.category}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                  {formatCurrency(item.value)}
                                </TableCell>
                                <TableCell align="right">{percentage}%</TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">Aucune donnée disponible</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  mb: 3
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Répartition de l'inventaire
                  </Typography>
                  <Box sx={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={inventoryStats?.category_data && inventoryStats.category_data.length > 0 ? 
                            inventoryStats.category_data.map(item => ({
                              name: item.category,
                              value: item.value
                            })) : 
                            []
                          }
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(inventoryStats?.category_data || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                          contentStyle={{ 
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
              
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  mb: 3
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Statistiques d'inventaire
                  </Typography>
                  <Box sx={{ p: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ p: 2, bgcolor: `${theme.palette.primary.main}15`, borderRadius: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Valeur totale
                          </Typography>
                          <Typography variant="h5" fontWeight={700}>
                            {formatCurrency(inventoryStats?.inventory_value || 0)}
                          </Typography>
                          {renderPercentChange(8.5)} {/* This would come from the API in a real implementation */}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ p: 2, bgcolor: `${theme.palette.warning.main}15`, borderRadius: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Entrées (30j)
                          </Typography>
                          <Typography variant="h5" fontWeight={700}>
                            {(inventoryStats?.inflow || 0).toFixed(0)}
                          </Typography>
                          {renderPercentChange(3.1)} {/* This would come from the API in a real implementation */}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ p: 2, bgcolor: `${theme.palette.success.main}15`, borderRadius: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Sorties (30j)
                          </Typography>
                          <Typography variant="h5" fontWeight={700}>
                            {(inventoryStats?.outflow || 0).toFixed(0)}
                          </Typography>
                          {renderPercentChange(5.8)} {/* This would come from the API in a real implementation */}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ p: 2, bgcolor: `${theme.palette.error.main}15`, borderRadius: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Articles en alerte
                          </Typography>
                          <Typography variant="h5" fontWeight={700}>
                            {inventoryStats?.low_stock_products?.length || 0}
                          </Typography>
                          {renderPercentChange(-12.4)} {/* This would come from the API in a real implementation */}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
              
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Répartition par zone
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                        <TableRow>
                          <TableCell>Zone</TableCell>
                          <TableCell align="right">Valeur</TableCell>
                          <TableCell align="right">%</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inventoryStats?.zone_data && inventoryStats.zone_data.length > 0 ? (
                          inventoryStats.zone_data.map((item, index) => {
                            const percentage = inventoryStats.inventory_value > 0 
                              ? (item.value / inventoryStats.inventory_value * 100).toFixed(1)
                              : '0';
                            return (
                              <TableRow key={index} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{item.zone}</TableCell>
                                <TableCell align="right">{formatCurrency(item.value)}</TableCell>
                                <TableCell align="right">{percentage}%</TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">Aucune donnée disponible</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {reportType === 'accounts' && !loading && (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  mb: 3
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    États des comptes clients
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                        <TableRow>
                          <TableCell>Client</TableCell>
                          <TableCell align="right">Solde actuel</TableCell>
                          <TableCell align="right">Dernière transaction</TableCell>
                          <TableCell align="center">Statut</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {clientBalances.length > 0 ? (
                          clientBalances.map((client: ClientWithAccount, index) => (
                            <TableRow key={index} hover>
                              <TableCell sx={{ fontWeight: 500 }}>{client.name}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {formatCurrency(client.account_balance || 0)}
                              </TableCell>
                              <TableCell align="right">
                                {client.last_transaction_date || 'Aucune'}
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={client.account_balance > 0 ? "Actif" : "Inactif"} 
                                  size="small"
                                  color={client.account_balance > 0 ? "success" : "warning"}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center">Aucun client avec compte</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
                <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      Relevés de comptes clients améliorés
                    </Typography>
                    <Box>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CloudDownload />}
                        sx={{ mr: 1 }}
                      >
                        Exporter
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Refresh />}
                      >
                        Actualiser
                      </Button>
                    </Box>
                  </Box>
                  
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>                    <Tabs 
                      value={accountTabValue} 
                      onChange={handleAccountTabChange}
                      aria-label="transactions tabs"
                      indicatorColor="primary"
                    >
                      <Tab label="Aperçu" />
                      <Tab label="Tableau détaillé" />
                      <Tab label="Graphique" />
                    </Tabs>
                  </Box>
                  
                  <Box sx={{ height: 400, width: '100%' }}>
                    {accountStatements.length > 0 ? (
                      <DataGrid
                        rows={accountStatements.map((statement: AccountStatement, index) => ({
                          id: statement.id || index,
                          date: new Date(statement.date).toLocaleDateString(),
                          type: statement.transaction_type_display,
                          reference: statement.reference,
                          description: statement.description,
                          debit: statement.debit,
                          credit: statement.credit,
                          balance: statement.balance
                        }))}
                        columns={[
                          { field: 'date', headerName: 'Date', width: 120 },
                          { field: 'type', headerName: 'Type', width: 180 },
                          { field: 'reference', headerName: 'Référence', width: 150 },
                          { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
                          { 
                            field: 'debit', 
                            headerName: 'Débit', 
                            width: 130, 
                            align: 'right',
                            headerAlign: 'right',
                            renderCell: (params) => (
                              <Typography 
                                variant="body2" 
                                sx={{ color: params.value > 0 ? 'error.main' : 'inherit' }}
                              >
                                {params.value > 0 ? formatCurrency(params.value) : '-'}
                              </Typography>
                            )
                          },
                          { 
                            field: 'credit', 
                            headerName: 'Crédit', 
                            width: 130, 
                            align: 'right',
                            headerAlign: 'right',
                            renderCell: (params) => (
                              <Typography 
                                variant="body2" 
                                sx={{ color: params.value > 0 ? 'success.main' : 'inherit' }}
                              >
                                {params.value > 0 ? formatCurrency(params.value) : '-'}
                              </Typography>
                            )
                          },
                          { 
                            field: 'balance', 
                            headerName: 'Solde', 
                            width: 150, 
                            align: 'right',
                            headerAlign: 'right',
                            renderCell: (params) => (
                              <Typography 
                                variant="body2" 
                                fontWeight={600}
                              >
                                {formatCurrency(params.value)}
                              </Typography>
                            )
                          }
                        ]}
                        autoHeight={false}
                        density="standard"
                        disableRowSelectionOnClick
                        initialState={{
                          pagination: {
                            paginationModel: { pageSize: 10, page: 0 },
                          },
                          sorting: {
                            sortModel: [{ field: 'date', sort: 'desc' }],
                          },
                        }}
                        pageSizeOptions={[5, 10, 25]}
                        getRowClassName={(params) => 
                          params.indexRelativeToCurrentPage % 2 === 0 ? '' : 'even-row'
                        }
                        sx={{
                          '& .MuiDataGrid-cell:focus': {
                            outline: 'none',
                          },
                          '& .even-row': {
                            bgcolor: 'rgba(0, 0, 0, 0.02)',
                          },
                          border: 'none',
                          '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: 'rgba(0, 0, 0, 0.03)',
                            borderRadius: 1,
                          },
                        }}
                      />
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}>
                        <Typography color="text.secondary">Aucune transaction disponible</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  mb: 3
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Évolution du solde client
                  </Typography>
                  <Box sx={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={accountStatements.map((statement: AccountStatement) => ({
                          date: new Date(statement.date).toLocaleDateString(),
                          balance: statement.balance
                        })).reverse()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="date" tick={{ fill: theme.palette.text.secondary }} />
                        <YAxis
                          tickFormatter={(value) => formatCurrency(value)}
                          tick={{ fill: theme.palette.text.secondary }}
                        />                        <RechartsTooltip
                          formatter={(value: number) => [formatCurrency(value), 'Solde']}
                          labelFormatter={(label) => `Date: ${label}`}
                          contentStyle={{ 
                            backgroundColor: theme.palette.background.paper,
                            borderRadius: 8,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                          }}
                        /><Line
                          type="monotone"
                          dataKey="balance"
                          name="Solde"
                          stroke={theme.palette.primary.main}
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
              
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  mb: 3
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Distribution des transactions
                  </Typography>
                  <Box sx={{ height: 280 }}>
                    {accountStatements.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>                          <Pie
                            data={
                              // Group transactions by type and sum their amounts
                              Object.entries(
                                accountStatements.reduce((acc: Record<string, number>, statement) => {
                                  const type = statement.transaction_type_display;
                                  if (!acc[type]) acc[type] = 0;
                                  acc[type] += statement.debit + statement.credit;
                                  return acc;
                                }, {} as Record<string, number>)
                              ).map(([name, value]) => ({ name, value }))
                            }
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                          >                            {Object.entries(
                              accountStatements.reduce((acc: Record<string, number>, statement) => {
                                const type = statement.transaction_type_display;
                                if (!acc[type]) acc[type] = 0;
                                acc[type] += statement.debit + statement.credit;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>                          <RechartsTooltip
                            formatter={(value: number) => [formatCurrency(value), 'Montant']}
                            contentStyle={{ 
                              backgroundColor: theme.palette.background.paper,
                              borderRadius: 8,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography color="text.secondary">Aucune donnée disponible</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
              
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Statistiques des comptes clients
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: `${theme.palette.primary.main}15`, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total clients
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {clientBalances.length}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: `${theme.palette.success.main}15`, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Solde total
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>                          {formatCurrency(clientBalances.reduce((sum, client) => sum + (client.account_balance || 0), 0))}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: `${theme.palette.warning.main}15`, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Solde moyen
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {clientBalances.length > 0 
                            ? formatCurrency(clientBalances.reduce((sum, client) => sum + (client.account_balance || 0), 0) / clientBalances.length)
                            : formatCurrency(0)
                          }
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: `${theme.palette.info.main}15`, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Clients actifs
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {clientBalances.filter(client => client.account_balance > 0).length}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;