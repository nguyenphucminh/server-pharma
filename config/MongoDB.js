import mongoose from 'mongoose'
const connectDatabase = async() =>{
    try{
        mongoose.set("strictQuery", false);
        mongoose.connect(process.env.MONGO_URI,{
            useUnifiedTopology: true,
            useNewUrlParser: true
        })
        console.log('✔️  Mongo Connected !')
    }
    catch(error){
        console.log(`❌  Error: ${error.message}`)
        process.exit(1)
    }
}
export default connectDatabase