'use client';

import { Suspense } from 'react';
import NegativeFeedbackTable from '@/components/NegativeFeedbackTable';

export default function FeedbackPage() {
  return (
    <Suspense>
      <NegativeFeedbackTable title="Customer Reviews" />
    </Suspense>
  );
}
