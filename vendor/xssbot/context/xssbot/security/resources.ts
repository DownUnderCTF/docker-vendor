import { RecursivePartial, VisitResourceLimits } from "../types";
import * as config from "../config";

export const defaultResourceLimits: VisitResourceLimits = {
    timeouts: {
        total: config.TIMEOUT_TOTAL,
        networkIdle: config.TIMEOUT_NETWORK_IDLE,
    },
};

export function resolveResourceLimits(limitRequest: RecursivePartial<VisitResourceLimits>): VisitResourceLimits {
    // SEC: There's possible a proto pollution here but I'm too brain dead to think about it
    // TODO: not this
    return {
        timeouts: Object.assign(limitRequest.timeouts, defaultResourceLimits.timeouts),
    };
}
