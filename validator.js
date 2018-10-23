"use strict";
exports.__esModule = true;
var _ = require("underscore");
var convertToJs_1 = require("./convertToJs");
var Severities;
(function (Severities) {
    Severities["Fatal"] = "fatal";
    Severities["Error"] = "error";
    Severities["Warning"] = "warning";
    Severities["Information"] = "info";
})(Severities = exports.Severities || (exports.Severities = {}));
var Constants = (function () {
    function Constants() {
    }
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
    return Constants;
}());
var Validator = (function () {
    function Validator(parser, options, resourceId, isXml, obj) {
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
    Validator.prototype.validate = function (input) {
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
        var typeDefinition = this.parser.parsedStructureDefinitions[this.obj.resourceType];
        this.resourceId = this.obj.id || '#initial';
        if (this.options && this.options.onBeforeValidateResource) {
            var eventMessages = this.options.onBeforeValidateResource(this.obj);
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
    };
    Validator.getTreeDisplay = function (tree, isXml, leaf) {
        var display = '';
        for (var i = 0; i < tree.length; i++) {
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
    };
    Validator.prototype.checkCode = function (valueSet, code, system) {
        if (system) {
            var foundSystem = _.find(valueSet.systems, function (nextSystem) {
                return nextSystem.uri === system;
            });
            if (foundSystem) {
                var foundCode = _.find(foundSystem.codes, function (nextCode) {
                    return nextCode.code === code;
                });
                return !!foundCode;
            }
            else {
                return false;
            }
        }
        else {
            var valid_1 = false;
            _.each(valueSet.systems, function (nextSystem) {
                var foundCode = _.find(nextSystem.codes, function (nextCode) {
                    return nextCode.code === code;
                });
                if (foundCode) {
                    valid_1 = true;
                }
            });
            return valid_1;
        }
    };
    Validator.prototype.addError = function (location, message) {
        var theMessage = {
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
    ;
    Validator.prototype.addFatal = function (location, message) {
        this.response.valid = false;
        this.response.messages.push({
            location: location,
            resourceId: this.resourceId,
            severity: Severities.Fatal,
            message: message
        });
    };
    ;
    Validator.prototype.addWarn = function (location, message) {
        this.response.messages.push({
            location: location,
            resourceId: this.resourceId,
            severity: Severities.Warning,
            message: message
        });
    };
    ;
    Validator.prototype.addInfo = function (location, message) {
        this.response.messages.push({
            location: location,
            resourceId: this.resourceId,
            severity: Severities.Information,
            message: message
        });
    };
    ;
    Validator.prototype.validateNext = function (obj, property, tree) {
        var _this = this;
        var treeDisplay = Validator.getTreeDisplay(tree, this.isXml);
        var propertyTypeStructure = this.parser.parsedStructureDefinitions[property._type];
        if (property._valueSet) {
            var foundValueSet_1 = _.find(this.parser.parsedValueSets, function (valueSet, valueSetKey) { return valueSetKey === property._valueSet; });
            if (!foundValueSet_1) {
                this.addInfo(treeDisplay, 'Value set "' + property._valueSet + '" could not be found.');
            }
            else {
                if (property._type === 'CodeableConcept') {
                    var found_1 = false;
                    _.each(obj.coding, function (coding) {
                        if (_this.checkCode(foundValueSet_1, coding.code, coding.system)) {
                            found_1 = true;
                        }
                        else {
                            var msg = 'Code "' + coding.code + '" ' + (coding.system ? '(' + coding.system + ')' : '') + ' not found in value set';
                            if (property._valueSetStrength === 'required') {
                                _this.addError(treeDisplay, msg);
                            }
                            else {
                                _this.addWarn(treeDisplay, msg);
                            }
                        }
                    });
                    if (!found_1) {
                    }
                }
                else if (property._type === 'Coding') {
                    if (!this.checkCode(foundValueSet_1, obj.code, obj.system)) {
                        var msg = 'Code "' + obj.code + '" ' + (obj.system ? '(' + obj.system + ')' : '') + ' not found in value set';
                        if (property._valueSetStrength === 'required') {
                            this.addError(treeDisplay, msg);
                        }
                        else {
                            this.addWarn(treeDisplay, msg);
                        }
                    }
                }
                else if (property._type === 'code') {
                    if (!this.checkCode(foundValueSet_1, obj)) {
                        if (property._valueSetStrength === 'required') {
                            this.addError(treeDisplay, 'Code "' + obj + '" not found in value set');
                        }
                        else {
                            this.addWarn(treeDisplay, 'Code "' + obj + '" not found in value set');
                        }
                    }
                }
            }
        }
        if (Constants.PrimitiveTypes.indexOf(property._type) >= 0) {
            if (property._type === 'boolean' && obj.toString().toLowerCase() !== 'true' && obj.toString().toLowerCase() !== 'false') {
                this.addError(treeDisplay, 'Invalid format for boolean value "' + obj.toString() + '"');
            }
            else if (Constants.PrimitiveNumberTypes.indexOf(property._type) >= 0) {
                if (typeof (obj) === 'string') {
                    if (property._type === 'integer' && !Constants.PrimitiveIntegerRegex.test(obj)) {
                        this.addError(treeDisplay, 'Invalid integer format for value "' + obj + '"');
                    }
                    else if (property._type === 'decimal' && !Constants.PrimitiveDecimalRegex.test(obj)) {
                        this.addError(treeDisplay, 'Invalid decimal format for value "' + obj + '"');
                    }
                    else if (property._type === 'unsignedInt' && !Constants.PrimitiveUnsignedIntRegex.test(obj)) {
                        this.addError(treeDisplay, 'Invalid unsigned integer format for value "' + obj + '"');
                    }
                    else if (property._type === 'positiveInt' && !Constants.PrimitivePositiveIntRegex.test(obj)) {
                        this.addError(treeDisplay, 'Invalid positive integer format for value "' + obj + '"');
                    }
                }
            }
            else if (property._type === 'date' && !Constants.PrimitiveDateRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid date format for value "' + obj + '"');
            }
            else if (property._type === 'dateTime' && !Constants.PrimitiveDateTimeRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid dateTime format for value "' + obj + '"');
            }
            else if (property._type === 'time' && !Constants.PrimitiveTimeRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid time format for value "' + obj + '"');
            }
            else if (property._type === 'code' && !Constants.PrimitiveCodeRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid code format for value "' + obj + '"');
            }
            else if (property._type === 'oid' && !Constants.PrimitiveOidRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid oid format for value "' + obj + '"');
            }
            else if (property._type === 'id' && !Constants.PrimitiveIdRegex.test(obj)) {
                this.addError(treeDisplay, 'Invalid id format for value "' + obj + '"');
            }
        }
        else if (property._type === 'Resource') {
            var typeDefinition = this.parser.parsedStructureDefinitions[obj.resourceType];
            var nextValidationInstance = new Validator(this.parser, this.options, obj.id || Validator.getTreeDisplay(tree, this.isXml), this.isXml, obj);
            if (this.options && this.options.onBeforeValidateResource) {
                var eventMessages = this.options.onBeforeValidateResource(obj);
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
            var nextValidationResponse = nextValidationInstance.response;
            this.response.valid = !this.response.valid ? this.response.valid : nextValidationResponse.valid;
            this.response.messages = this.response.messages.concat(nextValidationResponse.messages);
        }
        else if (property._type === 'ElementDefinition') {
            var typeDefinition = this.parser.parsedStructureDefinitions[property._type];
            var nextValidationInstance = new Validator(this.parser, this.options, obj.id || Validator.getTreeDisplay(tree, this.isXml), this.isXml, obj);
            nextValidationInstance.validateProperties(obj, typeDefinition._properties, tree);
            var nextValidationResponse = nextValidationInstance.response;
            this.response.valid = !this.response.valid ? this.response.valid : nextValidationResponse.valid;
            this.response.messages = this.response.messages.concat(nextValidationResponse.messages);
        }
        else if (Constants.DataTypes.indexOf(property._type) >= 0) {
            var typeDefinition = this.parser.parsedStructureDefinitions[property._type];
            var nextValidationInstance = new Validator(this.parser, this.options, this.resourceId, this.isXml, obj);
            nextValidationInstance.validateProperties(obj, typeDefinition._properties, tree);
            var nextValidationResponse = nextValidationInstance.response;
            this.response.valid = !this.response.valid ? this.response.valid : nextValidationResponse.valid;
            this.response.messages = this.response.messages.concat(nextValidationResponse.messages);
        }
        else if (property._type !== 'xhtml' && property._type !== 'BackboneElement' && propertyTypeStructure && propertyTypeStructure._properties) {
            this.validateProperties(obj, propertyTypeStructure._properties, tree);
        }
        else if (property._properties) {
            this.validateProperties(obj, property._properties, tree);
        }
    };
    Validator.prototype.validateProperties = function (obj, properties, tree) {
        var _loop_1 = function (i) {
            var property = properties[i];
            var foundProperty = obj.hasOwnProperty(property._name);
            var propertyValue = obj[property._name];
            var treeDisplay = Validator.getTreeDisplay(tree.concat([property._name]));
            if (propertyValue && this_1.options.onBeforeValidateProperty) {
                var eventMessages = this_1.options.onBeforeValidateProperty(this_1.obj, property, treeDisplay, propertyValue);
                if (eventMessages) {
                    this_1.response.messages = this_1.response.messages.concat(eventMessages);
                }
            }
            if (property._required && !foundProperty) {
                var satisfied = false;
                if (property._choice) {
                    satisfied = _.filter(properties, function (nextProperty) {
                        return nextProperty._choice === property._choice && !!obj[nextProperty._name];
                    }).length > 0;
                }
                if (!satisfied) {
                    this_1.addError(Validator.getTreeDisplay(tree, this_1.isXml, property._choice ? property._choice : property._name), 'Missing property');
                }
            }
            if (foundProperty) {
                if (property._multiple) {
                    if (propertyValue instanceof Array) {
                        if (property._required && propertyValue.length === 0) {
                            this_1.addError(treeDisplay, 'A ' + property._name + ' entry is required');
                        }
                        for (var x = 0; x < propertyValue.length; x++) {
                            var foundPropertyElement = propertyValue[x];
                            var treeItem = property._name;
                            if (this_1.isXml) {
                                treeItem += '[' + (x + 1) + ']';
                            }
                            else {
                                treeItem += '[' + x + ']';
                            }
                            this_1.validateNext(foundPropertyElement, property, tree.concat([treeItem]));
                        }
                    }
                    else {
                        this_1.addError(treeDisplay, 'Property is not an array');
                    }
                }
                else {
                    this_1.validateNext(propertyValue, property, tree.concat([property._name]));
                }
            }
        };
        var this_1 = this;
        for (var i = 0; i < properties.length; i++) {
            _loop_1(i);
        }
        var objKeys = Object.keys(obj);
        var _loop_2 = function (i) {
            var objKey = objKeys[i];
            if (objKey === 'resourceType') {
                return "continue";
            }
            var foundProperty = _.find(properties, function (property) {
                return property._name === objKey;
            });
            if (!foundProperty) {
                if (this_2.options.errorOnUnexpected) {
                    this_2.addError(Validator.getTreeDisplay(tree, this_2.isXml, objKey), 'Unexpected property');
                }
                else {
                    this_2.addWarn(Validator.getTreeDisplay(tree, this_2.isXml, objKey), 'Unexpected property');
                }
            }
        };
        var this_2 = this;
        for (var i = 0; i < objKeys.length; i++) {
            _loop_2(i);
        }
    };
    return Validator;
}());
exports.Validator = Validator;
//# sourceMappingURL=validator.js.map