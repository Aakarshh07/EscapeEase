const express= require("express");
const router= express.Router({mergeParams : true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/reviews.js");
const {validateReview, isLoggedIn, isReviewAuthor}=require("../middleware.js");

// Review validation middleware

const reviewController = require("../controllers/review.js");

// POST review
router.post("/",isLoggedIn, validateReview, wrapAsync(reviewController.postReview));

// GET edit review form
router.get("/:reviewId/edit", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.renderEditReview));

// PUT update review
router.put("/:reviewId", isLoggedIn, isReviewAuthor, validateReview, wrapAsync(reviewController.updateReview));

// DELETE review
router.delete("/:reviewId",
    isLoggedIn,
    isReviewAuthor,
    wrapAsync(reviewController.destroyReview)
);

// POST host response to review
router.post("/:reviewId/respond", isLoggedIn, wrapAsync(reviewController.respondToReview));

// POST vote on review (helpful/not helpful)
router.post("/:reviewId/vote", isLoggedIn, wrapAsync(reviewController.voteReview));

// GET review statistics
router.get("/stats", wrapAsync(reviewController.getReviewStats));

module.exports= router;