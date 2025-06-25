const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");

module.exports.index = async (req, res) => {
  try {
    const { 
      query, location, category, minPrice, maxPrice, guests, 
      amenities, instantBookable, featured, sortBy = 'newest', 
      sortOrder = 'desc', page = 1, limit = 12, propertyType
    } = req.query;

    // Build filter object - start with basic filters
    const filter = {};
    
    // Only add status filter if the field exists
    try {
      const testListing = await Listing.findOne();
      if (testListing && testListing.status !== undefined) {
        filter.status = 'active';
      }
    } catch (error) {
      // If status field doesn't exist, continue without it
    }
    
    if (query) {
      filter.$text = { $search: query };
    }
    
    if (location) {
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { country: { $regex: location, $options: 'i' } }
      ];
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (propertyType) {
      filter.propertyType = propertyType;
    }

    if (amenities) {
      filter.amenities = { $all: Array.isArray(amenities) ? amenities : [amenities] };
    }

    if (instantBookable) {
      filter.instantBookable = true;
    }

    // Build sort object
    const sort = {};
    switch (sortBy) {
      case 'price_asc':
        sort.price = 1;
        break;
      case 'price_desc':
        sort.price = -1;
        break;
      case 'rating':
        sort['rating.average'] = -1;
        break;
      case 'popular':
        sort.views = -1;
        break;
      case 'oldest':
        sort.createdAt = 1;
        break;
      default: // newest
        sort.createdAt = -1;
    }

    // Get total count for pagination
    const total = await Listing.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Get listings with pagination
    const allListings = await Listing.find(filter)
      .populate('owner', 'username firstName lastName avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Get categories for filter (if they exist)
    let categories = [];
    try {
      categories = await Listing.distinct('category');
    } catch (error) {
      // If category field doesn't exist, use empty array
    }

    res.render("listings/index", { 
      allListings, 
      categories,
      pagination: {
        currentPage: Number(page),
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: req.query
    });
  } catch (error) {
    console.error('Error in listings index:', error);
    // Fallback to simple listing display
    const allListings = await Listing.find({}).populate('owner', 'username');
    res.render("listings/index", { allListings, categories: [], pagination: null, filters: {} });
  }
};

module.exports.renderNewform = (req, res) => {
  const categories = [
    'apartment', 'house', 'villa', 'cabin', 'treehouse', 'beachfront', 
    'mountain', 'city', 'rural', 'luxury', 'budget', 'family', 'romantic', 'business'
  ];
  
  const amenities = [
    'wifi', 'kitchen', 'parking', 'air-conditioning', 'heating', 'tv', 'washer', 'dryer',
    'workspace', 'pool', 'gym', 'garden', 'balcony', 'fireplace', 'breakfast', 'pets-allowed',
    'smoking-allowed', 'elevator', 'security', 'concierge', 'cleaning-service'
  ];
  
  const houseRules = [
    'no-smoking', 'no-parties', 'no-pets', 'quiet-hours', 'no-shoes', 'no-food-in-bedrooms',
    'respect-neighbors', 'turn-off-lights', 'lock-doors', 'clean-up-after-yourself'
  ];
  
  res.render("listings/new", { categories, amenities, houseRules });
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
        select: "username firstName lastName avatar"
      }
    })
    .populate("owner", "username firstName lastName avatar bio");
    
  if (!listing) throw new ExpressError(404, "Listing not found");
  
  // Increment views if the field exists
  try {
    if (listing.views !== undefined) {
      listing.views += 1;
      await listing.save();
    }
  } catch (error) {
    // If views field doesn't exist, continue without it
  }
  
  // Get similar listings
  let similarListings = [];
  try {
    similarListings = await Listing.find({
      category: listing.category,
      _id: { $ne: listing._id }
    })
    .populate('owner', 'username')
    .limit(4);
  } catch (error) {
    // If category field doesn't exist, skip similar listings
  }
  
  res.render("listings/show", { listing, similarListings });
};

module.exports.createListing = async (req, res, next) => {
  try {
    if (!req.body.listing) {
      throw new ExpressError(400, "Invalid listing data");
    }
    
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    
    if (req.files && req.files.length > 0) {
      newListing.images = req.files.map(file => ({
        url: file.path,
        filename: file.filename
      }));
      if(newListing.images.length > 0){
        newListing.image = newListing.images[0];
      }
    }
    
    await newListing.save();
    req.flash("success", "New listing created successfully!");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
};

module.exports.editListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) throw new ExpressError(404, "Listing not found");
  
  const categories = [
    'apartment', 'house', 'villa', 'cabin', 'treehouse', 'beachfront', 
    'mountain', 'city', 'rural', 'luxury', 'budget', 'family', 'romantic', 'business'
  ];
  
  const amenities = [
    'wifi', 'kitchen', 'parking', 'air-conditioning', 'heating', 'tv', 'washer', 'dryer',
    'workspace', 'pool', 'gym', 'garden', 'balcony', 'fireplace', 'breakfast', 'pets-allowed',
    'smoking-allowed', 'elevator', 'security', 'concierge', 'cleaning-service'
  ];
  
  const houseRules = [
    'no-smoking', 'no-parties', 'no-pets', 'quiet-hours', 'no-shoes', 'no-food-in-bedrooms',
    'respect-neighbors', 'turn-off-lights', 'lock-doors', 'clean-up-after-yourself'
  ];
  
  res.render("listings/edit", { listing, categories, amenities, houseRules });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map(file => ({
      url: file.path,
      filename: file.filename
    }));
    listing.images.push(...newImages);
    if(listing.images.length > 0){
      listing.image = listing.images[0];
    }
  }
  
  await listing.save();
  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  const deleted = await Listing.findByIdAndDelete(id);
  if (!deleted) throw new ExpressError(404, "Listing not found");
  req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
};

module.exports.search = async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.redirect('/listings');
  }
  
  try {
    const listings = await Listing.find({
      $text: { $search: q }
    })
    .populate('owner', 'username')
    .limit(20);
    
    res.render('listings/search', { listings, query: q });
  } catch (error) {
    console.error('Search error:', error);
    throw new ExpressError(500, "Search failed");
  }
};

module.exports.getCategories = async (req, res) => {
  try {
    const categories = await Listing.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

module.exports.toggleFeatured = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }
  
  listing.featured = !listing.featured;
  await listing.save();
  
  res.json({ featured: listing.featured });
};
