import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthModal } from './AuthModal';

const { mockedAuthService, isConfigured } = vi.hoisted(() => ({
  mockedAuthService: { signUp: vi.fn(), signInWithPassword: vi.fn(), signInWithGoogle: vi.fn() },
  isConfigured: { isSupabaseConfigured: true },
}));

vi.mock('../../features/auth/services/authService', () => ({
  authService: mockedAuthService,
  isSupabaseConfigured: isConfigured.isSupabaseConfigured,
}));

describe('AuthModal', () => {
  it('offers an explicit guest session without developer or fake-success entry points', () => {
    const onAuthSuccess = vi.fn();
    render(<AuthModal isOpen onClose={() => undefined} onAuthSuccess={onAuthSuccess} canDismiss={false} />);
    expect(screen.queryByText(/دخول سريع بحساب المطور/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/المتابعة كضيف محلي/));
    expect(onAuthSuccess).toHaveBeenCalledWith({ email: 'ضيف محلي', isGuest: true });
  });

  it('shows a clear Arabic message when the network request fails', async () => {
    mockedAuthService.signUp.mockRejectedValueOnce(new Error('Failed to fetch'));
    render(<AuthModal isOpen onClose={() => undefined} onAuthSuccess={() => undefined} canDismiss={false} />);
    fireEvent.click(screen.getAllByRole('button', { name: /إنشاء حساب/ })[0]);
    fireEvent.change(screen.getAllByRole('textbox', { name: 'الاسم الكامل' })[0], { target: { value: 'مستخدم اختبار' } });
    fireEvent.change(screen.getAllByRole('textbox', { name: 'البريد الإلكتروني' })[0], { target: { value: 'user@gmail.com' } });
    fireEvent.change(screen.getAllByLabelText('كلمة المرور')[0], { target: { value: 'StrongPass2026!' } });
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /إنشاء الحساب/ })[0]);
    });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('تعذر الاتصال بالخادم'));
  });

  it('shows a clear Arabic message for already registered emails', async () => {
    mockedAuthService.signUp.mockRejectedValueOnce(new Error('User already registered'));
    render(<AuthModal isOpen onClose={() => undefined} onAuthSuccess={() => undefined} canDismiss={false} />);
    fireEvent.click(screen.getAllByRole('button', { name: /إنشاء حساب/ })[0]);
    fireEvent.change(screen.getAllByRole('textbox', { name: 'الاسم الكامل' })[0], { target: { value: 'مستخدم اختبار' } });
    fireEvent.change(screen.getAllByRole('textbox', { name: 'البريد الإلكتروني' })[0], { target: { value: 'user@gmail.com' } });
    fireEvent.change(screen.getAllByLabelText('كلمة المرور')[0], { target: { value: 'StrongPass2026!' } });
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /إنشاء الحساب/ })[0]);
    });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('مسجّل بالفعل'));
  });
});
