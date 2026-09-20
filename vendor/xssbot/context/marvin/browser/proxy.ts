import http from "http";
import net from "net";
import dns from "dns";
import { URL } from "url";
import logger from "./logger";
import { ProxyConfig } from "../types";
import * as appConfig from "../config";

export const defaultProxyConfig: ProxyConfig = {
    hosts: {},
    allowInternet: true,
};

export function createDefaultBlockList(): net.BlockList {
    const bl = new net.BlockList();

    // Standard IPv4 private, loopback, link-local, and reserved ranges
    bl.addSubnet("0.0.0.0", 8, "ipv4");
    bl.addSubnet("10.0.0.0", 8, "ipv4");
    bl.addSubnet("100.64.0.0", 10, "ipv4");
    bl.addSubnet("127.0.0.0", 8, "ipv4");
    bl.addSubnet("169.254.0.0", 16, "ipv4");
    bl.addSubnet("172.16.0.0", 12, "ipv4");
    bl.addSubnet("192.0.0.0", 24, "ipv4");
    bl.addSubnet("192.0.2.0", 24, "ipv4");
    bl.addSubnet("192.168.0.0", 16, "ipv4");
    bl.addSubnet("198.18.0.0", 15, "ipv4");
    bl.addSubnet("198.51.100.0", 24, "ipv4");
    bl.addSubnet("203.0.113.0", 24, "ipv4");
    bl.addSubnet("224.0.0.0", 4, "ipv4");
    bl.addSubnet("240.0.0.0", 4, "ipv4");
    bl.addAddress("255.255.255.255", "ipv4");

    // Standard IPv6 loopback, link-local, private, and reserved ranges
    bl.addSubnet("::", 128, "ipv6");
    bl.addSubnet("::1", 128, "ipv6");
    bl.addSubnet("fc00::", 7, "ipv6");
    bl.addSubnet("fe80::", 10, "ipv6");
    bl.addSubnet("ff00::", 8, "ipv6");

    // Admin custom blocked ranges from BLOCKED_IP_RANGES env var
    if (appConfig.BLOCKED_IP_RANGES) {
        for (const raw of appConfig.BLOCKED_IP_RANGES.split(",")) {
            const cidr = raw.trim();
            if (!cidr) continue;
            try {
                if (cidr.includes("/")) {
                    const [addr, prefix] = cidr.split("/");
                    const type = net.isIP(addr) === 6 ? "ipv6" : "ipv4";
                    bl.addSubnet(addr, Number(prefix), type);
                } else {
                    const type = net.isIP(cidr) === 6 ? "ipv6" : "ipv4";
                    bl.addAddress(cidr, type);
                }
            } catch (err) {
                logger.warn({ cidr, err }, "Invalid CIDR or IP in BLOCKED_IP_RANGES");
            }
        }
    }

    return bl;
}

const defaultBlockList = createDefaultBlockList();

export function isBlockedIp(ipStr: string, blockList = defaultBlockList): boolean {
    let normalized = ipStr;
    // If it's an IPv4-mapped IPv6 address (e.g. ::ffff:127.0.0.1), unmap it
    if (normalized.startsWith("::ffff:") && normalized.includes(".")) {
        normalized = normalized.slice(7);
    }
    const ipType = net.isIP(normalized);
    if (ipType === 0) {
        return true; // Not a valid IP
    }
    const type = ipType === 6 ? "ipv6" : "ipv4";
    return blockList.check(normalized, type);
}

export function canonicalizeHost(raw: string): string {
    let host = raw.trim().toLowerCase();
    // Strip IPv6 brackets if present, e.g. [::1] -> ::1
    if (host.startsWith("[") && host.endsWith("]")) {
        host = host.slice(1, -1);
    }
    // Strip trailing FQDN root dot(s), e.g. example.com. -> example.com
    while (host.endsWith(".")) {
        host = host.slice(0, -1);
    }
    return host;
}

export function parseConnectTarget(target: string): { rawHost: string; targetPort: number } {
    const trimmed = target.trim();
    const lastColon = trimmed.lastIndexOf(":");
    if (lastColon === -1) {
        return { rawHost: canonicalizeHost(trimmed), targetPort: 443 };
    }
    const hostPart = trimmed.slice(0, lastColon);
    const portPart = trimmed.slice(lastColon + 1);
    const port = Number(portPart);
    return {
        rawHost: canonicalizeHost(hostPart),
        targetPort: !Number.isNaN(port) && port > 0 ? port : 443,
    };
}

export function parseProxyConfig(authHeader?: string): ProxyConfig {
    if (!authHeader || !authHeader.startsWith("Basic ")) {
        return defaultProxyConfig;
    }
    try {
        const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
        const colonIdx = decoded.indexOf(":");
        if (colonIdx === -1) {
            return defaultProxyConfig;
        }
        const password = decoded.slice(colonIdx + 1);
        const rawJson = Buffer.from(password, "base64").toString("utf-8");
        const parsed: ProxyConfig = JSON.parse(rawJson);

        // Canonicalize all host keys in hosts map
        if (parsed.hosts) {
            const canonicalHosts: Record<string, string | null> = {};
            for (const [k, v] of Object.entries(parsed.hosts)) {
                canonicalHosts[canonicalizeHost(k)] = v;
            }
            parsed.hosts = canonicalHosts;
        }

        return parsed;
    } catch {
        return defaultProxyConfig;
    }
}

