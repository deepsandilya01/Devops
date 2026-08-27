import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import net from "net"


export const execAsync = promisify(exec)

//clone the repo

export async function CloneRepo(basePath, repoUrl,userToken) {
    return new Promise((resolve, reject) => {
        console.log("cloning...")
        //delete the existing repo
        console.log("Deleting existing repository if exists...")
        if (fs.existsSync(basePath)) {
            fs.rmSync(basePath, { recursive: true, force: true })
        }
        console.log("Making fresh directory...")
        // Ensure parent directory exists
        const parentDir = path.dirname(basePath);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }
        console.log("repoUrl:", repoUrl);
        console.log("token:",userToken)
        const repoWithAuth = repoUrl.replace(
  "https://",
  `https://${userToken}@`
);
console.log(repoWithAuth)
        //clone the repo
        exec(`git clone ${repoWithAuth} ${basePath}`, (err, stdout, stderr) => {
            if (err) {
                console.log(`Error in cloning repo : ${err}`)
                return resolve({ success: false, message: `Error from nodejs while cloning : ${err}` })
            }
            resolve({ success: true, message: `Repo cloned successfully in nodejs : ${stdout}` })

        })

    })
}

// returns all directories with package.json in project

function findPackageJsonDirs(basePath) {
    const dirs = []
    // get all root files of the project
    const files = fs.readdirSync(basePath)

    for (const file of files) {
        const fullPath = path.join(basePath, file)


        //check whether the root file is a directory or not
        if (fs.statSync(fullPath).isDirectory()) {

            //if its directory check for package.json
            if (fs.existsSync(path.join(fullPath, "package.json"))) {

                // if package.json is present then push in dirs array
                dirs.push(fullPath)
            }
        }
    }

    return dirs
}


// get the type of project (frontend/backend) which is containing package.json

function getTypeFromPkg(pkgPath) {

    const pkg = JSON.parse(fs.readFileSync(pkgPath))

    const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
    }

    //checking nextjs first becuse it also have react dependency
    if (deps.next) return "nextjs"
    if (deps.react) return "frontend"
    if (deps.express) return "backend"

    return "unknown"
}

// detect the repo type works for react projects,nodejs projects and MERN projects

export async function detectRepoType(basePath) {

    //check if the root package.json exists to know its only frontend or backend
    const rootPkgExists = fs.existsSync(path.join(basePath, "package.json"))

    //get all subdirectories with package.json
    const subDirs = findPackageJsonDirs(basePath)


    // 🟢 STATIC
    if (!rootPkgExists && subDirs.length === 0) {
        const files = fs.readdirSync(basePath)

        const hasHtml = files.some(file => file.endsWith(".html"))

        if (hasHtml) {
            return { RepoType: "static" }
        }
        else {
            return { RepoType: "unknown" }
        }
    }

    // 🟡 Single project
    if (rootPkgExists && subDirs.length === 0) {
        const type = getTypeFromPkg(path.join(basePath, "package.json"))
        return { RepoType: type }
    }

    if (subDirs.length === 1) {
        const type = getTypeFromPkg(path.join(subDirs[0], "package.json"))
        return { RepoType: type }
    }
    // 🔥 FULLSTACK (multiple apps)
    if (subDirs.length >= 2) {
        return {
            RepoType: "fullstack",
            structure: subDirs.map(dir => ({
                basePath: dir,
                type: getTypeFromPkg(path.join(dir, "package.json"))
            }))
        }
    }

}


//function to check if port is free

function isPortFree(port) {
    return new Promise((resolve) => {
        const server = net.createServer()

        server.once("error", () => resolve(false)) // in use
        server.once("listening", () => {
            server.close(() => resolve(true)) // free
        })

        server.listen(port)
    })
}


// find the next available port starting from 3000

export async function getNextAvailablePort() {
    const START_PORT = 5000
    const END_PORT = 6000

    for (let port = START_PORT; port <= END_PORT; port++) {
        const free = await isPortFree(port)
        if (free) return port
    }
    throw new Error("No free ports available")

}




//function to build docker image

async function buildImage(basePath, appId) {


    const imageName = `app_${appId}`
    await execAsync(`docker build -t ${imageName} ${basePath}`)
    return imageName
}

