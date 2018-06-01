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
var medicationStatementJson = fs.readFileSync('./test/data/stu3/medicationStatement.json').toString();
var questionnaireResponseJson = fs.readFileSync('./test/data/stu3/QuestionnaireResponse_01.json').toString();

var bundleTransactionXml = fs.readFileSync('./test/data/stu3/bundle-transaction.xml').toString();
var documentBundleXml = fs.readFileSync('./test/data/stu3/document-example-dischargesummary.xml').toString();
var patient1Xml = fs.readFileSync('./test/data/stu3/patient-crucible-1.xml').toString();
var patient2Xml = fs.readFileSync('./test/data/stu3/patient-crucible-2.xml').toString();
var condition2Xml = fs.readFileSync('./test/data/stu3/condition-example2.xml').toString();
var medicationStatementXml = fs.readFileSync('./test/data/stu3/medicationStatement.xml').toString();
var questionnaireResponseXml = fs.readFileSync('./test/data/stu3/QuestionnaireResponse_01.xml').toString();

var observationF002excessXml = fs.readFileSync('./test/data/stu3/observation-example-f002-excess.xml').toString();
var observationF002excessNegativeXml = fs.readFileSync('./test/data/stu3/observation-example-f002-excess-negative.xml').toString();
var observationSlightlyDehydratedXml = fs.readFileSync('./test/data/stu3/observation-slightly-dehydrated.xml').toString();


var dstu2ConformanceXml = fs.readFileSync('./test/data/dstu2/conformance.xml').toString();
var dstu2ConformanceJson = fs.readFileSync('./test/data/dstu2/conformance.json').toString();

