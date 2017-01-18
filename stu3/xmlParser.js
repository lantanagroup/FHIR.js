var xml2js = require('xml2js');
var util = require('./util');
var _ = require('lodash');

module.exports = function(profiles, obj) {
    var self = this;
    var builder = new xml2js.Builder({explicitRoot: false, headless: true, rootName: 'div', renderOpts: { 'pretty': false }});
    var objRoot, objNs;
    var objNamespaces = {};
    
    var ATOM_NS = 'http://www.w3.org/2005/Atom';
    var FHIR_NS = 'http://hl7.org/fhir';
    var XHTML_NS = 'http://www.w3.org/1999/xhtml';

    // Get the root property from the obj
    for (var i in obj) {
        objRoot = obj[i];
        break;
    }

    if (!objRoot) {
        throw 'No root property found after parsing XML document';
    }

    if (objRoot['$']) {
        // Extract the namespaces
        for (var i in objRoot['$']) {
            if (i == 'xmlns') {
                objNs = objRoot['$'][i];
            } else if (i.indexOf('xmlns:') == 0) {
                objNamespaces[objRoot['$'][i]] = i.substring(6);
            }
        }
    }

    var formatIntegerCallback = function(value) {
        if (!value || typeof value != 'string') {
            return value;
        }

        try {
            var integerValue = parseInt(value);
            return integerValue;
        } catch (ex) {
            return value;
        }
    };

    var formatFloatCallback = function(value) {
        if (!value || typeof value != 'string') {
            return value;
        }

        try {
            var integerValue = parseFloat(value);
            return integerValue;
        } catch (ex) {
            return value;
        }
    };

    var getXmlValue = function(xmlObj, formatCallback) {
        var hasProperties = false;

        for (var i in xmlObj) {
            if (i == '$') {
                continue;
            }

            hasProperties = true;
            break;
        }

        if (xmlObj && xmlObj['$'] && xmlObj['$']['value'] && !hasProperties) {
            if (formatCallback) {
                return formatCallback(xmlObj['$']['value']);
            }

            return xmlObj['$']['value'];
        } else if (typeof xmlObj == 'string') {
            if (formatCallback) {
                return formatCallback(xmlObj);
            }

            return xmlObj;
        }
    };

    var populateXmlValue = function(obj, xmlObj, property, isArray, formatCallback) {
        var xmlObjProp = self.GetProperty(xmlObj, FHIR_NS, property);
        
        if (isArray) {
            if (xmlObjProp && xmlObjProp.length > 0) {
                obj[property] = [];

                for (var i in xmlObjProp) {
                    var value = getXmlValue(xmlObjProp[i]);

                    if (formatCallback) {
                        value = formatCallback(value);
                    }

                    obj[property].push(value);
                }
            }
        } else {
            if (xmlObjProp && xmlObjProp.length > 0) {
                var value = getXmlValue(xmlObjProp[0]);

                if (formatCallback) {
                    value = formatCallback(value);
                }

                obj[property] = value;
            }
        }
    };

    var parseXmlReference = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'display');
        populateXmlValue(obj, xmlObj, 'reference');

        if (obj.extension || obj.display || obj.reference) {
            return obj;
        }
    };

    var parseXmlCoding = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'system');
        populateXmlValue(obj, xmlObj, 'version');
        populateXmlValue(obj, xmlObj, 'code');
        populateXmlValue(obj, xmlObj, 'display');
        populateXmlValue(obj, xmlObj, 'primary');

        var valueSetProp = self.GetProperty(xmlObj, FHIR_NS, 'valueSet');
        if (valueSetProp && valueSetProp.length > 0) {
            obj.valueSet = parseXmlReference(valueSetProp[0]);
        }

        if (obj.extension || obj.system || obj.version || obj.code || obj.display || obj.primary || obj.valueSet) {
            return obj;
        }
    };

    var parseXmlIdentifier = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'use');
        populateXmlValue(obj, xmlObj, 'label');
        populateXmlValue(obj, xmlObj, 'system');
        populateXmlValue(obj, xmlObj, 'value');

        var assignerProp = self.GetProperty(xmlObj, FHIR_NS, 'assigner');
        if (assignerProp && assignerProp.length > 0) {
            obj.assigner = parseXmlReference(assignerProp[0]);
        }

        if (obj.extension || obj.use || obj.label || obj.system || obj.value || obj.assigner) {
            return obj;
        }
    };

    var parseXmlCodeableConcept = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        var codingProp = self.GetProperty(xmlObj, FHIR_NS, 'coding');
        if (codingProp && codingProp.length > 0) {
            obj.coding = [];

            for (var i in codingProp) {
                var coding = parseXmlCoding(codingProp[i]);
                obj.coding.push(coding);
            }
        }

        populateXmlValue(obj, xmlObj, 'text');

        if (obj.extension || obj.coding || obj.text) {
            return obj;
        }
    };

    var parseXmlPeriod = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'start');
        populateXmlValue(obj, xmlObj, 'end');

        if (obj.extension || obj.start || obj.end) {
            return obj;
        }
    };

    var parseXmlHumanName = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'use');
        populateXmlValue(obj, xmlObj, 'text');
        populateXmlValue(obj, xmlObj, 'family', true);
        populateXmlValue(obj, xmlObj, 'given', true);
        populateXmlValue(obj, xmlObj, 'prefix', true);
        populateXmlValue(obj, xmlObj, 'suffix', true);

        var periodProp = self.GetProperty(xmlObj, FHIR_NS, 'period');
        if (periodProp && periodProp.length > 0) {
            obj.period = parseXmlPeriod(periodProp[0]);
        }

        if (obj.extension || obj.use || obj.text || obj.family || obj.given || obj.prefix || obj.suffix) {
            return obj;
        }
    };

    var parseXmlExtension = function(xmlObj) {
        var obj = {};
        var foundValue;

        if (xmlObj['$'] && xmlObj['$'].url) {
            obj.url = xmlObj['$'].url;
        }

        for (var i in xmlObj) {
            if (i == '$' || i.length < 5 || xmlObj[i].length == 0) {
                continue;
            }

            var valueType = i.substring(5);
            obj[i] = self.ParseXmlDataType(valueType, xmlObj[i][0]);

            foundValue = true;
            break;      // Extensions can only have one value
        }

        if (obj.extension || obj.url || foundValue) {
            return obj;
        }
    };

    var populateXmlExtension = function(obj, xmlObj) {
        if (!xmlObj) {
            return;
        }
        
        var extensionProp = self.GetProperty(xmlObj, FHIR_NS, 'extension');
        if (extensionProp && extensionProp.length > 0) {
            obj.extension = [];

            for (var i in extensionProp) {
                var extension = parseXmlExtension(extensionProp[i]);
                obj.extension.push(extension);
            }
        }
        
        var modifierExtensionProp = self.GetProperty(xmlObj, FHIR_NS, 'modifierExtension');
        if (modifierExtensionProp && modifierExtensionProp.length > 0) {
            obj.modifierExtension = [];

            for (var i in modifierExtensionProp) {
                var extension = parseXmlExtension(modifierExtensionProp[i]);
                obj.modifierExtension.push(extension);
            }
        }
    };

    var parseXmlNarrative = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        var divProp = self.GetProperty(xmlObj, XHTML_NS, 'div');
        if (divProp && divProp.length > 0) {
            if (divProp[0]['$']) {
                delete divProp[0]['$'];
            }

            if (typeof divProp[0] == 'string') {
                obj.div = divProp[0];
            } else {
                var xml = builder.buildObject(divProp[0]);
                obj.div = xml;
            }
        }

        var statusProp = self.GetProperty(xmlObj, FHIR_NS, 'status');
        if (statusProp && statusProp.length > 0) {
            obj.status = getXmlValue(statusProp[0]);
        }

        if (obj.extension || obj.div || obj.status) {
            return obj;
        }
    };

    var parseXmlQuantity = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'value', undefined, formatFloatCallback);
        populateXmlValue(obj, xmlObj, 'comparator');
        populateXmlValue(obj, xmlObj, 'units');
        populateXmlValue(obj, xmlObj, 'system');
        populateXmlValue(obj, xmlObj, 'code');

        if (obj.extension || obj.value || obj.comparator || obj.units || obj.system || obj.code) {
            return obj;
        }
    };

    var parseXmlRatio = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        var numeratorProp = self.GetProperty(xmlObj, FHIR_NS, 'numerator');
        if (numeratorProp && numeratorProp.length > 0) {
            obj.numerator = parseXmlQuantity(numeratorProp[0]);
        }

        var denominatorProp = self.GetProperty(xmlObj, FHIR_NS, 'denominator');
        if (denominatorProp && denominatorProp.length > 0) {
            obj.denominator = parseXmlQuantity(denominatorProp[0]);
        }

        if (obj.extension || obj.numerator || obj.denominator) {
            return obj;
        }
    };

    var parseXmlRange = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'low');
        populateXmlValue(obj, xmlObj, 'high');

        if (obj.extension || obj.low || obj.high) {
            return obj;
        }
    };

    var parseXmlAttachment = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'contentType');
        populateXmlValue(obj, xmlObj, 'language');
        populateXmlValue(obj, xmlObj, 'data');
        populateXmlValue(obj, xmlObj, 'url');
        populateXmlValue(obj, xmlObj, 'size');
        populateXmlValue(obj, xmlObj, 'hash');
        populateXmlValue(obj, xmlObj, 'title');

        if (obj.extension || obj.contentType || obj.language || obj.data || obj.url || obj.size || obj.title) {
            return obj;
        }
    };

    var parseXmlAddress = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'use');
        populateXmlValue(obj, xmlObj, 'text');
        populateXmlValue(obj, xmlObj, 'line', true);
        populateXmlValue(obj, xmlObj, 'city');
        populateXmlValue(obj, xmlObj, 'state');
        populateXmlValue(obj, xmlObj, 'zip');
        populateXmlValue(obj, xmlObj, 'country');

        var periodProp = self.GetProperty(xmlObj, FHIR_NS, 'period');
        if (periodProp && periodProp.length > 0) {
            obj.period = parseXmlPeriod(periodProp[0]);
        }

        if (obj.extension || obj.use || obj.text || obj.line || obj.city || obj.state || obj.zip || obj.country || obj.period) {
            return obj;
        }
    };

    var parseXmlContactPoint = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'system');
        populateXmlValue(obj, xmlObj, 'value');
        populateXmlValue(obj, xmlObj, 'use');

        var periodProp = self.GetProperty(xmlObj, FHIR_NS, 'period');
        if (periodProp && periodProp.length > 0) {
            obj.period = parseXmlPeriod(periodProp[0]);
        }

        if (obj.extension || obj.system || obj.value || obj.use || obj.period) {
            return obj;
        }
    };

    var parseXmlSampledData = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'origin');
        populateXmlValue(obj, xmlObj, 'period', undefined, formatFloatCallback);
        populateXmlValue(obj, xmlObj, 'factor', undefined, formatFloatCallback);
        populateXmlValue(obj, xmlObj, 'lowerLimit', undefined, formatFloatCallback);
        populateXmlValue(obj, xmlObj, 'upperLimit', undefined, formatFloatCallback);
        populateXmlValue(obj, xmlObj, 'dimensions');
        populateXmlValue(obj, xmlObj, 'data');

        if (obj.extension || obj.origin || obj.period || obj.factor || obj.lowerLimit || obj.upperLimit || obj.dimensions || obj.data) {
            return obj;
        }
    };

    var parseXmlDosageInstruction = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        // sequence
        populateXmlValue(obj, xmlObj, 'sequence');

        // text
        populateXmlValue(obj, xmlObj, 'text');

        // additionalInstructions 0..*
        if (xmlObj.additionalInstructions && xmlObj.additionalInstructions.length > 0) {
            obj.additionalInstructions = [];
            _.forEach(xmlObj.additionalInstructions, function(additionalInstructions) {
                obj.additionalInstructions.push(parseXmlCodeableConcept(additionalInstructions));
            });
        }

        // timing
        if (xmlObj.timing && xmlObj.timing.length == 1) {
            obj.timing = parseXmlTiming(xmlObj.timing[0]);
        }

        // asNeededBoolean
        populateXmlValue(obj, xmlObj, 'asNeededBoolean');

        // asNeededCodeableConcept
        if (xmlObj.asNeededCodeableConcept && xmlObj.asNeededCodeableConcept.length == 1) {
            obj.asNeededCodeableConcept = parseXmlCodeableConcept(xmlObj.asNeededCodeableConcept[0]);
        }

        // site
        if (xmlObj.site && xmlObj.site.length == 1) {
            obj.site = parseXmlCodeableConcept(xmlObj.site[0]);
        }

        // route
        if (xmlObj.route && xmlObj.route.length == 1) {
            obj.route = parseXmlCodeableConcept(xmlObj.route[0]);
        }

        // method
        if (xmlObj.method && xmlObj.method.length == 1) {
            obj.method = parseXmlCodeableConcept(xmlObj.method[0]);
        }

        // dose[x]
        if (xmlObj.doseRange && xmlObj.doseRange.length == 1) {
            obj.doseRange = parseXmlRange(xmlObj.doseRange[0]);
        } else if (xmlObj.doseQuantity && xmlObj.doseQuantity.length == 1) {
            obj.doseQuantity = parseXmlQuantity(xmlObj.doseQuantity[0]);
        }

        // maxDosePerPeriod
        if (xmlObj.maxDosePerPeriod && xmlObj.maxDosePerPeriod.length == 1) {
            obj.maxDosePerPeriod = parseXmlPeriod(xmlObj.maxDosePerPeriod[0]);
        }

        // maxDosePerAdministration
        if (xmlObj.maxDosePerAdministration && xmlObj.maxDosePerAdministration.length == 1) {
            obj.maxDosePerAdministration = parseXmlPeriod(xmlObj.maxDosePerAdministration[0]);
        }

        // maxDosePerLifetime
        if (xmlObj.maxDosePerLifetime && xmlObj.maxDosePerLifetime.length == 1) {
            obj.maxDosePerLifetime = parseXmlPeriod(xmlObj.maxDosePerLifetime[0]);
        }

        // rate[x]
        if (xmlObj.rateRatio && xmlObj.rateRatio.length == 1) {
            obj.rateRatio = parseXmlRatio(xmlObj.rateRatio[0]);
        } else if (xmlObj.rateRange && xmlObj.rateRange.length == 1) {
            obj.rateRange = parseXmlRange(xmlObj.rateRange[0]);
        } else if (xmlObj.rateQuantity && xmlObj.rateQuantity.length == 1) {
            obj.rateQuantity = parseXmlQuantity(xmlObj.rateQuantity[0]);
        }

        if (obj.extension || obj.sequence || obj.text || obj.additionalInstructions || obj.timing || obj.hasOwnProperty('asNeededBoolean') || obj.asNeededCodeableConcept || obj.site || obj.route || obj.method || obj.doseRange || obj.doseQuantity || obj.maxDosePerPeriod || obj.maxDosePerAdministration || obj.maxDosePerLifetime || obj.rateRatio || obj.rateRange || obj.rateQuantity) {
            return obj;
        }
    };

    var parseXmlMeta = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'versionId');
        populateXmlValue(obj, xmlObj, 'lastUpdated');

        _.forEach(xmlObj.profile, function(profile) {
            populateXmlValue(obj, profile, 'profile');
        });

        if (xmlObj.security && xmlObj.security.length > 0) {
            obj.security = [];

            _.forEach(xmlObj.security, function(security) {
                obj.security.push(parseXmlCoding(security));
            });
        }

        if (xmlObj.tag && xmlObj.tag.length > 0) {
            obj.tag = [];

            _.forEach(xmlObj.tag, function(tag) {
                obj.tag.push(parseXmlCoding(tag));
            });
        }

        if (obj.extension || obj.versionId || obj.lastUpdated || obj.profile || obj.security || obj.tag) {
            return obj;
        }
    };

    var parseXmlTiming = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'event', true);

        if (xmlObj.repeat && xmlObj.repeat.length == 1) {
            obj.repeat = {};

            if (xmlObj.repeat[0].boundsQuantity && xmlObj.repeat[0].boundsQuantity.length == 1) {
                obj.repeat.boundsQuantity = parseXmlQuantity(xmlObj.boundsQuantity[0]);
            } else if (xmlObj.repeat[0].boundsRange && xmlObj.repeat[0].boundsRange.length == 1) {
                obj.repeat.boundsRange = parseXmlRange(xmlObj.boundsRange[0]);
            } else if (xmlObj.repeat[0].boundsPeriod && xmlObj.repeat[0].boundsPeriod.length == 1) {
                obj.repeat.boundsPeriod = parseXmlPeriod(xmlObj.boundsPeriod[0]);
            }

            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'count', undefined, formatIntegerCallback);
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'duration', undefined, formatFloatCallback);
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'durationMax', undefined, formatFloatCallback);
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'durationUnits');
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'frequency', undefined, formatIntegerCallback);
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'frequencyMax', undefined, formatIntegerCallback);
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'period', undefined, formatFloatCallback);
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'periodMax', undefined, formatFloatCallback);
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'periodUnits');
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'when');
        }

        if (xmlObj.code && xmlObj.code.length == 1) {
            obj.code = parseXmlCodeableConcept(xmlObj.code[0]);
        }

        if (obj.extension || obj.event || obj.repeat || obj.code) {
            return obj;
        }
    };

    var parseXmlSignature = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        if (xmlObj.type && xmlObj.type.length > 0) {
            obj.type = [];

            _.forEach(xmlObj.type, function(type) {
                obj.type.push(parseXmlCoding(type));
            });
        }

        populateXmlValue(obj, xmlObj, 'when');
        populateXmlValue(obj, xmlObj, 'whoUri');

        if (xmlObj.whoReference && xmlObj.whoReference.length == 1) {
            obj.whoReference = parseXmlReference(xmlObj.whoReference[0]);
        }

        populateXmlValue(obj, xmlObj, 'contentType');
        populateXmlValue(obj, xmlObj, 'blob');

        if (obj.extension || obj.type || obj.when || obj.whoUri || obj.whoReference || obj.contentType || obj.blob) {
            return obj;
        }
    };

    var parseXmlAnnotation = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        populateXmlValue(obj, xmlObj, 'authorReference');
        populateXmlValue(obj, xmlObj, 'authorString');
        populateXmlValue(obj, xmlObj, 'time');
        populateXmlValue(obj, xmlObj, 'text');

        if (obj.extension || obj.authorReference || obj.authorString || obj.time || obj.text) {
            return obj;
        }
    };

    var parseXmlResource = function(xmlObj) {
        var obj = {};

        for (var i in xmlObj) {
            if (xmlObj[i].length > 0) {
                obj.resourceType = i;
                obj = self.PopulateFromXmlObject(obj, xmlObj[i][0], i);
                break;
            }
        }

        return obj;
    };

    self.GetProperty = function(obj, ns, propertyName) {
        if (!obj) {
            return;
        }

        /* Code to make sure prefixes match. Now stripping prefixes, though... so no need. Keeping code around in case namespaces are needed in future
        var nsPrefix = '';

        if (ns != objNs && !obj[propertyName]) {
            if (!objNamespaces[ns]) {
                throw 'Namespace not found in XML document: ' + ns;
            }
            
            nsPrefix = objNamespaces[ns] + ':';
        } else if (obj[propertyName] && obj[propertyName]['$']) {
            if (obj[propertyName]['$']['xmlns'] && obj[propertyName]['$']['xmlns'] != ns) {
                throw 'Property found does not have a matching xmlns (expected: ' + ns + ', got ' + obj[propertyName]['$']['xmlns']
            }
        }
         
        return obj[nsPrefix + propertyName];
        */

        return obj[propertyName];
    };

    self.ParseXmlDataType = function(elementOrType, currentXmlObj) {
        var type = typeof elementOrType == 'string' ?
            elementOrType :
            (elementOrType && elementOrType.type && elementOrType.type.length >= 1 ? elementOrType.type[0].code : null);

        if (type) {
            if (type.toLowerCase() == 'boolean') {
                var value = getXmlValue(currentXmlObj);

                if (!value) {
                    return;
                }

                return value.toLowerCase() == 'true';
            }

            if (type.toLowerCase() == 'decimal') {
                var value = getXmlValue(currentXmlObj);

                try {
                    return parseFloat(value);
                } catch (ex) {
                    return;
                }
            }

            if (type.toLowerCase() == 'integer' || type.toLowerCase() == 'positiveInt') {
                var value = getXmlValue(currentXmlObj);

                try {
                    return parseInt(value);
                } catch (ex) {
                    return;
                }
            }

            if (util.IsPrimitive(type)) {
                return getXmlValue(currentXmlObj);
            }

            switch (type) {
                case 'CodeableConcept':
                    return parseXmlCodeableConcept(currentXmlObj);
                case 'Coding':
                    return parseXmlCoding(currentXmlObj);
                case 'Identifier':
                    return parseXmlIdentifier(currentXmlObj);
                case 'Reference':
                    return parseXmlReference(currentXmlObj);
                case 'Period':
                    return parseXmlPeriod(currentXmlObj);
                case 'HumanName':
                    return parseXmlHumanName(currentXmlObj);
                case 'extension':
                case 'Extension':
                    return parseXmlExtension(currentXmlObj);
                case 'Narrative':
                    return parseXmlNarrative(currentXmlObj);
                case 'Quantity':
                case 'Age':
                case 'Distance':
                case 'Duration':
                case 'Count':
                case 'Money':
                    return parseXmlQuantity(currentXmlObj);
                case 'Ratio':
                    return parseXmlRatio(currentXmlObj);
                case 'Range':
                    return parseXmlRange(currentXmlObj);
                case 'Attachment':
                    return parseXmlAttachment(currentXmlObj);
                case 'Address':
                    return parseXmlAddress(currentXmlObj);
                case 'ContactPoint':
                    return parseXmlContactPoint(currentXmlObj);
                case 'SampledData':
                    return parseXmlSampledData(currentXmlObj);
                case 'Timing':
                    return parseXmlTiming(currentXmlObj);
                case 'Resource':
                    return parseXmlResource(currentXmlObj);
                case 'Meta':
                    return parseXmlMeta(currentXmlObj);
                case 'Signature':
                    return parseXmlSignature(currentXmlObj);
                case 'BackboneElement':
                case 'ElementDefinition':
                    // TODO: Parse the core properties supported by these data-types
                    return;
                case 'DosageInstruction':
                    return parseXmlDosageInstruction(currentXmlObj);
                case 'Annotation':
                    return parseXmlAnnotation(currentXmlObj);
                default:
                    throw 'Unexpected data-type: ' + type;
            }
        }
    };

    self.PopulateFromXmlObject = function(currentJSObj, currentXmlObj, elementPath) {
        // Parse attributes
        if (currentXmlObj['$']) {
            for (var i in currentXmlObj['$']) {
                if (i == 'xmlns') {
                    continue;
                }

                currentJSObj['_' + i.toString()] = currentXmlObj['$'][i];
            }
        }

        var hasOtherProperties = false;

        for (var i in currentXmlObj) {
            if (i == '$' || currentXmlObj[i].length == 0) {
                continue;
            }

            var localName = i;

            if (localName.indexOf(':') > 0) {
                localName = localName.substring(localName.indexOf(':') + 1);
            }

            var nextElementPath = elementPath + '.' + localName;
            var element = util.FindElement(nextElementPath, profiles, 2);

            if (!element) {
                continue;
            }

            if (element.max == '*') {
                currentJSObj[localName] = [];

                for (var x in currentXmlObj[i]) {
                    var dataTypeValue = self.ParseXmlDataType(element, currentXmlObj[i][x]);

                    if (dataTypeValue) {
                        currentJSObj[localName].push(dataTypeValue);
                    } else {
                        var nextXmlObj = self.PopulateFromXmlObject({}, currentXmlObj[i][x], nextElementPath);
                        currentJSObj[localName].push(nextXmlObj);
                    }
                }
            } else {
                var dataTypeValue = self.ParseXmlDataType(element, currentXmlObj[i][0]);

                if (dataTypeValue) {
                    currentJSObj[localName] = dataTypeValue;
                } else {
                    currentJSObj[localName] = self.PopulateFromXmlObject({}, currentXmlObj[i][0], nextElementPath);
                }
            }

            hasOtherProperties = true;
        }

        if (!hasOtherProperties && currentJSObj['_value']) {
            currentJSObj = currentJSObj['_value'];
        }

        return currentJSObj;
    };
};