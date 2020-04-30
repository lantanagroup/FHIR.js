export class Constants {
    static PrimitiveTypes = ['instant', 'time', 'date', 'dateTime', 'decimal', 'boolean', 'integer', 'base64Binary', 'string', 'uri', 'url', 'unsignedInt', 'positiveInt', 'code', 'id', 'oid', 'markdown', 'canonical', 'Element'];
    static DataTypes = ['Reference', 'Narrative', 'Ratio', 'Period', 'Range', 'Attachment', 'Identifier', 'HumanName', 'Annotation', 'Address', 'ContactPoint', 'SampledData', 'Quantity', 'CodeableConcept', 'Signature', 'Coding', 'Timing', 'Age', 'Distance', 'SimpleQuantity', 'Duration', 'Count', 'Money'];
    static PrimitiveNumberTypes = ['unsignedInt', 'positiveInt', 'decimal', 'integer'];
    static PrimitiveDateRegex = /([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?/i;
    static PrimitiveDateTimeRegex = /([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?/i;
    static PrimitiveTimeRegex = /([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?/i;
    static PrimitiveCodeRegex = /[^\s]+(\s[^\s]+)*/i;
    static PrimitiveOidRegex = /urn:oid:[0-2](\.[1-9]\d*)+/i;
    static PrimitiveIdRegex = /[A-Za-z0-9\-\.]{1,64}/i;
    static PrimitivePositiveIntRegex = /^(?!0+$)\d+$/i;
    static PrimitiveUnsignedIntRegex = /[0]|([1-9][0-9]*)/i;
    static PrimitiveIntegerRegex = /[0]|[-+]?[1-9][0-9]*/i;
    static PrimitiveDecimalRegex = /-?([0]|([1-9][0-9]*))(\.[0-9]+)?/i;
}