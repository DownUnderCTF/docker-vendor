import app from "./api";
import { browser } from "./browser/browser";
import { PORT } from "./config";

(async () => {
    await browser.init();
    app.listen(PORT);
})();
