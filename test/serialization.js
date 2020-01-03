var Fhir = require('../fhir').Fhir;
var Versions = require('../fhir').Versions;
var ParseConformance = require('../parseConformance').ParseConformance;
var fs = require('fs');
var assert = require('assert');
var _ = require('underscore');
var xml2js = require('xml-js').xml2js;

var bundleTransactionJson = fs.readFileSync('./test/data/stu3/bundle-transaction.json').toString();
var bundleTransactionXml = fs.readFileSync('./test/data/stu3/bundle-transaction.xml').toString();
var documentBundleXml = fs.readFileSync('./test/data/r4/document-example-dischargesummary.xml').toString();
var questionnaireResponseJson = fs.readFileSync('./test/data/r4/QuestionnaireResponse_01.json').toString();
var questionnaireResponseXml = fs.readFileSync('./test/data/r4/QuestionnaireResponse_01.xml').toString();
var condition2Xml = fs.readFileSync('./test/data/r4/condition-example2.xml').toString();
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
var vsSmokeStatusXml = fs.readFileSync('./test/data/r4/ValueSet-us-core-observation-ccdasmokingstatus.xml').toString();
var communicationJson = fs.readFileSync('./test/data/stu3/communication.json').toString();
var implementationGuideXml = fs.readFileSync('./test/data/r4/implementationGuide.xml').toString();

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
    next = next.replace(/\s\/>/g, '/>');
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

    var cleanXml1 = cleanXml(xml);          // in
    var cleanXml2 = cleanXml(lastXml);      // out
    assert.equal(cleanXml2, cleanXml1);
}

function checkJsonHasNumber(json, expectedNumber) {
    var expectedNumberPos = json.indexOf(expectedNumber);
    var firstDigit = expectedNumber[0];
    var lastDigit = expectedNumber[expectedNumber.length - 1];
    assert(expectedNumberPos > 0, "very large decimals kept as JSON numbers");
    assert(json[expectedNumberPos] === firstDigit, "very large decimals kept as JSON numbers");
    assert(json[expectedNumberPos - 1] !== '"', "very large decimals kept as JSON numbers");
    assert.equal(json[expectedNumberPos + expectedNumber.length - 1], lastDigit, "very large decimals kept as JSON numbers");
    assert.equal(json[expectedNumberPos + expectedNumber.length], ",", "very large decimals kept as JSON numbers");
}

function assertArray(obj, expectedLength) {
    assert(obj);
    assert(obj instanceof Array);
    if (arguments.length === 2) {
        assert(obj.length === expectedLength);
    }
}

