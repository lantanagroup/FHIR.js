import { StructureDefinition } from "./structure-definition";
export interface Bundle {
    resourceType: string;
    total: number;
    entry?: {
        resource: StructureDefinition;
    }[];
}
