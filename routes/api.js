const express = require('express');
const fs = require('fs');
const path = require('path');
const log = require('../helpers/logger');

const router = express.Router();
const BIN_DIR = path.join(__dirname, '..', 'bin');
const timeOnlineMs = () => (parseInt(process.env.TIMEONLINE) || 5) * 60 * 1000;
const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

router.get('/matches', (req, res) => {
  if (!fs.existsSync(BIN_DIR)) return res.json([]);

  const result = [];
  for (const slug of fs.readdirSync(BIN_DIR)) {
    const dir = path.join(BIN_DIR, slug);
    const stat = fs.statSync(dir);
    if (!stat.isDirectory()) continue;

    const configFile = path.join(dir, 'config.json');
    if (!fs.existsSync(configFile)) continue;

    const age = Date.now() - stat.mtimeMs;
    if (age > RETENTION_MS) continue;

    const config = JSON.parse(fs.readFileSync(configFile));
    const fragFile = path.join(dir, 'fragments.json');
    const frags = fs.existsSync(fragFile) ? JSON.parse(fs.readFileSync(fragFile)) : [];
    const isLive = age <= timeOnlineMs();

    result.push({
      slug,
      matchId: config.matchId,
      team1: config.team1,
      team1Logo: config.team1Logo,
      team2: config.team2,
      team2Logo: config.team2Logo,
      map: config.map,
      timestamp: config.timestamp,
      lastActivity: Math.floor(stat.mtimeMs / 1000),
      live: isLive,
      fragmentsBuffered: frags.length,
    });
  }

  result.sort((a, b) => b.timestamp - a.timestamp);
  log.debug('api', '/matches appelé', { count: result.length, live: result.filter(m => m.live).length, ip: req.ip });
  res.json(result);
});

module.exports = router;
