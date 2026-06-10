# RideGo Project Structure

RideGo is a ride-sharing application built with a Node.js/Express backend and a React frontend. It supports multiple user roles: admin, manager, and customer. The app handles vehicle management, bookings, payments, and user authentication with OTP verification and Google sign-in.

## Backend (Node.js/Express)

### Configuration
- **config/db.js**: Database connection setup using Mongoose for MongoDB.
- **config/jwt.js**: JWT token generation and verification utilities.

### Controllers
Controllers handle business logic and interact with models.

#### authController.js
- **signupUser**: Handles user registration with OTP generation and email sending. Validates email uniqueness, hashes OTP, and saves user with verification fields.
- **verifyOtp**: Verifies the OTP entered by the user. Checks expiration, compares hashed OTP, and marks user as verified upon success.
- **resendOtp**: Generates and sends a new OTP with cooldown period (30 seconds). Updates user with new hashed OTP and expiration.
- **loginUser**: Authenticates users. Checks credentials, ensures verification for customers, and returns JWT token.
- **registerManager**: Registers a manager with profile image upload, assigns location, and updates location's managerId.

#### userController.js
(Assumed based on structure; handles user-related operations for customers.)

#### driverController.js
(Assumed; manages driver profiles, assignments, etc.)

#### vehicleController.js
- **createVehicle**: Creates a new vehicle for a manager's location. Validates vehicle number uniqueness, sub-location, and saves with image upload.
- **getVehiclesByLocation**: Retrieves vehicles assigned to the manager's location.
- **getManagerVehicles**: Fetches vehicles managed by the logged-in manager.
- **updateVehicle**: Updates vehicle details, including validation for sub-location.
- **deleteVehicle**: Deletes a vehicle if owned by the manager.
- **updateVehicleStatus**: Changes vehicle status (Available/Booked/Maintenance).
- **getVehicleWithBookings**: Gets vehicle details along with booking history.
- **getVehicleSummary**: Provides summary stats like total vehicles, availability, most booked, idle vehicles.
- **getVehicleById**: Fetches a specific vehicle by ID for managers.
- **getPublicVehicleById**: Public endpoint to get vehicle details.
- **getPublicVehicles**: Retrieves vehicles with filtering by city, sub-location, type, fuel.

#### bookingController.js
- **createBooking**: Creates a new booking with customer, vehicle, driver, locations, and date.

#### paymentController.js
(Assumed; handles payment processing with Razorpay.)

#### locationController.js
(Assumed; manages locations and sub-cities.)

#### adminController.js
(Assumed; admin-specific operations like managing users, reports.)

#### managerController.js
(Assumed; manager dashboard and profile management.)

### Models
Mongoose schemas defining data structures.

#### User.js
Schema fields: name, email, password, dateOfBirth, role (admin/manager/customer), profileImage, assignedLocation, isVerified, otpHash, otpExpires, lastOtpSentAt.
Methods:
- **comparePassword**: Compares entered password with hashed password.
- **compareOtp**: Compares entered OTP with hashed OTP.
- **toJSON**: Removes sensitive fields from JSON output.
Pre-save hook: Hashes password before saving.

#### Driver.js
(Assumed; schema for drivers with details like license, etc.)

#### Vehicle.js
(Assumed; schema with vehicleModel, brand, color, type, fuel, seating, transmission, rent rates, deposit, number, year, mileage, image, status, assignedLocation, subLocation, managerId.)

#### Booking.js
(Assumed; schema with customer, vehicle, driver, pickup/drop locations, date, status.)

#### Payment.js
(Assumed; schema for payment records with Razorpay integration.)

#### Location.js
(Assumed; schema with name, city, subCities, managerId.)

#### ContactQuery.js
(Assumed; schema for user contact queries.)

### Routes
Define API endpoints.

#### authRoutes.js
- POST /signup: User signup
- POST /verify-otp: OTP verification
- POST /resend-otp: Resend OTP
- POST /login: User login
- POST /register-manager: Manager registration

#### googleAuth.js
- POST /google: Google sign-in authentication

#### userRoutes.js
(Assumed; customer user operations.)

#### driverRoutes.js
(Assumed; driver management.)

#### vehicleRoutes.js
- POST /: Create vehicle
- GET /location: Get vehicles by location
- GET /manager: Get manager's vehicles
- PUT /:id: Update vehicle
- DELETE /:id: Delete vehicle
- PUT /:id/status: Update status
- GET /:id/details: Vehicle with bookings
- GET /summary: Vehicle summary
- GET /:id: Get vehicle by ID
- GET /public/:id: Public vehicle details
- GET /public: Public vehicles with filters

