const mongoose=require('mongoose');
let Schema=mongoose.Schema;
const review=require("./review.js");


const listingSchema=new Schema({
    title:{
        type:String,
        required:true,
    },
    description:String,
    image:{
      url:String,
      filename:String,
    },
    price:Number,
    location:String,
    country:String,
    review:[
    {
        type:Schema.Types.ObjectId,
        ref:"review",
    }
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
});
listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
        await review.deleteMany({_id:{$in:listing.reviews}});
    }
   
})
const Listing= mongoose.model("listing",listingSchema);
module.exports=Listing;
    