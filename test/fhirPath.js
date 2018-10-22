var Fhir = require('../fhir').Fhir;
var FhirPath = require('../fhirPath').FhirPath;
var fs = require('fs');
var assert = require('assert');
var _ = require('underscore');

var documentBundleJson = fs.readFileSync('./test/data/stu3/document-example-dischargesummary.json').toString();
var questionnaireResponseJson = fs.readFileSync('./test/data/r4/QuestionnaireResponse_01.json').toString();

describe('FhirPath', function() {
    var resource = JSON.parse(documentBundleJson);

    describe('parse', function() {
        var fhirPath = new FhirPath(resource);

        it('should parse a simple path', function() {
            var parsed = fhirPath.parse('Bundle.entry.fullUrl');
            assert(parsed);
            assert(parsed.length === 1);
            assert(parsed[0].path);
            assert(parsed[0].path.length === 2);
            assert(parsed[0].path[0] === 'entry');
            assert(parsed[0].path[1] === 'fullUrl');
        });

        it('should parse simple functions', function() {
            var parsed = fhirPath.parse('Bundle.entry.first().fullUrl');
            assert(parsed);
            assert(parsed.length === 1);
            assert(parsed[0].path);
            assert(parsed[0].path.length === 3);
            assert(parsed[0].path[0] === 'entry');
            assert(parsed[0].path[1]);
            assert(parsed[0].path[1].name === 'first');
            assert(parsed[0].path[2] === 'fullUrl');
        });

        it('should parse a single value', function() {
            var parsed = fhirPath.parse('\'test\'');
            assert(parsed);
            assert(parsed.length === 1);
            assert(parsed[0].value === 'test');
            assert(!parsed[0].path);
        });

        it('should parse equality', function() {
            var parsed = fhirPath.parse('id = \'test\'');
            assert(parsed);
            assert(parsed.length === 1);
            assert(parsed[0].op === '=');
            assert(parsed[0].left);
            assert(parsed[0].right);
            assert(parsed[0].left.path);
            assert(parsed[0].left.path.length === 1);
            assert(parsed[0].left.path[0] === 'id');
            assert(!parsed[0].right.path);
            assert(parsed[0].right.value === 'test');
            assert(parsed[0].op === '=');
        });

        it('should parse ! operator correctly', function() {
            var parsed = fhirPath.parse('id != \'father2\'');
            assert(parsed);
            assert(parsed.length === 1);
            assert(parsed[0].op === '!=');
            assert(parsed[0].left);
            assert(parsed[0].right);
            assert(parsed[0].left.path);
            assert(parsed[0].left.path.length === 1);
            assert(parsed[0].left.path[0] === 'id');
            assert(!parsed[0].right.path);
            assert(parsed[0].right.value === 'father2');
        });

        it('should parse a function parameter as a value', function() {
            var parsed = fhirPath.parse('reference.startsWith(\'#\')');
            assert(parsed);
            assert(parsed.length === 1);
            assert(parsed[0].path);
            assert(parsed[0].path.length === 2);
            assert(parsed[0].path[0] === 'reference');
            assert(parsed[0].path[1]);
            assert(parsed[0].path[1].name === 'startswith');
            assert(parsed[0].path[1].params);
            assert(parsed[0].path[1].params.length === 1);
            assert(parsed[0].path[1].params[0].value === '#');
        });
    });

    describe('evaluate', function() {
        var fhir = new Fhir();

        it('should evaluate with resourceType prefix', function() {
            var ids = fhir.evaluate(resource, 'Bundle.id');
            assert(ids === 'father');
        });

        it('should evaluate without resourceType prefix', function() {
            var ids = fhir.evaluate(resource, 'id');
            assert(ids === 'father');
        });

        it('should evaluate with two levels', function() {
            var lastUpdated = fhir.evaluate(resource, 'Bundle.meta.lastUpdated');
            assert(lastUpdated === '2013-05-28T22:12:21Z');
        });

        it('should evaluate with first index of array', function() {
            var fullUrl = fhir.evaluate(resource, 'Bundle.entry.first().fullUrl');
            assert(fullUrl === 'http://fhir.healthintersections.com.au/open/Composition/180f219f-97a8-486d-99d9-ed631fe4fc57');
        });

        it('should evaluate multiple values of an array', function() {
            var fullUrls = fhir.evaluate(resource, 'Bundle.entry.fullUrl');
            assert(fullUrls instanceof Array);
            assert(fullUrls.length === 8);
            assert(fullUrls[0] === 'http://fhir.healthintersections.com.au/open/Composition/180f219f-97a8-486d-99d9-ed631fe4fc57');
            assert(fullUrls[7] === 'urn:uuid:47600e0f-b6b5-4308-84b5-5dec157f7637');
        });

        it('should evaluate a boolean result', function() {
            var r1 = fhir.evaluate(resource, 'id = \'father\'');
            assert(r1 === true);

            var r2 = fhir.evaluate(resource, 'id != \'father\'');
            assert(r2 === false);

            var r3 = fhir.evaluate(resource, 'id != \'father2\'');
            assert(r3 === true);

            var r4 = fhir.evaluate(resource, 'id = \'father2\'');
            assert(r4 === false);
        });

        it('should evaluate with a where condition', function() {
            var results = fhir.evaluate(resource, 'Bundle.entry.where(fullUrl = \'urn:uuid:47600e0f-b6b5-4308-84b5-5dec157f7637\')');
            assert(results);
            assert(results.length === 1);
            assert(results[0].fullUrl === 'urn:uuid:47600e0f-b6b5-4308-84b5-5dec157f7637');
            assert(results[0].resource);
            assert(results[0].resource.resourceType === 'AllergyIntolerance');
        });

        it('should resolve a single resource reference', function() {
            var questionnaireResponse = JSON.parse(questionnaireResponseJson).entry[0].resource;
            var fhir = new Fhir();

            fhir.resolve = function(reference) {
                assert(reference === 'Questionnaire/RAI-HC2011');

                return {
                    resourceType: 'Questionnaire',
                    id: 'RAI-HC2011'
                };
            };

            var results = fhir.evaluate(questionnaireResponse, 'questionnaire.resolve()');

            assert(results);
            assert(results.resourceType === 'Questionnaire');
            assert(results.id === 'RAI-HC2011');
        });

        it('should resolve multiple resource references', function() {
            var bundle = JSON.parse(questionnaireResponseJson);
            var fhir = new Fhir();

            var resolveCount = 1;
            fhir.resolve = function(reference) {
                if (resolveCount === 1) {
                    assert(reference === 'Questionnaire/RAI-HC2011');
                    resolveCount++;

                    return {
                        resourceType: 'Questionnaire',
                        id: 'RAI-HC2011'
                    };
                } else if (resolveCount === 2) {
                    assert(reference === 'Questionnaire/GAIN-Q33.3.7 ONT MI');
                    resolveCount++;

                    return {
                        resourceType: 'Questionnaire',
                        id: 'GAIN-Q33.3.7 ONT MI'
                    };
                } else if (resolveCount === 3 || resolveCount === 4) {
                    assert(reference === 'Questionnaire/OCAN2.0.7');
                    resolveCount++;

                    return {
                        resourceType: 'Questionnaire',
                        id: 'OCAN2.0.7'
                    };
                }

                assert(false);
            };

            var results = fhir.evaluate(bundle, 'Bundle.entry.resource.questionnaire.resolve()');

            assert(results);
            assert(results.length === 4);

            var questionnaires = _.filter(results, function(result) {
                return result.resourceType === 'Questionnaire';
            });

            assert(questionnaires.length === 4);
            assert(results[0].id === 'RAI-HC2011');
            assert(results[1].id === 'GAIN-Q33.3.7 ONT MI');
            assert(results[2].id === 'OCAN2.0.7');
            assert(results[3].id === 'OCAN2.0.7');
        });

        it('should evaluate startsWith()', function() {
            var results = fhir.evaluate(resource, "entry.resource.id.startsWith('180')");
            assert(results);
            assert(results.length === 4);
            assert(results[0] === true);
            assert(results[1] === false);
            assert(results[2] === false);
            assert(results[3] === false);
        });

        it('should evaluate .where() with a .startsWith()', function() {
            var results1 = fhir.evaluate(resource, "entry.where(resource.id.startsWith('180'))");
            assert(results1);
            assert(results1.length === 1);
            assert(results1[0].fullUrl === 'http://fhir.healthintersections.com.au/open/Composition/180f219f-97a8-486d-99d9-ed631fe4fc57');
            assert(results1[0].resource);

            var results2 = fhir.evaluate(resource, "entry.where(resource.id.startsWith('180')).resource");
            assert(results2);
            assert(results2.length === 1);
            assert(results2[0].id === '180f219f-97a8-486d-99d9-ed631fe4fc57');
        });
    });
});