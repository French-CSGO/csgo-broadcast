const express = require('express');
const fs = require('fs');
const path = require('path');
const log = require('../helpers/logger');

const router = express.Router();
const BIN_DIR = path.join(__dirname, '..', 'bin');
const fragDelay = () => parseInt(process.env.FRAG_DELAY) || 10;
const timeOnlineMs = () => (parseInt(process.env.TIMEONLINE) || 5) * 60 * 1000;

function smallestFullFragment(slug) {
  const dir = path.join(BIN_DIR, slug);
  let min = Infinity;
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^(\d+)_full$/);
    if (m) min = Math.min(min, parseInt(m[1]));
  }
  return min === Infinity ? 0 : min;
}

function toInt(v) {
  return typeof v === 'number' ? v : parseInt(v);
}

router.get('/:slug/sync', (req, res) => {
  const { slug } = req.params;
  const dir = path.join(BIN_DIR, slug);
  const configFile = path.join(dir, 'config.json');

  if (!fs.existsSync(dir) || !fs.existsSync(configFile)) {
    log.debug('viewer', 'Sync 404 — slot inexistant', { slug, ip: req.ip });
    return res.sendStatus(404);
  }

  const stat = fs.statSync(dir);
  const config = JSON.parse(fs.readFileSync(configFile));
  const fragFile = path.join(dir, 'fragments.json');
  const frags = fs.existsSync(fragFile) ? JSON.parse(fs.readFileSync(fragFile)) : [];
  const age = Date.now() - stat.mtimeMs;
  const isEnded = age > timeOnlineMs();

  if (isEnded) {
    const startFrag = smallestFullFragment(slug);
    log.debug('viewer', 'Sync replay', { slug, ip: req.ip, start_fragment: startFrag, age_min: Math.floor(age / 60000) });
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
      slug, ip: req.ip,
      buffered: frags.length,
      needed: fragDelay(),
    });
    return res.sendStatus(404);
  }

  const frame = frags[0];
  log.debug('viewer', 'Sync live', {
    slug, ip: req.ip,
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

router.get('/:slug/:fragmentNumber/:frameType', (req, res) => {
  const { slug, fragmentNumber, frameType } = req.params;
  const file = path.join(BIN_DIR, slug, `${fragmentNumber}_${frameType}`);

  if (!fs.existsSync(file)) {
    log.debug('viewer', 'Fragment 404', { slug, fragment: fragmentNumber, type: frameType, ip: req.ip });
    return res.sendStatus(404);
  }

  if (frameType === 'start') {
    const stat = fs.statSync(path.join(BIN_DIR, slug));
    const isReplay = (Date.now() - stat.mtimeMs) > timeOnlineMs();
    log.info('viewer', isReplay ? 'Lecture replay démarrée' : 'Lecture live démarrée', {
      slug, fragment: fragmentNumber, ip: req.ip,
    });
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

module.exports = router;
