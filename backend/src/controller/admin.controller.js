import Project from "../model/project.model.js";
import User from "../model/user.model.js";

export async function getAllUsers(req, res, next) {
  try {
    const users = await User.find({ role: "user" });

    res.status(200).json({
      message: "All user fetched succesfull",
      users,
      success: true,
    });
  } catch (error) {
    return next({
      status: 500,
      message: error.message || "Internal server error",
    });
  }
}

export async function getAllProjects(req, res, next) {
  try {
    const projects = await Project.find();

    res.status(200).json({
      message: "All projects fetched succesfully",
      projects,
      success: true,
    });
  } catch (error) {
    return next({
      status: 500,
      message: error.message || "Internal server error",
    });
  }
}

export async function deleteProjectById(req, res, next) {
  try {
    const id = req.params.projectId;

    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return res.status(404).json({
        message: "Project not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Project deleted successfully",
      success: true,
    });
  } catch (error) {
    return next({
      status: 500,
      message: error.message || "Internal server error",
    });
  }
}
