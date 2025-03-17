const express = require('express');
const router = express.Router();
const ContactUs = require('../models/ContactUs');

// POST route - Save contact form
router.post('/submit', async (req, res) => {
  try {
    const { FirstName, LastName, EmailAddress, PhoneNo, Services, Message } = req.body;

    const contact = new ContactUs({
      FirstName,
      LastName,
      EmailAddress,
      PhoneNo,
      Services,
      Message
    });

    await contact.save();
    res.status(201).json({ message: 'Contact form submitted successfully', contact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// GET route - Get all contact form entries
router.get('/get', async (req, res) => {
  try {
    const contacts = await ContactUs.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact data' });
  }
});

module.exports = router;
