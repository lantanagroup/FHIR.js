var fs = require('fs');
var path = require('path');
var argv = require('yargs')
    .alias('d', 'directory')
    .alias('b', 'bundleFile')
    .alias('o', 'outFile')
    .require('o')
    .argv;

var profiles = {};

if (argv.directory) {
    var profileFiles = fs.readdirSync(argv.directory);

    for (var i in profileFiles) {
        console.log('Packaging ' + profileFiles[i]);
        var profileJSON = fs.readFileSync(path.join(argv.directory, profileFiles[i])).toString();
        var profile = JSON.parse(profileJSON);

        if (profile.structure && profile.structure.length > 0 && profile.structure[0].type) {
            profiles[profile.structure[0].type] = profile;
        } else if (profile.snapshot && profile.snapshot.element && profile.snapshot.element.length > 0) {
            profiles[profile.snapshot.element[0].path] = profile;
        } else {
            console.log('Cannot determine type for profile: ' + profileFiles[i]);
        }
    }
} else if (argv.bundleFile) {
    var bundleJSON = fs.readFileSync(argv.bundleFile);
    var bundle = JSON.parse(bundleJSON);

    for (var i = 0; i < bundle.entry.length; i++) {
        var entry = bundle.entry[i];

        if (entry.resource.resourceType != 'StructureDefinition' || entry.resource.kind != 'resource') {
            continue;
        }

        console.log('Packaging ' + entry.resource.name);

        profiles[entry.resource.name] = entry.resource;
    }
} else {
    console.log('Either --directory or --inFile must be specified');
    process.exit(1);
}

var json = JSON.stringify(profiles);
var package = 'module.exports = ' + json + ';';

fs.writeFileSync(argv.outFile, package);

process.exit(0);