import * as _ from 'underscore';
import {ConvertToJs} from './convertToJs';
import {ParseConformance, ParsedProperty, ParsedStructure, ParsedValueSet} from './parseConformance';

export interface ValidatorOptions {

    /**
     * Indicates an error should be thrown when an unexpected property is found
     */
    errorOnUnexpected?: boolean;

    /**
     * @event
     * An event that is triggered when a resource is validated. This may be triggered multiple times
     * when validating a bundle, or when validating a resource with contained resources.
     */
    onBeforeValidateResource?: (resource: any) => ValidatorMessage[];

    /**
     * @event
     * An event that is triggered whenever a property is validated. This is a common event that can occurs 100's of times
     * in a bundle.
     */
    onBeforeValidateProperty?: (property: ParsedProperty, treeDisplay: string, value: any) => ValidatorMessage[];

    /**
     * @event
     * An event that is triggered when an error is encountered during validation
     */
    onError?: (message: ValidatorMessage) => void;
}

export interface ValidatorMessage {
    /**
     * The location in the XML or object which the error occurred.
     * @example ValueSet.compose.system.concept
     */
    location?: string;

    /**
     * The Resource.id of the resource that the message was found within. This is "#initial" for the first resource being validated
     */
    resourceId?: string;

    /**
     * The severity of the message
     */
    severity?: Severities;

    /**
     * A custom message that provides guidance on what should be changed
     */
    message?: string;
}

export interface ValidatorResponse {
    valid: boolean;
    messages: ValidatorMessage[];
}

/**
 * The various severities that can be encountered during validation
 */
export enum Severities {
    /**
     * Indicates a FATAL issue that interrupted validation
     */
    Fatal = 'fatal',
    Error = 'error',
    Warning = 'warning',

    /**
     * Purely informational. More for debugging than anything.
     */
    Information = 'info'
}

class Constants {
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

export class Validator {
    private isXml = false;
    private obj: any;
    private resourceId?: string;
    readonly parser: ParseConformance;
    readonly options: ValidatorOptions;
    public response: ValidatorResponse = {
        valid: true,
        messages: []
    };

    /**
     *
     * @param parser {ParseConformance}
     * @param resourceId {string?}
     * @param isXml {boolean?}
     * @param options
     */
    constructor(parser: ParseConformance, options: ValidatorOptions, resourceId?: string, isXml?: boolean) {
        this.parser = parser;
        this.options = options || {};
        this.resourceId = resourceId;
        this.isXml = isXml;
    }

    /**
     * Validates the specified input (xml as a string, json also as a string, or a resource represented as a javascript object)
     * @param input {string|json|*} The input resource to validate
     */
    public validate(input: any) {
        if (typeof(input) === 'string' && input.indexOf('{') === 0) {
            this.obj = JSON.parse(input);
        } else if (typeof(input) === 'string') {
            this.obj = new ConvertToJs().convert(input);
            this.isXml = true;
        } else {
            this.obj = input;
        }

        const typeDefinition: ParsedStructure = this.parser.parsedStructureDefinitions[this.obj.resourceType];

        this.resourceId = this.obj.id || '#initial';

        if (this.options && this.options.onBeforeValidateResource) {
            const eventMessages = this.options.onBeforeValidateResource(this.obj);
            if (eventMessages) {
                this.response.messages = this.response.messages.concat(eventMessages);
            }
        }

        if (!this.obj || !typeDefinition) {
            this.addFatal('', 'Resource does not have resourceType property, or value is not a valid resource type.');
        } else {
            this.validateProperties(this.obj, typeDefinition._properties, [this.obj.resourceType]);
        }

        return this.response;
    }

    static getTreeDisplay(tree, isXml?, leaf?): string {
        let display = '';

        for (let i = 0; i < tree.length; i++) {
            if (display) {
                if (isXml) {
                    display += '/';
                } else {
                    display += '.';
                }
            }

            display += tree[i];
        }

        if (leaf) {
            if (display) {
                if (isXml) {
                    display += '/';
                } else {
                    display += '.';
                }
            }

            display += leaf;
        }

        return display;
    }

    private checkCode(valueSet: ParsedValueSet, code, system?) {
        if (system) {
            const foundSystem = _.find(valueSet.systems, (nextSystem) => {
                return nextSystem.uri === system;
            });

            if (foundSystem) {
                const foundCode = _.find(foundSystem.codes, (nextCode) => {
                    return nextCode.code === code;
                });

                return !!foundCode;
            } else {
                return false;
            }
        } else {
            let valid = false;

            _.each(valueSet.systems, function(nextSystem) {
                const foundCode = _.find(nextSystem.codes, (nextCode) => {
                    return nextCode.code === code;
                });

                if (foundCode) {
                    valid = true;
                }
            });

            return valid;
        }
    }

    private addError(location: string, message: string) {
        const theMessage = {
            location: location,
            resourceId: this.resourceId,
            severity: Severities.Error,
            message: message
        };

        this.response.valid = false;
        this.response.messages.push(theMessage);

        if (this.options.onError) {
            this.options.onError(theMessage);
        }
    };

