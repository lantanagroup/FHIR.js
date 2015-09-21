var Fhir = require('../fhir');
var fs = require('fs');
var assert = require('./assert');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

describe('DSTU1: JS -> XML', function() {
    var compositionJson = fs.readFileSync('./test/data/composition.json').toString();
    var patientJson = fs.readFileSync('./test/data/patient.json').toString();
    var bundleJson = fs.readFileSync('./test/data/bundle.json').toString();
    var observation1Json = fs.readFileSync('./test/data/observation1.json').toString();
    var observation2Json = fs.readFileSync('./test/data/observation2.json').toString();
    var observation3Json = fs.readFileSync('./test/data/observation3.json').toString();
    var medicationAdministrationJson = fs.readFileSync('./test/data/medicationAdministration.json').toString();
    var medicationPrescriptionJson = fs.readFileSync('./test/data/medicationPrescription.json').toString();

    describe('ObjectToXml()', function() {
        var composition = JSON.parse(compositionJson);

        it('should create XML Composition', function() {
            var fhir = new Fhir(Fhir.DSTU1);
            var xml = fhir.ObjectToXml(composition);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.equal(doc.documentElement.nodeName, 'Composition');
            assert.xpathEqual(doc, '/fhir:Composition/@id', '234234');

            // assert extension
            assert.xpathCount(doc, '/fhir:Composition/fhir:extension', 1);
            assert.xpathEqual(doc, '/fhir:Composition/fhir:extension[1]/@url', 'http://fhir.js/extension');
            assert.xpathEqual(doc, '/fhir:Composition/fhir:extension[1]/fhir:valueCode/@value', 'some_code');

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
    });

    describe('JsonToXml()', function() {
        it('should create XML Patient', function() {
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
            var fhir = new Fhir(Fhir.DSTU1);
            var xml = fhir.JsonToXml(medicationPrescriptionJson);

            assert(xml);

            var doc = new dom().parseFromString(xml);

            assert.xpathEqual(doc, '/fhir:MedicationPrescription/fhir:dosageInstruction/fhir:timingSchedule/fhir:repeat/fhir:frequency/@value', '3');
            assert.xpathEqual(doc, '/fhir:MedicationPrescription/fhir:dosageInstruction/fhir:timingSchedule/fhir:repeat/fhir:duration/@value', '1');
            assert.xpathEqual(doc, '/fhir:MedicationPrescription/fhir:dosageInstruction/fhir:timingSchedule/fhir:repeat/fhir:units/@value', 'd');
        });

        it('should create XML Bundle', function() {
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
    });
});