export async function resolveAndCheckDestination(
    rawHost: string,
    config: ProxyConfig
): Promise<{ targetIpOrHost: string; allowed: boolean; reason?: string }> {
    const host = canonicalizeHost(rawHost);
    const hosts = config.hosts ?? {};

    // 1. Explicitly allowed challenge / internal host (remap or direct)
    if (Object.prototype.hasOwnProperty.call(hosts, host)) {
        const remapped = hosts[host];
        return { targetIpOrHost: remapped ?? host, allowed: true };
    }

    // 2. Internet access disabled
    if (!config.allowInternet) {
        return { targetIpOrHost: host, allowed: false, reason: "allowInternet is disabled" };
    }

    // 3. Internet access enabled: resolve IP and verify it is not private or blocked by admin
    try {
        const lookups = await dns.promises.lookup(host, { all: true });
        if (!lookups || lookups.length === 0) {
            return { targetIpOrHost: host, allowed: false, reason: "DNS lookup returned no address" };
        }
        for (const entry of lookups) {
            if (isBlockedIp(entry.address)) {
                return {
                    targetIpOrHost: host,
                    allowed: false,
                    reason: `Host ${host} resolved to blocked IP ${entry.address}`,
                };
            }
        }
        // Connect directly to the first validated IP address (pins IP, preventing DNS rebinding!)
        return { targetIpOrHost: lookups[0].address, allowed: true };
    } catch (e) {
        return { targetIpOrHost: host, allowed: false, reason: `DNS lookup failed: ${e}` };
    }
}

export async function handleConnect(
    req: http.IncomingMessage,
    clientSocket: net.Socket,
    head: Buffer
): Promise<void> {
    if (!req.headers["proxy-authorization"]) {
        clientSocket.write("HTTP/1.1 407 Proxy Authentication Required\r\nProxy-Authenticate: Basic realm=\"MarvinProxy\"\r\n\r\n");
        clientSocket.destroy();
        return;
    }

    const config = parseProxyConfig(req.headers["proxy-authorization"]);
    const { rawHost, targetPort } = parseConnectTarget(req.url ?? "");

    const { targetIpOrHost, allowed, reason } = await resolveAndCheckDestination(rawHost, config);

    if (!allowed) {
        logger.info({ rawHost, reason }, "Proxy blocked CONNECT request");
        clientSocket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        clientSocket.destroy();
        return;
    }

    const serverSocket = net.connect(targetPort, targetIpOrHost, () => {
        clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        if (head && head.length > 0) {
            serverSocket.write(head);
        }
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
    });

    // 30s inactivity timeout to prevent tarpits and leaked sockets
    const SOCKET_TIMEOUT_MS = 30_000;
    serverSocket.setTimeout(SOCKET_TIMEOUT_MS, () => serverSocket.destroy());
    clientSocket.setTimeout(SOCKET_TIMEOUT_MS, () => clientSocket.destroy());

    // Symmetric teardown on errors or disconnects
    const cleanup = () => {
        serverSocket.destroy();
        clientSocket.destroy();
    };

    serverSocket.on("error", cleanup);
    serverSocket.on("close", cleanup);
    clientSocket.on("error", cleanup);
    clientSocket.on("close", cleanup);
}

export async function handleHttpRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
): Promise<void> {
    if (!req.headers["proxy-authorization"]) {
        res.writeHead(407, {
            "Proxy-Authenticate": 'Basic realm="MarvinProxy"',
        });
        res.end("Proxy Authentication Required");
        return;
    }

    const config = parseProxyConfig(req.headers["proxy-authorization"]);

    if (!req.url) {
        res.writeHead(400);
        res.end("Bad Request");
        return;
    }

    try {
        const parsedUrl = new URL(req.url);
        const rawHost = parsedUrl.hostname;
        const targetPort = Number(parsedUrl.port) || (parsedUrl.protocol === "https:" ? 443 : 80);

        const { targetIpOrHost, allowed, reason } = await resolveAndCheckDestination(rawHost, config);

        if (!allowed) {
            logger.info({ rawHost, reason }, "Proxy blocked HTTP request");
            res.writeHead(403);
            res.end("Forbidden");
            return;
        }

        // Strip proxy-authorization before forwarding
        delete req.headers["proxy-authorization"];

        const proxyReq = http.request(
            {
                host: targetIpOrHost,
                port: targetPort,
                method: req.method,
                path: parsedUrl.pathname + parsedUrl.search,
                headers: {
                    ...req.headers,
                    host: parsedUrl.host,
                },
                timeout: 30_000,
            },
            (proxyRes) => {
                res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
                proxyRes.pipe(res);
            }
        );

        proxyReq.on("timeout", () => {
            proxyReq.destroy();
            if (!res.headersSent) {
                res.writeHead(504);
                res.end("Gateway Timeout");
            }
        });

        proxyReq.on("error", () => {
            if (!res.headersSent) {
                res.writeHead(502);
                res.end("Bad Gateway");
            }
        });

        // If client browser disconnects or aborts, clean up upstream request immediately
        res.on("close", () => {
            if (!res.writableFinished) {
                proxyReq.destroy();
            }
        });

        req.pipe(proxyReq);
    } catch {
        res.writeHead(400);
        res.end("Invalid Request URL");
    }
}

export function createProxyServer(): http.Server {
    const server = http.createServer(handleHttpRequest);
    server.on("connect", handleConnect);
    return server;
}

export function startInternalProxy(port: number, host = "127.0.0.1"): Promise<http.Server> {
    return new Promise((resolve, reject) => {
        const server = createProxyServer();

        server.listen(port, host, () => {
            logger.info(`Internal proxy server listening on http://${host}:${port}`);
            resolve(server);
        });

        server.on("error", (err) => reject(err));
    });
}
