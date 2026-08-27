import Project from '../model/project.model.js'
import { createProxyMiddleware } from 'http-proxy-middleware';



export async function proxyApps(req, res, next) {
    try {
        const host = req.headers.host
        console.log(host)
        
        const appId = host.split(".")[0]

        const project = await Project.findOne({ appId });
            

        if (!project) {
            return next();
        }

    

        const proxy = createProxyMiddleware({
            target: `http://localhost:${project.port}`,
            changeOrigin: true,
            pathRewrite: {
                "^/app/[^/]+": ""
            }
        })

        proxy(req, res, next)
    } catch (err) {
        console.log("err is in proxy",err)
        next({ status: 500, message: "Proxy error: " + err.message });
    }
}