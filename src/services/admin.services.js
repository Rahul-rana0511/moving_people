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
      const { page = 1, limit = 20, object_type, is_read, search, status } = req.query;
      const query = {};
      if (object_type !== undefined) {
        query.object_type = Number(object_type);
      }
      if (is_read !== undefined) {
        query.is_read = Number(is_read);
      }
  if (status !== undefined) {
        query.status = Number(status);
      }
      // Add full-text-like search across common fields
      if (search !== undefined && String(search).trim() !== "") {
        const s = String(search).trim();
        const regex = new RegExp(s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i");
        const or = [
          { name: regex },
          { surname: regex },
          { email: regex },
          { telephone_number: regex },
          { message: regex },
        ];

        // If search is a number, also allow matching numeric enum fields
        if (/^\\d+$/.test(s)) {
          const n = Number(s);
          or.push({ object_type: n }, { preferred_contact_method: n }, { is_read: n });
        }

        query.$or = or;
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
getContactUsDashboard: async (req, res) => {
  try {
    const now = new Date();

    // Current Month
    const currentMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const nextMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

    // Last Month
    const lastMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    // Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const [
      totalEnquiries,
      newEnquiries,
      inProgressEnquiries,
      resolvedEnquiries,
      todayEnquiries,
      thisMonthEnquiries,
      lastMonthEnquiries,
    ] = await Promise.all([
      Model.ContactUs.countDocuments(),

      Model.ContactUs.countDocuments({
        status: 0,
      }),

      Model.ContactUs.countDocuments({
        status: 1,
      }),

      Model.ContactUs.countDocuments({
        status: 2,
      }),

      Model.ContactUs.countDocuments({
        createdAt: {
          $gte: todayStart,
          $lt: tomorrowStart,
        },
      }),

      Model.ContactUs.countDocuments({
        createdAt: {
          $gte: currentMonthStart,
          $lt: nextMonthStart,
        },
      }),

      Model.ContactUs.countDocuments({
        createdAt: {
          $gte: lastMonthStart,
          $lt: currentMonthStart,
        },
      }),
    ]);

    let monthlyGrowth = 0;

    if (lastMonthEnquiries > 0) {
      monthlyGrowth =
        ((thisMonthEnquiries - lastMonthEnquiries) /
          lastMonthEnquiries) *
        100;
    } else if (thisMonthEnquiries > 0) {
      monthlyGrowth = 100;
    }

    const comparison = {
      current_month_enquiries: thisMonthEnquiries,
      last_month_enquiries: lastMonthEnquiries,
      difference: thisMonthEnquiries - lastMonthEnquiries,
      percentage_change: Number(monthlyGrowth.toFixed(2)),
      trend: thisMonthEnquiries >= lastMonthEnquiries ? "up" : "down",
    };

    return successRes(
      res,
      200,
      "Dashboard data fetched successfully",
      {
        total_enquiries: totalEnquiries,

        new_enquiries: newEnquiries,

        in_progress_enquiries: inProgressEnquiries,

        resolved_enquiries: resolvedEnquiries,

        today_enquiries: todayEnquiries,

        this_month_enquiries: thisMonthEnquiries,

        last_month_enquiries: lastMonthEnquiries,

        monthly_growth_percentage:
          Number(monthlyGrowth.toFixed(2)),

        comparison,
      }
    );
  } catch (err) {
    return errorRes(res, 500, err.message);
  }
},
updateContactUsStatus: async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (![0, 1, 2].includes(Number(status))) {
      return errorRes(
        res,
        400,
        "Status must be 0, 1 or 2"
      );
    }

    const contact = await Model.ContactUs.findByIdAndUpdate(
      id,
      {
        $set: {
          status: Number(status),
        },
      },
      { new: true }
    );

    if (!contact) {
      return errorRes(
        res,
        404,
        "Enquiry not found"
      );
    }

    return successRes(
      res,
      200,
      "Status updated successfully",
      contact
    );
  } catch (err) {
    return errorRes(res, 500, err.message);
  }
},
deleteContactUs: async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Model.ContactUs.findByIdAndDelete(id);

    if (!contact) {
      return errorRes(
        res,
        404,
        "Enquiry not found"
      );
    }

    return successRes(
      res,
      200,
      "Enquiry deleted successfully"
    );
  } catch (err) {
    return errorRes(res, 500, err.message);
  }
},
getEnquiryTypeChart: async (req, res) => {
  try {
    const objectTypeLabels = {
      0: "Appointment",
      1: "Request Info",
      2: "Document Assistance",
      3: "Status Of Practice",
      4: "General Request",
      5: "Others",
    };

    const totalEnquiries = await Model.ContactUs.countDocuments();

    const result = await Model.ContactUs.aggregate([
      {
        $group: {
          _id: "$object_type",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const chartData = result.map((item) => ({
      object_type: item._id,
      label: objectTypeLabels[item._id],
      count: item.count,
      percentage:
        totalEnquiries > 0
          ? Number(
              ((item.count / totalEnquiries) * 100).toFixed(2)
            )
          : 0,
    }));

    return successRes(
      res,
      200,
      "Enquiry type chart data fetched successfully",
      chartData
    );
  } catch (err) {
    return errorRes(res, 500, err.message);
  }
},
getLastSixMonthsEnquiriesChart: async (req, res) => {
  try {
    const now = new Date();

    const sixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1
    );

    const result = await Model.ContactUs.aggregate([
      {
        $match: {
          createdAt: {
            $gte: sixMonthsAgo,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: d.toLocaleString("en-US", {
          month: "short",
        }),
      });
    }

    const chartData = months.map((m) => {
      const found = result.find(
        (r) =>
          r._id.year === m.year &&
          r._id.month === m.month
      );

      return {
        month: m.label,
        enquiries: found ? found.total : 0,
      };
    });

    return successRes(
      res,
      200,
      "Last 6 months enquiry chart data fetched successfully",
      chartData
    );
  } catch (err) {
    return errorRes(res, 500, err.message);
  }
},
};

export default adminServices;
