const express = require('express');
const fs = require('fs');
const path = require('path');
const { findMatchBySlug } = require('../helpers/get5');
const log = require('../helpers/logger');

const router = express.Router();
const BIN_DIR = path.join(__dirname, '..', 'bin');
const fragDelay = () => parseInt(process.env.FRAG_DELAY) || 10;

function authOk(req, res) {
  const provided = req.headers['x-origin-auth'];
  if (provided !== process.env.BROADCAST_AUTH) {
    log.warn('ingest', 'Auth refusée', {
      ip: req.ip,
      path: req.path,
      auth_provided: provided ? `${provided.slice(0, 4)}…` : '(vide)',
    });
    res.sendStatus(403);
    return false;
  }
  return true;
}

router.post('/reset/:slug', (req, res) => {
  if (!authOk(req, res)) return;
  const { slug } = req.params;
  const dir = path.join(BIN_DIR, slug);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    log.info('ingest', 'Broadcast réinitialisé', { slug });
  } else {
    log.warn('ingest', 'Reset demandé sur slot inexistant', { slug });
  }
  res.sendStatus(200);
});

// CS2 envoie : POST /:slug/:sessionToken/:fragmentNumber/:frameType
router.post('/:slug/:sessionToken/:fragmentNumber/:frameType', async (req, res) => {
  if (!authOk(req, res)) return;
  const { slug, sessionToken, fragmentNumber, frameType } = req.params;

  // Stockage : bin/{slug}/{sessionToken}/
  const dir = path.join(BIN_DIR, slug, sessionToken);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log.debug('ingest', 'Nouvelle session créée', { slug, sessionToken });
  }

  if (frameType === 'start') {
    log.info('ingest', 'Fragment START reçu — lookup get5…', {
      slug, sessionToken,
      fragment: fragmentNumber,
      map: req.query.map,
      tps: req.query.tps,
      protocol: req.query.protocol,
      tick: req.query.tick,
    });

    let team1 = 'TBD', team2 = 'TBD', matchId = null, team1Logo = null, team2Logo = null;
    try {
      const match = await findMatchBySlug(slug);
      if (match) {
        team1 = match.team1_name || 'TBD';
        team2 = match.team2_name || 'TBD';
        team1Logo = match.team1_logo || null;
        team2Logo = match.team2_logo || null;
        matchId = match.match_id;
        log.info('ingest', 'Match get5 trouvé', {
          slug, match_id: matchId,
          server_name: match.server_name,
          team1, team2,
        });
      } else {
        log.warn('ingest', 'Aucun match actif dans get5 pour ce serveur', { slug });
      }
    } catch (e) {
      log.error('ingest', 'Erreur lookup get5', { slug, error: e.message });
    }

    fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify({
      slug, sessionToken, matchId,
      team1, team1Logo,
      team2, team2Logo,
      map: req.query.map,
      tick: req.query.tick,
      tps: req.query.tps,
      protocol: req.query.protocol,
      startFragment: fragmentNumber,
      timestamp: Date.now(),
    }));
  }

  const dest = path.join(dir, `${fragmentNumber}_${frameType}`);
  req.pipe(fs.createWriteStream(dest));

  if (frameType === 'full') {
    const fragFile = path.join(dir, 'fragments.json');
    const frags = fs.existsSync(fragFile) ? JSON.parse(fs.readFileSync(fragFile)) : [];
    frags.push({ fragmentNumber, tick: req.query.tick });
    const dropped = frags.length > fragDelay() ? frags.shift() : null;
    fs.writeFileSync(fragFile, JSON.stringify(frags));
    log.debug('ingest', 'Fragment FULL enregistré', {
      slug, sessionToken,
      fragment: fragmentNumber,
      tick: req.query.tick,
      buffered: frags.length,
      delay: fragDelay(),
      dropped_fragment: dropped ? dropped.fragmentNumber : null,
    });
  } else if (frameType !== 'start') {
    log.debug('ingest', `Fragment ${frameType} enregistré`, { slug, sessionToken, fragment: fragmentNumber });
  }

  res.sendStatus(200);
});

module.exports = router;
