/**
 * @constructor
 */
var Fhir = function () {
};

/**
 * Serializes a JS resource object to XML
 * @param {*} obj
 * @returns {string}
 */
Fhir.prototype.objToXml = function(obj) {
    var toXml = require('./toXml');
    var xml = toXml(obj);
    return xml;
};

/**
 * Serializes an XML resource to a JS object
 * @param {string} xml
 * @returns {*}
 */
Fhir.prototype.xmlToObj = function(xml) {
    var toJs = require('./toJs');
    var obj = toJs(xml);
    return obj;
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