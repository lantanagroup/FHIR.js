"use strict";
exports.__esModule = true;
var parseConformance_1 = require("./parseConformance");
var _ = require("underscore");
var FhirPath = (function () {
    function FhirPath(resources, parser) {
        this.operators = ['=', '!', '&', '<', '>', '~'];
        this.resources = resources instanceof Array ? resources : [resources];
        this.parser = parser ? parser : new parseConformance_1.ParseConformance(true);
    }
    FhirPath.prototype.findClosingParenIndex = function (string, startIndex) {
        var parenLevel = 0;
        for (var i = startIndex; i < string.length; i++) {
            if (string[i] === '(') {
                parenLevel++;
            }
            else if (string[i] === ')') {
                if (parenLevel > 0) {
                    parenLevel--;
                }
                else {
                    return i;
                }
            }
        }
    };
    FhirPath.prototype.findClosingQuoteIndex = function (string, startIndex) {
        for (var i = startIndex; i < string.length; i++) {
            if (string[i] === '\'') {
                if (string[i - 1] === '\\') {
                    continue;
                }
                return i;
            }
        }
    };
    FhirPath.prototype.internalResolve = function (reference) {
        var regex = /^([A-z]+)\/(.+?)$/;
        var match = reference.trim().match(regex);
        function find(resources, resourceType, id) {
            for (var i = 0; i < resources.length; i++) {
                var resource = resources[i];
                if (resource.resourceType === 'Bundle') {
                    var childResources = _.map(resource.entry, function (entry) {
                        return entry.resource;
                    });
                    var found = find(childResources, resourceType, id);
                    if (found) {
                        return found;
                    }
                }
                if (resource.resourceType.toLowerCase() !== resourceType.toLowerCase()) {
                    continue;
                }
                if (resource.id.toLowerCase() !== id.toLowerCase()) {
                    continue;
                }
                return resource;
            }
        }
        if (match) {
            var found = find(this.resources, match[1], match[2]);
            if (found) {
                return found;
            }
        }
        return this.resolve(reference);
    };
    FhirPath.prototype.resolve = function (reference) {
        return;
    };
    FhirPath.prototype.getResourceTypes = function () {
        var self = this;
        var keys = Object.keys(this.parser.parsedStructureDefinitions);
        return _.chain(keys)
            .filter(function (key) {
            return self.parser.parsedStructureDefinitions[key]._kind === 'resource';
        })
            .value();
    };
    FhirPath.prototype.parse = function (fhirPath) {
        var statements = [];
        var ns = {};
        var fhirPathSplit = fhirPath.split('.');
        var resourceTypes = this.getResourceTypes();
        if (fhirPathSplit.length > 0 && resourceTypes.indexOf(fhirPathSplit[0]) >= 0) {
            ns.resourceType = fhirPathSplit[0];
            fhirPath = fhirPath.substring(fhirPathSplit[0].length + 1);
        }
        for (var i = 0; i < fhirPath.length; i++) {
            var char = fhirPath[i];
            if (char === '\'') {
                if (i === 0) {
                    var closingQuoteIndex = this.findClosingQuoteIndex(fhirPath, i + 1);
                    ns.value = fhirPath.substring(i + 1, closingQuoteIndex);
                    i = closingQuoteIndex;
                }
            }
            else if (char === '(') {
                if (ns.path && ns.path.length > 0) {
                    var fn = {
                        name: ns.path.pop().toLowerCase()
                    };
                    ns.path.push(fn);
                    var closingParenIndex = this.findClosingParenIndex(fhirPath, i + 1);
                    var fnParams = fhirPath.substring(i + 1, closingParenIndex);
                    fn.params = this.parse(fnParams);
                    i = closingParenIndex;
                }
            }
            else if (char === '\'') {
            }
            else if (char === ' ') {
            }
            else if (this.operators.indexOf(char) >= 0) {
                var left = ns;
                var rightPath = fhirPath.substring(i + 1);
                var operator = char;
                if (this.operators.indexOf(rightPath[0]) >= 0) {
                    operator += rightPath[0];
                    rightPath = rightPath.substring(1);
                }
                ns = {
                    left: left,
                    right: this.parse(rightPath.trim())[0],
                    op: operator
                };
                if (ns.left.path && ns.left.path.length > 0) {
                    ns.left.path[ns.left.path.length - 1] = ns.left.path[ns.left.path.length - 1].trim();
                }
                if (ns.right.path && ns.right.path.length > 0) {
                    ns.right.path[ns.right.path.length - 1] = ns.right.path[ns.right.path.length - 1].trim();
                }
                break;
            }
            else if (char === '.') {
                ns.path.push('');
            }
            else {
                if (!ns.hasOwnProperty('path')) {
                    ns.path = [''];
                }
                ns.path[ns.path.length - 1] += char;
            }
        }
        statements.push(ns);
        return statements;
    };
    FhirPath.prototype.getValue = function (current, paths) {
        if (current === undefined || current == null) {
            return current;
        }
        if (!paths || paths.length === 0) {
            return current;
        }
        var nextPath = paths[0];
        var nextPaths = paths.slice(1);
        if (current instanceof Array) {
            if (typeof nextPath === 'string') {
                var ret = [];
                nextPaths.unshift(nextPath);
                for (var i = 0; i < current.length; i++) {
                    var currentRet = this.getValue(current[i], nextPaths);
                    if (currentRet instanceof Array) {
                        ret = ret.concat(currentRet);
                    }
                    else if (currentRet !== undefined && currentRet !== null) {
                        ret.push(currentRet);
                    }
                }
                return ret;
            }
            else if (nextPath.name === 'first') {
                return this.getValue(current[0], nextPaths);
            }
            else if (nextPath.name === 'last') {
                return this.getValue(current[current.length - 1], nextPaths);
            }
            else if (nextPath.name === 'where') {
                if (!nextPath.params || nextPath.params.length === 0) {
                    throw new Error('Expected .where() to have a parameter');
                }
                var filtered = [];
                for (var i = 0; i < current.length; i++) {
                    var paramsClone = JSON.parse(JSON.stringify(nextPath.params));
                    var results = this.internalEvaluate(current[i], paramsClone);
                    if (typeof results === 'boolean' && results === true) {
                        filtered.push(current[i]);
                    }
                    else if (results instanceof Array && results.length === 1 && results[0]) {
                        filtered.push(current[i]);
                    }
                }
                return this.getValue(filtered, nextPaths);
            }
            else {
                throw new Error('Unsupported function for arrays ' + nextPath.name);
            }
        }
        else {
            if (typeof nextPath === 'string') {
                return this.getValue(current[nextPath], nextPaths);
            }
            else if (nextPath.name === 'resolve') {
                var reference = typeof current === 'string' ? current : current.reference;
                var resource = this.internalResolve(reference);
                return this.getValue(resource, nextPaths);
            }
            else if (nextPath.name === 'startswith') {
                if (!nextPath.params || nextPath.params.length !== 1) {
                    throw new Error('Expected a single parameter to startsWith()');
                }
                if (typeof current !== 'string') {
                    throw new Error('startsWith() must be used on string types');
                }
                var paramValue = nextPath.params[0].value || this.getValue(current, nextPath.params[0].path);
                if (!paramValue || current.indexOf(paramValue) !== 0) {
                    return false;
                }
                return true;
            }
            else {
                throw new Error('Unsupported function for objects ' + nextPath.name);
            }
        }
    };
    FhirPath.prototype.internalEvaluate = function (resource, statements) {
        var ret = [];
        for (var i = 0; i < statements.length; i++) {
            var statement = statements[i];
            if (statement.path) {
                statement.value = this.getValue(resource, statement.path);
            }
            if (statement.left && statement.left.path) {
                statement.left.value = this.getValue(resource, statement.left.path);
            }
            if (statement.right && statement.right.path) {
                statement.right.value = this.getValue(resource, statement.right.path);
            }
            if (statement.op) {
                if (!statement.left || !statement.right) {
                    return false;
                }
                switch (statement.op) {
                    case '=':
                    case '==':
                        return statement.left.value === statement.right.value;
                    case '!=':
                        return statement.left.value !== statement.right.value;
                }
            }
            else {
                if (statement.value instanceof Array) {
                    ret = ret.concat(statement.value);
                }
                else {
                    ret.push(statement.value);
                }
            }
        }
        return ret;
    };
    FhirPath.prototype.shouldReturnArray = function (statements) {
        if (statements.length === 1) {
            var statementHasWhereFn = _.filter(statements[0].path, function (nextPath) {
                return nextPath.name === 'where';
            });
            if (statementHasWhereFn.length > 0) {
                return true;
            }
        }
        return false;
    };
    FhirPath.prototype.evaluate = function (fhirPath) {
        if (!fhirPath) {
            return;
        }
        var statements = this.parse(fhirPath);
        var ret = [];
        for (var r = 0; r < this.resources.length; r++) {
            var resource = this.resources[r];
            ret = ret.concat(this.internalEvaluate(resource, statements));
        }
        if (this.resources.length === 1 && ret.length === 1 && !this.shouldReturnArray(statements)) {
            return ret[0];
        }
        return ret;
    };
    return FhirPath;
}());
exports.FhirPath = FhirPath;
//# sourceMappingURL=fhirPath.js.map