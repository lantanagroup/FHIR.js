var fs = require('fs');

var profileFiles = fs.readdirSync('./profiles');
var profiles = {};

for (var i in profileFiles) {
    var profileJSON = fs.readFileSync('./profiles/' + profileFiles[i]).toString();
    var profile = JSON.parse(profileJSON);

    if (profile.structure && profile.structure.length > 0 && profile.structure[0].type) {
        profiles[profile.structure[0].type] = profile;
    }
}

var json = JSON.stringify(profiles);
var package = 'module.exports = ' + json + ';';

fs.writeFileSync('./profiles.js', package);