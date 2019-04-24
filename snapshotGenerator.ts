import {Bundle, ElementDefinition, ParseConformance, ParsedProperty, StructureDefinition} from './parseConformance';
import * as _ from 'underscore';

export class SnapshotGenerator {
    readonly baseUrl = 'http://hl7.org/fhir/StructureDefinition/';
    readonly choiceRegexString = '(Instant|Time|Date|DateTime|Decimal|Boolean|Integer|String|Uri|Base64Binary|Code|Id|Oid|UnsignedInt|PositiveInt|Markdown|Url|Canonical|Uuid|Identifier|HumanName|Address|ContactPoint|Timing|Quantity|SimpleQuantity|Attachment|Range|Period|Ratio|CodeableConcept|Coding|SampledData|Age|Distance|Duration|Count|Money|MoneyQuantity|Annotation|Signature|ContactDetail|Contributor|DataRequirement|ParameterDefinition|RelatedArtifact|TriggerDefinition|UsageContext|Expression|Reference|Narrative|Extension|Meta|ElementDefinition|Dosage|Xhtml)';

    readonly parser: ParseConformance;
    readonly bundle: Bundle;
    private processedUrls: string[] = [];

    constructor(parser: ParseConformance, bundle: Bundle) {
        this.parser = parser;
        this.bundle = bundle;
    }

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

    private getBaseStructureDefinition(url: string, type: string) {
        const isBaseProfile = this.parser.isBaseProfile(url);
        const fhirBase = isBaseProfile ?
            _.find(this.parser.structureDefinitions, (sd) => sd.url.toLowerCase() === (this.baseUrl + type).toLowerCase()) :
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

    private process(structureDefinition: StructureDefinition) {
        if (this.parser.isBaseProfile(structureDefinition.url) || this.processedUrls.indexOf(structureDefinition.url) >= 0) {
            return;
        }

        if (!structureDefinition.differential || !structureDefinition.differential.element || structureDefinition.differential.element.length === 0) {
            throw new Error(`Structure ${structureDefinition.url} does not have a differential.`);
        }

        const base = this.getBaseStructureDefinition(structureDefinition.baseDefinition, structureDefinition.type);
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