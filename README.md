# FHIR.js
Node.JS library for serializing/deserializing FHIR resources between JS/JSON and XML using various node.js XML libraries

# Dependencies
* q 1.4.1
* xml2js 0.4.9
* xmlbuilder 2.6.4

# Documentation
## ctor(version)
Indicate which version of FHIR the module should work with. Only DSTU1 is currently supported. If no version is specified, defaults to DSTU1.

```
var FHIR = require('FHIR.js');
var fhir = new FHIR(FHIR.DSTU1);
```
## ObjectToXml
Converts a JS object to FHIR XML.

```
var myPatient = {
  resourceType: 'Patient',
  ...
};
var fhir = new FHIR(FHIR.DSTU1);
var xml = fhir.ObjectToXml(myPatient);
```
## JsonToXml
Converts JSON to FHIR XML.

```
var myPatient = {
  resourceType: 'Patient',
  ...
};
var myPatientJson = JSON.stringify(myPatient);
var fhir = new FHIR(FHIR.DSTU1);
var xml = fhir.JsonToXml(myPatientJson);
```
## XmlToJson
Converts FHIR XML to JSON. Wrapper for XmlToObject that parses JSON into an object and returns the object

```
var myPatientXml = '<Patient xmlns="http://hl7.org/fhir"><name><use value="official"/><family value="Chalmers"/><given value="Peter"/><given value="James"/></name></Patient>';
var fhir = new FHIR(FHIR.DSTU1);
fhir.XmlToJson(myPatientXml)
    .then(function(myPatientJson) {
        // Do something with myPatientJson
    })
    .catch(function(err) {
        // Do something with err
    });
```
## XmlToObject
Converts FHIR XML to JS object

```
var myPatientXml = '<Patient xmlns="http://hl7.org/fhir"><name><use value="official"/><family value="Chalmers"/><given value="Peter"/><given value="James"/></name></Patient>';
var fhir = new FHIR(FHIR.DSTU1);
fhir.XmlToObject(myPatientXml)
    .then(function(myPatient) {
        // Do something with myPatient
    })
    .catch(function(err) {
        // Do something with err
    });
```

# Implementation Notes
* **FHIR DSTU2 is not yet supported**
* Feeds and resources are both supported. There is no need to do anything different for converting feeds vs. resources. The library will automatically detect what should be produced based on the resourceType of the JS object passed, or based on the root element of the XML.
* Unit tests use samples pulled from the FHIR standard. Mocha is used to execute the unit tests. Either execute "mocha test" or "npm test" to run the unit tests
* xml2js is used to parse XML and create JS
* xmlbuilder is used to create XML from JS
* FHIR profiles (within the "profiles" directory) are used to determine whether properties should be arrays. The profiles are loaded into memory whenever an instance of the FHIR module is created. This could be improved to reduce I/O operations...