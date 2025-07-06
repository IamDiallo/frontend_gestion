/**
 * Traductions françaises centralisées pour toute l'application
 */

// ============ TERMES GÉNÉRAUX ============
export const GENERAL_TRANSLATIONS = {
  // Actions
  add: 'Ajouter',
  edit: 'Modifier',
  update: 'Mettre à jour',
  delete: 'Supprimer',
  save: 'Enregistrer',
  cancel: 'Annuler',
  confirm: 'Confirmer',
  close: 'Fermer',
  refresh: 'Actualiser',
  search: 'Rechercher',
  filter: 'Filtrer',
  view: 'Voir',
  download: 'Télécharger',
  upload: 'Téléverser',
  import: 'Importer',
  export: 'Exporter',
  print: 'Imprimer',
  scan: 'Scanner',
  actions: 'Actions',
  
  // Navigation
  previous: 'Précédent',
  next: 'Suivant',
  back: 'Retour',
  home: 'Accueil',
  dashboard: 'Tableau de bord',
  
  // États
  loading: 'Chargement...',
  saving: 'Sauvegarde...',
  success: 'Succès',
  error: 'Erreur',
  warning: 'Attention',
  info: 'Information',
  
  // Données
  name: 'Nom',
  company: 'Entreprise',
  description: 'Description',
  date: 'Date',
  time: 'Heure',
  status: 'Statut',
  type: 'Type',
  category: 'Catégorie',
  reference: 'Référence',
  quantity: 'Quantité',
  price: 'Prix',
  total: 'Total',
  subtotal: 'Sous-total',
  tax: 'Taxe',
  
  // Ventes - termes généraux
  client: 'Client',
  clients: 'Clients',
  totalAmount: 'Montant Total',
  paidAmount: 'Montant Payé',
  remainingAmount: 'Reste à Payer',
  payment: 'Paiement',
  viewDetails: 'Voir détails',
  overduePayment: 'Paiement en retard',
  safeDeletable: 'Cette vente peut être supprimée en toute sécurité',
  
  // Contact information
  contact: 'Contact',
  contactPerson: 'Personne de contact',
  email: 'Email',
  phone: 'Téléphone',
  address: 'Adresse',
  priceGroup: 'Groupe de prix',
  account: 'Compte',
  coordinates: 'Coordonnées',
  
  // Suppliers
  supplier: 'Fournisseur',
  suppliers: 'Fournisseurs',
  
  // Messages
  noData: 'Aucune donnée disponible',
  noResults: 'Aucun résultat trouvé',
  confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
  unsavedChanges: 'Vous avez des modifications non sauvegardées',
  
  // Validation
  required: 'Ce champ est requis',
  invalid: 'Valeur invalide',
  tooShort: 'Trop court',
  tooLong: 'Trop long',
  mustBePositive: 'Doit être positif',
  mustBeGreaterThanZero: 'Doit être supérieur à zéro'
};

// ============ STATUTS ============
export const STATUS_TRANSLATIONS = {
  // Statuts généraux
  active: 'Actif',
  inactive: 'Inactif',
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  draft: 'Brouillon',
  published: 'Publié',
  archived: 'Archivé',
  cancelled: 'Annulé',
  completed: 'Terminé',
  confirmed: 'Confirmé',
  
  // Statuts de stock
  in_stock: 'En stock',
  low_stock: 'Stock faible',
  out_of_stock: 'Rupture de stock',
  
  // Statuts de commande/vente
  quote: 'Devis',
  order: 'Commande',
  invoice: 'Facture',
  delivered: 'Livré',
  shipped: 'Expédié',
  payment_pending: 'Paiement en attente',
  partially_paid: 'Partiellement payé',
  
  // Statuts de paiement
  paid: 'Payé',
  unpaid: 'Non payé',
  partial: 'Partiel',
  overdue: 'En retard',
  unknown: 'Inconnu',
  
  // Statuts de devis
  sent: 'Envoyé',
  accepted: 'Accepté',
  expired: 'Expiré',
  
  // Types de produits
  raw_material: 'Matière première',
  finished_product: 'Produit fini'
};

