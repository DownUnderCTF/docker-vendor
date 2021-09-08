import * as fs from "fs";
import * as puppeteer from "puppeteer";
import * as config from "../config";
import logger from "./logger";

type AuthHandler = (page: puppeteer.Page) => Promise<void>;

function getHttpGetHandler(): AuthHandler {
    if(!config.OUTBOUND_AUTH_HTTP_GET_URL) {
        throw new Error('OUTBOUND_AUTH_HTTP_GET_URL must be set for http-get auth type');
    }
    const url = config.OUTBOUND_AUTH_HTTP_GET_URL;
    return async (page: puppeteer.Page) => {
        // Intentionally no timeout here
        await page.goto(url, {
            waitUntil: "networkidle0",
        });
    };
}

function getCookieJarHandler(): AuthHandler {
    try {
        const cookies: { name: string; value: string }[] = JSON.parse(
            fs.readFileSync(config.OUTBOUND_AUTH_COOKIEJAR, "utf-8")
        );

        return async (page: puppeteer.Page) => {
            cookies.forEach((cookie) => page.setCookie(cookie));
        };
    } catch (e) {
        logger.warn(`Failed to load cookies from cookiejar. ${e}`);
        throw e;
    }
}

function getNoneHandler(): AuthHandler {
    return async () => {};
}

function getHandler() {
    switch (config.OUTBOUND_AUTH_METHOD.toLowerCase()) {
        case "cookiejar":
            return getCookieJarHandler();
        case "http-get":
            return getHttpGetHandler();
        case "none":
            return getNoneHandler();
        default:
            logger.warn(`Unknown auth method ${config.OUTBOUND_AUTH_METHOD}. Assuming none`);
            return getNoneHandler();
    }
}

export default getHandler();
