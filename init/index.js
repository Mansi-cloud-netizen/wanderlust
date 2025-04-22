const mongoose=require ('mongoose');
const initdata=require ("./data.js");
const Listing=require ("../models/listing.js");

async function main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}
main().then((res)=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
})

const initDB= async  ()=>{
    await Listing.deleteMany({});
   initdata.data= initdata.data.map((obj)=>({...obj,owner:"67fa3b84e2f53cf3b0816b59"}));
    await Listing.insertMany(initdata.data);
    console.log("Data was initialised");
}
initDB();