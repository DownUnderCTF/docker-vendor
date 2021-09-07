import BeeQueue from "bee-queue";
import bunyan from "bunyan";
import { browser } from "./browser/browser";
import * as config from "./config";
import { VisitRequest } from "./types";

const logger = bunyan.createLogger({ name: "VisitTask" });

const visitQueue = new BeeQueue("xssbot-visit", {
    redis: { host: config.REDIS_HOST },
    prefix: "xssbot-bq",
    stallInterval: config.TIMEOUT_TOTAL * 2,
    sendEvents: false,
    storeJobs: false,
    removeOnSuccess: true,
    removeOnFailure: true,
});
const localQueueStats = {
    succeeded: 0,
    failed: 0,
};

visitQueue.on("ready", () => {
    logger.info("xssbot task queue is now ready to handle tasks");
});
visitQueue.on("error", (err) => {
    logger.error(`A queue error occurred: ${err}`);
});
visitQueue.on("succeeded", (job) => {
    localQueueStats.succeeded += 1;
    logger.info(`Job ${job.id} succeeded`);
});
visitQueue.on("failed", (job, err) => {
    localQueueStats.failed += 1;
    logger.warn(`Job ${job.id} failed with error ${err}`);
});

visitQueue.process(async (job) => {
    const req: VisitRequest = job.data;
    const visitor = browser.getVisitor();
    await visitor.visit(req.url);
});

export function submitVisitRequest(req: VisitRequest) {
    return visitQueue
        .createJob(req)
        .timeout(config.TIMEOUT_TOTAL * 1.5) // Give some leeway
        .save();
}

export async function getQueueStatus() {
    return localQueueStats;
}
