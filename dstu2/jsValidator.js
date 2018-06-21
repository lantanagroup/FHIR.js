/**
 * @class JsValidator
 * @memberof module:dstu2
 * @param profiles
 */
module.exports = function(profiles) {
    var self = this;
    var result;
    var elements;

    var findProfileByResourceType = function(resourceType) {
        for (var i in profiles) {
            var profile = profiles[i];

            if (profile.name.toLowerCase() == resourceType.toLowerCase()) {
                return profile;
            }
        }
    };

    var findProfileById = function(profileId) {
        for (var i in profiles) {
            var profile = profiles[i];

            if (profile.identifier == profileId) {
                return profile;
            }
        }
    };

    var validateCardinality = function(element, obj, currentPath) {
        var pathSplit = element.path.replace(currentPath + '.', '').split('.');
        var current = [ obj ];

        // find current property in object that matches element.path
        pathSplit.forEach(function (pathSegment) {
            var next = [];

            current.forEach(function (currentValue) {
                var currentEval = currentValue[pathSegment];
                // support 'choice of types'
                if (pathSegment.endsWith('[x]')) {
                  element.type.forEach(function (type) {
                    var newPathSegment = pathSegment.replace('[x]', type.code)
                    if (currentValue[newPathSegment]) {
                      currentEval = currentValue[newPathSegment]
                    }
                  })
                }

                if (typeof currentEval !== 'undefined') {
                    if (currentEval instanceof Array) {
                        next = next.concat(currentEval);
                    } else if (currentEval || currentEval == false) {
                        next.push(currentEval);
                    }
                }
            });

            current = next;
        });

        if (current.length < element.min) {
            result.errors.push('Element ' + element.path + ' does not meet the minimal cardinality of ' + element.min + ' (actual: ' + current.length + ')');
        }

        if (current.length > (element.max == '*' ? Number.MAX_SAFE_INTEGER : parseInt(element.max))) {
            result.errors.push('Element ' + element.path + ' does not meet the maximum cardinality of ' + element.max + ' (actual: ' + current.length + ')');
        }

        if (current.length > 0) {
            if (element.type && element.type.length == 1 && element.type[0].code == 'Resource') {
                // Validate child profiles
                for (var i in current) {
                    var nextObj = current[i];
                    var childProfile = findProfileByResourceType(nextObj.resourceType);

                    if (childProfile) {
                        var childValidator = new module.exports(profiles);
                        var childResults = childValidator.Validate(nextObj, childProfile);

                        if (!childResults.valid) {
                            for (var x in childResults.errors) {
                                var childError = childResults.errors[x];

                                if (element.path == 'Bundle.entry.content') {
                                    result.errors.push(element.path + ' "' + obj.title + '": ' + childError);
                                } else {
                                    result.errors.push(element.path + ': ' + childError);
                                }
                            }
                        }
                    }
                }
            } else {
                // Validate cardinality
                for (var i in elements) {
                    var nextElement = elements[i];

                    if (nextElement.path.indexOf(element.path) == 0 && nextElement.path.split('.').length == (currentPath.split('.').length + pathSplit.length) + 1) {
                        for (var x in current) {
                            var nextObj = current[x];

                            validateCardinality(nextElement, nextObj, element.path);
                        }
                    }
                }
            }
        }
    };

    self.Validate = function(jsObj, profile) {
        if (!profile) {
            // set base profile
            profile = findProfileByResourceType(jsObj.resourceType);
        }
        if (profile && profile.differential) {
            // append differential profile with base profile
            var baseProfile = findProfileByResourceType(jsObj.resourceType);
            baseProfile.snapshot.element.forEach(function (baseElement, i) {
                var matchElement = profile.differential.element.find(function (diffElement) {
                    return baseElement.path === diffElement.path
                })
                if (matchElement) {
                    baseProfile.snapshot.element[i] = matchElement
                }
            })

            profile = baseProfile
        }

        elements = profile && profile.snapshot ? profile.snapshot.element : null;
        result = {
            valid: true,
            errors: []
        };

        if (!profile) {
            throw 'No profile found for resource: ' + jsObj.resourceType;
        }

        if (!elements) {
            throw 'No snapshot/elements found for profile ' + profile.name;
        }

        for (var i in elements) {
            var element = elements[i];

            if (element.path == jsObj.resourceType || !element.path) {
                continue;
            }

            // Only call validateCardinality on the root level properties of the resource.
            // validateCardinality will be recursively called there-after.
            if (element.path.split('.').length == 2) {
                validateCardinality(element, jsObj, jsObj.resourceType);
            }
        }

        result.valid = result.errors.length == 0;
        return result;
    };
};
