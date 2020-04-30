import { ParsedStructure } from "./model/parsed-structure";
import { ParsedValueSet } from "./model/parsed-value-set";
import { ParsedProperty } from "./model/parsed-property";
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
