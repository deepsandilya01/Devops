import mongoose from "mongoose"

const projectSchema = new mongoose.Schema({
    appId: {
        type: String,
        required: true,
        unique: true
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    repoUrl: {
        type: String,
        required: true
    },
    containerID: {
        type: String,
    },
    status: {
        type: String,
        enum: ['building', 'running', 'failed', 'suspended','redeploying'],
        default: 'building'
    },
    port: {
        type: Number
    },
    type: {
        RepoType:String,
        structure: {
            type:Array,
            default:[]
        }
    },
}, { timestamps: true })


const Project = mongoose.model('Project',projectSchema)

export default Project