export interface ElementDefinition {
    id?: string;
    path: string;
    min?: number;
    max?: string;
    base?: {
        path: string;
        min: number;
        max: string;
    };
    type?: ElementDefinitionType[];
}
export interface ElementDefinitionType {
    code: string;
    profile?: string[];
    targetProfile?: string[];
    aggregation?: string[];
    versioning?: string;
}
