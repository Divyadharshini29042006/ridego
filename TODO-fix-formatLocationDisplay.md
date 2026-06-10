# Fix formatLocationDisplay Function and Usage

## Information Gathered
- Current `formatLocationDisplay` function displays `${city} (${subLocation})`
- Function is used in Add Vehicle form and Edit Vehicle modal select options
- `fetchManagerLocation` currently sets subLocations from assignedLocation.subCities or availableSubLocations
- Select elements use `formatLocationDisplay` to display options

## Plan
1. Update `formatLocationDisplay` function to show only subLocation for 'White Town' and 'Auroville', otherwise `${city} - ${subLocation}`
2. Update `fetchManagerLocation` to prioritize manager.subLocation, fallback to first subCity
3. Update select options in Add Vehicle form and Edit modal to display just the subLocation name (`{loc}`)

## Dependent Files
- `frontend/src/pages/manager/ManageVehiclesPage.jsx`

## Completed Tasks
- [x] Updated `formatLocationDisplay` function to show only subLocation for 'White Town' and 'Auroville', otherwise `${city} - ${subLocation}`
- [x] Updated `fetchManagerLocation` to prioritize manager.subLocation, fallback to first subCity
- [x] Select options in Add Vehicle form and Edit modal display just the subLocation name

## Followup Steps
- Test the Add Vehicle form to ensure correct subLocation display and selection
- Verify Edit Vehicle modal works correctly
- Check that manager's specific subLocation is properly set