// ============ MODULES ============
export const MODULE_TRANSLATIONS = {
  // Modules principaux
  dashboard: 'Tableau de bord',
  sales: 'Ventes',
  inventory: 'Inventaire',
  products: 'Produits',
  clients: 'Clients',
  suppliers: 'Fournisseurs',
  treasury: 'Trésorerie',
  production: 'Production',
  userManagement: 'Gestion des utilisateurs',
  settings: 'Paramètres',
  
  // Sous-modules inventaire
  currentStock: 'Stock actuel',
  stockSupplies: 'Approvisionnements',
  stockTransfers: 'Transferts',
  inventoryCount: 'Inventaires',
  stockHistory: 'Historique',
  
  // Sous-modules ventes
  quotes: 'Devis',
  orders: 'Commandes',
  invoices: 'Factures',
  
  // Sous-modules trésorerie
  accounts: 'Comptes',
  transactions: 'Transactions',
  reports: 'Rapports'
};

// ============ INVENTAIRE ============
export const INVENTORY_TRANSLATIONS = {
  // Général
  stock: 'Stock',
  currentStock: 'Stock actuel',
  warehouse: 'Entrepôt',
  location: 'Emplacement',
  zone: 'Zone',
  product: 'Produit',
  products: 'Produits',
  quantity: 'Quantité',
  
  // Opérations
  supply: 'Approvisionnement',
  supplies: 'Approvisionnements',
  transfer: 'Transfert',
  transfers: 'Transferts',
  inventory: 'Inventaire',
  inventories: 'Inventaires',
  movement: 'Mouvement',
  movements: 'Mouvements',
  
  // Quantités
  expectedQuantity: 'Quantité attendue',
  actualQuantity: 'Quantité réelle',
  difference: 'Différence',
  unitPrice: 'Prix unitaire',
  totalPrice: 'Prix total',
  stockValue: 'Valeur du stock',
  totalQuantity: 'Quantité Total',
  merchandiseValue: 'Valeur de la marchandise',
  
  // Actions spécifiques
  receive: 'Réceptionner',
  count: 'Compter',
  adjust: 'Ajuster',
  
  // Messages
  addProduct: 'Ajouter un produit',
  selectProduct: 'Sélectionner un produit',
  selectSupplier: 'Sélectionner un fournisseur',
  selectLocation: 'Sélectionner un emplacement',
  selectSourceLocation: 'Sélectionner l\'emplacement source',
  selectTargetLocation: 'Sélectionner l\'emplacement cible',
  
  // Erreurs
  noProductSelected: 'Aucun produit sélectionné',
  noSupplierSelected: 'Aucun fournisseur sélectionné',
  noLocationSelected: 'Aucun emplacement sélectionné',
  invalidQuantity: 'Quantité invalide',
  invalidPrice: 'Prix invalide',
  sameSourceTarget: 'L\'emplacement source et cible doivent être différents'
};

// ============ VENTES ============
export const SALES_TRANSLATIONS = {
  // Types de documents
  quote: 'Devis',
  quotes: 'Devis',
  order: 'Commande',
  orders: 'Commandes',
  invoice: 'Facture',
  invoices: 'Factures',
  
  // Champs
  client: 'Client',
  clients: 'Clients',
  amount: 'Montant',
  discount: 'Remise',
  
  // Actions
  convertToOrder: 'Convertir en commande',
  convertToInvoice: 'Convertir en facture',
  generateInvoice: 'Générer la facture',
  
  // Messages
  selectClient: 'Sélectionner un client',
  addItem: 'Ajouter un article'
};