function biDirectionalTest(xml) {
    var fhir = new Fhir();
    var obj = fhir.xmlToObj(xml);
    var xml = fhir.objToXml(obj);
    var nextObj = fhir.xmlToObj(xml);
    var nextXml = fhir.objToXml(nextObj);

    assert(xml === nextXml);
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

describe('Serialization', function() {
    describe('XML bi-directional', function() {
        it('should serialize bundle xml', function() {
            biDirectionalTest(bundleTransactionXml);
        });

        it('should serialize document xml', function() {
            biDirectionalTest(documentBundleXml);
        });

        it('should serialize condition xml', function() {
            biDirectionalTest(condition2Xml);
        });

        it('should serialize medication statement xml', function() {
            biDirectionalTest(medicationStatementXml);
        });

        it('should serialize observation xml', function() {
            biDirectionalTest(observationSlightlyDehydratedXml);
            biDirectionalTest(observationF002excessNegativeXml);
            biDirectionalTest(observationF002excessXml);
        });

        it('should serialize questionnaire response xml', function() {
            biDirectionalTest(questionnaireResponseXml);
        });

        it('should handle an empty array correctly', function() {
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
            assert(xml === '<?xml version="1.0" encoding="UTF-8"?><Questionnaire xmlns="http://hl7.org/fhir"><item><linkId value="5554"/><text value="test2"/><type value="decimal"/></item></Questionnaire>');
        });

        it('should fail parsing a DSTU2 conformance resources', function() {
            var fhir = new Fhir();

            try {
                var obj = fhir.xmlToObj(dstu2ConformanceXml);
                throw 'Expected xmlToObj to throw an exception';
            } catch (ex) {
                assert(ex.message == 'Unknown resource type: Conformance');
            }

            try {
                var obj = fhir.jsonToXml(dstu2ConformanceJson);
                throw 'Expected jsonToXml to throw an exception';
            } catch (ex) {
                assert(ex.message == 'Unknown resource type: Conformance');
            }
        });
    });

    describe('XML one-way', function() {
        it('should correctly type output json', function() {
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

        it('should allow negative decimals', function() {
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

        it('maxLengthOfDs should work correctly', function() {
            var ConvertToJS = require('../convertToJs');
            var j = new ConvertToJS();
            var tenDs = "DDDDDDDDDD"
            assert.equal(j.maxLengthOfDs({}), 0)
            assert.equal(j.maxLengthOfDs(tenDs), 10)
            assert.equal(j.maxLengthOfDs({"a": tenDs}), 10)
            assert.equal(j.maxLengthOfDs({"a": tenDs, "b": tenDs + tenDs}), 20)
            assert.equal(j.maxLengthOfDs({"a": tenDs, "b": tenDs, "c": {"d": tenDs + tenDs}}), 20)
            assert.equal(j.maxLengthOfDs({"a": tenDs, "b": 55, "c": {"d": tenDs + tenDs}}), 20)
            assert.equal(j.maxLengthOfDs({[tenDs+tenDs+tenDs]: tenDs, "b": 55, "c": {"d": tenDs + tenDs}}), 30)
        })

        it('should correctly parse crucible\'s patient', function() {
            var fhir = new Fhir();
            var obj = fhir.xmlToObj(patient2Xml);
        }),

        it('should serialize reference element definitions', function() {
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

    describe('JS one-way', function() {
        it('should create XML Bundle from bundle-transaction.json', function() {
            var fhir = new Fhir();
            var xml = fhir.objToXml(bundleTransaction);
            assert(xml);
        });

        it('should create XML bundle of QuestionnaireResponse with item.item', function() {
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

describe('Validation', function() {
    describe('JS', function() {
        var fhir = new Fhir();
        it('should result in errors for Observation JS', function() {
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

        it('should pass transaction bundle XML', function() {
            var results = fhir.validate(bundleTransactionXml);
            assert(results);
            assert(results.valid === true);
            assert(results.messages);
            assert(results.messages.length === 0);
        });

        it('should fail document bundle XML', function() {
            var results = fhir.validate(documentBundleXml);
            assert(results);
            assert(results.valid === false);
            assert(results.messages);

            var nonInfoMessages = _.filter(results.messages, function(message) { return message.severity !== 'info'; });
            var infoMessages = _.filter(results.messages, function(message) { return message.severity === 'info'; });

            assert(nonInfoMessages.length === 4);
            
            assert(nonInfoMessages[0].location === 'MedicationRequest/intent');
            assert(nonInfoMessages[0].resourceId === 'Bundle/entry[6]/resource');
            assert(nonInfoMessages[0].severity === 'error');
            assert(nonInfoMessages[0].message === 'Missing property');

            assert(nonInfoMessages[1].location === 'MedicationRequest/medicationCodeableConcept');
            assert(nonInfoMessages[1].resourceId === 'Bundle/entry[6]/resource');
            assert(nonInfoMessages[1].severity === 'warning');
            assert(nonInfoMessages[1].message === 'Code "66493003" (http://snomed.info/sct) not found in value set');

            assert(nonInfoMessages[2].location === 'AllergyIntolerance/reaction[1]/manifestation[1]');
            assert(nonInfoMessages[2].resourceId === 'Bundle/entry[8]/resource');
            assert(nonInfoMessages[2].severity === 'warning');
            assert(nonInfoMessages[2].message === 'Code "xxx" (http://example.org/system) not found in value set');
            
            assert(nonInfoMessages[3].location === 'Bundle/signature/type[1]');
            assert(nonInfoMessages[3].resourceId === 'father');
            assert(nonInfoMessages[3].severity === 'warning');
            assert(nonInfoMessages[3].message === 'Code "1.2.840.10065.1.12.1.1" (http://hl7.org/fhir/valueset-signature-type) not found in value set');
        });

        it('should pass medication statement XML', function() {
            var results = fhir.validate(medicationStatementXml);
            assert(results);
            assert(results.valid === true);
            assert(results.messages);
            assert(results.messages.length === 3);
        });

        it('should fail JS bundle with incorrect type', function() {
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

        it('should pass condition JS', function() {
            var results = fhir.validate(condition2);
            assert(results);
            assert(results.valid === true);
            assert(results.messages);
            assert(results.messages.length === 0);
        });

        it('should fail with unexpected properties', function() {
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

        it('should pass with unexpected properties', function() {
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

        it('should fail data-type validation', function() {
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
    });
});

describe('Parse', function() {
   it('should parse all resources and value sets', function() {
       var coreStructureDefinitions = require('../profiles/r4/index');
       var coreValueSets = require('../profiles/r4/valuesets');
       var parse = new ParseConformance(false, coreStructureDefinitions, coreValueSets);
       parse.parseCoreResources();

       assert(parse.parsedStructureDefinitions);
       assert(Object.keys(parse.parsedStructureDefinitions).length == 202);
       assert(Object.keys(parse.parsedValueSets).length == 445);
   });
});

function checkJsonHasNumber(json, expectedNumber) {
    var expectedNumberPos = json.indexOf(expectedNumber)
    var firstDigit = expectedNumber[0]
    var lastDigit = expectedNumber[expectedNumber.length-1]
    assert(expectedNumberPos > 0, "very large decimals kept as JSON numbers")
    assert(json[expectedNumberPos] == firstDigit, "very large decimals kept as JSON numbers")
    assert(json[expectedNumberPos - 1] != '"', "very large decimals kept as JSON numbers")
    assert.equal(json[expectedNumberPos + expectedNumber.length - 1], lastDigit, "very large decimals kept as JSON numbers")
    assert.equal(json[expectedNumberPos + expectedNumber.length], ",", "very large decimals kept as JSON numbers")
}