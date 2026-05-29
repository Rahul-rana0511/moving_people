import jwt from 'jsonwebtoken';
import 'dotenv/config';
import admin from '../models/admin.js';

const authentication = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      throw new Error('Authorization header is missing');
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const adminId = decodedToken.userId;
    const user = await admin.findOne({_id: adminId});
    req.user = user;
    await user.save();
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({
      error: 'Token verification failed',
    });
  }
};

export default authentication;

