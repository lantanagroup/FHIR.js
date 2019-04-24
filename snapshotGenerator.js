"use strict";
exports.__esModule = true;
var _ = require("underscore");
var SnapshotGenerator = (function () {
    function SnapshotGenerator(parser, bundle) {
        this.baseUrl = 'http://hl7.org/fhir/StructureDefinition/';
        this.choiceRegexString = '(Instant|Time|Date|DateTime|Decimal|Boolean|Integer|String|Uri|Base64Binary|Code|Id|Oid|UnsignedInt|PositiveInt|Markdown|Url|Canonical|Uuid|Identifier|HumanName|Address|ContactPoint|Timing|Quantity|SimpleQuantity|Attachment|Range|Period|Ratio|CodeableConcept|Coding|SampledData|Age|Distance|Duration|Count|Money|MoneyQuantity|Annotation|Signature|ContactDetail|Contributor|DataRequirement|ParameterDefinition|RelatedArtifact|TriggerDefinition|UsageContext|Expression|Reference|Narrative|Extension|Meta|ElementDefinition|Dosage|Xhtml)';
        this.processedUrls = [];
        this.parser = parser;
        this.bundle = bundle;
    }
    SnapshotGenerator.createBundle = function () {
        var structureDefinitions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            structureDefinitions[_i] = arguments[_i];
        }
        var bundle = {
            resourceType: 'Bundle',
            total: structureDefinitions.length,
            entry: _.map(structureDefinitions, function (sd) {
                return { resource: sd };
            })
        };
        return bundle;
    };
    SnapshotGenerator.prototype.getBaseStructureDefinition = function (url, type) {
        var _this = this;
        var isBaseProfile = this.parser.isBaseProfile(url);
        var fhirBase = isBaseProfile ?
            _.find(this.parser.structureDefinitions, function (sd) { return sd.url.toLowerCase() === (_this.baseUrl + type).toLowerCase(); }) :
            null;
        if (isBaseProfile && !fhirBase) {
            throw new Error("Base profile for " + url + " not found. Perhaps the structures have not been loaded?");
        }
        if (fhirBase) {
            return fhirBase;
        }
        var parentEntry = _.find(this.bundle.entry, function (entry) { return entry.resource.url === url; });
        if (!parentEntry) {
            throw new Error("Cannot find base definition \"" + url + "\" in bundle or core FHIR specification.");
        }
        this.process(parentEntry.resource);
        return parentEntry.resource;
    };
    SnapshotGenerator.prototype.process = function (structureDefinition) {
        var _this = this;
        if (this.parser.isBaseProfile(structureDefinition.url) || this.processedUrls.indexOf(structureDefinition.url) >= 0) {
            return;
        }
        if (!structureDefinition.differential || !structureDefinition.differential.element || structureDefinition.differential.element.length === 0) {
            throw new Error("Structure " + structureDefinition.url + " does not have a differential.");
        }
        var base = this.getBaseStructureDefinition(structureDefinition.baseDefinition, structureDefinition.type);
        var newElements = JSON.parse(JSON.stringify(base.snapshot.element));
        var matched = _.filter(newElements, function (newElement) {
            if (newElement.path === structureDefinition.type) {
                return false;
            }
            var choiceName = newElement.path.match(/^(.*\.)?(.+)\[x\]/);
            var matching = structureDefinition.differential.element.filter(function (element) {
                var regexString = newElement.path
                    .replace(/\[x\]/g, _this.choiceRegexString)
                    .replace(/\./g, '\\.');
                var regex = new RegExp(regexString, 'gm');
                var isMatch = regex.test(element.path);
                return isMatch;
            });
            return matching.length > 0;
        });
        matched.forEach(function (snapshotElement) {
            var snapshotIndex = newElements.indexOf(snapshotElement);
            var differentialElements = _.filter(structureDefinition.differential.element, function (element) {
                var regexString = snapshotElement.path
                    .replace(/\[x\]/g, _this.choiceRegexString)
                    .replace(/\./g, '\\.') +
                    '(\\..*)?';
                var regex = new RegExp(regexString, 'gm');
                return regex.test(element.path);
            });
            var removeElements = newElements.filter(function (next) { return next === snapshotElement || next.path.indexOf(snapshotElement.path + '.') === 0; });
            _.each(removeElements, function (removeElement) {
                var index = newElements.indexOf(removeElement);
                newElements.splice(index, 1);
            });
            newElements.splice.apply(newElements, [snapshotIndex, 0].concat(differentialElements));
        });
        structureDefinition.snapshot = {
            element: newElements
        };
        this.processedUrls.push(structureDefinition.url);
    };
    SnapshotGenerator.prototype.generate = function () {
        var _this = this;
        this.processedUrls = [];
        if (this.bundle && this.bundle.entry) {
            this.bundle.entry.forEach(function (entry) {
                if (!entry.resource || entry.resource.resourceType !== 'StructureDefinition') {
                    return;
                }
                _this.process(entry.resource);
            });
        }
    };
    return SnapshotGenerator;
}());
exports.SnapshotGenerator = SnapshotGenerator;
//# sourceMappingURL=snapshotGenerator.js.map