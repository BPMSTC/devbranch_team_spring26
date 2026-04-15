const crypto = require('crypto');
const express = require('express');

const Investigator = require('../models/Investigator');

const router = express.Router();

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 64;
const PBKDF2_DIGEST = 'sha512';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST)
    .toString('hex');

  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  const [salt, storedKey] = storedHash.split(':');
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST)
    .toString('hex');

  const storedBuffer = Buffer.from(storedKey, 'hex');
  const derivedBuffer = Buffer.from(derivedKey, 'hex');

  if (storedBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, derivedBuffer);
}

router.post('/register', async (req, res) => {
  try {
    const {
      username,
      email,
      displayName,
      password,
      confirmPassword,
    } = req.body;

    if (!username || !email || !displayName || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await Investigator.findOne({
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail },
      ],
    });

    if (existingUser) {
      if (existingUser.username === normalizedUsername) {
        return res.status(409).json({ error: 'Username already taken.' });
      }

      return res.status(409).json({ error: 'Email already registered.' });
    }

    const investigator = await Investigator.create({
      username: normalizedUsername,
      email: normalizedEmail,
      displayName: displayName.trim(),
      passwordHash: hashPassword(password),
    });

    return res.status(201).json({ investigator: investigator.toJSON() });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create investigator account.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const investigator = await Investigator.findOne({ username: username.trim() }).select(
      '+passwordHash'
    );

    if (!investigator) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (!verifyPassword(password, investigator.passwordHash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    return res.json({ investigator: investigator.toJSON() });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to log in.' });
  }
});

router.patch('/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, avatarIcon, avatarColor } = req.body;

    const update = {};

    if (displayName !== undefined) {
      const nextDisplayName = displayName.trim();
      if (nextDisplayName.length < 2) {
        return res.status(400).json({ error: 'Display name must be at least 2 characters.' });
      }
      update.displayName = nextDisplayName;
    }

    if (avatarIcon !== undefined) {
      update.avatarIcon = avatarIcon;
    }

    if (avatarColor !== undefined) {
      update.avatarColor = avatarColor;
    }

    const investigator = await Investigator.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!investigator) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    return res.json({ investigator: investigator.toJSON() });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

router.get('/investigators/search', async (req, res) => {
  try {
    const query = (req.query.q ?? '').toString().trim();
    const excludeUsername = (req.query.exclude ?? '').toString().trim();

    if (!query) {
      return res.json({ investigators: [] });
    }

    const investigators = await Investigator.find({
      ...(excludeUsername ? { username: { $ne: excludeUsername } } : {}),
      $or: [
        { username: new RegExp(query, 'i') },
        { displayName: new RegExp(query, 'i') },
      ],
    }).select('-passwordHash');

    return res.json({ investigators });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to search investigators.' });
  }
});

router.post('/friends', async (req, res) => {
  try {
    const { userId, targetUsername } = req.body;

    if (!userId || !targetUsername) {
      return res.status(400).json({ error: 'userId and targetUsername are required.' });
    }

    const current = await Investigator.findById(userId);
    if (!current) {
      return res.status(404).json({ error: 'Current investigator not found.' });
    }

    if (current.username === targetUsername) {
      return res.status(400).json({ error: 'You cannot add yourself.' });
    }

    const target = await Investigator.findOne({ username: targetUsername });
    if (!target) {
      return res.status(404).json({ error: 'Investigator not found.' });
    }

    if ((current.friends ?? []).includes(targetUsername)) {
      return res.status(409).json({ error: 'Already friends.' });
    }

    current.friends = [...(current.friends ?? []), targetUsername];
    await current.save();

    return res.json({ investigator: current.toJSON() });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add friend.' });
  }
});

router.delete('/friends/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.query.userId?.toString();

    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }

    const current = await Investigator.findById(userId);
    if (!current) {
      return res.status(404).json({ error: 'Current investigator not found.' });
    }

    current.friends = (current.friends ?? []).filter((friend) => friend !== username);
    await current.save();

    return res.json({ investigator: current.toJSON() });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove friend.' });
  }
});

router.get('/friends', async (req, res) => {
  try {
    const userId = req.query.userId?.toString();

    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }

    const current = await Investigator.findById(userId);
    if (!current) {
      return res.status(404).json({ error: 'Current investigator not found.' });
    }

    const investigators = await Investigator.find({
      username: { $in: current.friends ?? [] },
    }).select('-passwordHash');

    return res.json({ investigators });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch friends.' });
  }
});

module.exports = router;