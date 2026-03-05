import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { getSettings, setSettings } from '../models/Settings.js';

const router = Router();
router.use(requireAuth, requireRoles('admin', 'manager'));

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

router.patch('/', requireRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const { ratingPage, reviewPlatforms, templates, branding } = req.body;
    const isAdmin = req.user.role === 'admin';
    // Managers may only update templates; admin-level keys are restricted to admin
    if (isAdmin) {
      if (ratingPage) await setSettings('ratingPage', ratingPage);
      if (reviewPlatforms) await setSettings('reviewPlatforms', reviewPlatforms);
      if (branding) await setSettings('branding', branding);
    }
    if (templates) await setSettings('templates', templates);

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
