"use strict";
exports.__esModule = true;
var parseConformance_1 = require("./parseConformance");
var validator_1 = require("./validator");
var convertToJs_1 = require("./convertToJs");
var convertToXml_1 = require("./convertToXml");
var fhirPath_1 = require("./fhirPath");
var Versions;
(function (Versions) {
    Versions["STU3"] = "STU3";
    Versions["R4"] = "R4";
})(Versions = exports.Versions || (exports.Versions = {}));
var Fhir = (function () {
    function Fhir(parser) {
        this.parser = parser || new parseConformance_1.ParseConformance(true);
    }
    Fhir.prototype.jsonToXml = function (json) {
        var obj = JSON.parse(json);
        return this.objToXml(obj);
    };
    Fhir.prototype.objToXml = function (obj) {
        var convertToXML = new convertToXml_1.ConvertToXml(this.parser);
        var xml = convertToXML.convert(obj);
        return xml;
    };
    ;
    Fhir.prototype.xmlToObj = function (xml) {
        var convertToJs = new convertToJs_1.ConvertToJs(this.parser);
        var obj = convertToJs.convert(xml);
        return obj;
    };
    ;
    Fhir.prototype.xmlToJson = function (xml) {
        var convertToJs = new convertToJs_1.ConvertToJs(this.parser);
        var json = convertToJs.convertToJSON(xml);
        return json;
    };
    ;
    Fhir.prototype.validate = function (input, options) {
        var validator = new validator_1.Validator(this.parser, options);
        return validator.validate(input);
    };
    ;
    Fhir.prototype.evaluate = function (resource, fhirPathString) {
        var fhirPath = new fhirPath_1.FhirPath(resource, this.parser);
        fhirPath.resolve = this.resolve;
        return fhirPath.evaluate(fhirPathString);
    };
    ;
    Fhir.prototype.resolve = function (reference) {
        return;
    };
    return Fhir;
}());
exports.Fhir = Fhir;
//# sourceMappingURL=fhir.js.map