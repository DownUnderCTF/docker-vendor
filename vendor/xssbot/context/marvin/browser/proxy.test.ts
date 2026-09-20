import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import {
    isBlockedIp,
    canonicalizeHost,
    parseConnectTarget,
    parseProxyConfig,
    resolveAndCheckDestination,
    startInternalProxy,
} from "./proxy";
import { ProxyConfig } from "../types";

describe("Proxy Unit Tests", () => {
    describe(canonicalizeHost, () => {
        it("should lowercase hostnames", () => {
            expect(canonicalizeHost("CHALLENGE.LOCAL")).toBe("challenge.local");
            expect(canonicalizeHost("ExAmPlE.CoM")).toBe("example.com");
        });

        it("should strip trailing FQDN root dots", () => {
            expect(canonicalizeHost("challenge.local.")).toBe("challenge.local");
            expect(canonicalizeHost("example.com...")).toBe("example.com");
        });

        it("should strip IPv6 brackets", () => {
            expect(canonicalizeHost("[::1]")).toBe("::1");
            expect(canonicalizeHost("[fe80::1]")).toBe("fe80::1");
        });

        it("should trim surrounding whitespace", () => {
            expect(canonicalizeHost("  challenge.local  ")).toBe("challenge.local");
        });
    });

    describe(parseConnectTarget, () => {
        it("should parse standard host:port", () => {
            const res = parseConnectTarget("example.com:443");
            expect(res.rawHost).toBe("example.com");
            expect(res.targetPort).toBe(443);
        });

        it("should parse IPv6 with brackets and port", () => {
            const res = parseConnectTarget("[::1]:8080");
            expect(res.rawHost).toBe("::1");
            expect(res.targetPort).toBe(8080);
        });

        it("should default to port 443 when port is missing or invalid", () => {
            const res1 = parseConnectTarget("example.com");
            expect(res1.rawHost).toBe("example.com");
            expect(res1.targetPort).toBe(443);

            const res2 = parseConnectTarget("example.com:invalid");
            expect(res2.rawHost).toBe("example.com");
            expect(res2.targetPort).toBe(443);
        });
    });

    describe(isBlockedIp, () => {
        it("should block standard IPv4 loopback and private subnets", () => {
            expect(isBlockedIp("127.0.0.1")).toBe(true);
            expect(isBlockedIp("127.1.2.3")).toBe(true);
            expect(isBlockedIp("10.0.0.1")).toBe(true);
            expect(isBlockedIp("172.16.0.1")).toBe(true);
            expect(isBlockedIp("172.31.255.255")).toBe(true);
            expect(isBlockedIp("192.168.1.1")).toBe(true);
            expect(isBlockedIp("169.254.169.254")).toBe(true); // Cloud metadata
            expect(isBlockedIp("100.64.0.1")).toBe(true);      // CGNAT / Tailscale
            expect(isBlockedIp("0.0.0.0")).toBe(true);
        });

        it("should block standard IPv6 loopback, link-local, and unique-local", () => {
            expect(isBlockedIp("::1")).toBe(true);
            expect(isBlockedIp("::")).toBe(true);
            expect(isBlockedIp("fe80::1")).toBe(true);
            expect(isBlockedIp("fc00::1")).toBe(true);
            expect(isBlockedIp("fd12:3456:789a::1")).toBe(true);
        });

        it("should block IPv4-mapped IPv6 addresses", () => {
            expect(isBlockedIp("::ffff:127.0.0.1")).toBe(true);
            expect(isBlockedIp("::ffff:10.0.0.1")).toBe(true);
            expect(isBlockedIp("::ffff:192.168.1.1")).toBe(true);
        });

        it("should allow public IPv4 and IPv6", () => {
            expect(isBlockedIp("1.1.1.1")).toBe(false);
            expect(isBlockedIp("8.8.8.8")).toBe(false);
            expect(isBlockedIp("2606:4700:4700::1111")).toBe(false);
        });

        it("should reject invalid IP strings", () => {
            expect(isBlockedIp("not-an-ip")).toBe(true);
            expect(isBlockedIp("")).toBe(true);
        });
    });

    describe(parseProxyConfig, () => {
        it("should return default config if no auth header", () => {
            const config = parseProxyConfig(undefined);
            expect(config.allowInternet).toBe(true);
            expect(config.hosts).toEqual({});
        });

        it("should canonicalize keys in config.hosts", () => {
            const rawConfig = {
                hosts: {
                    "CHALLENGE.LOCAL.": "127.0.0.1:9999",
                    "MyHost.Test": null,
                },
                allowInternet: false,
            };
            const token = Buffer.from(JSON.stringify(rawConfig)).toString("base64");
            const header = "Basic " + Buffer.from(`bot:${token}`).toString("base64");

            const parsed = parseProxyConfig(header);
            expect(parsed.allowInternet).toBe(false);
            expect(parsed.hosts?.["challenge.local"]).toBe("127.0.0.1:9999");
            expect(parsed.hosts?.["myhost.test"]).toBeNull();
        });
    });

    describe(resolveAndCheckDestination, () => {
        it("should allow and remap configured hosts even with allowInternet: false", async () => {
            const config: ProxyConfig = {
                hosts: {
                    "challenge.local": "127.0.0.1:8000",
                },
                allowInternet: false,
            };
            const res = await resolveAndCheckDestination("CHALLENGE.LOCAL.", config);
            expect(res.allowed).toBe(true);
            expect(res.targetIpOrHost).toBe("127.0.0.1:8000");
        });

        it("should block unlisted hosts when allowInternet is false", async () => {
            const config: ProxyConfig = {
                hosts: {},
                allowInternet: false,
            };
            const res = await resolveAndCheckDestination("google.com", config);
            expect(res.allowed).toBe(false);
            expect(res.reason).toContain("allowInternet is disabled");
        });

        it("should block private IP resolution on public internet path", async () => {
            const config: ProxyConfig = {
                hosts: {},
                allowInternet: true,
            };
            const res = await resolveAndCheckDestination("127.0.0.1", config);
            expect(res.allowed).toBe(false);
            expect(res.reason).toContain("blocked IP");
        });
    });
});

