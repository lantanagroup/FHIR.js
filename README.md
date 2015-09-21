# FHIR.js
Node.JS library for serializing/deserializing FHIR resources between JS/JSON and XML using various node.js XML libraries

![Build Status](https://travis-ci.org/lantanagroup/FHIR.js.svg?branch=master)

# Dependencies
* q 1.4.1
* xml2js 0.4.9
* xmlbuilder 2.6.4
* libxmljs 0.14.3

# Installation
```
npm install fhir
```

# Documentation

# Implementation Notes
* **FHIR DSTU2 is not yet supported**
* Feeds and resources are both supported for DSTU1. There is no need to do anything different for converting feeds vs. resources. The library will automatically detect what should be produced based on the resourceType of the JS object passed, or based on the root element of the XML.
* Unit tests use samples pulled from the FHIR standard. Mocha is used to execute the unit tests. Either execute "mocha test" or "npm test" to run the unit tests
* libxmljs is used to validate XML against the FHIR schemas
* xml2js is used to parse XML and create JS
* xmlbuilder is used to create XML from JS
* FHIR profiles (within the "profiles" directory) are used to determine whether properties should be arrays. The profiles are loaded into memory whenever an instance of the FHIR module is created. This could be improved to reduce I/O operations...