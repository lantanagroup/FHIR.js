import type { ElementDefinition } from "./element-definition";

export interface StructureDefinition {
    resourceType: string;
    id?: string;
    url: string;
    type: string;
    baseDefinition: string;
    snapshot?: {
        element: ElementDefinition[];
    };
    differential?: {
        element: ElementDefinition[];
    };
    // more
}