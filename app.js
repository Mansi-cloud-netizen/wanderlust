if(process.env.NODE_ENV !="production"){
require('dotenv').config();
}
    
    const express=require ('express');
    const app=express();
    const mongoose=require('mongoose');
    const path=require("path");
    const Listing=require("./models/listing.js");
    const ejsMate=require("ejs-mate");
    app.set("views",path.join(__dirname,"views"));
    app.set("view engine","ejs");
    const methodOverride=require("method-override");
    app.use(methodOverride("_method"));
    app.use(express.static(path.join(__dirname,"/public")));
    app.use(express.urlencoded({extended:true}));
    app.engine("ejs",ejsMate);
    const wrapAsync=require("./utils/wrapasync.js");
    const ExpressError=require("./utils/ExError.js");
    const ExError = require('./utils/ExError.js');
    const {listingSchema}=require("./schema.js");
    const review=require("./models/review.js");
    const cookieparser=require("cookie-parser");
    const session=require("express-session");
    const flash=require("connect-flash");
    const passport=require("passport");
    const localStratergy=require("passport-local");
    const User=require("./models/user.js");
    const {saveRedirectUrl,isReviewAuthor}=require("./middleware.js");
    const multer  = require('multer');
    const {storage}=require("./cloudConfig.js");
    const upload = multer({ storage })
    const MongoStore = require('connect-mongo');


    const dbUrl='mongodb://127.0.0.1:27017/wanderlust';

    const store=MongoStore.create({
        mongoUrl:dbUrl,
        crypto:{
            secret:"thisissecret",
        },
        touchAfter:24*3600,
    })
    store.on("error",()=>{
        console.log("ERROR IN MONGO SESSION STORE");
    })

    const sessionOptions={
        store,
        secret:"thisissecret",
        resave:false,
        saveUninitialized:false,
        cookie:{
            expires:Date.now() + 7*24*60*60*1000,
            maxAge:7*24*60*60*1000,
            httpOnly:true,
        }
    }

    app.use(session(sessionOptions));
    app.use(flash());
    app.use(cookieparser());
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new localStratergy(User.authenticate()));

    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    app.use((req,res,next)=>{
        res.locals.success=req.flash('success');
        res.locals.error=req.flash('error');
        res.locals.currUser=req.user;
        next();
    })
   
    app.get("/demouser",async (req,res)=>{
        let fakeUser=new User({
            email:"student@gmail.com",
            username:"delta-student",
        })
        let registeredUser=await User.register(fakeUser,"helloworld");
        res.send(registeredUser);
    })

    app.get("/getcookies",(req,res)=>{
        res.cookie("greet","namaste");
        res.cookie("madeIn","India");
    })

    let port=3000;


    async function main(){
        await mongoose.connect(dbUrl);
    }
    main().then((res)=>{
        console.log("connected to DB");
    }).catch((err)=>{
        console.log(err);
    })
    app.listen(port,()=>{
        console.log("app is listening");
    })
    app.get("/",(req,res)=>{
     res.redirect("/listings");
        
    })

    //serach-bar-GET
