import { describe, it, expect } from "vitest";
import http from "http";
import puppeteer from "puppeteer";
import { startInternalProxy } from "./proxy";
import { ProxyConfig } from "../types";

describe("Proxy E2E with Chromium", () => {
    it("should navigate via proxy, preserve Host header, and block unlisted sites", async () => {
        // 1. Start mock web app
        const mockServer = http.createServer((req, res) => {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`<html><body><h1>PUPPETEER_SUCCESS</h1><p>Host: ${req.headers.host}</p></body></html>`);
        });
        await new Promise<void>((resolve) => mockServer.listen(9998, "127.0.0.1", resolve));
    console.log("[PASS] Mock web server listening on 127.0.0.1:9998");

    // 2. Start internal proxy
    const proxyPort = 8887;
    const proxyServer = await startInternalProxy(proxyPort, "127.0.0.1");
    console.log(`[PASS] Internal proxy listening on 127.0.0.1:${proxyPort}`);

    // 3. Launch Chromium with proxy
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: "/usr/bin/chromium",
        args: [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            `--proxy-server=http://127.0.0.1:${proxyPort}`,
            "--proxy-bypass-list=<-loopback>",
        ],
    });
    console.log("[PASS] Chromium launched with --proxy-server");

    try {
        const context = await browser.createIncognitoBrowserContext({
            proxyServer: `http://127.0.0.1:${proxyPort}`,
        });
        const page = await context.newPage();

        // Configure proxy credentials for this page
        const proxyConfig: ProxyConfig = {
            hosts: {
                "super-chal.ductf.ctf": "127.0.0.1",
            },
            allowInternet: false,
        };
        const token = Buffer.from(JSON.stringify(proxyConfig)).toString("base64");
        await page.authenticate({ username: "bot", password: token });

        console.log("Navigating to http://super-chal.ductf.ctf:9998/ via proxy...");
        await page.goto("http://super-chal.ductf.ctf:9998/", { waitUntil: "networkidle0" });

        const content = await page.content();
        expect(content).toContain("PUPPETEER_SUCCESS");
        expect(content).toContain("Host: super-chal.ductf.ctf:9998");

        // Test blocking: attempt to navigate to disallowed host
        const blockedRes = await page.goto("http://blocked-site.com/", { waitUntil: "networkidle0" });
        expect(blockedRes?.status()).toBe(403);

        await page.close();
    } finally {
        await browser.close();
        proxyServer.close();
        mockServer.close();
    }
    }, 20_000);
});
