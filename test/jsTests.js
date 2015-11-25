var Fhir = require('../fhir');
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

describe('DSTU1: XML -> JS', function() {
    describe('XmlToObject()', function() {
        it('should create a JS Composition object', function(done) {
            var compositionXml = fs.readFileSync('./test/data/dstu1/composition.xml').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            fhir.XmlToObject(compositionXml)
                .then(function(obj) {
                    assert(obj, 'Expected XmlToObject to return an object');

                    // assert id
                    assert.equal(obj._id, 'testComposition1');

                    // assert narrative text
                    assert(obj.text);
                    assert.equal(obj.text.status, 'additional');
                    assert.equal(obj.text.div, '<div><div class="narrative"><div class="additional"><p>Wed Jan 02 2008 4:00:00 PM</p><table><thead><tr><th>Problem</th><th>Type</th><th>Status</th><th>Onset Date</th><th>Abatement Date</th></tr></thead><tbody><tr><td>Pneumonia (233604007)</td><td>Complaint (409586006)</td><td>Confirmed</td><td>Wed Jan 02 2008 4:00:00 PM</td><td>Thu Feb 21 2008 4:00:00 PM</td></tr><tr><td>Abdominal aortic aneurysm (disorder) (233985008)</td><td>Cognitive function family member HL7.CCDAR2 (75312-9)</td><td>Provisional</td><td/><td/></tr></tbody></table></div></div></div>');

                    // assert confidentiality
                    assert(obj.confidentiality, 'Expect object to have a confidentiality');
                    assert.equal(obj.confidentiality.code, 'N');
                    assert.equal(obj.confidentiality.display, 'Normal');
                    assert.equal(obj.confidentiality.system, 'urn:oid:2.16.840.1.113883.5.25');

                    // assert date
                    assert.equal(obj.date, '2013-02-29T10:33:17-07:00');

                    // assert event
                    assert(obj.event, 'Expected object to have an event');
                    assert(obj.event.code, 'Expected event to have a code');
                    assert.equal(obj.event.code.length, 1);
                    assert(obj.event.code[0].coding, 'Expected event code to have coding');
                    assert.equal(obj.event.code[0].coding.length, 1);
                    assert.equal(obj.event.code[0].coding[0].code, 'PCPR');
                    assert.equal(obj.event.code[0].coding[0].system, 'http://hl7.org/fhir/v3/ActClass');

                    // assert extension
                    assert(obj.extension, 'Expected object to have an extension');
                    assert.equal(obj.extension.length, 1);
                    assert.equal(obj.extension[0].url, 'http://fhir.js/extension');
                    assert.equal(obj.extension[0].valueCode, 'some_code');

                    // assert identifier
                    assert(obj.identifier, 'Expected object to have an identifier');
                    assert.equal(obj.identifier.system, 'http://fhir.js/');
                    assert.equal(obj.identifier.value, '7d5eef26-b715-4c87-f0a6-8b537b5e36bb');

                    // assert language
                    assert.equal(obj.language, 'en', 'Expected object to have language set to \'en\'');

                    // assert resourceType
                    assert.equal(obj.resourceType, 'Composition', 'Expected object to have resource type of \'Composition\'');

                    // assert section
                    assert(obj.section, 'Expected object to have section');
                    assert.equal(obj.section.length, 5);
                    assert(obj.section[0].code, 'Expected first section to have code');
                    assert(obj.section[0].content, 'Expected first section to have content');
                    assert(obj.section[0].code.coding, 'Expected first section\'s code to have coding');
                    assert.equal(obj.section[0].code.coding.length, 1);
                    assert.equal(obj.section[0].code.coding[0].code, '48765-2');
                    assert.equal(obj.section[0].code.coding[0].display, 'Allergies, adverse reactions, alerts');
                    assert.equal(obj.section[0].code.coding[0].system, 'urn:oid:2.16.840.1.113883.6.1');
                    assert.equal(obj.section[0].content.display, 'Allergies, adverse reactions, alerts (0 entries)');
                    assert.equal(obj.section[0].content.reference, 'http://localhost:8080/fhir/List/e4f044a1-946b-4237-97e7-d97e9e29984e');

                    // assert status
                    assert.equal(obj.status, 'preliminary', 'Expected object to have status of \'preliminary\'');

                    // assert title
                    assert.equal(obj.title, 'Continuity of Care Document (CCD)');

                    // assert type
                    assert(obj.type, 'Expected object to have type');
                    assert(obj.type.coding);
                    assert.equal(obj.type.coding.length, 1);
                    assert.equal(obj.type.coding[0].code, '34133-9');
                    assert.equal(obj.type.coding[0].display, 'Summarization of Episode Note');
                    assert.equal(obj.type.coding[0].system, 'urn:oid:2.16.840.1.113883.6.1');

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });

        it('should create a JS Composition object with subject', function(done) {
            var compositionXml = fs.readFileSync('./test/data/dstu1/composition2.xml').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            fhir.XmlToObject(compositionXml)
                .then(function(obj) {
                    assert(obj, 'Expected XmlToObject to return an object');

                    assert(obj.subject);
                    assert(obj.subject.reference);
                    assert(obj.subject.display);

                    // Test extensions
                    assert(obj.extension);
                    assert.equal(obj.extension.length, 2);
                    assert.equal(obj.extension[0].url, 'http://testserver.com/fhir/Profile/ProfileId');
                    assert.equal(obj.extension[0].valueCode, 'http://testserver.com/fhir/CCD');
                    assert.equal(obj.extension[1].url, 'http://testserver.com/fhir/Profile/SomeTest');
                    assert(obj.extension[1].valueResource);
                    assert.equal(obj.extension[1].valueResource.display, 'Test Display');
                    assert.equal(obj.extension[1].valueResource.reference, 'http://test.com/some/resource');

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });

        it('should create a JS Patient object', function(done) {
            var patientXml = fs.readFileSync('./test/data/dstu1/patient.xml').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            fhir.XmlToObject(patientXml)
                .then(function (obj) {
                    assert(obj);

                    assert.equal(obj.active, true);
                    assert.equal(obj.resourceType, 'Patient');

                    // assert address
                    assert(obj.address);
                    assert.equal(obj.address.length, 1);
                    assert.equal(obj.address[0].city, 'PleasantVille');
                    assert(obj.address[0].line);
                    assert.equal(obj.address[0].line.length, 1);
                    assert.equal(obj.address[0].line[0], '534 Erewhon St');
                    assert.equal(obj.address[0].state, 'Vic');
                    assert.equal(obj.address[0].use, 'home');
                    assert.equal(obj.address[0].zip, '3999');

                    // assert birth date
                    assert.equal(obj.birthDate, '1974-12-25');

                    // assert contacts
                    assert(obj.contact);
                    assert.equal(obj.contact.length, 1);
                    assert(obj.contact[0].name);
                    assert(obj.contact[0].name.family);
                    assert(obj.contact[0].name.given);
                    assert.equal(obj.contact[0].name.family.length, 2);
                    assert.equal(obj.contact[0].name.given.length, 1);
                    assert.equal(obj.contact[0].name.family[0], undefined);
                    assert.equal(obj.contact[0].name.family[1], 'Marché');
                    assert.equal(obj.contact[0].name.given[0], 'Bénédicte');
                    assert(obj.contact[0].relationship);
                    assert.equal(obj.contact[0].relationship.length, 1);
                    assert(obj.contact[0].relationship[0].coding);
                    assert.equal(obj.contact[0].relationship[0].coding.length, 1);
                    assert.equal(obj.contact[0].relationship[0].coding[0].code, 'partner');
                    assert.equal(obj.contact[0].relationship[0].coding[0].system, 'http://hl7.org/fhir/patient-contact-relationship');
                    assert(obj.contact[0].telecom);
                    assert.equal(obj.contact[0].telecom.length, 1);
                    assert.equal(obj.contact[0].telecom[0].system, 'phone');
                    assert.equal(obj.contact[0].telecom[0].value, '+33 (237) 998327');
                    
                    // assert gender
                    assert(obj.gender);
                    assert(obj.gender.coding);
                    assert.equal(obj.gender.coding.length, 1);
                    assert.equal(obj.gender.coding[0].code, 'M');
                    assert.equal(obj.gender.coding[0].display, 'Male');
                    assert.equal(obj.gender.coding[0].system, 'http://hl7.org/fhir/v3/AdministrativeGender');
                    
                    // assert identifier
                    assert(obj.identifier);
                    assert.equal(obj.identifier.length, 1);
                    assert(obj.identifier[0].assigner);
                    assert.equal(obj.identifier[0].assigner.display, 'Acme Healthcare');
                    assert.equal(obj.identifier[0].label, 'MRN');
                    assert.equal(obj.identifier[0].system, 'urn:oid:1.2.36.146.595.217.0.1');
                    assert.equal(obj.identifier[0].use, 'usual');
                    assert.equal(obj.identifier[0].value, '12345');
                    
                    // assert managing organization
                    assert(obj.managingOrganization);
                    assert.equal(obj.managingOrganization.reference, 'Organization/1');

                    // assert name
                    assert(obj.name);
                    assert.equal(obj.name.length, 2);
                    assert(obj.name[0].family);
                    assert(obj.name[0].given);
                    assert.equal(obj.name[0].family.length, 1);
                    assert.equal(obj.name[0].given.length, 2);
                    assert.equal(obj.name[0].family[0], 'Chalmers');
                    assert.equal(obj.name[0].given[0], 'Peter');
                    assert.equal(obj.name[0].given[1], 'James');
                    assert.equal(obj.name[0].use, 'official');
                    assert(obj.name[1].given);
                    assert.equal(obj.name[1].given.length, 1);
                    assert.equal(obj.name[1].given, 'Jim');
                    assert.equal(obj.name[1].use, 'usual');

                    // assert telecom
                    assert(obj.telecom);
                    assert.equal(obj.telecom.length, 2);
                    assert.equal(obj.telecom[0].use, 'home');
                    assert.equal(obj.telecom[1].system, 'phone');
                    assert.equal(obj.telecom[1].use, 'work');
                    assert.equal(obj.telecom[1].value, '(03) 5555 6473');

                    // assert narrative text
                    assert(obj.text);
                    assert.equal(obj.text.div, '<div><table><tbody><tr><td>Name</td><td>Peter James  ("Jim")<b>Chalmers</b></td></tr><tr><td>Address</td><td>534 Erewhon, Pleasantville, Vic, 3999</td></tr><tr><td>Contacts</td><td>Home: unknown. Work: (03) 5555 6473</td></tr><tr><td>Id</td><td>MRN: 12345 (Acme Healthcare)</td></tr></tbody></table></div>');
                    assert.equal(obj.text.status, 'generated');

                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });

        it('should create a JS Bundle object from bundle.xml', function(done) {
            var bundleXml = fs.readFileSync('./test/data/dstu1/bundle.xml').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            fhir.XmlToObject(bundleXml)
                .then(function (obj) {
                    assert(obj);

                    assert.equal(obj.title, 'Document Bundle');
                    assert.equal(obj.updated, '2014-09-09T15:28:48.386Z');
                    assert.equal(obj.id, 'urn:uuid:da398469-3921-4ab5-9b5e-755d3f88a564');

                    // assert entries
                    assert(obj.entry);
                    assert.equal(obj.entry.length, 11);
                    assert(obj.entry[0].content);
                    assert.equal(obj.entry[0].content.resourceType, 'Composition');
                    assert(obj.entry[0].content.encounter);
                    assert(obj.entry[0].content.custodian);
                    assert.equal(obj.entry[0].title, 'Entry 0 for document bundle');

                    // assert links
                    assert(obj.link);
                    assert.equal(obj.link.length, 2);

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });

        it('should create a JS Bundle object from bundle2.xml', function(done) {
            var bundle2Xml = fs.readFileSync('./test/data/dstu1/bundle2.xml').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            fhir.XmlToObject(bundle2Xml)
                .then(function (obj) {
                    assert(obj);

                    assert.equal(obj.title, 'CDA converted to FHIR');
                    assert.equal(obj.id, 'cid:d9');

                    // assert entries
                    assert(obj.entry);
                    assert.equal(obj.entry.length, 90);
                    assert(obj.entry[0].content);
                    assert.equal(obj.entry[0].content.resourceType, 'Composition');
                    assert(obj.entry[0].content.custodian);
                    assert.equal(obj.entry[0].content.date, '2012-09-15T00:00-04:00');
                    assert(obj.entry[0].content.section);
                    assert.equal(obj.entry[0].content.section.length, 14);
                    assert.equal(obj.entry[0].content.title, 'Community Health and Hospitals: Health Summary');
                    assert.equal(obj.entry[0].title, 'Composition');

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });

        it('should create a JS Bundle object from bundle3.xml', function(done) {
            var bundle3Xml = fs.readFileSync('./test/data/dstu1/bundle3.xml').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            fhir.XmlToObject(bundle3Xml)
                .then(function (obj) {
                    assert(obj);

                    assert.equal(obj.title, 'CDA converted to FHIR 2');
                    assert.equal(obj.id, 'cid:d9');

                    // assert entries
                    assert(obj.entry);
                    assert.equal(obj.entry.length, 1);
                    assert(obj.entry[0].content);
                    
                    var composition = obj.entry[0].content;
                    assert.equal(composition.resourceType, 'Composition');
                    assert(composition.custodian);
                    assert.equal(composition.date, '2012-09-15T00:00-04:00');
                    assert.equal(composition.title, 'Community Health and Hospitals: Health Summary');
                    assert.equal(obj.entry[0].title, 'Composition');
                    assert(composition.section);
                    assert.equal(composition.section.length, 1);

                    var section = composition.section[0];
                    assert.equal(section.title, 'ADVANCE DIRECTIVES');
                    assert(section.code);
                    assert(section.code.coding);
                    assert.equal(section.code.coding.length, 1);
                    assert.equal(section.code.coding[0].code, '42348-3');
                    assert.equal(section.code.coding[0].system, 'http://loinc.org');
                    assert(section.content);
                    assert.equal(section.content.display, 'ADVANCE DIRECTIVES');
                    assert.equal(section.content.reference, 'cid:d9e621');

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });

        it('should create a JS MedicationStatement object with non-quoted integers', function(done) {
            var compositionXml = fs.readFileSync('./test/data/dstu1/medicationStatement.xml').toString();
            var fhir = new Fhir(Fhir.DSTU1);
            fhir.XmlToObject(compositionXml)
                .then(function(obj) {
                    assert(obj, 'Expected XmlToObject to return an object');

                    assert(obj.dosage);
                    assert.equal(obj.dosage.length, 1);
                    assert(obj.dosage[0].timing);
                    assert(obj.dosage[0].timing.repeat);
                    assert.equal(typeof(obj.dosage[0].timing.repeat.duration), 'number');
                    assert.equal(obj.dosage[0].timing.repeat.duration, 6);
                    assert.equal(typeof(obj.dosage[0].timing.repeat.frequency), 'number');
                    assert.equal(obj.dosage[0].timing.repeat.frequency, 1);

                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });
    });
});