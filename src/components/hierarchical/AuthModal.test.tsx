import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthModal } from './AuthModal';

describe('AuthModal', () => {
  it('offers an explicit guest session without developer or fake-success entry points', () => {
    const onAuthSuccess = vi.fn();
    render(<AuthModal isOpen onClose={() => undefined} onAuthSuccess={onAuthSuccess} canDismiss={false} />);
    expect(screen.queryByText(/دخول سريع بحساب المطور/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/المتابعة كضيف محلي/));
    expect(onAuthSuccess).toHaveBeenCalledWith({ email: 'ضيف محلي', isGuest: true });
  });
});
