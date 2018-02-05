var Fhir = require('../fhir');
var fs = require('fs');
var assert = require('assert');

var bundleTransactionJson = fs.readFileSync('./test/data/stu3/bundle-transaction.json').toString();
var bundleTransaction = JSON.parse(bundleTransactionJson);
var documentBundleJson = fs.readFileSync('./test/data/stu3/document-example-dischargesummary.json').toString();
var condition2Json = fs.readFileSync('./test/data/stu3/condition-example2.json').toString();
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
        it('should create an error', function() {
            var resource = {
                resourceType: 'Observation',
                badProperty: 'asdf',
                referenceRange: {
                    low: 2
                }
            };

            var results = fhir.validate(resource);
            assert(results);
        });

        it('should validate bundle', function() {
            var results = fhir.validate(bundleTransactionXml);
            assert(results);

            //printResults(results);
        });
    });
});