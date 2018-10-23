interface PathStructure {
    name?: string;
    params?: StatementStructure[];
}
interface StatementStructure {
    resourceType?: string;
    value?: string;
    path?: [string | PathStructure];
    left?: StatementStructure;
    right?: StatementStructure;
    op?: string;
}
export declare class FhirPath {
    private parser;
    readonly resources: any;
    readonly operators: string[];
    private findClosingParenIndex;
    private findClosingQuoteIndex;
    constructor(resources: any, parser: any);
    private internalResolve;
    resolve(reference: any): void;
    private getResourceTypes;
    parse(fhirPath: any): StatementStructure[];
    private getValue;
    private internalEvaluate;
    private shouldReturnArray;
    evaluate(fhirPath: any): any;
}
export {};
