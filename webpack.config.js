const path = require('path');

module.exports = {
    entry: './fhir.js',
    resolve: {
        fallback: {
            "string_decoder": false
        }
    },
    output: {
        filename: 'bundle.js',
        library: 'Fhir',
        path: path.resolve(__dirname, 'dist')
    }
};