var Fhir = require('../../fhir');
var fs = require('fs');
var assert = require('../assert');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

describe('DSTU2: JS -> XML', function() {
    describe('ObjectToXml()', function() {
        it('should create XML Bundle from bundle-transaction.json', function() {
            var bundleTransactionJson = fs.readFileSync('./test/data/dstu2/bundle-transaction.json').toString();
            var bundle = JSON.parse(bundleTransactionJson);
            var fhir = new Fhir(Fhir.DSTU2);
            var xml = fhir.ObjectToXml(bundle);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.equal(doc.documentElement.localName, 'Bundle');
            assert.equal(doc.documentElement.namespaceURI, 'http://hl7.org/fhir');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:id/@value', 'bundle-transaction');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:meta/fhir:lastUpdated/@value', '2014-08-18T01:43:30Z');

            // Patients
            assert.xpathCount(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Patient', 1);
            assert.xpathCount(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Patient/fhir:text/xhtml:div', 1);

            // Parameters
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[8]/fhir:resource/fhir:Parameters/fhir:parameter/fhir:name/@value', 'coding');
            assert.xpathCount(doc, '/fhir:Bundle/fhir:entry[8]/fhir:resource/fhir:Parameters/fhir:parameter/fhir:valueCoding', 1);
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[8]/fhir:resource/fhir:Parameters/fhir:parameter/fhir:valueCoding/fhir:system/@value', 'http://loinc.org');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[8]/fhir:resource/fhir:Parameters/fhir:parameter/fhir:valueCoding/fhir:code/@value', '1963-8');
        });

        it('should create XML Bundle from document-example-dischargesummary.json', function() {
            var documentBundleJson = fs.readFileSync('./test/data/dstu2/document-example-dischargesummary.json').toString();
            var bundle = JSON.parse(documentBundleJson);
            var fhir = new Fhir(Fhir.DSTU2);
            var xml = fhir.ObjectToXml(bundle);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.equal(doc.documentElement.localName, 'Bundle');
            assert.equal(doc.documentElement.namespaceURI, 'http://hl7.org/fhir');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:id/@value', 'father');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:meta/fhir:lastUpdated/@value', '2013-05-28T22:12:21Z');

            assert.xpathCount(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:extension', 2);
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:extension[1]/@url', 'http://testserver.com/fhir/Profile/extension1');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:extension[1]/fhir:valueReference/fhir:display/@value', 'Test Patient');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:extension[1]/fhir:valueReference/fhir:reference/@value', 'http://testserver.com/fhir/Patient/1');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:extension[2]/@url', 'http://fhir.js/extension3');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:extension[2]/fhir:valueCodeableConcept/fhir:coding/fhir:system/@value', 'http://fhir.js/cs/1');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:extension[2]/fhir:valueCodeableConcept/fhir:coding/fhir:code/@value', 'test_code');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:extension[2]/fhir:valueCodeableConcept/fhir:coding/fhir:display/@value', 'Test Code');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:extension[2]/fhir:valueCodeableConcept/fhir:text/@value', 'Test Code Display');

            assert.xpathCount(doc, '/fhir:Bundle/fhir:entry[6]/fhir:resource/fhir:MedicationOrder/fhir:dosageInstruction/fhir:timing', 1);
            assert.xpathCount(doc, '/fhir:Bundle/fhir:entry[6]/fhir:resource/fhir:MedicationOrder/fhir:dosageInstruction/fhir:timing/fhir:repeat', 1);
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[6]/fhir:resource/fhir:MedicationOrder/fhir:dosageInstruction/fhir:timing/fhir:repeat/fhir:frequency/@value', '2');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[6]/fhir:resource/fhir:MedicationOrder/fhir:dosageInstruction/fhir:timing/fhir:repeat/fhir:period/@value', '1');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[6]/fhir:resource/fhir:MedicationOrder/fhir:dosageInstruction/fhir:timing/fhir:repeat/fhir:periodUnits/@value', 'd');

            assert.xpathCount(doc, '/fhir:Bundle/fhir:signature', 1);
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:signature/fhir:type/fhir:system/@value', 'http://hl7.org/fhir/valueset-signature-type');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:signature/fhir:type/fhir:code/@value', '1.2.840.10065.1.12.1.1');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:signature/fhir:type/fhir:display/@value', 'AuthorID');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:signature/fhir:when/@value', '2015-08-31T07:42:33+10:00');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:signature/fhir:whoReference/fhir:reference/@value', 'Device/software');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:signature/fhir:contentType/@value', 'image/jpg');
            assert.xpathCount(doc, '/fhir:Bundle/fhir:signature/fhir:blob/@value', 1);
        });

        it('should create XML Condition from condition-example2.json', function() {
            var condition2Json = fs.readFileSync('./test/data/dstu2/condition-example2.json').toString();
            var condition2 = JSON.parse(condition2Json);
            var fhir = new Fhir(Fhir.DSTU2);
            var xml = fhir.ObjectToXml(condition2);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.equal(doc.documentElement.localName, 'Condition');
            assert.equal(doc.documentElement.namespaceURI, 'http://hl7.org/fhir');
            assert.xpathEqual(doc, '/fhir:Condition/fhir:id/@value', 'example2');

            assert.xpathEqual(doc, '/fhir:Condition/fhir:code/fhir:text/@value', 'Asthma');

            assert.xpathEqual(doc, '/fhir:Condition/fhir:clinicalStatus/@value', 'active');
            assert.xpathEqual(doc, '/fhir:Condition/fhir:verificationStatus/@value', 'confirmed');
            assert.xpathEqual(doc, '/fhir:Condition/fhir:onsetDateTime/@value', '2012-11-12');

            assert.xpathCount(doc, '/fhir:Condition/fhir:severity/fhir:coding', 1);
            assert.xpathEqual(doc, '/fhir:Condition/fhir:severity/fhir:coding/fhir:system/@value', 'http://snomed.info/sct');
            assert.xpathEqual(doc, '/fhir:Condition/fhir:severity/fhir:coding/fhir:code/@value', '255604002');
            assert.xpathEqual(doc, '/fhir:Condition/fhir:severity/fhir:coding/fhir:display/@value', 'Mild');
        });
    });
});