"use strict";
exports.__esModule = true;
var convert = require("xml-js");
var _ = require("underscore");
var parseConformance_1 = require("./parseConformance");
var xmlHelper_1 = require("./xmlHelper");
var ConvertToXml = (function () {
    function ConvertToXml(parser) {
        this.attributeProperties = {
            'Extension': 'url'
        };
        this.parser = parser || new parseConformance_1.ParseConformance(true);
    }
    ConvertToXml.prototype.convert = function (obj) {
        if (obj.hasOwnProperty('resourceType')) {
            var xmlObj = this.resourceToXML(obj);
            return convert.js2xml(xmlObj);
        }
    };
    ConvertToXml.prototype.resourceToXML = function (obj, xmlObj) {
        var _this = this;
        var resourceElement = {
            type: 'element',
            name: obj.resourceType,
            attributes: {
                xmlns: 'http://hl7.org/fhir'
            },
            elements: []
        };
        if (!xmlObj) {
            xmlObj = {
                declaration: {
                    attributes: {
                        version: '1.0',
                        encoding: 'UTF-8'
                    }
                },
                elements: [resourceElement]
            };
        }
        if (!this.parser.parsedStructureDefinitions[obj.resourceType]) {
            throw new Error('Unknown resource type: ' + obj.resourceType);
        }
        _.each(this.parser.parsedStructureDefinitions[obj.resourceType]._properties, function (property) {
            _this.propertyToXML(resourceElement, _this.parser.parsedStructureDefinitions[obj.resourceType], obj, property._name);
        });
        return xmlObj;
    };
    ConvertToXml.prototype.propertyToXML = function (parentXmlObj, parentType, obj, propertyName, parentPropertyType) {
        var _this = this;
        var isAttribute = (propertyName === 'id' && !!parentPropertyType) || this.attributeProperties[parentPropertyType] === propertyName;
        if (!obj || obj[propertyName] === undefined || obj[propertyName] === null)
            return;
        var propertyType = _.find(parentType._properties, function (property) { return property._name == propertyName; });
        function xmlEscapeString(value) {
            return value
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\r/g, '&#xD;')
                .replace(/\n/g, '&#xA;');
        }
        var pushProperty = function (value) {
            if (value === undefined || value === null)
                return;
            var nextXmlObj = {
                type: 'element',
                name: propertyName,
                elements: [],
                attributes: null
            };
            switch (propertyType._type) {
                case 'string':
                case 'base64Binary':
                case 'code':
                case 'id':
                case 'markdown':
                case 'uri':
                case 'url':
                case 'canonical':
                case 'oid':
                case 'boolean':
                case 'integer':
                case 'decimal':
                case 'unsignedInt':
                case 'positiveInt':
                case 'date':
                case 'dateTime':
                case 'time':
                case 'instant':
                    var actual = !value || !(typeof value === 'string') ? value : xmlEscapeString(value);
                    nextXmlObj.attributes = {
                        value: actual
                    };
                    break;
                case 'xhtml':
                    if (propertyName === 'div') {
                        var divXmlObj = void 0;
                        try {
                            divXmlObj = convert.xml2js(value);
                            divXmlObj = xmlHelper_1.XmlHelper.escapeInvalidCharacters(divXmlObj);
                        }
                        catch (ex) {
                            throw new Error('The embedded xhtml is not properly formatted/escaped: ' + ex.message);
                        }
                        nextXmlObj.attributes = {
                            'xmlns': 'http://www.w3.org/1999/xhtml'
                        };
                        if (divXmlObj.elements.length === 1 && divXmlObj.elements[0].name === 'div') {
                            nextXmlObj.elements = divXmlObj.elements[0].elements;
                        }
                    }
                    break;
                case 'Resource':
                    var resourceXmlObj = _this.resourceToXML(value).elements[0];
                    delete resourceXmlObj.attributes.xmlns;
                    nextXmlObj.elements.push(resourceXmlObj);
                    break;
                case 'Element':
                case 'BackboneElement':
                    for (var x in propertyType._properties) {
                        var nextProperty = propertyType._properties[x];
                        _this.propertyToXML(nextXmlObj, propertyType, value, nextProperty._name, propertyType._type);
                    }
                    break;
                default:
                    var nextType_1 = _this.parser.parsedStructureDefinitions[propertyType._type];
                    if (propertyType._type.startsWith('#')) {
                        var typeSplit_1 = propertyType._type.substring(1).split('.');
                        var _loop_1 = function (i) {
                            if (i == 0) {
                                nextType_1 = _this.parser.parsedStructureDefinitions[typeSplit_1[i]];
                            }
                            else {
                                nextType_1 = _.find(nextType_1._properties, function (nextTypeProperty) {
                                    return nextTypeProperty._name === typeSplit_1[i];
                                });
                            }
                            if (!nextType_1) {
                                return "break";
                            }
                        };
                        for (var i = 0; i < typeSplit_1.length; i++) {
                            var state_1 = _loop_1(i);
                            if (state_1 === "break")
                                break;
                        }
                    }
                    if (!nextType_1) {
                        console.log('Could not find type ' + propertyType._type);
                    }
                    else {
                        _.each(nextType_1._properties, function (nextProperty) {
                            _this.propertyToXML(nextXmlObj, nextType_1, value, nextProperty._name, propertyType._type);
                        });
                    }
            }
            if (isAttribute && nextXmlObj.attributes && nextXmlObj.attributes.hasOwnProperty('value')) {
                if (!parentXmlObj.attributes) {
                    parentXmlObj.attributes = [];
                }
                parentXmlObj.attributes[nextXmlObj.name] = nextXmlObj.attributes['value'];
            }
            else {
                parentXmlObj.elements.push(nextXmlObj);
            }
        };
        if (obj[propertyName] && propertyType._multiple) {
            for (var i = 0; i < obj[propertyName].length; i++) {
                pushProperty(obj[propertyName][i]);
            }
        }
        else {
            pushProperty(obj[propertyName]);
        }
    };
    return ConvertToXml;
}());
exports.ConvertToXml = ConvertToXml;
//# sourceMappingURL=convertToXml.js.map