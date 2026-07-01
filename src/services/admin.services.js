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
        isAdmin.role = 1;
        await isAdmin.save();
        return successRes(res, 200, "Admin already created");
      }

      const hashPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const admin = await Model.Admin.create({
        admin_name: "Super admin",
        email: process.env.ADMIN_EMAIL,
        password: hashPassword,
        role: 1,
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
        role: 2,
      });
      return successRes(res, 200, "Admin Data Successfully Registered", newAdmin);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  createEmployee: async (req, res) => {
    try {
      const creatorRole = req.user?.role;
      if (![1, 2].includes(creatorRole)) {
        return errorRes(res, 403, "Access denied");
      }

      const { admin_name, email, password, country_code, phone_number } = req.body;
      if (!admin_name || !email || !password) {
        return errorRes(res, 400, "Admin name, email, and password are required");
      }

      const existingAdmin = await Model.Admin.findOne({ email: email.toLowerCase() });
      if (existingAdmin) {
        return errorRes(res, 409, "Email already in use");
      }

      const hashPassword = await bcrypt.hash(password, 10);
      const otp = Math.floor(1000 + Math.random() * 9000);
      const newEmployee = await Model.Admin.create({
        admin_name,
        email: email.toLowerCase(),
        password: hashPassword,
        otp,
        role: 3,
        country_code,
        phone_number,
      });

      return successRes(res, 200, "Employee created successfully", newEmployee);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  getEmployeeList: async (req, res) => {
    try {
      const employees = await Model.Admin.find({ role: 3 }).sort({ createdAt: -1 });
      return successRes(res, 200, "Employee list fetched successfully", employees);
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
      const { page = 1, limit = 20, object_type, is_read, search, status, country } = req.query;
      const query = {};
      if (req.user?.role === 3) {
        query.assigned_employee = req.user._id;
      }
      if (object_type !== undefined) {
        query.object_type = Number(object_type);
      }
      if (is_read !== undefined) {
        query.is_read = Number(is_read);
      }
      if (status !== undefined) {
        query.status = Number(status);
      }
      if (country !== undefined && String(country).trim() !== "") {
        const normalizedCountry = String(country).trim();
        query.country = { $regex: `^${normalizedCountry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
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
        .populate("assigned_employee", "admin_name email role")
        .populate("assigned_by", "admin_name email role")
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

  getTopContactUsCountries: async (req, res) => {
    try {
      // const { limit = 10 } = req.query;
      // const limitNum = Number(limit) || 10;
      const countries = await Model.ContactUs.aggregate([
        {
          $match: {
            country: {
              $exists: true,
              $ne: null,
              $ne: "",
            },
          },
        },
        {
          $group: {
            _id: { $trim: { input: { $toLower: "$country" } } },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            country: "$_id",
            count: 1,
          },
        },
        { $sort: { count: -1, country: 1 } },
        // { $limit: limitNum },
      ]);

      return successRes(res, 200, "Top contact us countries fetched successfully", countries);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  getContactUsDetail: async (req, res) => {
    try {
      const contact = await Model.ContactUs.findById(req.params.id)
        .populate("assigned_employee", "admin_name email role")
        .populate("assigned_by", "admin_name email role")
        .lean();
      if (!contact) {
        return errorRes(res, 404, "Contact submission not found");
      }
      const contactNotes = await Model.Notes.find({ contact_us_id: contact._id })
        .populate("employee_id", "admin_name email role")
        .lean();
      contact.notes = contactNotes;
      return successRes(res, 200, "Contact submission details fetched successfully", contact);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  assignContactToEmployee: async (req, res) => {
    try {
      const { id } = req.params;
      const { employee_id } = req.body;

      if (!employee_id) {
        return errorRes(res, 400, "employee_id is required");
      }

      const contact = await Model.ContactUs.findById(id);
      if (!contact) {
        return errorRes(res, 404, "Contact submission not found");
      }

      const employee = await Model.Admin.findById(employee_id);
      if (!employee) {
        return errorRes(res, 404, "Employee not found");
      }

      const updateData = {
        assigned_employee: employee_id,
        assigned_by: req.user._id,
      };

      const eventData = {
        assigned_employee: employee_id,
      };
      if (req.body.status !== undefined) {
        updateData.status = Number(req.body.status);
        eventData.status = Number(req.body.status);
      }

      const updatedContact = await Model.ContactUs.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      )
        .populate("assigned_employee", "admin_name email role")
        .populate("assigned_by", "admin_name email role");

      await Model.ContactHistory.create({
        contact_us_id: id,
        event_type: "assigned",
        actor_id: req.user._id,
        description: `Assigned contact to employee ${employee?.admin_name}`,
        data: eventData,
      });

      return successRes(res, 200, "Contact assigned successfully", updatedContact);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  addContactNote: async (req, res) => {
    try {
      const { contact_us_id, employee_id, note } = req.body;

      if (!contact_us_id || !employee_id || !note) {
        return errorRes(res, 400, "contact_us_id, employee_id and note are required");
      }

      const contact = await Model.ContactUs.findById(contact_us_id);
      if (!contact) {
        return errorRes(res, 404, "Contact submission not found");
      }

      const employee = await Model.Admin.findById(employee_id);
      if (!employee) {
        return errorRes(res, 404, "Employee not found");
      }

      const noteRecord = await Model.Notes.create({
        contact_us_id,
        employee_id,
        note,
      });

      await Model.ContactHistory.create({
        contact_us_id,
        event_type: "note_added",
        actor_id: req.user._id,
        description: "Note added to contact ticket",
        data: {
          note_id: noteRecord._id,
          employee_id,
        },
      });

      return successRes(res, 200, "Note saved successfully", noteRecord);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  getContactNotes: async (req, res) => {
    try {
      const { contact_us_id } = req.query;
      const query = {};
      if (contact_us_id) {
        query.contact_us_id = contact_us_id;
      }

      const notes = await Model.Notes.find(query)
        .populate("employee_id", "admin_name email role")
        .populate("contact_us_id", "name email telephone_number status");

      return successRes(res, 200, "Notes fetched successfully", notes);
    } catch (err) {
      return errorRes(res, 500, err.message);
    }
  },

  getContactHistory: async (req, res) => {
    try {
      const { id } = req.params;
      const contact = await Model.ContactUs.findById(id);
      if (!contact) {
        return errorRes(res, 404, "Contact submission not found");
      }

      const historyEntries = await Model.ContactHistory.find({ contact_us_id: id })
        .sort({ created_at: 1 })
        .populate("actor_id", "admin_name email role");

      return successRes(res, 200, "Contact history fetched successfully", historyEntries);
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

    const calculateGrowth = (current, previous) => {
      if (previous > 0) {
        return Number(
          (((current - previous) / previous) * 100).toFixed(2)
        );
      }

      return current > 0 ? 100 : 0;
    };

    const [
      totalEnquiries,
      newEnquiries,
      inProgressEnquiries,
      resolvedEnquiries,
      todayEnquiries,
      thisMonthEnquiries,
      lastMonthEnquiries,

      totalCurrentMonth,
      totalLastMonth,

      newCurrentMonth,
      newLastMonth,

      inProgressCurrentMonth,
      inProgressLastMonth,

      resolvedCurrentMonth,
      resolvedLastMonth,
    ] = await Promise.all([
      // Dashboard totals
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

      // Total enquiries comparison
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

      // New enquiries comparison
      Model.ContactUs.countDocuments({
        status: 0,
        createdAt: {
          $gte: currentMonthStart,
          $lt: nextMonthStart,
        },
      }),

      Model.ContactUs.countDocuments({
        status: 0,
        createdAt: {
          $gte: lastMonthStart,
          $lt: currentMonthStart,
        },
      }),

      // In Progress comparison
      Model.ContactUs.countDocuments({
        status: 1,
        createdAt: {
          $gte: currentMonthStart,
          $lt: nextMonthStart,
        },
      }),

      Model.ContactUs.countDocuments({
        status: 1,
        createdAt: {
          $gte: lastMonthStart,
          $lt: currentMonthStart,
        },
      }),

      // Resolved comparison
      Model.ContactUs.countDocuments({
        status: 2,
        createdAt: {
          $gte: currentMonthStart,
          $lt: nextMonthStart,
        },
      }),

      Model.ContactUs.countDocuments({
        status: 2,
        createdAt: {
          $gte: lastMonthStart,
          $lt: currentMonthStart,
        },
      }),
    ]);

    const totalGrowth = calculateGrowth(
      totalCurrentMonth,
      totalLastMonth
    );

    const newGrowth = calculateGrowth(
      newCurrentMonth,
      newLastMonth
    );

    const inProgressGrowth = calculateGrowth(
      inProgressCurrentMonth,
      inProgressLastMonth
    );

    const resolvedGrowth = calculateGrowth(
      resolvedCurrentMonth,
      resolvedLastMonth
    );

    const monthlyGrowth = calculateGrowth(
      thisMonthEnquiries,
      lastMonthEnquiries
    );

    return successRes(
      res,
      200,
      "Dashboard data fetched successfully",
      {
        total_enquiries: totalEnquiries,
        total_growth_percentage: totalGrowth,

        new_enquiries: newEnquiries,
        new_growth_percentage: newGrowth,

        in_progress_enquiries: inProgressEnquiries,
        in_progress_growth_percentage: inProgressGrowth,

        resolved_enquiries: resolvedEnquiries,
        resolved_growth_percentage: resolvedGrowth,

        today_enquiries: todayEnquiries,

        this_month_enquiries: thisMonthEnquiries,
        last_month_enquiries: lastMonthEnquiries,
        monthly_growth_percentage: monthlyGrowth,

        comparison: {
          current_month_enquiries: thisMonthEnquiries,
          last_month_enquiries: lastMonthEnquiries,
          difference:
            thisMonthEnquiries - lastMonthEnquiries,
          percentage_change: monthlyGrowth,
          trend:
            thisMonthEnquiries >= lastMonthEnquiries
              ? "up"
              : "down",
        },
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

    if (contact) {
      await Model.ContactHistory.create({
        contact_us_id: id,
        event_type: "status_changed",
        actor_id: req.user._id,
        description: `Status changed to ${Number(status)}`,
        data: {
          status: Number(status),
        },
      });
    }

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
      0: "Immigration Services",
      1: "CAF & Patronage",
      2: "Training & Courses",
      3: "Business Consulting",
      4: "Insurance",
      5: "Indian Consulate",
      6: "International Visas",
      7: "Other Services",
    };

    const totalEnquiries = await Model.ContactUs.countDocuments();

    const result = await Model.ContactUs.aggregate([
      {
        $group: {
          _id: "$service_of_interest",
          count: { $sum: 1 },
        },
      },
    ]);

    // Create default response with all services
    const chartData = Object.keys(objectTypeLabels).map((key) => ({
      service_of_interest: Number(key),
      label: objectTypeLabels[key],
      count: 0,
      percentage: 0,
    }));

    // Update counts from aggregation result
    result.forEach((item) => {
      const index = chartData.findIndex(
        (x) => x.service_of_interest === item._id
      );

      if (index !== -1) {
        chartData[index].count = item.count;
        chartData[index].percentage =
          totalEnquiries > 0
            ? Number(
                ((item.count / totalEnquiries) * 100).toFixed(2)
              )
            : 0;
      }
    });

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
