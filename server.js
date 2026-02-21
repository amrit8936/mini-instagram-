require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const User = require("./models/User");
const Post = require("./models/Post");
const upload = require("./middleware/upload");
const { isLoggedIn } = require("./middleware/auth");

const app = express();

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"));

app.set("views", "./view");
app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static("uploads"));



app.get("/signup",(req,res)=>res.render("signup"));

app.post("/signup",async(req,res)=>{
    const hash = await bcrypt.hash(req.body.password,10);
    await User.create({
        username:req.body.username,
        password:hash
    });
    res.redirect("/login");
});

app.get("/login",(req,res)=>res.render("login"));

app.post("/login",async(req,res)=>{
    const user = await User.findOne({username:req.body.username});
    if(!user) return res.send("User not found");

    const ok = await bcrypt.compare(req.body.password,user.password);
    if(!ok) return res.send("Wrong password");

    const token = jwt.sign({id:user._id},process.env.JWT_SECRET);
    res.cookie("token",token);
    res.redirect("/");
});



app.get("/",isLoggedIn,async(req,res)=>{
    const page = Number(req.query.page)||1;
    const limit = 4;

    const posts = await Post.find()
        .skip((page-1)*limit)
        .limit(limit);

    res.render("home",{posts,page});
});



app.post("/post",isLoggedIn,upload.single("image"),async(req,res)=>{
    await Post.create({
        userId:req.user.id,
        image:req.file.filename,
        caption:req.body.caption
    });
    res.redirect("/");
});



app.post("/delete/:id",isLoggedIn,async(req,res)=>{
    const post = await Post.findById(req.params.id);

    if(post.userId != req.user.id)
        return res.send("You cannot delete others post");

    await Post.findByIdAndDelete(req.params.id);
    res.redirect("/");
});



app.post("/update/:id",isLoggedIn,upload.single("image"),async(req,res)=>{
    const post = await Post.findById(req.params.id);

    if(post.userId != req.user.id)
        return res.send("You cannot update others post");

    if(req.file) {
        post.image = req.file.filename;
    }
    post.caption = req.body.caption;
    await post.save();
    res.redirect("/");
});



app.get("/logout",isLoggedIn,(req,res)=>{
    res.clearCookie("token");
    res.redirect("/login");
});

app.listen(3000,()=>console.log("Server running on port 3000"));