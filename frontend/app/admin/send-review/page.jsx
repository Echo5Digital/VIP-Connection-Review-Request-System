import { serverApi } from '@/lib/server-api';
import { SendReviewForm } from './SendReviewForm';

export default async function SendReviewPage({ searchParams }) {
  const { manifestId: prefilled } = await searchParams;
  let manifests = [];
  try {
    manifests = await serverApi.get('/api/manifests');
  } catch {
    // ignore
  }

  return (
    <div>
      <h1 className="page-title">Send Review Requests</h1>
      <div className="card">
        <div className="card__body">
          <SendReviewForm manifests={manifests} prefilledManifestId={prefilled || ''} />
        </div>
      </div>
    </div>
  );
}
