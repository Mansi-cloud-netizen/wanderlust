const mongoose=require('mongoose');
let Schema=mongoose.Schema;
mongoose.set('strictPopulate', false);


const reviewSchema=new Schema({
    comment:String,
    rating:{
        type:Number,
        min:1,
        max:5
    },
    createdAt:{
        type:Date,
        default: Date.now(),
    },
    author:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
})
module.exports=mongoose.model("review",reviewSchema);