/**
 * @constructor
 * @param {ParseConformance} [parser] A parser, which may include specialized StructureDefintion and ValueSet resources
 */
var Fhir = function (parser) {
    var ParseConformance = require('./parseConformance.js');

    // If no custom parser is specified, create a new one, loading cached data
    this.parser = parser || new ParseConformance(true);
};

/**
 * Serializes a JSON resource object to XML
 * @param {string} json
 * @returns {string} XML
 */
Fhir.prototype.jsonToXml = function(json) {
    var obj = JSON.parse(json);
    return this.objToXml(obj);
}

/**
 * Serializes a JS resource object to XML
 * @param {*} obj
 * @returns {string}
 */
Fhir.prototype.objToXml = function(obj) {
    var ConvertToXML = require('./convertToXml');
    var convertToXML = new ConvertToXML(this.parser);
    var xml = convertToXML.convert(obj);
    return xml;
};

/**
 * Serializes an XML resource to a JS object
 * @param {string} xml
 * @returns {*}
 */
Fhir.prototype.xmlToObj = function(xml) {
    var ConvertToJS = require('./convertToJs');
    var convertToJs = new ConvertToJS(this.parser);
    var obj = convertToJs.convert(xml);
    return obj;
};

/**
 * Serializes an XML resource to JSON
 * @param {string} xml
 * @returns {string} JSON
 */
Fhir.prototype.xmlToJson = function(xml) {
    var ConvertToJS = require('./convertToJs');
    var convertToJs = new ConvertToJS(this.parser);
    var json = convertToJs.convertToJSON(xml);
    return json;
};

/**
 * Validates the specified resource (either a JS object or XML string)
 * @param {string|*} objOrXml
 * @param {ValidationOptions} options
 * @returns {ValidationResponse}
 */
Fhir.prototype.validate = function(objOrXml, options) {
    var validate = require('./validation');
    return validate(objOrXml, options);
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
Fhir.prototype.evaluate = function(resource, fhirPathString) {
    var FhirPath = require('./fhirPath');
    var fhirPath = new FhirPath(resource, this.parser);
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
Fhir.prototype.resolve = function(reference) {
    return;
}

module.exports = Fhir;