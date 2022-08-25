# FHIR.js
Node.JS library for serializing/deserializing FHIR resources between JS and XML, and validating FHIR resources.
The library uses technologies that are safe for use in browser-only applications (node.js is not required). 

[![Build Status](https://ci.appveyor.com/api/projects/status/nt0h6ufvhdvk7obc/branch/master?svg=true)](https://ci.appveyor.com/project/seanmcilvenna/fhir-js)
[![Build Status](https://travis-ci.org/lantanagroup/FHIR.js.svg?branch=master)](https://travis-ci.org/lantanagroup/FHIR.js)

# Key features
* Serialization between XML and JSON
* Validation against core spec *and* custom profiles
* Evaluation of [FhirPath](http://build.fhir.org/fhirpath.html)
* Support for multiple FHIR versions (>= STU3)
    * Loading from specific downloadable definitions

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
var Fhir = require('fhir').Fhir;
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
fhir.generateSnapshot(SnapshotGenerator.createBundle(sd1, sd2, sd3));
```

# FHIR Version
**4.0.0**

FHIR.js supports FHIR version **4.0.0** by default.

If your implementation needs to support a specific FHIR version (as long as it is 3.0.1 or newer), you may download the "FHIR Definitions" from the [FHIR Downloads](http://build.fhir.org/downloads.html) page in *JSON* format and load them into the FHIR.js module.

```
var ParseConformance = require('fhir').ParseConformance;
var FhirVersions = require('fhir').Versions;
var Fhir = require('fhir').Fhir;

// Get the data
var newValueSets = JSON.parse(fs.readFileSync('..path..to..valuesets.json').toString());
var newTypes = JSON.parse(fs.readFileSync('..path..to..profiles-types.json').toString());
var newResources = JSON.parse(fs.readFileSync('..path..to..profiles-resources.json').toString());

// Create a parser and parse it using the parser
var parser = new ParseConformance(false, FhirVersions.STU3);           // don't load pre-parsed data
parser.parseBundle(newValueSets);
parser.parseBundle(newTypes);
parser.parseBundle(newResources);

var fhir = new Fhir(parser);
fhir.xmlToJson(...);
fhir.objToXml(...);
fhir.validate(...);
// etc.
```

Custom-loading a version like this may not work if the FHIR spec includes changes to the StructureDefinition resource that are not accounted for in this version of the FHIR.js module. For example, recently StructureDefinition.element.binding.valueSetReference#Reference was changed to StructureDefinition.element.binding.valueSet#canonical. The FHIR.js module had to be updated to respect this change before it could properly validate value sets referenced by the StructureDefinition. 

*Note: For validation to validate a value set referenced by a StructureDefinition, the ValueSet resource must be loaded into the parser before the StructureDefinition is loaded.*

# Documentation
API documentation can be found at http://lantanagroup.github.io/FHIR.js/

# Decimal types
The FHIR specification requires that decimal values have arbitrary precision
and be encoded in JSON as numbers. This is problematic since JavaScript numbers
are 64-bit floating-point numbers that do lose precision. As a workaround:

* `xmlToObj` keeps decimals as JavaScript strings so as to not lose precision
* `xmlToJson` converts decimals to JSON numbers, obeying the specification. Consider using it instead of `JSON.stringify(fhir.xmlToObj(xml))`.
* When parsing FHIR JSON strings, such as those produced by `xmlToJson` or other FHIR libraries, consider using an alternative to `JSON.parse` such as https://github.com/josdejong/lossless-json. This issue is mentioned in the FHIR specification: https://www.hl7.org/fhir/json.html#decimal

# Implementation Notes
* Compatible with FHIR Release 4 Candidate v3.2.0
* FHIR profiles (within the "profiles" directory) are used to determine whether properties should be arrays, the data type and cardinality of each property, etc.. The profiles are first combined using packageProfiles.js into a single bundle of all profiles. A second pass over the profiles is performed to create a hierarchy (rather than a flat list) of the properties, and only includes information that validation is concerned about. The result of the second pass is stored in profiles/types.json and profiles/valueSets.json.

# Test
```
npm test
```
