import { ParseConformance } from './parseConformance';
export declare class ConvertToXml {
    readonly attributeProperties: {
        Extension: string;
    };
    private parser;
    constructor(parser?: ParseConformance);
    convert(obj: any): string;
    private resourceToXML;
    private propertyToXML;
}
