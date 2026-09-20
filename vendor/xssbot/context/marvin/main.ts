import app from "./api";
import { browser } from "./browser/browser";
import { startInternalProxy } from "./browser/proxy";
import { PORT, PROXY_HOST, PROXY_PORT } from "./config";

(async () => {
    await startInternalProxy(PROXY_PORT, PROXY_HOST);
    await browser.init();
    app.listen(PORT);
})();
