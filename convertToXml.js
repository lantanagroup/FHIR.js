"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const convert = require("xml-js");
const _ = require("underscore");
const parseConformance_1 = require("./parseConformance");
const xmlHelper_1 = require("./xmlHelper");
class ConvertToXml {
    constructor(parser) {
        this.attributeProperties = {
            'Extension': 'url'
        };
        this.parser = parser || new parseConformance_1.ParseConformance(true);
    }
    convert(obj) {
        if (obj.hasOwnProperty('resourceType')) {
            const xmlObj = this.resourceToXML(obj);
            return convert.js2xml(xmlObj);
        }
    }
    resourceToXML(obj, xmlObj) {
        const resourceElement = {
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
        _.each(this.parser.parsedStructureDefinitions[obj.resourceType]._properties, (property) => {
            this.propertyToXML(resourceElement, this.parser.parsedStructureDefinitions[obj.resourceType], obj, property._name);
        });
        return xmlObj;
    }
    propertyToXML(parentXmlObj, parentType, obj, propertyName, parentPropertyType) {
        const isAttribute = (propertyName === 'id' && !!parentPropertyType) || this.attributeProperties[parentPropertyType] === propertyName;
        if (!obj || obj[propertyName] === undefined || obj[propertyName] === null || propertyName.startsWith('_'))
            return;
        const propertyType = _.find(parentType._properties, (property) => property._name == propertyName);
        function xmlEscapeString(value) {
            return value
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\r/g, '&#xD;')
                .replace(/\n/g, '&#xA;');
        }
        const pushProperty = (value, extra) => {
            if (value === undefined || value === null)
                return;
            const nextXmlObj = {
                type: 'element',
                name: propertyName,
                elements: [],
                attributes: {}
            };
            if (extra) {
                if (extra.id) {
                    nextXmlObj.attributes.id = extra.id;
                }
                if (extra.extension) {
                    const extensionStructure = this.parser.parsedStructureDefinitions['Extension'];
                    this.propertyToXML(nextXmlObj, extensionStructure, extra, 'extension');
                }
            }
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
                    const actual = !value || !(typeof value === 'string') ? value : xmlEscapeString(value);
                    nextXmlObj.attributes.value = actual;
                    break;
                case 'xhtml':
                    if (propertyName === 'div') {
                        let divXmlObj;
                        try {
                            divXmlObj = convert.xml2js(value);
                            divXmlObj = xmlHelper_1.XmlHelper.escapeInvalidCharacters(divXmlObj);
                        }
                        catch (ex) {
                            throw new Error('The embedded xhtml is not properly formatted/escaped: ' + ex.message);
                        }
                        if (divXmlObj.elements.length === 1 && divXmlObj.elements[0].name === 'div') {
                            divXmlObj.elements[0].attributes = divXmlObj.elements[0].attributes || {};
                            divXmlObj.elements[0].attributes.xmlns = 'http://www.w3.org/1999/xhtml';
                            nextXmlObj.elements = divXmlObj.elements[0].elements;
                            nextXmlObj.attributes = divXmlObj.elements[0].attributes;
                        }
                    }
                    break;
                case 'Resource':
                    const resourceXmlObj = this.resourceToXML(value).elements[0];
                    delete resourceXmlObj.attributes.xmlns;
                    nextXmlObj.elements.push(resourceXmlObj);
                    break;
                case 'Element':
                case 'BackboneElement':
                    for (let x in propertyType._properties) {
                        const nextProperty = propertyType._properties[x];
                        this.propertyToXML(nextXmlObj, propertyType, value, nextProperty._name, propertyType._type);
                    }
                    break;
                default:
                    let nextType = this.parser.parsedStructureDefinitions[propertyType._type];
                    if (propertyType._type.startsWith('#')) {
                        const typeSplit = propertyType._type.substring(1).split('.');
                        for (let i = 0; i < typeSplit.length; i++) {
                            if (i == 0) {
                                nextType = this.parser.parsedStructureDefinitions[typeSplit[i]];
                            }
                            else {
                                nextType = _.find(nextType._properties, (nextTypeProperty) => {
                                    return nextTypeProperty._name === typeSplit[i];
                                });
                            }
                            if (!nextType) {
                                break;
                            }
                        }
                    }
                    if (!nextType) {
                        console.log('Could not find type ' + propertyType._type);
                    }
                    else {
                        _.each(nextType._properties, (nextProperty) => {
                            this.propertyToXML(nextXmlObj, nextType, value, nextProperty._name, propertyType._type);
                        });
                    }
            }
            if (isAttribute && nextXmlObj.attributes && nextXmlObj.attributes.hasOwnProperty('value')) {
                if (!parentXmlObj.attributes) {
                    parentXmlObj.attributes = {};
                }
                parentXmlObj.attributes[nextXmlObj.name] = nextXmlObj.attributes['value'];
            }
            else {
                parentXmlObj.elements.push(nextXmlObj);
            }
        };
        if (obj[propertyName] && propertyType._multiple) {
            for (let i = 0; i < obj[propertyName].length; i++) {
                const extra = obj['_' + propertyName] && obj['_' + propertyName] instanceof Array ? obj['_' + propertyName][i] : undefined;
                pushProperty(obj[propertyName][i], extra);
            }
        }
        else {
            pushProperty(obj[propertyName], obj['_' + propertyName]);
        }
    }
}
exports.ConvertToXml = ConvertToXml;
//# sourceMappingURL=convertToXml.js.map