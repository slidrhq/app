-- The count of Slidr's installations and of their starts (worker.ts, ADR-142).
-- Applied with `pnpm run migrate` (README.md); every statement may run again.

-- One row per installation: the random id the app made on its first start, the days it was first
-- and last seen, and what its last start said.
CREATE TABLE IF NOT EXISTS installs (
  id TEXT PRIMARY KEY,
  first_day TEXT NOT NULL,
  last_day TEXT NOT NULL,
  version TEXT NOT NULL,
  os TEXT NOT NULL,
  language TEXT NOT NULL,
  country TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS installs_by_first_day ON installs (first_day);
CREATE INDEX IF NOT EXISTS installs_by_last_day ON installs (last_day);

-- One row per installation per day it started (UTC), with how many times; kept for 400 days.
CREATE TABLE IF NOT EXISTS days (
  day TEXT NOT NULL,
  id TEXT NOT NULL,
  version TEXT NOT NULL,
  opens INTEGER NOT NULL,
  PRIMARY KEY (day, id)
);
