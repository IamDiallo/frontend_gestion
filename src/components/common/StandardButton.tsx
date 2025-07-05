import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { 
  getStandardPrimaryButtonStyles, 
  getStandardSecondaryButtonStyles,
  getStandardActionButtonStyles,
  getStandardIconButtonStyles 
} from '../../utils/styleUtils';

/**
 * Types de boutons standardisés
 */
export type StandardButtonVariant = 'primary' | 'secondary' | 'action' | 'icon';

interface StandardButtonProps extends Omit<ButtonProps, 'variant'> {
  /**
   * Variante de style standardisée
   */
  standardVariant?: StandardButtonVariant;
  /**
   * Variante MUI native (optionnelle, utilisée avec standardVariant)
   */
  variant?: ButtonProps['variant'];
}

/**
 * Bouton standardisé avec styles uniformes
 */
const StandardButton: React.FC<StandardButtonProps> = ({
  standardVariant = 'primary',
  variant = 'contained',
  sx,
  children,
  ...props
}) => {
  // Choisir le style selon la variante standardisée
  const getButtonStyles = () => {
    switch (standardVariant) {
      case 'primary':
        return getStandardPrimaryButtonStyles();
      case 'secondary':
        return getStandardSecondaryButtonStyles();
      case 'action':
        return getStandardActionButtonStyles();
      case 'icon':
        return getStandardIconButtonStyles();
      default:
        return getStandardPrimaryButtonStyles();
    }
  };

  // Déterminer la variante MUI selon la variante standardisée
  const getMuiVariant = (): ButtonProps['variant'] => {
    if (standardVariant === 'secondary') return 'outlined';
    if (standardVariant === 'action' || standardVariant === 'icon') return 'text';
    return variant;
  };

  return (
    <Button
      variant={getMuiVariant()}
      sx={[getButtonStyles(), ...(Array.isArray(sx) ? sx : [sx])]}
      {...props}
    >
      {children}
    </Button>
  );
};

export default StandardButton;
