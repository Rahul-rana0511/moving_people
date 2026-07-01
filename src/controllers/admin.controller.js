import adminServices from "../services/admin.services.js";

const createSuperAdmin = async (req, res) => {
  await adminServices.createSuperAdmin(req, res);
};

const createAdmin = async (req, res) => {
  await adminServices.createAdmin(req, res);
};

const adminLogin = async (req, res) => {
  await adminServices.adminLogin(req, res);
};

const changePassword = async (req, res) => {
  await adminServices.changePassword(req, res);
};

const forgotpassword = async (req, res) => {
  await adminServices.forgotpassword(req, res);
};

const createEmployee = async (req, res) => {
  await adminServices.createEmployee(req, res);
};

const getEmployeeList = async (req, res) => {
  await adminServices.getEmployeeList(req, res);
};

const resetPassword = async (req, res) => {
  await adminServices.resetPassword(req, res);
};

const resendOTP = async (req, res) => {
  await adminServices.resendOTP(req, res);
};

const verifyOTP = async (req, res) => {
  await adminServices.verifyOTP(req, res);
};

const getContactUsList = async (req, res) => {
  await adminServices.getContactUsList(req, res);
};

const getContactUsDetail = async (req, res) => {
  await adminServices.getContactUsDetail(req, res);
};

const getTopContactUsCountries = async (req, res) => {
  await adminServices.getTopContactUsCountries(req, res);
};

const assignContactToEmployee = async (req, res) => {
  await adminServices.assignContactToEmployee(req, res);
};

const addContactNote = async (req, res) => {
  await adminServices.addContactNote(req, res);
};

const getContactNotes = async (req, res) => {
  await adminServices.getContactNotes(req, res);
};

const getContactHistory = async (req, res) => {
  await adminServices.getContactHistory(req, res);
};

const getProfile = async (req, res) => {
  await adminServices.getProfile(req, res);
};

const editProfile = async (req, res) => {
  await adminServices.editProfile(req, res);
};
const getContactUsDashboard = async (req, res) => {
  await adminServices.getContactUsDashboard(req, res);
};
const updateContactUsStatus = async (req, res) => {
  await adminServices.updateContactUsStatus(req, res);
};
const deleteContactUs = async (req, res) => {
  await adminServices.deleteContactUs(req, res);
};
const getEnquiryTypeChart = async (req, res) => {
  await adminServices.getEnquiryTypeChart(req, res);
};
const getLastSixMonthsEnquiriesChart = async (req, res) => {
  await adminServices.getLastSixMonthsEnquiriesChart(req, res);
};

export {
  createSuperAdmin,
  createAdmin,
  createEmployee,
  getEmployeeList,
  adminLogin,
  changePassword,
  forgotpassword,
  assignContactToEmployee,
  addContactNote,
  getContactNotes,
  getContactHistory,
  getContactUsList,
  getContactUsDetail,
  getTopContactUsCountries,
  getProfile,
  editProfile,
  resetPassword,
  verifyOTP,
  updateContactUsStatus,
  deleteContactUs,
  getContactUsDashboard,
  getEnquiryTypeChart,
  getLastSixMonthsEnquiriesChart,
  resendOTP,
};