describe('Serialization', function () {
    var fhir = new Fhir();

    describe('escaping', function() {
        it('should escape invalid xml characters when serializing to XML', function() {
            var valueSet = {
                resourceType: 'ValueSet',
                text: {
                    div: '<div>This is & a test</div>'
                },
                identifier: [{
                    value: 'value & value < value > value'
                }]
            };

            try {
                fhir.objToXml(valueSet);
                assert.fail('Expected objToXml to throw an error about incorrectly formatted xhtml');
            } catch (ex) {
                if (!ex.message.startsWith('The embedded xhtml')) {
                    assert.fail('Expected objToXml to throw a different error');
                }
            }

            valueSet.text.div = '<div>This is &amp; a test</div>';
            var xml = fhir.objToXml(valueSet);
            assert(xml.indexOf('value &amp; value &lt; value &gt; value') > 0);
            assert(xml.indexOf('<text><div xmlns="http://www.w3.org/1999/xhtml">This is &amp; a test</div></text>') > 0);
        });

        it('should un-escape invalid xml characters when serializing to an object', function() {
            var xml = '<?xml version="1.0" encoding="UTF-8"?><ValueSet xmlns="http://hl7.org/fhir"><text><div xmlns="http://www.w3.org/1999/xhtml">This is &amp; a test</div></text><identifier><value value="value &amp; value &lt; value &gt; value"/></identifier></ValueSet>';
            var obj = fhir.xmlToObj(xml);
            assert.equal(obj.identifier[0].value, 'value & value < value > value');
            assert.equal(obj.text.div, '<div xmlns="http://www.w3.org/1999/xhtml">This is &amp; a test</div>');
        });

        it('should escape invalid xml characters in the xhtml', function() {
            var obj = fhir.xmlToObj(vsSmokeStatusXml.replace(/\r/g, ''));
            var expectedXhtml = '<div xmlns="http://www.w3.org/1999/xhtml" lang="en-US"><h2>Smoking Status</h2><div><p>This value set\n' +
                '          indicates the current smoking status of a patient.</p></div><p><b>Copyright Statement:</b> This value set includes content from SNOMED CT, which is\n' +
                '        copyright 2002+ International Health Terminology Standards Development Organisation\n' +
                '        (IHTSDO), and distributed by agreement between IHTSDO and HL7. Implementer use of SNOMED CT\n' +
                '        is not covered by this agreement</p><p>This value set includes codes from the following code\n' +
                '        systems:</p><ul><li>Include these codes as defined in <a href="http://www.snomed.org/"><code>http://snomed.info/sct</code></a><table class="none"><tr><td style="white-space:nowrap"><b>Code</b></td><td><b>Display</b></td></tr><tr><td><a href="http://browser.ihtsdotools.org/?perspective=full&amp;conceptId1=449868002">449868002</a></td><td>Current every day smoker</td><td/></tr><tr><td><a href="http://browser.ihtsdotools.org/?perspective=full&amp;conceptId1=428041000124106">428041000124106</a></td><td>Current some day smoker</td><td/></tr><tr><td><a href="http://browser.ihtsdotools.org/?perspective=full&amp;conceptId1=8517006">8517006</a></td><td>Former smoker</td><td/></tr><tr><td><a href="http://browser.ihtsdotools.org/?perspective=full&amp;conceptId1=266919005">266919005</a></td><td>Never smoker</td><td/></tr><tr><td><a href="http://browser.ihtsdotools.org/?perspective=full&amp;conceptId1=77176002">77176002</a></td><td>Smoker, current status unknown</td><td/></tr><tr><td><a href="http://browser.ihtsdotools.org/?perspective=full&amp;conceptId1=266927001">266927001</a></td><td>Unknown if ever smoked</td><td/></tr><tr><td><a href="http://browser.ihtsdotools.org/?perspective=full&amp;conceptId1=428071000124103">428071000124103</a></td><td>Current Heavy tobacco smoker</td><td/></tr><tr><td><a href="http://browser.ihtsdotools.org/?perspective=full&amp;conceptId1=428061000124105">428061000124105</a></td><td>Current Light tobacco smoker</td><td/></tr></table></li></ul></div>';
            assert.equal(obj.text.div, expectedXhtml);
        });

        it('should handle already-escaped values in an object', function() {
            var obj = {"resourceType":"Observation","id":"f002","text":{"status":"generated","div":"<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><b> Generated Narrative with Details</b></p><p><b> id</b> : f002</p><p><b> identifier</b> : 6324 (OFFICIAL)</p><p><b> status</b> : final</p><p><b> code</b> : Base excess in Blood by calculation <span> (Details : {LOINC code '11555-0' = 'Base excess in Blood by calculation', given as 'Base\r\n           excess in Blood by calculation'})</span></p><p><b> subject</b> : <a> P. van de Heuvel</a></p><p><b> effective</b> : 02/04/2013 10:30:10 AM --&gt; 05/04/2013 10:30:10 AM</p><p><b> issued</b> : 03/04/2013 3:30:10 PM</p><p><b> performer</b> : <a> A. Langeveld</a></p><p><b> value</b> : 12.6 mmol/l<span>  (Details: UCUM code mmol/L = 'mmol/L')</span></p><p><b> interpretation</b> : High <span> (Details : {http://hl7.org/fhir/v2/0078 code 'H' = 'High', given as 'High'})</span></p><h3> ReferenceRanges</h3><table><tr><td> -</td><td><b> Low</b></td><td><b> High</b></td></tr><tr><td> *</td><td> 7.1 mmol/l<span>  (Details: UCUM code mmol/L = 'mmol/L')</span></td><td> 11.2 mmol/l<span>  (Details: UCUM code mmol/L = 'mmol/L')</span></td></tr></table></div>"},"identifier":[{"use":"official","system":"http://www.bmc.nl/zorgportal/identifiers/observations","value":"6324"}],"status":"final","code":{"coding":[{"system":"http://loinc.org","code":"11555-0","display":"Base excess in Blood by calculation"}]},"subject":{"reference":"Patient/f001","display":"P. van de Heuvel"},"effectivePeriod":{"start":"2013-04-02T10:30:10+01:00","end":"2013-04-05T10:30:10+01:00"},"issued":"2013-04-03T15:30:10+01:00","performer":[{"reference":"Practitioner/f005","display":"A. Langeveld"}],"valueQuantity":{"value":"-1.00","unit":"mmol/l","system":"http://unitsofmeasure.org","code":"mmol/L"},"interpretation":{"coding":[{"system":"http://hl7.org/fhir/v2/0078","code":"H","display":"High"}]},"referenceRange":[{"low":{"value":"7.1","unit":"mmol/l","system":"http://unitsofmeasure.org","code":"mmol/L"},"high":{"value":"11.2","unit":"mmol/l","system":"http://unitsofmeasure.org","code":"mmol/L"}}]};
            var xml = fhir.objToXml(obj);
        });
    });

    describe('Extensions', function () {
        it('should serialize extensions for primitive data types in JSON', function () {
            var resource = {
                resourceType: 'Observation',
                status: 'test',
                _status: {
                    id: 'super-id',
                    extension: [{
                        url: 'http://test.com',
                        valueString: 'blah'
                    }]
                }
            };

            var xml = fhir.objToXml(resource);
            var expected = '<?xml version="1.0" encoding="UTF-8"?><Observation xmlns="http://hl7.org/fhir"><status id="super-id" value="test"><extension url="http://test.com"><valueString value="blah"/></extension></status></Observation>';
            assert.equal(xml, expected);
        });

        it('should serialize extensions for an array of primitive data types in JSON', function () {
            var resource = {
                resourceType: 'ImplementationGuide',
                fhirVersion: ['1.0', '1.1'],
                _fhirVersion: [
                    null,
                    {
                        id: 'super-id',
                        extension: [{
                            url: 'http://test.com',
                            valueString: 'blah'
                        }]
                    }
                ]
            };

            var xml = fhir.objToXml(resource);
            var expected = '<?xml version="1.0" encoding="UTF-8"?><ImplementationGuide xmlns="http://hl7.org/fhir"><fhirVersion value="1.0"/><fhirVersion id="super-id" value="1.1"><extension url="http://test.com"><valueString value="blah"/></extension></fhirVersion></ImplementationGuide>';
            assert.equal(xml, expected);
        });

        it('should serialize extensions for an array of primitive data types in XML', function () {
            var xml = '<?xml version="1.0" encoding="UTF-8"?><ImplementationGuide xmlns="http://hl7.org/fhir"><fhirVersion value="1.0"/><fhirVersion id="super-id" value="1.1"><extension url="http://test.com"><valueString value="blah"/></extension></fhirVersion></ImplementationGuide>';
            var obj = fhir.xmlToObj(xml);
            assert(obj._fhirVersion);
            assert(obj._fhirVersion instanceof Array);
            assert.equal(obj._fhirVersion.length, 2);
            assert.equal(obj._fhirVersion[0], null);
            assert(obj._fhirVersion[1]);
            assert.equal(obj._fhirVersion[1].id, 'super-id');
            assert(obj._fhirVersion[1].extension);
            assert(obj._fhirVersion[1].extension instanceof Array);
            assert.equal(obj._fhirVersion[1].extension.length, 1);
            assert.equal(obj._fhirVersion[1].extension[0].url, 'http://test.com');
            assert.equal(obj._fhirVersion[1].extension[0].valueString, 'blah');
        });

        it('should serialize extensions for a single primitive data type in XML', function () {
            var xml = '<?xml version="1.0" encoding="UTF-8"?><Observation xmlns="http://hl7.org/fhir"><status id="super-id" value="test"><extension url="http://test.com"><valueString value="blah"/></extension></status></Observation>';
            var obj = fhir.xmlToObj(xml);
            assert(obj._status);
            assert.equal(obj._status.id, 'super-id');
            assert.equal(obj._status.extension.length, 1);
            assert.equal(obj._status.extension[0].url, 'http://test.com');
            assert.equal(obj._status.extension[0].valueString, 'blah');
        });
    });

    describe('XML bi-directional', function () {
        it('should serialize value set xml', function() {
            biDirectionalTest(vsSmokeStatusXml);
        });

        it('should serialize structure definition xml', function() {
            biDirectionalTest(bmiProfileXml);
        });

        it('should serialize bundle xml', function () {
            biDirectionalTest(bundleTransactionXml);
        });

        it('should serialize implementation guide xml', function() {
            biDirectionalTest(implementationGuideXml);
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

        it('should serialize observation 1 xml', function () {
            biDirectionalTest(observationSlightlyDehydratedXml);
        });

        it('should serialize observation 2 xml', function () {
            biDirectionalTest(observationF002excessNegativeXml);
        });

        it('should serialize observation 3 xml', function () {
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
            assert.strictEqual(obj.contained[0].ingredient[0].strength.numerator.value, "501", "xmlToObj keeps decimals as strings...");
            assert.strictEqual(obj.contained[0].ingredient[1].strength.numerator.value, "25.0", "xmlToObj keeps decimals as strings...");

            var json = fhir.xmlToJson(medicationStatementXml);
            checkJsonHasNumber(json, "501");
            checkJsonHasNumber(json, "25.0");
            var jsonAsObj = JSON.parse(json);
            assert.strictEqual(jsonAsObj.contained[0].ingredient[0].strength.numerator.value, 501, "xmlToJson converts decimals to numbers");

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
            var ConvertToJs = require('../convertToJs').ConvertToJs;
            var j = new ConvertToJs();
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
        it('should convert .id to @id', function() {
            var stu3Parser = new ParseConformance(false, Versions.STU3);
            stu3Parser.parseBundle(require('./data/stu3/schema/profiles-resources.json'));
            stu3Parser.parseBundle(require('./data/stu3/schema/profiles-types.json'));
            var stu3Fhir = new Fhir(stu3Parser);
            var xmlDoc = stu3Fhir.jsonToXml(communicationJson);
            var xml = xml2js(xmlDoc);

            assert(xml);
            assert(xml.elements);
            assert.equal(xml.elements.length, 1);

            const resourceEle = xml.elements[0];
            assert(resourceEle.elements);

            const idEle = resourceEle.elements[0];
            assert(idEle.attributes);
            assert.equal('id', idEle.name);                                                 // Communication.id
            assert.equal('rr-communication-single-single', idEle.attributes.value);

            const payload1Ele = resourceEle.elements[11];
            assert(payload1Ele.elements);
            assert(payload1Ele.attributes);
            assert.equal('reportability-response-summary', payload1Ele.attributes.id);      // payload[1]/@id

            const payload2Ele = resourceEle.elements[12];
            assert(payload2Ele.elements);
            assert(payload2Ele.attributes);
            assert.equal('relevant-reportable-condition', payload2Ele.attributes.id);       // payload[2]/@id

            const payload3Ele = resourceEle.elements[13];
            assert(payload3Ele.elements);
            assert(payload3Ele.attributes);
            assert.equal('eicr-information', payload3Ele.attributes.id);
            assert(payload3Ele.elements);
            assert.equal(3, payload3Ele.elements.length);

            const extension1Ele = payload3Ele.elements[0];
            assert(extension1Ele.attributes);
            assert.equal('eicr-processing-status', extension1Ele.attributes.id);
        });

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
            assertArray(questionnaireResponseXmlObj.elements, 7);
            assert(questionnaireResponseXmlObj.elements[6].name === 'item');
            assertArray(questionnaireResponseXmlObj.elements[6].elements, 12);
            assert(questionnaireResponseXmlObj.elements[6].elements[1].name === 'item');
            assertArray(questionnaireResponseXmlObj.elements[6].elements[1].elements, 2);
            assert(questionnaireResponseXmlObj.elements[6].elements[1].elements[0].name === 'linkId');
            assert(questionnaireResponseXmlObj.elements[6].elements[1].elements[1].name === 'answer');
        });
    });
});