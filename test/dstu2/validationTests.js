var fs = require('fs');
var Fhir = require('../../fhir');
var assert = require('assert');

describe('DSTU2: Validation', function() {
    describe('ValidateXMLResource()', function() {
        it('should validate bundle-transaction successfully', function() {
            var bundleXml = fs.readFileSync('./test/data/dstu2/bundle-transaction.xml').toString('utf8');
            var fhir = new Fhir(Fhir.DSTU2);
            var result = fhir.ValidateXMLResource(bundleXml);

            assert(result);
            assert.equal(result.valid, true);
        });

        it('should return validation errors for bundle-transaction_bad', function() {
            var bundleXml = fs.readFileSync('./test/data/dstu2/bundle-transaction_bad.xml').toString('utf8');
            var fhir = new Fhir(Fhir.DSTU2);
            var result = fhir.ValidateXMLResource(bundleXml);

            assert(result);
            assert.equal(result.valid, false);
            assert(result.errors);
            assert.equal(result.errors.length, 1);
            assert.equal(result.errors[0], "Element '{http://hl7.org/fhir}fullUrl': This element is not expected. Expected is ( {http://hl7.org/fhir}response ).\n");
        });
    });

    describe('ValidateJSONResource()', function() {
        it('should validate bundle-transaction.json successfully', function() {
            var bundleJson = fs.readFileSync('./test/data/dstu2/bundle-transaction.json').toString('utf8');
            var fhir = new Fhir(Fhir.DSTU2);
            var result = fhir.ValidateJSONResource(bundleJson);

            assert(result);
            assert.equal(result.valid, true);

            assert(result.errors);
            assert.equal(result.errors.length, 0);
        });
    });

    describe('ValidateJSResource()', function() {
        it('should validate bundle-transaction.json successfully', function() {
            var bundleJson = JSON.parse(fs.readFileSync('./test/data/dstu2/bundle-transaction.json').toString('utf8'));
            var fhir = new Fhir(Fhir.DSTU2);
            var result = fhir.ValidateJSResource(bundleJson);

            assert(result);
            assert.equal(result.valid, true);

            assert(result.errors);
            assert.equal(result.errors.length, 0);
        });

        it('should validate with a differential profile sucessfully', function () {
          var profile = JSON.parse(fs.readFileSync('./test/data/dstu2/doc-manifest-diff-profile.json').toString('utf8'));
          var docManifest = JSON.parse(fs.readFileSync('./test/data/dstu2/doc-manifest.json').toString('utf8'));
          var fhir = new Fhir(Fhir.DSTU2);
          var result = fhir.ValidateJSResource(docManifest, profile);

          assert(result);
          assert.equal(result.valid, true);

          assert(result.errors);
          assert.equal(result.errors.length, 0);
        });

        it('should return errors when validating with a differential profile', function () {
          var profile = JSON.parse(fs.readFileSync('./test/data/dstu2/doc-manifest-diff-profile.json').toString('utf8'));
          var docManifest = JSON.parse(fs.readFileSync('./test/data/dstu2/doc-manifest_bad.json').toString('utf8'));
          var fhir = new Fhir(Fhir.DSTU2);
          var result = fhir.ValidateJSResource(docManifest, profile);

          assert(result);
          assert.equal(result.valid, false);

          assert(result.errors);
          assert.equal(result.errors.length, 1);
        });

        it('should validate immunization-example.json successfully', function() {
            var immunizationJson = JSON.parse(fs.readFileSync('./test/data/dstu2/immunization-example.json').toString('utf8'));
            var fhir = new Fhir(Fhir.DSTU2);
            var result = fhir.ValidateJSResource(immunizationJson);

            assert(result);
            assert.equal(result.valid, true);

            assert(result.errors);
            assert.equal(result.errors.length, 0);
        });
    });
});
