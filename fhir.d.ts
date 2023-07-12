import type { ParseConformance } from './parseConformance';
import type { Bundle } from "./model/bundle";
import type { ValidatorOptions, ValidatorResponse } from './validator';
export declare enum Versions {
    STU3 = "STU3",
    R4 = "R4",
    R5 = "R5"
}
export declare class Fhir {
    readonly parser: ParseConformance;
    constructor(parser?: ParseConformance);
    jsonToXml(json: string): string;
    objToXml(obj: Object): string;
    xmlToObj(xml: string): {
        resourceType: any;
    };
    xmlToJson(xml: string): string;
    validate(input: string | Object, options?: ValidatorOptions): ValidatorResponse;
    evaluate(resource: string | Object, fhirPathString: string): any;
    resolve(reference: string): void;
    generateSnapshot(bundle: Bundle): void;
}
