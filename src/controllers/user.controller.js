import userServices from "../services/user.services.js";

const createContactUs = async (req, res) => {
  await userServices.createContactUs(req, res);
};

const trackVisitor = async (req, res) => {
  await userServices.trackVisitor(req, res);
};

export { createContactUs, trackVisitor };
