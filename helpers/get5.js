const db = require("../db");

const SERVER_PREFIX = process.env.SERVER_PREFIX || "CS";

// "CS2-Tournament-1.1" → last segment "1.1" → "CS 1.1"
function slugToDisplayName(slug) {
  const parts = slug.split("-");
  return `${SERVER_PREFIX} ${parts[parts.length - 1]}`;
}

async function findMatchBySlug(slug) {
  const displayName = slugToDisplayName(slug);
  const [[row]] = await db.query(
    `SELECT m.id AS match_id,
            t1.name AS team1_name, t1.logo AS team1_logo,
            t2.name AS team2_name, t2.logo AS team2_logo,
            s.display_name AS server_name
     FROM \`match\` m
     JOIN server s ON s.id = m.server_id
     LEFT JOIN team t1 ON t1.id = m.team1_id
     LEFT JOIN team t2 ON t2.id = m.team2_id
     WHERE s.display_name = ?
       AND m.cancelled = 0
       AND m.end_time IS NULL
     ORDER BY m.id DESC
     LIMIT 1`,
    [displayName]
  );
  return row || null;
}

module.exports = { slugToDisplayName, findMatchBySlug };
