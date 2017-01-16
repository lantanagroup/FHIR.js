var xml2js = require('xml2js');
var Q = require('q');
var libxml = require('libxmljs');
var fs = require('fs');
var path = require('path');

/**
 * @class
 * @example
 * var FHIR = require('fhir');
 * var fhir = new FHIR(FHIR.DSTU1);
 */
var Fhir = function(version) {
    var self = this;
    var profiles;

    if (!version) {
        version = Fhir.STU3;
    }

    if (version == Fhir.DSTU1) {
        profiles = require('./profiles/dstu1');
    } else if (version == Fhir.DSTU2) {
        profiles = require('./profiles/dstu2');
    } else if (version == Fhir.STU3) {
        profiles = require('./profiles/stu3');
    }

    var XmlParser;
    var JsParser;
    var JsValidator;

    if (version == Fhir.DSTU1) {
        XmlParser = require('./dstu1/xmlParser');
        JsParser = require('./dstu1/jsParser');
        JsValidator = require('./dstu1/jsValidator');
    } else if (version == Fhir.DSTU2) {
        XmlParser = require('./dstu2/xmlParser');
        JsParser = require('./dstu2/jsParser');
        JsValidator = require('./dstu2/jsValidator');
    } else if (version == Fhir.STU3) {
        XmlParser = require('./stu3/xmlParser');
        JsParser = require('./stu3/jsParser');
        JsValidator = require('./stu3/jsValidator');
    }

    var getSchemaDirectory = function() {
        switch (version) {
            case Fhir.DSTU1:
                return path.join(__dirname, 'schemas/dstu1/');
            case Fhir.DSTU2:
                return path.join(__dirname, 'schemas/dstu2/');
            case Fhir.STU3:
                return path.join(__dirname, 'schemas/stu3/');
            default:
                throw 'Cannot get schema directory for unexpected version of FHIR';
        }
    };

    /**
     * Converts a JS resource object to XML
     * @param {obj} obj The JS resource to convert
     * @returns {string} XML converted from JS resource
     * @alias ObjectToXml
     * @memberof Fhir#
     * @example
     * var FHIR = require('fhir');
     * var myPatient = {
     *    resourceType: 'Patient',
     *    ...
     * };
     * var fhir = new FHIR(FHIR.DSTU1);
     * var xml = fhir.ObjectToXml(myPatient);
     */
    self.ObjectToXml = function(obj) {
        var jsParser = new JsParser(profiles);
        var xml = jsParser.CreateXml(obj);
        return xml;
    };

    /**
     * Converts a JSON resource to XML
     * @param {string} json The JSON resource to convert
     * @returns {string} XML converted from JSON resource
     * @alias JsonToXml
     * @memberof Fhir#
     * @example
     * var FHIR = require('fhir');
     * var myPatient = {
     *    resourceType: 'Patient',
     *    ...
     * };
     * var myPatientJson = JSON.stringify(myPatient);
     * var fhir = new FHIR(FHIR.DSTU1);
     * var xml = fhir.JsonToXml(myPatientJson);
     */
    self.JsonToXml = function(json) {
        var obj = JSON.parse(json);
        return self.ObjectToXml(obj);
    };

    /**
     * Converts XML resource to JSON
     * @param {string} xmlString The XML string (resource) to convert to JSON
     * @returns {string|promise} Q promise, which upon completion returns the JSON resource converted from XML
     * @alias XmlToJson
     * @memberof Fhir#
     * @example
     * var FHIR = require('fhir');
     * var myPatientXml = '<Patient xmlns="http://hl7.org/fhir"><name><use value="official"/><family value="Chalmers"/><given value="Peter"/><given value="James"/></name></Patient>';
     * var fhir = new FHIR(FHIR.DSTU1);
     * fhir.XmlToJson(myPatientXml)
     *   .then(function(myPatientJson) {
            // Do something with myPatientJson
     *   })
     *   .catch(function(err) {
     *      // Do something with err
     *   });
     */
    self.XmlToJson = function(xmlString) {
        var deferred = Q.defer();

        self.XmlToObject(xmlString)
            .then(function(obj) {
                var json = JSON.stringify(obj);
                deferred.resolve(json);
            })
            .catch(function(err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    /**
     * Converts XML resource to a JS object
     * @param {string} xmlString The XML string (resource) to convert to a JS object
     * @returns {resource|promise} Q promise, which upon completion returns the JS object resource converted from XML
     * @alias XmlToObject
     * @memberof Fhir#
     * @example
     * var FHIR = require('fhir');
     * var myPatientXml = '<Patient xmlns="http://hl7.org/fhir"><name><use value="official"/><family value="Chalmers"/><given value="Peter"/><given value="James"/></name></Patient>';
     * var fhir = new FHIR(FHIR.DSTU1);
     * fhir.XmlToObject(myPatientXml)
     *   .then(function(myPatient) {
     *      // Do something with myPatient
     *   })
     *   .catch(function(err) {
     *      // Do something with err
     *   });
     */
    self.XmlToObject = function(xmlString) {
        var deferred = Q.defer();

        var options = {
            tagNameProcessors: [xml2js.processors.stripPrefix]
        };
        var parser = new xml2js.Parser(options);

        try {
            parser.parseString(xmlString, function (err, result) {
                if (err) {
                    return deferred.reject(err);
                }

                try {
                    var obj = {};
                    var xmlParser = new XmlParser(profiles, result);

                    for (var i in result) {
                        obj.resourceType = i;

                        if (version == Fhir.DSTU1 && obj.resourceType == 'feed') {
                            obj.resourceType = 'Bundle';
                            obj = xmlParser.PopulateBundle(obj, result[i]);
                        } else {
                            obj = xmlParser.PopulateFromXmlObject(obj, result[i], i);
                        }

                        break;
                    }

                    deferred.resolve(obj);
                } catch (ex) {
                    deferred.reject(ex);
                }
            });
        } catch (ex) {
            deferred.reject(ex);
        }

        return deferred.promise;
    };

    /**
     * Validates the XML resource against the FHIR schemas
     * @param {string} xmlResource The XML string to validate
     * @returns {object} A validation results object that contains properties for whether the XML is valid.
     * When the XML is not valid, the object contains an array that includes what the errors/warnings are
     * @alias ValidateXMLResource
     * @memberof Fhir#
     * @example
     * var bundleXml = fs.readFileSync('./test/data/bundle.xml').toString('utf8');
     * var fhir = new Fhir(Fhir.DSTU1);
     * var result = fhir.ValidateXMLResource(bundleXml);
     * // result is an object that contains "valid" (true | false) and "errors" (an array of string errors when valid is false).
     */
    self.ValidateXMLResource = function(xmlResource) {
        var xmlDoc = libxml.parseXml(xmlResource);
        var schemaContent;

        if (xmlDoc.root().name() == 'feed') {
            schemaContent = fs.readFileSync(path.join(getSchemaDirectory(), 'fhir-atom-single.xsd')).toString('utf8');
        } else {
            schemaContent = fs.readFileSync(path.join(getSchemaDirectory(), 'fhir-all.xsd')).toString('utf8');
        }

        // Change the process' directory to the schema directory so that xsd:import and xsd:include references resolve
        var baseDir = process.cwd();
        process.chdir(getSchemaDirectory());

        // Parse the schema content into a schema doc
        var schemaDoc = libxml.parseXml(schemaContent);

        // Validate the XML doc against the schema doc
        var validationResult = xmlDoc.validate(schemaDoc);

        // Change the process' directory back to the original directory
        process.chdir(baseDir);

        // Build the results returned to the user
        var results = {
            valid: validationResult,
            errors: []
        };

        if (xmlDoc.validationErrors && xmlDoc.validationErrors.length > 0) {
            for (var i in xmlDoc.validationErrors) {
                results.errors.push(xmlDoc.validationErrors[i].message);
            }
        }

        return results;
    };

    /**
     * Validates the specified JS resource against a profile. If no profile is specified, the base profile for the resource type will be validated against.
     * @param {obj} obj The JS resource to validate
     * @param {obj} [profile] The profile to validate the resource against. The profile param must be a complete profile JS object.
     * @alias ValidateJSResource
     * @memberof Fhir#
     * @example
     * var compositionJson = fs.readFileSync('./test/data/composition.json').toString('utf8');
     * var composition = JSON.parse(compositionJson);
     * var fhir = new Fhir(Fhir.DSTU1);
     * var result = fhir.ValidateJSResource(composition);
     */
    self.ValidateJSResource = function(obj, profile) {
        var validator = new JsValidator(profiles);
        return validator.Validate(obj, profile);
    };

    /**
     * Validates the specified JSON resource against a profile. If no profile is specified, the base profile for the resource type will be validated against.
     * @param {string} json The JSON resource to validate
     * @param {obj} [profile] The profile to validate the resource against. The profile param must be a complete profile JS object.
     * @alias ValidateJSONResource
     * @memberof Fhir#
     * @example
     * var bundleJson = fs.readFileSync('./test/data/bundle.json').toString('utf8');
     * var bundle = JSON.parse(bundleJson);
     * var fhir = new Fhir(Fhir.DSTU1);
     * var result = fhir.ValidateJSResource(bundle);
     */
    self.ValidateJSONResource = function(json, profile) {
        var obj = JSON.parse(json);
        var validator = new JsValidator(profiles);
        return validator.Validate(obj, profile);
    };
};

/**
 * Version specified for DSTU 1
 * @type {string}
 */
Fhir.DSTU1 = '1';

/**
 * Version specifier for DSTU 2
 * @type {string}
 */
Fhir.DSTU2 = '2';

/**
 * Version specifier for STU 3
 * @type {string}
 */
Fhir.STU3 = '3';

module.exports = Fhir;