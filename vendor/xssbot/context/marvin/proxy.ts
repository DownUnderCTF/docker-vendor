import { startInternalProxy } from "./browser/proxy";
import { PROXY_HOST, PROXY_PORT } from "./config";
import logger from "./browser/logger";

(async () => {
    await startInternalProxy(PROXY_PORT, PROXY_HOST);
    logger.info(`Marvin proxy standalone process listening on http://${PROXY_HOST}:${PROXY_PORT}`);
})();
