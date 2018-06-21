/**
 * @typedef ParseStructureDefinitionResponse
 * @property {string} _type
 * @property {ParseStructureDefinitionResponseProperty[]} _properties
 */

/**
 * @typedef ParseStructureDefinitionResponseProperty
 * @property {string} _name
 * @property {string} [_valueSet]
 * @property {string} [_valueSetStrength]
 * @property {ParseStructureDefinitionResponseProperty[]} _properties
 */

/**
 * @typedef ParseValueSetResponse
 * @property {ParseValueSetResponseSystem[]} systems
 */

/**
 * @typedef ParseValueSetResponseSystem
 * @property {ParseValueSetRepsonseSystemCode[]} codes
 * @property {string} uri
 */

/**
 * @typedef ParseValueSetResponseSystemCode
 * @property {string} code
 * @property {string} display
 */

var _ = require('underscore');

/**
 * Class responsible for parsing StructureDefinition and ValueSet resources into bare-minimum information
 * needed for serialization and validation.
 * @param {boolean} loadCached
 * @param {StructureDefinition[]} [coreStructureDefinitions]
 * @param {Bundle} [coreValueSetBundle]
 * @constructor
 */
function ParseConformance(loadCached, coreStructureDefinitions) {
    /**
     * @type {ParseStructureDefinitionResponse[]}
     */
    this.parsedStructureDefinitions = loadCached ? require('./profiles/types.json') : {};

    /**
     * @type {ParseValueSetResponse[]}
     */
    this.parsedValueSets = loadCached ? require('./profiles/valuesets.json') : {};
}

/**
 * Parses any ValueSet and StructureDefinition resources in the bundle and stores
 * them in the parser for use by serialization and validation logic.
 * @param {Bundle} bundle The bundle to parse
 */
ParseConformance.prototype.parseBundle = function(bundle) {
    if (!bundle || !bundle.entry) {
        return;
    }

    for (var i = 0; i < bundle.entry.length; i++) {
        var entry = bundle.entry[i];
        var resource = entry.resource;

        switch (resource.resourceType) {
            case 'StructureDefinition':
                // Only parse a few kinds of StructureDefinition resources
                if (resource.kind != 'resource' && resource.kind != 'complex-type' && resource.kind != 'primitive-type') {
                    break;
                }

                this.parseStructureDefinition(resource);
                break;
            case 'ValueSet':
                this.parseValueSet(resource, bundle);
                break;
        }
    }
}

/**
 * Parses a StructureDefinition resource, reading only properties necessary for the FHIR.js module to perform its functions.
 * structureDefinition must have a unique id, or it will overwrite other parsed structure definitions stored in memory
 * @param {StructureDefinition} structureDefinition The StructureDefinition to parse and load into memory
 * @returns {ParseStructureDefinitionResponseProperty}
 */
