var xml2js = require('xml2js');
var util = require('./util');

module.exports = function(profiles) {
    var self = this;
    var builder = new xml2js.Builder({explicitRoot: false, headless: true, rootName: 'div', renderOpts: { 'pretty': false }});

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
        if (isArray) {
            if (xmlObj[property] && xmlObj[property].length > 0) {
                obj[property] = [];

                for (var i in xmlObj[property]) {
                    var value = getXmlValue(xmlObj[property][i]);
                    obj[property].push(value);
                }
            }
        } else {
            if (xmlObj[property] && xmlObj[property].length > 0) {
                obj[property] = getXmlValue(xmlObj[property][0]);
            }
        }
    };

    var parseXmlResourceReference = function(xmlObj) {
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

        if (xmlObj.valueSet && xmlObj.valueSet.length > 0) {
            obj.valueSet = parseXmlResourceReference(xmlObj.valueSet[0]);
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

        if (xmlObj.assigner && xmlObj.assigner.length > 0) {
            obj.assigner = parseXmlResourceReference(xmlObj.assigner[0]);
        }

        if (obj.extension || obj.use || obj.label || obj.system || obj.value || obj.assigner) {
            return obj;
        }
    };

    var parseXmlCodeableConcept = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        if (xmlObj.coding && xmlObj.coding.length > 0) {
            obj.coding = [];

            for (var i in xmlObj.coding) {
                var coding = parseXmlCoding(xmlObj.coding[i]);
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

        if (xmlObj.period && xmlObj.period.length > 0) {
            obj.period = parseXmlPeriod(xmlObj.period[0]);
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
        if (xmlObj.extension && xmlObj.extension.length > 0) {
            obj.extension = [];

            for (var i in xmlObj.extension) {
                var extension = parseXmlExtension(xmlObj.extension[i]);
                obj.extension.push(extension);
            }
        }
    };

    var parseXmlNarrative = function(xmlObj) {
        var obj = {};

        populateXmlExtension(obj, xmlObj);

        if (xmlObj.div && xmlObj.div.length > 0) {
            if (xmlObj.div[0]['$']) {
                delete xmlObj.div[0]['$'];
            }

            var xml = builder.buildObject(xmlObj.div[0]);
            obj.div = xml;
        }

        if (xmlObj.status && xmlObj.status.length > 0) {
            obj.status = getXmlValue(xmlObj.status[0]);
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
        
        if (xmlObj.numerator && xmlObj.numerator.length > 0) {
            obj.numerator = parseXmlQuantity(xmlObj.numerator[0]);
        }

        if (xmlObj.denominator && xmlObj.denominator.length > 0) {
            obj.denominator = parseXmlQuantity(xmlObj.denominator[0]);
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

        if (xmlObj.period && xmlObj.period.length > 0) {
            obj.period = parseXmlPeriod(xmlObj.period[0]);
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

        if (xmlObj.period && xmlObj.period.length > 0) {
            obj.period = parseXmlPeriod(xmlObj.period[0]);
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

        if (xmlObj.event && xmlObj.event.length > 0) {
            obj.event = [];

            for (var i in xmlObj.event) {
                var event = parseXmlPeriod(xmlObj.event[i]);
                obj.event.push(event);
            }
        }

        if (xmlObj.repeat && xmlObj.repeat.length > 0) {
            obj.repeat = {};

            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'frequency');
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'when');
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'duration');
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'units');
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'count');
            populateXmlValue(obj.repeat, xmlObj.repeat[0], 'end');
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

    self.ParseXmlDataType = function(elementOrType, currentXmlObj) {
        var type = typeof elementOrType == 'string' ?
            elementOrType :
            (elementOrType.definition && elementOrType.definition.type && elementOrType.definition.type.length == 1 ? elementOrType.definition.type[0].code : null);

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

            if (type.toLowerCase() == 'integer') {
                var value = getXmlValue(currentXmlObj);

                try {
                    return parseInt(value);
                } catch (ex) {
                    return;
                }
            }

            for (var i in util.PrimitiveTypes) {
                var primitiveType = util.PrimitiveTypes[i];

                if (primitiveType.toLowerCase() == type.toLowerCase()) {
                    return getXmlValue(currentXmlObj);
                }
            }

            switch (type) {
                case 'CodeableConcept':
                    return parseXmlCodeableConcept(currentXmlObj);
                case 'Coding':
                    return parseXmlCoding(currentXmlObj);
                case 'Identifier':
                    return parseXmlIdentifier(currentXmlObj);
                case 'ResourceReference':
                    return parseXmlResourceReference(currentXmlObj);
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
                default:
                    throw 'Unexpected data-type';
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

            var nextElementPath = elementPath + '.' + i;
            var element = util.FindElement(nextElementPath, profiles);

            if (!element) {
                continue;
            }

            if (element.definition.max == '*') {
                currentJSObj[i] = [];

                for (var x in currentXmlObj[i]) {
                    var dataTypeValue = self.ParseXmlDataType(element, currentXmlObj[i][x]);

                    if (dataTypeValue) {
                        currentJSObj[i].push(dataTypeValue);
                    } else {
                        var nextXmlObj = self.PopulateFromXmlObject({}, currentXmlObj[i][x], nextElementPath);
                        currentJSObj[i].push(nextXmlObj);
                    }
                }
            } else {
                var dataTypeValue = self.ParseXmlDataType(element, currentXmlObj[i][0]);

                if (dataTypeValue) {
                    currentJSObj[i] = dataTypeValue;
                } else {
                    currentJSObj[i] = self.PopulateFromXmlObject({}, currentXmlObj[i][0], nextElementPath);
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