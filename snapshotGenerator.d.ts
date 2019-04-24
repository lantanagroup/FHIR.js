import { Bundle, ParseConformance, StructureDefinition } from './parseConformance';
export declare class SnapshotGenerator {
    readonly baseUrl = "http://hl7.org/fhir/StructureDefinition/";
    readonly choiceRegexString = "(Instant|Time|Date|DateTime|Decimal|Boolean|Integer|String|Uri|Base64Binary|Code|Id|Oid|UnsignedInt|PositiveInt|Markdown|Url|Canonical|Uuid|Identifier|HumanName|Address|ContactPoint|Timing|Quantity|SimpleQuantity|Attachment|Range|Period|Ratio|CodeableConcept|Coding|SampledData|Age|Distance|Duration|Count|Money|MoneyQuantity|Annotation|Signature|ContactDetail|Contributor|DataRequirement|ParameterDefinition|RelatedArtifact|TriggerDefinition|UsageContext|Expression|Reference|Narrative|Extension|Meta|ElementDefinition|Dosage|Xhtml)";
    readonly parser: ParseConformance;
    readonly bundle: Bundle;
    private processedUrls;
    constructor(parser: ParseConformance, bundle: Bundle);
    static createBundle(...structureDefinitions: StructureDefinition[]): Bundle;
    private getBaseStructureDefinition;
    private process;
    generate(): void;
}
