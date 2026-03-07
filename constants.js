"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
class Constants {
}
exports.Constants = Constants;
Constants.PrimitiveTypes = ['instant', 'time', 'date', 'dateTime', 'decimal', 'boolean', 'integer', 'base64Binary', 'string', 'uri', 'url', 'unsignedInt', 'positiveInt', 'code', 'id', 'oid', 'markdown', 'canonical', 'Element'];
Constants.DataTypes = ['Reference', 'Narrative', 'Ratio', 'Period', 'Range', 'Attachment', 'Identifier', 'HumanName', 'Annotation', 'Address', 'ContactPoint', 'SampledData', 'Quantity', 'CodeableConcept', 'Signature', 'Coding', 'Timing', 'Age', 'Distance', 'SimpleQuantity', 'Duration', 'Count', 'Money'];
Constants.PrimitiveNumberTypes = ['unsignedInt', 'positiveInt', 'decimal', 'integer'];
Constants.PrimitiveDateRegex = /([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?/i;
Constants.PrimitiveDateTimeRegex = /([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?/i;
Constants.PrimitiveTimeRegex = /([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?/i;
Constants.PrimitiveCodeRegex = /[^\s]+(\s[^\s]+)*/i;
Constants.PrimitiveOidRegex = /urn:oid:[0-2](\.[1-9]\d*)+/i;
Constants.PrimitiveIdRegex = /[A-Za-z0-9\-\.]{1,64}/i;
Constants.PrimitivePositiveIntRegex = /^(?!0+$)\d+$/i;
Constants.PrimitiveUnsignedIntRegex = /[0]|([1-9][0-9]*)/i;
Constants.PrimitiveIntegerRegex = /[0]|[-+]?[1-9][0-9]*/i;
Constants.PrimitiveDecimalRegex = /-?([0]|([1-9][0-9]*))(\.[0-9]+)?/i;
//# sourceMappingURL=constants.js.map