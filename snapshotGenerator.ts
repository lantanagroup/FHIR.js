import {Bundle, ElementDefinition, ParseConformance, ParsedProperty, StructureDefinition} from './parseConformance';
import * as _ from 'underscore';

/**
 * Responsible for creating snapshots on StructureDefinition resources based on the differential of the profile.
 */
export class SnapshotGenerator {
    /**
     * A string that represents all options possible in STU3 and R4 for choice elements, ex: value[x], effective[x], etc.)
     * It is used to create a regex that tests that value[x] matches valueQuantity in an ElementDefinition.path.
     */
    private readonly choiceRegexString = '(Instant|Time|Date|DateTime|Decimal|Boolean|Integer|String|Uri|Base64Binary|Code|Id|Oid|UnsignedInt|PositiveInt|Markdown|Url|Canonical|Uuid|Identifier|HumanName|Address|ContactPoint|Timing|Quantity|SimpleQuantity|Attachment|Range|Period|Ratio|CodeableConcept|Coding|SampledData|Age|Distance|Duration|Count|Money|MoneyQuantity|Annotation|Signature|ContactDetail|Contributor|DataRequirement|ParameterDefinition|RelatedArtifact|TriggerDefinition|UsageContext|Expression|Reference|Narrative|Extension|Meta|ElementDefinition|Dosage|Xhtml)';

    /**
     * The parser containing FHIR versioning and base profile information
     */
    private readonly parser: ParseConformance;

    /**
     * The bundle passed into the constructor whose structure definitions should have snapshots generated
     */
    private readonly bundle: Bundle;

    /**
     * A field that tracks what profiles have been processed during the .generate() operation, so that profiles are not processed multiple times in a single run.
     */
    private processedUrls: string[] = [];

    /**
     *
     * @param parser (ParseConformance) The parser that holds FHIR version information, and has base FHIR structures loaded in it
     * @param bundle The bundle including structure definitions whose snapshot should be generated
     */
    constructor(parser: ParseConformance, bundle: Bundle) {
        this.parser = parser;
        this.bundle = bundle;
    }

    /**
     * Creates a bundle out of StructureDefinition resources. This is just for making it easier to pass a bundle to the constructor of this class.
     * @param structureDefinitions
     */
    static createBundle(...structureDefinitions: StructureDefinition[]) {
        const bundle: Bundle = {
            resourceType: 'Bundle',
            total: structureDefinitions.length,
            entry: _.map(structureDefinitions, (sd) => {
                return {resource: sd};
            })
        };
        return bundle;
    }

    /**
     * Gets a StructureDefinition based on the url and type. First determines if the url represents a base resource in the FHIR spec, then looks through
     * the bundle passed to the constructor of the class to find the structure.
     * @param url The url of the profile to retrieve
     * @param type The type of resource the profile constrains (ex: Composition, or Patient, or Person, etc.)
     */
    private getStructureDefinition(url: string, type: string) {
        const isBaseProfile = this.parser.isBaseProfile(url);
        const fhirBase = isBaseProfile ?
            _.find(this.parser.structureDefinitions, (sd) => sd.url.toLowerCase() === ('http://hl7.org/fhir/StructureDefinition/' + type).toLowerCase()) :
            null;

        if (isBaseProfile && !fhirBase) {
            throw new Error(`Base profile for ${url} not found. Perhaps the structures have not been loaded?`);
        }

        if (fhirBase) {
            return fhirBase;
        }

        const parentEntry = _.find(this.bundle.entry, (entry) => entry.resource.url === url);

        if (!parentEntry) {
            throw new Error(`Cannot find base definition "${url}" in bundle or core FHIR specification.`)
        }

        this.process(parentEntry.resource);
        return parentEntry.resource;
    }

    /**
     * Generates a snapshot for the specified structure definition. If the structure definition is based on another custom profile, that
     * custom profile is found in the bundle passed to the constructor, and the snapshot is generated for the base profile, as well (recursively).
     * @param structureDefinition The profile to create a snapshot for
     */
    private process(structureDefinition: StructureDefinition) {
        if (this.parser.isBaseProfile(structureDefinition.url) || this.processedUrls.indexOf(structureDefinition.url) >= 0) {
            return;
        }

        if (!structureDefinition.differential || !structureDefinition.differential.element || structureDefinition.differential.element.length === 0) {
            throw new Error(`Structure ${structureDefinition.url} does not have a differential.`);
        }

        const base = this.getStructureDefinition(structureDefinition.baseDefinition, structureDefinition.type);
        const newElements: ElementDefinition[] = JSON.parse(JSON.stringify(base.snapshot.element));
        const matched = _.filter(newElements, (newElement) => {
            if (newElement.path === structureDefinition.type) {
                return false;
            }

            const choiceName = newElement.path.match(/^(.*\.)?(.+)\[x\]/);
            const matching = structureDefinition.differential.element.filter((element) => {
                const regexString = newElement.path
                    .replace(/\[x\]/g, this.choiceRegexString)
                    .replace(/\./g, '\\.');
                const regex = new RegExp(regexString, 'gm');
                const isMatch = regex.test(element.path);
                return isMatch;
            });

            return matching.length > 0;
        });

        matched.forEach((snapshotElement) => {
            const snapshotIndex = newElements.indexOf(snapshotElement);
            const differentialElements = _.filter(structureDefinition.differential.element, (element) => {
                const regexString = snapshotElement.path
                        .replace(/\[x\]/g, this.choiceRegexString)
                        .replace(/\./g, '\\.') +
                    '(\\..*)?';
                const regex = new RegExp(regexString, 'gm');
                return regex.test(element.path);
            });
            const removeElements = newElements.filter((next) => next === snapshotElement || next.path.indexOf(snapshotElement.path + '.') === 0);

            _.each(removeElements, (removeElement) => {
                const index = newElements.indexOf(removeElement);
                newElements.splice(index, 1);
            });

            newElements.splice(snapshotIndex, 0, ...differentialElements);
        });

        structureDefinition.snapshot = {
            element: newElements
        };

        // Record this profile as having been processed so that we don't re-process it later
        this.processedUrls.push(structureDefinition.url);
    }

    /**
     * Generates a snapshot for all structure definitions in the bundle. If a structure definition in the bundle is a base FHIR structure definition, it is
     * assumed the structure definition already has a snapshot, and it is ignored.
     */
    generate() {
        this.processedUrls = [];

        if (this.bundle && this.bundle.entry) {
            this.bundle.entry.forEach((entry) => {
                if (!entry.resource || entry.resource.resourceType !== 'StructureDefinition') {
                    return;
                }

                this.process(entry.resource);
            });
        }
    }
}