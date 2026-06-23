const express = require("express");
const fs = require("fs");
const path = require("path");
const { findMatchBySlug } = require("../helpers/get5");

const router = express.Router();
const BIN_DIR = path.join(__dirname, "..", "bin");
const fragDelay = () => parseInt(process.env.FRAG_DELAY) || 10;

function authOk(req, res) {
  if (req.headers["x-origin-auth"] !== process.env.BROADCAST_AUTH) {
    res.sendStatus(403);
    return false;
  }
  return true;
}

router.post("/reset/:slug", (req, res) => {
  if (!authOk(req, res)) return;
  const dir = path.join(BIN_DIR, req.params.slug);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  res.sendStatus(200);
});

router.post("/:slug/:fragmentNumber/:frameType", async (req, res) => {
  if (!authOk(req, res)) return;
  const { slug, fragmentNumber, frameType } = req.params;
  const dir = path.join(BIN_DIR, slug);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (frameType === "start") {
    let team1 = "TBD", team2 = "TBD", matchId = null, team1Logo = null, team2Logo = null;
    try {
      const match = await findMatchBySlug(slug);
      if (match) {
        team1 = match.team1_name || "TBD";
        team2 = match.team2_name || "TBD";
        team1Logo = match.team1_logo || null;
        team2Logo = match.team2_logo || null;
        matchId = match.match_id;
      }
    } catch (e) {
      console.error(`[get5] lookup failed for ${slug}:`, e.message);
    }

    fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify({
      slug, matchId,
      team1, team1Logo,
      team2, team2Logo,
      map: req.query.map,
      tick: req.query.tick,
      tps: req.query.tps,
      protocol: req.query.protocol,
      startFragment: fragmentNumber,
      timestamp: Date.now(),
    }));

    console.log(`[ingest] started ${slug} → match #${matchId} | ${team1} vs ${team2} | map=${req.query.map}`);
  }

  const dest = path.join(dir, `${fragmentNumber}_${frameType}`);
  req.pipe(fs.createWriteStream(dest));

  if (frameType === "full") {
    const fragFile = path.join(dir, "fragments.json");
    const frags = fs.existsSync(fragFile) ? JSON.parse(fs.readFileSync(fragFile)) : [];
    frags.push({ fragmentNumber, tick: req.query.tick });
    if (frags.length > fragDelay()) frags.shift();
    fs.writeFileSync(fragFile, JSON.stringify(frags));
  }

  res.sendStatus(200);
});

module.exports = router;
