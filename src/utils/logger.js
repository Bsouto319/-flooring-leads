const levels = { INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' };

function log(level, service, message, extra) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level}] [${service}] ${message}`;
  if (extra) {
    console.log(line, typeof extra === 'object' ? JSON.stringify(extra) : extra);
  } else {
    console.log(line);
  }
}

module.exports = {
  info:  (service, msg, extra) => log(levels.INFO,  service, msg, extra),
  warn:  (service, msg, extra) => log(levels.WARN,  service, msg, extra),
  error: (service, msg, extra) => log(levels.ERROR, service, msg, extra),
};
