import jwt from 'jsonwebtoken';
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      assignedLocation: user.assignedLocation || null, // Include if manager
      name: user.name,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};
