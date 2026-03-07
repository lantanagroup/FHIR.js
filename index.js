module.exports = {
    Fhir: require('./fhir').Fhir,
    Versions: require('./fhir').Versions,
    ParseConformance: require('./parseConformance').ParseConformance,
    FhirPath: require('./fhirPath').FhirPath,
    Validator: require('./validator').Validator,
    SnapshotGenerator: require('./snapshotGenerator').SnapshotGenerator
};