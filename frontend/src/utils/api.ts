import axios from 'axios';
import { LoginCredentials, AuthResponse } from '../auth/types/auth.types';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Auth API functions
export const loginAPI = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    // Mock response untuk development
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === 'admin@test.com' && credentials.password === 'password123') {
      return {
        user: {
          id: '1',
          email: credentials.email,
          name: 'Admin User',
          role: 'admin'
        },
        token: 'mock-jwt-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now()
      };
    } else if (credentials.email === 'user@test.com' && credentials.password === 'password123') {
      return {
        user: {
          id: '2',
          email: credentials.email,
          name: 'Regular User',
          role: 'user'
        },
        token: 'mock-jwt-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now()
      };
    } else {
      throw new Error('Email atau password salah');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Login gagal');
    }
    throw error;
  }
};

export default apiClient;