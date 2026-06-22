const STORAGE_KEY = 'freeMarketListings';
const USER_KEY = 'freeMarketUser';
const API_BASE = '/api';

const defaultListings = [
  {
    title: 'Vintage bicycle',
    category: 'outdoors',
    type: 'Giveaway',
    location: 'Berlin',
    description: 'Well-maintained bike with a few light scratches. Pickup available this weekend.',
    tag: 'Free',
    imageUrls: [
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    title: 'MacBook charger',
    category: 'electronics',
    type: 'Exchange',
    location: 'Toronto',
    description: 'Original charger in good condition and happy to swap for a reusable power bank.',
    tag: 'Swap',
    imageUrls: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    title: 'Wooden bookshelf',
    category: 'furniture',
    type: 'Giveaway',
    location: 'Chicago',
    description: 'Solid oak-style shelf that fits well in a home office or living room.',
    tag: 'Free',
    imageUrls: [
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    title: 'Children’s books set',
    category: 'books',
    type: 'Exchange',
    location: 'Sydney',
    description: 'A collection of storybooks and activity books, perfect for a swap with educational toys.',
    tag: 'Trade',
    imageUrls: [
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    title: 'Winter jacket',
    category: 'clothing',
    type: 'Giveaway',
    location: 'Lagos',
    description: 'Warm insulated jacket with a zip pocket; only worn a few times.',
    tag: 'Free',
    imageUrls: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    title: 'Ceramic dinner set',
    category: 'home',
    type: 'Exchange',
    location: 'Lisbon',
    description: 'Beautiful hand-painted plates and bowls that can be exchanged for kitchen tools.',
    tag: 'Swap',
    imageUrls: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80'
    ]
  }
];

let listings = [];

function loadListings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultListings;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : defaultListings;
  } catch (error) {
    return defaultListings;
  }
}

function saveListings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
}

async function fetchListings() {
  try {
    const response = await fetch(`${API_BASE}/listings`);
    if (!response.ok) throw new Error('Failed to load listings');
    const data = await response.json();
    listings = Array.isArray(data) ? data : defaultListings;
    saveListings();
  } catch (error) {
    listings = loadListings();
  }
  renderListings();
}

listings = loadListings();

const listingGrid = document.getElementById('listingGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const accountButton = document.getElementById('accountButton');
const postForm = document.getElementById('postForm');
const itemNameInput = document.getElementById('itemName');
const itemCategoryInput = document.getElementById('itemCategory');
const itemTypeInput = document.getElementById('itemType');
const itemLocationInput = document.getElementById('itemLocation');
const itemDescriptionInput = document.getElementById('itemDescription');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const dropZone = document.getElementById('dropZone');

function updateAccountButton() {
  const storedUser = localStorage.getItem(USER_KEY);
  if (!accountButton) return;

  let username = '';
  let phone = '';
  let country = '';

  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed && typeof parsed === 'object') {
        username = parsed.username || '';
        phone = parsed.phone || '';
        country = parsed.country || '';
      } else if (typeof parsed === 'string') {
        username = parsed;
      }
    } catch (error) {
      username = storedUser;
    }
  }

  if (username) {
    const phoneLabel = phone ? ` • ${phone}` : '';
    const countryLabel = country ? ` • ${country}` : '';
    accountButton.textContent = `Hi, ${username}${phoneLabel}${countryLabel}`;
    accountButton.href = 'profile.html';
    accountButton.onclick = null;
  } else {
    accountButton.textContent = 'Login';
    accountButton.href = 'login.html';
    accountButton.onclick = null;
  }
}

function isLoggedIn() {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return false;
  try {
    const parsed = JSON.parse(stored);
    return Boolean(parsed && parsed.username);
  } catch (e) {
    return true;
  }
}

function readFilesAsDataUrls(files) {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        })
    )
  );
}

function updatePreview(files) {
  imagePreview.innerHTML = '';
  Array.from(files).forEach((file) => {
    const previewItem = document.createElement('img');
    previewItem.src = URL.createObjectURL(file);
    previewItem.alt = file.name;
    imagePreview.appendChild(previewItem);
  });
}

function handleFiles(files) {
  if (!files || !files.length) return;
  updatePreview(files);
}

