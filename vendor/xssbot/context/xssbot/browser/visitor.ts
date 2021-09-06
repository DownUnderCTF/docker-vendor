import puppeteer from "puppeteer";

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
    // TODO: this
    console.log(request.url());
    await request.continue();
}

export default class BotVisitor {
    private browser: puppeteer.Browser;

    constructor(browser: puppeteer.Browser) {
        this.browser = browser;
    }

    private async usingPageContext(visitor: PageVisitor) {
        const context = await this.browser.createIncognitoBrowserContext();
        try {
            const page = await context.newPage();
            try {
                await visitor(page);
            } finally {
                await safeClosePage(page);
            }
        } finally {
            await context.close();
        }
    }

    private async safeVisit(visiter: PageVisitor) {
        await this.usingPageContext(async (page) => {
            // TODO: set cookie
            await page.setCacheEnabled(false);
            await page.setRequestInterception(true);

            page.on("request", browserRequestValidator);
            setTimeout(async () => safeClosePage(page), 10000);

            // TODO: report status
            await visiter(page);
        });
    }

    public async visit(url: string) {
        this.safeVisit(async (page) => {
            await page.goto(url);
        });
    }
}
