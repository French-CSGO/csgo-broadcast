const db = require('../db');
const log = require('./logger');

const SERVER_PREFIX = process.env.SERVER_PREFIX || 'CS';

// "CS2-Tournament-1.1" → last segment "1.1" → "CS 1.1"
function slugToDisplayName(slug) {
  const parts = slug.split('-');
  const displayName = `${SERVER_PREFIX} ${parts[parts.length - 1]}`;
  log.debug('get5', 'Résolution slug → display_name', { slug, display_name: displayName });
  return displayName;
}

async function findMatchBySlug(slug) {
  const displayName = slugToDisplayName(slug);
  log.debug('get5', 'Requête match actif', { display_name: displayName });

  const [[row]] = await db.query(
    `SELECT m.id AS match_id,
            t1.name AS team1_name, t1.logo AS team1_logo,
            t2.name AS team2_name, t2.logo AS team2_logo,
            gs.display_name AS server_name
     FROM \`match\` m
     JOIN game_server gs ON gs.id = m.server_id
     LEFT JOIN team t1 ON t1.id = m.team1_id
     LEFT JOIN team t2 ON t2.id = m.team2_id
     WHERE gs.display_name = ?
       AND m.cancelled = 0
       AND m.end_time IS NULL
     ORDER BY m.id DESC
     LIMIT 1`,
    [displayName]
  );

  if (row) {
    log.debug('get5', 'Match trouvé en DB', {
      display_name: displayName,
      match_id: row.match_id,
      team1: row.team1_name,
      team2: row.team2_name,
    });
  } else {
    log.debug('get5', 'Aucun résultat en DB', { display_name: displayName });
  }

  return row || null;
}

module.exports = { slugToDisplayName, findMatchBySlug };
