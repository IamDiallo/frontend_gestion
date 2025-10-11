/**
 * Utility functions for User Management
 */

import { Group, User } from '../interfaces/users';
import { Zone } from '../interfaces/sales';
import { PermissionCategoryType } from '../hooks/useUserManagementData';

// ============================================================================
// ROLE UTILITIES
// ============================================================================

export const getRoleColor = (role: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (role) {
    case 'admin':
      return 'error';
    case 'consultant':
      return 'info';
    case 'supervisor':
      return 'warning';
    case 'commercial':
      return 'success';
    case 'cashier':
      return 'secondary';
    default:
      return 'default';
  }
};

export const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Administrateur';
    case 'consultant':
      return 'Consultant';
    case 'supervisor':
      return 'Superviseur';
    case 'commercial':
      return 'Commercial';
    case 'cashier':
      return 'Chef de Caisse';
    default:
      return role;
  }
};

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

export const formatZones = (zone?: number, zoneName?: string): string => {
  if (!zone) return 'Aucune zone';
  // Display zone name if available, otherwise fall back to zone ID
  return zoneName || `Zone ${zone}`;
};

export const formatGroups = (groups?: Group[] | number[]): string => {
  // Check if groups are defined
  if (!groups || !Array.isArray(groups) || groups.length === 0) return 'Aucun groupe';
  
  return groups
    .map(g => {
      if (typeof g === 'object' && g !== null && 'name' in g) {
        return g.name || 'Groupe inconnu';
      }
      return 'Groupe inconnu';
    })
    .join(', ');
};

export const formatPermissionName = (permission: unknown): string => {
  // If permission is an object with a code property, return the code
  if (permission && typeof permission === 'object' && 'code' in permission) {
    return (permission as { code: string }).code;
  }
  // If it's a string, return it directly
  if (typeof permission === 'string') {
    return permission;
  }
  // Otherwise, return an empty string
  return '';
};

export const getPermissionLabel = (permissionValue: string, availablePermissions: PermissionCategoryType[]): string => {
  // Try to find the permission in availablePermissions
  for (const category of availablePermissions) {
    const permission = category.permissions.find(p => 
      p.codename === permissionValue || 
      p.full_codename === permissionValue
    );
    if (permission) {
      return `${category.name}: ${permission.name}`;
    }
  }
  // If not found, return the original value
  return permissionValue;
};

// ============================================================================
// USER UTILITIES
// ============================================================================

export const safeGetUsername = (user: User): string => {
  return user?.username || '';
};

export const safeGetEmail = (email: string): string => {
  return email || '';
};

export const getZoneName = (zoneId: number | undefined, zones: Zone[]): string | undefined => {
  if (!zoneId) return undefined;
  return zones.find(z => z.id === zoneId)?.name;
};

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export const extractErrorMessage = (data: unknown): string | null => {
  if (typeof data === 'string') {
    return data;
  } 
  
  if (data && typeof data === 'object') {
    const errorData = data as Record<string, unknown>;
    
    if (errorData.detail) {
      return String(errorData.detail);
    } else if (errorData.message) {
      return String(errorData.message);
    } else if (errorData.user && typeof errorData.user === 'object') {
      const userData = errorData.user as Record<string, unknown>;
      
      if (userData.username && Array.isArray(userData.username)) {
        return `Erreur de nom d'utilisateur: ${userData.username[0]}`;
      }
      
      // Check for any other user field errors
      const fieldErrors = Object.entries(userData)
        .filter(([, errors]) => Array.isArray(errors) && errors.length > 0)
        .map(([field, errors]) => `${field}: ${(errors as string[])[0]}`);
      
      if (fieldErrors.length > 0) {
        return `Erreurs de validation: ${fieldErrors.join(', ')}`;
      }
    }
  }
  
  return null;
};

export const handleGroupError = (err: unknown): string => {
  console.error('Error saving group:', err);
  
  // More detailed error handling
  if (err && typeof err === 'object' && 'response' in err) {
    const errorWithResponse = err as { response?: { data?: unknown; status?: number; statusText?: string } };
    const responseData = errorWithResponse.response?.data;
    
    console.error('Backend response:', responseData);
    
    if (responseData && typeof responseData === 'object') {
      const data = responseData as Record<string, unknown>;
      
      // Handle various error response formats
      if (typeof data === 'string') {
        return String(data);
      } else if (data.detail) {
        return String(data.detail);
      } else if (data.name && Array.isArray(data.name)) {
        return `Erreur: ${data.name[0]}`;
      } else if (data.permissions) {
        if (Array.isArray(data.permissions)) {
          // Look for uniqueness constraint errors
          const uniquenessErrors = data.permissions.filter((p: unknown) => {
            if (p && typeof p === 'object') {
              const permError = p as Record<string, unknown>;
              return permError.non_field_errors && 
                     Array.isArray(permError.non_field_errors) &&
                     permError.non_field_errors[0] &&
                     String(permError.non_field_errors[0]).includes('ensemble unique');
            }
            return false;
          });
          
          if (uniquenessErrors.length > 0) {
            return "Erreur: Des permissions en double ont été détectées. Veuillez réessayer.";
          } else {
            return `Erreur de permissions: ${JSON.stringify(data.permissions)}`;
          }
        } else {
          return `Erreur de permissions: ${String(data.permissions)}`;
        }
      } else {
        const status = errorWithResponse.response?.status;
        const statusText = errorWithResponse.response?.statusText;
        return `Erreur ${status}: ${statusText}`;
      }
    } else if (typeof responseData === 'string') {
      return responseData;
    }
  } else if (err && typeof err === 'object' && 'message' in err) {
    return `Erreur: ${String((err as { message: unknown }).message)}`;
  }
  
  return 'Une erreur inattendue est survenue lors de la sauvegarde du groupe';
};
