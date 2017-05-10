var primitiveTypes = ['Instant', 'Date', 'DateTime', 'Decimal', 'Boolean', 'Integer', 'String', 'Uri', 'Base64Binary', 'Code', 'Id', 'Oid', 'Uuid', 'markdown', 'unsignedInt', 'positiveInt'];
var choiceTypes = ['Integer', 'Decimal', 'DateTime', 'Date', 'Instant', 'String', 'Uri', 'Boolean', 'Code', 'base64Binary', 'Coding', 'CodeableConcept', 'Attachment', 'Identifier', 'Quantity', 'Range', 'Period', 'Ratio', 'HumanName', 'Address', 'Reference', 'Signature', 'Timing', 'ContactPoint', 'Markdown'];

var _ = require('lodash');

var util = {
    PrimitiveTypes: primitiveTypes,
    ChoiceTypes: choiceTypes,
    FindElement: function(elementPath, profiles, fhirVersion) {
        var elementPathSplit = elementPath.split('.');
        var profile = profiles[elementPathSplit[0]];

        if (fhirVersion != 2 && elementPathSplit[elementPathSplit.length - 1] == 'extension') {
            return {
                path: elementPath,
                definition: {
                    short: 'extension',
                    formal: 'extension',
                    min: 0,
                    max: '*',
                    type: [{
                        code: 'extension'
                    }]
                }
            };
        }

        var profileElementPath = elementPath;
        var elementPathSplit = elementPath.split('.');
        var leafPath = elementPathSplit[elementPathSplit.length-1];
        var selectedChoiceType = null;

        if (util.ChoiceElements[leafPath]) {
            for (var i in choiceTypes) {
                var choiceType = choiceTypes[i];
                var choiceIndex = leafPath.length - choiceType.length;

                if (choiceIndex > 0 && leafPath.indexOf(choiceType) == choiceIndex) {
                    elementPathSplit[elementPathSplit.length-1] = leafPath.substring(0, leafPath.length - choiceType.length) + '[x]';
                    profileElementPath = elementPathSplit.join('.');
                    selectedChoiceType = choiceType;
                    break;
                }
            }
        }

        if (profile) {
            var elementDefinition = _.find(profile.snapshot.element, function(elementDef) {
                return elementDef.path == profileElementPath;
            });

            if (elementDefinition) {
                // TODO: Should figure out a better way not to modify the base profile (since JSON.parse/stringify is a little costly)...
                // Maybe a completely custom return type for FindElement
                var newElement = JSON.parse(JSON.stringify(elementDefinition));

                if (selectedChoiceType) {
                    newElement.type = [{
                        code: selectedChoiceType
                    }];
                }

                return newElement;
            }
        }

        return;
    },

    IsPrimitive: function(elementType) {
        if (!elementType) {
            return false;
        }

        for (var x in primitiveTypes) {
            var primitiveType = primitiveTypes[x];

            if (primitiveType.toLowerCase() == elementType.toLowerCase()) {
                return true;
            }
        }

        return false;
    },

    ChoiceElements: {
        "valueBase64Binary": "base64Binary",
        "valueBoolean": "boolean",
        "valueCode": "code",
        "valueDate": "date",
        "valueDateTime": "dateTime",
        "valueDecimal": "decimal",
        "valueId": "id",
        "valueInstant": "instant",
        "valueInteger": "integer",
        "valueMarkdown": "markdown",
        "valueOid": "oid",
        "valuePositiveInt": "positiveInt",
        "valueString": "string",
        "valueTime": "time",
        "valueUnsignedInt": "unsignedInt",
        "valueUri": "uri",
        "valueAddress": "Address",
        "valueAge": "Age",
        "valueAnnotation": "Annotation",
        "valueAttachment": "Attachment",
        "valueCodeableConcept": "CodeableConcept",
        "valueCoding": "Coding",
        "valueContactPoint": "ContactPoint",
        "valueCount": "Count",
        "valueDistance": "Distance",
        "valueDuration": "Duration",
        "valueHumanName": "HumanName",
        "valueIdentifier": "Identifier",
        "valueMoney": "Money",
        "valuePeriod": "Period",
        "valueQuantity": "Quantity",
        "valueRange": "Range",
        "valueRatio": "Ratio",
        "valueReference": "Reference",
        "valueSampledData": "SampledData",
        "valueSignature": "Signature",
        "valueTiming": "Timing",
        "valueMeta": "Meta",
        "timingDateTime": "dateTime",
        "timingPeriod": "Period",
        "timingDuration": "Duration",
        "timingRange": "Range",
        "timingTiming": "Timing",
        "productCodeableConcept": "CodeableConcept",
        "productReference": "Reference",
        "onsetAge": "Age",
        "onsetRange": "Range",
        "onsetPeriod": "Period",
        "onsetString": "string",
        "scheduledDateTime": "dateTime",
        "scheduledPeriod": "Period",
        "scheduledTiming": "Timing",
        "diagnosisCodeableConcept": "CodeableConcept",
        "diagnosisReference": "Reference",
        "procedureCodeableConcept": "CodeableConcept",
        "procedureReference": "Reference",
        "locationCodeableConcept": "CodeableConcept",
        "locationAddress": "Address",
        "locationReference": "Reference",
        "servicedDate": "date",
        "servicedPeriod": "Period",
        "effectiveDateTime": "dateTime",
        "effectivePeriod": "Period",
        "itemCodeableConcept": "CodeableConcept",
        "itemReference": "Reference",
        "contentAttachment": "Attachment",
        "contentReference": "Reference",
        "sourceUri": "uri",
        "sourceReference": "Reference",
        "targetDate": "date",
        "targetDuration": "Duration",
        "abatementDateTime": "dateTime",
        "abatementAge": "Age",
        "abatementBoolean": "boolean",
        "abatementPeriod": "Period",
        "abatementRange": "Range",
        "abatementString": "string",
        "entityCodeableConcept": "CodeableConcept",
        "entityReference": "Reference",
        "bindingAttachment": "Attachment",
        "bindingReference": "Reference",
        "deviceReference": "Reference",
        "deviceCodeableConcept": "CodeableConcept",
        "occurrenceDateTime": "dateTime",
        "occurrencePeriod": "Period",
        "pAttachment": "Attachment",
        "pReference": "Reference",
        "benefitUnsignedInt": "unsignedInt",
        "benefitString": "string",
        "benefitMoney": "Money",
        "benefitUsedUnsignedInt": "unsignedInt",
        "benefitUsedMoney": "Money",
        "partyIdentifier": "Identifier",
        "partyReference": "Reference",
        "bornPeriod": "Period",
        "bornDate": "date",
        "bornString": "string",
        "ageAge": "Age",
        "ageRange": "Range",
        "ageString": "string",
        "deceasedBoolean": "boolean",
        "deceasedDateTime": "dateTime",
        "startDate": "date",
        "startCodeableConcept": "CodeableConcept",
        "resultCodeableConcept": "CodeableConcept",
        "resultReference": "Reference",
        "reasonCodeableConcept": "CodeableConcept",
        "reasonReference": "Reference",
        "medicationCodeableConcept": "CodeableConcept",
        "medicationReference": "Reference",
        "rateQuantity": "Quantity",
        "rateRatio": "Ratio",
        "valueSetUri": "uri",
        "valueSetReference": "Reference",
        "multipleBirthBoolean": "boolean",
        "multipleBirthInteger": "integer",
        "offsetDuration": "Duration",
        "offsetRange": "Range",
        "performedDateTime": "dateTime",
        "performedPeriod": "Period",
        "asNeededBoolean": "boolean",
        "asNeededCodeableConcept": "CodeableConcept",
        "whoUri": "uri",
        "whoReference": "Reference",
        "onBehalfOfUri": "uri",
        "onBehalfOfReference": "Reference",
        "answerBoolean": "boolean",
        "answerDecimal": "decimal",
        "answerInteger": "integer",
        "answerDate": "date",
        "answerDateTime": "dateTime",
        "answerInstant": "instant",
        "answerTime": "time",
        "answerString": "string",
        "answerUri": "uri",
        "answerAttachment": "Attachment",
        "answerCoding": "Coding",
        "answerQuantity": "Quantity",
        "answerReference": "Reference",
        "initialBoolean": "boolean",
        "initialDecimal": "decimal",
        "initialInteger": "integer",
        "initialDate": "date",
        "initialDateTime": "dateTime",
        "initialInstant": "instant",
        "initialTime": "time",
        "initialString": "string",
        "initialUri": "uri",
        "initialAttachment": "Attachment",
        "initialCoding": "Coding",
        "initialQuantity": "Quantity",
        "initialReference": "Reference",
        "probabilityDecimal": "decimal",
        "probabilityRange": "Range",
        "probabilityCodeableConcept": "CodeableConcept",
        "whenPeriod": "Period",
        "whenRange": "Range",
        "collectedDateTime": "dateTime",
        "collectedPeriod": "Period",
        "timeDateTime": "dateTime",
        "timePeriod": "Period",
        "additiveCodeableConcept": "CodeableConcept",
        "additiveReference": "Reference",
        "substanceCodeableConcept": "CodeableConcept",
        "substanceReference": "Reference",
        "suppliedItemCodeableConcept": "CodeableConcept",
        "suppliedItemReference": "Reference",
        "orderedItemCodeableConcept": "CodeableConcept",
        "orderedItemReference": "Reference",
        "definitionUri": "uri",
        "definitionReference": "Reference"
    }
};

module.exports = util;