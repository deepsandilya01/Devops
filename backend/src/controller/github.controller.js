import axios from "axios";
import User from "../model/user.model.js";
import config from "../config/config.js";

export const getAllRepo = async (req, res, next) => {
  try {
    const id = req.user.id;

    const user = await User.findById(id).select("+githubAccessToken");

    if (!user) {
      return next({ status: 401, message: "User not found" });
    }

    const response = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: `token ${user.githubAccessToken}`,
      },
      params: {
        per_page: 100, // max allowed
      },
    });

    // 🔥 transform data
    const repos = response.data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      isPrivate: repo.private,
      repoUrl: repo.html_url,
      cloneUrl: repo.clone_url,
      branch: repo.default_branch,
      language: repo.language,
      updatedAt: repo.updated_at,
    }));

    res.status(200).json({
      message: "User's Repo fetched Succesfully",
      success: true,
      repos,
    });
  } catch (err) {
    return next({
      status: err.response?.status || 500,
      message:
        err.response?.data?.message || err.message || "Failed to fetch repos",
    });
  }
};
