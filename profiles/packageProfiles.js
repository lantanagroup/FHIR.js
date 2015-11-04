var fs = require('fs');
var path = require('path');
var argv = require('yargs')
    .alias('d', 'directory')
    .alias('o', 'outFile')
    .require('d')
    .require('o')
    .argv;

var profileFiles = fs.readdirSync(argv.directory);
var profiles = {};

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

var json = JSON.stringify(profiles);
var package = 'module.exports = ' + json + ';';

fs.writeFileSync(argv.outFile, package);

process.exit();