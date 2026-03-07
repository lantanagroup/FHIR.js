import type { ParsedStructure } from "./model/parsed-structure";
import type { ParsedValueSet } from "./model/parsed-value-set";
import type { ParsedProperty } from "./model/parsed-property";
export declare class ParseConformance {
    parsedStructureDefinitions: {
        [key: string]: ParsedStructure;
    };
    parsedValueSets: {
        [key: string]: ParsedValueSet;
    };
    structureDefinitions: any[];
    private readonly version;
    private codeSystems;
    constructor(loadCached?: boolean, version?: string);
    isBaseProfile(url: string): boolean;
    private ensurePropertyMetaData;
    private sortValueSetDependencies;
    loadCodeSystem(codeSystem: any): void;
    parseBundle(bundle: any): void;
    parseStructureDefinition(structureDefinition: any): ParsedStructure;
    parseValueSet(valueSet: any): ParsedValueSet;
    populateValueSet(element: any, property: ParsedProperty): void;
    populateBackboneElement(parsedStructureDefinition: any, parentElementId: any, structureDefinition: any): void;
    private static isMultipleAllowed;
}
