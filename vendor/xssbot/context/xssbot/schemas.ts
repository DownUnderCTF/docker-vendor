import Ajv, { JTDDataType } from "ajv/dist/jtd";

const ajv = new Ajv();

const VisitRequestSchema = {
    properties: {
        url: { type: "string" },
    },
    optionalProperties: {
        timeouts: {
            properties: {
                total: { type: "int32", nullable: true },
                networkIdle: { type: "int32", nullable: true },
            },
            nullable: true,
        },
    },
};

export type VisitRequest = JTDDataType<typeof VisitRequestSchema>;
export function getVisitRequestValidator() {
    return ajv.compile<VisitRequest>(VisitRequestSchema);
}
