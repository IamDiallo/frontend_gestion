import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { getStatusChipStyles } from '../../utils/styleUtils';
import { getStatusTranslation } from '../../utils/translations';

/**
 * Props pour StatusChip
 */
interface StatusChipProps extends Omit<ChipProps, 'color' | 'translate'> {
  /**
   * Statut à afficher
   */
  status: string;
  /**
   * Afficher la traduction française
   */
  translateStatus?: boolean;
  /**
   * Taille du chip
   */
  size?: ChipProps['size'];
}

/**
 * Chip de statut standardisé avec couleurs automatiques
 */
const StatusChip: React.FC<StatusChipProps> = ({
  status,
  translateStatus = true,
  size = 'small',
  sx,
  ...props
}) => {
  const displayText = translateStatus ? getStatusTranslation(status) : status;
  
  return (
    <Chip
      label={displayText}
      size={size}
      sx={[getStatusChipStyles(status), ...(Array.isArray(sx) ? sx : [sx])]}
      {...props}
    />
  );
};

export default StatusChip;