// start the docker container of built image

 async function runContainer(imageName, port, frontend, env,basePath) {

    let envString;
    if (env) {
        envString = Object.entries(env).map(([key, value]) => `-e ${key}=${value}`).join(" ");
    }


    const { stdout } = await execAsync(
        `docker run -d  --restart unless-stopped -p ${port}:${frontend ? 80 : 3000} ${envString ? envString : ""} ${imageName}`
    )


    return stdout.trim() // containerId
}


//deploy static site

export async function deployStatic(basePath, appId) {
    const dockerfile = `
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY . /usr/share/nginx/html

RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html index.htm; try_files \\$uri \\$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`

    fs.writeFileSync(path.join(basePath, "Dockerfile"), dockerfile)

    //building the docker image
    const imageName = await buildImage(basePath, appId);


    const port = await getNextAvailablePort()

    //running the container
    const containerId = await runContainer(imageName, port, true,null,basePath)



    return {
        containerId,
        port,
    }
}


//deploy frontend

export async function deployFrontend(basePath, appId) {

     const pkgExistInRoot = fs.existsSync(path.join(basePath, "package.json"))

    if (!pkgExistInRoot) {
        const subDirs = findPackageJsonDirs(basePath)

        basePath = subDirs[0]

    }
    const dockerfile = `
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html

RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html index.htm; try_files \\$uri \\$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`

    fs.writeFileSync(path.join(basePath, "Dockerfile"), dockerfile)

    //building the docker image
    const imageName = await buildImage(basePath, appId);

    //get next available port
    const port = await getNextAvailablePort()

    //running the container
    const containerId = await runContainer(imageName, port, true,null,basePath)



    return {
        containerId,
        port,
    }
}


//deploy backend

export async function deployBackend(basePath, appId, env) {

    const pkgExistInRoot = fs.existsSync(path.join(basePath, "package.json"))

    if (!pkgExistInRoot) {
        const subDirs = findPackageJsonDirs(basePath)

        basePath = subDirs[0]

    }

    const dockerfile = `
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]`

    fs.writeFileSync(path.join(basePath, "Dockerfile"), dockerfile)

    //building the docker image
    const imageName = await buildImage(basePath, appId);

    //get next available port
    const port = await getNextAvailablePort()

    //running the container
    const containerId = await runContainer(imageName, port, false, env,basePath)



    return {
        containerId,
        port,
    }
}

//check js file recursively in directory

function scanFiles(dir) {
    const entries = fs.readdirSync(dir)

    let results = []

    for (const entry of entries) {
        const fullPath = path.join(dir, entry)

        if (fs.statSync(fullPath).isDirectory() && entry != "node_modules") {
            results = results.concat(scanFiles(fullPath))
        } else if (entry.endsWith(".js")) {
            results.push(fullPath)
        }
    }

    return results
}

//check whether backend serves frontend or not

function checkBackendServesFrontend(basePath) {

    const files = scanFiles(basePath)


    for (const file of files) {


        if (fs.statSync(file).isFile() && file.endsWith(".js")) {
            const content = fs.readFileSync(file, "utf-8")


            const match = content.match(/const\s+(\w+)\s*=\s*express\(\)/)
            const appName = match ? match[1] : "app"

            const hasStatic = content.includes("express.static")
            const hasWildcard =
                content.includes(`${appName}.get("*"`) ||
                content.includes(`${appName}.get('*'`) ||
                content.includes(`${appName}.get('*' `) ||
                content.includes(`${appName}.get( '*'`) ||
                content.includes(`${appName}.get("*" `) ||
                content.includes(`${appName}.get( "*"`) ||
                content.includes(`${appName}.use("*name"`) ||
                content.includes(`${appName}.use('*name'`) ||
                content.includes(`${appName}.get("*name"`) ||
                content.includes(`${appName}.get('*name'`) ||
                content.includes("Auto-injected frontend serving")


            if (hasStatic && hasWildcard) {
                return true
            }
        }
    }

    return false
}


//find the express app file