// ============ PRODUITS ============
export const PRODUCTS_TRANSLATIONS = {
  product: 'Produit',
  products: 'Produits',
  category: 'Catégorie',
  categories: 'Catégories',
  unit: 'Unité',
  units: 'Unités',
  unitOfMeasure: 'Unité de mesure',
  barcode: 'Code-barres',
  qrCode: 'Code QR',
  
  // Champs
  productName: 'Nom du produit',
  productCode: 'Code produit',
  purchasePrice: 'Prix d\'achat',
  salePrice: 'Prix de vente',
  minStock: 'Stock minimum',
  
  // Messages
  selectCategory: 'Sélectionner une catégorie',
  selectUnit: 'Sélectionner une unité'
};

// ============ CLIENTS/FOURNISSEURS ============
export const CONTACTS_TRANSLATIONS = {
  client: 'Client',
  clients: 'Clients',
  supplier: 'Fournisseur',
  suppliers: 'Fournisseurs',
  
  // Actions
  addClient: 'Ajouter un client',
  addSupplier: 'Ajouter un fournisseur',
  
  // Champs
  companyName: 'Nom de l\'entreprise',
  contactPerson: 'Personne de contact',
  email: 'Email',
  phone: 'Téléphone',
  address: 'Adresse',
  city: 'Ville',
  postalCode: 'Code postal',
  country: 'Pays',
  
  // Messages
  selectClient: 'Sélectionner un client',
  selectSupplier: 'Sélectionner un fournisseur'
};

// ============ FILTRES ============
export const FILTER_TRANSLATIONS = {
  filterBy: 'Filtrer par',
  filterByStatus: 'Filtrer par statut',
  filterByLocation: 'Filtrer par emplacement',
  filterBySupplier: 'Filtrer par fournisseur',
  filterByClient: 'Filtrer par client',
  filterByCategory: 'Filtrer par catégorie',
  filterByDate: 'Filtrer par date',
  clearFilters: 'Effacer les filtres',
  
  // Recherche
  searchProduct: 'Rechercher un produit',
  searchClient: 'Rechercher un client',
  searchSupplier: 'Rechercher un fournisseur',
  searchReference: 'Rechercher par référence',
  searchByName: 'Rechercher par nom',
  searchPlaceholder: 'Tapez pour rechercher...'
};

// ============ PAGINATION ============
export const PAGINATION_TRANSLATIONS = {
  rowsPerPage: 'Lignes par page',
  of: 'sur',
  page: 'Page',
  
  // Navigation
  firstPage: 'Première page',
  previousPage: 'Page précédente',
  nextPage: 'Page suivante',
  lastPage: 'Dernière page'
};

// ============ VALIDATION ============
export const VALIDATION_TRANSLATIONS = {
  // Messages d'erreur
  fieldRequired: 'Ce champ est requis',
  invalidEmail: 'Adresse email invalide',
  invalidPhone: 'Numéro de téléphone invalide',
  invalidNumber: 'Nombre invalide',
  mustBePositive: 'Doit être un nombre positif',
  mustBeGreaterThanZero: 'Doit être supérieur à zéro',
  tooShort: 'Trop court',
  tooLong: 'Trop long',
  
  // Messages de succès
  saveSuccess: 'Sauvegarde réussie',
  deleteSuccess: 'Suppression réussie',
  createSuccess: 'Création réussie',
  updateSuccess: 'Mise à jour réussie',
  
  // Messages d'erreur génériques
  saveError: 'Erreur lors de la sauvegarde',
  deleteError: 'Erreur lors de la suppression',
  createError: 'Erreur lors de la création',
  updateError: 'Erreur lors de la mise à jour',
  loadError: 'Erreur lors du chargement',
  unknownError: 'Erreur inconnue'
};

