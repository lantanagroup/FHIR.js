var Fhir = require('../../fhir');
var fs = require('fs');
var assert = require('assert');

describe('DSTU2: XML -> JS', function() {
    describe('XmlToObject()', function() {
        it('should create a bundle object for a transaction', function(done) {
            var bundleTransactionXml = fs.readFileSync('./test/data/dstu2/bundle-transaction.xml').toString();

            var fhir = new Fhir(Fhir.DSTU2);
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

                    // Check meta-data
                    assert(obj.meta);
                    // TODO

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });

        it('should create a discharge summary document bundle object', function(done) {
            var documentBundleXml = fs.readFileSync('./test/data/dstu2/document-example-dischargesummary.xml').toString();
            var fhir = new Fhir(Fhir.DSTU2);
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
                    assert(obj.entry[0].resource.extension);

                    // Test extensions
                    assert.equal(obj.entry[0].resource.extension.length, 2);
                    assert.equal(obj.entry[0].resource.extension[0].url, 'http://testserver.com/fhir/Profile/SomeTest1');
                    assert.equal(obj.entry[0].resource.extension[0].valueCode, 'testCode');
                    assert.equal(obj.entry[0].resource.extension[1].url, 'http://testserver.com/fhir/Profile/SomeTest2');
                    assert(obj.entry[0].resource.extension[1].valueReference);
                    assert.equal(obj.entry[0].resource.extension[1].valueReference.display, 'Test Patient');
                    assert.equal(obj.entry[0].resource.extension[1].valueReference.reference, 'http://testserver.com/fhir/Patient/1');

                    assert(obj.signature);
                    assert(obj.signature.blob);
                    assert.equal(obj.signature.blob.length, 21332);
                    assert.equal(obj.signature.contentType, 'image/jpg');
                    assert.equal(obj.signature.when, '2015-08-31T07:42:33+10:00');
                    assert(obj.signature.type);
                    assert.equal(obj.signature.type.length, 1);
                    assert.equal(obj.signature.type[0].code, '1.2.840.10065.1.12.1.1');
                    assert.equal(obj.signature.type[0].display, 'AuthorID');
                    assert.equal(obj.signature.type[0].system, 'http://hl7.org/fhir/valueset-signature-type');

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });

        it('should create Condition object', function(done) {
            var condition2Xml = fs.readFileSync('./test/data/dstu2/condition-example2.xml').toString();
            var fhir = new Fhir(Fhir.DSTU2);
            fhir.XmlToObject(condition2Xml)
                .then(function(obj) {
                    assert(obj, 'Expected XmlToObject to return an object');
                    assert.equal(obj.resourceType, 'Condition');
                    assert.equal(obj.onsetDateTime, '2012-11-12');
                    assert.equal(obj.id, 'example2');
                    assert.equal(obj.clinicalStatus, 'active');

                    assert(obj.category);
                    assert(obj.category.coding);
                    assert.equal(obj.category.coding.length, 1);
                    assert.equal(obj.category.coding[0].code, 'finding');
                    assert.equal(obj.category.coding[0].display, 'Finding');
                    assert.equal(obj.category.coding[0].system, 'http://hl7.org/fhir/condition-category');

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });

        it('should create MedicationStatement object with integers', function(done) {
            var medicationStatementXml = fs.readFileSync('./test/data/dstu2/medicationStatement.xml').toString();
            var fhir = new Fhir(Fhir.DSTU2);
            fhir.XmlToObject(medicationStatementXml)
                .then(function(obj) {
                    assert(obj, 'Expected XmlToObject to return an object');

                    assert(obj.dosage);
                    assert.equal(obj.dosage.length, 1);
                    assert(obj.dosage[0].timing);
                    assert(obj.dosage[0].timing.repeat);
                    assert.equal(typeof(obj.dosage[0].timing.repeat.frequency), 'number');
                    assert.equal(obj.dosage[0].timing.repeat.frequency, 3);
                    assert.equal(typeof(obj.dosage[0].timing.repeat.period), 'number');
                    assert.equal(obj.dosage[0].timing.repeat.period, 1);

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });
    });
});