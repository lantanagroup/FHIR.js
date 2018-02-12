var Fhir = require('../../fhir');
var fs = require('fs');
var assert = require('assert');

describe('STU3: XML -> JS', function() {
    describe('XmlToObject()', function() {
        it('should create a bundle object for a transaction', function(done) {
            var bundleTransactionXml = fs.readFileSync('./test/data/stu3/bundle-transaction.xml').toString();

            var fhir = new Fhir(Fhir.STU3);
            fhir.XmlToObject(bundleTransactionXml)
                .then(function(obj) {
                    assert(obj, 'Expected XmlToObject to return an object');
                    assert.equal(obj.resourceType, 'Bundle');
                    assert.equal(obj.id, 'bundle-transaction');
                    assert.equal(obj.type, 'transaction');

                    // Check entries
                    assert(obj.entry);
                    assert.equal(obj.entry.length, 10);
                    assert(obj.entry[0].request);
                    assert.equal(obj.entry[0].fullUrl, 'urn:uuid:61ebe359-bfdc-4613-8bf2-c5e300945f0a');
                    assert.equal(obj.entry[0].request.method, 'POST');
                    assert.equal(obj.entry[0].request.url, 'Patient');
                    assert(obj.entry[0].resource);
                    assert.equal(obj.entry[0].resource.active, true);
                    assert.equal(obj.entry[0].resource.birthDate, '1974-12-25');
                    assert.equal(obj.entry[0].resource.resourceType, 'Patient');
                    assert.equal(obj.entry[0].resource.text.div, '<div xmlns="http://www.w3.org/1999/xhtml">Some narrative</div>');

                    // Check meta-data
                    assert(obj.meta);
                    assert.equal(obj.meta.lastUpdated, '2014-08-18T01:43:30Z');
                    // TODO

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });

        it('should create a discharge summary document bundle object', function(done) {
            var documentBundleXml = fs.readFileSync('./test/data/stu3/document-example-dischargesummary.xml').toString();
            var fhir = new Fhir(Fhir.STU3);
            fhir.XmlToObject(documentBundleXml)
                .then(function(obj) {
                    assert(obj, 'Expected XmlToObject to return an object');
                    assert.equal(obj.resourceType, 'Bundle');
                    assert.equal(obj.id, 'father');
                    assert.equal(obj.type, 'document');

                    assert(obj.meta);
                    assert.equal(obj.meta.lastUpdated, '2013-05-28T22:12:21Z');

                    assert(obj.entry);
                    assert.equal(obj.entry.length, 8);
                    assert.equal(obj.entry[0].fullUrl, 'http://fhir.healthintersections.com.au/open/Composition/180f219f-97a8-486d-99d9-ed631fe4fc57');
                    assert(obj.entry[0].resource);
                    assert.equal(obj.entry[0].resource.resourceType, 'Composition');
                    assert.equal(obj.entry[0].resource.id, '180f219f-97a8-486d-99d9-ed631fe4fc57');

                    assert(obj.signature);
                    assert(obj.signature.blob);
                    assert.equal(obj.signature.blob.length, 21332);
                    assert.equal(obj.signature.contentType, 'image/jpg');
                    assert.equal(obj.signature.when, '2015-08-31T07:42:33+10:00');
                    assert(obj.signature.type);
                    assert.equal(obj.signature.type.length, 1);
                    assert.equal(obj.signature.type[0].code, '1.2.840.10065.1.12.1.1');
                    assert.equal(obj.signature.type[0].display, 'Author\'s Signature');
                    assert.equal(obj.signature.type[0].system, 'http://hl7.org/fhir/valueset-signature-type');

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });

        it('should create Condition object', function(done) {
            var condition2Xml = fs.readFileSync('./test/data/stu3/condition-example2.xml').toString();
            var fhir = new Fhir(Fhir.STU3);
            fhir.XmlToObject(condition2Xml)
                .then(function(obj) {
                    assert(obj, 'Expected XmlToObject to return an object');
                    assert.equal(obj.resourceType, 'Condition');
                    assert.equal(obj.id, 'example2');
                    assert.equal(obj.clinicalStatus, 'active');

                    assert(obj.category);
                    assert.equal(1, obj.category.length);
                    assert(obj.category[0].coding);
                    assert.equal(obj.category[0].coding.length, 1);
                    assert.equal(obj.category[0].coding[0].code, 'problem-list-item');
                    assert.equal(obj.category[0].coding[0].display, 'Problem List Item');
                    assert.equal(obj.category[0].coding[0].system, 'http://hl7.org/fhir/condition-category');

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });

        it('should create MedicationStatement object with integers', function(done) {
            var medicationStatementXml = fs.readFileSync('./test/data/stu3/medicationStatement.xml').toString();
            var fhir = new Fhir(Fhir.STU3);
            fhir.XmlToObject(medicationStatementXml)
                .then(function(obj) {
                    assert(obj, 'Expected XmlToObject to return an object');

                    assert(obj.identifier);
                    assert.equal(obj.identifier.length, 1);
                    assert.equal(obj.identifier[0].system, 'http://www.bmc.nl/portal/medstatements');
                    assert.equal(obj.identifier[0].use, 'official');
                    assert.equal(obj.identifier[0].value, '12345689');

                    assert.equal(obj.status, 'active');

                    assert(obj.category);
                    assert(obj.category.coding);
                    assert.equal(obj.category.coding.length, 1);
                    assert.equal(obj.category.coding[0].code, 'inpatient');
                    assert.equal(obj.category.coding[0].display, 'Inpatient');
                    assert.equal(obj.category.coding[0].system, 'http://hl7.org/fhir/medication-statement-category');

                    assert(obj.medicationReference);
                    assert.equal(obj.medicationReference.reference, '#med0309');

                    assert.equal(obj.effectiveDateTime, '2015-01-23');
                    assert.equal(obj.dateAsserted, '2015-02-22');

                    assert(obj.informationSource);
                    assert.equal(obj.informationSource.display, 'Donald Duck');
                    assert.equal(obj.informationSource.reference, 'Patient/pat1');

                    assert(obj.dosage);
                    assert.equal(obj.dosage.length, 1);
                    assert(obj.dosage[0].timing);
                    assert(obj.dosage[0].timing.repeat);
                    assert.equal(typeof(obj.dosage[0].timing.repeat.frequency), 'number');
                    assert.equal(obj.dosage[0].timing.repeat.frequency, 1);
                    assert.equal(typeof(obj.dosage[0].timing.repeat.period), 'number');
                    assert.equal(obj.dosage[0].timing.repeat.period, 1);

                    // Contained medication
                    assert(obj.contained);
                    assert.equal(obj.contained.length, 1);

                    var medication = obj.contained[0];

                    assert.equal(medication.id, 'med0309');

                    assert(medication.code);
                    assert(medication.code.coding);
                    assert.equal(medication.code.coding.length, 1);
                    assert.equal(medication.code.coding[0].system, 'http://hl7.org/fhir/sid/ndc');
                    assert.equal(medication.code.coding[0].code, '50580-506-02');
                    assert.equal(medication.code.coding[0].display, 'Tylenol PM');

                    assert.equal(medication.isBrand, true);

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });
    });
});