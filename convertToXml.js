var convert = require('xml-js');
var _ = require('underscore');
var ParseConformance = require('./parseConformance.js');

/**
 * @constructor
 * @param {ParseConformance} [parser] A parser, which may include specialized StructureDefintion and ValueSet resources
 */
function ConvertToXML(parser) {
    this.parser = parser || new ParseConformance(true);
}

/**
 * Converts the specified object to XML
 * @param {FHIR.Resource} obj
 * @returns {string}
 */
ConvertToXML.prototype.convert = function(obj) {
    var self = this;

    if (obj.hasOwnProperty('resourceType')) {
        var xmlObj = self.resourceToXML(obj);
        return convert.js2xml(xmlObj);
    }
}

/**
 * @param obj
 * @param xmlObj
 * @returns {*}
 * @private
 */
ConvertToXML.prototype.resourceToXML = function(obj, xmlObj) {
    var self = this;
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

    if (!self.parser.parsedStructureDefinitions[obj.resourceType]) {
        throw new Error('Unknown resource type: ' + obj.resourceType);
    }

    _.each(self.parser.parsedStructureDefinitions[obj.resourceType]._properties, function(property) {
        self.propertyToXML(resourceElement, self.parser.parsedStructureDefinitions[obj.resourceType], obj, property._name);
    });

    return xmlObj;
}

/**
 * @param parentXmlObj
 * @param parentType
 * @param obj
 * @param propertyName
 * @private
 */
ConvertToXML.prototype.propertyToXML = function(parentXmlObj, parentType, obj, propertyName) {
    var self = this;

    if (!obj || !obj[propertyName]) return;

    var propertyType = _.find(parentType._properties, function(property) {
        return property._name == propertyName;
    });

    function pushProperty(value) {
        if (!value) return;

        var nextXmlObj = {
            type: 'element',
            name: propertyName,
            elements: []
        };

        switch (propertyType._type) {
            case 'string':
            case 'base64binary':
            case 'code':
            case 'id':
            case 'markdown':
            case 'uri':
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
                nextXmlObj.attributes = {
                    value: value
                };
                break;
            case 'xhtml':
                if (propertyName === 'div') {
                    var divXmlObj = convert.xml2js(value);
                    if (divXmlObj.elements.length === 1 && divXmlObj.elements[0].name === 'div') {
                        nextXmlObj.elements = divXmlObj.elements[0].elements;
                    }
                }
                break;
            case 'Resource':
                nextXmlObj.elements.push(self.resourceToXML(value).elements[0]);
                break;
            case 'BackboneElement':
                for (var x in propertyType._properties) {
                    var nextProperty = propertyType._properties[x];
                    self.propertyToXML(nextXmlObj, propertyType, value, nextProperty._name);
                }
                break;
            default:
                var nextType = self.parser.parsedStructureDefinitions[propertyType._type];

                if (propertyType._type.startsWith('#')) {
                    var typeSplit = propertyType._type.substring(1).split('.');
                    for (var i = 0; i < typeSplit.length; i++) {
                        if (i == 0) {
                            nextType = self.parser.parsedStructureDefinitions[typeSplit[i]];
                        } else {
                            nextType = _.find(nextType._properties, function(nextTypeProperty) {
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
                } else {
                    _.each(nextType._properties, function(nextProperty) {
                        self.propertyToXML(nextXmlObj, nextType, value, nextProperty._name);
                    });
                }
        }

        parentXmlObj.elements.push(nextXmlObj);
    }

    if (obj[propertyName] && propertyType._multiple) {
        for (var i = 0; i < obj[propertyName].length; i++) {
            pushProperty(obj[propertyName][i]);
        }
    } else {
        pushProperty(obj[propertyName]);
    }
}

module.exports = ConvertToXML;