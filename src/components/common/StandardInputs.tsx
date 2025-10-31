import React from 'react';
import { TextField, FormControl, InputLabel, Select, Autocomplete, SelectChangeEvent } from '@mui/material';
import { 
  getStandardTextFieldStyles, 
  getStandardSelectStyles, 
  getStandardAutocompleteStyles 
} from '../../utils/styleUtils';

/**
 * Props pour TextField standardisé
 */
interface StandardTextFieldProps {
  label?: string;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  sx?: object;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  disabled?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  type?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  InputProps?: object;
}

/**
 * TextField standardisé
 */
export const StandardTextField: React.FC<StandardTextFieldProps> = ({
  sx,
  size = 'small',
  variant = 'outlined',
  ...props
}) => {
  return (
    <TextField
      size={size}
      variant={variant}
      sx={[getStandardTextFieldStyles(), ...(Array.isArray(sx) ? sx : [sx])]}
      {...props}
    />
  );
};

/**
 * Props pour Select standardisé
 */
interface StandardSelectProps {
  label?: string;
  value?: string | number;
  onChange?: (event: SelectChangeEvent<string | number>) => void;
  children?: React.ReactNode;
  sx?: object;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  disabled?: boolean;
}

/**
 * Select standardisé avec FormControl
 */
export const StandardSelect: React.FC<StandardSelectProps> = ({
  label,
  children,
  sx,
  size = 'small',
  ...props
}) => {
  return (
    <FormControl 
      size={size} 
      sx={[getStandardSelectStyles(), ...(Array.isArray(sx) ? sx : [sx])]}
      fullWidth={props.fullWidth}
    >
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        label={label}
        {...props}
      >
        {children}
      </Select>
    </FormControl>
  );
};

/**
 * Props pour Autocomplete standardisé
 */
interface StandardAutocompleteProps<T> {
  label?: string;
  placeholder?: string;
  sx?: object;
  size?: 'small' | 'medium';
  options: T[];
  value?: T | null;
  onChange?: (event: React.SyntheticEvent, value: T | null) => void;
  getOptionLabel?: (option: T) => string;
  fullWidth?: boolean;
  disabled?: boolean;
}

/**
 * Autocomplete standardisé
 */
export function StandardAutocomplete<T>({
  label,
  placeholder,
  sx,
  size = 'small',
  ...props
}: StandardAutocompleteProps<T>) {
  return (
    <Autocomplete
      size={size}
      sx={[getStandardAutocompleteStyles(), ...(Array.isArray(sx) ? sx : [sx])]}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          variant="outlined"
          size={size}
        />
      )}
      {...props}
    />
  );
}

export default {
  TextField: StandardTextField,
  Select: StandardSelect,
  Autocomplete: StandardAutocomplete
};
