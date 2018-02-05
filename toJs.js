var convert = require('xml-js');
var _ = require('underscore');
var typeDefinitions = require('./profiles/types.json');

module.exports = function(xml) {
    var xmlObj = convert.xml2js(xml);

    if (xmlObj.elements.length === 1) {
        return resourceToJs(xmlObj.elements[0]);
    }
}

function resourceToJs(xmlObj) {
    var typeDefinition = typeDefinitions[xmlObj.name];
    var resource = {
        resourceType: xmlObj.name
    };

    _.each(typeDefinition._properties, function(property) {
        propertyToJs(xmlObj, resource, property);
    });

    return resource;
}

function propertyToJs(xmlObj, obj, property) {
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
                    propertyToJs(value, newValue, nextProperty);
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
                        obj[property._name].push(resourceToJs(value.elements[0]))
                    } else {
                        obj[property._name] = resourceToJs(value.elements[0]);
                    }
                }
                break;
            default:
                var nextType = typeDefinitions[property._type];

                if (!nextType) {
                    console.log('do something');
                } else {
                    var newValue = {};

                    _.each(nextType._properties, function(nextProperty) {
                        propertyToJs(value, newValue, nextProperty);
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