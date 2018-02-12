var fs = require('fs');
var path = require('path');
var argv = require('yargs')
    .alias('i', 'inputPackage')
    .require('i')
    .argv;

var profiles = require(argv.inputPackage);
var choicePaths = {};
var allDataTypes = [
    { code: 'Element' },
    { code: 'instant' },
    { code: 'time' },
    { code: 'date' },
    { code: 'dateTime' },
    { code: 'decimal' },
    { code: 'boolean' },
    { code: 'integer' },
    { code: 'string' },
    { code: 'uri' },
    { code: 'base64Binary' },
    { code: 'code' },
    { code: 'id' },
    { code: 'oid' },
    { code: 'unsignedInt' },
    { code: 'positiveInt' },
    { code: 'markdown' },
    { code: 'Complex Types' },
    { code: 'Element' },
    { code: 'Identifier' },
    { code: 'HumanName' },
    { code: 'Address' },
    { code: 'ContactPoint' },
    { code: 'Timing' },
    { code: 'Quantity' },
    { code: 'SimpleQuantity' },
    { code: 'Attachment' },
    { code: 'Range' },
    { code: 'Period' },
    { code: 'Ratio' },
    { code: 'CodeableConcept' },
    { code: 'Coding' },
    { code: 'SampledData' },
    { code: 'Age' },
    { code: 'Distance' },
    { code: 'Duration' },
    { code: 'Count' },
    { code: 'Money' }
];

for (var i in profiles) {
    if (!profiles[i].snapshot || !profiles[i].snapshot.element) {
        console.log('No snapshot, or elements, for profile ' + i);
        continue;
    }

    var elements = profiles[i].snapshot.element;

    for (var x = 0; x < elements.length; x++) {
        var element = elements[x];

        if (element.path.endsWith('[x]')) {
            var leafPath = element.path.substring(element.path.lastIndexOf('.') + 1, element.path.length - 3);

            if (element.type && element.type.length > 0) {
                choicePaths[leafPath] = element.type;
            } else {
                choicePaths[leafPath] = allDataTypes;
            }
        }
    }
}

for (var y in choicePaths) {
    for (var z in choicePaths[y]) {
        var dataTypeCap = choicePaths[y][z].code.charAt(0).toUpperCase() + choicePaths[y][z].code.slice(1);
        var choice = y + dataTypeCap;
        console.log('"' + choice + '": "' + choicePaths[y][z].code + '"');
    }
}

process.exit(0);