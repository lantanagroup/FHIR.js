var Fhir = function () {
};

Fhir.prototype.objToXml = function(obj) {
    var toXml = require('./toXml');
    var xml = toXml(obj);
    return xml;
};

Fhir.prototype.xmlToObj = function(xml) {
    var toJs = require('./toJs');
    var obj = toJs(xml);
    return obj;
};

Fhir.prototype.validate = function(objOrXml, options) {
    var validate = require('./validation');
    return validate(objOrXml, options);
};

module.exports = Fhir;