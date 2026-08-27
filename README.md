# QuickLive

## 1. 🚀 What is QuickLive?

QuickLive is a simple deployment panel.

It helps users deploy their projects from GitHub.

The user connects GitHub, chooses a project, clicks deploy, and gets a live link.

It saves time because users do not need to set up servers manually.

---

## 2. ✨ What can you do with it?

- Deploy your GitHub project easily.
- Connect your GitHub account.
- See your GitHub repositories.
- Add environment variables before deployment.
- Watch live deployment logs.
- Get a live URL for your project.
- View all deployed projects from the dashboard.
- Admin can see users and projects.

---

## 3. 🌐 Live Demo & Repo

### 🔗 Live Website

https://quicklive.tech/

When you open this link, you will see the QuickLive website.

You can create an account, login, connect GitHub, and deploy projects.

### 🔗 GitHub Repository 

This repo contains the full code of QuickLive.

It has two main parts:

- `frontend` → the website users see
- `backend` → the server that handles login, GitHub, and deployment

---

## 4. ⚙️ Setup Guide (STEP-BY-STEP) 🔥

Follow these steps slowly.

Do one step at a time.

### Step 1: Install required tools

You need these tools on your computer:

- Node.js
- npm
- Git
- MongoDB
- Redis
- Docker

### Why do we need these?

- Node.js runs the project.
- npm installs packages.
- Git downloads the project.
- MongoDB stores users and projects.
- Redis helps with login/logout and cache.
- Docker builds and runs deployed projects.

✅ Tip: If you only want to open the frontend, you can start with Node.js and npm.

✅ Tip: If you want real deployment to work, Docker must be running.

---

### Step 2: Clone the project

Open your terminal.

Run this command:

```bash
git clone https://github.com/Aryan-hatake/Deployment_Panel.git
```

Now go inside the project folder:

```bash
cd Deployment_Panel
```

---

### Step 3: Install dependencies

This project has two folders.

You must install packages in both folders.

#### Install backend packages

```bash
cd backend
npm install
```

#### Install frontend packages

Go back to the main folder:

```bash
cd ..
```

Now go to frontend:

```bash
cd frontend
npm install
```

---

### Step 4: Setup `.env` file

The backend needs a `.env` file.

Create this file inside the `backend` folder:

```bash
backend/.env
```

Add these values:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_url

REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password

JWT_SECRET=your_secret_key

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK=http://localhost:5000/api/auth/github/callback

BASE_DOMAIN=quicklive.tech

MISTRAL_API_KEY=your_mistral_api_key
```

### What does each value mean?

`PORT`

This is the backend server port.

Example:

```env
PORT=5000
```

`NODE_ENV`

This tells the app if it is running locally or live.

For local use:

```env
NODE_ENV=development
```

`MONGO_URI`

This is your MongoDB database link.

It stores users, projects, and deployment data.

`REDIS_HOST`

This is your Redis host.

Redis is used for cache and logout token storage.

`REDIS_PORT`

This is your Redis port.

Common local Redis port:

```env
REDIS_PORT=6379
```

`REDIS_PASSWORD`

This is your Redis password.

If your Redis has no password, you may need to update the backend Redis setup.

`JWT_SECRET`

This is a private secret used for login tokens.

Example:

```env
JWT_SECRET=my_super_secret_key
```

Do not share this value.

`GITHUB_CLIENT_ID`

This comes from your GitHub OAuth app.

It helps users login with GitHub.

`GITHUB_CLIENT_SECRET`

This also comes from your GitHub OAuth app.

Keep it private.

`GITHUB_CALLBACK`

This is the URL GitHub sends the user back to after login.

For local backend:

```env
GITHUB_CALLBACK=http://localhost:5000/api/auth/github/callback
```

`BASE_DOMAIN`

This is the main domain used for live deployed apps.

Example:

```env
BASE_DOMAIN=quicklive.tech
```

`MISTRAL_API_KEY`

This is used for AI project summary features.

This value is optional for basic deployment.

If you do not add it, AI summaries may not work.

---

### Step 5: Run the project

You need two terminals.

### Terminal 1: Start backend

Go to the backend folder:

```bash
cd backend
```

Run:

```bash
npm run dev
```

Backend will start on:

```text
http://localhost:5000
```

### Terminal 2: Start frontend

Go to the frontend folder:

```bash
cd frontend
```

Run:

```bash
npm run dev
```

Frontend will start on:

```text
http://localhost:5173
```

Open this in your browser:

```text
http://localhost:5173
```

### Beginner note for local backend

The frontend proxy is set inside:

```text
frontend/vite.config.js
```

If you want frontend to use your local backend, set the proxy target to:

```js
target: "http://localhost:5000"
```

Then restart the frontend server.

---

## 5. 🔥 Features (Explain Simply)

### 🔐 Admin Login

Admin login lets an admin open the admin panel.

The admin can see users and deployed projects.

How it works:

- Admin logs in like a normal user.
- Backend checks the user role.
- If the role is `admin`, the admin panel is allowed.
- If the role is `user`, the admin panel is blocked.

---

### 🐙 GitHub Connection

Users can connect their GitHub account.

How it works:

- User clicks GitHub login.
- GitHub asks for permission.
- GitHub sends the user back to QuickLive.
- QuickLive saves the GitHub access token.
- QuickLive can now fetch the user's repositories.

---

### 🚀 Deployment System

Users can deploy a project from GitHub.

How it works:

- User selects a GitHub repository.
- Backend clones the repository.
- Backend checks the project type.
- Docker builds the project.
- Docker starts the project in a container.
- QuickLive creates a live URL.

Supported project types include:

- Static HTML projects
- React frontend projects
- Node.js backend projects
- Full stack projects with frontend and backend folders

Note: Next.js projects are not supported yet.

---

### 📜 Live Logs

Live logs show what is happening during deployment.

How it works:

- Backend writes deployment steps into a log file.
- Frontend reads the logs.
- User can see the deployment progress.

Example logs:

```text
[SYS] Cloning repository...
[SYS] Detected project type: frontend
[SYS] Starting Docker build process...
[SYS] Docker deployment successful!
```

---

### 🌍 Live URL

After deployment, the user gets a live URL.

Example:

```text
https://abc123.quicklive.tech/
```

This link opens the deployed project.

---

## 6. 🔄 How Deployment Works (Simple Flow)

Think of deployment like a small story.

1. User logs in to QuickLive.
2. User connects GitHub.
3. User selects a repository.
4. User clicks deploy.
5. Backend clones the GitHub repository.
6. Backend checks what type of project it is.
7. Backend creates a Docker build.
8. Docker starts the project.
9. Backend saves project details in MongoDB.
10. User sees live logs on the screen.
11. User gets a live link.
12. User opens the live link and sees the deployed project.

Simple flow:

```text
Click Deploy
     ↓