function renderListings() {
  const searchTerm = searchInput.value.toLowerCase();
  const category = categoryFilter.value;

  const filtered = listings.filter((item) => {
    const description = item.description || '';
    const title = item.title || '';
    const location = item.location || '';
    const type = item.type || '';
    const matchesSearch =
      title.toLowerCase().includes(searchTerm) ||
      location.toLowerCase().includes(searchTerm) ||
      type.toLowerCase().includes(searchTerm) ||
      description.toLowerCase().includes(searchTerm);

    const matchesCategory = category === 'all' || item.category === category;
    return matchesSearch && matchesCategory;
  });

  listingGrid.innerHTML = '';

  filtered.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'listing-card';
    const listingId = item.id || `local-${listings.indexOf(item)}`;
    card.dataset.id = listingId;
    const showPoster = isLoggedIn();

    card.innerHTML = `
      ${item.imageUrls && item.imageUrls.length ? `<img src="${item.imageUrls[0]}" alt="${item.title}" />` : ''}
      <small>${item.type}</small>
      <h3>${item.title}</h3>
      <p>${item.location}</p>
      <p>${item.description}</p>
      <div class="meta">
        <span>${item.tag}</span>
        <strong>${item.category}</strong>
        ${showPoster && item.postedBy && item.postedBy !== 'community' ? `<em class="poster">Posted by: ${item.postedBy}</em>` : ''}
      </div>
      <button class="button button-secondary request-button" data-request data-id="${listingId}">${item.type === 'Giveaway' ? 'Claim item' : 'Request swap'}</button>
    `;
    listingGrid.appendChild(card);
  });
}

postForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = itemNameInput.value.trim();
  const location = itemLocationInput.value.trim();
  const description = itemDescriptionInput.value.trim();

  if (!title || !location || !description) return;

  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const imageUrls = imageInput.files?.length
    ? await readFilesAsDataUrls(imageInput.files)
    : [];

  try {
    const response = await fetch(`${API_BASE}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category: itemCategoryInput.value,
        type: itemTypeInput.value,
        location,
        description,
        imageUrls,
        postedBy: (() => {
          try {
            const p = JSON.parse(user);
            return p.username || user;
          } catch (e) {
            return user;
          }
        })()
      })
    });

    if (!response.ok) throw new Error('Unable to post listing');

    postForm.reset();
    imagePreview.innerHTML = '';
    await fetchListings();
  } catch (error) {
    alert('Could not publish your listing right now.');
  }
});

imageInput.addEventListener('change', (event) => {
  handleFiles(event.target.files);
});

dropZone.addEventListener('click', () => {
  imageInput.click();
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('drag-active');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-active');
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('drag-active');
  handleFiles(event.dataTransfer.files);
});

listingGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-request]');
  if (!button) return;

  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  let parsedUser;
  try {
    parsedUser = JSON.parse(user);
  } catch (e) {
    parsedUser = user;
  }

  const username = (parsedUser && parsedUser.username) || parsedUser;
  const listingId = button.dataset.id;

  fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId, requestedBy: username })
  })
    .then((res) => {
      if (!res.ok) throw new Error('Request failed');
      button.textContent = 'Requested';
      button.disabled = true;
    })
    .catch(() => {
      alert('Could not send request. Try again later.');
    });
});

searchInput.addEventListener('input', renderListings);
categoryFilter.addEventListener('change', renderListings);
updateAccountButton();
fetchListings();

// Update hero poster visibility based on login status and listings
function updateHeroPoster() {
  const heroPoster = document.getElementById('heroPoster');
  if (!heroPoster) return;
  const first = listings && listings.length ? listings[0] : null;
  const poster = first && first.postedBy ? first.postedBy : 'community';
  if (isLoggedIn()) {
    heroPoster.textContent = `From: ${poster}`;
  } else {
    heroPoster.textContent = 'From: login to view poster';
  }
}

// run after listings loaded
setTimeout(updateHeroPoster, 300);

// Ads: fetch and render adverts matching user country when logged in
async function fetchAndRenderAds() {
  const adsGrid = document.getElementById('advertsGrid');
  const advertsSection = document.getElementById('advertsSection');
  if (!adsGrid || !advertsSection) return;

  try {
    const res = await fetch(`${API_BASE}/ads`);
    if (!res.ok) throw new Error('Failed to load ads');
    const ads = await res.json();

    const user = (() => {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (e) { return { username: raw }; }
    })();

    adsGrid.innerHTML = '';

    if (!user || !user.country) {
      advertsSection.querySelector('h3').textContent = 'Local adverts';
      adsGrid.innerHTML = '<p class="auth-message">Register to see adverts for your country.</p>';
      return;
    }

    const country = (user.country || '').toLowerCase();
    const matched = ads.filter((a) => (a.country || '').toLowerCase() === country || (a.country || '').toLowerCase() === 'global');

    if (!matched.length) {
      adsGrid.innerHTML = '<p class="auth-message">No adverts for your country yet.</p>';
      return;
    }

    matched.forEach((ad) => {
      const card = document.createElement('article');
      card.className = 'listing-card';
      card.innerHTML = `
        ${ad.imageUrl ? `<img src="${ad.imageUrl}" alt="${ad.title}" />` : ''}
        <h3>${ad.title}</h3>
        <p>${ad.body}</p>
        <div class="meta"><strong>${ad.country}</strong></div>
        <a class="button button-secondary" href="${ad.link}">Learn more</a>
      `;
      adsGrid.appendChild(card);
    });
  } catch (e) {
    adsGrid.innerHTML = '<p class="auth-message">Could not load adverts.</p>';
  }
}

fetchAndRenderAds();
