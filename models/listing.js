const mongoose = require("mongoose");
const reviews = require("./reviews");
const Schema = mongoose.Schema;
const Review = require("./reviews.js");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  image: {
    url: String,
    filename: String,
  },
  images: [{
    url: String,
    filename: String,
    caption: String
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  category: {
    type: String,
    enum: ['apartment', 'house', 'villa', 'cabin', 'treehouse', 'beachfront', 'mountain', 'city', 'rural', 'luxury', 'budget', 'family', 'romantic', 'business'],
    default: 'apartment'
  },
  propertyType: {
    type: String,
    enum: ['entire-place', 'private-room', 'shared-room'],
    default: 'entire-place'
  },
  amenities: [{
    type: String,
    enum: [
      'wifi', 'kitchen', 'parking', 'air-conditioning', 'heating', 'tv', 'washer', 'dryer',
      'workspace', 'pool', 'gym', 'garden', 'balcony', 'fireplace', 'breakfast', 'pets-allowed',
      'smoking-allowed', 'elevator', 'security', 'concierge', 'cleaning-service'
    ]
  }],
  capacity: {
    guests: {
      type: Number,
      min: 1,
      max: 20,
      default: 2
    },
    bedrooms: {
      type: Number,
      min: 0,
      default: 1
    },
    beds: {
      type: Number,
      min: 1,
      default: 1
    },
    bathrooms: {
      type: Number,
      min: 1,
      default: 1
    }
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    checkIn: {
      type: String,
      default: "15:00"
    },
    checkOut: {
      type: String,
      default: "11:00"
    },
    minimumStay: {
      type: Number,
      min: 1,
      default: 1
    },
    maximumStay: {
      type: Number,
      min: 1,
      default: 30
    }
  },
  houseRules: [{
    type: String,
    enum: [
      'no-smoking', 'no-parties', 'no-pets', 'quiet-hours', 'no-shoes', 'no-food-in-bedrooms',
      'respect-neighbors', 'turn-off-lights', 'lock-doors', 'clean-up-after-yourself'
    ]
  }],
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  instantBookable: {
    type: Boolean,
    default: true
  },
  cancellationPolicy: {
    type: String,
    enum: ['flexible', 'moderate', 'strict', 'super-strict'],
    default: 'moderate'
  }
}, {
  timestamps: true
});

// Index for better search performance
listingSchema.index({ title: 'text', description: 'text', location: 'text', country: 'text' });
listingSchema.index({ category: 1, price: 1 });
listingSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

// Virtual for average rating
listingSchema.virtual('averageRating').get(function() {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / this.reviews.length).toFixed(1);
  }
  return 0;
});

// Virtual for price per night
listingSchema.virtual('pricePerNight').get(function() {
  return this.price;
});

// Virtual for discount percentage
listingSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Ensure virtual fields are serialized
listingSchema.set('toJSON', { virtuals: true });
listingSchema.set('toObject', { virtuals: true });

// Pre-save middleware to update rating
listingSchema.pre('save', async function(next) {
  if (this.isModified('reviews')) {
    const populatedListing = await this.populate('reviews');
    if (populatedListing.reviews && populatedListing.reviews.length > 0) {
      const totalRating = populatedListing.reviews.reduce((sum, review) => sum + review.rating, 0);
      this.rating.average = totalRating / populatedListing.reviews.length;
      this.rating.count = populatedListing.reviews.length;
    }
  }
  next();
});

listingSchema.post("findOneAndDelete", async(listing) => {
  if(listing) {
    await Review.deleteMany({_id: {$in: listing.reviews}});
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing; 