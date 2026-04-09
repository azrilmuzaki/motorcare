import { supabase } from '@data/supabase/client';
import { LoginCredentials, RegisterCredentials, User } from '@domain/types/auth.types';

export const AuthService = {
  /**
   * Login dengan email & password
   */
  async login({ email, password }: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Register akun baru
   */
  async register({ email, password, name }: RegisterCredentials) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Logout & clear session
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  /**
   * Ambil session aktif
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return data.session;
  },

  /**
   * Ambil profil user dari tabel public.users
   */
  async getUserProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      createdAt: data.created_at,
    };
  },

  /**
   * Subscribe ke perubahan auth state
   */
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};