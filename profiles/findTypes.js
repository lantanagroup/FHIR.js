var ParseConformance = require('../parseConformance');
var fs = require('fs');
var path = require('path');

var coreStructureDefinitions = require('../profiles/r4/index');
var coreValueSets = require('../profiles/r4/valuesets');
var parseConformance = new ParseConformance(false, coreStructureDefinitions, coreValueSets);
parseConformance.parseCoreResources();

fs.writeFileSync(path.join(__dirname, './types.json'), JSON.stringify(parseConformance.parsedStructureDefinitions));
fs.writeFileSync(path.join(__dirname, './valuesets.json'), JSON.stringify(parseConformance.parsedValueSets));