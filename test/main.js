var Fhir = require('../fhir');
var fs = require('fs');
var assert = require('assert');

var bundleTransactionJson = fs.readFileSync('./test/data/stu3/bundle-transaction.json').toString();
var bundleTransaction = JSON.parse(bundleTransactionJson);
var documentBundleJson = fs.readFileSync('./test/data/stu3/document-example-dischargesummary.json').toString();
var condition2Json = fs.readFileSync('./test/data/stu3/condition-example2.json').toString();
var condition2 = JSON.parse(condition2Json);
var medicationStatementJson = fs.readFileSync('./test/data/stu3/medicationStatement.json').toString();

var bundleTransactionXml = fs.readFileSync('./test/data/stu3/bundle-transaction.xml').toString();
var documentBundleXml = fs.readFileSync('./test/data/stu3/document-example-dischargesummary.xml').toString();
var condition2Xml = fs.readFileSync('./test/data/stu3/condition-example2.xml').toString();
var medicationStatementXml = fs.readFileSync('./test/data/stu3/medicationStatement.xml').toString();

function biDirectionalTest(xml) {
    var fhir = new Fhir();
    var obj = fhir.xmlToObj(xml);
    var xml = fhir.objToXml(obj);
    var nextObj = fhir.xmlToObj(xml);
    var nextXml = fhir.objToXml(nextObj);

    assert(xml === nextXml);
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
    });

    describe('JS one-way', function() {
        it('should create XML Bundle from bundle-transaction.json', function() {
            var fhir = new Fhir();
            var xml = fhir.objToXml(bundleTransaction);
            assert(xml);
        });
    });
});

function printResults(results) {
    for (var i in results.messages) {
        console.log(results.messages[i].severity + ': ' + results.messages[i].message);
    }
}

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
            assert(results.messages.length === 2);
            assert(results.messages[0].location === 'MedicationRequest/intent');
            assert(results.messages[0].resourceId === 'Bundle/entry[6]/resource');
            assert(results.messages[0].severity === 'error');
            assert(results.messages[0].message === 'Missing property');
            assert(results.messages[1].location === 'Bundle/signature/type[1]');
            assert(results.messages[1].resourceId === 'father');
            assert(results.messages[1].severity === 'warning');
            assert(results.messages[1].message === 'Code "1.2.840.10065.1.12.1.1" (http://hl7.org/fhir/valueset-signature-type) not found in value set');
        });

        it('should pass medication statement XML', function() {
            var results = fhir.validate(medicationStatementXml);
            assert(results);
            assert(results.valid === true);
            assert(results.messages);
            assert(results.messages.length === 0);
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