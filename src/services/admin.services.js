import * as Model from "../models/index.js";
import { errorRes, successRes } from "../utils/response.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";
// import sendEmailOtp from "../utils/sendEmailOtp.js";
import "dotenv/config";

const JWT_SECRET_KEY = process.env.JWT_SECRET;

const adminServices = {
  createSuperAdmin: async (req, res) => {
    try {
      const isAdmin = await Model.Admin.findOne({ email: process.env.ADMIN_EMAIL });
      if (isAdmin) {
        return successRes(res, 200, "Admin already created");
      }

      const hashPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const admin = await Model.Admin.create({
        admin_name: "Super admin",
        email: process.env.ADMIN_EMAIL,
        password: hashPassword,
      });

      const responseObj = admin.toObject();
      delete responseObj.password;
      return successRes(res, 200, "Admin created successfully", responseObj);
    } catch (error) {
      return errorRes(res, 500, error.message);
    }
  },

  createAdmin: async (req, res) => {
    try {
      const { admin_name, email, password } = req.body;
      const hashPassword = await bcrypt.hash(password, 10);
      const otp = Math.floor(1000 + Math.random() * 9000);
      const newAdmin = await Model.Admin.create({
        admin_name,
        email: email.toLowerCase(),
        password: hashPassword,
        otp,
      });
      return successRes(res, 200, "Admin Data Successfully Registered", newAdmin);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return errorRes(res, 400, "Email and password are required");
      }

      const admin = await Model.Admin.findOne({ email: email.toLowerCase() });
      if (!admin) {
        return errorRes(res, 404, "User not Found");
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return errorRes(res, 400, "Invalid Password");
      }

      if (!JWT_SECRET_KEY) {
        console.error("JWT_SECRET_KEY is not defined");
        return errorRes(res, 500, "JWT secret key is not configured");
      }

      const token = JWT.sign({ userId: admin._id }, JWT_SECRET_KEY, {
        expiresIn: "30d",
      });

      return successRes(res, 200, "User Successfully Login", {
        Admin: admin,
        token,
      });
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  changePassword: async (req, res) => {
    try {
      const adminId = req.user._id;
      const currentPassword = req.body.oldPassword;
      const password = req.body.newPassword;

      const admin = await Model.Admin.findById(adminId);
      if (!admin) {
        return errorRes(res, 404, "Admin Not Found");
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isPasswordValid) {
        return errorRes(res, 400, "Incorrect Old Password");
      }

      const isPasswordSame = await bcrypt.compare(password, admin.password);
      if (isPasswordSame) {
        return errorRes(res, 400, "Old Password and New Password should not be the same");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedAdmin = await Model.Admin.findByIdAndUpdate(
        adminId,
        { $set: { password: hashedPassword } },
        { new: true }
      );
      return successRes(res, 200, "Password Changed Successfully", updatedAdmin);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  forgotpassword: async (req, res) => {
    try {
      console.log("Forgot Password Request Body:", req.body);
      const email = req.body.email?.toLowerCase();
      const admin = await Model.Admin.findOne({ email });
      if (!admin) {
        return errorRes(res, 404, "Invalid Email");
      }
      const otp = Math.floor(1000 + Math.random() * 9000);
      const updatedAdmin = await Model.Admin.findByIdAndUpdate(admin._id, { $set: { otp } },{new: true});
      // await sendEmailOtp(email, otp);
      return successRes(res, 200, "OTP has been sent to your provided email", updatedAdmin);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { userId, email, password } = req.body;
      if (!password) {
        return errorRes(res, 400, "New Password is Required");
      }

      const admin = userId
        ? await Model.Admin.findById(userId)
        : await Model.Admin.findOne({ email: email?.toLowerCase() });
      if (!admin) {
        return errorRes(res, 404, "Admin not found");
      }

      const isPasswordSame = await bcrypt.compare(password, admin.password);
      if (isPasswordSame) {
        return errorRes(res, 400, "Old Password and New Password should not be the same");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedAdmin = await Model.Admin.findByIdAndUpdate(
        admin._id,
        { $set: { password: hashedPassword, otp: null } },
        { new: true }
      );
      return successRes(res, 200, "Password Changed Successfully", updatedAdmin);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  resendOTP: async (req, res) => {
    try {
      const email = req.body.email?.toLowerCase();
      const admin = await Model.Admin.findOne({ email });
      if (!admin) {
        return errorRes(res, 404, "Admin not found");
      }
      const otp = Math.floor(1000 + Math.random() * 9000);
      const updatedAdmin = await Model.Admin.findByIdAndUpdate(admin._id, { $set: { otp } },{new: true});
      // await sendEmailOtp(email, otp);
      return successRes(res, 200, "New OTP sent successfully.", updatedAdmin);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  verifyOTP: async (req, res) => {
    try {
     const {userId} = req.body;
      const enteredOTP = req.body.otp;
      console.log("Verifying OTP for User ID:", userId, "Entered OTP:", enteredOTP);
      const admin = await Model.Admin.findById(userId);
      console.log("Admin found for OTP verification:", admin);
      if (!admin) {
        return errorRes(res, 404, "Admin not found");
      }
      if (enteredOTP == admin.otp) {
        const token = JWT.sign({ userId: admin._id }, JWT_SECRET_KEY, {
          expiresIn: "30d",
        });
        admin.otp = null;
        await admin.save();
        const response = {
          ...admin.toObject(),
          token,
        };
        return successRes(res, 200, "OTP verified successfully.", response);
      }
      return errorRes(res, 400, "Invalid OTP or OTP has expired.");
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  getProfile: async (req, res) => {
    try {
      const adminData = await Model.Admin.findById(req.user._id);
      if (!adminData) {
        return errorRes(res, 404, "Admin not found");
      }
      return successRes(res, 200, "Admin Details", adminData);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  editProfile: async (req, res) => {
    try {
      if (req?.files && req?.files?.profile_image) {
        req.body.profile_image = `public/${req.files.profile_image[0].filename}`;
      }
      const updateProfile = await Model.Admin.findByIdAndUpdate(
        req.user._id,
        { $set: { ...req.body } },
        { new: true }
      );
      if (!updateProfile) {
        return errorRes(res, 404, "Admin not found");
      }
      return successRes(res, 200, "Profile updated successfully", updateProfile);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  getContactUsList: async (req, res) => {
    try {
      const { page = 1, limit = 20, object_type, is_read } = req.query;
      const query = {};
      if (object_type !== undefined) {
        query.object_type = Number(object_type);
      }
      if (is_read !== undefined) {
        query.is_read = Number(is_read);
      }

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 20;
      const contacts = await Model.ContactUs.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);
      const total = await Model.ContactUs.countDocuments(query);

      return successRes(res, 200, "Contact submissions fetched successfully", {
        count: contacts.length,
        total,
        page: pageNum,
        limit: limitNum,
        data: contacts,
      });
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  getContactUsDetail: async (req, res) => {
    try {
      const contact = await Model.ContactUs.findById(req.params.id);
      if (!contact) {
        return errorRes(res, 404, "Contact submission not found");
      }
      return successRes(res, 200, "Contact submission details fetched successfully", contact);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

};

export default adminServices;
