import { createLogger } from '../util/logger.js';
const log = createLogger(import.meta.url);
export default async function config(configData) {
  log.info(JSON.stringify(configData, null, 2));
}
//# sourceMappingURL=dump-config.js.map