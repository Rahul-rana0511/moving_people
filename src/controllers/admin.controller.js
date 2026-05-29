import JWT from "jsonwebtoken";
import * as Model from "../../models/index.js";
import { successRes, errorRes } from "../../utils/response.js";
import bcrypt from "bcrypt";
import sendEmail from "../../utils/sendEmail.js";
import "dotenv/config";
const JWT_SECRET_KEY = process.env.JWT_SECRET;
const createSuperAdmin = async (req, res) => {
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
};
const createAdmin = async (req, res) => {
  try {
    const {
      admin_name,
      email,
      password,
    } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(1000 + Math.random() * 9000);
    const newUser = new Model.Admin({
      admin_name,
      email: email,
      password: hashPassword,
      otp: otp,
    });
    const adminData = await newUser.save();
    return successRes(
      res,
      200,
      "Admin Data Successfully Registered",
      adminData
    );
  } catch (err) {
    return errorRes(res, 500, err.message);
  }
};
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the admin by email
    const admin = await Model.Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return errorRes(res, 404, "User not Found");
    }

    // Check the password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return errorRes(res, 400, "Invalid Password");
    }

    // Ensure JWT_SECRET_KEY is defined
    if (!JWT_SECRET_KEY) {
      console.error("JWT_SECRET_KEY is not defined");
      return errorRes(res, 400, "JWT_SECRET_KEY is not defined");
    }

    // Generate JWT token
    const token = JWT.sign({ userId: admin._id }, JWT_SECRET_KEY, {
      expiresIn: "30d",
    });
    await admin.save();

    // Send response with user ID and token
    return successRes(res, 200, "User Successfully Login", {
      Admin: admin,
      token,
    });
  } catch (err) {
    return errorRes(res, 500, err.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const adminId = req.user._id;
    const currentPassword = req.body.oldPassword;
    const password = req.body.newPassword;

    // Find the user by ID
    const admin = await Model.Admin.findById(adminId);
    if (!admin) {
      return errorRes(res, 404, "Admin Not Found");
    }

    // Check if the current password is correct
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password
    );
    if (!isPasswordValid) {
      return errorRes(res, 400, "Incorrect Old Password");
    }
   const isPasswordSame = await bcrypt.compare(
    password,
    admin.password
   )
   if(isPasswordSame){
    return errorRes(res, 400, "Old Password and New Password should not be the same")
   }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and invalidate the authToken
    const updatedUser = await Model.Admin.findByIdAndUpdate(
      adminId,
      { $set: { password: hashedPassword } },
      { new: true }
    );
    return successRes(res, 200, "Password Changed Successfully", updatedUser);
  } catch (err) {
    return errorRes(res, 500, err.message);
  }
};
const forgotpassword = async (req, res) => {
  try {
    //find the user exists in the database or not
    const admin = await Model.Admin.findOne({ email: req.body.email });

    if (!admin) {
      return errorRes(res, 404, "Invalid Email");
    }
    const token = JWT.sign({ email: admin.email }, JWT_SECRET_KEY, {
      expiresIn: "10m",
    });
    sendEmail({
      email: admin.email,
      project_name: process.env.PROJECT_NAME,
      type: "adminforgetpassword",
      user: admin,
      token: token
    });
    return successRes(res, 200, "Password Reset link has been sent to your provided email");
  } catch (err) {
    return errorRes(res, 500, err.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const email = req.userEmail;

    if (!email) {
      return errorRes(res, 404, "Invalid Email");
    }

    const password = req.body.password;

    if (!password) {
      return errorRes(res, 400, "New Password is Required");
    }
   
    // Fetch user by email
    const admin = await Model.Admin.findOne({ email: email });
    if (!admin) {
      return errorRes(res, 400, "User not found");
    }
    const isPasswordSame = await bcrypt.compare(
      password,
      admin.password
     )
     if(isPasswordSame){
      return errorRes(res, 400, "Old Password and New Password should not be the same")
     }
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and timestamp
    const updatedUser = await Model.Admin.findByIdAndUpdate(
        admin._id, // Assuming MongoDB's default '_id' field
      {
        $set: {
          password: hashedPassword,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return errorRes(res, 400, "Invalid or expired token");
    }

    // Send success response
    return successRes(res, 200, "Password Changed Successfully", updatedUser);
  } catch (err) {
    // Handle errors
    return errorRes(res, 500, err.message);
  }
};
const resendOTP = async (req, res) => {
  try {
    const email = req.body.email;
    const admin = await Model.Admin.findOne({ email });

    if (!admin) {
      return errorRes(res, 404, "Admin not found");
    }

    // Always generate and resend OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    await admin.findByIdAndUpdate(
        admin._id,
      { $set: { otp: otp } },
      { new: true }
    );
    sendEmail({
      otp: otp,
      email: email,
      project_name: process.env.PROJECT_NAME,
      type: "resendOTP",
      user: admin,
    });

    return successRes(res, 200, "New OTP sent successfully.", otp);
  } catch (err) {
    return errorRes(res, 500, err.message);
  }
};

const verifyOTP = async (req, res) => {
  try {
    const email = req.body.email;
    const enteredOTP = req.body.otp;

    const admin = await Model.Admin.findOne({ email });

    if (!admin) {
      return errorRes(res, 404, "Admin not found");
    }

    // Check if entered OTP matches the stored OTP
    if (enteredOTP == admin.otp) {
      const token = JWT.sign({ userId: admin._id }, JWT_SECRET_KEY, {
        expiresIn: "30d",
      });
      const responseObj = admin.toObject();
      const response = {
        ...responseObj,
        token,
      };
      await admin.save();
      return successRes(res, 200, "OTP verified successfully.", response);
    } else {
      return errorRes(res, 400, "Invalid OTP or OTP has expired.");
    }
  } catch (err) {
    return errorRes(res, 500, err.message);
  }
};
const getProfile = async(req,res)=>{
  try{
    const adminData = await Model.Admin.findById(req.user._id);
    if(!adminData){
      return errorRes(res, 404, "Admin not found")
    }
    return successRes(res, 200, "Admin Details", adminData);
  }catch(err){
    return errorRes(res, 500, err.message);
  }
}
const editProfile = async(req,res)=>{
  try{
    if(req?.files && req?.files?.profile_image){
      req.body.profile_image = `public/${req.files.profile_image[0].filename}`
    }
    const updateProfile = await Model.Admin.findByIdAndUpdate(req.user._id,{$set:{...req.body}},{new: true});
    if(!updateProfile){
      return errorRes(res, 404, "Admin not found");
    }
    return successRes(res, 200, "Profile updated successfully", updateProfile)
  }catch(err){
    return errorRes(res, 500, err.message);
  }
}
export {
  createSuperAdmin,
  createAdmin,
  adminLogin,
  changePassword,
  forgotpassword,
  getProfile,
  editProfile,
  resetPassword,
  verifyOTP,
  resendOTP,
};
