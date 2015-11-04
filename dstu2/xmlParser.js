var xml2js = require('xml2js');
var util = require('./util');

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

    var getXmlValue = function(xmlObj) {
        var hasProperties = false;

        for (var i in xmlObj) {
            if (i == '$') {
                continue;
            }

            hasProperties = true;
            break;
        }

        if (xmlObj && xmlObj['$'] && xmlObj['$']['value'] && !hasProperties) {
            return xmlObj['$']['value'];
        }
    };

    var populateXmlValue = function(obj, xmlObj, property, isArray) {
        var xmlObjProp = self.GetProperty(xmlObj, FHIR_NS, property);
        
        if (isArray) {
            if (xmlObjProp && xmlObjProp.length > 0) {
                obj[property] = [];

                for (var i in xmlObjProp) {
                    var value = getXmlValue(xmlObjProp[i]);
                    obj[property].push(value);
                }
            }
        } else {
            if (xmlObjProp && xmlObjProp.length > 0) {
                obj[property] = getXmlValue(xmlObjProp[0]);
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

        populateXmlValue(obj, xmlObj, 'value');
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

    var parseXmlContact = function(xmlObj) {
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
        populateXmlValue(obj, xmlObj, 'period');
        populateXmlValue(obj, xmlObj, 'factor');
        populateXmlValue(obj, xmlObj, 'lowerLimit');
        populateXmlValue(obj, xmlObj, 'upperLimit');
        populateXmlValue(obj, xmlObj, 'dimensions');
        populateXmlValue(obj, xmlObj, 'data');

        if (obj.extension || obj.origin || obj.period || obj.factor || obj.lowerLimit || obj.upperLimit || obj.dimensions || obj.data) {
            return obj;
        }
    };

    var parseXmlSchedule = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        var eventProp = self.GetProperty(xmlObj, FHIR_NS, 'event');
        if (eventProp && eventProp.length > 0) {
            obj.event = [];

            for (var i in eventProp) {
                var event = parseXmlPeriod(eventProp[i]);
                obj.event.push(event);
            }
        }

        var repeatProp = self.GetProperty(xmlObj, FHIR_NS, 'repeat');
        if (repeatProp && repeatProp.length > 0) {
            obj.repeat = {};

            populateXmlValue(obj.repeat, repeatProp[0], 'frequency');
            populateXmlValue(obj.repeat, repeatProp[0], 'when');
            populateXmlValue(obj.repeat, repeatProp[0], 'duration');
            populateXmlValue(obj.repeat, repeatProp[0], 'units');
            populateXmlValue(obj.repeat, repeatProp[0], 'count');
            populateXmlValue(obj.repeat, repeatProp[0], 'end');
        }

        if (obj.extension || obj.event || obj.repeat) {
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
            (elementOrType && elementOrType.type && elementOrType.type.length == 1 ? elementOrType.type[0].code : null);

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
                case 'Contact':
                    return parseXmlContact(currentXmlObj);
                case 'SampledData':
                    return parseXmlSampledData(currentXmlObj);
                case 'Schedule':
                    return parseXmlSchedule(currentXmlObj);
                case 'Resource':
                    return parseXmlResource(currentXmlObj);
                case 'Meta':
                case 'BackboneElement':
                    return;
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
            var element = util.FindElement(nextElementPath, profiles);

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