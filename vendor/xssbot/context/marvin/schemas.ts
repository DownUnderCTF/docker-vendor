import Ajv from "ajv/dist/jtd";
import { VisitRequest } from "./types";

const ajv = new Ajv();

const VisitRequestSchema = {
    properties: {
        url: { type: "string" },
    },
    optionalProperties: {
        proxy: {
            optionalProperties: {
                hosts: { values: { type: "string", nullable: true } },
                allowInternet: { type: "boolean" },
            },
        },
        resourceLimits: {
            optionalProperties: {
                timeouts: {
                    optionalProperties: {
                        total: { type: "int32" },
                        networkIdle: { type: "int32" },
                    },
                },
            },
        },
        resouceLimits: {
            optionalProperties: {
                timeouts: {
                    optionalProperties: {
                        total: { type: "int32" },
                        networkIdle: { type: "int32" },
                    },
                },
            },
        },
    },
};

// eslint-disable-next-line import/prefer-default-export
export function getVisitRequestValidator() {
    return ajv.compile<VisitRequest>(VisitRequestSchema);
}
