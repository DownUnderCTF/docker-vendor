import { URL } from "url";

// SEC: Confusion vuln here if node's URL != chrome's URL
function validateURL(urlString: string) {
    // TODO: throw instead of return
    const url = new URL(urlString);

    if (!["http:", "https:"].includes(url.protocol)) {
        return false;
    }

    return true;
}