function findExpressAppFile(files) {
    for (const file of files) {
        const content = fs.readFileSync(file, "utf-8")

        const hasExpress =
            content.includes("require('express')") ||
            content.includes('require("express")') ||
            content.includes("from 'express'") ||
            content.includes('from "express"')

        const hasAppInit =
            content.includes("express()")

        if (hasExpress && hasAppInit) {
            return file
        }
    }

    return null
}



// get module type of backend

function getModuleType(basePath) {
    const pkgPath = path.join(basePath, "package.json")

    if (!fs.existsSync(pkgPath)) return "commonjs" // default

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))

    return pkg.type === "module" ? "esm" : "commonjs"
}


//function to inject frontend serving

async function injectFrontendServing(appFile, moduleType) {
    let content = fs.readFileSync(appFile, "utf-8")

    const match = content.match(/(const|let|var)\s+(\w+)\s*=\s*express\(\)/)
    const appName = match ? match[2] : "app"

    let importBlock = ""
    let dirBlock = ""
    // 🔹 Handle import safely
    if (moduleType === "esm") {
        if (!content.includes('from "path"') && !content.includes("from 'path'")) {
            importBlock += `import path from "path"\n`
        }

        if (!content.includes("fileURLToPath")) {
            importBlock += `import { fileURLToPath } from "url"\n`
        }

        if (!content.includes("import { dirname")) {
            importBlock += `import { dirname } from "path"\n`
        }

        if (!content.includes("__dirname")) {
            dirBlock = `
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
`
        }
    }
    else {
        if (!content.includes("require('path')") && !content.includes('require("path")')) {
            importBlock += `const path = require("path")\n`
        }
    }


    if (importBlock) {
        content = importBlock + "\n" + content
    }

    console.log(appName)

    // 🔹 Append middleware
    const injection = `
 ${dirBlock} 
// 🔥 Auto-injected frontend serving
${appName}.use(express.static(path.join(__dirname, "../public")))

${appName}.get("*name", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"))
})
`
    content += injection

    // ✅ Append at end (safe)

    console.log(appFile,"appfile ka path")
    await fs.promises.writeFile(appFile, content)
    console.log(content)
    console.log("✅ Frontend serving injected safely")
}




//deploy fullstack

export async function deployFullstack(basePath, appId, env) {



    const subDirs = findPackageJsonDirs(basePath)

    let frontendPath;
    let backendPath;
    
    let frontendDir;
    let backendDir;

    for (const dir of subDirs) {
        const type = getTypeFromPkg(path.join(dir, "package.json"));
        if (type === "frontend") {
            frontendPath = dir;
       
            frontendDir = dir.split("/").pop();
        }
        else if (type === "backend") {
            backendPath = dir;
            backendDir = dir.split("/").pop();
        }
    }

    if (!frontendPath || !backendPath) {
        throw new Error("Frontend or Backend not found")
    }
         console.log(frontendPath,"this is the path")
    console.log(frontendDir,"frontend dir")
    console.log(backendDir,"backend dir")

    const dockerfile = `
# Stage 1: build frontend
FROM node:20-alpine AS build

WORKDIR /app/frontend
COPY ${frontendDir}/package*.json ./
RUN npm install
COPY ${frontendDir} .
RUN npm run build


# Stage 2: backend server
FROM node:20-alpine

WORKDIR /app/backend

COPY ${backendDir}/package*.json ./
RUN npm install

COPY ${backendDir} .
COPY --from=build /app/frontend/dist ./public

EXPOSE 3000

CMD ["npm", "start"]`
    fs.writeFileSync(path.join(basePath, "Dockerfile"), dockerfile)

    const frontendServes = checkBackendServesFrontend(backendPath)
    const moduleType = getModuleType(backendPath);
    const files = scanFiles(backendPath)
    const appFile = findExpressAppFile(files)
    if (!appFile) {
        console.log("no express app found in folder")
        return
    }

    if (frontendServes) {
        console.log("backend does  serve frontend automatically.")
    } else {
       await injectFrontendServing(appFile, moduleType)
    }



    //building the docker image
    const imageName = await buildImage(basePath, appId);

    //get next available port
    const port = await getNextAvailablePort()

    //running the container
    const containerId = await runContainer(imageName, port, false, env,basePath)



    return {
        containerId,
        port,
    }
}


