var Fhir = require('../fhir');
var fs = require('fs');
var _ = require('underscore');
var assert = require('assert');

var capabilityStatementJson = fs.readFileSync('./test/data/stu3/capabilitystatement-example.json').toString();
var stu3StructureDefinitionJson = fs.readFileSync('./test/data/stu3/structureDefinition.json').toString('utf8');
var r4StructureDefinitionJson = fs.readFileSync('./test/data/r4/structureDefinition.json').toString('utf8');
var badDocumentBundleXml = fs.readFileSync('./test/data/r4/bad-document-example-dischargesummary.xml').toString();
var operationDefinitionJson = fs.readFileSync('./test/data/stu3/OperationDefinition_example.json').toString();
var bundleTransactionXml = fs.readFileSync('./test/data/stu3/bundle-transaction.xml').toString();
var medicationStatementXml = fs.readFileSync('./test/data/r4/medicationStatement.xml').toString();
var condition2Json = fs.readFileSync('./test/data/stu3/condition-example2.json').toString();
var immunizationExampleJson = fs.readFileSync('./test/data/r4/immunization-example.json').toString('utf8');
var auditEventExampleJson = fs.readFileSync('./test/data/r4/audit-event-example.json').toString('utf8');

describe('Validation', function () {
    describe('JS', function () {
        var fhir = new Fhir();
        var stu3Parser = new Fhir.ParseConformance(false, Fhir.ParseConformance.VERSIONS.STU3);
        var stu3Fhir = new Fhir(stu3Parser);

        it('should validate STU3 structure definition', function() {
            var structureDefinition = JSON.parse(stu3StructureDefinitionJson);
            var results = stu3Fhir.validate(structureDefinition);
            assert(results.valid === true);
            assert(results.messages);
            assert(results.messages.length === 0);
        });

        it('should validate R4 structure definition', function() {
            var structureDefinition = JSON.parse(r4StructureDefinitionJson);
            var results = fhir.validate(structureDefinition);
            assert(results.valid === true);
            assert(results.messages);
            assert(results.messages.length === 0);
        });

        it('should validate STU3 structure definition, erroring on representation', function() {
            var structureDefinition = {
                resourceType: 'StructureDefinition',
                url: 'http://test.com/sd',
                id: 'test',
                name: 'Test',
                status: 'draft',
                abstract: false,
                type: 'Composition',
                kind: 'resource',
                differential: {
                    element: [{
                        id: 'Composition.meta',
                        path: 'Composition.meta',
                        representation: 'typeAttr'
                    }]
                }
            };
            var results = fhir.validate(structureDefinition);

            assert(results);
            assert(results.valid === false);
            assert(results.messages);
            assert(results.messages.length === 1);
            assert(results.messages[0].location === 'StructureDefinition.differential.element[0].representation');
            assert(results.messages[0].message === 'Property is not an array');
            assert(results.messages[0].resourceId === 'Composition.meta');
            assert(results.messages[0].severity === 'error');
        });

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
            var condition2 = JSON.parse(condition2Json);
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