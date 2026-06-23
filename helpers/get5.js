const db = require('../db');
const log = require('./logger');

const SERVER_PREFIX = process.env.SERVER_PREFIX || 'CS';

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
            m.team1_series_score, m.team2_series_score, m.max_maps,
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
    log.debug('get5', 'Match trouvé en DB', { display_name: displayName, match_id: row.match_id, team1: row.team1_name, team2: row.team2_name });
  } else {
    log.debug('get5', 'Aucun résultat en DB', { display_name: displayName });
  }

  return row || null;
}

async function getMatchDetails(matchId) {
  const [maps] = await db.query(
    `SELECT map_number, map_name, team1_score, team2_score, end_time
     FROM map_stats
     WHERE match_id = ?
     ORDER BY map_number ASC`,
    [matchId]
  );

  const [vetos] = await db.query(
    `SELECT team_name, map, pick_or_veto
     FROM veto
     WHERE match_id = ?
     ORDER BY id ASC`,
    [matchId]
  );

  return { maps, vetos };
}

module.exports = { slugToDisplayName, findMatchBySlug, getMatchDetails };