describe("Proxy Server Integration", () => {
    let mockServer: http.Server;
    let proxyServer: http.Server;
    const proxyPort = 8891;

    beforeAll(async () => {
        mockServer = http.createServer((req, res) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, host: req.headers.host, url: req.url }));
        });
        await new Promise<void>((resolve) => mockServer.listen(9995, "127.0.0.1", resolve));
        proxyServer = await startInternalProxy(proxyPort, "127.0.0.1");
    });

    afterAll(() => {
        mockServer.close();
        proxyServer.close();
    });

    function makeAuthHeader(config: ProxyConfig): string {
        const token = Buffer.from(JSON.stringify(config)).toString("base64");
        return "Basic " + Buffer.from(`bot:${token}`).toString("base64");
    }

    it("should require 407 proxy authentication when no auth header is provided", async () => {
        const res = await new Promise<number>((resolve) => {
            const req = http.request(
                {
                    host: "127.0.0.1",
                    port: proxyPort,
                    method: "GET",
                    path: "http://example.com/",
                },
                (r) => resolve(r.statusCode ?? 0)
            );
            req.end();
        });
        expect(res).toBe(407);
    });

    it("should forward HTTP requests to remapped destination preserving Host header", async () => {
        const config: ProxyConfig = {
            hosts: {
                "ctf.challenge": "127.0.0.1",
            },
            allowInternet: false,
        };

        const res = await new Promise<{ status: number; body: string }>((resolve, reject) => {
            const req = http.request(
                {
                    host: "127.0.0.1",
                    port: proxyPort,
                    method: "GET",
                    path: "http://ctf.challenge:9995/secret-path",
                    headers: {
                        "Proxy-Authorization": makeAuthHeader(config),
                    },
                },
                (r) => {
                    let data = "";
                    r.on("data", (chunk) => (data += chunk));
                    r.on("end", () => resolve({ status: r.statusCode ?? 0, body: data }));
                }
            );
            req.on("error", reject);
            req.end();
        });

        expect(res.status).toBe(200);
        const json = JSON.parse(res.body);
        expect(json.ok).toBe(true);
        expect(json.host).toBe("ctf.challenge:9995");
        expect(json.url).toBe("/secret-path");
    });

    it("should return 403 when destination is unlisted and allowInternet is false", async () => {
        const config: ProxyConfig = {
            hosts: {},
            allowInternet: false,
        };

        const status = await new Promise<number>((resolve, reject) => {
            const req = http.request(
                {
                    host: "127.0.0.1",
                    port: proxyPort,
                    method: "GET",
                    path: "http://external.site/",
                    headers: {
                        "Proxy-Authorization": makeAuthHeader(config),
                    },
                },
                (r) => resolve(r.statusCode ?? 0)
            );
            req.on("error", reject);
            req.end();
        });

        expect(status).toBe(403);
    });
});
