const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const LISTINGS_FILE = path.join(DATA_DIR, 'listings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

const defaultListings = [
  {
    id: 1,
    title: 'Vintage bicycle',
    category: 'outdoors',
    type: 'Giveaway',
    location: 'Berlin',
    description: 'Well-maintained bike with a few light scratches. Pickup available this weekend.',
    tag: 'Free',
    imageUrls: [
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80'
    ],
    postedBy: 'community'
  },
  {
    id: 2,
    title: 'MacBook charger',
    category: 'electronics',
    type: 'Exchange',
    location: 'Toronto',
    description: 'Original charger in good condition and happy to swap for a reusable power bank.',
    tag: 'Swap',
    imageUrls: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'
    ],
    postedBy: 'community'
  },
  {
    id: 3,
    title: 'Wooden bookshelf',
    category: 'furniture',
    type: 'Giveaway',
    location: 'Chicago',
    description: 'Solid oak-style shelf that fits well in a home office or living room.',
    tag: 'Free',
    imageUrls: [
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'
    ],
    postedBy: 'community'
  }
];

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LISTINGS_FILE)) {
    fs.writeFileSync(LISTINGS_FILE, JSON.stringify(defaultListings, null, 2));
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(REQUESTS_FILE)) {
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify([], null, 2));
  }
}

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function normalizeUser(user) {
  return {
    username: user.username,
    email: user.email || '',
    phone: user.phone || '',
    country: user.country || '',
    password: user.password
  };
}

ensureStore();

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/listings', (req, res) => {
  const listings = readJson(LISTINGS_FILE, defaultListings);
  res.json(listings);
});

app.post('/api/listings', (req, res) => {
  const { title, category, type, location, description, imageUrls, postedBy } = req.body;

  if (!title || !category || !type || !location || !description || !postedBy) {
    return res.status(400).json({ error: 'Missing required listing fields.' });
  }

  const listings = readJson(LISTINGS_FILE, defaultListings);

  const newListing = {
    id: Date.now(),
    title,
    category,
    type,
    location,
    description,
    tag: type === 'Giveaway' ? 'Free' : 'Swap',
    imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
    postedBy
  };

  listings.unshift(newListing);
  writeJson(LISTINGS_FILE, listings);
  res.status(201).json(newListing);
});

app.post('/api/requests', (req, res) => {
  const { listingId, requestedBy } = req.body;

  if (!listingId || !requestedBy) {
    return res.status(400).json({ error: 'Missing listingId or requestedBy.' });
  }

  const listings = readJson(LISTINGS_FILE, defaultListings);
  const listing = listings.find((l) => Number(l.id) === Number(listingId));
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });

  const requests = readJson(REQUESTS_FILE, []);
  const newRequest = {
    id: Date.now(),
    listingId: listing.id,
    listingTitle: listing.title,
    requestedBy,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  requests.unshift(newRequest);
  writeJson(REQUESTS_FILE, requests);
  res.status(201).json(newRequest);
});

app.get('/api/requests', (req, res) => {
  const requests = readJson(REQUESTS_FILE, []);
  res.json(requests);
});

app.get('/api/ads', (req, res) => {
  const adsFile = path.join(DATA_DIR, 'ads.json');
  const defaultAds = [];
  const ads = readJson(adsFile, defaultAds);
  res.json(ads);
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, phone, password, country } = req.body;

  if (!username || !email || !phone || !password) {
    return res.status(400).json({ error: 'Please provide username, email, phone, and password.' });
  }

  const users = readJson(USERS_FILE, []);
  if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: 'Username already exists.' });
  }
  const hashed = bcrypt.hashSync(password, 10);
  const newUser = normalizeUser({ username, email, password: hashed, phone, country });
  users.push(newUser);
  writeJson(USERS_FILE, users);
  res.status(201).json({ success: true, username, phone, country: newUser.country });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Please provide both username and password.' });
  }

  const users = readJson(USERS_FILE, []);
  const user = users.find((entry) => entry.username.toLowerCase() === username.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  res.json({ success: true, username: user.username, phone: user.phone || '', country: user.country || '' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
