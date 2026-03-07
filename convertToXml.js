"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertToXml = void 0;
const convert = require("xml-js");
const parseConformance_1 = require("./parseConformance");
const xmlHelper_1 = require("./xmlHelper");
const constants_1 = require("./constants");
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
        const properties = this.parser.parsedStructureDefinitions[obj.resourceType]._properties || [];
        for (const property of properties) {
            this.propertyToXML(resourceElement, this.parser.parsedStructureDefinitions[obj.resourceType], obj, property._name);
        }
        return xmlObj;
    }
    propertyToXML(parentXmlObj, parentType, obj, propertyName, parentPropertyType) {
        const isAttribute = (propertyName === 'id' && !!parentPropertyType) || this.attributeProperties[parentPropertyType] === propertyName;
        if (propertyName.startsWith('_'))
            return;
        const propertyType = parentType._properties.find(property => property._name == propertyName);
        function xmlEscapeString(value) {
            return value
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\r/g, '&#xD;')
                .replace(/\n/g, '&#xA;');
        }
        const pushProperty = (value, extra) => {
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
                if (extra.fhir_comments) {
                    for (const fhirComment of extra.fhir_comments) {
                        parentXmlObj.elements.push({ type: 'comment', comment: fhirComment });
                    }
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
                    if (propertyName === 'div' && value) {
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
                    if (value) {
                        const elements = this.resourceToXML(value).elements;
                        for (const e in elements) {
                            if (elements[e].attributes) {
                                delete elements[e].attributes.xmlns;
                            }
                        }
                        nextXmlObj.elements.push(...elements);
                    }
                    break;
                case 'Element':
                case 'BackboneElement':
                    for (const x in propertyType._properties) {
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
                                nextType = nextType._properties.find(nextTypeProperty => nextTypeProperty._name === typeSplit[i]);
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
                        for (const nextProperty of nextType._properties) {
                            this.propertyToXML(nextXmlObj, nextType, value, nextProperty._name, propertyType._type);
                        }
                    }
            }
            let hasAttributes = false;
            const hasElements = nextXmlObj.elements && nextXmlObj.elements.length > 0;
            if (nextXmlObj.attributes) {
                for (const attrKey in nextXmlObj.attributes) {
                    if (nextXmlObj.attributes[attrKey] || nextXmlObj.attributes[attrKey] === false || nextXmlObj.attributes[attrKey] === 0) {
                        hasAttributes = true;
                    }
                }
            }
            if (isAttribute && nextXmlObj.attributes && nextXmlObj.attributes.hasOwnProperty('value')) {
                if (!parentXmlObj.attributes) {
                    parentXmlObj.attributes = {};
                }
                parentXmlObj.attributes[nextXmlObj.name] = nextXmlObj.attributes['value'];
            }
            else if (hasAttributes || hasElements) {
                parentXmlObj.elements.push(nextXmlObj);
            }
        };
        if (obj) {
            let extra;
            if (propertyType._multiple && obj[propertyName]) {
                for (let i = 0; i < obj[propertyName].length; i++) {
                    if (constants_1.Constants.PrimitiveTypes.indexOf(propertyType._type) >= 0) {
                        if (obj['_' + propertyName]) {
                            extra = obj['_' + propertyName][i];
                        }
                    }
                    else {
                        extra = {
                            fhir_comments: obj[propertyName][i].fhir_comments
                        };
                    }
                    pushProperty(obj[propertyName][i], extra);
                }
            }
            else {
                if (constants_1.Constants.PrimitiveTypes.indexOf(propertyType._type) >= 0) {
                    extra = obj['_' + propertyName];
                }
                else if (obj[propertyName]) {
                    extra = {
                        fhir_comments: obj[propertyName].fhir_comments
                    };
                }
                pushProperty(obj[propertyName], extra);
            }
        }
    }
}
exports.ConvertToXml = ConvertToXml;
//# sourceMappingURL=convertToXml.js.map