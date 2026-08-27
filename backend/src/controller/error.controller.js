import { generateErrorExplaination } from "../services/ai.service.js";

export async function getErrorExplaination(req, res, next) {
  const { error, context = "" } = req.body;

  try {
    const response = await generateErrorExplaination(error, context);

    res.status(200).json({
      message: "Error Explaination",
      success: true,
      explaination: response,
    });
  } catch (err) {
    return next({
      status: err.response?.status || 500,
      message:
        err.response?.data?.message || err.message || "Something went wrong",
    });
  }
}
