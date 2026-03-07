import type { ParseConformance } from './parseConformance';
import type { ParsedProperty } from "./model/parsed-property";
export interface ValidatorOptions {
    errorOnUnexpected?: boolean;
    onBeforeValidateResource?: (resource: any) => ValidatorMessage[];
    onBeforeValidateProperty?: (resource: any, property: ParsedProperty, treeDisplay: string, value: any) => ValidatorMessage[];
    onError?: (message: ValidatorMessage) => void;
    beforeCheckCode?: (valueSetUrl: string, code: string, system?: string) => boolean;
    skipCodeValidation?: boolean;
}
export interface ValidatorMessage {
    location?: string;
    resourceId?: string;
    severity?: Severities;
    message?: string;
}
export interface ValidatorResponse {
    valid: boolean;
    messages: ValidatorMessage[];
}
export declare enum Severities {
    Fatal = "fatal",
    Error = "error",
    Warning = "warning",
    Information = "info"
}
export declare class Validator {
    private isXml;
    private obj;
    private resourceId?;
    readonly parser: ParseConformance;
    readonly options: ValidatorOptions;
    response: ValidatorResponse;
    constructor(parser: ParseConformance, options: ValidatorOptions, resourceId?: string, isXml?: boolean, obj?: any);
    validate(input: any): ValidatorResponse;
    static getTreeDisplay(tree: any, isXml?: any, leaf?: any): string;
    private checkCode;
    private addError;
    private addFatal;
    private addWarn;
    private addInfo;
    private validateNext;
    validateProperties(obj: any, properties: any, tree: any): void;
}
