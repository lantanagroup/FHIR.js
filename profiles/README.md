## packageProfiles.js
Combines all profiles in the specified directory into a single bundle of profiles.

### Parameters
| Param | Description |
| ----- | ----------- |
| -d --directory | A directory to get each of the profiles from |
| -b --bundleFile | A file that represents a JSON bundle of all profiles that you want packaged into the correct format for FHIR.js |
| -o --outFile | The file to save the combined/bundled profiles to |

### Example
`node packageProfiles.js -b r4/profiles-resources.json -b r4/profiles-types.json -o profiles/r4/index.js`