ParseConformance.prototype.parseStructureDefinition = function(structureDefinition) {
    var self = this;

    var parsedStructureDefinition = {
        _type: 'Resource',
        _properties: []
    };
    this.parsedStructureDefinitions[structureDefinition.id] = parsedStructureDefinition;         // TODO: Not sure this works for profiles

    if (structureDefinition.snapshot && structureDefinition.snapshot.element) {
        for (var x in structureDefinition.snapshot.element) {
            var element = structureDefinition.snapshot.element[x];
            var elementId = structureDefinition.snapshot.element[x].id;
            elementId = elementId.substring(structureDefinition.id.length + 1);

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
                parsedStructureDefinition._properties.push(newProperty);

                self.populateValueSet(element, newProperty);

                if (element.type[0].code == 'BackboneElement') {
                    newProperty._properties = [];
                    self.populateBackboneElement(parsedStructureDefinition, structureDefinition.snapshot.element[x].id, structureDefinition);
                }
            } else if (elementId.endsWith('[x]')) {
                elementId = elementId.substring(0, elementId.length - 3);
                for (var y in element.type) {
                    var choiceType = element.type[y].code;
                    choiceType = choiceType.substring(0, 1).toUpperCase() + choiceType.substring(1);
                    var choiceElementId = elementId + choiceType;
                    var newProperty = {
                        _name: choiceElementId,
                        _choice: elementId,
                        _type: element.type[y].code,
                        _multiple: element.max !== '1',
                        _required: element.min === 1
                    };

                    self.populateValueSet(element, newProperty);

                    parsedStructureDefinition._properties.push(newProperty);
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
                    parsedStructureDefinition._properties.push({
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

    return parsedStructureDefinition;
}

/**
 * Parses the ValueSet resource. Parses only bare-minimum information needed for validation against value sets.
 * Currently only supports parsing 'compose'
 * @param {ValueSet} valueSet The ValueSet resource to parse and load into memory
 * @param {Bundle} bundle A bundle of resources that contains any ValueSet or CodeSystem resources that ValueSet being parsed references
 * @returns {ParseValueSetResponse}
 */
ParseConformance.prototype.parseValueSet = function(valueSet, bundle) {
    var self = this;

    if (valueSet.compose) {
        var newValueSet = {
            systems: []
        };

        for (var i = 0; i < valueSet.compose.include.length; i++) {
            var include = valueSet.compose.include[i];
            var newSystem = {
                uri: include.system,
                codes: []
            };

            var nextCodes = null;

            if (!include.concept) {
                if (!bundle) {
                    return;
                }

                // Add all codes from the code system
                var foundCodeSystem = _.find(bundle.entry, function(entry) {
                    return entry.resource.url === include.system
                });

                // Couldn't find the code system, won't include it in validation
                if (!foundCodeSystem) {
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

        self.parsedValueSets[valueSet.url] = newValueSet;
        return newValueSet;
    }
}

/**
 * This method is called to ensure that a value set (by its url) is loaded from the core spec
 * @param {string} valueSetUrl The url of the value set
 * @param {Bundle} bundle A bundle that ValueSet is stored in, if the value set is not already loaded into the parser
 * @returns {boolean} Returns true if the value set was found/loaded, otherwise false
 * @private
 */
ParseConformance.prototype.ensureValueSetLoaded = function(valueSetUrl, bundle) {
    var self = this;

    if (this.parsedValueSets[valueSetUrl]) {
        return true;
    }

    if (!bundle) {
        return false;
    }

    var foundValueSetEntry = _.find(bundle.entry, function(entry) {
        return entry.fullUrl === valueSetUrl;
    });

    if (!foundValueSetEntry) {
        return false;
    }

    var foundValueSet = foundValueSetEntry.resource;

    if (this.parseValueSet(foundValueSet)) {
        return true;
    }

    return false;
}

/**
 * @param {ElementDefinition} element
 * @param {ParseStructureDefinitionResponseProperty} property
 * @private
 */
ParseConformance.prototype.populateValueSet = function(element, property) {
    var self = this;
    if (element.binding && element.binding.valueSetReference) {
        property._valueSet = element.binding.valueSetReference.reference;

        if (element.binding.strength) {
            property._valueSetStrength = element.binding.strength;
        }

        self.ensureValueSetLoaded(element.binding.valueSetReference.reference);
    }
}

/**
 * @param {string} resourceType
 * @param {string} parentElementId
 * @param {StructureDefinition} profile
 * @private
 */
ParseConformance.prototype.populateBackboneElement = function(resourceType, parentElementId, profile) {
    var self = this;
    for (var y in profile.snapshot.element) {
        var backboneElement = profile.snapshot.element[y];
        var backboneElementId = backboneElement.id;
        if (!backboneElementId.startsWith(parentElementId + '.') || backboneElementId.split('.').length !== parentElementId.split('.').length + 1) {
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
                var type = 'string';

                if (backboneElement.contentReference) {
                    type = backboneElement.contentReference;
                }

                parentBackboneElement._properties.push({
                    _name: backboneElementId.substring(backboneElementId.lastIndexOf('.') + 1),
                    _type: type,
                    _multiple: backboneElement.max !== '1',
                    _required: backboneElement.min === 1
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

                self.populateValueSet(backboneElement, newProperty);

                if (backboneElement.type[0].code == 'BackboneElement') {
                    self.populateBackboneElement(resourceType, profile.snapshot.element[y].id, profile);
                }
            } else if (backboneElement.id.endsWith('[x]')) {
                var nextElementId = backboneElement.id.substring(backboneElement.id.lastIndexOf('.') + 1, backboneElement.id.length - 3);
                for (var y in backboneElement.type) {
                    var choiceType = backboneElement.type[y].code;
                    choiceType = choiceType.substring(0, 1).toUpperCase() + choiceType.substring(1);
                    var choiceElementId = backboneElement.id.substring(backboneElement.id.lastIndexOf('.') + 1, backboneElement.id.length - 3) + choiceType;
                    var newProperty = {
                        _name: choiceElementId,
                        _choice: backboneElement.id.substring(backboneElement.id.lastIndexOf('.') + 1),
                        _type: backboneElement.type[y].code,
                        _multiple: backboneElement.max !== '1',
                        _required: backboneElement.min === 1
                    };
                    parentBackboneElement._properties.push(newProperty);

                    self.populateValueSet(backboneElement, newProperty);
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

                self.populateValueSet(backboneElement, newProperty);
            }
        } else {
            throw 'Unexpected backbone parent element id';
        }
    }
}

module.exports = ParseConformance;