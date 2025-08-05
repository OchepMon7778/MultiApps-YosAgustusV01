// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
}

// Auth response from API
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Auth state interface
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth context type
export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}