const express=require('express');
const app=express();
const body_parser=require('body-parser');
app.use(body_parser.json());
const cors=require('cors');
app.use(cors());
const connectDb=require('./databaseConection/dataBase');
const router=require('./Routes');

connectDb();

app.get('/',(req,res)=>{
    res.send('Hello World!');
});

app.use("/blogapp",router);

app.listen(5000, ()=>{
    console.log("Server is listening on port 5000");
});