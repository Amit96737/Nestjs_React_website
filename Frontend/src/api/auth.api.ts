import { http } from './http';

export interface SignUpPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const signUp = async (payload: SignUpPayload) => {
  const response = await http.post('/users/sign-up', payload);
  return response.data;
};

export const verifyOtp = async (payload: VerifyOtpPayload) => {
  const response = await http.post('/users/verify-otp', payload);
  return response.data;
};

export const signIn = async (payload: LoginPayload) => {
  const response = await http.post('/users/sign-in', payload);
  const result = response.data;

  if (!result.token) {
    throw new Error(result.message || 'Login failed');
  }

  sessionStorage.setItem('accessToken', result.token);
  return result;
};

export const signOut = () => {
  sessionStorage.removeItem('accessToken');
};