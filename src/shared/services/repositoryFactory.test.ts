import { describe, expect, it } from 'vitest';
import { GuestLocalRepository } from '../../data/repository';
import { createRepositoryForUser } from './repositoryFactory';

describe('repository factory', () => {
  it('keeps guest storage local and rejects an incomplete cloud user', () => {
    expect(createRepositoryForUser({ email: 'guest', isGuest: true }, null)).toBeInstanceOf(GuestLocalRepository);
    expect(createRepositoryForUser({ email: 'user@example.com' }, null)).toBeNull();
  });
});
