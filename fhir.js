"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fhir = exports.Versions = void 0;
const parseConformance_1 = require("./parseConformance");
const validator_1 = require("./validator");
const convertToJs_1 = require("./convertToJs");
const convertToXml_1 = require("./convertToXml");
const fhirPath_1 = require("./fhirPath");
const snapshotGenerator_1 = require("./snapshotGenerator");
var Versions;
(function (Versions) {
    Versions["STU3"] = "STU3";
    Versions["R4"] = "R4";
})(Versions = exports.Versions || (exports.Versions = {}));
class Fhir {
    constructor(parser) {
        this.parser = parser || new parseConformance_1.ParseConformance(true);
    }
    jsonToXml(json) {
        const obj = JSON.parse(json);
        return this.objToXml(obj);
    }
    objToXml(obj) {
        const convertToXML = new convertToXml_1.ConvertToXml(this.parser);
        const xml = convertToXML.convert(obj);
        return xml;
    }
    ;
    xmlToObj(xml) {
        const convertToJs = new convertToJs_1.ConvertToJs(this.parser);
        const obj = convertToJs.convert(xml);
        return obj;
    }
    ;
    xmlToJson(xml) {
        const convertToJs = new convertToJs_1.ConvertToJs(this.parser);
        const json = convertToJs.convertToJSON(xml);
        return json;
    }
    ;
    validate(input, options) {
        const validator = new validator_1.Validator(this.parser, options);
        return validator.validate(input);
    }
    ;
    evaluate(resource, fhirPathString) {
        const fhirPath = new fhirPath_1.FhirPath(resource, this.parser);
        fhirPath.resolve = this.resolve;
        return fhirPath.evaluate(fhirPathString);
    }
    ;
    resolve(reference) {
        return;
    }
    generateSnapshot(bundle) {
        const snapshotGenerator = new snapshotGenerator_1.SnapshotGenerator(this.parser, bundle);
        snapshotGenerator.generate();
    }
}
exports.Fhir = Fhir;
//# sourceMappingURL=fhir.js.map