import puppeteer from "puppeteer";
import bunyan from "bunyan";
import { VisitResourceLimits } from "../types";
import * as config from "../config";
import checkRequest from "../security/browser";

type PageVisitor = (page: puppeteer.Page) => Promise<void>;
const logger = bunyan.createLogger({ name: "Visitor" });

async function safeClosePage(page: puppeteer.Page) {
    try {
        await page.close();
    } catch (e) {
        if (!page.isClosed) {
            throw e;
        }
    }
}

async function browserRequestValidator(request: puppeteer.HTTPRequest) {
    logger.info(`Intercepted ${request.method()} ${request.url()}`);
    if (!(await checkRequest(request))) {
        logger.info(`Rejecting ${request.method()} ${request.url()}`);
        await request.abort();
    } else {
        await request.continue();
    }
}

export default class BotVisitor {
    private browser: puppeteer.Browser;

    private resourceLimits: VisitResourceLimits;

    constructor(browser: puppeteer.Browser, resourceLimits: VisitResourceLimits) {
        this.browser = browser;
        this.resourceLimits = resourceLimits;
    }

    private async usingPageContext(visitor: PageVisitor) {
        const context = await this.browser.createIncognitoBrowserContext();
        try {
            const page = await context.newPage();
            try {
                await visitor(page);
            } catch (e) {
                logger.error(`Request failed with ${e}`);
            } finally {
                await safeClosePage(page);
            }
        } finally {
            await context.close();
        }
    }

    private async safeVisit(visiter: PageVisitor) {
        await this.usingPageContext(async (page) => {
            await page.setCacheEnabled(false);
            await page.setRequestInterception(true);
            await page.setExtraHTTPHeaders({ "X-Powered-By": config.SERVICE_NAME });

            page.on("request", browserRequestValidator);
            setTimeout(async () => safeClosePage(page), this.resourceLimits.timeouts.total);

            await visiter(page);
        });
    }

    public async visit(url: string) {
        this.safeVisit(async (page) => {
            await page.goto(url, {
                waitUntil: "networkidle0",
                timeout: this.resourceLimits.timeouts.networkIdle,
            });
        });
    }
}