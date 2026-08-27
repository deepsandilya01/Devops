import mongoose from "mongoose";

const projectAnalysisSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        repoUrl: {
            type: String,
            required: true,
        },
        repoName: String,
        summary: String,
        techStack: [String],
        entryPoints: [String],
        folderExplanation: [
            {
                path: String,
                purpose: String,
            },
        ],
    },
    { timestamps: true },
);

export default mongoose.model("ProjectAnalysis", projectAnalysisSchema);