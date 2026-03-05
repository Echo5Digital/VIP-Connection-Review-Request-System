'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const StaffContext = createContext({ user: null, loading: true });

export function StaffProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/auth/me')
      .then((data) => setUser(data?.user ?? data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return <StaffContext.Provider value={{ user, loading }}>{children}</StaffContext.Provider>;
}

export function useStaffContext() {
  return useContext(StaffContext);
}
