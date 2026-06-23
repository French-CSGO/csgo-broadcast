const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const BIN_DIR = path.join(__dirname, "..", "bin");
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
  return typeof v === "number" ? v : parseInt(v);
}

router.get("/:slug/sync", (req, res) => {
  const dir = path.join(BIN_DIR, req.params.slug);
  const configFile = path.join(dir, "config.json");
  if (!fs.existsSync(dir) || !fs.existsSync(configFile)) return res.sendStatus(404);

  const stat = fs.statSync(dir);
  const config = JSON.parse(fs.readFileSync(configFile));
  const fragFile = path.join(dir, "fragments.json");
  const frags = fs.existsSync(fragFile) ? JSON.parse(fs.readFileSync(fragFile)) : [];

  const isEnded = (Date.now() - stat.mtimeMs) > timeOnlineMs();

  if (isEnded) {
    return res.json({
      tick: 1, rtdelay: 1, rcvage: 1,
      fragment: smallestFullFragment(req.params.slug),
      signup_fragment: 0,
      tps: toInt(config.tps),
      protocol: toInt(config.protocol),
    });
  }

  if (frags.length < fragDelay()) return res.sendStatus(404);

  const frame = frags[0];
  res.json({
    tick: toInt(frame.tick),
    rtdelay: 1, rcvage: 1,
    fragment: toInt(frame.fragmentNumber),
    signup_fragment: toInt(config.startFragment),
    tps: toInt(config.tps),
    protocol: toInt(config.protocol),
  });
});

router.get("/:slug/:fragmentNumber/:frameType", (req, res) => {
  const { slug, fragmentNumber, frameType } = req.params;
  const file = path.join(BIN_DIR, slug, `${fragmentNumber}_${frameType}`);
  if (!fs.existsSync(file)) return res.sendStatus(404);
  res.setHeader("Content-Type", "application/octet-stream");
  fs.createReadStream(file).pipe(res);
});

module.exports = router;
