"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotGenerator = void 0;
class SnapshotGenerator {
    constructor(parser, bundle) {
        this.choiceRegexString = '(Instant|Time|Date|DateTime|Decimal|Boolean|Integer|String|Uri|Base64Binary|Code|Id|Oid|UnsignedInt|PositiveInt|Markdown|Url|Canonical|Uuid|Identifier|HumanName|Address|ContactPoint|Timing|Quantity|SimpleQuantity|Attachment|Range|Period|Ratio|CodeableConcept|Coding|SampledData|Age|Distance|Duration|Count|Money|MoneyQuantity|Annotation|Signature|ContactDetail|Contributor|DataRequirement|ParameterDefinition|RelatedArtifact|TriggerDefinition|UsageContext|Expression|Reference|Narrative|Extension|Meta|ElementDefinition|Dosage|Xhtml)';
        this.processedUrls = [];
        this.parser = parser;
        this.bundle = bundle;
    }
    static createBundle(...structureDefinitions) {
        const entries = structureDefinitions.map((sd) => {
            return { resource: sd };
        });
        const bundle = {
            resourceType: 'Bundle',
            total: structureDefinitions.length,
            entry: entries
        };
        return bundle;
    }
    getStructureDefinition(url, type) {
        const isBaseProfile = this.parser.isBaseProfile(url);
        const fhirBase = isBaseProfile ?
            this.parser.structureDefinitions.find(sd => sd.url.toLowerCase() === ('http://hl7.org/fhir/StructureDefinition/' + type).toLowerCase()) :
            null;
        if (isBaseProfile && !fhirBase) {
            throw new Error(`Base profile for ${url} not found. Perhaps the structures have not been loaded?`);
        }
        if (fhirBase) {
            return fhirBase;
        }
        const parentEntry = this.bundle.entry.find(entry => entry.resource.url === url);
        if (!parentEntry) {
            throw new Error(`Cannot find base definition "${url}" in bundle or core FHIR specification.`);
        }
        this.process(parentEntry.resource);
        return parentEntry.resource;
    }
    merge(diff, snapshot) {
        const dest = JSON.parse(JSON.stringify(snapshot));
        const explicitOverwrites = ['id', 'representation', 'sliceName', 'sliceIsConstraining', 'label', 'code', 'short', 'definition', 'comment', 'requirements', 'alias', 'min', 'max', 'contentReference',
            'meaningWhenMissing', 'orderMeaning', 'maxLength', 'condition', 'mustSupport', 'isModifier', 'isModifierReason', 'isSummary', 'example'];
        for (let eo of explicitOverwrites) {
            if (diff.hasOwnProperty(eo))
                dest[eo] = diff[eo];
        }
        if (diff.slicing && dest.slicing) {
            if (diff.slicing.hasOwnProperty('discriminator'))
                dest.slicing.discriminator = diff.slicing.discriminator;
            if (diff.slicing.hasOwnProperty('description'))
                dest.slicing.description = diff.slicing.description;
            if (diff.slicing.hasOwnProperty('ordered'))
                dest.slicing.ordered = diff.slicing.ordered;
            if (diff.slicing.hasOwnProperty('rules'))
                dest.slicing.rules = diff.slicing.rules;
        }
        else if (diff.slicing) {
            dest.slicing = diff.slicing;
        }
        if (diff.base && dest.base) {
            if (diff.base.hasOwnProperty('path'))
                dest.base.path = diff.base.path;
            if (diff.base.hasOwnProperty('min'))
                dest.base.min = diff.base.min;
            if (diff.base.hasOwnProperty('max'))
                dest.base.max = diff.base.max;
        }
        else if (diff.base) {
            dest.base = diff.base;
        }
        if (diff.type && dest.type) {
            for (let dt of dest.type) {
                const diffType = diff.type.find(t => t.code === dt.code);
                if (diffType) {
                    if (diffType.hasOwnProperty('profile'))
                        dt.profile = diffType.profile;
                    if (diffType.hasOwnProperty('targetProfile'))
                        dt.targetProfile = diffType.targetProfile;
                    if (diffType.hasOwnProperty('aggregation'))
                        dt.aggregation = diffType.aggregation;
                    if (diffType.hasOwnProperty('versioning'))
                        dt.versioning = diffType.versioning;
                }
            }
            for (let diffType of diff.type) {
                if (!dest.type.find(t => t.code === diffType.code)) {
                    dest.type.push(JSON.parse(JSON.stringify(diffType)));
                }
            }
        }
        else if (diff.type) {
            dest.type = diff.type;
        }
        if (diff.constraint && dest.constraint) {
            for (let dc of dest.constraint) {
                const diffConstraint = diff.constraint.find(c => c.key === dc.key);
                if (diffConstraint) {
                    if (diffConstraint.hasOwnProperty('requirements'))
                        dc.requirements = diffConstraint.requirements;
                    if (diffConstraint.hasOwnProperty('severity'))
                        dc.severity = diffConstraint.severity;
                    if (diffConstraint.hasOwnProperty('human'))
                        dc.human = diffConstraint.human;
                    if (diffConstraint.hasOwnProperty('expression'))
                        dc.expression = diffConstraint.expression;
                    if (diffConstraint.hasOwnProperty('xpath'))
                        dc.xpath = diffConstraint.xpath;
                    if (diffConstraint.hasOwnProperty('source'))
                        dc.source = diffConstraint.source;
                }
            }
            for (let diffConstraint of diff.constraint) {
                if (!dest.constraint.find(c => c.key === diffConstraint.key)) {
                    dest.constraint.push(JSON.parse(JSON.stringify(diffConstraint)));
                }
            }
        }
        else if (diff.constraint) {
            dest.constraint = diff.constraint;
        }
        const diffKeys = Object.keys(diff);
        const destKeys = Object.keys(dest);
        const diffDefaultValueKey = diffKeys.find(k => k.startsWith('defaultValue'));
        const diffMinValueKey = diffKeys.find(k => k.startsWith('minValue'));
        const diffMaxValueKey = diffKeys.find(k => k.startsWith('maxValue'));
        const diffFixedKey = diffKeys.find(k => k.startsWith('fixed'));
        const diffPatternKey = diffKeys.find(k => k.startsWith('pattern'));
        const destDefaultValueKey = destKeys.find(k => k.startsWith('defaultValue'));
        const destMinValueKey = destKeys.find(k => k.startsWith('minValue'));
        const destMaxValueKey = destKeys.find(k => k.startsWith('maxValue'));
        const destFixedKey = destKeys.find(k => k.startsWith('fixed'));
        const destPatternKey = destKeys.find(k => k.startsWith('pattern'));
        if (diffDefaultValueKey) {
            if (destDefaultValueKey)
                delete dest[destDefaultValueKey];
            dest[diffDefaultValueKey] = diff[diffDefaultValueKey];
        }
        if (diffMinValueKey) {
            if (destMinValueKey)
                delete dest[destMinValueKey];
            dest[diffMinValueKey] = diff[diffMinValueKey];
        }
        if (diffMaxValueKey) {
            if (destMaxValueKey)
                delete dest[destMaxValueKey];
            dest[diffMaxValueKey] = diff[diffMaxValueKey];
        }
        if (diffFixedKey) {
            if (destFixedKey)
                delete dest[destFixedKey];
            dest[diffFixedKey] = diff[diffFixedKey];
        }
        if (diffPatternKey) {
            if (destPatternKey)
                delete dest[destPatternKey];
            dest[diffPatternKey] = diff[diffPatternKey];
        }
        return dest;
    }
    process(structureDefinition) {
        if (this.parser.isBaseProfile(structureDefinition.url) || this.processedUrls.indexOf(structureDefinition.url) >= 0) {
            return;
        }
        if (!structureDefinition.differential || !structureDefinition.differential.element || structureDefinition.differential.element.length === 0) {
            throw new Error(`Structure ${structureDefinition.url} does not have a differential.`);
        }
        const base = this.getStructureDefinition(structureDefinition.baseDefinition, structureDefinition.type);
        const newElements = JSON.parse(JSON.stringify(base.snapshot.element));
        const matched = newElements.filter(newElement => {
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
            const differentialElements = structureDefinition.differential.element.filter(element => {
                const regexString = snapshotElement.path
                    .replace(/\[x\]/g, this.choiceRegexString)
                    .replace(/\./g, '\\.') +
                    '(\\..*)?';
                const regex = new RegExp(regexString, 'gm');
                return regex.test(element.path);
            });
            const removeElements = newElements.filter((next) => next === snapshotElement || next.path.indexOf(snapshotElement.path + '.') === 0);
            removeElements.forEach(removeElement => {
                const index = newElements.indexOf(removeElement);
                newElements.splice(index, 1);
            });
            for (let i = differentialElements.length - 1; i >= 0; i--) {
                const found = (base.snapshot && base.snapshot.element ? base.snapshot.element : [])
                    .find(e => e.path === differentialElements[i].path);
                const diff = found ? this.merge(differentialElements[i], found) : differentialElements[i];
                newElements.splice(snapshotIndex, 0, diff);
            }
        });
        structureDefinition.snapshot = {
            element: newElements
        };
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
exports.SnapshotGenerator = SnapshotGenerator;
//# sourceMappingURL=snapshotGenerator.js.map