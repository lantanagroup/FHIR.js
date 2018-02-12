var Fhir = require('../../fhir');
var fs = require('fs');
var assert = require('../assert');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

describe('STU3: JS -> XML', function() {
    describe('ObjectToXml()', function() {
        it('should create XML Bundle from bundle-transaction.json', function() {
            var bundleTransactionJson = fs.readFileSync('./test/data/stu3/bundle-transaction.json').toString();
            var bundle = JSON.parse(bundleTransactionJson);
            var fhir = new Fhir(Fhir.STU3);
            var xml = fhir.ObjectToXml(bundle);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.equal(doc.documentElement.localName, 'Bundle');
            assert.equal(doc.documentElement.namespaceURI, 'http://hl7.org/fhir');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:id/@value', 'bundle-transaction');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:meta/fhir:lastUpdated/@value', '2014-08-18T01:43:30Z');

            // Patient
            assert.xpathCount(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Patient', 1);
            assert.xpathCount(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Patient/fhir:text/xhtml:div', 1);
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Patient/fhir:name/fhir:use/@value', 'official');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Patient/fhir:name/fhir:family/@value', 'Chalmers');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Patient/fhir:name/fhir:given[1]/@value', 'Peter');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Patient/fhir:name/fhir:given[2]/@value', 'James');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Patient/fhir:gender/@value', 'male');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Patient/fhir:birthDate/@value', '1974-12-25');

            // Parameters
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[8]/fhir:resource/fhir:Parameters/fhir:parameter/fhir:name/@value', 'coding');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[8]/fhir:resource/fhir:Parameters/fhir:parameter/fhir:valueCoding/fhir:system/@value', 'http://loinc.org');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[8]/fhir:resource/fhir:Parameters/fhir:parameter/fhir:valueCoding/fhir:code/@value', '1963-8');
        });

        it('should create XML Bundle from document-example-dischargesummary.json', function() {
            var documentBundleJson = fs.readFileSync('./test/data/stu3/document-example-dischargesummary.json').toString();
            var bundle = JSON.parse(documentBundleJson);
            var fhir = new Fhir(Fhir.STU3);
            var xml = fhir.ObjectToXml(bundle);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.equal(doc.documentElement.localName, 'Bundle');
            assert.equal(doc.documentElement.namespaceURI, 'http://hl7.org/fhir');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:id/@value', 'father');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:meta/fhir:lastUpdated/@value', '2013-05-28T22:12:21Z');

            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:id/@value', '180f219f-97a8-486d-99d9-ed631fe4fc57');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:meta/fhir:lastUpdated/@value', '2013-05-28T22:12:21Z');
            assert.xpathCount(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:text', 1);
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:date/@value', '2013-02-01T12:30:02Z');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:type/fhir:coding/fhir:system/@value', 'http://loinc.org');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:type/fhir:coding/fhir:code/@value', '28655-9');
            assert.xpathEqual(doc, '/fhir:Bundle/fhir:entry[1]/fhir:resource/fhir:Composition/fhir:type/fhir:text', 'Discharge Summary from Responsible Clinician');
        });

        it('should create XML Condition from condition-example2.json', function() {
            var condition2Json = fs.readFileSync('./test/data/stu3/condition-example2.json').toString();
            var condition2 = JSON.parse(condition2Json);
            var fhir = new Fhir(Fhir.STU3);
            var xml = fhir.ObjectToXml(condition2);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.equal(doc.documentElement.localName, 'Condition');
            assert.equal(doc.documentElement.namespaceURI, 'http://hl7.org/fhir');
            assert.xpathEqual(doc, '/fhir:Condition/fhir:id/@value', 'example2');

            assert.xpathEqual(doc, '/fhir:Condition/fhir:code/fhir:text/@value', 'Asthma');

            assert.xpathEqual(doc, '/fhir:Condition/fhir:clinicalStatus/@value', 'active');
            assert.xpathEqual(doc, '/fhir:Condition/fhir:verificationStatus/@value', 'confirmed');
            assert.xpathEqual(doc, '/fhir:Condition/fhir:category/fhir:coding/fhir:system/@value', 'http://hl7.org/fhir/condition-category');
            assert.xpathEqual(doc, '/fhir:Condition/fhir:category/fhir:coding/fhir:code/@value', 'problem-list-item');
            assert.xpathEqual(doc, '/fhir:Condition/fhir:category/fhir:coding/fhir:display/@value', 'Problem List Item');

            assert.xpathCount(doc, '/fhir:Condition/fhir:severity/fhir:coding', 1);
            assert.xpathEqual(doc, '/fhir:Condition/fhir:severity/fhir:coding/fhir:system/@value', 'http://snomed.info/sct');
            assert.xpathEqual(doc, '/fhir:Condition/fhir:severity/fhir:coding/fhir:code/@value', '255604002');
            assert.xpathEqual(doc, '/fhir:Condition/fhir:severity/fhir:coding/fhir:display/@value', 'Mild');

            assert.xpathEqual(doc, '/fhir:Condition/fhir:code/fhir:text/@value', 'Asthma');
            assert.xpathEqual(doc, '/fhir:Condition/fhir:subject/fhir:reference/@value', 'Patient/example');
        });

        it('should create MedicationStatement object with integers', function() {
            var medicationStatementJson = fs.readFileSync('./test/data/stu3/medicationStatement.json').toString();
            var medicationStatement = JSON.parse(medicationStatementJson);
            var fhir = new Fhir(Fhir.STU3);
            var xml = fhir.ObjectToXml(medicationStatement);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.xpathCount(doc, '/fhir:MedicationStatement/fhir:contained/fhir:Medication', 1);

            // identifier
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:identifier/fhir:value/@value', '12345689');
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:identifier/fhir:system/@value', 'http://www.bmc.nl/portal/medstatements');
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:identifier/fhir:use/@value', 'official');

            // status
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:status/@value', 'active');

            // medicationReference
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:medicationReference/fhir:reference/@value', '#med0309');

            // subject
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:subject/fhir:reference/@value', 'Patient/pat1');
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:subject/fhir:display/@value', 'Donald Duck');

            // reasonCode
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:reasonCode/fhir:coding/fhir:system/@value', 'http://snomed.info/sct');
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:reasonCode/fhir:coding/fhir:code/@value', '32914008');
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:reasonCode/fhir:coding/fhir:display/@value', 'Restless Legs');

            // note
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:note/fhir:text/@value', 'Patient indicates they miss the occasional dose');

            // category
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:category/fhir:coding/fhir:system/@value', 'http://hl7.org/fhir/medication-statement-category');
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:category/fhir:coding/fhir:code/@value', 'inpatient');
            assert.xpathEqual(doc, '/fhir:MedicationStatement/fhir:category/fhir:coding/fhir:display/@value', 'Inpatient');
        });
    });
});