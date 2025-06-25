const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const Mongo_url = "mongodb://127.0.0.1:27017/escapeease";

async function main() {
  await mongoose.connect(Mongo_url);
  console.log("connected to DB");

  await initDB();  // call after connected
}

const initDB = async () => {
  await Listing.deleteMany({});
  initData.data= initData.data.map((obj)=>({...obj, owner:"685073bb7ba957b5c8e417fe"}));
  await Listing.insertMany(initData.data);
  console.log("data was initialized");
};

main().catch((err) => console.log(err));
