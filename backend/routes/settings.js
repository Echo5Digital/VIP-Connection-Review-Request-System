import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { getSettings, setSettings } from '../models/Settings.js';

const router = Router();
router.use(requireAuth, requireRoles('admin'));

router.get('/', async (req, res, next) => {
  try {
    const ratingPage = await getSettings('ratingPage');
    res.json({ ratingPage: ratingPage || {} });
  } catch (err) {
    next(err);
  }
});

router.patch('/', async (req, res, next) => {
  try {
    const { ratingPage } = req.body;
    if (ratingPage) await setSettings('ratingPage', ratingPage);
    const updated = await getSettings('ratingPage');
    res.json({ ratingPage: updated || {} });
  } catch (err) {
    next(err);
  }
});

export default router;
