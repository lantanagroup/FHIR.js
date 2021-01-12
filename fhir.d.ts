import { ParseConformance } from './parseConformance';
import { Bundle } from "./model/bundle";
import { ValidatorOptions } from './validator';
export declare enum Versions {
    STU3 = "STU3",
    R4 = "R4"
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
    validate(input: string | Object, options?: ValidatorOptions): import("./validator").ValidatorResponse;
    evaluate(resource: string | Object, fhirPathString: string): any;
    resolve(reference: string): void;
    generateSnapshot(bundle: Bundle): void;
}
