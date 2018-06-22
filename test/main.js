var Fhir = require('../fhir');
var ParseConformance = require('../parseConformance');
var fs = require('fs');
var assert = require('assert');
var _ = require('underscore');
var xml2js = require('xml-js').xml2js;

var bundleTransactionJson = fs.readFileSync('./test/data/stu3/bundle-transaction.json').toString();
var bundleTransaction = JSON.parse(bundleTransactionJson);
var documentBundleJson = fs.readFileSync('./test/data/stu3/document-example-dischargesummary.json').toString();
var condition2Json = fs.readFileSync('./test/data/stu3/condition-example2.json').toString();
var condition2 = JSON.parse(condition2Json);
var medicationStatementJson = fs.readFileSync('./test/data/r4/medicationStatement.json').toString();
var questionnaireResponseJson = fs.readFileSync('./test/data/r4/QuestionnaireResponse_01.json').toString();
var operationDefinitionJson = fs.readFileSync('./test/data/stu3/OperationDefinition_example.json').toString();
var capabilityStatementJson = fs.readFileSync('./test/data/stu3/capabilitystatement-example.json').toString();
var immunizationExampleJson = fs.readFileSync('./test/data/r4/immunization-example.json').toString('utf8');
var auditEventExampleJson = fs.readFileSync('./test/data/r4/audit-event-example.json').toString('utf8');

var bundleTransactionXml = fs.readFileSync('./test/data/stu3/bundle-transaction.xml').toString();
var documentBundleXml = fs.readFileSync('./test/data/r4/document-example-dischargesummary.xml').toString();
var badDocumentBundleXml = fs.readFileSync('./test/data/r4/bad-document-example-dischargesummary.xml').toString();
var patient1Xml = fs.readFileSync('./test/data/stu3/patient-crucible-1.xml').toString();
var patient2Xml = fs.readFileSync('./test/data/stu3/patient-crucible-2.xml').toString();
var condition2Xml = fs.readFileSync('./test/data/stu3/condition-example2.xml').toString();
var medicationStatementXml = fs.readFileSync('./test/data/r4/medicationStatement.xml').toString();
var questionnaireResponseXml = fs.readFileSync('./test/data/r4/QuestionnaireResponse_01.xml').toString();
var operationDefinitionXml = fs.readFileSync('./test/data/stu3/OperationDefinition_example.xml').toString();

var observationF002excessXml = fs.readFileSync('./test/data/stu3/observation-example-f002-excess.xml').toString();
var observationF002excessNegativeXml = fs.readFileSync('./test/data/stu3/observation-example-f002-excess-negative.xml').toString();
var observationSlightlyDehydratedXml = fs.readFileSync('./test/data/stu3/observation-slightly-dehydrated.xml').toString();


var dstu2ConformanceXml = fs.readFileSync('./test/data/dstu2/conformance.xml').toString();
var dstu2ConformanceJson = fs.readFileSync('./test/data/dstu2/conformance.json').toString();

function cleanXml(xml) {
    var next = xml;
    next = next.replace('xmlns="http://hl7.org/fhir"', '');
    next = next.replace('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"', '');
    next = next.replace(/\n/g, '');
    next = next.replace(/\r/g, '');
    next = next.replace(/\s{2,20}/g, ' ');
    next = next.replace(/\>\s+\</g, '><');
    return next.trim();
}

function biDirectionalTest(xml) {
    var fhir = new Fhir();
    // Convert to JS obj, and then back to XML
    var obj = fhir.xmlToObj(xml);
    var nextXml = fhir.objToXml(obj);
    var lastObj = fhir.xmlToObj(nextXml);
    var lastXml = fhir.objToXml(lastObj);

    var cleanInXml = cleanXml(xml);
    var cleanOutXml = cleanXml(lastXml);
    assert(cleanInXml === cleanOutXml);
}

function printResults(results) {
    for (var i in results.messages) {
        console.log(results.messages[i].severity + ': ' + results.messages[i].message);
    }
}

function assertArray(obj, expectedLength) {
    assert(obj);
    assert(obj instanceof Array);
    if (arguments.length == 2) {
        assert(obj.length === expectedLength);
    }
}

