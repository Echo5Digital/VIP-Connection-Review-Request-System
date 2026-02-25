import { config } from '../config/index.js';
import { recordRedirectHit } from '../services/redirectTracker.js';
import ReviewRequest from '../models/ReviewRequest.js';

export default async function goRedirectRoute(req, res, next) {
  try {
    const { redirectId } = req.params;
    const token = req.query.t;
    let reviewRequestId = null;
    if (token) {
      const rr = await ReviewRequest.findOne({ token }).select('_id');
          if (rr) reviewRequestId = rr._id;
    }
    await recordRedirectHit(redirectId, reviewRequestId, req);
    const baseUrl = config.nextAppUrl.replace(/\/$/, '');
    const target = token ? `${baseUrl}/r/${token}` : baseUrl;
    res.redirect(302, target);
  } catch (err) {
    next(err);
  }
}
