const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// POST upload image to ImgBB
router.post('/image', verifyToken, async (req, res) => {
  try {
    const { image } = req.body; // base64 encoded image

    if (!image) {
      return res.status(400).json({ message: 'Image data is required' });
    }

    const formData = new URLSearchParams();
    formData.append('key', process.env.IMGBB_API_KEY);
    formData.append('image', image);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      res.json({ url: data.data.display_url });
    } else {
      res.status(400).json({ message: 'Image upload failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
