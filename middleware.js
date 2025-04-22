const review=require("./models/review");
const Listing=require("./models/listing.js");
 const {listingSchema,reviewSchema}=require("./schema.js");
module.exports.saveRedirectUrl=(req,res,next)=>{
    //redirectUrl-middleware
           if(req.session.redirectUrl){
               res.locals.redirectUrl=req.session.redirectUrl;
           }
           next();
}

module.exports.isReviewAuthor=async(req,res,next)=>{
    let {id,reviewId}=req.params;
    let reviews=await review.findById(reviewId);
    if(!reviews.author.equals(res.locals.currUser._id)){
        req.flash("error","you are not the author of this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
}