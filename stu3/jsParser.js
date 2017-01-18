var util = require('./util');
var xmlBuilder = require('xmlbuilder');
var _ = require('lodash');

/**
 * @class JsParser
 * @memberof module:stu3
 * @param profiles
 */
var JsParser = function(profiles) {
    var self = this;

    /**
     * Creates a plain string/boolean/date-time/etc. property on the specified node using obj as the value.
     * @method buildPrimitive
     * @memberof module:stu3.JsParser
     * @private
     * @instance
     * @param node The destination node that the property should be created on
     * @param obj The source object/value that the property should be taken from
     * @param name The name of the property to create on the node
     */
    var buildPrimitive = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var value = obj;

        if (typeof value == 'string') {
            value = value.replace(/&/g, '&amp;');
        }

        var primitiveNode = node.ele(name);
        primitiveNode.att('value', value);
    };

    /**
     * Creates a plain string/boolnea/date-time/etc. property on the specified node, using the named property on the obj
     * @method buildPrimitiveProperty
     * @memberof module:stu3.JsParser
     * @private
     * @instance
     * @param node The destination node that the property should be created on
     * @param obj The object that contains the specified property (by name), whose value should be used to create the destination property
     * @param name The name of the property to create on the node, and the name of the property to read on the obj
     */
    var buildPrimitiveProperty = function(node, obj, name) {
        if (!obj[name]) {
            return;
        }

        buildPrimitive(node, obj[name], name);
    };

    var buildArray = function(node, obj, name, builder) {
        if (obj && obj.length > 0) {
            for (var i in obj) {
                builder(node, obj[i], name);
            }
        }
    };

    var buildExtension = function(node, obj, name) {
        var extensionNode = node.ele(name);

        // url
        if (obj.url) {
            extensionNode.att('url', obj.url);
        }

        // Loop through all properties on the object so we can determine which value[x] type should be created
        for (var i in obj) {
            if (i == 'url') {       // Ignore url since we handled it above
                continue;
            }

            // Determine what the 'x' is in value[x] and if it is a primitive type
            var valueElementType = i.length > 5 ? i.substring(5) : '';
            var isPrimitive = util.IsPrimitive(valueElementType);

            // If it's a primitive type then just create a primitive property out of it
            if (isPrimitive) {
                buildPrimitive(extensionNode, obj[i], i);
                continue;
            }

            var builder = null;

            // It's not a primitive type, need to determine which builder function to use for the type
            switch (i) {
                case 'valueCode':
                    builder = buildPrimitive;
                    break;
                case 'valueCoding':
                    builder = buildCoding;
                    break;
                case 'valueCodeableConcept':
                    builder = buildCodeableConcept;
                    break;
                case 'valueAttachment':
                    builder = buildAttachment;
                    break;
                case 'valueIdentifier':
                    builder = buildIdentifier;
                    break;
                case 'valueQuantity':
                    builder = buildQuantity;
                    break;
                case 'valueRange':
                    builder = buildRange;
                    break;
                case 'valuePeriod':
                    builder = buildPeriod;
                    break;
                case 'valueRatio':
                    builder = buildRatio;
                    break;
                case 'valueHumanName':
                    builder = buildHumanName;
                    break;
                case 'valueAddress':
                    builder = buildAddress;
                    break;
                case 'valueReference':
                    builder = buildReference;
                    break;
                case 'valueSchedule':
                    builder = buildSchedule;
                    break;
                default:
                    throw 'Unexpected extension value type: ' + i;
            }

            builder(extensionNode, obj[i], i);
        }
    };

    var buildExtensionProperty = function(node, obj) {
        if (!obj || !obj.extension || obj.extension.length == 0) {
            return;
        }

        buildExtension(node, obj.extension, 'extension');
    };

    var buildReference = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildPrimitiveProperty(newNode, obj, 'reference');
        buildPrimitiveProperty(newNode, obj, 'display');
    };

    var buildCoding = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildPrimitiveProperty(newNode, obj, 'system');
        buildPrimitiveProperty(newNode, obj, 'version');
        buildPrimitiveProperty(newNode, obj, 'code');
        buildPrimitiveProperty(newNode, obj, 'display');

        // DSTU2 removed "primary" and added "userSelected"
        buildPrimitiveProperty(newNode, obj, 'userSelected');

        buildReference(newNode, obj.valueSet, 'valueSet');
    };

    var buildCodeableConcept = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        if (obj.coding && obj.coding.length > 0) {
            for (var i in obj.coding) {
                buildCoding(newNode, obj.coding[0], 'coding');
            }
        }

        buildPrimitiveProperty(newNode, obj, 'text');
    };

    var buildPeriod = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildPrimitiveProperty(newNode, obj, 'start');
        buildPrimitiveProperty(newNode, obj, 'end');
    };

    var buildIdentifier = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildPrimitiveProperty(newNode, obj, 'use');
        buildCodeableConcept(newNode, obj.type, 'type');
        buildPrimitiveProperty(newNode, obj, 'system');
        buildPrimitiveProperty(newNode, obj, 'value');

        buildPeriod(newNode, obj.period, 'period');

        buildReference(newNode, obj.assigner, 'assigner');
    };

    var buildNarrative = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildPrimitiveProperty(newNode, obj, 'status');

        var divValue = obj.div;

        if (divValue) {
            if (typeof divValue == 'string') {
                divValue = divValue.replace(/&/g, '&amp;');
            }

            var childDiv = newNode.ele('div');
            childDiv.att('xmlns', 'http://www.w3.org/1999/xhtml');
            childDiv.raw(divValue);
        }
    };

    var buildHumanName = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildPrimitiveProperty(newNode, obj, 'use');
        buildPrimitiveProperty(newNode, obj, 'text');
        buildPrimitiveProperty(newNode, obj, 'family');
        buildArray(newNode, obj.given, 'given', buildPrimitive);
        buildArray(newNode, obj.prefix, 'prefix', buildPrimitive);
        buildArray(newNode, obj.suffix, 'suffix', buildPrimitive);
        buildPeriod(newNode, obj.period, 'period');
    };

    var buildAttachment = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildPrimitiveProperty(newNode, obj, 'contentType');
        buildPrimitiveProperty(newNode, obj, 'language');
        buildPrimitiveProperty(newNode, obj, 'data');
        buildPrimitiveProperty(newNode, obj, 'url');
        buildPrimitiveProperty(newNode, obj, 'size');
        buildPrimitiveProperty(newNode, obj, 'hash');
        buildPrimitiveProperty(newNode, obj, 'title');
        buildPrimitiveProperty(newNode, obj, 'creation');
    };

    var buildResource = function(node, obj, name) {
        if (!obj) {
            return;
        }

        if (!obj.resourceType) {
            throw 'Embedded resource does not have resourceType';
        }

        var newNode = node.ele(name);

        var resourceType = obj.resourceType;
        var resourceNode = newNode.ele(resourceType);
        resourceNode.att('xmlns', 'http://hl7.org/fhir');

        delete obj.resourceType;

        buildObject(resourceNode, obj, resourceType);
    };

    var buildQuantity = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildPrimitiveProperty(newNode, obj, 'value');
        buildPrimitiveProperty(newNode, obj, 'comparator');
        buildPrimitiveProperty(newNode, obj, 'unit');           // DSTU2 changed "units" to "unit"
        buildPrimitiveProperty(newNode, obj, 'system');
        buildPrimitiveProperty(newNode, obj, 'code');
    };

    var buildRange = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildQuantity(newNode, obj.low, 'low');
        buildQuantity(newNode, obj.high, 'high');
    };

    var buildRatio = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildQuantity(newNode, obj.numerator, 'numerator');
        buildQuantity(newNode, obj.denominator, 'denominator');
    };

    var buildAddress = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildPrimitiveProperty(newNode, obj, 'use');
        buildPrimitiveProperty(newNode, obj, 'type');
        buildPrimitiveProperty(newNode, obj, 'text');
        buildArray(newNode, obj.line, 'line', buildPrimitive);
        buildPrimitiveProperty(newNode, obj, 'city');
        buildPrimitiveProperty(newNode, obj, 'district');
        buildPrimitiveProperty(newNode, obj, 'state');
        buildPrimitiveProperty(newNode, obj, 'postalCode');         // DSTU2 changed "zip" to "postalCode"
        buildPrimitiveProperty(newNode, obj, 'country');
        buildQuantity(newNode, obj.period, 'period');
    };

    var buildContactPoint = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildPrimitiveProperty(newNode, obj, 'system');
        buildPrimitiveProperty(newNode, obj, 'value');
        buildPrimitiveProperty(newNode, obj, 'use');
        buildPrimitiveProperty(newNode, obj, 'rank');
        buildQuantity(newNode, obj.period, 'period');
    };

    var buildTiming = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        _.forEach(obj.event, function(event) {
            buildPrimitive(newNode, event, 'event');
        });

        if (obj.repeat) {
            var repeatNode = newNode.ele('repeat');

            if (obj.repeat.boundsDuration) {
                buildQuantity(repeatNode, obj.repeat.boundsDuration, 'boundsDuration');
            } else if (obj.repeat.boundsRange) {
                buildRange(repeatNode, obj.repeat.boundsRange, 'boundsRange');
            } else if (obj.repeat.boundsPeriod) {
                buildPeriod(repeatNode, obj.repeat.boundsPeriod, 'boundsPeriod');
            }

            buildPrimitiveProperty(repeatNode, obj.repeat, 'count');
            buildPrimitiveProperty(repeatNode, obj.repeat, 'countMax');
            buildPrimitiveProperty(repeatNode, obj.repeat, 'duration');
            buildPrimitiveProperty(repeatNode, obj.repeat, 'durationMax');
            buildPrimitiveProperty(repeatNode, obj.repeat, 'durationUnit');
            buildPrimitiveProperty(repeatNode, obj.repeat, 'frequency');
            buildPrimitiveProperty(repeatNode, obj.repeat, 'frequencyMax');
            buildPrimitiveProperty(repeatNode, obj.repeat, 'period');
            buildPrimitiveProperty(repeatNode, obj.repeat, 'periodMax');
            buildPrimitiveProperty(repeatNode, obj.repeat, 'periodUnit');
            buildPrimitiveProperty(repeatNode, obj.repeat, 'dayOfWeek');
            buildPrimitiveProperty(repeatNode, obj.repeat, 'timeOfDay');
            buildPrimitiveProperty(repeatNode, obj.repeat, 'when');
            buildPrimitiveProperty(repeatNode, obj.repeat, 'offset');
        }

        buildCodeableConcept(newNode, obj.code, 'code');
    };

    var buildSignature = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        _.forEach(obj.type, function(type) {
            buildCoding(newNode, type, 'type');
        });

        buildPrimitive(newNode, obj.when, 'when');

        if (obj.whoUri) {
            buildPrimitive(newNode, obj.whoUri, 'whoUri');
        } else if (obj.whoReference) {
            buildReference(newNode, obj.whoReference, 'whoReference');
        }

        if (obj.onBehalfOfUri) {
            buildPrimitive(newNode, obj.onBehalfOfUri, 'onBehalfOfUri');
        } else if (obj.onBehalfOfReference) {
            buildReference(newNode, obj.onBehalfOfReference, 'onBehalfOfReference');
        }

        buildPrimitive(newNode, obj.contentType, 'contentType');
        buildPrimitive(newNode, obj.blob, 'blob');
    };

    var buildSampledData = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildQuantity(newNode, obj.origin, 'origin');

        buildPrimitiveProperty(newNode, obj, 'period');
        buildPrimitiveProperty(newNode, obj, 'factor');
        buildPrimitiveProperty(newNode, obj, 'lowerLimit');
        buildPrimitiveProperty(newNode, obj, 'upperLimit');
        buildPrimitiveProperty(newNode, obj, 'dimensions');
        buildPrimitiveProperty(newNode, obj, 'data');
    };

    var buildAnnotation = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildPrimitiveProperty(newNode, obj, 'authorReference');
        buildPrimitiveProperty(newNode, obj, 'authorString');
        buildPrimitiveProperty(newNode, obj, 'time');
        buildPrimitiveProperty(newNode, obj, 'text');
    };

    var buildMeta = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildExtensionProperty(newNode, obj);

        buildPrimitiveProperty(newNode, obj, 'versionId');
        buildPrimitiveProperty(newNode, obj, 'lastUpdated');
        buildArray(newNode, obj.profile, 'profile', buildPrimitiveProperty);
        buildArray(newNode, obj.security, 'security', buildCoding);
        buildArray(newNode, obj.tag, 'tag', buildCoding);
    };

    var buildDosageInstruction = function(node, obj, name) {
        if (!obj) {
            return;
        }

        var newNode = node.ele(name);

        buildPrimitive(newNode, obj.sequence, 'sequence');
        buildPrimitive(newNode, obj.text, 'text');

        _.forEach(obj.additionalInstructions, function(additionalInstructions) {
            buildCodeableConcept(newNode, additionalInstructions, 'additionalInstructions');
        });

        buildTiming(newNode, obj.timing, 'timing');

        if (obj.hasOwnProperty('asNeededBoolean')) {
            buildPrimitive(newNode, obj.asNeededBoolean, 'asNeededBoolean');
        } else if (obj.asNeededCodeableConcept) {
            buildCodeableConcept(newNode, obj.asNeededCodeableConcept, 'asNeededCodeableConcept');
        }

        buildCodeableConcept(newNode, obj.site, 'site');
        buildCodeableConcept(newNode, obj.route, 'route');
        buildCodeableConcept(newNode, obj.method, 'method');

        if (obj.doseRange) {
            buildRange(newNode, obj.doseRange, 'doseRange');
        } else if (obj.doseQuantity) {
            buildQuantity(newNode, obj.doseQuantity, 'doseQuantity');
        }

        buildRatio(newNode, obj.maxDosePerPeriod, 'maxDosePerPeriod');
        buildQuantity(newNode, obj.maxDosePerAdministration, 'maxDosePerAdministration');
        buildQuantity(newNode, obj.maxDosePerLifetime, 'maxDosePerLifetime');

        if (obj.rateRatio) {
            buildRatio(newNode, obj.rateRatio, 'rateRatio');
        } else if (obj.rateRange) {
            buildRange(newNode, obj.rateRange, 'rateRange');
        } else if (obj.rateQuantity) {
            buildQuantity(newNode, obj.rateQuantity, 'rateQuantity');
        }
    };

    var getChildElements = function(elementPath) {
        var elementPathSplit = elementPath.split('.');
        var profile;

        for (var i in profiles) {
            if (i.toLowerCase() == elementPathSplit[0].toLowerCase()) {
                profile = profiles[i];
                break;
            }
        }

        if (!profile) {
            return [];
        }

        if (!profile.snapshot) {
            throw 'No snapshot defined for profile ' + elementPathSplit[0];
        }

        var childElements = [];
        var regex = new RegExp('^' + elementPath + '\.([A-z\\[\\]0-9]*)$');

        for (var i in profile.snapshot.element) {
            var element = profile.snapshot.element[i];

            if (!regex.test(element.path)) {
                continue;
            }

            var regexResult = regex.exec(element.path);

            childElements.push(regexResult[1]);
        }

        return childElements;
    };

    var findObjectProperty = function(obj, propertyName) {
        if (!propertyName) {
            return;
        }

        if (propertyName.indexOf('[x]') == propertyName.length - 3) {
            for (var i in util.ChoiceTypes) {
                var nextPropertyName = propertyName.replace('[x]', util.ChoiceTypes[i]);

                if (obj[nextPropertyName]) {
                    return nextPropertyName;
                }
            }
        }

        return propertyName;
    };

    var buildObject = function(node, obj, elementPath) {
        var childElements = getChildElements(elementPath);

        // Loop through each child element in order
        for (var i in childElements) {
            var propertyName = findObjectProperty(obj, childElements[i]);

            if (!obj[propertyName]) {
                continue;
            }

            var nextElementPath = elementPath + '.' + propertyName;
            var element = util.FindElement(nextElementPath, profiles, 2);
            var elementType = element && element && element.type && element.type.length > 0 ? element.type[0].code : null;

            if (util.ChoiceElements[propertyName]) {
                elementType = util.ChoiceElements[propertyName];
            }

            var isPrimitive = util.IsPrimitive(elementType);

            if (isPrimitive) {
                buildPrimitive(node, obj[propertyName], propertyName);
                continue;
            }

            var buildFunction = null;

            switch (elementType) {
                case 'extension':
                case 'Extension':
                    buildFunction = buildExtension;
                    break;
                case 'Coding':
                    buildFunction = buildCoding;
                    break;
                case 'CodeableConcept':
                    buildFunction = buildCodeableConcept;
                    break;
                case 'Identifier':
                    buildFunction = buildIdentifier;
                    break;
                case 'Reference':
                    buildFunction = buildReference;
                    break;
                case 'Period':
                    buildFunction = buildPeriod;
                    break;
                case 'Narrative':
                    buildFunction = buildNarrative;
                    break;
                case 'HumanName':
                    buildFunction = buildHumanName;
                    break;
                case 'Attachment':
                    buildFunction = buildAttachment;
                    break;
                case 'Resource':
                    buildFunction = buildResource;
                    break;
                case 'Quantity':
                case 'Age':
                case 'Distance':
                case 'Duration':
                case 'Count':
                case 'Money':
                    buildFunction = buildQuantity;
                    break;
                case 'Range':
                    buildFunction = buildRange;
                    break;
                case 'Ratio':
                    buildFunction = buildRatio;
                    break;
                case 'Address':
                    buildFunction = buildAddress;
                    break;
                case 'ContactPoint':
                    buildFunction = buildContactPoint;
                    break;
                case 'SampledData':
                    buildFunction = buildSampledData;
                    break;
                case 'Resource':
                    buildFunction = buildResource;
                    break;
                case 'Meta':
                    buildFunction = buildMeta;
                    break;
                case 'Timing':
                    buildFunction = buildTiming;
                    break;
                case 'Signature':
                    buildFunction = buildSignature;
                    break;
                case 'BackboneElement':
                case 'ElementDefinition':
                    // TODO: Parse the core properties supported by these data-types
                    break;
                case 'DosageInstruction':
                    buildFunction = buildDosageInstruction;
                    break;
                case 'Annotation':
                    buildFunction = buildAnnotation;
                    break;
                default:
                    if (elementType) {
                        throw 'Type not recognized: ' + elementType;
                    }
            }

            if (buildFunction) {
                if (obj[propertyName] instanceof Array) {
                    for (var x in obj[propertyName]) {
                        buildFunction(node, obj[propertyName][x], propertyName);
                    }
                } else {
                    buildFunction(node, obj[propertyName], propertyName);
                }
            } else {
                if (obj[propertyName] instanceof Array) {
                    for (var x in obj[propertyName]) {
                        var childNode = node.ele(propertyName);
                        buildObject(childNode, obj[propertyName][x], nextElementPath);
                    }
                } else if (typeof obj[propertyName] == 'object') {
                    var childNode = node.ele(propertyName);
                    buildObject(childNode, obj[propertyName], nextElementPath);
                }
            }
        }

        for (var i in obj) {
            if (i.toString().indexOf('_') == 0 && obj[i] && typeof obj[i] != 'object') {
                node.att(i.substring(1), obj[i]);
            }
        }
    };

    self.CreateXml = function(jsObj) {
        var copy = JSON.parse(JSON.stringify(jsObj));
        var doc = xmlBuilder.create(jsObj.resourceType);
        doc.att('xmlns', 'http://hl7.org/fhir');

        delete copy.resourceType;

        buildObject(doc, copy, jsObj.resourceType);

        var xml = doc.end({ pretty: true });

        return xml;
    };
};

module.exports = JsParser;