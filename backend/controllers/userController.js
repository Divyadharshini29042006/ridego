// backend/controllers/userController.js
import User from '../models/User.js';
import Location from '../models/Location.js';
import bcrypt from 'bcryptjs';

export const createManager = async (req, res) => {
  console.log('📥 Incoming manager data:', req.body);
  console.log('🖼 Uploaded file:', req.file);

  const { name, email, password, assignedLocation } = req.body;
  const profileImage = req.file?.path;

  if (!name || !email || !password || !assignedLocation) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    const location = await Location.findById(assignedLocation);
    if (!location) {
      return res.status(400).json({ message: 'Invalid assigned location' });
    }
    if (location.managerId) {
      return res.status(400).json({ message: 'Location already assigned' });
    }

    const manager = new User({
      name,
      email,
      password,
      role: 'manager',
      profileImage,
      assignedLocation,
    });

    await manager.save();

    location.managerId = manager._id;
    await location.save();

    res.status(201).json({ message: 'Manager created', manager });
  } catch (error) {
    console.error('Error creating manager:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Get users filtered by role
export const getUsersByRole = async (req, res) => {
  const role = req.query.role;
  if (!role) {
    return res.status(400).json({ message: 'Role query parameter is required' });
  }

  try {
    const users = await User.find({ role }).populate('assignedLocation', 'name city state');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// 🔥 NEW: Get user profile by ID
export const getUserProfile = async (req, res) => {
  const { id } = req.params;

  console.log('[GET PROFILE] User ID:', id);
  console.log('[GET PROFILE] Requesting user ID:', req.user._id.toString());

  // Verify user is accessing their own profile
  if (req.user._id.toString() !== id) {
    return res.status(403).json({ message: 'Unauthorized to access this profile' });
  }

  try {
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('[GET PROFILE] Profile fetched successfully');

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        nationality: user.nationality,
        cityOfResidence: user.cityOfResidence,
        state: user.state,
        aadharNumber: user.aadharNumber,
        drivingLicenseNumber: user.drivingLicenseNumber,
        licensePdfPath: user.licensePdfPath,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[GET PROFILE] Error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  const { id } = req.params;
  
  console.log('[UPDATE PROFILE] User ID:', id);
  console.log('[UPDATE PROFILE] Request body:', req.body);
  console.log('[UPDATE PROFILE] File:', req.file);

  // Verify user is updating their own profile
  if (req.user._id.toString() !== id) {
    return res.status(403).json({ message: 'Unauthorized to update this profile' });
  }

  try {
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    const {
      name,
      gender,
      dateOfBirth,
      nationality,
      cityOfResidence,
      state,
      aadharNumber,
      drivingLicenseNumber,
      phoneNumber,
      email
    } = req.body;

    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (nationality) user.nationality = nationality;
    if (cityOfResidence) user.cityOfResidence = cityOfResidence;
    if (state) user.state = state;
    if (phoneNumber) user.phone = phoneNumber;
    if (email && email !== user.email) {
      // Check if email already exists
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    if (aadharNumber) {
      // Validate Aadhar number
      if (!/^\d{12}$/.test(aadharNumber)) {
        return res.status(400).json({ message: 'Aadhar number must be exactly 12 digits' });
      }
      user.aadharNumber = aadharNumber;
    }
    if (drivingLicenseNumber) user.drivingLicenseNumber = drivingLicenseNumber;

    // Handle file upload
    if (req.file) {
      user.licensePdfPath = req.file.path;
    }

    await user.save();

    console.log('[UPDATE PROFILE] Profile updated successfully');

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        nationality: user.nationality,
        cityOfResidence: user.cityOfResidence,
        state: user.state,
        aadharNumber: user.aadharNumber,
        drivingLicenseNumber: user.drivingLicenseNumber,
        licensePdfPath: user.licensePdfPath
      }
    });
  } catch (error) {
    console.error('[UPDATE PROFILE] Error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
};

// Change password
export const changePassword = async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;

  console.log('[CHANGE PASSWORD] User ID:', userId);

  // Verify user is changing their own password
  if (req.user._id.toString() !== userId) {
    return res.status(403).json({ message: 'Unauthorized to change this password' });
  }

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long' });
  }

  // Validate password complexity
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/.test(newPassword)) {
    return res.status(400).json({
      message: 'Password must include uppercase, lowercase, number, and special character'
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify old password
    const isValidPassword = await user.comparePassword(oldPassword);

    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from old password' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    console.log('[CHANGE PASSWORD] Password changed successfully');

    res.status(200).json({
      message: 'Password changed successfully',
      success: true
    });
  } catch (error) {
    console.error('[CHANGE PASSWORD] Error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
};

// Submit contact query
export const submitContactQuery = async (req, res) => {
  const { name, email, mobile, issue, comments } = req.body;

  if (!name || !email || !mobile || !issue || !comments) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const ContactQuery = (await import('../models/ContactQuery.js')).default;

    const newQuery = new ContactQuery({
      name,
      email,
      mobile,
      issue,
      comments,
      location: 'Madurai' // Default location, can be made dynamic later
    });

    await newQuery.save();

    res.status(201).json({
      message: 'Query submitted successfully',
      query: newQuery
    });
  } catch (error) {
    console.error('Error submitting contact query:', error);
    res.status(500).json({ message: 'Server error during query submission' });
  }
};
