import type { Bundle } from "./model/bundle";
import type { StructureDefinition } from "./model/structure-definition";
import type { ParseConformance } from "./parseConformance";
export declare class SnapshotGenerator {
    private readonly choiceRegexString;
    private readonly parser;
    private readonly bundle;
    private processedUrls;
    constructor(parser: ParseConformance, bundle: Bundle);
    static createBundle(...structureDefinitions: StructureDefinition[]): Bundle;
    private getStructureDefinition;
    private merge;
    private process;
    generate(): void;
}
