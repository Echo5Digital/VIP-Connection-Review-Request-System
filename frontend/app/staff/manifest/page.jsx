'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ManifestEntriesView from '@/components/ManifestEntriesView';
import { useStaffContext } from '../StaffContext';

export default function ManifestEntriesPage() {
  const router = useRouter();
  const { user, loading } = useStaffContext();

  useEffect(() => {
    if (!loading && user?.role === 'manager') {
      router.replace('/staff/dashboard');
    }
  }, [user, loading]);

  if (loading || user?.role === 'manager') return null;

  return <ManifestEntriesView role="staff" />;
}
