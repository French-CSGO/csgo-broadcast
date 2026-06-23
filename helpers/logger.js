const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function fmt(level, tag, msg, extra) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] [${tag}] ${msg}`;
  if (extra && Object.keys(extra).length) {
    const kv = Object.entries(extra).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' ');
    return `${base} | ${kv}`;
  }
  return base;
}

const log = {
  debug: (tag, msg, extra) => LEVELS.debug >= MIN && console.debug(fmt('debug', tag, msg, extra)),
  info:  (tag, msg, extra) => LEVELS.info  >= MIN && console.log(fmt('info',  tag, msg, extra)),
  warn:  (tag, msg, extra) => LEVELS.warn  >= MIN && console.warn(fmt('warn',  tag, msg, extra)),
  error: (tag, msg, extra) => LEVELS.error >= MIN && console.error(fmt('error', tag, msg, extra)),
};

module.exports = log;
