const User = require("../models/user");
const Listing = require("../models/listing");
const Review = require("../models/reviews");

module.exports.postSignup = async (req, res, next) => {
    try {
        let { username, email, password, firstName, lastName, phone } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email: email.toLowerCase() }, { username }] 
        });
        
        if (existingUser) {
            req.flash("error", "User with this email or username already exists");
            return res.redirect("/signup");
        }
        
        const newUser = new User({ 
            email: email.toLowerCase(), 
            username, 
            firstName, 
            lastName, 
            phone 
        });
        
        const registeredUser = await User.register(newUser, password);
        
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to EscapeEase! Your account has been created successfully.");
            res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLogin = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    // Update last login
    await User.findByIdAndUpdate(req.user._id, { lastLogin: new Date() });
    
    req.flash("success", `Welcome back, ${req.user.displayName}!`);
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You have been logged out successfully");
        res.redirect("/listings");
    });
};

module.exports.renderProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Get user's listings
        const userListings = await Listing.find({ owner: req.user._id })
            .sort({ createdAt: -1 })
            .limit(5);
        
        // Get user's reviews
        const userReviews = await Review.find({ author: req.user._id })
            .populate('listing', 'title images')
            .sort({ createdAt: -1 })
            .limit(5);
        
        res.render("users/profile", { user, userListings, userReviews });
    } catch (error) {
        req.flash("error", "Error loading profile");
        res.redirect("/listings");
    }
};

module.exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, bio, phone, location } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                firstName,
                lastName,
                bio,
                phone,
                location: {
                    city: location?.city,
                    country: location?.country
                }
            },
            { new: true, runValidators: true }
        );
        
        req.flash("success", "Profile updated successfully!");
        res.redirect("/profile");
    } catch (error) {
        req.flash("error", "Error updating profile");
        res.redirect("/profile");
    }
};

module.exports.updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            req.flash("error", "Please select an image to upload");
            return res.redirect("/profile");
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                avatar: {
                    url: req.file.path,
                    filename: req.file.filename
                }
            },
            { new: true }
        );
        
        req.flash("success", "Avatar updated successfully!");
        res.redirect("/profile");
    } catch (error) {
        req.flash("error", "Error updating avatar");
        res.redirect("/profile");
    }
};

module.exports.updatePreferences = async (req, res) => {
    try {
        const { notifications, language, currency } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                preferences: {
                    notifications: {
                        email: notifications?.email === 'on',
                        sms: notifications?.sms === 'on'
                    },
                    language,
                    currency
                }
            },
            { new: true }
        );
        
        req.flash("success", "Preferences updated successfully!");
        res.redirect("/profile");
    } catch (error) {
        req.flash("error", "Error updating preferences");
        res.redirect("/profile");
    }
};

module.exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (newPassword !== confirmPassword) {
            req.flash("error", "New passwords do not match");
            return res.redirect("/profile");
        }
        
        const user = await User.findById(req.user._id);
        const isMatch = await user.authenticate(currentPassword);
        
        if (!isMatch) {
            req.flash("error", "Current password is incorrect");
            return res.redirect("/profile");
        }
        
        await user.setPassword(newPassword);
        await user.save();
        
        req.flash("success", "Password changed successfully!");
        res.redirect("/profile");
    } catch (error) {
        req.flash("error", "Error changing password");
        res.redirect("/profile");
    }
};

module.exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user._id);
        const isMatch = await user.authenticate(password);
        
        if (!isMatch) {
            req.flash("error", "Password is incorrect");
            return res.redirect("/profile");
        }
        
        // Soft delete - mark as deleted instead of actually deleting
        await User.findByIdAndUpdate(req.user._id, { accountStatus: 'deleted' });
        
        req.logout((err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Your account has been deleted successfully");
            res.redirect("/listings");
        });
    } catch (error) {
        req.flash("error", "Error deleting account");
        res.redirect("/profile");
    }
};

module.exports.getUserListings = async (req, res) => {
    try {
        const listings = await Listing.find({ owner: req.user._id })
            .sort({ createdAt: -1 });
        
        res.render("users/my-listings", { listings });
    } catch (error) {
        req.flash("error", "Error loading your listings");
        res.redirect("/profile");
    }
};

module.exports.getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ author: req.user._id })
            .populate('listing', 'title images')
            .sort({ createdAt: -1 });
        
        res.render("users/my-reviews", { reviews });
    } catch (error) {
        req.flash("error", "Error loading your reviews");
        res.redirect("/profile");
    }
};