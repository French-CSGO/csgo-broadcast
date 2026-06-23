const express = require('express');
const fs = require('fs');
const path = require('path');
const log = require('../helpers/logger');
const { getMatchDetails } = require('../helpers/get5');

const router = express.Router();
const BIN_DIR = path.join(__dirname, '..', 'bin');
const timeOnlineMs = () => (parseInt(process.env.TIMEONLINE) || 5) * 60 * 1000;
const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

router.get('/matches', async (req, res) => {
  if (!fs.existsSync(BIN_DIR)) return res.json([]);

  const result = [];

  for (const slug of fs.readdirSync(BIN_DIR)) {
    const slugDir = path.join(BIN_DIR, slug);
    if (!fs.statSync(slugDir).isDirectory()) continue;

    for (const sessionToken of fs.readdirSync(slugDir)) {
      const sessionDir = path.join(slugDir, sessionToken);
      const stat = fs.statSync(sessionDir);
      if (!stat.isDirectory()) continue;

      const configFile = path.join(sessionDir, 'config.json');
      if (!fs.existsSync(configFile)) continue;

      const age = Date.now() - stat.mtimeMs;
      if (age > RETENTION_MS) continue;

      const config = JSON.parse(fs.readFileSync(configFile));
      const fragFile = path.join(sessionDir, 'fragments.json');
      const frags = fs.existsSync(fragFile) ? JSON.parse(fs.readFileSync(fragFile)) : [];
      const isLive = age <= timeOnlineMs();

      let details = { maps: [], vetos: [] };
      if (config.matchId) {
        try {
          details = await getMatchDetails(config.matchId);
        } catch (e) {
          log.warn('api', 'Impossible de charger les détails get5', { matchId: config.matchId, error: e.message });
        }
      }

      result.push({
        slug,
        sessionToken,
        matchId: config.matchId,
        team1: config.team1,
        team1Logo: config.team1Logo,
        team1SeriesScore: config.team1SeriesScore ?? 0,
        team2: config.team2,
        team2Logo: config.team2Logo,
        team2SeriesScore: config.team2SeriesScore ?? 0,
        maxMaps: config.maxMaps ?? 1,
        map: config.map,
        timestamp: config.timestamp,
        lastActivity: Math.floor(stat.mtimeMs / 1000),
        live: isLive,
        fragmentsBuffered: frags.length,
        maps: details.maps,
        vetos: details.vetos,
      });
    }
  }

  result.sort((a, b) => b.timestamp - a.timestamp);
  log.debug('api', '/matches appelé', { count: result.length, live: result.filter(m => m.live).length, ip: req.ip });
  res.json(result);
});

// DELETE /api/matches/:slug/:sessionToken — admin only
router.delete('/matches/:slug/:sessionToken', (req, res) => {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || req.headers['x-admin-key'] !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { slug, sessionToken } = req.params;
  // basic path traversal guard
  if (slug.includes('..') || sessionToken.includes('..')) {
    return res.status(400).json({ error: 'Invalid params' });
  }

  const sessionDir = path.join(BIN_DIR, slug, sessionToken);
  if (!fs.existsSync(sessionDir)) return res.status(404).json({ error: 'Not found' });

  fs.rmSync(sessionDir, { recursive: true, force: true });

  // remove slug dir if now empty
  const slugDir = path.join(BIN_DIR, slug);
  if (fs.existsSync(slugDir) && fs.readdirSync(slugDir).length === 0) {
    fs.rmdirSync(slugDir);
  }

  log.info('api', 'Replay supprimé', { slug, sessionToken, ip: req.ip });
  res.json({ ok: true });
});

module.exports = router;
