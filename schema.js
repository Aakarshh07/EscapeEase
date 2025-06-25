const Joi = require("joi");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required().min(3).max(100).trim(),
    description: Joi.string().required().min(10).max(2000).trim(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().allow("", null),
        filename: Joi.string().default("listingimage"),
        caption: Joi.string().max(100).optional()
      })
    ).optional(),
    price: Joi.number().min(0).max(100000).required(),
    originalPrice: Joi.number().min(0).max(100000).optional(),
    location: Joi.string().required().min(2).max(100).trim(),
    country: Joi.string().required().min(2).max(50).trim(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional()
    }).optional(),
    category: Joi.string().valid(
      'apartment', 'house', 'villa', 'cabin', 'treehouse', 'beachfront', 
      'mountain', 'city', 'rural', 'luxury', 'budget', 'family', 'romantic', 'business'
    ).default('apartment'),
    propertyType: Joi.string().valid('entire-place', 'private-room', 'shared-room').default('entire-place'),
    amenities: Joi.array().items(
      Joi.string().valid(
        'wifi', 'kitchen', 'parking', 'air-conditioning', 'heating', 'tv', 'washer', 'dryer',
        'workspace', 'pool', 'gym', 'garden', 'balcony', 'fireplace', 'breakfast', 'pets-allowed',
        'smoking-allowed', 'elevator', 'security', 'concierge', 'cleaning-service'
      )
    ).optional(),
    capacity: Joi.object({
      guests: Joi.number().min(1).max(20).default(2),
      bedrooms: Joi.number().min(0).max(10).default(1),
      beds: Joi.number().min(1).max(10).default(1),
      bathrooms: Joi.number().min(1).max(10).default(1)
    }).optional(),
    availability: Joi.object({
      isAvailable: Joi.boolean().default(true),
      checkIn: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default("15:00"),
      checkOut: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default("11:00"),
      minimumStay: Joi.number().min(1).max(365).default(1),
      maximumStay: Joi.number().min(1).max(365).default(30)
    }).optional(),
    houseRules: Joi.array().items(
      Joi.string().valid(
        'no-smoking', 'no-parties', 'no-pets', 'quiet-hours', 'no-shoes', 'no-food-in-bedrooms',
        'respect-neighbors', 'turn-off-lights', 'lock-doors', 'clean-up-after-yourself'
      )
    ).optional(),
    instantBookable: Joi.boolean().default(true),
    cancellationPolicy: Joi.string().valid('flexible', 'moderate', 'strict', 'super-strict').default('moderate'),
    owner: Joi.string().optional(),
    reviews: Joi.array().items(Joi.string()).optional()
  }).required()
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required().min(10).max(1000).trim(),
    detailedRatings: Joi.object({
      cleanliness: Joi.number().min(1).max(5).optional(),
      communication: Joi.number().min(1).max(5).optional(),
      checkIn: Joi.number().min(1).max(5).optional(),
      accuracy: Joi.number().min(1).max(5).optional(),
      location: Joi.number().min(1).max(5).optional(),
      value: Joi.number().min(1).max(5).optional()
    }).optional(),
    categories: Joi.array().items(
      Joi.string().valid('cleanliness', 'location', 'value', 'communication', 'check-in', 'accuracy', 'amenities', 'host', 'overall')
    ).optional(),
    metadata: Joi.object({
      stayDuration: Joi.number().min(1).max(365).optional(),
      visitType: Joi.string().valid('business', 'leisure', 'family', 'romantic', 'group', 'solo').default('leisure'),
      visitMonth: Joi.number().min(1).max(12).optional(),
      visitYear: Joi.number().min(2020).max(2030).optional()
    }).optional()
  }).required(),
});

module.exports.userSchema = Joi.object({
  user: Joi.object({
    username: Joi.string().required().min(3).max(30).alphanum().trim(),
    email: Joi.string().email().required().lowercase().trim(),
    firstName: Joi.string().min(1).max(50).trim().optional(),
    lastName: Joi.string().min(1).max(50).trim().optional(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
    bio: Joi.string().max(500).trim().optional(),
    location: Joi.object({
      city: Joi.string().max(50).trim().optional(),
      country: Joi.string().max(50).trim().optional()
    }).optional(),
    preferences: Joi.object({
      notifications: Joi.object({
        email: Joi.boolean().default(true),
        sms: Joi.boolean().default(false)
      }).optional(),
      language: Joi.string().valid('en', 'es', 'fr', 'de', 'hi').default('en'),
      currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP').default('INR')
    }).optional()
  }).required()
});

module.exports.searchSchema = Joi.object({
  query: Joi.string().max(100).trim().allow('').optional(),
  location: Joi.string().max(100).trim().allow('').optional(),
  category: Joi.string().valid(
    'apartment', 'house', 'villa', 'cabin', 'treehouse', 'beachfront', 
    'mountain', 'city', 'rural', 'luxury', 'budget', 'family', 'romantic', 'business'
  ).allow('').optional(),
  minPrice: Joi.number().min(0).allow('').optional(),
  maxPrice: Joi.number().min(0).allow('').optional(),
  propertyType: Joi.string().valid('entire-place', 'private-room', 'shared-room').allow('').optional(),
  guests: Joi.number().min(1).max(20).allow('').optional(),
  amenities: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  instantBookable: Joi.boolean().optional(),
  featured: Joi.boolean().optional(),
  sortBy: Joi.string().valid('price_asc', 'price_desc', 'rating', 'newest', 'oldest', 'popular').default('newest'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(12)
}).unknown(true);