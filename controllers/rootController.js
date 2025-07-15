const sample = require('../models/test');

exports.root = async (req, res)=>{
    try{
        res.send("server running fine");
    }
    catch(err){
        console.log(err);
    }
};