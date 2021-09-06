import puppeteer from "puppeteer";
import BotVisitor from "./visitor";

export class BotBrowser {
    private browser?: puppeteer.Browser;

    async init() {
        this.browser = await puppeteer.launch({
            headless: true,
            executablePath: "/usr/bin/google-chrome-stable",
        });
    }

    getVisitor() {
        // TODO: make this esnext compatible so we can make the browser at the root level
        if (!this.browser) {
            throw new Error("browser not yet ready");
        }
        return new BotVisitor(this.browser);
    }
}

export const browser = new BotBrowser();
