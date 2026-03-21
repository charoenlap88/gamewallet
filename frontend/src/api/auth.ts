import { apiClient, extractData } from './client';
import type { User } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}
export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  fullName?: string;
  phone?: string;
  referralCode?: string;
}
export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequires2fa {
  requiresTwoFactor: true;
  twoFactorMethod: 'TOTP' | 'EMAIL';
  pendingToken: string;
}

export type LoginResult = AuthResponse | LoginRequires2fa;

export function isLoginRequires2fa(x: unknown): x is LoginRequires2fa {
  return (
    typeof x === 'object' &&
    x !== null &&
    (x as LoginRequires2fa).requiresTwoFactor === true &&
    typeof (x as LoginRequires2fa).pendingToken === 'string'
  );
}

export interface GoogleAuthPayload {
  idToken: string;
  referralCode?: string;
}

export const authApi = {
  login: async (data: LoginPayload): Promise<LoginResult> => {
    const res = await apiClient.post('/auth/login', data);
    return extractData<LoginResult>(res);
  },

  complete2fa: (data: { pendingToken: string; code: string }): Promise<AuthResponse> =>
    apiClient.post('/auth/2fa/complete', data).then((res) => extractData<AuthResponse>(res)),

  resendEmail2fa: (pendingToken: string) =>
    apiClient.post('/auth/2fa/email/resend', { pendingToken }).then((res) => extractData(res)),

  register: (data: RegisterPayload): Promise<AuthResponse> =>
    apiClient.post('/auth/register', data).then((res) => extractData<AuthResponse>(res)),

  googleAuth: async (data: GoogleAuthPayload): Promise<LoginResult> => {
    const res = await apiClient.post('/auth/google', data);
    return extractData<LoginResult>(res);
  },

  /** โหลดโปรไฟล์ล่าสุดจากเซิร์ฟเวอร์ (รวม twoFactorMethod) */
  getProfile: (): Promise<User> =>
    apiClient.get('/auth/profile').then((res) => extractData<User>(res)),

  totpSetup: (): Promise<{ secret: string; otpauthUrl: string }> =>
    apiClient.post('/auth/2fa/totp/setup').then((res) => extractData(res)),

  totpEnable: (code: string) =>
    apiClient.post('/auth/2fa/totp/enable', { code }).then((res) => extractData(res)),

  emailRequestEnable: (password: string) =>
    apiClient.post('/auth/2fa/email/request-enable', { password }).then((res) => extractData(res)),

  emailConfirmEnable: (code: string) =>
    apiClient.post('/auth/2fa/email/confirm-enable', { code }).then((res) => extractData(res)),

  sendDisable2faEmail: () =>
    apiClient.post('/auth/2fa/email/send-disable').then((res) => extractData(res)),

  disable2fa: (password: string, code: string) =>
    apiClient.post('/auth/2fa/disable', { password, code }).then((res) => extractData(res)),
};
