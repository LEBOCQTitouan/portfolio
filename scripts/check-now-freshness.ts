import { appendFileSync } from "node:fs";
import {
  isStale,
  daysSinceUpdate,
  getNowUpdated,
  STALE_AFTER_DAYS,
} from "@/core/domain/now";

const days = daysSinceUpdate();
const stale = isStale();

const lines =
  [
    `stale=${stale}`,
    `days=${days}`,
    `updated=${getNowUpdated()}`,
    `threshold=${STALE_AFTER_DAYS}`,
  ].join("\n") + "\n";

if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, lines);
console.log(lines.trimEnd());
