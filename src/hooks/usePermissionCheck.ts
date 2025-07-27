import { usePermissions } from '../context/PermissionContext';

/**
 * A hook to simplify permission checks across the application
 * @returns An object with methods to check different permission types
 */
export const usePermissionCheck = () => {
  const { hasPermission, isAdmin } = usePermissions();
  
  return {
    /**
     * Check if user can perform an action
     * @param permission The permission code to check for
     * @returns True if the user has the specified permission
     */
    canPerform: (permission: string): boolean => {
      // Admins have all permissions
      if (isAdmin) return true;
      return hasPermission(permission);
    },

    /**
     * Check if user can view a resource
     * @param permission The permission code to check for
     * @returns True if the user has the specified permission
     */
    canView: (permission: string): boolean => {
      // Admins have all permissions
      if (isAdmin) return true;
      return hasPermission(permission);
    },

    /**
     * Check if user can edit a resource
     * @param permission The permission code to check for
     * @returns True if the user has the specified permission
     */
    canEdit: (permission: string): boolean => {
      // Admins have all permissions
      if (isAdmin) return true;
      return hasPermission(permission);
    },

    /**
     * Check if user can delete a resource
     * @param permission The permission code to check for
     * @returns True if the user has the specified permission
     */
    canDelete: (permission: string): boolean => {
      // Admins have all permissions
      if (isAdmin) return true;
      return hasPermission(permission);
    }
  };
};

export default usePermissionCheck;