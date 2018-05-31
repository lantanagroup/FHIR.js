# FHIR.js
Node.JS library for serializing/deserializing FHIR resources between JS and XML, and validating FHIR resources.
The library uses technologies that are safe for use in browser-only applications (node.js is not required). 

[![Build Status](https://ci.appveyor.com/api/projects/status/nt0h6ufvhdvk7obc/branch/master?svg=true)](https://ci.appveyor.com/project/seanmcilvenna/fhir-js)
[![Build Status](https://travis-ci.org/lantanagroup/FHIR.js.svg?branch=master)](https://travis-ci.org/lantanagroup/FHIR.js)

# Dependencies
* q 1.4.1
* underscore 1.8.3
* path 0.12.7
* xml-js 1.6.2

# Installation
```
npm install fhir
or
bower install fhir-js
```

To use in a node.js application, require the "fhir" module.
```js
var Fhir = require('fhir');
```

To use in a browser application, reference dist/bundle.js.

```html
<script type="text/javascript" src="node_modules/fhir/dist/bundle.js"></script>
or
<script type="text/javascript" src="bower_components/fhir-js/dist/bundle.js"></script>
```

# Basic Usage
```js
var resource = {
  resourceType: 'Patient',
  ...
};
var fhir = new Fhir();
var xml = fhir.objToXml(resource);
var json = fhir.xmlToJson(xml);
var obj = fhir.xmlToObj(xml);
var results = fhir.validate(xml, { errorOnUnexpected: true });
results = fhir.validate(obj, {});
```

# Decimal types
The FHIR specification requires that decimal values have arbitrary precision
and be encoded in JSON as numbers. This is problematic since JavaScript numbers
are 64-bit floating-point numbers that do lose precision. As a workaround:

* `xmlToObj` keeps decimals as JavaScript strings so as to not lose precision
* `xmlToJson` converts decimals to JSON numbers, obeying the specification. Consider using it instead of `JSON.stringify(fhir.xmlToObj(xml))`.

# Documentation
API documentation can be found at http://lantanagroup.github.io/FHIR.js/

# Implementation Notes
* Compatible with FHIR Release 4 Candidate v3.2.0
* FHIR profiles (within the "profiles" directory) are used to determine whether properties should be arrays, the data type and cardinality of each property, etc.. The profiles are first combined using packageProfiles.js into a single bundle of all profiles. A second pass over the profiles is performed to create a hierarchy (rather than a flat list) of the properties, and only includes information that validation is concerned about. The result of the second pass is stored in profiles/types.json and profiles/valueSets.json.

# Test
```
npm test
```
