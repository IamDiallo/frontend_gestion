import React from 'react';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Typography, 
  Button, 
  Paper,
  Tooltip,
  StepConnector,
  stepConnectorClasses,
  styled,
  Chip
} from '@mui/material';
import {
  ShoppingCart,
  LocalShipping,
  Payments,
  Check,
  Cancel,
  ReceiptLong,
  Pending as PendingIcon,
  ElectricBolt,
  PlaylistAddCheck as PlaylistAddCheckIcon
} from '@mui/icons-material';

const WorkflowConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.dark} 100%)`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(95deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 50%, ${theme.palette.success.dark} 100%)`,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
  },
}));

const WorkflowStepIconRoot = styled('div')<{
  ownerState: { active?: boolean; completed?: boolean; cancelled?: boolean; };
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    backgroundImage: `linear-gradient(136deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.dark} 100%)`,
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundImage: `linear-gradient(136deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 50%, ${theme.palette.success.dark} 100%)`,
  }),
  ...(ownerState.cancelled && {
    backgroundImage: `linear-gradient(136deg, ${theme.palette.error.light} 0%, ${theme.palette.error.main} 50%, ${theme.palette.error.dark} 100%)`,
  }),
}));

const WorkflowStepIcon = (props: { 
  active: boolean; 
  completed: boolean; 
  cancelled?: boolean;
  icon: React.ReactNode;
}) => {
  const { active, completed, cancelled, icon } = props;

  return (
    <WorkflowStepIconRoot ownerState={{ active, completed, cancelled }}>
      {icon}
    </WorkflowStepIconRoot>
  );
};

export type SalesStatus ='draft' | 'pending' | 'confirmed' | 'payment_pending' |
                          'partially_paid' | 'paid' | 'shipped' | 'delivered' | 
                          'completed' | 'cancelled' | 'fast_track';

export interface SalesWorkflowProps {
  status: SalesStatus;
  reference: string;
  allowedTransitions: string[];
  onStatusChange?: (newStatus: SalesStatus) => void;
  isLoading?: boolean;
}

