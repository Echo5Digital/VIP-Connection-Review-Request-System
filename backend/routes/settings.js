import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { getSettings, setSettings } from '../models/Settings.js';

const router = Router();
router.use(requireAuth, requireRoles('admin', 'client'));

router.get('/', async (req, res, next) => {
  try {
    const keys = ['ratingPage', 'reviewPlatforms', 'templates', 'branding', 'platformUrls'];
    const results = {};
    for (const key of keys) {
      results[key] = await getSettings(key);
    }
    // Backward compatibility merge
    results.reviewPlatforms = results.reviewPlatforms || results.platformUrls || {};
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.patch('/', requireRoles('admin'), async (req, res, next) => {
  try {
    const { ratingPage, reviewPlatforms, templates, branding } = req.body;
    if (ratingPage) await setSettings('ratingPage', ratingPage);
    if (reviewPlatforms) await setSettings('reviewPlatforms', reviewPlatforms);
    if (templates) await setSettings('templates', templates);
    if (branding) await setSettings('branding', branding);

    res.json({ message: 'Settings updated' });
  } catch (err) {
    next(err);
  }
});

// Keep existing platform endpoints for now just in case
router.get('/platforms', async (req, res, next) => {
  try {
    const platformUrls = await getSettings('reviewPlatforms') || await getSettings('platformUrls');
    res.json({ platformUrls: platformUrls || { google: '', yelp: '', tripAdvisor: '' } });
  } catch (err) {
    next(err);
  }
});

router.patch('/platforms', requireRoles('admin'), async (req, res, next) => {
  try {
    const { platformUrls } = req.body;
    if (platformUrls) await setSettings('reviewPlatforms', platformUrls);
    const updated = await getSettings('reviewPlatforms');
    res.json({ platformUrls: updated || {} });
  } catch (err) {
    next(err);
  }
});

export default router;
