import { ParseConformance } from './parseConformance';
export declare class ConvertToJs {
    private parser;
    constructor(parser?: ParseConformance);
    convert(xml: any): {
        resourceType: any;
    };
    convertToJSON(xml: any): string;
    private maxLengthOfDs;
    private resourceToJS;
    private findReferenceType;
    private propertyToJS;
}
