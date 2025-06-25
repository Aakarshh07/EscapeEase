const express = require("express");
const router= express.Router();
const User= require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn, validateUser } = require("../middleware.js");
const upload = require("../utils/cloudinary");

const userController = require("../controllers/users.js");

// Authentication routes
router.get("/signup", (req,res)=>{
    res.render("users/signup.ejs");
});

router.post("/signup", validateUser, wrapAsync(userController.postSignup));

router.get("/login",userController.renderLogin);

router.post("/login",saveRedirectUrl, passport.authenticate("local",{failureRedirect: '/login', failureFlash: true}),userController.login);

router.get("/logout", userController.logout);

// Profile routes
router.get("/profile", isLoggedIn, wrapAsync(userController.renderProfile));
router.put("/profile", isLoggedIn, validateUser, wrapAsync(userController.updateProfile));
router.put("/profile/avatar", isLoggedIn, upload.single('avatar'), wrapAsync(userController.updateAvatar));
router.put("/profile/preferences", isLoggedIn, wrapAsync(userController.updatePreferences));
router.put("/profile/password", isLoggedIn, wrapAsync(userController.changePassword));
router.delete("/profile", isLoggedIn, wrapAsync(userController.deleteAccount));

// User content routes
router.get("/my-listings", isLoggedIn, wrapAsync(userController.getUserListings));
router.get("/my-reviews", isLoggedIn, wrapAsync(userController.getUserReviews));

module.exports= router;