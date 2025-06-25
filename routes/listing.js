const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isOwner, validateListing, validateSearch } = require("../middleware");
const listingController = require("../controllers/listings");
const upload = require("../utils/cloudinary");

// GET all listings with search and filters
router.get("/", validateSearch, wrapAsync(listingController.index));

// GET search results
router.get("/search", wrapAsync(listingController.search));

// GET new listing form
router.get("/new", isLoggedIn, listingController.renderNewform);

// GET show listing
router.get("/:id", wrapAsync(listingController.showListing));

// POST create listing
router.post(
  "/",
  isLoggedIn,
  upload.array('images', 10), // Allow multiple images
  validateListing,
  wrapAsync(listingController.createListing)
);

// GET edit form
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.editListing));

// PUT update listing
router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  upload.array('images', 10), // Allow multiple images
  validateListing,
  wrapAsync(listingController.updateListing)
);

// DELETE listing
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// API routes
router.get("/api/categories", wrapAsync(listingController.getCategories));
router.patch("/:id/featured", isLoggedIn, isOwner, wrapAsync(listingController.toggleFeatured));

module.exports = router;