import { ParsedProperty } from "./parsed-property";
export interface ParsedStructure {
    _url: string;
    _type: string;
    _kind: string;
    _properties?: ParsedProperty[];
}
