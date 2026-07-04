import * as Model from "../models/index.js";
import { errorRes, successRes } from "../utils/response.js";
import "dotenv/config";

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0]?.trim() || null;
  }
  return req.socket?.remoteAddress || req.ip || null;
};

const getCountryFromIp = async (ip) => {
  if (!ip || ip === "::1" || ip === "::ffff:127.0.0.1") {
    return { country: "Localhost", country_code: "LOCAL" };
  }

  try {
    const response = await fetch(`https://ipwho.is/${ip}`);
    if (!response.ok) {
      return { country: null, country_code: null };
    }

    const data = await response.json();
    return {
      country: data?.country || null,
      country_code: data?.country_code || null,
      city: data?.city || null,
      region: data?.region || null,
    };
  } catch (error) {
    return { country: null, country_code: null, city: null, region: null };
  }
};

const userServices = {
  createContactUs: async (req, res) => {
    try {
      const contact = await Model.ContactUs.create({
        ...req.body,
      });

      await Model.ContactHistory.create({
        contact_us_id: contact._id,
        event_type: "created",
        actor_id: req.user?._id || null,
        description: "Ticket created",
        data: {
          status: contact.status,
        },
      });

      return successRes(res, 200, "Contact request submitted successfully", contact);
    } catch (error) {
      return errorRes(res, 500, error.message);
    }
  },

  trackVisitor: async (req, res) => {
    try {
      const { timezone, language, page } = req.body || {};
      console.log({
    xForwardedFor: req.headers["x-forwarded-for"],
    xRealIp: req.headers["x-real-ip"],
    reqIp: req.ip,
    remoteAddress: req.socket.remoteAddress,
  });

      const ip_address = getClientIp(req);
      const geo = await getCountryFromIp(ip_address);

      const visitor = await Model.Visitor.create({
        timezone,
        language,
        page,
        ip_address,
        country: geo.country,
        country_code: geo.country_code,
        city: geo.city,
        region: geo.region,
        user_agent: req.headers["user-agent"],
        referrer: req.headers.referer || null,
      });

      return successRes(res, 200, "Visitor tracked successfully", visitor);
    } catch (error) {
      return errorRes(res, 500, error.message);
    }
  },
};

export default userServices;
