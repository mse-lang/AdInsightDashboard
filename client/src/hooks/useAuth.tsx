import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User' | 'ReadOnly';
  status: 'Active' | 'Inactive';
}

interface AuthResponse {
  user: User | null;
  devMode?: boolean;
}

export function useAuth() {
  const { data, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/user'],
    retry: false,
    retryOnMount: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Logout failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      window.location.href = '/login';
    },
  });

  // Parse consistent response shape
  const user = data?.user || null;
  const isDevMode = data?.devMode === true;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isDevMode,
    logout: () => logoutMutation.mutate(),
    isAdmin: user?.role === 'Admin',
    canEdit: user?.role === 'Admin' || user?.role === 'User',
  };
}
