var convert = require('xml-js');
var _ = require('underscore');
var typeDefinitions = require('./profiles/types.json');

module.exports = function(obj) {
    if (obj.hasOwnProperty('resourceType')) {
        var xmlObj = resourceToXml(obj);
        return convert.js2xml(xmlObj);
    }
}

function resourceToXml(obj, xmlObj) {
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

    if (!typeDefinitions[obj.resourceType]) {
        throw 'Could not find type for ' + obj.resourceType;
    }

    _.each(typeDefinitions[obj.resourceType]._properties, function(property) {
        propertyToXml(resourceElement, typeDefinitions[obj.resourceType], obj, property._name);
    });

    return xmlObj;
}

function propertyToXml(parentXmlObj, parentType, obj, propertyName) {
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
                nextXmlObj.elements.push(resourceToXml(value).elements[0]);
                break;
            case 'BackboneElement':
                for (var x in propertyType._properties) {
                    var nextProperty = propertyType._properties[x];
                    propertyToXml(nextXmlObj, propertyType, value, nextProperty._name);
                }
                break;
            default:
                var nextType = typeDefinitions[propertyType._type];

                if (!nextType) {
                    console.log('do something');
                } else {
                    _.each(nextType._properties, function(nextProperty) {
                        propertyToXml(nextXmlObj, nextType, value, nextProperty._name);
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