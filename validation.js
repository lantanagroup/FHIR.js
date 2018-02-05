module.exports = function(objOrXml, options) {
    var obj = objOrXml;
    var isXml = false;

    if (typeof(objOrXml) === 'string') {
        var toJs = require('./toJs');
        obj = toJs(objOrXml);
        isXml = true;
    }

    var validation = new FhirValidation(options);
    return validation.validate(obj, isXml);
}

var SEVERITY_FATAL = 'fatal';
var SEVERITY_ERROR = 'error';
var SEVERITY_WARN = 'warning';

function getValidationMessage(severity, message) {
    return {
        severity: severity,
        message: message
    };
}

function getValidationResponse(valid, messages) {
    return {
        valid: valid,
        messages: messages
    };
}

function getTreeDisplay(tree, isXml, leaf) {
    var display = '';

    for (var i = 0; i < tree.length; i++) {
        if (display) {
            if (isXml) {
                display += '/';
            } else {
                display += '.';
            }
        }

        display += tree[i];
    }

    if (leaf) {
        if (display) {
            if (isXml) {
                display += '/';
            } else {
                display += '.';
            }
        }

        display += leaf;
    }

    return display;
}

function validateProperties(obj, properties, tree, options, isXml, response) {
    var _ = require('underscore');

    _.each(properties, function(property) {
        var foundProperty = obj[property._name];

        // Look for missing properties
        if (property._required && !foundProperty) {
            response.valid = false;
            return response.messages.push(getValidationMessage(SEVERITY_ERROR, 'Missing property ' + getTreeDisplay(tree, isXml, property._name)));
        }

        // Only continue validating if we have a value for the property
        if (foundProperty) {
            // If this is an array/multiple, loop through each item in the array and validate it, instead of the array as a whole
            if (property._multiple) {
                _.each(foundProperty, function(foundPropertyElement, foundPropertyIndex) {
                    var treeItem = property._name;
                    if (isXml) {
                        treeItem += '[' + (foundPropertyIndex + 1) + ']';
                    } else {
                        treeItem += '[' + foundPropertyIndex + ']';
                    }

                    validateProperties(foundPropertyElement, property._properties, tree.concat(treeItem), options, isXml, response);
                });
            } else {
                if (property._properties && property._properties.length > 0) {
                    validateProperties(foundProperty, property._properties, tree.concat(property._name), options, isXml, response);
                }
            }
        }
    });

    _.each(Object.keys(obj), function(objKey) {
        if (objKey === 'resourceType') {
            return;
        }

        var foundProperty = _.find(properties, function(property) {
            return property._name === objKey;
        });

        if (!foundProperty) {
            if (options.errorOnUnexpected) {
                response.valid = false;
                return response.messages.push(getValidationMessage(SEVERITY_ERROR, 'Unexpected property ' + getTreeDisplay(tree, isXml, objKey)));
            } else {
                return;
            }
        }
    });
}

var FhirValidation = function(options) {
    this.options = options || {};
    this.options.errorOnUnexpected = this.options.errorOnUnexpected || true;
};

FhirValidation.prototype.validate = function(obj, isXml) {
    var typeDefinitions = require('./profiles/types.json');
    var typeDefinition = typeDefinitions[obj.resourceType];

    if (!obj || !typeDefinition) {
        return getValidationResponse(
            false,
            getValidationMessage(SEVERITY_FATAL, 'Resource does not have resourceType property, or value is not a valid resource type.'));
    }

    var response = {
        valid: true,
        messages: []
    };

    validateProperties(obj, typeDefinition._properties, [obj.resourceType], this.options, isXml, response);

    return response;
}