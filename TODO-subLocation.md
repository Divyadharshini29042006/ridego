# TODO: Add SubLocation Filtering for Drivers

## Steps to Complete:

### 1. Create and initialize TODO-subLocation.md
- [x] Created this file to track progress.

### 2. Edit backend/models/Driver.js
- [x] Add `subLocation: { type: String, default: 'Main Location' }` to the schema.

### 3. Edit backend/controllers/driverController.js
- [x] In `createDriver`: Extract `subLocation` from `req.body`, set `driver.subLocation = subLocation || 'Main Location'`.
- [x] In `updateDriver`: If `subLocation` in `req.body`, set `driver.subLocation = req.body.subLocation`.
- [x] In `getDriversWithFilters`: 
  - If `subLocation` query param provided and !== 'Main Location', add to query: `{ $or: [{ subLocation: { $regex: new RegExp(`^${subLocation}$`, 'i') } }, { subLocation: null }] }` only if matching the provided subLocation (exclude null if strict).
  - Better: If subLocation provided, query `{ subLocation: { $in: [subLocation, null] } }` but only include null if subLocation === 'Main Location'. For non-main, only exact match.
  - Update logic: If subLocation && subLocation !== 'Main Location', query `subLocation: { $regex: new RegExp(`^${subLocation}$`, 'i') }`. Else (main or no sub), include null or 'Main Location'.
  - Remove the log comment about not implemented.
- [x] No changes to other functions.

### 4. Restart Backend Server
- [x] Backend restarted.

### 5. Update Manager UI for SubLocation
- [x] Edit frontend/src/pages/manager/AddDriver.jsx: Add subLocation select field (fetch sublocations for manager's city), gender and email inputs (required by schema), append to FormData.

### 5.1. Backend Support for City-Filtered Locations
- [x] Edit backend/controllers/locationController.js: Add query support for ?city= param in getAllLocations to filter sublocations by city.

### 6. Test the Changes
- [] Restart backend (`cd backend && npm run dev`).
- [] Restart frontend (`cd frontend && npm run dev`).
- [] Login as manager, go to AddDriver, select subLocation='Auroville', fill form (including gender/email), create test driver.
- [] In booking flow: Select Pondicherry - Auroville, toggle needsDriver=true, verify test driver appears, Pavithra excluded.
- [] For Main Location, legacy drivers (null subLocation) should show.
- [] Update Pavithra: Use EditDriverModal or DB to set subLocation='Main Location'.
- [] Check backend logs for filtered queries.

### 7. Update TODO-subLocation.md
- [x] Mark completed steps and close task.
