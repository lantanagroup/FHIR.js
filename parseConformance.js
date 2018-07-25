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
 * Sorts an array of value sets based on each value set's dependencies.
 * If a value set depends on another value set, the dependent value set
 * is returned in the array before the depending value set, so that when all
 * value sets are parsed in a bundle, it parses the dependent value sets first.
 * @param valueSets {ValueSet[]}
 * @return {ValueSet[]}
 */
function sortValueSetDependencies(valueSets) {
    var ret = [];

    function addValueSet(valueSetUrl) {
        var foundValueSet = _.find(valueSets, function(nextValueSet) {
            return nextValueSet.url === valueSetUrl;
        });

        if (!foundValueSet) {
            return;
        }

        if (foundValueSet.compose) {
            // Add the include value sets before this value set
            _.each(foundValueSet.compose.include, function(include) {
                addValueSet(include.valueSet);
            });
        }

        if (ret.indexOf(foundValueSet) < 0) {
            ret.push(foundValueSet);
        }
    }

    _.each(valueSets, function(valueSet) {
        addValueSet(valueSet.url);
    });

    return ret;
}

/**
 * Class responsible for parsing StructureDefinition and ValueSet resources into bare-minimum information
 * needed for serialization and validation.
 * @param {boolean} loadCached
 * @param {string} [version=R4] The version of FHIR to use with this parser
 * @constructor
 */
function ParseConformance(loadCached, version) {
    /**
     * @type {ParseStructureDefinitionResponse[]}
     */
    this.parsedStructureDefinitions = loadCached ? require('./profiles/types.json') : {};

    /**
     * @type {ParseValueSetResponse[]}
     */
    this.parsedValueSets = loadCached ? require('./profiles/valuesets.json') : {};

    this.version = version || ParseConformance.VERSIONS.R4;

    this._codeSystems = [];
}

/**
 * Enumeration of FHIR versions supported by FHIR.js
 * @type {{STU3: string, R4: string}}
 */
ParseConformance.VERSIONS = {
    STU3: 'STU3',
    R4: 'R4'
};

ParseConformance.prototype.loadCodeSystem = function(codeSystem) {
    if (!codeSystem) {
        return;
    }

    var foundCodeSystem = _.find(this._codeSystems, function(nextCodeSystem) {
        return nextCodeSystem.url === codeSystem.url || nextCodeSystem.id === codeSystem.id;
    });

    if (!foundCodeSystem) {
        this._codeSystems.push(codeSystem);
    }
};

/**
 * Parses any ValueSet and StructureDefinition resources in the bundle and stores
 * them in the parser for use by serialization and validation logic.
 * @param {Bundle} bundle The bundle to parse
 */
