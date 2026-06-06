import userServices from "../services/user.services.js";

const createContactUs = async (req, res) => {
  await userServices.createContactUs(req, res);
};

export { createContactUs };
