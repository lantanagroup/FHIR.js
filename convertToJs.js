"use strict";
exports.__esModule = true;
var convert = require("xml-js");
var _ = require("underscore");
var parseConformance_1 = require("./parseConformance");
var xmlHelper_1 = require("./xmlHelper");
var ConvertToJs = (function () {
    function ConvertToJs(parser) {
        this.parser = parser || new parseConformance_1.ParseConformance(true);
    }
    ConvertToJs.prototype.convert = function (xml) {
        var xmlObj = convert.xml2js(xml);
        var firstElement = _.find(xmlObj.elements, function (element) { return element.type === 'element'; });
        if (firstElement) {
            return this.resourceToJS(firstElement, null);
        }
    };
    ConvertToJs.prototype.convertToJSON = function (xml) {
        var xmlObj = convert.xml2js(xml);
        if (xmlObj.elements.length !== 1) {
            return;
        }
        var surroundDecimalsWith = {};
        var jsObj = this.resourceToJS(xmlObj.elements[0], surroundDecimalsWith);
        var maxDLength = this.maxLengthOfDs(jsObj);
        var rpt = '';
        for (var i = 0; i < maxDLength + 5; i++) {
            rpt += 'D';
        }
        surroundDecimalsWith['str'] = rpt;
        var json = JSON.stringify(jsObj, null, '\t');
        var replaceRegex = new RegExp('"?' + surroundDecimalsWith['str'] + '"?', 'g');
        var json2 = json.replace(replaceRegex, '');
        return json2;
    };
    ConvertToJs.prototype.maxLengthOfDs = function (obj) {
        function maxSubstringLengthStr(str) {
            var matches = str.match(/DDDD+/g);
            if (!matches) {
                return 0;
            }
            var ret = matches
                .map(function (substr) { return substr.length; })
                .reduce(function (p, c) { return Math.max(p, c); }, 0);
            return ret;
        }
        function maxSubstringLength(currentMax, obj) {
            var ret;
            if (typeof (obj) === 'string') {
                ret = Math.max(currentMax, maxSubstringLengthStr(obj));
            }
            else if (typeof (obj) === 'object') {
                ret = Object.keys(obj)
                    .map(function (k) {
                    return Math.max(maxSubstringLengthStr(k), maxSubstringLength(currentMax, obj[k]));
                })
                    .reduce(function (p, c) { return Math.max(p, c); }, currentMax);
            }
            else {
                ret = currentMax;
            }
            return ret;
        }
        return maxSubstringLength(0, obj);
    };
    ConvertToJs.prototype.resourceToJS = function (xmlObj, surroundDecimalsWith) {
        var _this = this;
        var typeDefinition = this.parser.parsedStructureDefinitions[xmlObj.name];
        var resource = {
            resourceType: xmlObj.name
        };
        if (!typeDefinition) {
            throw new Error('Unknown resource type: ' + xmlObj.name);
        }
        _.each(typeDefinition._properties, function (property) {
            _this.propertyToJS(xmlObj, resource, property, surroundDecimalsWith);
        });
        return resource;
    };
    ConvertToJs.prototype.findReferenceType = function (relativeType) {
        if (!relativeType || !relativeType.startsWith('#')) {
            return;
        }
        var resourceType = relativeType.substring(1, relativeType.indexOf('.'));
        var path = relativeType.substring(resourceType.length + 2);
        var resourceDefinition = this.parser.parsedStructureDefinitions[resourceType];
        var pathSplit = path.split('.');
        if (!resourceDefinition) {
            throw new Error('Could not find resource definition for ' + resourceType);
        }
        var current = resourceDefinition;
        var _loop_1 = function (i) {
            var nextPath = pathSplit[i];
            current = _.find(current._properties, function (property) {
                return property._name === nextPath;
            });
            if (!current) {
                return { value: void 0 };
            }
        };
        for (var i = 0; i < pathSplit.length; i++) {
            var state_1 = _loop_1(i);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return JSON.parse(JSON.stringify(current));
    };
    ConvertToJs.prototype.propertyToJS = function (xmlObj, obj, property, surroundDecimalsWith) {
        var _this = this;
        var xmlElements = _.filter(xmlObj.elements, function (element) {
            return element.name === property._name;
        });
        var xmlAttributes = xmlObj.attributes ? _.chain(Object.keys(xmlObj.attributes))
            .filter(function (key) {
            return key === property._name;
        })
            .map(function (key) {
            return {
                name: key,
                type: 'attribute',
                attributes: { value: xmlObj.attributes[key] }
            };
        })
            .value() : [];
        var xmlProperty = xmlElements.concat(xmlAttributes);
        if (!xmlProperty || xmlProperty.length === 0) {
            return;
        }
        if (property._type && property._type.indexOf('#') === 0) {
            var relativeType = this.findReferenceType(property._type);
            if (!relativeType) {
                throw new Error('Could not find reference to element definition ' + relativeType);
            }
            relativeType._multiple = property._multiple;
            relativeType._required = property._required;
            property = relativeType;
        }
        var pushValue = function (value) {
            if (!value)
                return;
            switch (property._type) {
                case 'string':
                case 'base64Binary':
                case 'code':
                case 'id':
                case 'markdown':
                case 'uri':
                case 'url':
                case 'canonical':
                case 'oid':
                case 'date':
                case 'dateTime':
                case 'time':
                case 'instant':
                    if (value.attributes && value.attributes['value']) {
                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(value.attributes['value']);
                        }
                        else {
                            obj[property._name] = value.attributes['value'];
                        }
                    }
                    break;
                case 'decimal':
                    if (value.attributes['value']) {
                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(convertDecimal(value.attributes['value'], surroundDecimalsWith));
                        }
                        else {
                            obj[property._name] = convertDecimal(value.attributes['value'], surroundDecimalsWith);
                        }
                    }
                    break;
                case 'boolean':
                    if (value.attributes['value']) {
                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(toBoolean(value.attributes['value']));
                        }
                        else {
                            obj[property._name] = toBoolean(value.attributes['value']);
                        }
                    }
                    break;
                case 'integer':
                case 'unsignedInt':
                case 'positiveInt':
                    if (value.attributes['value']) {
                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(toNumber(value.attributes['value']));
                        }
                        else {
                            obj[property._name] = toNumber(value.attributes['value']);
                        }
                    }
                    break;
                case 'xhtml':
                    if (value.elements && value.elements.length > 0) {
                        var div = convert.js2xml({ elements: [xmlHelper_1.XmlHelper.escapeInvalidCharacters(value)] });
                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(div);
                        }
                        else {
                            obj[property._name] = div;
                        }
                    }
                    break;
                case 'Element':
                case 'BackboneElement':
                    var newValue = {};
                    for (var x in property._properties) {
                        var nextProperty = property._properties[x];
                        _this.propertyToJS(value, newValue, nextProperty, surroundDecimalsWith);
                    }
                    if (obj[property._name] instanceof Array) {
                        obj[property._name].push(newValue);
                    }
                    else {
                        obj[property._name] = newValue;
                    }
                    break;
                case 'Resource':
                    if (value.elements.length === 1) {
                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(_this.resourceToJS(value.elements[0], surroundDecimalsWith));
                        }
                        else {
                            obj[property._name] = _this.resourceToJS(value.elements[0], surroundDecimalsWith);
                        }
                    }
                    break;
                default:
                    var nextType = _this.parser.parsedStructureDefinitions[property._type];
                    if (!nextType) {
                        console.log('do something');
                    }
                    else {
                        var newValue_1 = {};
                        _.each(nextType._properties, function (nextProperty) {
                            _this.propertyToJS(value, newValue_1, nextProperty, surroundDecimalsWith);
                        });
                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(newValue_1);
                        }
                        else {
                            obj[property._name] = newValue_1;
                        }
                    }
                    break;
            }
        };
        function toBoolean(value) {
            if (value === "true") {
                return true;
            }
            else if (value === "false") {
                return false;
            }
            else {
                throw new Error("value supposed to be a boolean but got: " + value);
            }
        }
        function toNumber(value) {
            if (/^-?\d+$/.test(value) == false) {
                throw new Error("value supposed to be a number but got: " + value);
            }
            return parseInt(value, 10);
        }
        function convertDecimal(value, surroundDecimalsWith) {
            if (/^-?([0]|([1-9][0-9]*))(\.[0-9]+)?$/.test(value) == false) {
                throw new Error("value supposed to be a decimal number but got: " + value);
            }
            if (surroundDecimalsWith) {
                return {
                    value: value,
                    toJSON: function () {
                        return surroundDecimalsWith.str + value + surroundDecimalsWith.str;
                    }
                };
            }
            else {
                return value;
            }
        }
        if (property._multiple) {
            obj[property._name] = [];
        }
        for (var i in xmlProperty) {
            pushValue(xmlProperty[i]);
        }
    };
    return ConvertToJs;
}());
exports.ConvertToJs = ConvertToJs;
//# sourceMappingURL=convertToJs.js.map