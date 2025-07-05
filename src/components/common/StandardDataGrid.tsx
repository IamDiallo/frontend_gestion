import React from 'react';
import { DataGrid, DataGridProps, GridToolbar } from '@mui/x-data-grid';
import { Box, Typography, CircularProgress } from '@mui/material';
import { 
  getStandardDataGridStyles, 
  getStandardPaginationModel,
  STANDARD_PAGE_SIZE_OPTIONS 
} from '../../utils/styleUtils';
import { GENERAL_TRANSLATIONS, PAGINATION_TRANSLATIONS } from '../../utils/translations';

/**
 * Props pour le DataGrid standardisé
 */
interface StandardDataGridProps extends Omit<DataGridProps, 'sx'> {
  /**
   * Titre optionnel du tableau
   */
  title?: string;
  /**
   * État de chargement
   */
  loading?: boolean;
  /**
   * Message à afficher si aucune donnée
   */
  noDataMessage?: string;
  /**
   * Pagination personnalisée
   */
  page?: number;
  /**
   * Nombre de lignes par page
   */
  rowsPerPage?: number;
  /**
   * Callback pour changement de pagination
   */
  onPaginationChange?: (page: number, rowsPerPage: number) => void;
  /**
   * Afficher la toolbar de recherche/filtres
   */
  showToolbar?: boolean;
  /**
   * Styles personnalisés additionnels
   */
  sx?: DataGridProps['sx'];
}

/**
 * DataGrid standardisé avec styles et fonctionnalités uniformes
 */
const StandardDataGrid: React.FC<StandardDataGridProps> = ({
  title,
  loading = false,
  noDataMessage = GENERAL_TRANSLATIONS.noData,
  page = 0,
  rowsPerPage = 10,
  onPaginationChange,
  showToolbar = false,
  sx,
  rows,
  columns,
  ...props
}) => {
  
  // Gestion de la pagination
  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    if (onPaginationChange) {
      onPaginationChange(model.page, model.pageSize);
    }
  };

  // Localisation française pour le DataGrid
  const localeText = {
    // Toolbar
    toolbarDensity: 'Densité',
    toolbarDensityLabel: 'Densité',
    toolbarDensityCompact: 'Compact',
    toolbarDensityStandard: 'Standard',
    toolbarDensityComfortable: 'Confortable',
    toolbarColumns: 'Colonnes',
    toolbarColumnsLabel: 'Sélectionner les colonnes',
    toolbarFilters: 'Filtres',
    toolbarFiltersLabel: 'Afficher les filtres',
    toolbarFiltersTooltipHide: 'Masquer les filtres',
    toolbarFiltersTooltipShow: 'Afficher les filtres',
    toolbarFiltersTooltipActive: (count: number) =>
      count !== 1 ? `${count} filtres actifs` : `${count} filtre actif`,
    toolbarExport: 'Exporter',
    toolbarExportLabel: 'Exporter',
    toolbarExportCSV: 'Télécharger en CSV',
    toolbarExportPrint: 'Imprimer',
    
    // Pagination
    MuiTablePagination: {
      labelRowsPerPage: PAGINATION_TRANSLATIONS.rowsPerPage,
      labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
        `${from}–${to} ${PAGINATION_TRANSLATIONS.of} ${count !== -1 ? count : `plus de ${to}`}`,
    },
    
    // Colonnes
    columnMenuLabel: 'Menu',
    columnMenuShowColumns: 'Afficher les colonnes',
    columnMenuFilter: 'Filtrer',
    columnMenuHideColumn: 'Masquer',
    columnMenuUnsort: 'Annuler le tri',
    columnMenuSortAsc: 'Tri croissant',
    columnMenuSortDesc: 'Tri décroissant',
    
    // Filtres
    filterPanelAddFilter: 'Ajouter un filtre',
    filterPanelDeleteIconLabel: 'Supprimer',
    filterPanelOperators: 'Opérateur',
    filterPanelOperatorAnd: 'Et',
    filterPanelOperatorOr: 'Ou',
    filterPanelColumns: 'Colonnes',
    filterPanelInputLabel: 'Valeur',
    filterPanelInputPlaceholder: 'Valeur du filtre',
    
    // Opérateurs de filtre
    filterOperatorContains: 'contient',
    filterOperatorEquals: 'égale',
    filterOperatorStartsWith: 'commence par',
    filterOperatorEndsWith: 'finit par',
    filterOperatorIs: 'est',
    filterOperatorNot: 'n\'est pas',
    filterOperatorAfter: 'postérieur à',
    filterOperatorOnOrAfter: 'postérieur ou égal à',
    filterOperatorBefore: 'antérieur à',
    filterOperatorOnOrBefore: 'antérieur ou égal à',
    filterOperatorIsEmpty: 'est vide',
    filterOperatorIsNotEmpty: 'n\'est pas vide',
    filterOperatorIsAnyOf: 'est n\'importe lequel',
    
    // Messages
    noRowsLabel: noDataMessage,
    noResultsOverlayLabel: GENERAL_TRANSLATIONS.noResults,
    errorOverlayDefaultLabel: 'Une erreur est survenue.',
    
    // Sélection
    checkboxSelectionHeaderName: 'Sélection',
    
    // Tri
    sortedAscending: 'trié par ordre croissant',
    sortedDescending: 'trié par ordre décroissant',
    
    // Menu des colonnes
    columnHeaderFiltersTooltipActive: (count: number) =>
      count !== 1 ? `${count} filtres actifs` : `${count} filtre actif`,
    columnHeaderFiltersLabel: 'Afficher les filtres',
    columnHeaderSortIconLabel: 'Trier',
  };

  return (
    <Box>
      {title && (
        <Typography variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
      )}
      
      <Box sx={[getStandardDataGridStyles(), ...(Array.isArray(sx) ? sx : [sx])]}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            minHeight: 200
          }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            
            // Pagination
            pagination
            paginationModel={getStandardPaginationModel(page, rowsPerPage)}
            onPaginationModelChange={handlePaginationModelChange}
            pageSizeOptions={STANDARD_PAGE_SIZE_OPTIONS}
            
            // Options de base
            checkboxSelection={false}
            disableRowSelectionOnClick={!props.onRowClick} // Disable only if no row click handler
            
            // Toolbar conditionnelle
            slots={showToolbar ? { toolbar: GridToolbar } : undefined}
            
            // Localisation
            localeText={localeText}
            
            // ID de ligne par défaut
            getRowId={(row) => row.id || Math.random()}
            
            // Autres props
            {...props}
          />
        )}
      </Box>
    </Box>
  );
};

export default StandardDataGrid;
