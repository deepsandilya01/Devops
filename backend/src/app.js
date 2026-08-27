import express from "express";
import AuthRouter from "./routes/auth.routes.js";
import adminRouter from "./routes/admin.routes.js";
import cookieParser from "cookie-parser";
import config from "./config/config.js";
import { Strategy as GithubStrategy } from "passport-github";
import cors from "cors";
import passport from "passport";
import User from "./model/user.model.js";
import GithubRouter from "./routes/github.routes.js";
import ProjectRouter from "./routes/project.routes.js";
import AdminRouter from "./routes/admin.routes.js";
import GenerateRouter from "./routes/generate.routes.js";
import morgan from "morgan";
import { proxyApps } from "./middleware/project.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import errorRouter from "./routes/error.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieParser({
    httpOnly: true,
    secure: config.NODE_ENV === "production",
  }),
);

app.use(morgan("dev"));

app.use(
  cors({
     origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const allowedExact = [
        "https://quicklive.tech",
        "http://3.25.65.255",
        "http://3.25.65.255:80",
        "http://3.25.65.255:3000",
      ];

      // ✅ allow all subdomains of quicklive.tech
      if (
        allowedExact.includes(origin) ||
        origin.endsWith(".quicklive.tech")
      ) {
        return callback(null, true);
      }

      console.warn("⚠️ CORS blocked:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 3600,
  }),
);

app.use(passport.initialize());

passport.use(
  new GithubStrategy(
    {
      clientID: config.GITHUB_CLIENT_ID,
      clientSecret: config.GITHUB_CLIENT_SECRET,
      callbackURL: config.GITHUB_CALLBACK,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 🔹 Extract data safely
        const email = profile.emails?.[0]?.value || null;

        console.log(accessToken);
        console.log(refreshToken);

        let user;

        // 🔹 Try find by githubId first
        user = await User.findOne({ githubId: profile.id }).select(
          "+githubAccessToken",
        );

        // 🔹 If not found, try by email (merge accounts case)
        if (!user && email) {
          user = await User.findOne({ email }).select("+githubAccessToken");
        }
     
        // 🔹 If still not found → create new
        if (!user) {
          user = await User.create({
            githubId: profile.id,
            email,
            fullName: profile.displayName || profile.username,
            githubAccessToken: accessToken,
          });
          
        }

        // 🔹 If found but missing githubId → link account
        if (user && !user.githubId) {
          user.githubId = profile.id;
          user.githubAccessToken = accessToken;
          await user.save();
        }

        if (user && user.githubId) {
          user.githubAccessToken = accessToken;
          await user.save();
        }

        console.log(user)

        return done(null, user); // ✅ ALWAYS return DB user
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

app.use("/api/auth", AuthRouter);
app.use("/api/github", GithubRouter);
app.use("/api/project", ProjectRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/generate", GenerateRouter);
app.use("/api/error", errorRouter);
app.use("/", proxyApps);
app.use(errorMiddleware);

// Error middleware (must be last)
app.use(errorMiddleware);

export default app;
