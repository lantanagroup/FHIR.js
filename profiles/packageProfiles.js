var ParseConformance = require('../parseConformance').ParseConformance;
var fs = require('fs');
var path = require('path');

var types = require('../profiles/r4/profiles-types.json');
var resources = require('../profiles/r4/profiles-resources.json');
var valueSets = require('../profiles/r4/valuesets');
var parseConformance = new ParseConformance(false);
parseConformance.parseBundle(types);
parseConformance.parseBundle(resources);
parseConformance.parseBundle(valueSets);

fs.writeFileSync(path.join(__dirname, './types.json'), JSON.stringify(parseConformance.parsedStructureDefinitions));
fs.writeFileSync(path.join(__dirname, './valuesets.json'), JSON.stringify(parseConformance.parsedValueSets));