var Fhir = require('../fhir');
var fs = require('fs');
var assert = require('./assert');
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

describe('DSTU1: JS -> XML', function() {
    describe('ObjectToXml()', function() {
        it('should create XML Composition', function() {
            var compositionJson = fs.readFileSync('./test/data/dstu1/composition.json').toString();
            var composition = JSON.parse(compositionJson);
            var fhir = new Fhir(Fhir.DSTU1);
            var xml = fhir.ObjectToXml(composition);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.equal(doc.documentElement.nodeName, 'Composition');
            assert.xpathEqual(doc, '/fhir:Composition/@id', '234234');

            // assert extension
            assert.xpathCount(doc, '/fhir:Composition/fhir:extension', 3);
            assert.xpathEqual(doc, '/fhir:Composition/fhir:extension[1]/@url', 'http://fhir.js/extension');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:extension[1]/fhir:valueCode/@value', 'some_code');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:extension[2]/@url', 'http://fhir.js/extension2');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:extension[2]/fhir:valueResource/fhir:reference/@value', 'http://testserver.com/fhir/Patient/1');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:extension[2]/fhir:valueResource/fhir:display/@value', 'Test Patient');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:extension[3]/@url', 'http://fhir.js/extension3');
            assert.xpathCount(doc, '/fhir:Composition/fhir:extension[3]/fhir:valueCodeableConcept/fhir:coding', 1);
            assert.xpathEqual(doc, '/fhir:Composition/fhir:extension[3]/@url', 'http://fhir.js/extension3');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:extension[3]/fhir:valueCodeableConcept/fhir:coding/fhir:system/@value', 'http://fhir.js/cs/1');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:extension[3]/fhir:valueCodeableConcept/fhir:coding/fhir:code/@value', 'test_code');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:extension[3]/fhir:valueCodeableConcept/fhir:coding/fhir:display/@value', 'Test Code');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:extension[3]/fhir:valueCodeableConcept/fhir:text/@value', 'Test Code Display');

            // assert language, date, title, status
            assert.xpathEqual(doc, '/fhir:Composition/fhir:language/@value', 'en');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:date/@value', '2013-02-29T10:33:17-07:00');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:title/@value', 'Continuity of Care Document (CCD)');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:status/@value', 'preliminary');

            // assert confidentiality
            assert.xpathCount(doc, '/fhir:Composition/fhir:confidentiality', 1);
            assert.xpathEqual(doc, '/fhir:Composition/fhir:confidentiality/fhir:system/@value', 'urn:oid:2.16.840.1.113883.5.25');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:confidentiality/fhir:code/@value', 'N');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:confidentiality/fhir:display/@value', 'Normal');

            // assert subject
            assert.xpathCount(doc, '/fhir:Composition/fhir:subject', 1);
            assert.xpathEqual(doc, '/fhir:Composition/fhir:subject/fhir:reference/@value', 'http://localhost:8080/fhir/Patient/c65adf01-b514-49ca-b281-ce817043a189/_history/f5f132f1-8733-4168-9c9a-f1404d61678f');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:subject/fhir:display/@value', 'Doe, Jane');

            // assert event
            assert.xpathEqual(doc, '/fhir:Composition/fhir:event/fhir:code/fhir:coding/fhir:system/@value', 'http://hl7.org/fhir/v3/ActClass');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:event/fhir:code/fhir:coding/fhir:code/@value', 'PCPR');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:event/fhir:period/fhir:start/@value', '2012-09-08T00:00:00-04:00');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:event/fhir:period/fhir:end/@value', '2012-09-15T00:00:00-04:00');

            // assert sections
            assert.xpathCount(doc, '/fhir:Composition/fhir:section', 5);
            assert.xpathEqual(doc, '/fhir:Composition/fhir:section[1]/fhir:title/@value', 'Allergies');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:section[1]/fhir:code/fhir:coding/fhir:system/@value', 'urn:oid:2.16.840.1.113883.6.1');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:section[1]/fhir:code/fhir:coding/fhir:code/@value', '48765-2');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:section[1]/fhir:code/fhir:coding/fhir:display/@value', 'Allergies, adverse reactions, alerts');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:section[1]/fhir:content/fhir:reference/@value', 'http://localhost:8080/fhir/List/e4f044a1-946b-4237-97e7-d97e9e29984e');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:section[1]/fhir:content/fhir:display/@value', 'Allergies, adverse reactions, alerts (0 entries)');
        });

        it('should create XML Patient', function() {
            var patientJson = fs.readFileSync('./test/data/dstu1/patient.json').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            var xml = fhir.JsonToXml(patientJson);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.equal(doc.documentElement.nodeName, 'Patient');

            // assert child element order for Patient
            assert.xpathNodeName(doc, '/fhir:Patient/*[1]', 'text');
            assert.xpathNodeName(doc, '/fhir:Patient/*[2]', 'identifier');
            assert.xpathNodeName(doc, '/fhir:Patient/*[3]', 'name');
            assert.xpathNodeName(doc, '/fhir:Patient/*[4]', 'gender');
            assert.xpathNodeName(doc, '/fhir:Patient/*[5]', 'birthDate');
            assert.xpathNodeName(doc, '/fhir:Patient/*[6]', 'address');
            assert.xpathNodeName(doc, '/fhir:Patient/*[7]', 'photo');
            assert.xpathNodeName(doc, '/fhir:Patient/*[8]', 'contact');
            assert.xpathNodeName(doc, '/fhir:Patient/*[9]', 'managingOrganization');
            assert.xpathNodeName(doc, '/fhir:Patient/*[10]', 'link');
            assert.xpathNodeName(doc, '/fhir:Patient/*[11]', 'active');

            // assert child element order for Patient.contact
            assert.xpathNodeName(doc, '/fhir:Patient/fhir:contact/*[1]', 'relationship');
            assert.xpathNodeName(doc, '/fhir:Patient/fhir:contact/*[2]', 'name');
            assert.xpathNodeName(doc, '/fhir:Patient/fhir:contact/*[3]', 'telecom');
        });

        it('should create XML Observation (with valueQuantity)', function() {
            var observation1Json = fs.readFileSync('./test/data/dstu1/observation1.json').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            var xml = fhir.JsonToXml(observation1Json);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueQuantity/fhir:value/@value', '185');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueQuantity/fhir:units/@value', 'lbs');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueQuantity/fhir:system/@value', 'http://unitsofmeasure.org');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueQuantity/fhir:code/@value', '[lb_av]');
        });

        it('should create XML Observation (with valueRange)', function() {
            var observation2Json = fs.readFileSync('./test/data/dstu1/observation2.json').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            var xml = fhir.JsonToXml(observation2Json);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRange/fhir:low/fhir:value/@value', '185');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRange/fhir:low/fhir:units/@value', 'lbs');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRange/fhir:low/fhir:system/@value', 'http://unitsofmeasure.org');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRange/fhir:low/fhir:code/@value', '[lb_av]');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRange/fhir:high/fhir:value/@value', '185');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRange/fhir:high/fhir:units/@value', 'lbs');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRange/fhir:high/fhir:system/@value', 'http://unitsofmeasure.org');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRange/fhir:high/fhir:code/@value', '[lb_av]');
        });

        it('should create XML Observation (with valueRatio)', function() {
            var observation3Json = fs.readFileSync('./test/data/dstu1/observation3.json').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            var xml = fhir.JsonToXml(observation3Json);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRatio/fhir:numerator/fhir:value/@value', '185');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRatio/fhir:numerator/fhir:units/@value', 'lbs');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRatio/fhir:numerator/fhir:system/@value', 'http://unitsofmeasure.org');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRatio/fhir:numerator/fhir:code/@value', '[lb_av]');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRatio/fhir:denominator/fhir:value/@value', '185');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRatio/fhir:denominator/fhir:units/@value', 'lbs');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRatio/fhir:denominator/fhir:system/@value', 'http://unitsofmeasure.org');
            assert.xpathEqual(doc, '/fhir:Observation/fhir:valueRatio/fhir:denominator/fhir:code/@value', '[lb_av]');
        });

        it('should create XML MedicationAdministration', function() {
            var medicationAdministrationJson = fs.readFileSync('./test/data/dstu1/medicationAdministration.json').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            var xml = fhir.JsonToXml(medicationAdministrationJson);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.xpathEqual(doc, '/fhir:MedicationAdministration/fhir:dosage/fhir:route/fhir:coding/fhir:system/@value', 'http://snomed.info/sct');
            assert.xpathEqual(doc, '/fhir:MedicationAdministration/fhir:dosage/fhir:route/fhir:coding/fhir:code/@value', '394899003');
            assert.xpathEqual(doc, '/fhir:MedicationAdministration/fhir:dosage/fhir:route/fhir:coding/fhir:display/@value', 'oral administration of treatment');
            assert.xpathEqual(doc, '/fhir:MedicationAdministration/fhir:dosage/fhir:quantity/fhir:value/@value', '10');
            assert.xpathEqual(doc, '/fhir:MedicationAdministration/fhir:dosage/fhir:quantity/fhir:units/@value', 'ml');
            assert.xpathEqual(doc, '/fhir:MedicationAdministration/fhir:dosage/fhir:quantity/fhir:system/@value', 'http://unitsofmeasure.org');
            assert.xpathEqual(doc, '/fhir:MedicationAdministration/fhir:dosage/fhir:quantity/fhir:code/@value', 'ml');
        });

        it('should create XML MedicationPrescription', function() {
            var medicationPrescriptionJson = fs.readFileSync('./test/data/dstu1/medicationPrescription.json').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            var xml = fhir.JsonToXml(medicationPrescriptionJson);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.xpathEqual(doc, '/fhir:MedicationPrescription/fhir:dosageInstruction/fhir:timingSchedule/fhir:repeat/fhir:frequency/@value', '3');
            assert.xpathEqual(doc, '/fhir:MedicationPrescription/fhir:dosageInstruction/fhir:timingSchedule/fhir:repeat/fhir:duration/@value', '1');
            assert.xpathEqual(doc, '/fhir:MedicationPrescription/fhir:dosageInstruction/fhir:timingSchedule/fhir:repeat/fhir:units/@value', 'd');
        });

        it('should create XML Bundle from bundle.json', function() {
            var bundleJson = fs.readFileSync('./test/data/dstu1/bundle.json').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            var xml = fhir.JsonToXml(bundleJson);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            // assert feed
            assert.equal(doc.documentElement.nodeName, 'feed');
            assert.xpathEqual(doc, '/atom:feed/atom:title/text()', 'Search result');
            assert.xpathEqual(doc, '/atom:feed/atom:updated/text()', '2012-09-20T12:04:45.6787909+00:00');
            assert.xpathEqual(doc, '/atom:feed/atom:id/text()', 'urn:uuid:50ea3e5e-b6a7-4f55-956c-caef491bbc08');
            assert.xpathCount(doc, '/atom:feed/atom:link', 1);
            assert.xpathEqual(doc, '/atom:feed/atom:link/@rel', 'self');
            assert.xpathEqual(doc, '/atom:feed/atom:link/@href', 'http://ip-0a7a5abe:16287/fhir/person?format=json');

            // assert entry
            assert.xpathCount(doc, '/atom:feed/atom:entry', 1);
            assert.xpathEqual(doc, '/atom:feed/atom:entry/atom:title/text()', 'Resource of type Person, with id = 1 and version = 1');

            // assert entry content
            assert.xpathCount(doc, '/atom:feed/atom:entry/atom:content', 1);
            assert.xpathEqual(doc, '/atom:feed/atom:entry/atom:content/@type', 'text/xml');

            // assert entry content resource
            assert.xpathCount(doc, '/atom:feed/atom:entry/atom:content/fhir:Patient', 1);
            assert.xpathCount(doc, '/atom:feed/atom:entry/atom:content/fhir:Patient/fhir:identifier', 1);
        });

        it('should create XML Bundle from bundle4.json', function() {
            var bundleJson = fs.readFileSync('./test/data/dstu1/bundle4.json').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            var xml = fhir.JsonToXml(bundleJson);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            // assert feed
            assert.equal(doc.documentElement.nodeName, 'feed');
        });

        it('should create a reasonResource element for medicationPrescription1.json', function() {
            var bundleJson = fs.readFileSync('./test/data/dstu1/medicationPrescription1.json').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            var xml = fhir.JsonToXml(bundleJson);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.xpathCount(doc, '/fhir:MedicationPrescription/fhir:reasonResource', 1);
            assert.xpathEqual(doc, '/fhir:MedicationPrescription/fhir:reasonResource/fhir:reference/@value', 'https://localhost:11444/fhir/Condition/3730c5d7-7a16-4aab-bdf3-e3bbb220f655/_history/38129900-6a0b-41c0-8158-7bf299fd6633');
            assert.xpathEqual(doc, '/fhir:MedicationPrescription/fhir:reasonResource/fhir:display/@value', 'Asthma');
        });
    });
});