describe('Serialization', function () {
    describe('XML bi-directional', function () {
        it('should serialize bundle xml', function () {
            biDirectionalTest(bundleTransactionXml);
        });

        it('should serialize document xml', function () {
            biDirectionalTest(documentBundleXml);
        });

        it('should serialize condition xml', function () {
            biDirectionalTest(condition2Xml);
        });

        it('should serialize medication statement xml', function () {
            biDirectionalTest(medicationStatementXml);
        });

        it('should serialize observation xml', function () {
            biDirectionalTest(observationSlightlyDehydratedXml);
            biDirectionalTest(observationF002excessNegativeXml);
            biDirectionalTest(observationF002excessXml);
        });

        it('should serialize questionnaire response xml', function () {
            biDirectionalTest(questionnaireResponseXml);
        });

        it('should serialize operation definition xml', function () {
            biDirectionalTest(operationDefinitionXml);
        });

        it('should handle an empty array correctly', function () {
            var questionnaire = {
                "resourceType": "Questionnaire",
                "item": [
                    {
                        "linkId": "5554",
                        "text": "test2",
                        "type": "decimal",
                        "required": false,
                        "item": []
                    }
                ]
            };
            var fhir = new Fhir();
            var xml = fhir.objToXml(questionnaire);
            assert(xml === '<?xml version="1.0" encoding="UTF-8"?><Questionnaire xmlns="http://hl7.org/fhir"><item><linkId value="5554"/><text value="test2"/><type value="decimal"/><required value="false"/></item></Questionnaire>');
        });

        it('should fail parsing a DSTU2 conformance resources', function () {
            var fhir = new Fhir();

            try {
                var objFromXml = fhir.xmlToObj(dstu2ConformanceXml);
                throw 'Expected xmlToObj to throw an exception';
            } catch (ex) {
                assert(ex.message == 'Unknown resource type: Conformance');
            }

            try {
                var xmlFromJson = fhir.jsonToXml(dstu2ConformanceJson);
                throw 'Expected jsonToXml to throw an exception';
            } catch (ex) {
                assert(ex.message == 'Unknown resource type: Conformance');
            }
        });
    });

    describe('XML one-way', function () {
        it('should correctly type output json', function () {
            var fhir = new Fhir();
            var obj = fhir.xmlToObj(patient1Xml);
            assert.strictEqual(obj.active, true, "booleans should be converted from strings")
            assert.strictEqual(obj.photo[0].hash, "sukclAeJAsqUMyvVUHstQw==", "base64 should be kept as a string")

            obj = fhir.xmlToObj(medicationStatementXml)
            // decimals not yet supported as JavaScript objects so are kept as strings
            assert.strictEqual(obj.contained[0].ingredient[0].amount.numerator.value, "501", "xmlToObj keeps decimals as strings...")
            assert.strictEqual(obj.contained[0].ingredient[1].amount.numerator.value, "25.0", "xmlToObj keeps decimals as strings...")

            json = fhir.xmlToJson(medicationStatementXml)
            checkJsonHasNumber(json, "501")
            checkJsonHasNumber(json, "25.0")
            jsonAsObj = JSON.parse(json)
            assert.strictEqual(jsonAsObj.contained[0].ingredient[0].amount.numerator.value, 501, "xmlToJson converts decimals to numbers")

            // even very large decimals should be preserved as numbers
            json = fhir.xmlToJson(observationSlightlyDehydratedXml)
            checkJsonHasNumber(json, "1206401306298222237039542544")
            checkJsonHasNumber(json, "1206401306298222237039542547")
            checkJsonHasNumber(json, "1349918422375333611314993132")

            obj = fhir.xmlToObj(questionnaireResponseXml)
            assert.strictEqual(obj.total, 4, "integers should be converted")
        }),

            it('should allow negative decimals', function () {
                var fhir = new Fhir();
                var obj1 = fhir.xmlToObj(observationF002excessXml);
                var obj2 = fhir.xmlToObj(observationF002excessNegativeXml);
                assert.strictEqual(obj1.valueQuantity.value, "12.6")
                assert.strictEqual(obj2.valueQuantity.value, "-1.00")

                var json1 = fhir.xmlToJson(observationF002excessXml);
                var json2 = fhir.xmlToJson(observationF002excessNegativeXml);
                assert.strictEqual(JSON.parse(json1).valueQuantity.value, 12.6)
                assert.strictEqual(JSON.parse(json2).valueQuantity.value, -1.00)
                checkJsonHasNumber(json1, "12.6")
                checkJsonHasNumber(json2, "-1.00")
            })

        it('maxLengthOfDs should work correctly', function () {
            var ConvertToJS = require('../convertToJs');
            var j = new ConvertToJS();
            var tenDs = "DDDDDDDDDD"
            assert.equal(j.maxLengthOfDs({}), 0)
            assert.equal(j.maxLengthOfDs(tenDs), 10)
            assert.equal(j.maxLengthOfDs({"a": tenDs}), 10)
            assert.equal(j.maxLengthOfDs({"a": tenDs, "b": tenDs + tenDs}), 20)
            assert.equal(j.maxLengthOfDs({"a": tenDs, "b": tenDs, "c": {"d": tenDs + tenDs}}), 20)
            assert.equal(j.maxLengthOfDs({"a": tenDs, "b": 55, "c": {"d": tenDs + tenDs}}), 20)
            assert.equal(j.maxLengthOfDs({[tenDs + tenDs + tenDs]: tenDs, "b": 55, "c": {"d": tenDs + tenDs}}), 30)
        })

        it('should correctly parse crucible\'s patient', function () {
            var fhir = new Fhir();
            var obj = fhir.xmlToObj(patient2Xml);
        }),

            it('should serialize reference element definitions', function () {
                var fhir = new Fhir();
                var obj = fhir.xmlToObj(questionnaireResponseXml);

                assert(obj);
                assert(obj.entry);
                assert(obj.entry.length === 4);
                assert(obj.entry[0].resource);
                assert(obj.entry[0].resource.resourceType === 'QuestionnaireResponse');
                assert(obj.entry[1].resource);
                assert(obj.entry[1].resource.resourceType === 'QuestionnaireResponse');
                assert(obj.entry[2].resource);
                assert(obj.entry[2].resource.resourceType === 'QuestionnaireResponse');
                assert(obj.entry[3].resource);
                assert(obj.entry[3].resource.resourceType === 'QuestionnaireResponse');

                var questionnaireResponse1 = obj.entry[0].resource;
                assert(questionnaireResponse1.item);
                assert(questionnaireResponse1.item.length === 1);
                assert(questionnaireResponse1.item[0].item);
                assert(questionnaireResponse1.item[0].item.length === 11);
                assert(questionnaireResponse1.item[0].item[0].linkId === 'common_repository');
                assert(questionnaireResponse1.item[0].item[1].linkId === 'common_axtype');
                assert(questionnaireResponse1.item[0].item[2].linkId === 'common_axversion');
                assert(questionnaireResponse1.item[0].item[10].linkId === 'common_axrefdate');
            });
    });

    describe('JS one-way', function () {
        it('should create XML Bundle from bundle-transaction.json', function () {
            var fhir = new Fhir();
            var xml = fhir.objToXml(bundleTransaction);
            assert(xml);
        });

        it('should create XML bundle of QuestionnaireResponse with item.item', function () {
            var fhir = new Fhir();
            var xml = fhir.jsonToXml(questionnaireResponseJson);
            assert(xml);

            var obj = xml2js(xml);
            assert(obj);
            assertArray(obj.elements, 1);
            assert(obj.elements[0].name === 'Bundle');
            assertArray(obj.elements[0].elements, 7);
            assert(obj.elements[0].elements[3].name === 'entry');
            assertArray(obj.elements[0].elements[3].elements, 2);
            assert(obj.elements[0].elements[3].elements[1].name === 'resource');
            assertArray(obj.elements[0].elements[3].elements[1].elements, 1);

            var questionnaireResponseXmlObj = obj.elements[0].elements[3].elements[1].elements[0];
            assertArray(questionnaireResponseXmlObj.elements, 6);
            assert(questionnaireResponseXmlObj.elements[5].name === 'item');
            assertArray(questionnaireResponseXmlObj.elements[5].elements, 12);
            assert(questionnaireResponseXmlObj.elements[5].elements[1].name === 'item');
            assertArray(questionnaireResponseXmlObj.elements[5].elements[1].elements, 2);
            assert(questionnaireResponseXmlObj.elements[5].elements[1].elements[0].name === 'linkId');
            assert(questionnaireResponseXmlObj.elements[5].elements[1].elements[1].name === 'answer');
        });
    });
});

