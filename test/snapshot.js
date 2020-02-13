var Fhir = require('../fhir').Fhir;
var ParseConformance = require('../parseConformance').ParseConformance;
var SnapshotGenerator = require('../snapshotGenerator').SnapshotGenerator;
var fs = require('fs');
var assert = require('assert');
var _ = require('underscore');

var sd1 = JSON.parse(fs.readFileSync('./test/data/r4/structureDefinition.json').toString());
var sd2 = JSON.parse(fs.readFileSync('./test/data/r4/inheritedStructureDefinition.json').toString());

describe('SnapshotGenerator', function() {
    var types = require('../profiles/r4/profiles-types.json');
    var resources = require('../profiles/r4/profiles-resources.json');
    var valueSets = require('../profiles/r4/valuesets.json');
    var parser = new ParseConformance();
    parser.parseBundle(valueSets);
    parser.parseBundle(types);
    parser.parseBundle(resources);
    var fhir = new Fhir(parser);

    it('should generate snapshots for multiple profiles', function() {
        fhir.generateSnapshot(SnapshotGenerator.createBundle(sd1, sd2));

        assert(sd1.snapshot);
        assert(sd1.snapshot.element);
        assert.equal(sd1.snapshot.element.length, 58);

        // code (and children)
        assert(sd1.snapshot.element[14].alias);
        assert.equal(sd1.snapshot.element[14].id, 'Observation.code');
        assert.equal(sd1.snapshot.element[14].path, 'Observation.code');
        assert.equal(sd1.snapshot.element[14].alias.length, 2);
        assert.equal(sd1.snapshot.element[14].alias[0], 'Test');
        assert.equal(sd1.snapshot.element[14].alias[1], 'Name');
        assert.equal(sd1.snapshot.element[14].short, 'Updated short description');
        assert.equal(sd1.snapshot.element[14].definition, 'Updated definition');
        assert.equal(sd1.snapshot.element[14].comment, 'Updated comment');

        assert.equal(sd1.snapshot.element[15], sd1.differential.element[2]);
        assert.equal(sd1.snapshot.element[16], sd1.differential.element[3]);
        assert.equal(sd1.snapshot.element[17], sd1.differential.element[4]);
        assert.equal(sd1.snapshot.element[18], sd1.differential.element[5]);

        // valueQuantity (and children)
        assert.equal(sd1.snapshot.element[25], sd1.differential.element[6]);
        assert.equal(sd1.snapshot.element[26], sd1.differential.element[7]);
        assert.equal(sd1.snapshot.element[27], sd1.differential.element[8]);
        assert.equal(sd1.snapshot.element[28], sd1.differential.element[9]);
        assert.equal(sd1.snapshot.element[29], sd1.differential.element[10]);
    });

    it('should error when base profile not found', function() {
        var emptyParser = new ParseConformance(true);
        var snapshotGenerator = new SnapshotGenerator(emptyParser, SnapshotGenerator.createBundle(sd1, sd2));

        assert.throws(function() {
            snapshotGenerator.generate();
        });
    });
});