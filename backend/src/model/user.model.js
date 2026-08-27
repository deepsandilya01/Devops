import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
    },
    email: {
      type: String,
      required: function () {
        return !this.githubId;
      },
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: function () {
        return !this.githubId;
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Password won't be returned by default
    },
    contact: {
      type: Number,
      required: function () {
        return !this.githubId;
      },
      match: [/^\d{10}$/, "Please provide valid Contact Number"],
    },
    tier: {
      type: String,
      enum: ["free", "starter", "advance"],
      default: "free",
    },
    githubId: {
      type: String,
      default: "",
    },
    githubAccessToken: {
      type: String,
      default:"",
      select: false, // 🔥 important (hidden by default)
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) {
    return;
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    return;
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