// ============ DATES ============
export const DATE_TRANSLATIONS = {
  today: 'Aujourd\'hui',
  yesterday: 'Hier',
  tomorrow: 'Demain',
  thisWeek: 'Cette semaine',
  thisMonth: 'Ce mois',
  thisYear: 'Cette année',
  
  // Jours
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
  
  // Mois
  january: 'Janvier',
  february: 'Février',
  march: 'Mars',
  april: 'Avril',
  may: 'Mai',
  june: 'Juin',
  july: 'Juillet',
  august: 'Août',
  september: 'Septembre',
  october: 'Octobre',
  november: 'Novembre',
  december: 'Décembre'
};

// ============ FONCTIONS UTILITAIRES ============

/**
 * Obtient la traduction d'un statut
 */
export const getStatusTranslation = (status: string): string => {
  return STATUS_TRANSLATIONS[status as keyof typeof STATUS_TRANSLATIONS] || status;
};

/**
 * Obtient la traduction d'un module
 */
export const getModuleTranslation = (module: string): string => {
  return MODULE_TRANSLATIONS[module as keyof typeof MODULE_TRANSLATIONS] || module;
};

/**
 * Obtient la traduction d'un terme général
 */
export const getGeneralTranslation = (term: string): string => {
  return GENERAL_TRANSLATIONS[term as keyof typeof GENERAL_TRANSLATIONS] || term;
};

/**
 * Obtient la traduction d'un terme de validation
 */
export const getValidationTranslation = (term: string): string => {
  return VALIDATION_TRANSLATIONS[term as keyof typeof VALIDATION_TRANSLATIONS] || term;
};

/**
 * Fonction de traduction principale - essaie tous les objets de traduction
 */
export const t = (key: string): string => {
  // Try general translations first
  if (GENERAL_TRANSLATIONS[key as keyof typeof GENERAL_TRANSLATIONS]) {
    return GENERAL_TRANSLATIONS[key as keyof typeof GENERAL_TRANSLATIONS];
  }
  
  // Try status translations
  if (STATUS_TRANSLATIONS[key as keyof typeof STATUS_TRANSLATIONS]) {
    return STATUS_TRANSLATIONS[key as keyof typeof STATUS_TRANSLATIONS];
  }
  
  // Try module translations
  if (MODULE_TRANSLATIONS[key as keyof typeof MODULE_TRANSLATIONS]) {
    return MODULE_TRANSLATIONS[key as keyof typeof MODULE_TRANSLATIONS];
  }
  
  // Try inventory translations
  if (INVENTORY_TRANSLATIONS[key as keyof typeof INVENTORY_TRANSLATIONS]) {
    return INVENTORY_TRANSLATIONS[key as keyof typeof INVENTORY_TRANSLATIONS];
  }
  
  // Try sales translations
  if (SALES_TRANSLATIONS[key as keyof typeof SALES_TRANSLATIONS]) {
    return SALES_TRANSLATIONS[key as keyof typeof SALES_TRANSLATIONS];
  }
  
  // Try products translations
  if (PRODUCTS_TRANSLATIONS[key as keyof typeof PRODUCTS_TRANSLATIONS]) {
    return PRODUCTS_TRANSLATIONS[key as keyof typeof PRODUCTS_TRANSLATIONS];
  }
  
  // Try contacts translations
  if (CONTACTS_TRANSLATIONS[key as keyof typeof CONTACTS_TRANSLATIONS]) {
    return CONTACTS_TRANSLATIONS[key as keyof typeof CONTACTS_TRANSLATIONS];
  }
  
  // Try validation translations
  if (VALIDATION_TRANSLATIONS[key as keyof typeof VALIDATION_TRANSLATIONS]) {
    return VALIDATION_TRANSLATIONS[key as keyof typeof VALIDATION_TRANSLATIONS];
  }
  
  // Try datetime translations
  if (DATE_TRANSLATIONS[key as keyof typeof DATE_TRANSLATIONS]) {
    return DATE_TRANSLATIONS[key as keyof typeof DATE_TRANSLATIONS];
  }
  
  // Return the key itself if no translation found
  return key;
};
