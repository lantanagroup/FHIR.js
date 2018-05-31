/**
 * @constructor
 * @param {ParseConformance} [parser] A parser, which may include specialized StructureDefintion and ValueSet resources
 */
var Fhir = function (parser) {
    var ParseConformance = require('./parseConformance.js');
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

module.exports = Fhir;