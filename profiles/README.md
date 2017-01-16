## getDstu2Profiles.js
Retrieves the profiles from the HL7.org website, and places each profile in the dstu2/XXXX.json file.

### Example
`
cd profiles
node getDstu2Profiles.js
`

## packageProfiles.js
Combines all profiles in the specified directory into a single bundle of profiles. This is needed for DSTU1 and DSTU2, but not for STU3 because STU3 already packages all the profiles together in a bundle.

### Parameters
| Param | Description |
| ----- | ----------- |
| -d --directory | A directory to get each of the profiles from |
| -b --bundleFile | A file that represents a JSON bundle of all profiles that you want packaged into the correct format for FHIR.js |
| -o --outFile | The file to save the combined/bundled profiles to |

### Example
`node packageProfiles.js -d profiles/dstu2 -o profiles/dstu2.js`