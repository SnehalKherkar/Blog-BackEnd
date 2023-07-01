const jwt=require('jsonwebtoken');
const jwt_pass=require("./auth");

const verify_jwt=async(req,res,next)=>{
    try {
        const token=await req.headers.authorization;
        req.decode=jwt.verify(token, jwt_pass);
        next();
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:"Invalid Token",
            data:[]
        });
    }
}

module.exports=verify_jwt;