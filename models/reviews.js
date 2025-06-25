const mongoose=require("mongoose");
const Schema =mongoose.Schema;

const reviewSchema=new Schema({
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    // Detailed ratings
    detailedRatings: {
        cleanliness: {
            type: Number,
            min: 1,
            max: 5
        },
        communication: {
            type: Number,
            min: 1,
            max: 5
        },
        checkIn: {
            type: Number,
            min: 1,
            max: 5
        },
        accuracy: {
            type: Number,
            min: 1,
            max: 5
        },
        location: {
            type: Number,
            min: 1,
            max: 5
        },
        value: {
            type: Number,
            min: 1,
            max: 5
        }
    },
    // Review categories
    categories: [{
        type: String,
        enum: ['cleanliness', 'location', 'value', 'communication', 'check-in', 'accuracy', 'amenities', 'host', 'overall']
    }],
    // Review status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'flagged'],
        default: 'approved'
    },
    // Helpful votes
    helpfulVotes: {
        upvotes: {
            type: Number,
            default: 0
        },
        downvotes: {
            type: Number,
            default: 0
        }
    },
    // Review images
    images: [{
        url: String,
        filename: String,
        caption: String
    }],
    // Review response from host
    hostResponse: {
        comment: String,
        respondedAt: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    // Review metadata
    metadata: {
        stayDuration: Number, // in days
        visitType: {
            type: String,
            enum: ['business', 'leisure', 'family', 'romantic', 'group', 'solo'],
            default: 'leisure'
        },
        visitMonth: Number, // 1-12
        visitYear: Number
    }
}, {
    timestamps: true
});

// Index for better performance
reviewSchema.index({ listing: 1, createdAt: -1 });
reviewSchema.index({ author: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1 });

// Virtual for overall detailed rating
reviewSchema.virtual('overallDetailedRating').get(function() {
    if (this.detailedRatings) {
        const ratings = Object.values(this.detailedRatings).filter(rating => rating);
        if (ratings.length > 0) {
            return (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1);
        }
    }
    return this.rating;
});

// Virtual for helpful score
reviewSchema.virtual('helpfulScore').get(function() {
    return this.helpfulVotes.upvotes - this.helpfulVotes.downvotes;
});

// Ensure virtual fields are serialized
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

// Pre-save middleware to update timestamps
reviewSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get average rating for a listing
reviewSchema.statics.getAverageRating = async function(listingId) {
    const result = await this.aggregate([
        { $match: { listing: listingId, status: 'approved' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    return result.length > 0 ? {
        average: Math.round(result[0].avgRating * 10) / 10,
        count: result[0].count
    } : { average: 0, count: 0 };
};

module.exports = mongoose.model("Review", reviewSchema);