const mongoose = require('mongoose');

const accountDetailsSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String },
  shopName: { type: String, required: true },
  address: { type: String }
});

const AccountDetails = mongoose.model('AccountDetails', accountDetailsSchema);

module.exports = AccountDetails;
