# Fix ConfirmBooking Page Refresh Issue

## Problem
When user refreshes the ConfirmBooking page, it redirects to home page because bookingData from location.state is lost on refresh.

## Solution
Persist bookingData in localStorage to retain state across page refreshes.

## Changes Made
1. Modified ConfirmBooking.jsx to:
   - Store bookingData in localStorage when component mounts with valid data
   - Load bookingData from localStorage if location.state is empty (on refresh)
   - Clear localStorage after successful booking or when editing booking
   - Update state management to handle both location.state and localStorage

## Testing
- Navigate to confirm-booking with booking data - ✅ localStorage is set
- Refresh the page - ✅ stays on confirm-booking page, loads from localStorage
- Edit booking - ✅ localStorage is cleared, navigates to booking form
- Complete booking - ✅ localStorage is cleared, navigates to success page
