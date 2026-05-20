import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  useEffect(() => { fetchMe(); }, []);
  return <>{children}</>;
};

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        {children}
        <Toaster position="bottom-center" toastOptions={{ style: { background: '#151515', color: '#fff', borderRadius: '12px' } }} />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);