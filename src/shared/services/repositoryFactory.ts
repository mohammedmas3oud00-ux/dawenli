import type { SupabaseClient } from '@supabase/supabase-js';
import { GuestLocalRepository, SupabaseRepository, type DataRepository } from '../../data/repository';

export interface RepositoryUser {
  id?: string;
  email: string;
  isGuest?: boolean;
}

export function createRepositoryForUser(user: RepositoryUser, client: SupabaseClient | null): DataRepository | null {
  if (user.isGuest) return new GuestLocalRepository();
  return user.id && client ? new SupabaseRepository(client, user.id) : null;
}
