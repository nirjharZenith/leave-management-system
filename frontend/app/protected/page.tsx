'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/protected/dashboard');
  }, [router]);

  return null;
}
