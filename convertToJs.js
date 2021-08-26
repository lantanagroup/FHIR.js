"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertToJs = void 0;
const convert = require("xml-js");
const parseConformance_1 = require("./parseConformance");
const xmlHelper_1 = require("./xmlHelper");
class ConvertToJs {
    constructor(parser) {
        this.parser = parser || new parseConformance_1.ParseConformance(true);
    }
    convert(xml) {
        const xmlObj = convert.xml2js(xml);
        const firstElement = xmlObj.elements.find((element) => element.type === 'element');
        if (firstElement) {
            return this.resourceToJS(firstElement, null);
        }
    }
    convertToJSON(xml) {
        const xmlObj = convert.xml2js(xml);
        if (xmlObj.elements.length !== 1) {
            return;
        }
        const surroundDecimalsWith = {};
        const jsObj = this.resourceToJS(xmlObj.elements[0], surroundDecimalsWith);
        const maxDLength = this.maxLengthOfDs(jsObj);
        let rpt = '';
        for (let i = 0; i < maxDLength + 5; i++) {
            rpt += 'D';
        }
        surroundDecimalsWith['str'] = rpt;
        const json = JSON.stringify(jsObj, null, '\t');
        const replaceRegex = new RegExp('"?' + surroundDecimalsWith['str'] + '"?', 'g');
        const json2 = json.replace(replaceRegex, '');
        return json2;
    }
    maxLengthOfDs(obj) {
        function maxSubstringLengthStr(str) {
            const matches = str.match(/DDDD+/g);
            if (!matches) {
                return 0;
            }
            const ret = matches
                .map((substr) => { return substr.length; })
                .reduce((p, c) => { return Math.max(p, c); }, 0);
            return ret;
        }
        function maxSubstringLength(currentMax, obj) {
            let ret;
            if (typeof (obj) === 'string') {
                ret = Math.max(currentMax, maxSubstringLengthStr(obj));
            }
            else if (typeof (obj) === 'object') {
                ret = Object.keys(obj)
                    .map((k) => {
                    return Math.max(maxSubstringLengthStr(k), maxSubstringLength(currentMax, obj[k]));
                })
                    .reduce((p, c) => { return Math.max(p, c); }, currentMax);
            }
            else {
                ret = currentMax;
            }
            return ret;
        }
        return maxSubstringLength(0, obj);
    }
    resourceToJS(xmlObj, surroundDecimalsWith) {
        const typeDefinition = this.parser.parsedStructureDefinitions[xmlObj.name];
        const resource = {
            resourceType: xmlObj.name
        };
        if (!typeDefinition) {
            throw new Error('Unknown resource type: ' + xmlObj.name);
        }
        typeDefinition._properties.forEach((property) => {
            this.propertyToJS(xmlObj, resource, property, surroundDecimalsWith);
        });
        return resource;
    }
    findReferenceType(relativeType) {
        if (!relativeType || !relativeType.startsWith('#')) {
            return;
        }
        const resourceType = relativeType.substring(1, relativeType.indexOf('.'));
        const path = relativeType.substring(resourceType.length + 2);
        const resourceDefinition = this.parser.parsedStructureDefinitions[resourceType];
        const pathSplit = path.split('.');
        if (!resourceDefinition) {
            throw new Error('Could not find resource definition for ' + resourceType);
        }
        let current = resourceDefinition;
        for (let i = 0; i < pathSplit.length; i++) {
            const nextPath = pathSplit[i];
            current = current._properties.find((property) => property._name === nextPath);
            if (!current) {
                return;
            }
        }
        return JSON.parse(JSON.stringify(current));
    }
    propertyToJS(xmlObj, obj, property, surroundDecimalsWith) {
        const xmlElements = (xmlObj.elements || []).filter((element) => element.name === property._name);
        const xmlAttributes = xmlObj.attributes ?
            Object.keys(xmlObj.attributes)
                .filter((key) => key === property._name)
                .map((key) => {
                return {
                    name: key,
                    type: 'attribute',
                    attributes: { value: xmlObj.attributes[key] }
                };
            }) : [];
        const xmlProperty = xmlElements.concat(xmlAttributes);
        if (!xmlProperty || xmlProperty.length === 0) {
            return;
        }
        if (property._type && property._type.indexOf('#') === 0) {
            const relativeType = this.findReferenceType(property._type);
            if (!relativeType) {
                throw new Error('Could not find reference to element definition ' + relativeType);
            }
            relativeType._multiple = property._multiple;
            relativeType._required = property._required;
            property = relativeType;
        }
        const addExtra = (element, index) => {
            const hasId = element.attributes && element.attributes.id;
            const hasExtensions = !!(element.elements || []).find((next) => next.name === 'extension');
            if (hasId || hasExtensions) {
                if (!obj['_' + property._name]) {
                    obj['_' + property._name] = obj[property._name] instanceof Array ? [] : {};
                }
            }
            const dest = obj['_' + property._name];
            if (hasId || hasExtensions) {
                if (dest instanceof Array) {
                    if (dest.length < index + 1) {
                        for (let i = 0; i < index; i++) {
                            if (!dest[i]) {
                                dest[i] = null;
                            }
                        }
                    }
                    dest[index] = {};
                }
            }
            if (hasId) {
                if (dest instanceof Array) {
                    dest[index].id = element.attributes.id;
                }
                else {
                    dest.id = element.attributes.id;
                }
            }
            if (hasExtensions) {
                const extensionProperty = {
                    _name: 'extension',
                    _type: 'Extension',
                    _multiple: true,
                    _required: false
                };
                this.propertyToJS(element, dest instanceof Array ? dest[index] : dest, extensionProperty, surroundDecimalsWith);
            }
        };
        const pushValue = (value, index) => {
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
                    addExtra(value, index);
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
                    addExtra(value, index);
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
                    addExtra(value, index);
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
                    addExtra(value, index);
                    if (value.attributes && value.attributes['value']) {
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
                        const div = convert.js2xml({ elements: [xmlHelper_1.XmlHelper.escapeInvalidCharacters(value)] });
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
                    const newValue = {};
                    for (let x in property._properties) {
                        const nextProperty = property._properties[x];
                        this.propertyToJS(value, newValue, nextProperty, surroundDecimalsWith);
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
                            obj[property._name].push(this.resourceToJS(value.elements[0], surroundDecimalsWith));
                        }
                        else {
                            obj[property._name] = this.resourceToJS(value.elements[0], surroundDecimalsWith);
                        }
                    }
                    break;
                default:
                    const nextType = this.parser.parsedStructureDefinitions[property._type];
                    if (!nextType) {
                        console.log('do something');
                    }
                    else {
                        const newValue = {};
                        nextType._properties.forEach(nextProperty => {
                            this.propertyToJS(value, newValue, nextProperty, surroundDecimalsWith);
                        });
                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(newValue);
                        }
                        else {
                            obj[property._name] = newValue;
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
                throw new Error("Value should be a boolean but got: " + value);
            }
        }
        function toNumber(value) {
            if (/^-?\d+$/.test(value) == false) {
                throw new Error("Value should be a number but got: " + value);
            }
            return parseInt(value, 10);
        }
        function convertDecimal(value, surroundDecimalsWith) {
            if (/^-?([0]|([1-9][0-9]*))(\.[0-9]+)?$/.test(value) == false) {
                throw new Error("Value should be a decimal number but got: " + value);
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
        for (let i in xmlProperty) {
            pushValue(xmlProperty[i], i);
        }
    }
}
exports.ConvertToJs = ConvertToJs;
//# sourceMappingURL=convertToJs.js.map