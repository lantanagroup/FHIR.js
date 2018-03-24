var convert = require('xml-js');
var _ = require('underscore');
var ParseConformance = require('./parseConformance.js');

/**
 * @constructor
 * @param {ParseConformance} [parser] A parser, which may include specialized StructureDefintion and ValueSet resources
 */
function ConvertToJS(parser) {
    this.parser = parser || new ParseConformance(true);
}

/**
 * Converts the specified XML resource to a JS object
 * @param {string} xml Resource XML string
 * @returns {FHIR.Resource} A Resource object converted from the XML Resource
 */
ConvertToJS.prototype.convert = function(xml) {
    var self = this;
    var xmlObj = convert.xml2js(xml);

    if (xmlObj.elements.length === 1) {
        return self.resourceToJS(xmlObj.elements[0]);
    }
};

/**
 * @param xmlObj
 * @returns {*}
 * @private
 */
ConvertToJS.prototype.resourceToJS = function(xmlObj) {
    var self = this;
    var typeDefinition = self.parser.parsedStructureDefinitions[xmlObj.name];
    var self = this;
    var resource = {
        resourceType: xmlObj.name
    };

    if (!typeDefinition) {
        throw new Error('Unknown resource type: ' + xmlObj.name);
    }

    _.each(typeDefinition._properties, function(property) {
        self.propertyToJS(xmlObj, resource, property);
    });

    return resource;
}

/**
 * @param xmlObj
 * @param obj
 * @param property
 * @private
 */
ConvertToJS.prototype.propertyToJS = function(xmlObj, obj, property) {
    var self = this;
    var xmlProperty = _.filter(xmlObj.elements, function(element) {
        return element.name === property._name;
    });

    if (!xmlProperty || xmlProperty.length === 0) {
        return;
    }

    function pushValue(value) {
        if (!value) return;

        switch (property._type) {
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
                if (value.attributes['value']) {
                    if (obj[property._name] instanceof Array) {
                        obj[property._name].push(value.attributes['value'])
                    } else {
                        obj[property._name] = value.attributes['value'];
                    }
                }
                break;
            case 'xhtml':
                if (value.elements && value.elements.length > 0) {
                    var div = convert.js2xml({elements: [value]});
                    if (obj[property._name] instanceof Array) {
                        obj[property._name].push(div);
                    } else {
                        obj[property._name] = div;
                    }
                }
                break;
            case 'BackboneElement':
                var newValue = {};

                for (var x in property._properties) {
                    var nextProperty = property._properties[x];
                    self.propertyToJS(value, newValue, nextProperty);
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
                        obj[property._name].push(self.resourceToJS(value.elements[0]))
                    } else {
                        obj[property._name] = self.resourceToJS(value.elements[0]);
                    }
                }
                break;
            default:
                var nextType = self.parser.parsedStructureDefinitions[property._type];

                if (!nextType) {
                    console.log('do something');
                } else {
                    var newValue = {};

                    _.each(nextType._properties, function(nextProperty) {
                        self.propertyToJS(value, newValue, nextProperty);
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

    if (property._multiple) {
        obj[property._name] = [];
    }

    for (var i in xmlProperty) {
        pushValue(xmlProperty[i]);
    }
}

module.exports = ConvertToJS;