    private addFatal(location: string, message: string) {
        this.response.valid = false;
        this.response.messages.push({
            location: location,
            resourceId: this.resourceId,
            severity: Severities.Fatal,
            message: message
        });
    };

    private addWarn(location: string, message: string) {
        this.response.messages.push({
            location: location,
            resourceId: this.resourceId,
            severity: Severities.Warning,
            message: message
        });
    };

    private addInfo(location: string, message: string) {
        this.response.messages.push({
            location: location,
            resourceId: this.resourceId,
            severity: Severities.Information,
            message: message
        });
    };

    private validateNext(obj, property: ParsedProperty, tree) {
        const treeDisplay = Validator.getTreeDisplay(tree, this.isXml);
        const propertyTypeStructure = this.parser.parsedStructureDefinitions[property._type];

        if (property._valueSet) {
            const foundValueSet = _.find(this.parser.parsedValueSets, (valueSet, valueSetKey) => valueSetKey === property._valueSet);

            if (!foundValueSet) {
                this.addInfo(treeDisplay, 'Value set "' + property._valueSet + '" could not be found.');
            } else {
                if (property._type === 'CodeableConcept') {
                    let found = false;

                    _.each(obj.coding, (coding) => {
                        if (this.checkCode(foundValueSet, coding.code, coding.system)) {
                            found = true;
                        } else {
                            const msg = 'Code "' + coding.code + '" ' + (coding.system ? '(' + coding.system + ')' : '') + ' not found in value set';
                            if (property._valueSetStrength === 'required') {
                                this.addError(treeDisplay, msg);
                            } else {
                                this.addWarn(treeDisplay, msg);
                            }
                        }
                    });

                    if (!found) {
                        // TODO: If the CodeableConcept is required, does that mean a coding is required? Don't think so...
                    }
                } else if (property._type === 'Coding') {
                    if (!this.checkCode(foundValueSet, obj.code, obj.system)) {
                        const msg = 'Code "' + obj.code + '" ' + (obj.system ? '(' + obj.system + ')' : '') + ' not found in value set';
                        if (property._valueSetStrength === 'required') {
                            this.addError(treeDisplay, msg);
                        } else {
                            this.addWarn(treeDisplay, msg);
                        }
                    }
                } else if (property._type === 'code') {
                    if (!this.checkCode(foundValueSet, obj)) {
                        if (property._valueSetStrength === 'required') {
                            this.addError(treeDisplay, 'Code "' + obj + '" not found in value set');
                        } else {
                            this.addWarn(treeDisplay, 'Code "' + obj + '" not found in value set');
                        }
                    }
                }
            }
        }

        if (Constants.PrimitiveTypes.indexOf(property._type) >= 0) {
            if (property._type === 'boolean' && obj.toString().toLowerCase() !== 'true' && obj.toString().toLowerCase() !== 'false') {
                this.addError(treeDisplay, 'Invalid format for boolean value "' + obj.toString() + '"');
            } else if (Constants.PrimitiveNumberTypes.indexOf(property._type) >= 0) {
                if (typeof(obj) === 'string') {
                    if (property._type === 'integer' && !Constants.PrimitiveIntegerRegex.test(obj)) {
                        this.addError(treeDisplay, 'Invalid integer format for value "' + obj + '"');
                    } else if (property._type === 'decimal' && !Constants.PrimitiveDecimalRegex.test(obj)) {
                        this.addError(treeDisplay, 'Invalid decimal format for value "' + obj + '"');
                    } else if (property._type === 'unsignedInt' && !Constants.PrimitiveUnsignedIntRegex.test(obj)) {
                        this.addError(treeDisplay, 'Invalid unsigned integer format for value "' + obj + '"');
                    } else if (property._type === 'positiveInt' && !Constants.PrimitivePositiveIntRegex.test(obj)) {
                        this.addError(treeDisplay, 'Invalid positive integer format for value "' + obj + '"');
                    }
                }
            } else if (property._type === 'date' && !Constants.PrimitiveDateRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid date format for value "' + obj + '"');
            } else if (property._type === 'dateTime' && !Constants.PrimitiveDateTimeRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid dateTime format for value "' + obj + '"');
            } else if (property._type === 'time' && !Constants.PrimitiveTimeRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid time format for value "' + obj + '"');
            } else if (property._type === 'code' && !Constants.PrimitiveCodeRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid code format for value "' + obj + '"');
            } else if (property._type === 'oid' && !Constants.PrimitiveOidRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid oid format for value "' + obj + '"');
            } else if (property._type === 'id' && !Constants.PrimitiveIdRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid id format for value "' + obj + '"');
            }
        } else if (property._type === 'Resource') {
            const typeDefinition = this.parser.parsedStructureDefinitions[obj.resourceType];
            const nextValidationInstance = new Validator(this.parser, this.options, obj.id || Validator.getTreeDisplay(tree, this.isXml), this.isXml);

            if (this.options && this.options.onBeforeValidateResource) {
                const eventMessages = this.options.onBeforeValidateResource(obj);
                if (eventMessages) {
                    this.response.messages = this.response.messages.concat(eventMessages);
                }
            }

            if (!obj.resourceType || !typeDefinition) {
                nextValidationInstance.addFatal('', 'Resource does not have resourceType property, or value is not a valid resource type.');
            } else {
                nextValidationInstance.validateProperties(obj, typeDefinition._properties, [obj.resourceType]);
            }

            const nextValidationResponse = nextValidationInstance.response;
            this.response.valid = !this.response.valid ? this.response.valid : nextValidationResponse.valid;
            this.response.messages = this.response.messages.concat(nextValidationResponse.messages);
        } else if (property._type === 'ElementDefinition') {
            const typeDefinition = this.parser.parsedStructureDefinitions[property._type];
            const nextValidationInstance = new Validator(this.parser, this.options, obj.id || Validator.getTreeDisplay(tree, this.isXml), this.isXml);

            nextValidationInstance.validateProperties(obj, typeDefinition._properties, tree);

            const nextValidationResponse = nextValidationInstance.response;
            this.response.valid = !this.response.valid ? this.response.valid : nextValidationResponse.valid;
            this.response.messages = this.response.messages.concat(nextValidationResponse.messages);
        } else if (Constants.DataTypes.indexOf(property._type) >= 0) {
            const typeDefinition = this.parser.parsedStructureDefinitions[property._type];
            const nextValidationInstance = new Validator(this.parser, this.options, this.resourceId, this.isXml);

            nextValidationInstance.validateProperties(obj, typeDefinition._properties, tree);

            const nextValidationResponse = nextValidationInstance.response;
            this.response.valid = !this.response.valid ? this.response.valid : nextValidationResponse.valid;
            this.response.messages = this.response.messages.concat(nextValidationResponse.messages);
        } else if (property._type !== 'xhtml' && property._type !== 'BackboneElement' && propertyTypeStructure && propertyTypeStructure._properties) {
            this.validateProperties(obj, propertyTypeStructure._properties, tree);
        } else if (property._properties) {
            this.validateProperties(obj, property._properties, tree);
        }
    }

