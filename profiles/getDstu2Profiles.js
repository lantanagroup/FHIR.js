var _ = require('lodash');
var fs = require('fs');
var http = require('http');
var q = require('q');
var profiles = ['AllergyIntolerance', 'Appointment', 'AppointmentResponse', 'AuditEvent', 'Basic', 'Binary', 'BodySite', 'Bundle', 'CarePlan', 'Claim', 'ClaimResponse', 'ClinicalImpression', 'Communication', 'CommunicationRequest', 'Composition', 'ConceptMap', 'Condition', 'Conformance', 'DetectedIssue', 'Coverage', 'DataElement', 'Device', 'DeviceComponent', 'DeviceMetric', 'DeviceUseRequest', 'DeviceUseStatement', 'DiagnosticOrder', 'DiagnosticReport', 'DocumentManifest', 'DocumentReference', 'EligibilityRequest', 'EligibilityResponse', 'Encounter', 'EnrollmentRequest', 'EnrollmentResponse', 'EpisodeOfCare', 'ExplanationOfBenefit', 'FamilyMemberHistory', 'Flag', 'Goal', 'Group', 'HealthcareService', 'ImagingObjectSelection', 'ImagingStudy', 'Immunization', 'ImmunizationRecommendation', 'ImplementationGuide', 'List', 'Location', 'Media', 'Medication', 'MedicationAdministration', 'MedicationDispense', 'MedicationOrder', 'MedicationStatement', 'MessageHeader', 'NamingSystem', 'NutritionOrder', 'Observation', 'OperationDefinition', 'OperationOutcome', 'Order', 'OrderResponse', 'Organization', 'Parameters', 'Patient', 'PaymentNotice', 'PaymentReconciliation', 'Person', 'Practitioner', 'Procedure', 'ProcessRequest', 'ProcessResponse', 'ProcedureRequest', 'Provenance', 'Questionnaire', 'QuestionnaireResponse', 'ReferralRequest', 'RelatedPerson', 'RiskAssessment', 'Schedule', 'SearchParameter', 'Slot', 'Specimen', 'StructureDefinition', 'Subscription', 'Substance', 'SupplyRequest', 'SupplyDelivery', 'TestScript', 'ValueSet', 'VisionPrescription'];

var getProfile = function(profileName) {
    var deferred = q.defer();
    var url = 'http://www.hl7.org/fhir/DSTU2/' + profileName.toLowerCase() + '.profile.json';
    var req = http.get(url, function(res) {res.setEncoding('utf8');
        var profileContent = '';
        res.on('data', function (chunk) {
            profileContent += chunk;
        });
        res.on('end', function() {
            try {
                var obj = JSON.parse(profileContent);
                fs.writeFileSync('profiles/dstu2/' + profileName.toLowerCase() + '.profile.json', profileContent);
            } catch (ex) {
                console.log('problem with content for ' + profileName);
            }
            deferred.resolve();
        });
    });

    req.on('error', function(e) {
        console.log('problem with request for ' + profileName + ': ' + e.message);
        deferred.resolve();
    });

    return deferred.promise;
};

var promises = [];
_.forEach(profiles, function(profileName) {
    promises.push(getProfile(profileName));
});

q.all(promises)
    .then(function() {
        process.exit(0);
    });