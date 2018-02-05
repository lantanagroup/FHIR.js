var profiles = require('./r4/index');
var valueSetBundle = require('./r4/valuesets');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var resourceTypes = {};
var valueSets = {};

function populateValueSet(element, property) {
    if (element.binding && element.binding.valueSetReference) {
        property._valueSet = element.binding.valueSetReference.reference;

        if (element.binding.strength) {
            property._valueSetStrength = element.binding.strength;
        }

        var foundValueSet = _.find(valueSetBundle.entry, function(entry) {
            return entry.fullUrl === property._valueSet;
        });

        if (foundValueSet) {
            foundValueSet = foundValueSet.resource;
        }

        if (foundValueSet && foundValueSet.compose) {
            var newValueSet = {
                systems: []
            };

            for (var i = 0; i < foundValueSet.compose.include.length; i++) {
                var include = foundValueSet.compose.include[i];
                var newSystem = {
                    uri: include.system,
                    codes: []
                };

                // Not dealing with complex value sets that filter codes
                if (include.filter) {
                    delete property._valueSet;
                    return;
                }

                var nextCodes = null;

                if (!include.concept) {
                    // Add all codes from the code system
                    var foundCodeSystem = _.find(valueSetBundle.entry, function(entry) {
                        return entry.resource.url === include.system
                    });

                    // Couldn't find the code system, won't include it in validation
                    if (!foundCodeSystem) {
                        delete property._valueSet;
                        return;
                    }

                    foundCodeSystem = foundCodeSystem.resource;

                    nextCodes = _.map(foundCodeSystem.concept, function(concept) {
                        return {
                            code: concept.code,
                            display: concept.display
                        };
                    });
                } else {
                    nextCodes = _.map(include.concept, function(concept) {
                        return {
                            code: concept.code,
                            display: concept.display
                        };
                    });
                }

                newSystem.codes = newSystem.codes.concat(nextCodes);
                newValueSet.systems.push(newSystem);
            }

            valueSets[property._valueSet] = newValueSet;
        }
    }
}

function populateBackboneElement(resourceType, parentElementId, profile) {
    for (var y in profile.snapshot.element) {
        var backboneElement = profile.snapshot.element[y];
        var backboneElementId = backboneElement.id;
        if (!backboneElementId.startsWith(parentElementId + '.')) {
            continue;
        }

        backboneElementId = backboneElementId.substring(profile.id.length + 1);
        var parentElementIdSplit = parentElementId.substring(profile.id.length + 1).split('.');
        var parentBackboneElement = null;

        for (var j = 0; j < parentElementIdSplit.length; j++) {
            parentBackboneElement = _.find(!parentBackboneElement ? resourceType._properties : parentBackboneElement._properties, function(property) {
                return property._name == parentElementIdSplit[j];
            });

            if (!parentBackboneElement) {
                throw 'Parent backbone element not found';
            }
        }

        if (parentBackboneElement) {
            if (!backboneElement.type) {
                parentBackboneElement._properties.push({
                    _name: backboneElementId.substring(backboneElementId.lastIndexOf('.') + 1),
                    _type: 'string'
                });
            } else if (backboneElement.type.length == 1) {
                var newProperty = {
                    _name: backboneElementId.substring(backboneElementId.lastIndexOf('.') + 1),
                    _type: backboneElement.type[0].code,
                    _multiple: backboneElement.max !== '1',
                    _required: backboneElement.min === 1,
                    _properties: []
                };
                parentBackboneElement._properties.push(newProperty);

                populateValueSet(backboneElement, newProperty);

                if (backboneElement.type[0].code == 'BackboneElement') {
                    populateBackboneElement(resourceType, profile.snapshot.element[y].id, profile);
                }
            } else if (backboneElement.id.endsWith('[x]')) {
                var nextElementId = backboneElement.id.substring(backboneElement.id.lastIndexOf('.') + 1, backboneElement.id.length - 3);
                for (var y in backboneElement.type) {
                    var choiceType = backboneElement.type[y].code;
                    choiceType = choiceType.substring(0, 1).toUpperCase() + choiceType.substring(1);
                    var choiceElementId = backboneElement.id.substring(backboneElement.id.lastIndexOf('.') + 1, backboneElement.id.length - 3) + choiceType;
                    var newProperty = {
                        _name: choiceElementId,
                        _type: backboneElement.type[y].code,
                        _multiple: backboneElement.max !== '1',
                        _required: backboneElement.min === 1
                    };
                    parentBackboneElement._properties.push(newProperty);

                    populateValueSet(backboneElement, newProperty);
                }
            } else {
                var isReference = true;
                for (var z in backboneElement.type) {
                    if (backboneElement.type[z].code !== 'Reference') {
                        isReference = false;
                        break;
                    }
                }

                if (!isReference) {
                    throw 'Did not find a reference... not sure what to do';
                }

                var newProperty = {
                    _name: backboneElementId.substring(backboneElementId.lastIndexOf('.') + 1),
                    _type: 'Reference',
                    _multiple: backboneElement.max !== '1',
                    _required: backboneElement.min === 1
                };
                parentBackboneElement._properties.push(newProperty);

                populateValueSet(backboneElement, newProperty);
            }
        } else {
            throw 'Unexpected backbone parent element id';
        }
    }
}

for (var i in profiles) {
    var profile = profiles[i];
    var resourceType = resourceTypes[i] || { _type: 'Resource', _properties: [] };
    resourceTypes[i] = resourceType;

    if (profile.snapshot && profile.snapshot.element) {
        for (var x in profile.snapshot.element) {
            var element = profile.snapshot.element[x];
            var elementId = profile.snapshot.element[x].id;
            elementId = elementId.substring(profile.id.length + 1);

            if (!element.max) {
                throw 'Expected all base resource elements to have a max value';
            }

            if (!elementId || elementId.indexOf('.') > 0 || !element.type) {
                continue;
            }

            if (element.type.length === 1) {
                var newProperty = {
                    _name: elementId,
                    _type: element.type[0].code,
                    _multiple: element.max !== '1',
                    _required: element.min === 1
                };
                resourceType._properties.push(newProperty);

                populateValueSet(element, newProperty);

                if (element.type[0].code == 'BackboneElement') {
                    newProperty._properties = [];
                    populateBackboneElement(resourceType, profile.snapshot.element[x].id, profile);
                }
            } else if (elementId.endsWith('[x]')) {
                elementId = elementId.substring(0, elementId.length - 3);
                for (var y in element.type) {
                    var choiceType = element.type[y].code;
                    choiceType = choiceType.substring(0, 1).toUpperCase() + choiceType.substring(1);
                    var choiceElementId = elementId + choiceType;
                    var newProperty = {
                        _name: choiceElementId,
                        _type: element.type[y].code,
                        _multiple: element.max !== '1',
                        _required: element.min === 1
                    };

                    populateValueSet(element, newProperty);

                    resourceType._properties.push(newProperty);
                }
            } else {
                var isReference = true;
                for (var y in element.type) {
                    if (element.type[y].code !== 'Reference') {
                        isReference = false;
                        break;
                    }
                }

                if (isReference) {
                    resourceType._properties.push({
                        _name: elementId,
                        _type: 'Reference',
                        _multiple: element.max !== '1'
                    });
                } else {
                    console.log(elementId);
                }
            }
        }
    }

    console.log('Done finding types for profile ' + profile.id);
}

fs.writeFileSync(path.join(__dirname, './types.json'), JSON.stringify(resourceTypes));
fs.writeFileSync(path.join(__dirname, './valuesets.json'), JSON.stringify(valueSets));