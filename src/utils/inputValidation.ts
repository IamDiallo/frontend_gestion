// Reusable validation functions for number inputs

/**
 * Validates integer input (positive whole numbers)
 * @param value - The string value from input
 * @param currentValue - The current numeric value (can be undefined)
 * @returns The validated numeric value
 */
export const validateIntegerInput = (value: string, currentValue: number | undefined): number => {
  if (value === '' || /^\d+$/.test(value)) {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (numValue >= 0) {
      return numValue;
    }
  }
  return currentValue ?? 0;
};

/**
 * Validates decimal input (positive decimal numbers)
 * @param value - The string value from input
 * @param currentValue - The current numeric value (can be undefined)
 * @returns The validated numeric value
 */
export const validateDecimalInput = (value: string, currentValue: number | undefined): number => {
  if (value === '' || /^\d*\.?\d*$/.test(value)) {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      return numValue;
    }
  }
  return currentValue ?? 0;
};

/**
 * Formats a number for display in input fields
 * @param value - The numeric value (can be undefined or null)
 * @returns Empty string if 0, undefined, or null, otherwise the string representation
 */
export const formatNumberDisplay = (value: number | undefined | null): string => {
  if (value === undefined || value === null || value === 0) {
    return '';
  }
  return value.toString();
};

/**
 * Gets validation error message based on value and type
 * @param value - The numeric value to validate (can be undefined)
 * @param type - The type of validation
 * @returns Error message string or empty string if valid
 */
export const getValidationError = (
  value: number | undefined, 
  type: 'quantity' | 'price' | 'amount' | 'stock'
): string => {
  const numValue = value ?? 0;
  switch (type) {
    case 'quantity':
      return numValue < 1 && numValue !== 0 ? "La quantité doit être supérieure à 0" : "";
    case 'price':
      return numValue < 0 ? "Le prix doit être positif" : "";
    case 'amount':
      return numValue <= 0 ? "Le montant doit être supérieur à 0" : "";
    case 'stock':
      return numValue < 0 ? "Le niveau doit être positif ou zéro" : "";
    default:
      return "";
  }
};

/**
 * Validates amount input with optional maximum value check
 * @param value - The string value from input
 * @param currentValue - The current numeric value (can be undefined)
 * @param maxValue - Optional maximum allowed value
 * @returns The validated numeric value
 */
export const validateAmountInput = (
  value: string, 
  currentValue: number | undefined, 
  maxValue?: number
): number => {
  const validatedValue = validateDecimalInput(value, currentValue);
  if (maxValue !== undefined && validatedValue > maxValue) {
    return currentValue ?? 0; // Don't update if exceeds max
  }
  return validatedValue;
};

/**
 * Gets validation error for amount with maximum value check
 * @param value - The numeric value (can be undefined)
 * @param maxValue - Optional maximum allowed value
 * @returns Error message or empty string
 */
export const getAmountValidationError = (
  value: number | undefined, 
  maxValue?: number
): string => {
  const numValue = value ?? 0;
  if (numValue <= 0) {
    return "Le montant doit être supérieur à 0";
  }
  if (maxValue !== undefined && numValue > maxValue) {
    return "Le montant ne peut pas dépasser le solde restant";
  }
  return "";
};
