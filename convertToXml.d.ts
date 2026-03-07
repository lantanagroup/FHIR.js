import { ParseConformance } from './parseConformance';
export interface XmlDeclaration {
    attributes?: {
        [id: string]: any;
    };
}
export interface XmlElement {
    name?: string;
    attributes?: {
        [id: string]: any;
    };
    elements?: XmlElement[];
    declaration?: XmlDeclaration;
    type?: string;
    comment?: any;
}
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
