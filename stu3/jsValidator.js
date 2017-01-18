/**
 * @class JsValidator
 * @memberof module:stu3
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

        for (var i in pathSplit) {
            var next = [];

            for (var x in current) {
                var currentEval = eval('current[x][\'' + pathSplit[i] + '\']');

                if (currentEval) {
                    if (currentEval instanceof Array) {
                        next = next.concat(currentEval);
                    } else if (currentEval || currentEval == false) {
                        next.push(currentEval);
                    }
                }
            }

            current = next;
        }

        if (current.length < element.definition.min) {
            result.errors.push('Element ' + element.path + ' does not meet the minimal cardinality of ' + element.definition.min + ' (actual: ' + current.length + ')');
        }

        if (current.length > (element.definition.max == '*' ? Number.MAX_SAFE_INTEGER : parseInt(element.definition.max))) {
            result.errors.push('Element ' + element.path + ' does not meet the maximum cardinality of ' + element.definition.max + ' (actual: ' + current.length + ')');
        }

        if (current.length > 0) {
            if (element.definition.type && element.definition.type.length == 1 && element.definition.type[0].code == 'Resource') {
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
            profile = findProfileByResourceType(jsObj.resourceType);
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

            if (element.path == jsObj.resourceType || !element.definition || !element.path) {
                continue;
            }

            // Only call validateCardinality on the first property of the resource. validateCardinality
            // will be recursively called there-after.
            if (element.path.split('.').length == 2) {
                validateCardinality(element, jsObj, jsObj.resourceType);
            }
        }

        result.valid = result.errors.length == 0;
        return result;
    };
};