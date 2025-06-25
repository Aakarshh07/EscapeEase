const Review = require("../models/reviews.js");
const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");

module.exports.postReview = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new ExpressError(404, "Listing not found");
    
    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    newReview.listing = listing._id;
    
    // Add metadata
    newReview.metadata = {
      visitType: req.body.review.metadata?.visitType || 'leisure',
      visitMonth: new Date().getMonth() + 1,
      visitYear: new Date().getFullYear()
    };
    
    listing.reviews.push(newReview);
    
    await newReview.save();
    await listing.save();
    
    // Update listing rating
    const avgRating = await Review.getAverageRating(listing._id);
    listing.rating = avgRating;
    await listing.save();

    req.flash("success", "Review posted successfully!");
    res.redirect(`/listings/${listing._id}`);
  } catch (error) {
    console.error("Error posting review:", error);
    req.flash("error", "Error posting review");
    res.redirect(`/listings/${req.params.id}`);
  }
};

module.exports.destroyReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    
    // Check if listing exists
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError(404, "Listing not found");
    
    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) throw new ExpressError(404, "Review not found");
    
    // Remove review from listing and delete review
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    
    // Update listing rating
    const avgRating = await Review.getAverageRating(listing._id);
    listing.rating = avgRating;
    await listing.save();
    
    req.flash("success", "Review deleted successfully!");
    res.redirect(`/listings/${id}`);
  } catch (error) {
    console.error("Error deleting review:", error);
    req.flash("error", "Error deleting review");
    res.redirect(`/listings/${req.params.id}`);
  }
};

module.exports.updateReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    if (!review) throw new ExpressError(404, "Review not found");
    
    // Update review
    Object.assign(review, req.body.review);
    review.updatedAt = new Date();
    await review.save();
    
    // Update listing rating
    const listing = await Listing.findById(id);
    const avgRating = await Review.getAverageRating(listing._id);
    listing.rating = avgRating;
    await listing.save();
    
    req.flash("success", "Review updated successfully!");
    res.redirect(`/listings/${id}`);
  } catch (error) {
    console.error("Error updating review:", error);
    req.flash("error", "Error updating review");
    res.redirect(`/listings/${req.params.id}`);
  }
};

module.exports.renderEditReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError(404, "Listing not found");
    
    const review = await Review.findById(reviewId);
    if (!review) throw new ExpressError(404, "Review not found");
    
    res.render("reviews/edit", { listing, review });
  } catch (error) {
    req.flash("error", "Error loading review");
    res.redirect(`/listings/${req.params.id}`);
  }
};

module.exports.voteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { vote } = req.body; // 'up' or 'down'
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    if (vote === 'up') {
      review.helpfulVotes.upvotes += 1;
    } else if (vote === 'down') {
      review.helpfulVotes.downvotes += 1;
    }
    
    await review.save();
    
    res.json({ 
      upvotes: review.helpfulVotes.upvotes, 
      downvotes: review.helpfulVotes.downvotes,
      helpfulScore: review.helpfulScore 
    });
  } catch (error) {
    console.error("Error voting review:", error);
    res.status(500).json({ error: "Error processing vote" });
  }
};

module.exports.respondToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    
    const review = await Review.findById(reviewId);
    if (!review) throw new ExpressError(404, "Review not found");
    
    // Check if user is the listing owner
    const listing = await Listing.findById(review.listing);
    if (!listing.owner.equals(req.user._id)) {
      req.flash("error", "You can only respond to reviews of your own listings");
      return res.redirect(`/listings/${listing._id}`);
    }
    
    review.hostResponse = {
      comment: response,
      respondedAt: new Date()
    };
    
    await review.save();
    
    req.flash("success", "Response posted successfully!");
    res.redirect(`/listings/${listing._id}`);
  } catch (error) {
    console.error("Error responding to review:", error);
    req.flash("error", "Error posting response");
    res.redirect(`/listings/${req.params.id}`);
  }
};

module.exports.getReviewStats = async (req, res) => {
  try {
    const { listingId } = req.params;
    
    const stats = await Review.aggregate([
      { $match: { listing: listingId, status: 'approved' } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);
    
    if (stats.length === 0) {
      return res.json({
        totalReviews: 0,
        avgRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }
    
    const stat = stats[0];
    const ratingDistribution = stat.ratingDistribution.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      totalReviews: stat.totalReviews,
      avgRating: Math.round(stat.avgRating * 10) / 10,
      ratingDistribution
    });
  } catch (error) {
    console.error("Error getting review stats:", error);
    res.status(500).json({ error: "Error fetching review statistics" });
  }
};