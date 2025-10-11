// User and authentication related interfaces
export interface UserProfile {
  id: number;
  role: string;
  is_active: boolean;
  zone: number | null;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_staff?: boolean;
  date_joined?: string;
  profile?: UserProfile;
  profile_data?: {
    role: string;
    is_active: boolean;
    zone: number | null;
  };
  groups: Group[] | number[];
  role?: string; // For backward compatibility
  zone?: number;
  permissions?: string[];
}

export interface UserFormData extends User {
  password?: string;
  group_ids?: number[];
  user?: {
    username: string;
    email: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    is_active: boolean;
  };
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  role: string;
  zone?: number;
  is_profile_active?: boolean;
  groups?: number[];
}

export interface Group {
  id?: number;
  name: string;
  permissions: number[]; // Array of permission IDs
  description?: string;
  is_active?: boolean;
}

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: number | {
    app_label: string;
  };
  content_type_name?: string;
  full_codename?: string;
}

export interface PermissionCategory {
  name: string;
  app: string;
  model: string;
  permissions: Permission[];
}