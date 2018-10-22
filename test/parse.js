var ParseConformance = require('../parseConformance').ParseConformance;
var Versions = require('../fhir').Versions;
var assert = require('assert');
var _ = require('underscore');

describe('Parse', function () {
    it('should load parsed structure definitions and value sets from cache/file', function () {
        var parser = new ParseConformance(true);

        assert(parser.parsedStructureDefinitions);
        assert.equal(Object.keys(parser.parsedStructureDefinitions).length, 214);
        assert.equal(Object.keys(parser.parsedValueSets).length, 571);
    });

    it('should parse bundles', function () {
        var types = require('../profiles/r4/profiles-types.json');
        var resources = require('../profiles/r4/profiles-resources.json');
        var valueSets = require('../profiles/r4/valuesets.json');

        var parser = new ParseConformance(false);
        parser.parseBundle(valueSets);
        parser.parseBundle(types);
        parser.parseBundle(resources);

        assert(parser.parsedStructureDefinitions);
        var structureDefinitionsCount = Object.keys(parser.parsedStructureDefinitions).length;
        assert.equal(structureDefinitionsCount, 214);
        assert(parser.parsedValueSets);
        var valueSetsCount = Object.keys(parser.parsedValueSets).length;
        assert.equal(valueSetsCount, 571);

        var noCodeValueSets = _.filter(parser.parsedValueSets, function(valueSet) {
            var systemHasCodes = false;

            _.each(valueSet.systems, function(system) {
                if (system.codes && system.codes.length >= 0) {
                    systemHasCodes = true;
                }
            });

            return !systemHasCodes;
        });

        assert(noCodeValueSets.length === 0);   // All value sets have at least one code
    });

    it('should parse value sets with extra code systems', function() {
        var valueSets = require('../profiles/r4/valuesets.json');
        var iso3166CodeSystem = require('./data/r4/codesystem-iso3166.json');
        var parser = new ParseConformance(false);
        parser.loadCodeSystem(iso3166CodeSystem);
        parser.parseBundle(valueSets);
        var valueSetsCount = Object.keys(parser.parsedValueSets).length;
        assert.equal(valueSetsCount, 574);

        var foundJurisdiction = parser.parsedValueSets['http://hl7.org/fhir/ValueSet/jurisdiction'];
        assert(!!foundJurisdiction);
    });

    it('should parse profile-StructureDefinition for STU3', function() {
        var sdProfile = require('./data/stu3/schema/profile-StructureDefinition.json');
        var parser = new ParseConformance(false, Versions.STU3);
        parser.parseStructureDefinition(sdProfile);

        var parsedStructureDefinition = parser.parsedStructureDefinitions['StructureDefinition'];
        assert(parsedStructureDefinition);
        assert(parsedStructureDefinition._properties);
        assert(parsedStructureDefinition._properties.length === 36);

        var parsedDifferential = parsedStructureDefinition._properties[35];
        assert(parsedDifferential._name === 'differential');
        assert(parsedDifferential._properties);
        assert(parsedDifferential._properties.length === 4);

        var parsedDifferentialElement = parsedDifferential._properties[3];
        assert(parsedDifferentialElement);
        assert(parsedDifferentialElement._properties);
        assert(parsedDifferentialElement._properties.length === 0);
        assert(parsedDifferentialElement._type === 'ElementDefinition');
    });

    it('should parse SD bundles for STU3', function() {
        var types = require('./data/stu3/schema/profiles-types.json');
        var resources = require('./data/stu3/schema/profiles-resources.json');

        var parser = new ParseConformance(false, Versions.STU3);
        parser.parseBundle(types);
        parser.parseBundle(resources);

        assert(parser.parsedStructureDefinitions);

        var sdKeys = Object.keys(parser.parsedStructureDefinitions);
        assert(sdKeys.length === 173);

        var parsedAddress = parser.parsedStructureDefinitions['Address'];
        assert(parsedAddress);
        assert(parsedAddress._properties);
        assert(parsedAddress._properties.length === 12);
        assert(parsedAddress._properties[2]._name === 'use');
        assert(parsedAddress._properties[2]._type === 'code');
        assert(parsedAddress._properties[2]._valueSet === 'http://hl7.org/fhir/ValueSet/address-use');
        assert(parsedAddress._properties[2]._valueSetStrength === 'required');

        // TODO: Should have more unit tests to verify that parsing STU3 resources works properly
    });
});