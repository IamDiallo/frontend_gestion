import React from 'react';
import { Button, ButtonProps, Tooltip } from '@mui/material';
import { usePermissions } from '../../context/PermissionContext';

interface PermissionButtonProps extends ButtonProps {
  requiredPermission?: string;
  disabledMessage?: string;
  hideOnNoPermission?: boolean;
  children: React.ReactNode;
}

/**
 * A button component that checks for permission before allowing the action
 */
const PermissionButton: React.FC<PermissionButtonProps> = ({
  requiredPermission,
  disabledMessage = 'You do not have permission for this action',
  hideOnNoPermission = false,
  children,
  disabled,
  ...buttonProps
}) => {
  const { hasPermission, loading } = usePermissions();
  
  // If no permission is required, or if we're still loading permissions, render a normal button
  if (!requiredPermission || loading) {
    return <Button disabled={loading || disabled} {...buttonProps}>{children}</Button>;
  }
  
  // Check if user has permission
  const hasRequiredPermission = hasPermission(requiredPermission);
  
  // If user doesn't have permission and we should hide the button
  if (!hasRequiredPermission && hideOnNoPermission) {
    return null;
  }
  
  // If user doesn't have permission, render a disabled button with tooltip
  if (!hasRequiredPermission) {
    return (
      <Tooltip title={disabledMessage}>
        <span>
          <Button disabled {...buttonProps}>{children}</Button>
        </span>
      </Tooltip>
    );
  }
  
  // User has permission, render the button normally
  return <Button disabled={disabled} {...buttonProps}>{children}</Button>;
};

export default PermissionButton;
