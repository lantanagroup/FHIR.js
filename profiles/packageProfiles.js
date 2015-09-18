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
    var profileJSON = fs.readFileSync(path.join(argv.directory, profileFiles[i])).toString();
    var profile = JSON.parse(profileJSON);

    if (profile.structure && profile.structure.length > 0 && profile.structure[0].type) {
        profiles[profile.structure[0].type] = profile;
    }
}

var json = JSON.stringify(profiles);
var package = 'module.exports = ' + json + ';';

fs.writeFileSync(argv.outFile, package);

process.exit();