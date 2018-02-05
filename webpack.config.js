const path = require('path');

module.exports = {
    entry: './fhir.js',
    output: {
        filename: 'bundle.js',
        library: 'Fhir',
        path: path.resolve(__dirname, 'dist')
    }
};