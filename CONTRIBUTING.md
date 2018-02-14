# General
* Based on open-source technologies
* Only uses modules that are compatible with browser-only applications AND node.js server applications
* Not (no longer) intended for backwards compatibility with older versions of FHIR. Will use NPM's version management to support previous versions of FHIR.

# Structure
* dist/ - Webpack bundled javascript for use in browser-only applications
* profiles/
* profiles/r4 - FHIR R4 profiles
* profiles/types.json - The result of processing FHIR profiles, and extracting only the meta-data needed for serialization and validation within FHIR.js
* profiles/valuesets.json - The result of processing FHIR profiles, extracting value sets in the base spec that are used for validation.
* test/ - All mocha unit test and test data
* fhir.js - Entry point for the module
* toJs.js - Converts XML to JS. Called by entry point index.js
* toXml.js - Converts JS to XML. Called by entry point index.js

# Submitting change requests
1. Fork the repository.
2. Create a new branch in your forked repository.
3. Apply your changes/additions to your new branch.
4. Create a pull request to merge your changes into the master branch of the lantanagroup/FHIR.js repository (see https://help.github.com/articles/creating-a-pull-request/ for more information)
