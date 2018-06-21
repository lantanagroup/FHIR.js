var fs = require('fs');
var Fhir = require('../../fhir');
var assert = require('assert');

describe('DSTU1: Validation', function() {
    describe('ValidateXMLResource()', function() {
        it('should validate bundle successfully', function() {
            var bundleXml = fs.readFileSync('./test/data/dstu1/bundle.xml').toString('utf8');
            var fhir = new Fhir(Fhir.DSTU1);
            var result = fhir.ValidateXMLResource(bundleXml);

            assert(result);
            assert.equal(result.valid, true);
        });

        it('should return four validation errors for composition', function() {
            var compositionXml = fs.readFileSync('./test/data/dstu1/composition.xml').toString('utf8');
            var fhir = new Fhir(Fhir.DSTU1);
            var result = fhir.ValidateXMLResource(compositionXml);

            assert(result);
            assert.equal(result.valid, false);
            assert(result.errors);
            assert.equal(result.errors.length, 4);
            assert.equal(result.errors[0], 'Element \'{http://hl7.org/fhir}Composition\', attribute \'id\': [facet \'pattern\'] The value \'testComposition1\' is not accepted by the pattern \'[a-z0-9\\-\\.]{1,36}\'.\n');
        });
    });

    describe('ValidateJSResource()', function() {
        it ('should validate composition successfully', function() {
            var compositionJson = fs.readFileSync('./test/data/dstu1/composition.json').toString('utf8');
            var composition = JSON.parse(compositionJson);
            var fhir = new Fhir(Fhir.DSTU1);
            var result = fhir.ValidateJSResource(composition);

            assert(result);
            assert(result.errors);
            assert.equal(false, result.valid);
            assert.equal(1, result.errors.length);
        });

        it('should validate immunization-example.json successfully', function() {
            var immunizationJson = JSON.parse(fs.readFileSync('./test/data/dstu1/immunization-example.json').toString('utf8'));
            var fhir = new Fhir(Fhir.DSTU1);
            var result = fhir.ValidateJSResource(immunizationJson);

            assert(result);
            assert.equal(result.valid, true);

            assert(result.errors);
            assert.equal(result.errors.length, 0);
        });

        it ('should return 3 validation errors for bundle', function() {
            var bundleJson = fs.readFileSync('./test/data/dstu1/bundle.json').toString('utf8');
            var bundle = JSON.parse(bundleJson);
            var fhir = new Fhir(Fhir.DSTU1);
            var result = fhir.ValidateJSResource(bundle);

            assert(result);
            assert(result.errors);
            assert.equal(result.valid, false);
            assert.equal(result.errors.length, 3);
            assert.equal(result.errors[0], 'Element Bundle.type does not meet the minimal cardinality of 1 (actual: 0)');
            assert.equal(result.errors[1], 'Element Bundle.link.relation does not meet the minimal cardinality of 1 (actual: 0)');
            assert.equal(result.errors[2], 'Element Bundle.link.url does not meet the minimal cardinality of 1 (actual: 0)');
        });

        it ('should return three validation errors for bundle2', function() {
            var bundle2Json = fs.readFileSync('./test/data/dstu1/bundle2.json').toString('utf8');
            var bundle2 = JSON.parse(bundle2Json);
            var fhir = new Fhir(Fhir.DSTU1);
            var result = fhir.ValidateJSResource(bundle2);

            assert(result);
            assert(result.errors);
            assert.equal(result.valid, false);
            assert.equal(result.errors.length, 4);
            assert.equal(result.errors[0], 'Element Bundle.type does not meet the minimal cardinality of 1 (actual: 0)');
            assert.equal(result.errors[1], 'Element Bundle.link does not meet the minimal cardinality of 1 (actual: 0)');
            assert.equal(result.errors[2], 'Bundle.entry.content "Composition": Element Composition.author does not meet the minimal cardinality of 1 (actual: 0)');
            assert.equal(result.errors[3], 'Bundle.entry.content "Family History": Element FamilyHistory.relation.condition.type does not meet the minimal cardinality of 1 (actual: 0)');
        });

        it ('should return three validation errors for bundle3', function() {
            var bundle3Json = fs.readFileSync('./test/data/dstu1/bundle3.json').toString('utf8');
            var fhir = new Fhir(Fhir.DSTU1);
            var result = fhir.ValidateJSONResource(bundle3Json);

            assert(result);
            assert(result.errors);
            assert.equal(result.valid, true);
            assert.equal(result.errors.length, 0);
        });
    });
});
