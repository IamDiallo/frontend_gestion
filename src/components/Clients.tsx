import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  CircularProgress,
  IconButton,
  InputAdornment,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { ClientsAPI, AccountsAPI } from '../services/api';
import { Client, Account } from '../interfaces/business';
import { PriceGroup } from '../interfaces/products';
import { SnackbarState } from '../interfaces/common';
import PermissionGuard from './PermissionGuard';
import { usePermissionCheck } from '../hooks/usePermissionCheck';
import PermissionButton from './common/PermissionButton';

const Clients = () => {
  // Add permission checks
  const { canPerform } = usePermissionCheck();
  const canEditClient = canPerform('change_client');
  const canDeleteClient = canPerform('delete_client');

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Define static price groups
  const priceGroups: PriceGroup[] = [
    { id: 1, name: 'Standard' },
    { id: 2, name: 'Premium' },
    { id: 3, name: 'VIP' }
  ];
  
  // Replace static accounts with dynamic ones
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  
  const [newClient, setNewClient] = useState<Omit<Client, 'id'>>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    price_group: 1,
    account: undefined,
    is_active: true,
  });
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Helper function to get price group name by ID
  const getPriceGroupName = (priceGroupId?: number): string => {
    if (!priceGroupId) return 'Aucun';
    const priceGroup = priceGroups.find(pg => pg.id === priceGroupId);
    return priceGroup ? priceGroup.name : 'Inconnu';
  };

  // Helper function to get account name by ID
  const getAccountName = (accountId?: number): string => {
    if (!accountId) return 'Aucun';
    const account = availableAccounts.find(a => a.id === accountId);
    return account ? account.name : 'Inconnu';
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ClientsAPI.getAll();
        setClients(data);
      } catch (err) {
        console.error('Error loading clients:', err);
        setError('Erreur lors du chargement des clients. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Add effect to load available client accounts
  useEffect(() => {
    const fetchAvailableAccounts = async () => {
      try {
        setLoadingAccounts(true);
        // Get client-type accounts that aren't assigned to clients yet
        const accounts = await AccountsAPI.getByType('client');
        
        // Filter out accounts that are already assigned to clients
        const usedAccountIds = clients.filter(c => c.account !== undefined).map(c => c.account);
        const availableAccounts = accounts.filter(a => !usedAccountIds.includes(a.id));
        
        setAvailableAccounts(availableAccounts);
      } catch (err) {
        console.error('Error loading available accounts:', err);
      } finally {
        setLoadingAccounts(false);
      }
    };

    if (showAddModal || showEditModal) {
      fetchAvailableAccounts();
    }
  }, [showAddModal, showEditModal, clients]);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleAddClient = async () => {
    try {
      setError(null);
      
      // Validate required fields
      if (!newClient.name) {
        setError('Le nom du client est requis');
        return;
      }
      
      if (!newClient.contact_person) {
        setError('Le nom du contact est requis');
        return;
      }
      
      if (!newClient.email) {
        setError('L\'email est requis');
        return;
      }
      
      if (!newClient.phone) {
        setError('Le téléphone est requis');
        return;
      }
      
      if (!newClient.address) {
        setError('L\'adresse est requise');
        return;
      }
      
      if (!newClient.price_group) {
        setError('Le groupe de prix est requis');
        return;
      }
      
      // Le backend va créer un compte automatiquement
      console.log('Creating client:', newClient);
      
      const createdClient = await ClientsAPI.create(newClient as Client);
      setClients([...clients, createdClient]);
      setShowAddModal(false);
      setNewClient({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        price_group: 1,
        account: undefined,
        is_active: true,
      });
      
      setSnackbar({
        open: true,
        message: 'Client créé avec succès',
        severity: 'success'
      });
    } catch (err: unknown) {
      console.error('Error creating client:', err);
      
      let errorMessage = 'Erreur lors de la création du client. Veuillez réessayer plus tard.';
      
      // Check for specific error messages from the API
      if (err && typeof err === 'object' && 'response' in err && 
          err.response && typeof err.response === 'object' && 
          'data' in err.response && err.response.data) {
        const errorData = err.response.data;
        
        if (typeof errorData === 'object' && 'error' in errorData) {
          errorMessage = String(errorData.error);
        } else if (typeof errorData === 'object') {
          // Format error messages from the API
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`)
            .join('\n');
          
          if (errorMessages) {
            errorMessage = `Erreurs: ${errorMessages}`;
          }
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleEditClient = async (client: Client) => {
    setEditingClient(client);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      setError(null);
      
      if (!editingClient) {
        setError('Client à éditer manquant');
        return;
      }
      
      if (!editingClient.id) {
        setError('ID du client manquant');
        return;
      }
      
      // Validate required fields
      if (!editingClient.name) {
        setError('Le nom du client est requis');
        return;
      }
      
      console.log('Updating client:', editingClient);
      const updatedClient = await ClientsAPI.update(editingClient.id, editingClient);
      console.log('Client updated:', updatedClient);
      
      // Update the local state
      setClients(clients.map(c => c.id === editingClient.id ? updatedClient : c));
      setShowEditModal(false);
      setEditingClient(null);
    } catch (err: unknown) {
      console.error('Error updating client:', err);
      
      let errorMessage = 'Erreur lors de la mise à jour du client. Veuillez réessayer plus tard.';
      
      // Check for specific error messages from the API
      if (err && typeof err === 'object' && 'response' in err && 
          err.response && typeof err.response === 'object' && 
          'data' in err.response && err.response.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          // Format error messages from the API
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
          
          if (errorMessages) {
            errorMessage = `Erreurs: ${errorMessages}`;
          }
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      setError(null);
      
      // Confirmation avant suppression
      if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${client.name}" ?`)) {
        return;
      }
      
      await ClientsAPI.delete(client.id!);
      setClients(clients.filter(c => c.id !== client.id));
      setSnackbar({
        open: true,
        message: 'Client supprimé avec succès',
        severity: 'success'
      });
    } catch (err: unknown) {
      console.error('Error deleting client:', err);
      
      let errorMessage = 'Erreur lors de la suppression du client.';
      
      // Vérifier si l'erreur contient des détails spécifiques de l'API
      if (err && typeof err === 'object' && 'response' in err && 
          err.response && typeof err.response === 'object' && 
          'data' in err.response && err.response.data) {
        const errorData = err.response.data;
        
        if (typeof errorData === 'object' && 'error' in errorData) {
          errorMessage = String(errorData.error);
          
          if ('detail' in errorData && errorData.detail) {
            errorMessage += ' ' + String(errorData.detail);
          }
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  return (
    <PermissionGuard requiredPermission="view_clients" fallbackPath="/">
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestion des Clients
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez votre portefeuille clients
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'flex-end' },
            mb: 3,
            gap: 2
          }}>
            <TextField
              label="Rechercher"
              placeholder="Nom, contact, email ou téléphone"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ maxWidth: { md: 400 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />            <PermissionButton
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setShowAddModal(true)}
              requiredPermission="add_client"
            >
              Ajouter un client
            </PermissionButton>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Coordonnées</TableCell>
                    <TableCell>Groupe de prix</TableCell>
                    <TableCell>Compte</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {client.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {client.contact_person}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          {client.phone}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <EmailIcon fontSize="small" color="action" />
                          {client.email}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <LocationIcon fontSize="small" color="action" sx={{ mt: 0.25 }} />
                          <Typography variant="body2">{client.address}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{getPriceGroupName(client.price_group)}</TableCell>
                      <TableCell>{getAccountName(client.account)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={client.is_active ? 'Actif' : 'Inactif'} 
                          color={client.is_active ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          color="primary" 
                          size="small" 
                          sx={{ mr: 1 }}
                          onClick={() => handleEditClient(client)}
                          disabled={!canEditClient}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          size="small"
                          onClick={() => handleDeleteClient(client)}
                          disabled={!canDeleteClient}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Add Client Dialog */}
        <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Ajouter un nouveau client</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Nom"
                  fullWidth
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Nom du contact"
                  fullWidth
                  value={newClient.contact_person}
                  onChange={(e) => setNewClient({...newClient, contact_person: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Téléphone"
                  fullWidth
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Adresse"
                  fullWidth
                  multiline
                  rows={2}
                  value={newClient.address}
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Groupe de prix</InputLabel>
                  <Select
                    value={newClient.price_group || ''}
                    onChange={(e) => setNewClient({...newClient, price_group: Number(e.target.value)})}
                    label="Groupe de prix"
                  >
                    {priceGroups.map((priceGroup) => (
                      <MenuItem key={priceGroup.id} value={priceGroup.id}>{priceGroup.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Compte</InputLabel>
                  <Select
                    value={newClient.account || ''}
                    onChange={(e) => setNewClient({...newClient, account: Number(e.target.value) || undefined})}
                    label="Compte"
                  >
                    <MenuItem value="">Sélectionner un compte</MenuItem>
                    {loadingAccounts ? (
                      <MenuItem disabled>Chargement des comptes...</MenuItem>
                    ) : availableAccounts.length === 0 ? (
                      <MenuItem disabled>Aucun compte client disponible</MenuItem>
                    ) : (
                      availableAccounts.map((account) => (
                        <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                      ))
                    )}
                  </Select>
                  {availableAccounts.length === 0 && !loadingAccounts && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      Aucun compte client disponible. Veuillez d'abord créer un compte de type client dans la section Trésorerie.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddModal(false)}>Annuler</Button>
            <Button variant="contained" onClick={handleAddClient}>Ajouter</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Client Dialog */}
        <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Modifier un client</DialogTitle>
          <DialogContent>
            {editingClient && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Nom"
                    fullWidth
                    value={editingClient.name}
                    onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Nom du contact"
                    fullWidth
                    value={editingClient.contact_person}
                    onChange={(e) => setEditingClient({...editingClient, contact_person: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    fullWidth
                    type="email"
                    value={editingClient.email}
                    onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Téléphone"
                    fullWidth
                    value={editingClient.phone}
                    onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Adresse"
                    fullWidth
                    multiline
                    rows={3}
                    value={editingClient.address}
                    onChange={(e) => setEditingClient({...editingClient, address: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Groupe de prix</InputLabel>
                    <Select
                      value={editingClient.price_group || ''}
                      onChange={(e) => setEditingClient({...editingClient, price_group: Number(e.target.value)})}
                      label="Groupe de prix"
                    >
                      {priceGroups.map((priceGroup) => (
                        <MenuItem key={priceGroup.id} value={priceGroup.id}>{priceGroup.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Compte</InputLabel>
                    <Select
                      value={editingClient.account || ''}
                      onChange={(e) => setEditingClient({...editingClient, account: Number(e.target.value)})}
                      label="Compte"
                    >
                      <MenuItem value="">Sélectionner un compte</MenuItem>
                      {availableAccounts.map((account) => (
                        <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEditModal(false)}>Annuler</Button>
            <Button variant="contained" onClick={handleSaveEdit}>Enregistrer</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar pour les notifications */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={() => setSnackbar({...snackbar, open: false})}
        >
          <Alert 
            onClose={() => setSnackbar({...snackbar, open: false})} 
            severity={snackbar.severity as 'success' | 'error' | 'info' | 'warning'} 
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PermissionGuard>
  );
};

export default Clients;