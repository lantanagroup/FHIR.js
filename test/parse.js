var ParseConformance = require('../parseConformance').ParseConformance;
var Versions = require('../fhir').Versions;
var assert = require('assert');

describe('Parse', function () {
    it('should load parsed structure definitions and value sets from cache/file', function () {
        var parser = new ParseConformance(true);

        assert(parser.parsedStructureDefinitions);
        assert.equal(Object.keys(parser.parsedStructureDefinitions).length, 211);
        assert.equal(Object.keys(parser.parsedValueSets).length, 579);
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
        assert.equal(structureDefinitionsCount, 211);
        assert(parser.parsedValueSets);
        var valueSetsCount = Object.keys(parser.parsedValueSets).length;
        assert.equal(valueSetsCount, 579);

        var noCodeValueSets = Object.keys(parser.parsedValueSets).filter((valueSetUrl) => {
            var valueSet = parser.parsedValueSets[valueSetUrl];
            var systemHasCodes = false;

            valueSet.systems.forEach((system) => {
                if (system.codes && system.codes.length >= 0) {
                    systemHasCodes = true;
                }
            });

            return !systemHasCodes;
        });

        assert(noCodeValueSets.length === 0);   // All value sets have at least one code
    });

    it('should parse value sets with extra code systems', function () {
        var valueSets = require('../profiles/r4/valuesets.json');
        var iso3166CodeSystem = require('./data/r4/codesystem-iso3166.json');
        var parser = new ParseConformance(false);
        parser.loadCodeSystem(iso3166CodeSystem);
        parser.parseBundle(valueSets);
        var valueSetsCount = Object.keys(parser.parsedValueSets).length;
        assert.equal(valueSetsCount, 582);

        var foundJurisdiction = parser.parsedValueSets['http://hl7.org/fhir/ValueSet/jurisdiction'];
        assert(!!foundJurisdiction);
    });

    it('should parse profile-StructureDefinition for STU3', function () {
        var sdProfile = require('./data/stu3/schema/profile-StructureDefinition.json');
        var parser = new ParseConformance(false, Versions.STU3);
        parser.parseStructureDefinition(sdProfile);

        var parsedStructureDefinition = parser.parsedStructureDefinitions['StructureDefinition'];
        assert(parsedStructureDefinition);
        assert(parsedStructureDefinition._properties);
        assert.strictEqual(parsedStructureDefinition._properties.length, 59);

        var parsedDifferential = parsedStructureDefinition._properties[58];
        assert.strictEqual(parsedDifferential._name, 'differential');
        assert(parsedDifferential._properties);
        assert.strictEqual(parsedDifferential._properties.length, 4);

        var parsedDifferentialElement = parsedDifferential._properties[3];
        assert(parsedDifferentialElement);
        assert(parsedDifferentialElement._properties);
        assert.strictEqual(parsedDifferentialElement._properties.length, 0);
        assert.strictEqual(parsedDifferentialElement._type, 'ElementDefinition');
    });

    it('should parse SD bundles for STU3', function () {
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
        assert.strictEqual(parsedAddress._properties.length, 22);
        assert.strictEqual(parsedAddress._properties[3]._name, 'use');
        assert.strictEqual(parsedAddress._properties[3]._type, 'code');
        assert.strictEqual(parsedAddress._properties[3]._valueSet, 'http://hl7.org/fhir/ValueSet/address-use');
        assert.strictEqual(parsedAddress._properties[3]._valueSetStrength, 'required');

        // TODO: Should have more unit tests to verify that parsing STU3 resources works properly
    });

    it('should parse custom profiles', function () {
        var bmiProfile = require('./data/r4/customProfile.json');

        var parser = new ParseConformance(true);
        parser.parseStructureDefinition(bmiProfile)
        assert.strictEqual(Object.keys(parser.parsedStructureDefinitions).length, 212);
        assert.strictEqual(parser.parsedStructureDefinitions['bmi']._properties.length, 39)
        // valueQuantity should be the only value field, because of the cardinality restriction in the bmi profile
        // valueQuantity should be required because at least one slice has a minimum cardinality of 1
        assert.strictEqual(parser.parsedStructureDefinitions['bmi']._properties.filter((p) => {
            return p._name == 'valueQuantity' && p._required == true
        }).length, 1)
        // Latest FHIR resources use code "http://hl7.org/fhirpath/System.String" instead of "id" for id
        assert.strictEqual(parser.parsedStructureDefinitions['bmi']._properties[0]._type, 'id')
        // Type of BackboneElement id should be string
        assert.strictEqual(parser.parsedStructureDefinitions['bmi']._properties.filter((p) => 
            p._name === 'referenceRange' && 
            p._properties[0]._name === 'id' &&
            p._properties[0]._type === 'string').length, 1)
        assert.strictEqual(parser.parsedStructureDefinitions['bmi']._properties.filter((p) => 
            p._name === 'referenceRange' && 
            p._properties[1]._name == '_id' && 
            p._properties[1]._type == 'Element').length, 1)
    });
});