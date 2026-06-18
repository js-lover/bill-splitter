import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { DbUser } from '../types/database';

interface AuthStore {
  session: Session | null;
  user: DbUser | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: DbUser | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ session: null, user: null }),
}));