describe('Validation', function () {
    describe('JS', function () {
        var fhir = new Fhir();

        it('should fail on an empty array', function () {
            var capabilityStatement = JSON.parse(capabilityStatementJson);
            capabilityStatement.format = [];

            var results = fhir.validate(capabilityStatement);

            assert(results.valid === false);
        });

        it('should result in success for OperationDefinition JS', function () {
            var operationDefinition = JSON.parse(operationDefinitionJson);
            var results = fhir.validate(operationDefinition);

            assert(results.valid === true);
        });

        it('should result in errors for Observation JS', function () {
            var resource = {
                resourceType: 'Observation',
                badProperty: 'asdf',
                referenceRange: {
                    low: 2
                }
            };

            var results = fhir.validate(resource);
            assert(results);
            assert(results.valid === false);
            assert(results.messages);
            assert(results.messages.length === 4);
            assert(results.messages[0].location === 'Observation.status');
            assert(results.messages[1].message === 'Missing property');
            assert(results.messages[1].severity === 'error');
            assert(results.messages[1].resourceId === '#initial');
            assert(results.messages[1].location === 'Observation.code');
            assert(results.messages[1].message === 'Missing property');
            assert(results.messages[1].severity === 'error');
            assert(results.messages[1].resourceId === '#initial');
            assert(results.messages[2].location === 'Observation.referenceRange');
            assert(results.messages[2].message === 'Property is not an array');
            assert(results.messages[2].severity === 'error');
            assert(results.messages[2].resourceId === '#initial');
            assert(results.messages[3].location === 'Observation.badProperty');
            assert(results.messages[3].message === 'Unexpected property');
            assert(results.messages[3].severity === 'warning');
            assert(results.messages[3].resourceId === '#initial');
        });

        it('should pass transaction bundle XML', function () {
            var results = fhir.validate(bundleTransactionXml);
            assert(results);
            assert(results.valid === true);
            assert(results.messages);
            assert(results.messages.length === 0);
        });

        it('should fail document bundle XML', function () {
            var results = fhir.validate(badDocumentBundleXml);
            assert(results);
            assert(results.valid === false);
            assert(results.messages);

            const errors = _.filter(results.messages, function(message) {
                return message.severity === 'error';
            });

            assert(errors.length === 1);
            assert(errors[0].location === 'Bundle/type');
            assert(errors[0].message === 'Missing property');
            assert(errors[0].resourceId === 'father');
            assert(errors[0].severity === 'error');
        });

        it('should pass medication statement XML', function () {
            var results = fhir.validate(medicationStatementXml);
            assert(results);
            assert(results.valid === true);

            var warnings = _.filter(results.messages, function(message) {
                return message.severity === 'warning';
            });
            assert(warnings.length === 3);
        });

        it('should fail JS bundle with incorrect type', function () {
            var bundle = {
                resourceType: 'Bundle',
                type: 'test'
            };
            var results = fhir.validate(bundle);
            assert(results);
            assert(results.valid === false);
            assert(results.messages.length === 1);
            assert(results.messages[0].location === 'Bundle.type');
            assert(results.messages[0].message === 'Code "test" not found in value set');
            assert(results.messages[0].resourceId === '#initial');
            assert(results.messages[0].severity === 'error');
        });

        it('should pass condition JS', function () {
            var results = fhir.validate(condition2);
            assert(results);
            assert(results.valid === true);
            assert(results.messages);
            assert(results.messages.length === 0);
        });

        it('should fail with unexpected properties', function () {
            var bundle = {
                resourceType: 'Bundle',
                id: '1231',
                type: 'transaction',
                test: true
            };
            var results = fhir.validate(bundle, {
                errorOnUnexpected: true
            });

            assert(results);
            assert(results.valid === false);
            assert(results.messages);
            assert(results.messages.length === 1);
            assert(results.messages[0].location === 'Bundle.test');
            assert(results.messages[0].message === 'Unexpected property');
            assert(results.messages[0].resourceId === '1231');
            assert(results.messages[0].severity === 'error');
        });

        it('should pass with unexpected properties', function () {
            var bundle = {
                resourceType: 'Bundle',
                id: '1231',
                type: 'transaction',
                test: true
            };
            var results = fhir.validate(bundle, {
                errorOnUnexpected: false
            });

            assert(results);
            assert(results.valid === true);
            assert(results.messages);
            assert(results.messages.length === 1);
            assert(results.messages[0].location === 'Bundle.test');
            assert(results.messages[0].message === 'Unexpected property');
            assert(results.messages[0].resourceId === '1231');
            assert(results.messages[0].severity === 'warning');
        });

        it('should fail data-type validation', function () {
            var patient = {
                resourceType: 'Patient',
                id: 'samwise',
                name: [{
                    use: 'bad',
                    family: 'gamgee',
                    given: 'samwise'
                }]
            };
            var results = fhir.validate(patient);
            assert(results);
            assert(results.valid === false);
            assert(results.messages);
            assert(results.messages.length === 2);
            assert(results.messages[0].location === 'Patient.name[0].use');
            assert(results.messages[0].resourceId === 'samwise');
            assert(results.messages[0].severity === 'error');
            assert(results.messages[0].message === 'Code "bad" not found in value set');
            assert(results.messages[1].location === 'Patient.name[0].given');
            assert(results.messages[1].resourceId === 'samwise');
            assert(results.messages[1].severity === 'error');
            assert(results.messages[1].message === 'Property is not an array');
        });

        it('should validate immunization-example.json successfully', function () {
            var immunization = JSON.parse(immunizationExampleJson);
            var result = fhir.validate(immunization);

            assert(result);
            assert.equal(result.valid, true);

            assert(result.messages);
            assert.equal(result.messages.length, 1);
        });

        it('should validate audit-event-example.json successfully, with required boolean', function () {
            var auditEvent = JSON.parse(auditEventExampleJson);
            var result = fhir.validate(auditEvent);

            assert(result);
            assert.equal(result.valid, true);

            assert(result.messages);
            assert.equal(result.messages.length, 5);
        });
    });
});

