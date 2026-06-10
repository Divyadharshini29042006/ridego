# TODO: Razorpay Setup with Provided Keys

## Tasks
- [ ] Update backend/.env with real Razorpay keys (RAZORPAY_KEY_ID=rzp_test_RStauWTfjNjWBn, RAZORPAY_KEY_SECRET=IHmRW7X7ObrC2c9FhMQps1K3)
- [ ] Update frontend/.env with public key (VITE_RAZORPAY_KEY_ID=rzp_test_RStauWTfjNjWBn)
- [ ] Clean up backend/utils/razorpay.js (remove commented code and console logs)
- [ ] Remove hardcoded fallback key in frontend/src/pages/common/ConfirmBooking.jsx
- [ ] Restart backend server to load new env vars
- [ ] Test payment flow in frontend (ConfirmBooking -> payment -> booking creation)

## Notes
- Keys provided by user: ID rzp_test_RStauWTfjNjWBn, Secret IHmRW7X7ObrC2c9FhMQps1K3
- Ensure .env files are not committed to version control
- Use test mode for now; switch to production keys later
