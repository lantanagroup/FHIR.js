const { Fhir, ParseConformance, SnapshotGenerator, Versions } = require('../index');
const assert = require('assert');

describe('Reproduction of Issue #69', function() {
    this.timeout(10000);

    it('should generate snapshot for profile deriving from Extension', function() {
        const extensionUrl = 'http://hl7.org/fhir/StructureDefinition/Extension';
        const profileUrl = 'http://example.org/fhir/StructureDefinition/MyExtension';

        const extensionResource = {
            resourceType: 'StructureDefinition',
            url: extensionUrl,
            id: 'Extension',
            name: 'Extension',
            status: 'active',
            kind: 'complex-type',
            abstract: false,
            type: 'Extension',
            baseDefinition: 'http://hl7.org/fhir/StructureDefinition/Element',
            derivation: 'specialization',
            snapshot: { element: [{ id: 'Extension', path: 'Extension', min: 0, max: '*' }] }
        };

        const myExtensionResource = {
            resourceType: 'StructureDefinition',
            url: profileUrl,
            id: 'MyExtension',
            name: 'MyExtension',
            status: 'active',
            kind: 'complex-type',
            abstract: false,
            type: 'Extension',
            baseDefinition: extensionUrl,
            derivation: 'constraint',
            differential: {
                element: [
                    { id: 'Extension', path: 'Extension' },
                    { id: 'Extension.url', path: 'Extension.url', fixedUri: profileUrl }
                ]
            }
        };

        const parser = new ParseConformance(false, Versions.R4);
        parser.parseBundle({
            resourceType: 'Bundle',
            type: 'collection',
            entry: [{ resource: extensionResource }]
        });

        const fhir = new Fhir(parser);
        const bundle = {
            resourceType: 'Bundle',
            type: 'collection',
            entry: [{ resource: myExtensionResource }]
        };

        // Before fix, this would throw "Cannot find base definition ... Extension"
        fhir.generateSnapshot(bundle);

        assert(myExtensionResource.snapshot);
    });

    it('should validate against profile in meta.profile', function() {
        const profileUrl = 'http://example.org/fhir/StructureDefinition/MyPatient';
        
        const myPatientProfile = {
            resourceType: 'StructureDefinition',
            url: profileUrl,
            id: 'MyPatient',
            status: 'active',
            kind: 'resource',
            abstract: false,
            type: 'Patient',
            baseDefinition: 'http://hl7.org/fhir/StructureDefinition/Patient',
            derivation: 'constraint',
            snapshot: {
                element: [
                    { id: 'Patient', path: 'Patient', min: 0, max: '*' },
                    { id: 'Patient.meta', path: 'Patient.meta', min: 0, max: '1', type: [{ code: 'Meta' }] },
                    { id: 'Patient.name', path: 'Patient.name', min: 1, max: '*', type: [{ code: 'HumanName' }] } // Require name
                ]
            }
        };

        const parser = new ParseConformance(false, Versions.R4);
        parser.parseStructureDefinition(myPatientProfile);
        
        // Also need base Patient
        parser.parseStructureDefinition({
            resourceType: 'StructureDefinition',
            url: 'http://hl7.org/fhir/StructureDefinition/Patient',
            id: 'Patient',
            kind: 'resource',
            type: 'Patient',
            snapshot: {
                element: [
                    { id: 'Patient', path: 'Patient', min: 0, max: '*' },
                    { id: 'Patient.meta', path: 'Patient.meta', min: 0, max: '1', type: [{ code: 'Meta' }] },
                    { id: 'Patient.name', path: 'Patient.name', min: 0, max: '*', type: [{ code: 'HumanName' }] }
                ]
            }
        });

        const fhir = new Fhir(parser);
        
        // Resource claiming to be MyPatient but missing name
        const resource = {
            resourceType: 'Patient',
            meta: { profile: [profileUrl] }
        };

        const results = fhir.validate(resource);
        assert.strictEqual(results.valid, false);
        assert(results.messages.some(m => m.message.includes('Missing property')));
    });

    it('should include codes from ValueSet even if CodeSystem is missing if they are explicitly listed', function() {
        const valueSetUrl = 'http://example.org/fhir/ValueSet/my-vs';
        const systemUrl = 'http://example.org/fhir/CodeSystem/my-cs';

        const valueSet = {
            resourceType: 'ValueSet',
            url: valueSetUrl,
            status: 'active',
            compose: {
                include: [{
                    system: systemUrl,
                    concept: [{ code: 'code1', display: 'Code 1' }]
                }]
            }
        };

        const parser = new ParseConformance(false, Versions.R4);
        // Note: We are NOT loading the CodeSystem
        parser.parseBundle({
            resourceType: 'Bundle',
            type: 'collection',
            entry: [{ resource: valueSet }]
        });

        const fhir = new Fhir(parser);
        
        // Validate a resource using this code
        const results = fhir.validate({
            resourceType: 'Observation',
            status: 'final',
            code: {
                coding: [{ system: systemUrl, code: 'code1' }]
            }
        }, {
            // Manually bind Observation.code to our ValueSet for this test
            // Actually, easier to just check parser.parsedValueSets
        });

        const parsedVs = parser.parsedValueSets[valueSetUrl];
        assert(parsedVs);
        assert.strictEqual(parsedVs.systems.length, 1);
        assert.strictEqual(parsedVs.systems[0].uri, systemUrl);
        assert.strictEqual(parsedVs.systems[0].codes.length, 1);
        assert.strictEqual(parsedVs.systems[0].codes[0].code, 'code1');
    });
});