describe('Parse', function () {
    it('should load parsed structure definitions and value sets from cache/file', function () {
        var parser = new ParseConformance(true);

        assert(parser.parsedStructureDefinitions);
        assert(Object.keys(parser.parsedStructureDefinitions).length == 204);
        assert(Object.keys(parser.parsedValueSets).length == 555);
    });

    it('should parse bundles', function () {
        var types = require('../profiles/r4/profiles-types.json');
        var resources = require('../profiles/r4/profiles-resources.json');
        var valueSets = require('../profiles/r4/valuesets.json');

        var parser = new ParseConformance(false);
        parser.parseBundle(valueSets);
        parser.parseBundle(types);
        parser.parseBundle(resources);

        assert(parser.parsedStructureDefinitions);
        var structureDefinitionsCount = Object.keys(parser.parsedStructureDefinitions).length;
        assert(structureDefinitionsCount == 204);
        assert(parser.parsedValueSets);
        var valueSetsCount = Object.keys(parser.parsedValueSets).length;
        assert(valueSetsCount == 555);

        var noCodeValueSets = _.filter(parser.parsedValueSets, function(valueSet) {
            var systemHasCodes = false;

            _.each(valueSet.systems, function(system) {
                if (system.codes && system.codes.length >= 0) {
                    systemHasCodes = true;
                }
            });

            return !systemHasCodes;
        });

        assert(noCodeValueSets.length === 0);   // All value sets have at least one code
    });
});

function checkJsonHasNumber(json, expectedNumber) {
    var expectedNumberPos = json.indexOf(expectedNumber)
    var firstDigit = expectedNumber[0]
    var lastDigit = expectedNumber[expectedNumber.length - 1]
    assert(expectedNumberPos > 0, "very large decimals kept as JSON numbers")
    assert(json[expectedNumberPos] == firstDigit, "very large decimals kept as JSON numbers")
    assert(json[expectedNumberPos - 1] != '"', "very large decimals kept as JSON numbers")
    assert.equal(json[expectedNumberPos + expectedNumber.length - 1], lastDigit, "very large decimals kept as JSON numbers")
    assert.equal(json[expectedNumberPos + expectedNumber.length], ",", "very large decimals kept as JSON numbers")
}