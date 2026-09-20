export type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[]
        ? RecursivePartial<U>[]
        : T[P] extends object
        ? RecursivePartial<T[P]>
        : T[P];
};

export type VisitTimeouts = {
    total: number;
    networkIdle: number;
};

export type VisitResourceLimits = {
    timeouts: VisitTimeouts;
};

export type ProxyConfig = {
    hosts?: Record<string, string | null>;
    allowInternet?: boolean;
};

export type VisitRequest = {
    url: string;
    resourceLimits?: RecursivePartial<VisitResourceLimits>;
    proxy?: ProxyConfig;
};