app.get('/search', async (req, res) => {
  try {
    const query = req.query.query;

    const result = await Listing.findOne({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } }
      ]
    });

    if (result) {
      return res.redirect(`/listings/${result._id}`);
    } else {
      req.flash('error', 'No matching listing found.');
      return res.redirect('/listings'); // or wherever you want
    }

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


    //signup-get request
    app.get("/signup",(req,res)=>{
        res.render("users/signup.ejs");
    })

    //signup-post request
    app.post("/signup",wrapAsync(async (req,res)=>{
        try{
            let {username,email,password}=req.body;
    const newUser= new User({email,username});
    const registeredUser=await User.register(newUser,password);
    console.log(registeredUser);
    req.login(registeredUser,((err)=>{
        if(err){
        return next(err);
        }
        req.flash("success","Login successful");
        res.redirect("/listings");
    }))
        }catch(e){
            req.flash("error",e.message);
            res.redirect("/signup");
        }
    
    }))


    //login-get-route
    app.get("/login",(req,res)=>{
        res.render("users/login.ejs");
    })

    app.post("/login",saveRedirectUrl,passport.authenticate("local",{failureRedirect:'/login',failureFlash:true}),async(req,res)=>{
    req.flash("success","Login succesful");
    let redirectUrl=res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
    })

    //logout-route
    app.get("/logout",(req,res)=>{
        req.logout((err)=>{
            if(err){
            return next(err);
            }
            req.flash("success","Logout successful");
            res.redirect("/listings");
        })
    })

    app.get("/listings",wrapAsync(async (req,res)=>{
        const allListings=await Listing.find({})
        res.render("listings/index.ejs",{allListings});
        }));

        app.get("/listings/trending",(req,res)=>{
            res.render("trending.ejs");
        })


    app.get("/listings/new",(req,res)=>{
        if(!req.isAuthenticated()){
            req.session.redirectUrl=req.originalUrl;
            req.flash("error","You must be logged in to create a listing");
        return res.redirect("/login");
        }
            res.render("listings/new.ejs");
        })


    app.get("/listings/:id",wrapAsync(async (req,res)=>{
        let {id}=req.params;
        const listing=await Listing.findById(id).populate({path:"review",populate:{path:"author"}}).populate("owner");
        console.log(listing);
        res.render("listings/show.ejs",{listing});
    }))


    app.post("/listings",upload.single('listing[image]'),wrapAsync (async (req,res,next)=>{
        let url=req.file.path;
        let filename=req.file.filename;
        console.log(url,"..",filename)
            const newListing=new Listing(req.body.listing);
            newListing.owner=req.user._id;
            newListing.image={url,filename};
            await newListing.save();
            req.flash("error","New listing created");
            res.redirect("/listings");
        }));

    app.get("/listings/:id/edit",wrapAsync(async (req,res)=>{
        if(!req.isAuthenticated()){
            req.session.redirectUrl=req.originalUrl;
            req.flash("error","You must be logged in to create a listing");
        return res.redirect("/login");
        }
        let {id}=req.params;
        const listing=await Listing.findById(id);
        res.render("listings/edit.ejs",{listing});
    }))


    app.put("/listings/:id",upload.single('listing[image]'),wrapAsync(async (req,res)=>{
        if(!req.isAuthenticated()){
            req.session.redirectUrl=req.originalUrl;
            req.flash("error","You must be logged in to create a listing");
        return res.redirect("/login");
        }
        let {id}=req.params;
        let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing});
        if(typeof req.file!=="undefined"){
            let url=req.file.path;
            let filename=req.file.filename;
            listing.image={url,filename};
            await listing.save();
        }
       
        req.flash("success","Listing updated");
        res.redirect(`/listings/${id}`);
    }))


    app.delete("/listings/:id",wrapAsync( async (req,res)=>{
        if(!req.isAuthenticated()){
            req.session.redirectUrl=req.originalUrl;
            req.flash("error","You must be logged in to create a listing");
        return res.redirect("/login");
        }
        let {id}=req.params;
        let deletedListing=await Listing.findByIdAndDelete(id);
        req.flash("success","listing deleted");
        res.redirect("/listings");
    })); 

    //review post request back on show route
    app.post("/listings/:id/reviews",async (req,res)=>{
        let listing= await Listing.findById(req.params.id);
        let newReview=new review(req.body.review);
        newReview.author=req.user._id; 
        listing.review.push(newReview);
        await newReview.save();
        await listing.save();
        req.flash("success","New review created");
        res.redirect(`/listings/${listing._id}`);
    })  

    app.delete("/listings/:id/reviews/:reviewId", isReviewAuthor,wrapAsync (async(req,res)=>{
        let{id,reviewId}=req.params;
        await Listing.findByIdAndUpdate(id,{$pull:{review:reviewId}});
        await review.findByIdAndDelete(reviewId);
        req.flash("success","Review deleted");
        res.redirect(`/listings/${id}`);
    }))

    
    // app.all("*",(req,res,next)=>{
    //     next(new ExError(404,"Page not found"));
    // })
    // app.use((err,req,res,next)=>{
    //     let {statusCode=500 ,message="Something went Wrong!!"}=err;
    //     res.status(statusCode).render("error.ejs",{message});
    //     // res.status(statusCode).send(message);
    // })

