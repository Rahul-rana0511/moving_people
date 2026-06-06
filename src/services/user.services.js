import * as Model from "../models/index.js";
import { errorRes, successRes } from "../utils/response.js";
import "dotenv/config";
const userServices = {
createContactUs: async (req, res) => {
    try {
      const contact = await Model.ContactUs.create({...req.body});
      return successRes(res, 200, "Contact request submitted successfully", contact);
    } catch (error) {
      return errorRes(res, 500, error.message);
    }
  },
};

export default userServices;
