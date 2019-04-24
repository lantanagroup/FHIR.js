export interface ParsedConcept {
    code: string;
    display: string;
}
export interface ParsedSystem {
    uri: string;
    codes: ParsedConcept[];
}
export interface ParsedValueSet {
    systems: ParsedSystem[];
}
export interface ParsedProperty {
    _name: string;
    _type: string;
    _multiple?: boolean;
    _required?: boolean;
    _choice?: string;
    _properties?: ParsedProperty[];
    _valueSetStrength?: string;
    _valueSet?: string;
}
export interface ParsedStructure {
    _url: string;
    _type: string;
    _kind: string;
    _properties?: ParsedProperty[];
}
export interface ElementDefinition {
    id?: string;
    path: string;
}
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
}
export interface Bundle {
    resourceType: string;
    total: number;
    entry?: [{
        resource: StructureDefinition;
    }];
}
export declare class ParseConformance {
    parsedStructureDefinitions: ParsedStructure[];
    parsedValueSets: ParsedValueSet[];
    structureDefinitions: any[];
    private version;
    private codeSystems;
    constructor(loadCached?: boolean, version?: string);
    isBaseProfile(url: string): boolean;
    private sortValueSetDependencies;
    loadCodeSystem(codeSystem: any): void;
    parseBundle(bundle: any): void;
    parseStructureDefinition(structureDefinition: any): ParsedStructure;
    parseValueSet(valueSet: any): ParsedValueSet;
    populateValueSet(element: any, property: ParsedProperty): void;
    populateBackboneElement(resourceType: any, parentElementId: any, profile: any): void;
}
