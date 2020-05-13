import * as convert from 'xml-js';
import {ParseConformance} from './parseConformance';
import {XmlHelper} from './xmlHelper';
import {ParsedProperty} from "./model/parsed-property";

export class ConvertToJs {
    private parser: ParseConformance;
    
    constructor(parser?: ParseConformance) {
        this.parser = parser || new ParseConformance(true);
    }

    /**
     * Converts the specified XML resource to a JS object, storing arbitrary-length decimals as strings since FHIR spec requires arbitrary precision.
     * @param {string} xml Resource XML string
     * @returns {FHIR.Resource} A Resource object converted from the XML Resource. Decimals stored as strings.
     */
    public convert(xml) {
        const xmlObj = convert.xml2js(xml);
        const firstElement = xmlObj.elements.find((element) => element.type === 'element');

        if (firstElement) {
            return this.resourceToJS(firstElement, null);
        }
    }

    /**
     * Converts the specified XML resource to JSON,
     * turning arbitrary-length decimals into JSON numbers as per the FHIR spec.
     * @param {string} xml Resource XML string
     * @returns {string} JSON with Numbers potentially too large for normal JavaScript & JSON.parse
     */
    public convertToJSON(xml) {
        const xmlObj = convert.xml2js(xml);
        if (xmlObj.elements.length !== 1) {
            return
        }

        /* Decimals are converted into an object with a custom
        toJSON function that wraps them with 'DDDD's of a length
        greater than any length of Ds in the JSON */
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
        // console.log("replaceRegex", replaceRegex)
        const json2 = json.replace(replaceRegex, '');
        return json2
    }

    private maxLengthOfDs(obj) {
        /**
         * get length of longest sequence of 'D' characters in a string
         * @param {string} str
         */
        function maxSubstringLengthStr(str) {
            const matches = str.match(/DDDD+/g);
            if (!matches) {
                return 0;
            }
            const ret = matches
                .map((substr) => { return substr.length })
                .reduce((p,c) => { return Math.max(p,c)}, 0);
            return ret;
        }
        /**
         * look through object to find longest sequence of 'D' characters
         * so we can safely wrap decimals
         */
        function maxSubstringLength(currentMax, obj) {
            let ret;
            if (typeof(obj) === 'string') {
                ret =  Math.max(currentMax, maxSubstringLengthStr(obj));
            } else if (typeof(obj) === 'object') {
                ret =  Object.keys(obj)
                    .map((k) => {
                        return Math.max(maxSubstringLengthStr(k), maxSubstringLength(currentMax, obj[k]))
                    })
                    .reduce((p,c) => { return Math.max(p,c) }, currentMax);
            } else {
                ret =  currentMax;
            }
            return ret;
        }
        return maxSubstringLength(0, obj);
    }

    /**
     * @param xmlObj
     * @returns {*}
     * @private
     */
    private resourceToJS(xmlObj, surroundDecimalsWith) {
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

    /**
     * Finds a property definition based on a reference to another type. Should be a BackboneElement or Element
     * @param relativeType {string} Example: "#QuestionnaireResponse.item"
     */
    private findReferenceType(relativeType) {
        if (!relativeType || !relativeType.startsWith('#')) {
            return;
        }

        const resourceType = relativeType.substring(1, relativeType.indexOf('.'));        // Assume starts with #
        const path = relativeType.substring(resourceType.length + 2);
        const resourceDefinition = this.parser.parsedStructureDefinitions[resourceType];
        const pathSplit = path.split('.');

        if (!resourceDefinition) {
            throw new Error('Could not find resource definition for ' + resourceType);
        }

        let current = <ParsedProperty><any> resourceDefinition;
        for (let i = 0; i < pathSplit.length; i++) {
            const nextPath = pathSplit[i];
            current = current._properties.find((property) => property._name === nextPath);

            if (!current) {
                return;
            }
        }

        return JSON.parse(JSON.stringify(current));
    }

    /**
     * @param xmlObj
     * @param obj
     * @param property
     * @private
     */
    private propertyToJS(xmlObj, obj, property, surroundDecimalsWith) {
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

        // If this is a reference type then f
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
                    // Fill in previous element indexes with null
                    if (dest.length < index+1) {
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
                } else {
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
            if (!value) return;

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
                            obj[property._name].push(value.attributes['value'])
                        } else {
                            obj[property._name] = value.attributes['value'];
                        }
                    }
                    break;
                case 'decimal':
                    addExtra(value, index);

                    if (value.attributes['value']) {
                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(convertDecimal(value.attributes['value'], surroundDecimalsWith))
                        } else {
                            obj[property._name] = convertDecimal(value.attributes['value'], surroundDecimalsWith)
                        }
                    }
                    break;
                case 'boolean':
                    addExtra(value, index);

