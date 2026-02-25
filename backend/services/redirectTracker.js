import RedirectEvent from '../models/RedirectEvent.js';

export async function recordRedirectHit(redirectId, reviewRequestId, req) {
  await RedirectEvent.create({
    redirectId,
    reviewRequestId: reviewRequestId || null,
    ip: req.ip || req.connection?.remoteAddress || '',
    userAgent: req.get('user-agent') || '',
  });
}
