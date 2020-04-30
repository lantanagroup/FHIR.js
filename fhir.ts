import {ParseConformance} from './parseConformance';
import {Bundle} from "./model/bundle";
import {Validator, ValidatorOptions} from './validator';
import {ConvertToJs} from './convertToJs';
import {ConvertToXml} from './convertToXml';
import {FhirPath} from './fhirPath';
import {SnapshotGenerator} from './snapshotGenerator';

export enum Versions {
    STU3 = 'STU3',
    R4 = 'R4'
}

export class Fhir {
    readonly parser: ParseConformance;
    
    constructor(parser?: ParseConformance) {
        this.parser = parser || new ParseConformance(true);
    }

    /**
     * Serializes a JSON resource object to XML
     * @param {string} json
     * @returns {string} XML
     */
    public jsonToXml(json: string) {
        const obj = JSON.parse(json);
        return this.objToXml(obj);
    }

    /**
     * Serializes a JS resource object to XML
     * @param {*} obj
     * @returns {string}
     */
    public objToXml(obj: Object) {
        const convertToXML = new ConvertToXml(this.parser);
        const xml = convertToXML.convert(obj);
        return xml;
    };

    /**
     * Serializes an XML resource to a JS object
     * @param {string} xml
     * @returns {*}
     */
    public xmlToObj(xml: string) {
        const convertToJs = new ConvertToJs(this.parser);
        const obj = convertToJs.convert(xml);
        return obj;
    };

    /**
     * Serializes an XML resource to JSON
     * @param {string} xml
     * @returns {string} JSON
     */
    public xmlToJson(xml: string) {
        const convertToJs = new ConvertToJs(this.parser);
        const json = convertToJs.convertToJSON(xml);
        return json;
    };

    /**
     * Validates the specified resource (either a JS object or XML string)
     * @param {string|*} input The input to validate. Can be XML string, JSON string or an object
     * @param {ValidatorOptions?} options The options to use while validating
     * @returns {ValidatorResponse} The results of the validation
     */
    public validate(input: string | Object, options?: ValidatorOptions) {
        const validator = new Validator(this.parser, options);
        return validator.validate(input);
    };

    /**
     * Evaluates a FhirPath against the specified resource(s)
     * @param {Resource|Array<Resource>} resource
     * @param {string} fhirPathString
     * @returns {obj|Array} The result of the FhirPath evaluation. Can be a single value or multiple values. When FhirPath represents a operator comparison, returns a single boolean value.
     * @see {@link FhirPath}
     * @example
     * var results = fhir.evaluate(resources, "Bundle.entry.where(fullUrl = 'http://xxx')")
     * // Only one of the 8 resources in the bundle have an entry with that URL
     * assert(results.fullUrl === 'http://xxx')
     * @example
     * var results = fhir.evaluate([ resource1, resource2 ], "Bundle.entry.resource.where(resourceType = 'StructureDefinition')")
     * // Only one of the resources was a StructureDefinition, so the one StructureDefinition is returned
     * assert(results.resourceType === 'StructureDefinition')
     * @example
     * var results = fhir.evaluate([ resource1, resource2 ], "StructureDefinition.snapshot.element")
     * // results in a combination of all elements in both StructureDefinition resources
     * assert(results.length == 84)
     */
    public evaluate(resource: string | Object, fhirPathString: string) {
        const fhirPath = new FhirPath(resource, this.parser);
        fhirPath.resolve = this.resolve;
        return fhirPath.evaluate(fhirPathString);
    };

    /**
     * A callback which is executed when a reference needs to be resolved to a resource during evaluation of FhirPath.
     * This should be overridden by the caller of the class.
     * @param {string} reference The reference that needs to be resolved
     * @returns Should return a Resource instance
     * @event
     */
    public resolve(reference: string) {
        return;
    }

    /**
     * Generates a snapshot for each of the StructureDefinition resources in the Bundle.
     * To generate a snapshot, the parser used by the Fhir instance needs to have the structure definitions explicitly loaded during runtime. In other words,
     * you cannot generate snapshots using a cached ParseConformance instance.
     * You can use SnapshotGenerator.createBundle(sd1, sd2, sd3) to easily create a bundle based on an arbitrary number of StructureDefinitions. The returned
     * bundle can be passed to generateSnapshot().
     * @param bundle A bundle containing StructureDefinition resources that need a snapshot generated for them
     */
    public generateSnapshot(bundle: Bundle) {
        const snapshotGenerator = new SnapshotGenerator(this.parser, bundle);
        snapshotGenerator.generate();
    }
}