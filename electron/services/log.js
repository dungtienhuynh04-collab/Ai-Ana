const MAX_LOGS = 500;

const logs = [];

function timestamp() {
  return new Date().toISOString().slice(11, 19);
}

export const logService = {
  add(level, message, detail = "") {
    const entry = {
      time: timestamp(),
      level,
      message,
      detail: detail ? String(detail) : "",
    };
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
    return entry;
  },

  info(msg, detail) {
    return this.add("info", msg, detail);
  },

  warn(msg, detail) {
    return this.add("warn", msg, detail);
  },

  error(msg, detail) {
    return this.add("error", msg, detail);
  },

  getAll() {
    return [...logs];
  },

  clear() {
    logs.length = 0;
  },
};
