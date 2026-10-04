import { LoginFormData, RegisterFormData } from './schemas';

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  error?: string;
}

export const authService = {
  async login(data: LoginFormData): Promise<AuthResponse> {
    // Simulated network latency
    await new Promise((resolve) => setTimeout(resolve, 1400));
    
    // Mock successful authentication
    return {
      success: true,
      user: {
        id: 'usr_park_01',
        email: data.email,
        name: data.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || 'Park Explorer',
      },
    };
  },

  async register(data: RegisterFormData): Promise<AuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1600));

    return {
      success: true,
      user: {
        id: 'usr_park_' + Math.floor(Math.random() * 10000),
        email: data.email,
        name: data.fullName,
      },
    };
  },
};
