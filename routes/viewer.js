const express = require('express');
const fs = require('fs');
const path = require('path');
const log = require('../helpers/logger');

const router = express.Router();
const BIN_DIR = path.join(__dirname, '..', 'bin');
const fragDelay = () => parseInt(process.env.FRAG_DELAY) || 10;
const timeOnlineMs = () => (parseInt(process.env.TIMEONLINE) || 5) * 60 * 1000;

function smallestFullFragment(sessionDir) {
  let min = Infinity;
  for (const f of fs.readdirSync(sessionDir)) {
    const m = f.match(/^(\d+)_full$/);
    if (m) min = Math.min(min, parseInt(m[1]));
  }
  return min === Infinity ? 0 : min;
}

function toInt(v) {
  return typeof v === 'number' ? v : parseInt(v);
}

function resolveSession(slug, sessionToken) {
  return path.join(BIN_DIR, slug, sessionToken);
}

// --- SYNC from-start (replay prefix) ---
router.get('/replay/:slug/:sessionToken/sync', (req, res) => {
  const { slug, sessionToken } = req.params;
  const sessionDir = resolveSession(slug, sessionToken);
  const configFile = path.join(sessionDir, 'config.json');

  if (!fs.existsSync(sessionDir) || !fs.existsSync(configFile)) {
    log.debug('viewer', 'Sync replay 404 — session inconnue', { slug, sessionToken, ip: req.ip });
    return res.sendStatus(404);
  }

  const config = JSON.parse(fs.readFileSync(configFile));
  const startFrag = smallestFullFragment(sessionDir);

  log.debug('viewer', 'Sync depuis le début', { slug, sessionToken, ip: req.ip, start_fragment: startFrag });
  return res.json({
    tick: 1, rtdelay: 1, rcvage: 1,
    fragment: startFrag,
    signup_fragment: 0,
    tps: toInt(config.tps),
    protocol: toInt(config.protocol),
  });
});

// --- Fragments via replay prefix ---
router.get('/replay/:slug/:sessionToken/:fragmentNumber/:frameType', (req, res) => {
  const { slug, sessionToken, fragmentNumber, frameType } = req.params;
  const file = path.join(BIN_DIR, slug, sessionToken, `${fragmentNumber}_${frameType}`);

  if (!fs.existsSync(file)) {
    log.debug('viewer', 'Fragment replay 404', { slug, sessionToken, fragment: fragmentNumber, type: frameType, ip: req.ip });
    return res.sendStatus(404);
  }

  if (frameType === 'start') {
    log.info('viewer', 'Lecture depuis le début démarrée', { slug, sessionToken, fragment: fragmentNumber, ip: req.ip });
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

// --- SYNC live ---
router.get('/:slug/:sessionToken/sync', (req, res) => {
  const { slug, sessionToken } = req.params;
  const sessionDir = resolveSession(slug, sessionToken);
  const configFile = path.join(sessionDir, 'config.json');

  if (!fs.existsSync(sessionDir) || !fs.existsSync(configFile)) {
    log.debug('viewer', 'Sync 404 — session inconnue', { slug, sessionToken, ip: req.ip });
    return res.sendStatus(404);
  }

  const stat = fs.statSync(sessionDir);
  const config = JSON.parse(fs.readFileSync(configFile));
  const fragFile = path.join(sessionDir, 'fragments.json');
  const frags = fs.existsSync(fragFile) ? JSON.parse(fs.readFileSync(fragFile)) : [];
  const age = Date.now() - stat.mtimeMs;
  const isEnded = age > timeOnlineMs();

  if (isEnded) {
    const startFrag = smallestFullFragment(sessionDir);
    log.debug('viewer', 'Sync replay', { slug, sessionToken, ip: req.ip, start_fragment: startFrag, age_min: Math.floor(age / 60000) });
    return res.json({
      tick: 1, rtdelay: 1, rcvage: 1,
      fragment: startFrag,
      signup_fragment: 0,
      tps: toInt(config.tps),
      protocol: toInt(config.protocol),
    });
  }

  if (frags.length < fragDelay()) {
    log.debug('viewer', 'Sync 404 — buffer insuffisant', {
      slug, sessionToken, ip: req.ip,
      buffered: frags.length,
      needed: fragDelay(),
    });
    return res.sendStatus(404);
  }

  const frame = frags[0];
  log.debug('viewer', 'Sync live', {
    slug, sessionToken, ip: req.ip,
    fragment: frame.fragmentNumber,
    tick: frame.tick,
    buffered: frags.length,
  });

  res.json({
    tick: toInt(frame.tick),
    rtdelay: 1, rcvage: 1,
    fragment: toInt(frame.fragmentNumber),
    signup_fragment: toInt(config.startFragment),
    tps: toInt(config.tps),
    protocol: toInt(config.protocol),
  });
});

// --- Fragments live ---
router.get('/:slug/:sessionToken/:fragmentNumber/:frameType', (req, res) => {
  const { slug, sessionToken, fragmentNumber, frameType } = req.params;
  const file = path.join(BIN_DIR, slug, sessionToken, `${fragmentNumber}_${frameType}`);

  if (!fs.existsSync(file)) {
    log.debug('viewer', 'Fragment 404', { slug, sessionToken, fragment: fragmentNumber, type: frameType, ip: req.ip });
    return res.sendStatus(404);
  }

  if (frameType === 'start') {
    const stat = fs.statSync(path.join(BIN_DIR, slug, sessionToken));
    const isReplay = (Date.now() - stat.mtimeMs) > timeOnlineMs();
    log.info('viewer', isReplay ? 'Lecture replay démarrée' : 'Lecture live démarrée', {
      slug, sessionToken, fragment: fragmentNumber, ip: req.ip,
    });
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

module.exports = router;
