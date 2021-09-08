import puppeteer from "puppeteer";
import BotVisitor from "./visitor";
import * as config from "../config";
import { VisitResourceLimits } from "../types";
import { defaultResourceLimits } from "../security/resources";
import logger from "./logger";

type BrowserOptions = {
    browser: {
        executablePath: string;
    };
    resourceLimits: VisitResourceLimits;
};

export class BotBrowser {
    private browser?: puppeteer.Browser;

    private opts: BrowserOptions;

    constructor(opts: BrowserOptions) {
        this.opts = opts;
    }

    // TODO: make the project esnext compatible so we can make the browser at the root level
    async init() {
        this.browser = await puppeteer.launch({
            headless: true,
            executablePath: this.opts.browser.executablePath,
        });
        logger.info(`Initiated browser using ${this.opts.browser.executablePath}`);
    }

    getVisitor(resourceLimits?: VisitResourceLimits) {
        if (!this.browser) {
            throw new Error("browser not yet ready");
        }
        return new BotVisitor(this.browser, resourceLimits ?? this.opts.resourceLimits);
    }
}

export const browser = new BotBrowser({
    browser: {
        executablePath: config.BROWSER_EXECUTABLE,
    },
    resourceLimits: defaultResourceLimits,
});