    public validateProperties(obj, properties, tree) {
        for (let i = 0; i < properties.length; i++) {
            const property = properties[i];
            const foundProperty = obj.hasOwnProperty(property._name);
            const propertyValue = obj[property._name];
            const treeDisplay = Validator.getTreeDisplay(tree.concat([property._name]));

            if (propertyValue && this.options.onBeforeValidateProperty) {
                const eventMessages = this.options.onBeforeValidateProperty(property, treeDisplay, propertyValue);
                if (eventMessages) {
                    this.response.messages = this.response.messages.concat(eventMessages);
                }
            }

            // Look for missing properties
            if (property._required && !foundProperty) {
                let satisfied = false;

                if (property._choice) {
                    satisfied = _.filter(properties, (nextProperty) => {
                        return nextProperty._choice === property._choice && !!obj[nextProperty._name];
                    }).length > 0;
                }

                if (!satisfied) {
                    this.addError(Validator.getTreeDisplay(tree, this.isXml, property._choice ? property._choice : property._name), 'Missing property');
                }
            }

            // Only continue validating if we have a value for the property
            if (foundProperty) {
                // If this is an array/multiple, loop through each item in the array and validate it, instead of the array as a whole
                if (property._multiple) {
                    if (propertyValue instanceof Array) {
                        if (property._required && propertyValue.length === 0) {
                            this.addError(treeDisplay, 'A ' + property._name + ' entry is required');
                        }

                        for (let x = 0; x < propertyValue.length; x++) {
                            const foundPropertyElement = propertyValue[x];
                            let treeItem = property._name;

                            if (this.isXml) {
                                treeItem += '[' + (x + 1) + ']';
                            } else {
                                treeItem += '[' + x + ']';
                            }

                            this.validateNext(foundPropertyElement, property, tree.concat([treeItem]));
                        }
                    } else {
                        this.addError(treeDisplay, 'Property is not an array');
                    }
                } else {
                    this.validateNext(propertyValue, property, tree.concat([property._name]));
                }
            }
        }

        const objKeys = Object.keys(obj);
        for (let i = 0; i < objKeys.length; i++) {
            const objKey = objKeys[i];

            if (objKey === 'resourceType') {
                continue;
            }

            const foundProperty = _.find(properties, function(property) {
                return property._name === objKey;
            });

            if (!foundProperty) {
                if (this.options.errorOnUnexpected) {
                    this.addError(Validator.getTreeDisplay(tree, this.isXml, objKey), 'Unexpected property');
                } else {
                    this.addWarn(Validator.getTreeDisplay(tree, this.isXml, objKey), 'Unexpected property');
                }
            }
        }
    }
}