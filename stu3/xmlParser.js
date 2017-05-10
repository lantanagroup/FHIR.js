var xml2js = require('xml2js');
var util = require('./util');
var _ = require('lodash');

/**
 * @class XmlParser
 * @memberof module:stu3
 * @param profiles
 * @param obj
 */
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
                case 'Resource':
                    return parseXmlResource(currentXmlObj);
                case 'xhtml':
                    return '<div xmlns=\"http://www.w3.org/1999/xhtml\">' + currentXmlObj._ + '</div>';
                case 'BackboneElement':
                case 'Element':
                    if (elementOrType && elementOrType.path) {
                        var obj = {};
                        obj = self.PopulateFromXmlObject(obj, currentXmlObj, elementOrType.path);
                        return obj;
                    }
                    return;
                default:
                    if (profiles[type]) {
                        var complexType = {};
                        complexType = self.PopulateFromXmlObject(complexType, currentXmlObj, type);
                        return complexType;
                    }

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