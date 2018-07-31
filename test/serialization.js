var Fhir = require('../fhir');
var fs = require('fs');
var assert = require('assert');
var _ = require('underscore');
var xml2js = require('xml-js').xml2js;

var bundleTransactionJson = fs.readFileSync('./test/data/stu3/bundle-transaction.json').toString();
var bundleTransactionXml = fs.readFileSync('./test/data/stu3/bundle-transaction.xml').toString();
var documentBundleXml = fs.readFileSync('./test/data/r4/document-example-dischargesummary.xml').toString();
var questionnaireResponseJson = fs.readFileSync('./test/data/r4/QuestionnaireResponse_01.json').toString();
var questionnaireResponseXml = fs.readFileSync('./test/data/r4/QuestionnaireResponse_01.xml').toString();
var condition2Xml = fs.readFileSync('./test/data/stu3/condition-example2.xml').toString();
var medicationStatementXml = fs.readFileSync('./test/data/r4/medicationStatement.xml').toString();
var observationF002excessXml = fs.readFileSync('./test/data/stu3/observation-example-f002-excess.xml').toString();
var observationF002excessNegativeXml = fs.readFileSync('./test/data/stu3/observation-example-f002-excess-negative.xml').toString();
var observationSlightlyDehydratedXml = fs.readFileSync('./test/data/stu3/observation-slightly-dehydrated.xml').toString();
var operationDefinitionXml = fs.readFileSync('./test/data/stu3/OperationDefinition_example.xml').toString();
var dstu2ConformanceXml = fs.readFileSync('./test/data/dstu2/conformance.xml').toString();
var dstu2ConformanceJson = fs.readFileSync('./test/data/dstu2/conformance.json').toString();
var patient1Xml = fs.readFileSync('./test/data/stu3/patient-crucible-1.xml').toString();
var patient2Xml = fs.readFileSync('./test/data/stu3/patient-crucible-2.xml').toString();
var bmiProfileXml = fs.readFileSync('./test/data/r4/bmi.profile.xml').toString();

/**
 * Cleans up XML to remove as much un-necessary characters/info as possible so
 * that comparing two large xml files succeeds.
 * @param {string} xml
 * @returns {string}
 */
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

/**
 * Serializes the specified XML to a JS obj, then back to XML again. Does this twice for posterity.
 * Asserts that the starting xml and ending xml is exactly the same.
 * @param xml
 */
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

function checkJsonHasNumber(json, expectedNumber) {
    var expectedNumberPos = json.indexOf(expectedNumber)
    var firstDigit = expectedNumber[0]
    var lastDigit = expectedNumber[expectedNumber.length - 1]
    assert(expectedNumberPos > 0, "very large decimals kept as JSON numbers")
    assert(json[expectedNumberPos] === firstDigit, "very large decimals kept as JSON numbers")
    assert(json[expectedNumberPos - 1] !== '"', "very large decimals kept as JSON numbers")
    assert.equal(json[expectedNumberPos + expectedNumber.length - 1], lastDigit, "very large decimals kept as JSON numbers")
    assert.equal(json[expectedNumberPos + expectedNumber.length], ",", "very large decimals kept as JSON numbers")
}

function assertArray(obj, expectedLength) {
    assert(obj);
    assert(obj instanceof Array);
    if (arguments.length === 2) {
        assert(obj.length === expectedLength);
    }
}

describe('Serialization', function () {
    describe('XML bi-directional', function () {
        it('should serialize structure definition xml', function() {
            biDirectionalTest(bmiProfileXml);
        });

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
                assert(ex.message === 'Unknown resource type: Conformance');
            }

            try {
                var xmlFromJson = fhir.jsonToXml(dstu2ConformanceJson);
                throw 'Expected jsonToXml to throw an exception';
            } catch (ex) {
                assert(ex.message === 'Unknown resource type: Conformance');
            }
        });
    });

    describe('XML one-way', function () {
        it('should correctly type output json', function () {
            var fhir = new Fhir();
            var obj = fhir.xmlToObj(patient1Xml);
            assert.strictEqual(obj.active, true, "booleans should be converted from strings");
            assert.strictEqual(obj.photo[0].hash, "sukclAeJAsqUMyvVUHstQw==", "base64 should be kept as a string");

            obj = fhir.xmlToObj(medicationStatementXml);
            // decimals not yet supported as JavaScript objects so are kept as strings
            assert.strictEqual(obj.contained[0].ingredient[0].amount.numerator.value, "501", "xmlToObj keeps decimals as strings...");
            assert.strictEqual(obj.contained[0].ingredient[1].amount.numerator.value, "25.0", "xmlToObj keeps decimals as strings...");

            var json = fhir.xmlToJson(medicationStatementXml);
            checkJsonHasNumber(json, "501");
            checkJsonHasNumber(json, "25.0");
            var jsonAsObj = JSON.parse(json);
            assert.strictEqual(jsonAsObj.contained[0].ingredient[0].amount.numerator.value, 501, "xmlToJson converts decimals to numbers");

            // even very large decimals should be preserved as numbers
            json = fhir.xmlToJson(observationSlightlyDehydratedXml);
            checkJsonHasNumber(json, "1206401306298222237039542544");
            checkJsonHasNumber(json, "1206401306298222237039542547");
            checkJsonHasNumber(json, "1349918422375333611314993132");

            obj = fhir.xmlToObj(questionnaireResponseXml);
            assert.strictEqual(obj.total, 4, "integers should be converted")
        });

        it('should allow negative decimals', function () {
            var fhir = new Fhir();
            var obj1 = fhir.xmlToObj(observationF002excessXml);
            var obj2 = fhir.xmlToObj(observationF002excessNegativeXml);
            assert.strictEqual(obj1.valueQuantity.value, "12.6");
            assert.strictEqual(obj2.valueQuantity.value, "-1.00");

            var json1 = fhir.xmlToJson(observationF002excessXml);
            var json2 = fhir.xmlToJson(observationF002excessNegativeXml);
            assert.strictEqual(JSON.parse(json1).valueQuantity.value, 12.6);
            assert.strictEqual(JSON.parse(json2).valueQuantity.value, -1.00);
            checkJsonHasNumber(json1, "12.6");
            checkJsonHasNumber(json2, "-1.00");
        });

        it('maxLengthOfDs should work correctly', function () {
            var ConvertToJS = require('../convertToJs');
            var j = new ConvertToJS();
            var tenDs = "DDDDDDDDDD";
            assert.equal(j.maxLengthOfDs({}), 0);
            assert.equal(j.maxLengthOfDs(tenDs), 10);
            assert.equal(j.maxLengthOfDs({"a": tenDs}), 10);
            assert.equal(j.maxLengthOfDs({"a": tenDs, "b": tenDs + tenDs}), 20);
            assert.equal(j.maxLengthOfDs({"a": tenDs, "b": tenDs, "c": {"d": tenDs + tenDs}}), 20);
            assert.equal(j.maxLengthOfDs({"a": tenDs, "b": 55, "c": {"d": tenDs + tenDs}}), 20);
            assert.equal(j.maxLengthOfDs({[tenDs + tenDs + tenDs]: tenDs, "b": 55, "c": {"d": tenDs + tenDs}}), 30)
        });

        it('should correctly parse crucible\'s patient', function () {
            var fhir = new Fhir();
            var obj = fhir.xmlToObj(patient2Xml);
        });

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
            var bundleTransaction = JSON.parse(bundleTransactionJson);
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