import http from "http";
import assert from "assert";
import puppeteer from "puppeteer";
import { startInternalProxy } from "../marvin/browser/proxy";
import { ProxyConfig } from "../marvin/types";

async function runE2E() {
    console.log("Running End-to-End Puppeteer + Proxy Test...");

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
        const page = await browser.newPage();

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
        assert.ok(content.includes("PUPPETEER_SUCCESS"), "Expected page to include PUPPETEER_SUCCESS");
        assert.ok(content.includes("Host: super-chal.ductf.ctf:9998"), "Expected Host header to be preserved as super-chal.ductf.ctf:9998");
        console.log("[PASS] Page loaded successfully with remapped host and intact Host header!");

        // Test blocking: attempt to navigate to disallowed host
        const blockedRes = await page.goto("http://blocked-site.com/", { waitUntil: "networkidle0" });
        assert.strictEqual(blockedRes?.status(), 403);
        console.log("[PASS] Unlisted domain navigation was blocked by proxy with 403 Forbidden!");

        await page.close();
        console.log("\nEnd-to-End Puppeteer + Proxy test passed with flying colors!");
    } finally {
        await browser.close();
        proxyServer.close();
        mockServer.close();
    }
}

runE2E().catch((err) => {
    console.error("E2E Test Failed:", err);
    process.exit(1);
});
