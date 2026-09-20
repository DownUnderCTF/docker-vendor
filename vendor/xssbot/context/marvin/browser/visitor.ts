import puppeteer from "puppeteer";
import { VisitResourceLimits, ProxyConfig } from "../types";
import * as config from "../config";
import { checkBrowserRequest, precheckBrowserNavigation } from "../security/browser";
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
    const [status, errMsg] = await checkBrowserRequest(request);
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
        trace: msg.stackTrace().map(trace => `${trace.url || "unknown"} (${trace.lineNumber}:${trace.columnNumber})`).join("\n"),
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

    private async usingPageContext(visitor: PageVisitor, proxyConfig?: ProxyConfig) {
        const context = await this.browser.createIncognitoBrowserContext({
            proxyServer: `http://${config.PROXY_HOST}:${config.PROXY_PORT}`,
        });
        try {
            const page = await context.newPage();
            const effectiveProxyConfig: ProxyConfig = {
                hosts: proxyConfig?.hosts ?? {},
                allowInternet: proxyConfig?.allowInternet ?? true,
            };
            const token = Buffer.from(JSON.stringify(effectiveProxyConfig)).toString("base64");
            await page.authenticate({ username: "bot", password: token });
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

    private async safeVisit(visiter: PageVisitor, proxyConfig?: ProxyConfig) {
        await this.usingPageContext(async (page) => {
            await page.setCacheEnabled(false);
            if (!proxyConfig) {
                await page.setRequestInterception(true);
                page.on("request", browserRequestValidator);
            }
            if (config.IS_LOCAL_DEV) {
                page.on("console", pageConsoleLogger);
            }
            setTimeout(async () => safeClosePage(page), this.resourceLimits.timeouts.total);

            await visiter(page);
        }, proxyConfig);
    }

    public async visit(url: string, proxyConfig?: ProxyConfig) {
        logger.info({ url, proxy: proxyConfig }, "received navigation intent");

        const [shouldNavigate, message] = await precheckBrowserNavigation({ url });
        if (!shouldNavigate) {
            logger.info(`navigation intent precheck failed with: ${message}. refusing navigation`);
            return;
        }

        await this.safeVisit(async (page) => {
            await applyAuth(page);
            await page.goto(url, {
                waitUntil: "networkidle0",
                timeout: this.resourceLimits.timeouts.networkIdle,
            });
        }, proxyConfig);
    }
}