                    if (value.attributes['value']) {
                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(toBoolean(value.attributes['value']))
                        } else {
                            obj[property._name] = toBoolean(value.attributes['value'])
                        }
                    }
                    break;
                case 'integer':
                case 'unsignedInt':
                case 'positiveInt':
                    addExtra(value, index);

                    if (value.attributes && value.attributes['value']) {
                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(toNumber(value.attributes['value']))
                        } else {
                            obj[property._name] = toNumber(value.attributes['value'])
                        }
                    }
                    break;
                case 'xhtml':
                    if (value.elements && value.elements.length > 0) {
                        const div = convert.js2xml({elements: [XmlHelper.escapeInvalidCharacters(value)]});
                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(div);
                        } else {
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
                    } else {
                        obj[property._name] = newValue;
                    }
                    break;
                case 'Resource':
                    if (value.elements.length === 1) {
                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(this.resourceToJS(value.elements[0], surroundDecimalsWith))
                        } else {
                            obj[property._name] = this.resourceToJS(value.elements[0], surroundDecimalsWith);
                        }
                    }
                    break;
                default:
                    const nextType = this.parser.parsedStructureDefinitions[property._type];

                    if (!nextType) {
                        console.log('do something');
                    } else {
                        const newValue = {};

                        nextType._properties.forEach(nextProperty => {
                            this.propertyToJS(value, newValue, nextProperty, surroundDecimalsWith);
                        });

                        if (obj[property._name] instanceof Array) {
                            obj[property._name].push(newValue);
                        } else {
                            obj[property._name] = newValue;
                        }
                    }
                    break;
            }
        }

        function toBoolean(value) {
            if (value === "true") {
                return true;
            } else if (value === "false") {
                return false;
            } else {
                throw new Error("value supposed to be a boolean but got: " + value)
            }
        }

        function toNumber(value) {
            if (/^-?\d+$/.test(value) == false) {
                throw new Error("value supposed to be a number but got: " + value)
            }
            return parseInt(value, 10)
        }

        function convertDecimal(value, surroundDecimalsWith) {
            // validation regex from http://hl7.org/fhir/xml.html
            if (/^-?([0]|([1-9][0-9]*))(\.[0-9]+)?$/.test(value) == false) {
                throw new Error("value supposed to be a decimal number but got: " + value)
            }
            if (surroundDecimalsWith) {
                return {
                    value: value,
                    toJSON: function() {
                        // surrounding str used as a marker to remove quotes to turn this
                        // into a JSON number as per FHIR spec..
                        return surroundDecimalsWith.str + value + surroundDecimalsWith.str;
                    }
                }
            } else {
                return value;
            }
        }

        if (property._multiple) {
            obj[property._name] = [];
        }

        for (let i in xmlProperty) {
            /*
            TODO: Maybe consider preserving the comments in JSON format.
            However, according to a FHIR Chat conversation, fhir_comments won't be supported in JSON going forward
            https://chat.fhir.org/#narrow/stream/4-implementers/subject/fhir_comments
    
            const xmlPropertyIndex = xmlObj.elements.indexOf(xmlProperty[i]);
            const xmlComment = xmlPropertyIndex > 0 && xmlObj.elements[xmlPropertyIndex-1].type === 'comment' ?
                xmlObj.elements[xmlPropertyIndex-1] :
                null;
            */

            pushValue(xmlProperty[i], i);
        }
    }
}