ParseConformance.prototype.parseBundle = function(bundle) {
    if (!bundle || !bundle.entry) {
        return;
    }

    var self = this;

    // load code systems
    _.chain(bundle.entry)
        .filter(function(entry) {
            return entry.resource.resourceType === 'CodeSystem';
        })
        .each(function(entry) {
            self.loadCodeSystem(entry.resource);
        });

    // parse each value set
    var valueSets = _.chain(bundle.entry)
        .filter(function(entry) {
            return entry.resource.resourceType === 'ValueSet';
        })
        .map(function(entry) {
            return entry.resource;
        })
        .value();
    valueSets = sortValueSetDependencies(valueSets);
    _.each(valueSets, function(valueSet) {
        self.parseValueSet(valueSet);
    });

    // parse structure definitions
    _.chain(bundle.entry)
        .filter(function(entry) {
            if (entry.resource.resourceType !== 'StructureDefinition') {
                return false;
            }

            var resource = entry.resource;

            if (resource.kind != 'resource' && resource.kind != 'complex-type' && resource.kind != 'primitive-type') {
                return false;
            }

            return true;
        })
        .each(function(entry) {
            self.parseStructureDefinition(entry.resource);
        });
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
        _kind: structureDefinition.kind,
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

                if (element.type[0].code == 'BackboneElement' || element.type[0].code == 'Element') {
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
ParseConformance.prototype.parseValueSet = function(valueSet) {
    var self = this;

    var newValueSet = {
        systems: []
    };

    if (valueSet.expansion && valueSet.expansion.contains) {
        for (var i = 0; i < valueSet.expansion.contains.length; i++) {
            var contains = valueSet.expansion.contains[i];

            if (contains.inactive || contains.abstract) {
                continue;
            }

            var foundSystem = _.find(newValueSet.systems, function(system) {
                return system.uri === contains.system;
            });

            if (!foundSystem) {
                foundSystem = {
                    uri: contains.system,
                    codes: []
                };
                newValueSet.systems.push(foundSystem);
            }

            foundSystem.codes.push({
                code: contains.code,
                display: contains.display
            });
        }
    } else if (valueSet.compose) {
        for (var i = 0; i < valueSet.compose.include.length; i++) {
            var include = valueSet.compose.include[i];

            if (include.system) {
                var foundSystem = _.find(newValueSet.systems, function (system) {
                    return system.uri === include.system;
                });

                if (!foundSystem) {
                    foundSystem = {
                        uri: include.system,
                        codes: []
                    };
                    newValueSet.systems.push(foundSystem);
                }

                // Add all codes from the code system
                var foundCodeSystem = _.find(this._codeSystems, function(codeSystem) {
                    return codeSystem.url === include.system;
                });

                if (foundCodeSystem) {
                    var codes = _.map(foundCodeSystem.concept, function (concept) {
                        return {
                            code: concept.code,
                            display: concept.display
                        };
                    });

                    foundSystem.codes = foundSystem.codes.concat(codes);
                }
            }

            if (include.valueSet) {
                var includeValueSet = this.parsedValueSets[include.valueSet];

                if (includeValueSet) {
                    _.each(includeValueSet.systems, function(includeSystem) {
                        var foundSystem = _.find(newValueSet.systems, function(nextSystem) {
                            return nextSystem.uri === includeSystem.uri;
                        });

                        if (!foundSystem) {
                            newValueSet.systems.push({
                                uri: includeSystem.uri,
                                codes: [].concat(includeSystem.codes)
                            });
                        } else {
                            foundSystem.codes = foundSystem.codes.concat(includeSystem.codes);
                        }
                    });
                }
            }

            if (include.concept) {
                var systemUri = include.system || '';

                var foundSystem = _.find(newValueSet.systems, function(nextSystem) {
                    return nextSystem.uri === systemUri;
                });

                if (!foundSystem) {
                    foundSystem = {
                        uri: systemUri,
                        codes: []
                    };
                    newValueSet.systems.push(foundSystem);
                }

                var codes = _.map(include.concept, function(concept) {
                    return {
                        code: concept.code,
                        display: concept.display
                    };
                });

                foundSystem.codes = foundSystem.codes.concat(codes);
            }
        }
    }

    var systemsWithCodes = _.filter(newValueSet.systems, function(system) {
        return system.codes && system.codes.length > 0;
    });

    if (systemsWithCodes.length > 0) {
        self.parsedValueSets[valueSet.url] = newValueSet;
        return newValueSet;
    }
}

/**
 * @param {ElementDefinition} element
 * @param {ParseStructureDefinitionResponseProperty} property
 * @private
 */
ParseConformance.prototype.populateValueSet = function(element, property) {
    var self = this;
    if (element.binding) {
        var binding = element.binding;

        if (binding.strength) {
            property._valueSetStrength = binding.strength;
        }

        if (this.version === ParseConformance.VERSIONS.R4 && binding.valueSet) {
            property._valueSet = binding.valueSet;
        } else if (this.version === ParseConformance.VERSIONS.STU3 && binding.valueSetReference && binding.valueSetReference.reference) {
            property._valueSet = binding.valueSetReference.reference;
        }
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

                if (backboneElement.type[0].code === 'BackboneElement' || backboneElement.type[0].code == 'Element') {
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