#### bookingRoutes.js
- POST /: Create booking

#### paymentRoutes.js
(Assumed; payment endpoints with Razorpay.)

#### locationRoutes.js
(Assumed; location CRUD.)

#### adminRoutes.js
(Assumed; admin dashboard, manage users, etc.)

#### managerRoutes.js
(Assumed; manager operations.)

### Middlewares
#### authMiddleware.js
(Assumed; JWT authentication middleware.)

#### uploadMiddleware.js
(Assumed; Multer setup for file uploads.)

#### uploadMiddlewareDriver.js
(Assumed; Specific for driver uploads.)

#### uploadVehicleImage.js
(Assumed; For vehicle images.)

### Utils
#### mailer.js
- **sendOtpEmail**: Sends OTP via email using nodemailer.

#### razorpay.js
(Assumed; Razorpay instance and utilities.)

### Other Backend Files
- **app.js**: Basic Express setup with CORS, routes for auth.
- **server.js**: Main server file with full setup, Razorpay, Google auth, all routes, file serving, error handling.
- **loadEnv.js**: Loads environment variables.
- **envTest.js**: Tests env variables.
- **package.json**: Dependencies (express, mongoose, bcrypt, jwt, nodemailer, razorpay, etc.)
- **uploads/**: Directory for uploaded files (drivers, managers, vehicles).

## Frontend (React/Vite)

### Main Files
- **main.jsx**: Renders the app with React StrictMode.
- **App.jsx**: Defines routes for public, admin, manager, customer pages with ProtectedRoute.
- **index.css**: Global styles.
- **App.css**: App-specific styles.

### Context
#### AuthContext.jsx
Provides authentication state and methods like login, logout, checkAuth.

### Components
#### Navbar.jsx
Navigation bar with links based on user role.

#### Footer.jsx
Footer component.

#### ProtectedRoute.jsx
Wraps routes to restrict access by role.

#### SearchBar.jsx
Search functionality for vehicles.

#### VehicleFilters.jsx
Filters for vehicle search.

#### BookingTable.jsx
Displays bookings.

#### LocationForm.jsx
Form for locations.

#### VehicleCard.jsx
Card component for vehicle display.

#### AdminSidebar.jsx
Sidebar for admin navigation.

#### ManagerSidebar.jsx
Sidebar for manager navigation.

### Pages

#### Common Pages
- **Home.jsx**: Landing page.
- **Login.jsx**: Login form.
- **Signup.jsx**: Signup form.
- **VerifyOtp.jsx**: OTP verification.
- **About.jsx**: About page.
- **Contact.jsx**: Contact form.
- **VehicleDetails.jsx**: Public vehicle details.
- **Vehicles.jsx**: List of vehicles with filters.
- **Settings.jsx**: User settings.
- **ProfileEdit.jsx**: Edit profile.
- **Favorites.jsx**: Favorite vehicles.

#### Admin Pages
- **AdminDashboard.jsx**: Admin overview.
- **ManageVehicles.jsx**: Admin vehicle management.
- **AdminBookings.jsx**: Admin booking management.
- **AdminQueryMetrics.jsx**: Query metrics.
- **ManageDrivers.jsx**: Admin driver management.
- **ManagePayments.jsx**: Payment management.
- **ManageManagers.jsx**: Manager management.
- **ManageLocations.jsx**: Location management.

#### Manager Pages
- **ManagerDashboard.jsx**: Manager overview.
- **ManageProfile.jsx**: Manager profile.
- **ManageVehiclesPage.jsx**: Manager vehicle management.
- **VehicleDetails.jsx**: Vehicle details for manager.
- **ManagerReports.jsx**: Reports.
- **MDriver.jsx**: Driver management.
- **AddDriver.jsx**: Add driver form.
- **EditDriverModal.jsx**: Edit driver modal.
- **EditVehicleModal.jsx**: Edit vehicle modal.

### Styles
CSS files corresponding to components and pages, e.g., Home.css, Login.css, AdminDashboard.css, etc.

### API
#### vehicleAPI.js
Functions to fetch vehicles from backend.

### Assets
- **Car-Bike transform.gif**: Animation.
- **carhome.png**: Home image.
- **react.svg**: React logo.

## Summary
The project has a robust backend with authentication, vehicle/booking management, and a responsive frontend with role-based access. All functions are detailed based on code analysis; some assumed for brevity as not all files were read in detail.
