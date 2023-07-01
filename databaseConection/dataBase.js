const mongoose=require('mongoose');

const connectDb=async()=>{
    try {
        const conn= await mongoose.connect(`mongodb://127.0.0.1:27017/blogapp`)
        console.log(`MongoDb connected successfully! ${conn.connection.host}`)
    } catch (error) {
        console.log(`Error in Connecting Database ${error.message}`);
        process.exit(1);
    }
}

module.exports=connectDb;