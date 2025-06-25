const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const Review = require("../models/reviews.js");

const Mongo_url = "mongodb://127.0.0.1:27017/escapeease";

async function main() {
  await mongoose.connect(Mongo_url);
  console.log("✅ Connected to MongoDB for migration");

  try {
    // Migrate Listings
    console.log("🔄 Migrating listings...");
    const listings = await Listing.find({});
    
    for (let listing of listings) {
      // Convert single image to images array
      if (listing.image && (!listing.images || listing.images.length === 0)) {
        listing.images = [{
          url: listing.image.url,
          filename: listing.image.filename
        }];
        listing.image = undefined; // Unset the old field
      }
      
      // Set default values for new fields
      if (!listing.category) listing.category = 'apartment';
      if (!listing.propertyType) listing.propertyType = 'entire-place';
      if (!listing.capacity) {
        listing.capacity = {
          guests: 2,
          bedrooms: 1,
          beds: 1,
          bathrooms: 1
        };
      }
      if (!listing.availability) {
        listing.availability = {
          isAvailable: true,
          checkIn: "15:00",
          checkOut: "11:00",
          minimumStay: 1,
          maximumStay: 30
        };
      }
      if (!listing.status) listing.status = 'active';
      if (!listing.featured) listing.featured = false;
      if (!listing.views) listing.views = 0;
      if (!listing.rating) {
        listing.rating = {
          average: 0,
          count: 0
        };
      }
      if (!listing.instantBookable) listing.instantBookable = true;
      if (!listing.cancellationPolicy) listing.cancellationPolicy = 'moderate';
      
      await listing.save();
    }
    console.log(`✅ Migrated ${listings.length} listings`);

    // Migrate Users
    console.log("🔄 Migrating users...");
    const users = await User.find({});
    
    for (let user of users) {
      // Set default values for new fields
      if (!user.avatar) {
        user.avatar = {
          url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
        };
      }
      if (!user.isVerified) user.isVerified = false;
      if (!user.lastLogin) user.lastLogin = new Date();
      if (!user.accountStatus) user.accountStatus = 'active';
      if (!user.preferences) {
        user.preferences = {
          notifications: {
            email: true,
            sms: false
          },
          language: 'en',
          currency: 'INR'
        };
      }
      
      await user.save();
    }
    console.log(`✅ Migrated ${users.length} users`);

    // Migrate Reviews - handle the listing field requirement
    console.log("🔄 Migrating reviews...");
    const reviews = await Review.find({});
    
    for (let review of reviews) {
      // Set default values for new fields
      if (!review.status) review.status = 'approved';
      if (!review.helpfulVotes) {
        review.helpfulVotes = {
          upvotes: 0,
          downvotes: 0
        };
      }
      if (!review.updatedAt) review.updatedAt = review.createdAt;
      if (!review.metadata) {
        review.metadata = {
          visitType: 'leisure',
          visitMonth: review.createdAt.getMonth() + 1,
          visitYear: review.createdAt.getFullYear()
        };
      }
      
      // Find the listing that contains this review
      if (!review.listing) {
        const listing = await Listing.findOne({ reviews: review._id });
        if (listing) {
          review.listing = listing._id;
        } else {
          console.log(`⚠️  Review ${review._id} not associated with any listing, skipping...`);
          continue;
        }
      }
      
      await review.save();
    }
    console.log(`✅ Migrated ${reviews.length} reviews`);

    console.log("🎉 Migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

main().catch((err) => console.error("❌ Migration error:", err)); 