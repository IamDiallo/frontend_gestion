/**
 * Core Domain Interfaces
 * Types for: Users, UserProfiles, Zones, Groups, Permissions
 */

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  groups: number[];
  user_permissions: number[];
  profile_data?: UserProfile;
  permissions?: string[];
  date_joined?: string;
  last_login?: string | null;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  groups?: number[];
}

export interface UserProfile {
  id: number;
  user: number;
  role: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// GROUPS & ROLES
// ============================================================================

export interface Group {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: number;
}

export interface CategorizedPermissions {
  [category: string]: Permission[];
}

// ============================================================================
// ZONES
// ============================================================================

export interface Zone {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

// ============================================================================
// AUDIT TRAIL
// ============================================================================

export interface AuditLog {
  id: number;
  user: number;
  user_name?: string;
  action: 'create' | 'update' | 'delete';
  model_name: string;
  object_id: string;
  changes: Record<string, unknown>;
  timestamp: string;
  ip_address?: string;
}
