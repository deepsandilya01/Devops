import mongoose from "mongoose"

const envSchema = new mongoose.Schema({
   user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
   },
   appId:{
     type:String,
     unique:true,
     required:true
   },
   env:{
    type:Object,
    required:true
   }
})

const Env = mongoose.model("Env",envSchema)

export default Env
