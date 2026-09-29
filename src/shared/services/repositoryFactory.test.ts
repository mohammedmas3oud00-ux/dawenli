import { describe, expect, it } from 'vitest';
import { GuestLocalRepository, SupabaseRepository } from '../../data/repository';
import { createRepositoryForUser } from './repositoryFactory';

describe('repository factory', () => {
  it('keeps guest storage local and rejects an incomplete cloud user', () => {
    expect(createRepositoryForUser({ email: 'guest', isGuest: true }, null)).toBeInstanceOf(GuestLocalRepository);
    expect(createRepositoryForUser({ email: 'user@example.com' }, null)).toBeNull();
    expect(createRepositoryForUser({ id: 'user-1', email: 'user@example.com' }, null)).toBeNull();
  });

  it('builds a cloud repository for authenticated users with a client', () => {
    const client = {} as never;
    const repository = createRepositoryForUser({ id: 'user-2', email: 'user@example.com' }, client);
    expect(repository).toBeInstanceOf(SupabaseRepository);
  });
});