const SalesWorkflow: React.FC<SalesWorkflowProps> = ({
  status,
  reference,
  allowedTransitions,
  onStatusChange,
  isLoading = false
}) => {  // Define the steps in our sales workflow
  const steps = [
    { 
      label: 'Brouillon', 
      value: 'draft', 
      icon: <PendingIcon />,
      description: 'Vente en cours de création'
    },
    { 
      label: 'En attente', 
      value: 'pending', 
      icon: <PendingIcon />,
      description: 'Vente enregistrée en attente de confirmation'
    },
    { 
      label: 'Confirmée', 
      value: 'confirmed', 
      icon: <ShoppingCart />,
      description: 'Vente confirmée'
    },
    { 
      label: 'Paiement en attente', 
      value: 'payment_pending', 
      icon: <ReceiptLong />,
      description: 'En attente de paiement'
    },
    { 
      label: 'Payée partiellement', 
      value: 'partially_paid', 
      icon: <ReceiptLong />,
      description: 'Paiement partiel reçu'
    },
    { 
      label: 'Payée', 
      value: 'paid', 
      icon: <Payments />,
      description: 'Paiement reçu'
    },
    { 
      label: 'Expédiée', 
      value: 'shipped', 
      icon: <LocalShipping />,
      description: 'Produits en cours de livraison au client'
    },
    { 
      label: 'Livrée', 
      value: 'delivered', 
      icon: <Check />,
      description: 'Produits livrés au client'
    },
    { 
      label: 'Complétée', 
      value: 'completed', 
      icon: <Check />,
      description: 'Vente finalisée'
    }
  ];
  // Current step index (or -1 if cancelled)
  const activeStep = status === 'cancelled' 
    ? -1 
    : steps.findIndex(step => step.value === status);

  const handleNext = (nextStatus: SalesStatus) => {
    if (onStatusChange && !isLoading) {
      onStatusChange(nextStatus);
    }
  };
  return (
    <Paper sx={{ p: 3, borderRadius: 2, mb: 3, boxShadow: 3 }}>
      <Box sx={{ 
        mb: 2, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
            Suivi de vente: {reference}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Statut actuel:
            </Typography>
            {status === 'cancelled' 
              ? <Chip color="error" size="small" label="Annulée" />
              : <Chip 
                  color={
                    status === 'completed' ? 'success' : 
                    status === 'paid' ? 'primary' :
                    status === 'partially_paid' ? 'warning' :
                    'default'
                  }
                  size="small" 
                  label={steps.find(s => s.value === status)?.label || status} 
                />
            }
          </Box>
        </Box>
        
        <Box sx={{ mt: { xs: 2, sm: 0 } }}>
          <Typography variant="caption" color="text.secondary">Dernière mise à jour</Typography>
          <Typography variant="body2">{new Date().toLocaleDateString()}</Typography>
        </Box>
      </Box>

      {status === 'cancelled' ? (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          bgcolor: 'error.lighter', 
          p: 2, 
          borderRadius: 1,
          mb: 2
        }}>
          <Cancel color="error" sx={{ fontSize: 32, mr: 2 }} />
          <Box>
            <Typography fontWeight="medium" color="error">
              Cette vente a été annulée
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aucune autre action n'est possible sur cette vente
            </Typography>
          </Box>
        </Box>
      ) : (
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel 
          connector={<WorkflowConnector />}
          sx={{ mb: 3 }}
        >
          {steps.map((step, index) => {
            const stepProps = { completed: index < activeStep };
            const isActive = index === activeStep;
            
            return (
              <Step key={step.value} {...stepProps}>                <StepLabel 
                  StepIconComponent={() => (
                    <WorkflowStepIcon
                      active={isActive}
                      completed={index < activeStep}
                      icon={step.icon}
                    />
                  )}
                >
                  <Typography
                    variant="body2"
                    color={isActive ? 'primary.main' : (index < activeStep ? 'success.main' : 'text.secondary')}
                    sx={{ fontWeight: isActive ? 'bold' : 'medium' }}
                  >
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>      )}      {activeStep !== steps.length - 1 && status !== 'cancelled' && (<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 2, mt: 2 }}>
          {/* Available transitions */}
          {allowedTransitions.includes('confirmed') && status === 'pending' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleNext('confirmed')}
              startIcon={<ShoppingCart />}
              disabled={isLoading}
              size="small"
            >
              Confirmer la vente
            </Button>
          )}
          {allowedTransitions.includes('payment_pending') && status === 'confirmed' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleNext('payment_pending')}
              startIcon={<ReceiptLong />}
              disabled={isLoading}
              size="small"
              sx={{ boxShadow: 2 }}
            >
              Paiement en attente
            </Button>
          )}          {allowedTransitions.includes('partially_paid') && status === 'payment_pending' && (
            <Button
              variant="contained"
              color="warning"
              onClick={() => handleNext('partially_paid')}
              startIcon={<Payments />}
              disabled={isLoading}
              size="small"
              sx={{ boxShadow: 2 }}
            >
              Marquer comme payée partiellement
            </Button>
          )}
          {allowedTransitions.includes('paid') && (status === 'payment_pending' || status === 'partially_paid') && (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleNext('paid')}
              startIcon={<Check />}
              disabled={isLoading}
              size="small"
              sx={{ boxShadow: 2 }}
            >
              Marquer comme payée
            </Button>
          )}
          {allowedTransitions.includes('shipped') && status === 'paid' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleNext('shipped')}
              startIcon={<LocalShipping />}
              disabled={isLoading}
              size="small"
            >
              Marquer comme expédiée
            </Button>
          )}
          {allowedTransitions.includes('delivered') && status === 'shipped' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleNext('delivered')}
              startIcon={<Check />}
              disabled={isLoading}
              size="small"
            >
              Marquer comme livrée
            </Button>
          )}
          {allowedTransitions.includes('completed') && status === 'delivered' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleNext('completed')}
              startIcon={<Check />}
              disabled={isLoading}
              size="small"
            >
              Compléter la vente
            </Button>
          )}          
          {allowedTransitions.includes('fast_track') && status !== 'completed' && (status as SalesStatus) !== 'cancelled' && (
            <Tooltip title="Passer directement à l'étape complétée">
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                // First complete the intermediate steps in sequence to avoid validation errors
                onClick={() => {                  // Determine which steps need to be completed based on current status
                  if (['pending', 'confirmed', 'payment_pending', 'partially_paid'].includes(status)) {
                    handleNext('paid');
                    setTimeout(() => {
                      handleNext('shipped');
                      setTimeout(() => {
                        handleNext('delivered');
                        setTimeout(() => {
                          handleNext('completed');
                        }, 300);
                      }, 300);
                    }, 300);                  } else if (status === 'paid') {
                    handleNext('shipped');
                    setTimeout(() => {
                      handleNext('delivered');
                      setTimeout(() => {
                        handleNext('completed');
                      }, 300);
                    }, 300);
                  } else if (status === 'shipped') {
                    handleNext('delivered');
                    setTimeout(() => {
                      handleNext('completed');
                    }, 300);
                  }
                }}
                startIcon={<ElectricBolt />}
                disabled={isLoading}
              >
                Compléter rapidement
              </Button>
            </Tooltip>
          )}{allowedTransitions.includes('cancelled') && status !== 'completed' && (status as SalesStatus) !== 'cancelled' && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleNext('cancelled')}
              startIcon={<Cancel />}
              disabled={isLoading}
              size="small"
            >
              Annuler la vente
            </Button>
          )}
        </Box>
      )}      {/* Actions for completed sales */}
      {status === 'completed' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<ReceiptLong />}
            disabled={isLoading}
          >
            Imprimer le reçu
          </Button>
          <Button
            variant="outlined"
            color="success"
            size="small"
            startIcon={<PlaylistAddCheckIcon />}
            disabled={isLoading}
          >
            Voir les détails
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default SalesWorkflow;
