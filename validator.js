"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = exports.Severities = void 0;
const convertToJs_1 = require("./convertToJs");
const constants_1 = require("./constants");
var Severities;
(function (Severities) {
    Severities["Fatal"] = "fatal";
    Severities["Error"] = "error";
    Severities["Warning"] = "warning";
    Severities["Information"] = "info";
})(Severities = exports.Severities || (exports.Severities = {}));
class Validator {
    constructor(parser, options, resourceId, isXml, obj) {
        this.isXml = false;
        this.response = {
            valid: true,
            messages: []
        };
        this.parser = parser;
        this.options = options || {};
        this.resourceId = resourceId;
        this.isXml = isXml;
        this.obj = obj;
    }
    validate(input) {
        if (typeof (input) === 'string' && input.indexOf('{') === 0) {
            this.obj = JSON.parse(input);
        }
        else if (typeof (input) === 'string') {
            this.obj = new convertToJs_1.ConvertToJs().convert(input);
            this.isXml = true;
        }
        else {
            this.obj = input;
        }
        const typeDefinition = this.parser.parsedStructureDefinitions[this.obj.resourceType];
        this.resourceId = this.obj.id || '#initial';
        if (this.options && this.options.onBeforeValidateResource) {
            const eventMessages = this.options.onBeforeValidateResource(this.obj);
            if (eventMessages) {
                this.response.messages = this.response.messages.concat(eventMessages);
            }
        }
        if (!this.obj || !typeDefinition) {
            this.addFatal('', 'Resource does not have resourceType property, or value is not a valid resource type.');
        }
        else {
            this.validateProperties(this.obj, typeDefinition._properties, [this.obj.resourceType]);
        }
        return this.response;
    }
    static getTreeDisplay(tree, isXml, leaf) {
        let display = '';
        for (let i = 0; i < tree.length; i++) {
            if (display) {
                if (isXml) {
                    display += '/';
                }
                else {
                    display += '.';
                }
            }
            display += tree[i];
        }
        if (leaf) {
            if (display) {
                if (isXml) {
                    display += '/';
                }
                else {
                    display += '.';
                }
            }
            display += leaf;
        }
        return display;
    }
    checkCode(treeDisplay, parsedValueSet, valueSetUrl, code, system) {
        if (this.options && this.options.beforeCheckCode && this.options.beforeCheckCode(valueSetUrl, code, system)) {
            return true;
        }
        if (!parsedValueSet) {
            this.addInfo(treeDisplay, 'Value set "' + valueSetUrl + '" could not be found.');
            return null;
        }
        if (system) {
            const foundSystem = parsedValueSet.systems.find(nextSystem => {
                return nextSystem.uri === system;
            });
            if (foundSystem) {
                const foundCode = foundSystem.codes.find(nextCode => nextCode.code === code);
                return !!foundCode;
            }
            else {
                return false;
            }
        }
        else {
            let valid = false;
            parsedValueSet.systems.forEach(function (nextSystem) {
                const foundCode = nextSystem.codes.find(nextCode => nextCode.code === code);
                if (foundCode) {
                    valid = true;
                }
            });
            return valid;
        }
    }
    addError(location, message) {
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
    }
    ;
    addFatal(location, message) {
        this.response.valid = false;
        this.response.messages.push({
            location: location,
            resourceId: this.resourceId,
            severity: Severities.Fatal,
            message: message
        });
    }
    ;
    addWarn(location, message) {
        this.response.messages.push({
            location: location,
            resourceId: this.resourceId,
            severity: Severities.Warning,
            message: message
        });
    }
    ;
    addInfo(location, message) {
        this.response.messages.push({
            location: location,
            resourceId: this.resourceId,
            severity: Severities.Information,
            message: message
        });
    }
    ;
    validateNext(obj, property, tree) {
        const treeDisplay = Validator.getTreeDisplay(tree, this.isXml);
        const propertyTypeStructure = this.parser.parsedStructureDefinitions[property._type];
        if (property._valueSet && !this.options.skipCodeValidation) {
            let valueSetUrl = property._valueSet;
            if (valueSetUrl && valueSetUrl.indexOf('|') > 0) {
                valueSetUrl = valueSetUrl.substring(0, valueSetUrl.indexOf('|'));
            }
            const foundValueSet = this.parser.parsedValueSets[valueSetUrl];
            if (property._type === 'CodeableConcept') {
                let found = false;
                (obj.coding || []).forEach(coding => {
                    if (this.checkCode(treeDisplay, foundValueSet, valueSetUrl, coding.code, coding.system)) {
                        found = true;
                    }
                    else {
                        const msg = 'Code "' + coding.code + '" ' + (coding.system ? '(' + coding.system + ')' : '') + ' not found in value set';
                        if (property._valueSetStrength === 'required') {
                            this.addError(treeDisplay, msg);
                        }
                        else {
                            this.addWarn(treeDisplay, msg);
                        }
                    }
                });
                if (!found) {
                }
            }
            else if (property._type === 'Coding') {
                if (this.checkCode(treeDisplay, foundValueSet, valueSetUrl, obj.code, obj.system) === false) {
                    const msg = 'Code "' + obj.code + '" ' + (obj.system ? '(' + obj.system + ')' : '') + ' not found in value set';
                    if (property._valueSetStrength === 'required') {
                        this.addError(treeDisplay, msg);
                    }
                    else {
                        this.addWarn(treeDisplay, msg);
                    }
                }
            }
            else if (property._type === 'code') {
                if (this.checkCode(treeDisplay, foundValueSet, valueSetUrl, obj) === false) {
                    if (property._valueSetStrength === 'required') {
                        this.addError(treeDisplay, 'Code "' + obj + '" not found in value set');
                    }
                    else {
                        this.addWarn(treeDisplay, 'Code "' + obj + '" not found in value set');
                    }
                }
            }
        }
        if (constants_1.Constants.PrimitiveTypes.indexOf(property._type) >= 0) {
            if (property._type === 'boolean' && obj.toString().toLowerCase() !== 'true' && obj.toString().toLowerCase() !== 'false') {
                this.addError(treeDisplay, 'Invalid format for boolean value "' + obj.toString() + '"');
            }
            else if (constants_1.Constants.PrimitiveNumberTypes.indexOf(property._type) >= 0) {
                if (typeof (obj) === 'string') {
                    if (property._type === 'integer' && !constants_1.Constants.PrimitiveIntegerRegex.test(obj)) {
                        this.addError(treeDisplay, 'Invalid integer format for value "' + obj + '"');
                    }
                    else if (property._type === 'decimal' && !constants_1.Constants.PrimitiveDecimalRegex.test(obj)) {
                        this.addError(treeDisplay, 'Invalid decimal format for value "' + obj + '"');
                    }
                    else if (property._type === 'unsignedInt' && !constants_1.Constants.PrimitiveUnsignedIntRegex.test(obj)) {
                        this.addError(treeDisplay, 'Invalid unsigned integer format for value "' + obj + '"');
                    }
                    else if (property._type === 'positiveInt' && !constants_1.Constants.PrimitivePositiveIntRegex.test(obj)) {
                        this.addError(treeDisplay, 'Invalid positive integer format for value "' + obj + '"');
                    }
                }
            }
            else if (property._type === 'date' && !constants_1.Constants.PrimitiveDateRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid date format for value "' + obj + '"');
            }
            else if (property._type === 'dateTime' && !constants_1.Constants.PrimitiveDateTimeRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid dateTime format for value "' + obj + '"');
            }
            else if (property._type === 'time' && !constants_1.Constants.PrimitiveTimeRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid time format for value "' + obj + '"');
            }
            else if (property._type === 'code' && !constants_1.Constants.PrimitiveCodeRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid code format for value "' + obj + '"');
            }
            else if (property._type === 'oid' && !constants_1.Constants.PrimitiveOidRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid oid format for value "' + obj + '"');
            }
            else if (property._type === 'id' && !constants_1.Constants.PrimitiveIdRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid id format for value "' + obj + '"');
            }
        }
        else if (property._type === 'Resource') {
            const typeDefinition = this.parser.parsedStructureDefinitions[obj.resourceType];
            const nextValidationInstance = new Validator(this.parser, this.options, obj.id || Validator.getTreeDisplay(tree, this.isXml), this.isXml, obj);
            if (this.options && this.options.onBeforeValidateResource) {
                const eventMessages = this.options.onBeforeValidateResource(obj);
                if (eventMessages) {
                    this.response.messages = this.response.messages.concat(eventMessages);
                }
            }
            if (!obj.resourceType || !typeDefinition) {
                nextValidationInstance.addFatal('', 'Resource does not have resourceType property, or value is not a valid resource type.');
            }
            else {
                nextValidationInstance.validateProperties(obj, typeDefinition._properties, [obj.resourceType]);
            }
            const nextValidationResponse = nextValidationInstance.response;
            this.response.valid = !this.response.valid ? this.response.valid : nextValidationResponse.valid;
            this.response.messages = this.response.messages.concat(nextValidationResponse.messages);
        }
        else if (property._type === 'ElementDefinition') {
            const typeDefinition = this.parser.parsedStructureDefinitions[property._type];
            const nextValidationInstance = new Validator(this.parser, this.options, obj.id || Validator.getTreeDisplay(tree, this.isXml), this.isXml, obj);
            nextValidationInstance.validateProperties(obj, typeDefinition._properties, tree);
            const nextValidationResponse = nextValidationInstance.response;
            this.response.valid = !this.response.valid ? this.response.valid : nextValidationResponse.valid;
            this.response.messages = this.response.messages.concat(nextValidationResponse.messages);
        }
        else if (constants_1.Constants.DataTypes.indexOf(property._type) >= 0) {
            const typeDefinition = this.parser.parsedStructureDefinitions[property._type];
            const nextValidationInstance = new Validator(this.parser, this.options, this.resourceId, this.isXml, obj);
            nextValidationInstance.validateProperties(obj, typeDefinition._properties, tree);
            const nextValidationResponse = nextValidationInstance.response;
            this.response.valid = !this.response.valid ? this.response.valid : nextValidationResponse.valid;
            this.response.messages = this.response.messages.concat(nextValidationResponse.messages);
            const targetProfiles = (property
                ._targetProfiles || [])
                .map((p) => {
                const split = p.split('/');
                return split[split.length - 1];
            });
            if (property._type === 'Reference' && targetProfiles.length != 0 && targetProfiles.indexOf('Resource') < 0) {
                const targetProfiles = property
                    ._targetProfiles
                    .map((p) => {
                    const split = p.split('/');
                    return split[split.length - 1];
                });
                const referenceSplit = obj.reference.split('|')[0].split('/');
                if (obj.type != null) {
                    if (targetProfiles.indexOf(obj.type) < 0) {
                        this.addError(treeDisplay, 'Invalid type for reference ' + JSON.stringify(obj));
                    }
                }
                else if (referenceSplit.length >= 2) {
                    const type = referenceSplit[referenceSplit.length - 2];
                    if (targetProfiles.indexOf(type) < 0) {
                        this.addError(treeDisplay, 'Invalid type for reference ' + JSON.stringify(obj));
                    }
                }
            }
        }
        else if (property._type !== 'xhtml' && property._type !== 'BackboneElement' && propertyTypeStructure && propertyTypeStructure._properties) {
            this.validateProperties(obj, propertyTypeStructure._properties, tree);
        }
        else if (property._properties) {
            this.validateProperties(obj, property._properties, tree);
        }
    }
    validateProperties(obj, properties, tree) {
        if (!obj) {
            return;
        }
        for (let i = 0; i < properties.length; i++) {
            const property = properties[i];
            const foundProperty = obj.hasOwnProperty(property._name);
            const propertyValue = obj[property._name];
            const treeDisplay = Validator.getTreeDisplay(tree.concat([property._name]));
            if (propertyValue && this.options.onBeforeValidateProperty) {
                const eventMessages = this.options.onBeforeValidateProperty(this.obj, property, treeDisplay, propertyValue);
                if (eventMessages) {
                    this.response.messages = this.response.messages.concat(eventMessages);
                }
            }
            if (property._required && !foundProperty) {
                let satisfied = false;
                if (property._choice) {
                    satisfied = properties.filter(nextProperty => {
                        return nextProperty._choice === property._choice && !!obj[nextProperty._name];
                    }).length > 0;
                }
                if (!satisfied) {
                    this.addError(Validator.getTreeDisplay(tree, this.isXml, property._choice ? property._choice : property._name), 'Missing property');
                }
            }
            if (foundProperty) {
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
                            }
                            else {
                                treeItem += '[' + x + ']';
                            }
                            this.validateNext(foundPropertyElement, property, tree.concat([treeItem]));
                        }
                    }
                    else {
                        this.addError(treeDisplay, 'Property is not an array');
                    }
                }
                else {
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
            const foundProperty = properties.find((property) => property._name === objKey);
            if (!foundProperty) {
                if (this.options.errorOnUnexpected) {
                    this.addError(Validator.getTreeDisplay(tree, this.isXml, objKey), 'Unexpected property');
                }
                else {
                    this.addWarn(Validator.getTreeDisplay(tree, this.isXml, objKey), 'Unexpected property');
                }
            }
        }
    }
}
exports.Validator = Validator;
//# sourceMappingURL=validator.js.map