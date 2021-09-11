import puppeteer from "puppeteer";
import { VisitResourceLimits } from "../types";
import * as config from "../config";
import checkRequest from "../security/browser";
import applyAuth from "./auth";
import logger from "./logger";

type PageVisitor = (page: puppeteer.Page) => Promise<void>;

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
    const [status, errMsg] = await checkRequest(request);
    if (!status) {
        logger.info(
            {
                reason: errMsg,
            },
            `Rejecting ${request.method()} ${request.url()}`
        );
        return;
    }

    await request.continue();
}

function pageConsoleLogger(msg: puppeteer.ConsoleMessage) {
    logger.info({
        type: msg.type(),
        trace: msg.stackTrace().join("\n"),
        console: msg.text()
    }, 'console');
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

            page.on("request", browserRequestValidator);
            if(process.env.NODE_ENVIRONMENT === "development") {
                page.on("console", pageConsoleLogger);
            }
            setTimeout(async () => safeClosePage(page), this.resourceLimits.timeouts.total);

            await visiter(page);
        });
    }

    public async visit(url: string) {
        this.safeVisit(async (page) => {
            await applyAuth(page);
            await page.goto(url, {
                waitUntil: "networkidle0",
                timeout: this.resourceLimits.timeouts.networkIdle,
            });
        });
    }
}
