const Listing = require("./models/listing");
const Review = require("./models/reviews");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema, userSchema, searchSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to access this feature");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    if (!listing.owner.equals(res.locals.curUser._id)) {
        req.flash("error", "You don't have permission to perform this action");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.validateUser = (req, res, next) => {
    let { error } = userSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.validateSearch = (req, res, next) => {
    let { error } = searchSchema.validate(req.query);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review) {
        req.flash("error", "Review not found");
        return res.redirect(`/listings/${id}`);
    }
    if (!review.author.equals(res.locals.curUser._id)) {
        req.flash("error", "You are not authorized to delete this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to access admin features");
        return res.redirect("/login");
    }
    if (!req.user.isAdmin) {
        req.flash("error", "You don't have admin privileges");
        return res.redirect("/listings");
    }
    next();
};

module.exports.isVerified = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to access this feature");
        return res.redirect("/login");
    }
    if (!req.user.isVerified) {
        req.flash("error", "Please verify your account to access this feature");
        return res.redirect("/profile");
    }
    next();
};

module.exports.checkListingStatus = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    
    if (listing.status !== 'active') {
        req.flash("error", "This listing is not available");
        return res.redirect("/listings");
    }
    
    if (!listing.availability.isAvailable) {
        req.flash("error", "This listing is currently unavailable");
        return res.redirect("/listings");
    }
    
    next();
};

module.exports.incrementViews = async (req, res, next) => {
    const { id } = req.params;
    try {
        await Listing.findByIdAndUpdate(id, { $inc: { views: 1 } });
    } catch (error) {
        console.error("Error incrementing views:", error);
    }
    next();
};

module.exports.rateLimit = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
};

module.exports.sanitizeInput = (req, res, next) => {
    // Basic input sanitization
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }
    next();
};

module.exports.logActivity = (activity) => {
    return (req, res, next) => {
        const logData = {
            activity,
            user: req.user ? req.user._id : null,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date(),
            method: req.method,
            url: req.originalUrl
        };
        
        console.log('Activity Log:', logData);
        next();
    };
};