Backend clones repo
     ↓
Backend detects project type
     ↓
Docker builds project
     ↓
Docker runs project
     ↓
QuickLive gives live URL
```


---

## 7. 🔐 Admin Login (IMPORTANT)

Admin login uses the normal login page.

Example:

```text
Email: admin@example.com
Password: ********
```

Do not write the real password in the README.

### Where do admin credentials come from?

Admin credentials come from the users stored in MongoDB.

Each user has a role.

Example roles:

```text
user
admin
```

Only users with this role can open the admin panel:

```text
admin
```

If your account is not admin, update the user role in MongoDB.

Example:

```text
role: admin
```

✅ Tip: Keep admin login private.

✅ Tip: Never share the real admin password.

---

## 8. 🧰 Tech Used (Explain Simply)

- React → used to build the frontend UI.
- Vite → used to run and build the React app fast.
- Redux Toolkit → used to store app data in frontend.
- Node.js → used to run the backend.
- Express → used to create backend APIs.
- MongoDB → used to store users and projects.
- Mongoose → used to work with MongoDB easily.
- Redis → used for cache and logout handling.
- Passport GitHub → used for GitHub login.
- Docker → used to build and run deployed projects.
- Socket.IO / live stream logs → used to show logs while deploying.
- Mistral AI → used for AI project summaries.

---

## 9. 📁 Project Structure (Simple)

```text
Deployment_Panel
│
├── backend
│   ├── server.js
│   ├── package.json
│   └── src
│       ├── config
│       ├── controller
│       ├── middleware
│       ├── model
│       ├── routes
│       ├── services
│       ├── socket
│       └── utils
│
└── frontend
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src
        ├── features
        ├── App.jsx
        ├── AppRoutes.jsx
        └── main.jsx
```

### Folder meaning

`frontend`

This contains the website UI.

Users see this part in the browser.

`backend`

This contains the server code.

It handles login, GitHub, deployment, database, and logs.

`backend/src/config`

This contains setup files for MongoDB, Redis, and app config.

`backend/src/controller`

This contains the main backend actions.

Example: login, deploy project, get logs.

`backend/src/routes`

This contains API paths.

Example:

```text
/api/auth/login
/api/project/deploy
```

`backend/src/model`

This contains database models.

Example: User and Project.

`backend/src/utils`

This contains helper code.

Example: clone repo, build Docker image, find project type.

---

## 10. 💡 Tips for Users

### Common mistake: backend does not start

Check your `.env` file.

Make sure all required values are added.

---

### Common mistake: MongoDB error

Check `MONGO_URI`.

Make sure MongoDB is running.

If you use MongoDB Atlas, make sure your IP address is allowed.

---

### Common mistake: Redis error

Check Redis host, port, and password.

Make sure Redis is running.

---

### Common mistake: GitHub login does not work

Check your GitHub OAuth app.

Make sure callback URL matches:

```text
http://localhost:5000/api/auth/github/callback
```

For live site, use your live callback URL.

---

### Common mistake: deployment fails

Make sure Docker is installed and running.

Also check if the project has a valid `package.json`.

For frontend apps, make sure this command works:

```bash
npm run build
```

For backend apps, make sure this command works:

```bash
npm start
```

---

### Common mistake: frontend cannot call backend

Check this file:

```text
frontend/vite.config.js
```

For local backend, proxy target should be:

```js
target: "http://localhost:5000"
```

Then restart frontend.

---

### Best practices

- Keep `.env` private.
- Do not upload passwords to GitHub.
- Use strong `JWT_SECRET`.
- Keep Docker running before deployment.
- Check logs when deployment fails.
- Start backend first, then frontend.

---

## 11. 🚀 Future Improvements

Here are simple ideas to improve QuickLive:

- Add support for Next.js projects.
- Add custom domain support.
- Add better deployment status messages.
- Add email alerts after deployment.
- Add project restart button.
- Add project pause/resume button.
- Add team members and roles.
- Add more detailed Docker error messages.
- Add one-click redeploy from GitHub changes.

---

## ✅ Final Note

QuickLive helps users deploy projects without doing hard server setup.

Start with the setup steps. 

Run backend and frontend.

Connect GitHub.

Click deploy.

Then open your live link. 🎉
