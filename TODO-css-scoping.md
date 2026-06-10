# CSS Scoping Fix Plan

## Overview
Fix CSS scoping issues where admin and manager pages' styles interfere with each other due to global selectors.

## Root Cause
- All .css files are global, causing conflicts with common selectors like .container, .btn, .card, body.
- Vite bundles all CSS globally, mixing styles across pages.

## Solution
1. Keep only truly global styles in `src/styles/global.css`.
2. Convert page-specific CSS to CSS modules (.module.css).
3. Update JSX imports to use CSS modules.
4. Rename conflicting selectors in page CSS.

## Progress

### Phase 1: Admin Pages
- [x] AdminDashboard.jsx - Already using AdminDashboard.module.css
- [x] AdminAnalytics.jsx - Converted AdminAnalytics.css to module.css and updated import
- [ ] ManageLocations.jsx - Convert ManageLocations.css to module
- [ ] ManageManagers.jsx - Convert ManageManagers.css to module
- [ ] ManageDriver.jsx - Convert ManageDriver.css to module
- [ ] ManagePayments.jsx - Convert ManagePayments.css to module
- [ ] ManageBookings.jsx - Convert ManageBookings.css to module

### Phase 2: Manager Pages
- [ ] ManagerDashboard.jsx - Convert ManagerDashboard.css to module
- [ ] ManageVehiclesPage.jsx - Convert ManageVehiclesPage.css to module
- [ ] ManageBookingsPage.jsx - Convert ManageBookingsPage.css to module
- [ ] MDriver.jsx - Convert MDriver.css to module
- [ ] EditDriverModal.jsx - Convert EditDriverModal.css to module

### Phase 3: Common Pages
- [ ] Home.jsx - Convert Home.css to module
- [ ] Vehicles.jsx - Convert Vehicles.css to module
- [ ] MyBookings.jsx - Convert MyBookings.css to module
- [ ] BookingForm.jsx - Convert BookingForm.css to module
- [ ] ConfirmBooking.jsx - Convert ConfirmBooking.css to module
- [ ] BookingSuccess.jsx - Convert BookingSuccess.css to module

### Phase 4: Components
- [ ] VehicleCard.jsx - Convert VehicleCard.css to module
- [ ] Navbar.jsx - Convert Navbar.css to module
- [ ] Footer.jsx - Convert Footer.css to module
- [ ] Chatbot.jsx - Convert Chatbot.css to module

## Testing
- [ ] Run dev server and check each page for style conflicts
- [ ] Verify admin and manager pages don't interfere
- [ ] Test responsive design
