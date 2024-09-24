const express = require('express');
const AccountDetails = require('./models/AccountDetails');
const router = express.Router();

// Save or update account details
router.put('/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { name, phone, shopName, address } = req.body;

    let accountDetails = await AccountDetails.findOne({ email });

    if (accountDetails) {
      // Update existing account details
      accountDetails.name = name;
      accountDetails.phone = phone;
      accountDetails.shopName = shopName;
      accountDetails.address = address;
    } else {
      // Create new account details
      accountDetails = new AccountDetails({ email, name, phone, shopName, address });
    }

    await accountDetails.save();
    res.status(200).json(accountDetails);
  } catch (error) {
    res.status(500).json({ message: 'Error saving account details', error });
  }
});

module.exports = router;
