import { apiClient } from './client';

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  bankroll?: number;
  risk_appetite?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      username: string;
      bankroll: number;
      risk_appetite: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
};
