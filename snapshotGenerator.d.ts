import { Bundle } from "./model/bundle";
import { StructureDefinition } from "./model/structure-definition";
import { ParseConformance } from "./parseConformance";
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
