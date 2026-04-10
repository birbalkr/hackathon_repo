// Tab switching
function setTab(el, tab) {
  document.querySelectorAll('.tab-btn').forEach((t) => t.classList.remove('active'));
  el.classList.add('active');
  alert('Switching to "' + tab + '" view.\n(Connect your router or SPA framework here.)');
}

// Stakeholder filter
function filterSH(el, role) {
  document.querySelectorAll('.sh-btn').forEach((s) => s.classList.remove('active'));
  el.classList.add('active');
  alert('Filtering by stakeholder: ' + role + '\n(Connect your data layer here.)');
}

// Metric card detail
function metricDetail(metric) {
  const msgs = {
    crops: 'Crops Tracked: 12,485 tonnes\nRice: 5,200T | Wheat: 4,100T | Maize: 1,800T | Others: 1,385T',
    transit: 'Active Shipments: 342\nOn-time: 94.2% | Delayed: 5.8% | Avg temp: 29C',
    quality: 'Quality Pass Rate: 96.1%\nGrade A: 72% | Grade B: 24.1% | Failed: 3.9%',
    waste: 'Wastage Reduction: 28.3%\nPre-platform avg: 38% loss\nCurrent: 9.7% loss',
  };
  alert(msgs[metric] || 'No data available.');
}

// Batch selection
function selectBatch(el, batchId) {
  document.querySelectorAll('.batch-item').forEach((b) => b.classList.remove('selected'));
  el.classList.add('selected');
  const subtitles = {
    kt2038: 'Batch #KT-2038 · Paddy Rice · Samastipur',
    kt1998: 'Batch #KT-1998 · Wheat · Muzaffarpur',
    kt1924: 'Batch #KT-1924 · Maize · Vaishali',
    kt2041: 'Batch #KT-2041 · Rice · Patna',
    kt1881: 'Batch #KT-1881 · Black Gram · Gaya',
  };
  document.getElementById('batch-subtitle').textContent = subtitles[batchId] || '';
}

// Batch switcher
function switchBatch(val) {
  const subtitles = {
    kt2038: 'Batch #KT-2038 · Paddy Rice · Samastipur',
    kt1998: 'Batch #KT-1998 · Wheat · Muzaffarpur',
    kt1924: 'Batch #KT-1924 · Maize · Vaishali',
    kt2041: 'Batch #KT-2041 · Rice · Patna',
  };
  document.getElementById('batch-subtitle').textContent = subtitles[val] || '';
}

// Stage expand
function expandStage(el) {
  const wasActive = el.dataset.expanded === '1';
  el.dataset.expanded = wasActive ? '0' : '1';
  el.style.background = wasActive ? '' : '#C8F0D4';
}

// QR scan zone
function openScan() {
  if (typeof window.__openQrUploader === 'function') {
    window.__openQrUploader();
    return;
  }

  const zone = document.getElementById('scan-zone');
  zone.style.borderColor = '#2E9E50';
  zone.style.background = '#C8F0D4';
  setTimeout(() => {
    zone.style.borderColor = '';
    zone.style.background = '';
  }, 1500);
  alert('QR Scanner activated!\n\nIn a real app, open the device camera here using\nnavigator.mediaDevices.getUserMedia() or a library like html5-qrcode.');
}

document.querySelectorAll('#price-chart .bar').forEach((bar) => {
  bar.addEventListener('click', () => {
    if (bar.title) alert(bar.title);
  });
});

function updateClock() {
  const el = document.getElementById('transit-count');
  if (!el) return;
  const base = 342;
  const delta = Math.floor(Math.random() * 3) - 1;
  el.textContent = (base + delta).toLocaleString();
}

setInterval(updateClock, 8000);

const FIREBASE_DATABASE_URL = 'https://lithe-transport-492814-r5-default-rtdb.europe-west1.firebasedatabase.app';
const FIREBASE_AUDIENCE = '59621db6-6a59-43ec-8ce3-0a56d459f0db';
const FIREBASE_SDK_VERSION = '12.12.0';
const QRCODE_LIB_URL = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js';
const JSQR_LIB_URL = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';

const SUPPLY_CHAIN_STEPS = [
  'Ploughing',
  'Sowing',
  'Irrigation',
  'Harvesting',
  'Quality Check',
  'Processing',
  'Packing',
  'Dispatch',
  'In Transit',
  'Warehouse',
  'Retail Supply',
  'Final Sale',
];

let selectedFarmerIndex = 0;
let selectedUserSub = null;
let userAccounts = [];
let recordsByUser = {};
let audienceUsersRaw = {};
let audienceObjectsRaw = {};

const defaultFarmerTrackingData = [];

let farmerTrackingData = [];

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(script);
  });
}

function getAudience(payload) {
  if (payload && payload.aud) {
    return Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;
  }

  return FIREBASE_AUDIENCE;
}

function getUserDisplayName(payload) {
  if (!payload) return 'Guest user';
  return payload.given_name || payload.name || payload.preferred_username || payload.email || 'Guest user';
}

function canonicalStageName(stage) {
  const raw = String(stage || '').toLowerCase().trim();
  if (!raw) return 'Ploughing';
  if (raw.includes('plough')) return 'Ploughing';
  if (raw.includes('sow')) return 'Sowing';
  if (raw.includes('irrig')) return 'Irrigation';
  if (raw.includes('harvest')) return 'Harvesting';
  if (raw.includes('quality')) return 'Quality Check';
  if (raw.includes('process')) return 'Processing';
  if (raw.includes('pack')) return 'Packing';
  if (raw.includes('dispatch')) return 'Dispatch';
  if (raw.includes('transit')) return 'In Transit';
  if (raw.includes('warehouse') || raw.includes('storage')) return 'Warehouse';
  if (raw.includes('retail') || raw.includes('supply')) return 'Retail Supply';
  if (raw.includes('final') || raw.includes('sale') || raw.includes('deliver')) return 'Final Sale';
  return stage;
}

function getNextPendingStep(record) {
  if (!record || !Array.isArray(record.journeyUpdates)) {
    return SUPPLY_CHAIN_STEPS[0];
  }

  const done = new Set(record.journeyUpdates.map((entry) => canonicalStageName(entry.stage)));
  return SUPPLY_CHAIN_STEPS.find((step) => !done.has(step)) || SUPPLY_CHAIN_STEPS[SUPPLY_CHAIN_STEPS.length - 1];
}

function ensureUserBadge() {
  let badge = document.getElementById('dashboardUserBadge');
  if (badge) return badge;

  const headerActions = document.querySelector('header .flex.items-center.gap-6');
  if (!headerActions) return null;

  badge = document.createElement('div');
  badge.id = 'dashboardUserBadge';
  badge.className = 'dashboard-user-badge';
  badge.textContent = 'Loading user...';
  headerActions.prepend(badge);
  return badge;
}

function ensureWelcomeBanner() {
  let banner = document.getElementById('dashboardWelcomeBanner');
  if (banner) return banner;

  const main = document.querySelector('main');
  if (!main) return null;

  banner = document.createElement('div');
  banner.id = 'dashboardWelcomeBanner';
  banner.className = 'dashboard-welcome-banner';
  banner.textContent = 'Loading Firebase data...';
  main.prepend(banner);
  return banner;
}

function updateIdentityUI(userName, connectionText) {
  const badge = ensureUserBadge();
  const banner = ensureWelcomeBanner();

  if (badge) {
    badge.textContent = userName;
  }

  if (banner) {
    banner.textContent = `${userName} · ${connectionText}`;
  }
}

function normalizeFarmerRecord(record, fallbackIndex) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const trackid = record.trackid || record.trackId || record.trackID || record.id || `TRK-${2000 + fallbackIndex}`;
  const updates = Array.isArray(record.updates)
    ? record.updates
    : Array.isArray(record.history)
      ? record.history
      : Array.isArray(record.events)
        ? record.events
        : [];

  return {
    name: record.name || record.farmerName || record.owner || `Farmer ${fallbackIndex + 1}`,
    village: record.village || record.address || record.location || 'Unknown village',
    address: record.address || record.village || record.location || 'Unknown address',
    van_number: record.van_number || record.vanNumber || record.vehicle || 'N/A',
    trackid: String(trackid),
    route: record.route || record.path || record.journey || 'Route pending',
    status: record.status || record.stage || 'Pending',
    image:
      record.image ||
      record.photo ||
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=60',
    updates,
    journeyUpdates: Array.isArray(record.journeyUpdates) ? record.journeyUpdates : [],
    proofImages: Array.isArray(record.proofImages) ? record.proofImages : [],
    __recordKey: record.__recordKey || null,
    __userSub: record.__userSub || null,
  };
}

function extractFarmerRecords(rawValue) {
  if (!rawValue) return [];

  if (Array.isArray(rawValue)) {
    return rawValue.map((record, index) => normalizeFarmerRecord(record, index)).filter(Boolean);
  }

  if (Array.isArray(rawValue.farmers)) {
    return rawValue.farmers.map((record, index) => normalizeFarmerRecord(record, index)).filter(Boolean);
  }

  if (Array.isArray(rawValue.records)) {
    return rawValue.records.map((record, index) => normalizeFarmerRecord(record, index)).filter(Boolean);
  }

  if (rawValue.data && Array.isArray(rawValue.data)) {
    return rawValue.data.map((record, index) => normalizeFarmerRecord(record, index)).filter(Boolean);
  }

  return Object.entries(rawValue)
    .map(([key, value], index) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
      }

      return normalizeFarmerRecord({ ...value, trackid: value.trackid || key }, index);
    })
    .filter(Boolean);
}

function extractFarmerRecordsFromAudienceObjects(rawValue) {
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return {};
  }

  const byUser = {};

  Object.entries(rawValue).forEach(([userKey, userObjects]) => {
    const normalizedRecords = [];
    let fallbackIndex = 0;

    if (typeof userObjects === 'string') {
      const fromString = normalizeFarmerRecord(
        {
          name: userObjects,
          trackid: `TRK-${String(userKey).slice(-4)}`,
          address: 'Unknown address',
          van_number: 'N/A',
          status: 'Created',
        },
        fallbackIndex,
      );

      if (fromString) {
        normalizedRecords.push(fromString);
      }
      byUser[userKey] = normalizedRecords;
      return;
    }

    if (!userObjects || typeof userObjects !== 'object' || Array.isArray(userObjects)) {
      byUser[userKey] = normalizedRecords;
      return;
    }

    const looksLikeSingleRecord =
      'trackid' in userObjects ||
      'name' in userObjects ||
      'route' in userObjects ||
      'status' in userObjects;

    if (looksLikeSingleRecord) {
      const single = normalizeFarmerRecord(
        {
          ...userObjects,
          trackid: userObjects.trackid || userKey,
          __recordKey: userKey,
          __userSub: userKey,
        },
        fallbackIndex,
      );

      if (single) {
        normalizedRecords.push(single);
      }
      byUser[userKey] = normalizedRecords;
      return;
    }

    Object.entries(userObjects).forEach(([recordKey, recordValue]) => {
      if (!recordValue || typeof recordValue !== 'object' || Array.isArray(recordValue)) {
        return;
      }

      const record = normalizeFarmerRecord(
        {
          ...recordValue,
          trackid: recordValue.trackid || recordKey,
          __recordKey: recordKey,
          __userSub: userKey,
        },
        fallbackIndex,
      );

      if (record) {
        normalizedRecords.push(record);
        fallbackIndex += 1;
      }
    });

    byUser[userKey] = normalizedRecords;
  });

  return byUser;
}

function getAllTrackingRecords() {
  return Object.values(recordsByUser).flat();
}

function rebuildUserAccounts() {
  const usersNode = audienceUsersRaw && typeof audienceUsersRaw === 'object' ? audienceUsersRaw : {};
  recordsByUser = extractFarmerRecordsFromAudienceObjects(audienceObjectsRaw);

  const allSubs = new Set([...Object.keys(usersNode), ...Object.keys(recordsByUser)]);
  userAccounts = Array.from(allSubs)
    .map((sub) => {
      const userData = usersNode[sub] || {};
      const userRecords = recordsByUser[sub] || [];
      const fallbackName = userRecords[0] ? userRecords[0].name : `User ${String(sub).slice(0, 6)}`;
      return {
        sub,
        name: userData.name || userData.username || fallbackName,
        username: userData.username || userData.name || '',
        recordCount: userRecords.length,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!userAccounts.length) {
    selectedUserSub = null;
    setupFarmerPanel();
    return;
  }

  const loggedSub = window.__dashboardIdentity && window.__dashboardIdentity.sub;
  const hasSelected = selectedUserSub && userAccounts.some((item) => item.sub === selectedUserSub);
  if (!hasSelected) {
    selectedUserSub = userAccounts.some((item) => item.sub === loggedSub) ? loggedSub : userAccounts[0].sub;
  }

  setupFarmerPanel();
  selectUserBySub(selectedUserSub);
}

function applyFarmerData(sourceLabel) {
  rebuildUserAccounts();
  updateIdentityUI(
    getUserDisplayName(window.__dashboardIdentity),
    `${sourceLabel} · ${userAccounts.length} users`,
  );
}

async function initFirebaseDashboard() {
  const fallbackName = 'Signed-in user';
  window.__dashboardIdentity = null;

  try {
    const payloadResponse = await fetch('/protected/api/idPayload', { credentials: 'same-origin' });
    const payload = payloadResponse.ok ? await payloadResponse.json() : null;
    window.__dashboardIdentity = payload;

    await fetch('/protected/api/bootstrap-user', {
      method: 'POST',
      credentials: 'same-origin',
    });

    const userName = getUserDisplayName(payload) || fallbackName;
    updateIdentityUI(userName, 'Connecting to Firebase...');

    await loadScriptOnce(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app-compat.js`);
    await loadScriptOnce(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-database-compat.js`);

    if (!window.firebase) {
      throw new Error('Firebase SDK is not available');
    }

    if (!firebase.apps.length) {
      firebase.initializeApp({ databaseURL: FIREBASE_DATABASE_URL });
    }

    const audience = getAudience(payload);
    const baseRef = firebase.database().ref(`${audience}/objects`);

    baseRef.on(
      'value',
      (snapshot) => {
        audienceObjectsRaw = snapshot.val() || {};
        const userLabel = getUserDisplayName(window.__dashboardIdentity) || fallbackName;
        applyFarmerData('Firebase live data synced');
        updateIdentityUI(userLabel, `Firebase live data synced · ${userAccounts.length} users`);
      },
      () => {
        applyFarmerData('Firebase error · no records loaded');
      },
    );

    const usersRef = firebase.database().ref(`${audience}/users`);
    usersRef.on(
      'value',
      (snapshot) => {
        audienceUsersRaw = snapshot.val() || {};
        applyFarmerData('Firebase user directory synced');
      },
      () => {
        applyFarmerData('Firebase user directory unavailable');
      },
    );
  } catch (error) {
    window.__dashboardIdentity = null;
    applyFarmerData('Firebase unavailable · no records loaded');
    updateIdentityUI(fallbackName, 'Firebase unavailable · no records loaded');
  }
}

function renderHistory(items) {
  const list = document.getElementById('historyList');
  if (!list) return;
  list.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
}

function renderJourneyProofGallery(images) {
  const gallery = document.getElementById('journeyProofGallery');
  if (!gallery) return;

  if (!images || !images.length) {
    gallery.innerHTML = '<div class="journey-proof-empty">No proof images uploaded yet.</div>';
    return;
  }

  gallery.innerHTML = images
    .slice(0, 4)
    .map(
      (src, idx) =>
        `<div class="journey-proof-item"><img src="${src}" alt="Proof ${idx + 1}" loading="lazy" /></div>`,
    )
    .join('');
}

function renderJourneyStagesForRecord(record) {
  const stagesEl = document.getElementById('journey-stages');
  const subtitleEl = document.getElementById('batch-subtitle');
  if (!stagesEl) return;

  if (!record) {
    stagesEl.innerHTML = '<div class="journey-empty">No journey updates for selected user.</div>';
    if (subtitleEl) subtitleEl.textContent = 'No selected tracking ID';
    renderJourneyProofGallery([]);
    return;
  }

  if (subtitleEl) {
    subtitleEl.textContent = `Track ID ${record.trackid} · ${record.route}`;
  }

  const updates = Array.isArray(record.journeyUpdates) ? record.journeyUpdates : [];
  const latestByStage = {};
  updates.forEach((entry) => {
    const key = canonicalStageName(entry.stage);
    if (!latestByStage[key]) {
      latestByStage[key] = entry;
    }
  });

  const completedCount = SUPPLY_CHAIN_STEPS.filter((step) => !!latestByStage[step]).length;
  const nextPendingIndex = Math.min(completedCount, SUPPLY_CHAIN_STEPS.length - 1);

  stagesEl.innerHTML = SUPPLY_CHAIN_STEPS.map((step, idx) => {
    const entry = latestByStage[step] || null;
    const isDone = !!entry;
    const isActive = !isDone && idx === nextPendingIndex;
    const marker = isDone ? '✓' : isActive ? '→' : idx + 1;
    const markerClass = isDone
      ? 'bg-green-bright text-white'
      : isActive
        ? 'bg-amber dot-active text-white'
        : 'bg-gray-200 text-gray-400';
    const note = entry ? entry.note || 'Completed' : 'Pending update';
    const when = entry && entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : '';

    return `
      <div class="stage-item relative flex gap-4 cursor-pointer rounded-xl px-3 py-3 ${idx < SUPPLY_CHAIN_STEPS.length - 1 ? 'mb-1 stage-line' : ''}" onclick="expandStage(this)">
        <div class="w-8 h-8 rounded-full ${markerClass} flex items-center justify-center text-sm font-bold flex-shrink-0 z-10">${marker}</div>
        <div class="flex-1">
          <div class="text-sm font-semibold ${isDone || isActive ? '' : 'text-gray-400'}">${step}</div>
          <div class="text-xs ${isDone ? 'text-gray-500' : 'text-gray-300'} mt-0.5">${note}</div>
        </div>
        <div class="text-xs text-gray-400 font-semibold whitespace-nowrap">${when}</div>
      </div>
    `;
  }).join('');

  const proofImages = (record.journeyUpdates || []).flatMap((entry) =>
    Array.isArray(entry.proofImages) ? entry.proofImages : [],
  );
  renderJourneyProofGallery(proofImages.length ? proofImages : record.proofImages || []);
}

function selectUserBySub(sub) {
  if (!sub) return;

  selectedUserSub = sub;
  document.querySelectorAll('.farmer-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.sub === sub);
  });

  const user = userAccounts.find((entry) => entry.sub === sub);
  const records = recordsByUser[sub] || [];
  const latest = records[0] || null;

  const trackFarmer = document.getElementById('trackFarmer');
  const trackMeta = document.getElementById('trackMeta');
  const trackStatus = document.getElementById('trackStatus');
  const cropImage = document.getElementById('cropImage');

  if (trackFarmer) trackFarmer.textContent = user ? `${user.name}` : 'User';
  if (trackMeta) {
    trackMeta.textContent = records.length
      ? `${records.length} tracking ID(s) for selected user`
      : 'No tracking IDs for selected user.';
  }
  if (trackStatus) trackStatus.textContent = latest ? latest.status : 'Pending';
  if (cropImage) {
    cropImage.src = latest
      ? latest.image
      : 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=60';
  }

  const historyRows = records.length
    ? records.map((record) => `${record.trackid} · ${record.route} · ${record.status}`)
    : ['No tracking IDs yet for this user.'];
  renderHistory(historyRows);

  renderJourneyStagesForRecord(latest);
}

function selectFarmerByIndex(index) {
  const user = userAccounts[index];
  if (!user) return;
  selectedFarmerIndex = index;
  selectUserBySub(user.sub);
}

function setupFarmerPanel() {
  const farmerList = document.getElementById('farmerList');
  if (!farmerList) return;

  if (!userAccounts.length) {
    farmerList.innerHTML = '<div class="farmer-sub" style="padding:10px;">No user accounts yet.</div>';

    const trackFarmer = document.getElementById('trackFarmer');
    const trackMeta = document.getElementById('trackMeta');
    const trackStatus = document.getElementById('trackStatus');
    const cropImage = document.getElementById('cropImage');
    if (trackFarmer) trackFarmer.textContent = 'No farmer selected';
    if (trackMeta) trackMeta.textContent = 'Users and tracking IDs will appear from Firebase.';
    if (trackStatus) trackStatus.textContent = 'Pending';
    if (cropImage) cropImage.src = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=60';
    renderHistory([]);
    return;
  }

  farmerList.innerHTML = userAccounts
    .map(
      (user, idx) => `
      <button type="button" class="farmer-item" data-index="${idx}" data-sub="${user.sub}">
        <div class="farmer-name">${user.name}</div>
        <div class="farmer-sub">${user.recordCount} tracking IDs</div>
      </button>
    `,
    )
    .join('');

  farmerList.querySelectorAll('.farmer-item').forEach((button) => {
    button.addEventListener('click', () => {
      const idx = Number(button.dataset.index);
      selectFarmerByIndex(idx);
    });
  });

  selectFarmerByIndex(Math.min(selectedFarmerIndex, userAccounts.length - 1));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function setupJourneyUpdater() {
  const journeyBtn = document.getElementById('journeyUpdateBtn');
  if (!journeyBtn) return;

  const ensureJourneyModal = () => {
    let modal = document.getElementById('journeyUpdateModal');
    if (modal) return modal;

    const stageOptionsHtml = SUPPLY_CHAIN_STEPS
      .map((step) => `<option value="${step}">${step}</option>`)
      .join('');

    modal = document.createElement('div');
    modal.id = 'journeyUpdateModal';
    modal.className = 'create-track-modal hidden';
    modal.innerHTML = `
      <div class="create-track-dialog" role="dialog" aria-modal="true" aria-labelledby="journeyUpdateTitle">
        <h3 id="journeyUpdateTitle" class="create-track-title">Update Supply Chain Journey</h3>
        <div class="create-track-form-grid">
          <label>Tracking ID
            <select id="juTrack" class="journey-select"></select>
          </label>
          <label>Stage
            <select id="juStage" class="journey-select">
              ${stageOptionsHtml}
            </select>
          </label>
          <div id="juStepHint" class="journey-step-hint full"></div>
          <label class="full">Update Note
            <textarea id="juNote" class="journey-textarea" placeholder="Add update details"></textarea>
          </label>
          <label class="full">Proof Images (1 to 4)
            <input id="juImages" type="file" accept="image/*" multiple />
            <span class="journey-hint">Upload at least 1 and up to 4 images for this step.</span>
          </label>
        </div>
        <div class="create-track-actions">
          <button type="button" id="juCancel" class="scan-btn modal-cancel">Cancel</button>
          <button type="button" id="juSave" class="scan-btn create-track-btn">Save Update</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.classList.add('hidden');
    });
    modal.querySelector('#juCancel').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    return modal;
  };

  journeyBtn.addEventListener('click', async () => {
    const modal = ensureJourneyModal();
    const payload = window.__dashboardIdentity || {};
    const audience = getAudience(payload);
    const subject = selectedUserSub || payload.sub;
    const records = recordsByUser[subject] || [];
    const trackSelect = modal.querySelector('#juTrack');

    if (!records.length) {
      alert('No tracking IDs available for selected user. Create one first.');
      return;
    }

    trackSelect.innerHTML = records
      .map(
        (record, idx) =>
          `<option value="${idx}">${record.trackid} · ${record.route || 'Route pending'}</option>`,
      )
      .join('');

    const refreshStepHint = () => {
      const selectedIdx = Number(trackSelect.value || 0);
      const selectedRecord = records[selectedIdx];
      const nextStep = getNextPendingStep(selectedRecord);
      const stepHint = modal.querySelector('#juStepHint');
      const stageSelect = modal.querySelector('#juStage');

      if (stageSelect) {
        stageSelect.value = nextStep;
      }
      if (stepHint) {
        stepHint.textContent = `Next required step: ${nextStep}`;
      }
    };

    trackSelect.onchange = refreshStepHint;
    refreshStepHint();

    modal.querySelector('#juNote').value = '';
    modal.querySelector('#juImages').value = '';
    modal.classList.remove('hidden');

    modal.querySelector('#juSave').onclick = async () => {
      const selectedIdx = Number(trackSelect.value || 0);
      const selectedRecord = records[selectedIdx];
      const stage = canonicalStageName(modal.querySelector('#juStage').value);
      const note = modal.querySelector('#juNote').value.trim();
      const imageFiles = Array.from(modal.querySelector('#juImages').files || []);

      if (!selectedRecord) {
        alert('Please select a tracking ID.');
        return;
      }
      if (!note) {
        alert('Please add an update note.');
        return;
      }
      if (imageFiles.length < 1 || imageFiles.length > 4) {
        alert('Please upload 1 to 4 proof images.');
        return;
      }

      const expectedStep = getNextPendingStep(selectedRecord);
      if (stage !== expectedStep) {
        alert(`Please update step-by-step. Next required step is: ${expectedStep}`);
        return;
      }

      try {
        const proofImages = await Promise.all(imageFiles.slice(0, 4).map((file) => fileToDataUrl(file)));
        const journeyEntry = {
          stage,
          note,
          proofImages,
          updatedAt: new Date().toISOString(),
        };

        const nextJourney = [journeyEntry, ...(selectedRecord.journeyUpdates || [])];
        const nextUpdates = [note, ...(selectedRecord.updates || [])];
        const persistRecord = {
          name: selectedRecord.name,
          village: selectedRecord.village,
          address: selectedRecord.address,
          van_number: selectedRecord.van_number,
          trackid: selectedRecord.trackid,
          route: selectedRecord.route,
          status: stage,
          image: selectedRecord.image,
          updates: nextUpdates,
          journeyUpdates: nextJourney,
          proofImages,
        };

        if (!window.firebase || !firebase.apps.length || !audience || !subject) {
          throw new Error('Firebase context unavailable');
        }

        const basePath = `${audience}/objects/${subject}`;
        if (selectedRecord.__recordKey) {
          await firebase.database().ref(`${basePath}/${selectedRecord.__recordKey}`).set(persistRecord);
        } else {
          await firebase.database().ref(basePath).push(persistRecord);
        }

        modal.classList.add('hidden');
      } catch (error) {
        alert('Failed to save journey update. Please try again.');
      }
    };
  });
}

function setupScannerPanel() {
  const scanInput = document.getElementById('scanInput');
  const scanBtn = document.getElementById('scanBtn');
  const createTrackBtn = document.getElementById('createTrackBtn');
  const qrDataBox = document.getElementById('qrDataBox');

  if (!scanInput || !scanBtn || !qrDataBox) return;

  const ensureQrLibs = async () => {
    if (!window.QRCode) {
      await loadScriptOnce(QRCODE_LIB_URL);
    }
    if (!window.jsQR) {
      await loadScriptOnce(JSQR_LIB_URL);
    }
  };

  const formatRecordText = (record) =>
    `name: ${record.name}\ntrackid: ${record.trackid}\naddress: ${record.address || record.village}\nvan_number: ${record.van_number || 'N/A'}\nstatus: ${record.status}\nroute: ${record.route}`;

  const formatTrackingDetails = (record) => {
    const updates = Array.isArray(record.updates) ? record.updates.slice(0, 5) : [];
    const journeyCount = Array.isArray(record.journeyUpdates) ? record.journeyUpdates.length : 0;
    const updatesText = updates.length ? updates.map((item) => `- ${item}`).join('\n') : '- No updates yet';
    return `tracking_updates: ${journeyCount}\nrecent_updates:\n${updatesText}`;
  };

  const createQrPayload = (record) =>
    JSON.stringify({
      name: record.name,
      trackid: record.trackid,
      address: record.address || record.village,
      van_number: record.van_number || 'N/A',
      route: record.route,
      status: record.status,
    });

  const toQrDataUrl = async (text) => {
    await ensureQrLibs();
    if (!window.QRCode || typeof window.QRCode.toDataURL !== 'function') {
      const encoded = encodeURIComponent(text);
      return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}`;
    }

    return new Promise((resolve, reject) => {
      window.QRCode.toDataURL(
        text,
        { width: 220, margin: 1, color: { dark: '#1a6b2e', light: '#ffffff' } },
        (error, url) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(url);
        },
      );
    });
  };

  const showRecordData = async (record, withAutoQr, decodedSourceText) => {
    const text = `${formatRecordText(record)}\n${formatTrackingDetails(record)}`;
    qrDataBox.textContent = text;

    if (!withAutoQr) {
      return;
    }

    try {
      const qrUrl = await toQrDataUrl(createQrPayload(record));
      if (!qrUrl) {
        return;
      }

      const source = decodedSourceText
        ? `<div class="qr-source-note">decoded_qr: ${decodedSourceText.replace(/</g, '&lt;')}</div>`
        : '';
      qrDataBox.innerHTML = `
        <div class="qr-readout">${text.replace(/\n/g, '<br>')}</div>
        ${source}
        <div class="qr-generated-wrap">
          <img src="${qrUrl}" alt="Generated QR code" class="qr-generated-img" />
          <a class="qr-download-link" href="${qrUrl}" download="${record.trackid || 'tracking-id'}.png">Download QR Code</a>
        </div>
      `;
    } catch (error) {
      qrDataBox.textContent = `${text}\n\nQR generation unavailable.`;
    }
  };

  const getTrackIdFromDecodedText = (decodedText) => {
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed && parsed.trackid) {
        return String(parsed.trackid).trim();
      }
    } catch (error) {
      // ignore JSON parse errors and fallback to regex extraction
    }

    const match = decodedText.match(/TRK-\d+/i);
    return match ? match[0].toUpperCase() : '';
  };

  const decodeQrFromFile = async (file) => {
    await ensureQrLibs();
    if (!window.jsQR) {
      throw new Error('QR decoder not available');
    }

    const imageUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });

    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR(imageData.data, canvas.width, canvas.height);
    if (!code || !code.data) {
      throw new Error('No QR code detected');
    }

    return code.data;
  };

  const generateTrackId = () => {
    const existing = new Set(
      getAllTrackingRecords()
        .map((item) => String(item.trackid || '').toUpperCase())
        .filter(Boolean),
    );

    let nextId = '';
    do {
      const num = Math.floor(1000 + Math.random() * 9000);
      nextId = `TRK-${num}`;
    } while (existing.has(nextId));

    return nextId;
  };

  const processScan = () => {
    const rawValue = scanInput.value.trim();
    if (!rawValue) {
      qrDataBox.textContent = 'Please enter QR text or track ID.';
      return null;
    }

    const normalized = rawValue.replace(/^QR:/i, '');
    const allRecords = getAllTrackingRecords();
    const found = allRecords.find((item) => item.trackid.toLowerCase() === normalized.toLowerCase());

    if (!found) {
      qrDataBox.textContent = `No data found for: ${normalized}`;
      return null;
    }

    showRecordData(found, false);

    const owner = Object.entries(recordsByUser).find(([, records]) =>
      records.some((x) => x.trackid.toLowerCase() === found.trackid.toLowerCase()),
    );
    if (owner) {
      selectUserBySub(owner[0]);
    }

    return found;
  };

  let quickQrFileInput = document.getElementById('quickQrUploadInput');
  if (!quickQrFileInput) {
    quickQrFileInput = document.createElement('input');
    quickQrFileInput.id = 'quickQrUploadInput';
    quickQrFileInput.type = 'file';
    quickQrFileInput.accept = 'image/*';
    quickQrFileInput.className = 'hidden';
    document.body.appendChild(quickQrFileInput);
  }

  window.__openQrUploader = () => {
    quickQrFileInput.click();
  };

  quickQrFileInput.onchange = async () => {
    const file = quickQrFileInput.files && quickQrFileInput.files[0];
    if (!file) return;

    try {
      qrDataBox.textContent = 'Reading QR image...';
      const decodedText = await decodeQrFromFile(file);
      const trackId = getTrackIdFromDecodedText(decodedText);
      if (!trackId) {
        qrDataBox.textContent = `QR decoded:\n${decodedText}\n\nNo track ID found in this QR.`;
        return;
      }

      scanInput.value = trackId;
      const found = processScan();
      if (found) {
        await showRecordData(found, false, decodedText);
      }
    } catch (error) {
      qrDataBox.textContent = 'Unable to read QR from image file. Please upload a clear QR image.';
    } finally {
      quickQrFileInput.value = '';
    }
  };

  const ensureCreateTrackModal = () => {
    let modal = document.getElementById('createTrackModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'createTrackModal';
    modal.className = 'create-track-modal hidden';
    modal.innerHTML = `
      <div class="create-track-dialog" role="dialog" aria-modal="true" aria-labelledby="createTrackTitle">
        <h3 id="createTrackTitle" class="create-track-title">Create Tracking ID</h3>
        <div class="create-track-form-grid">
          <label>Name<input id="ctName" type="text" /></label>
          <label>Address<input id="ctAddress" type="text" /></label>
          <label>Track ID<input id="ctTrackid" type="text" /></label>
          <label>Van Number<input id="ctVan" type="text" /></label>
          <label class="full">Route<input id="ctRoute" type="text" /></label>
        </div>
        <div class="create-track-actions">
          <button type="button" id="ctCancel" class="scan-btn modal-cancel">Cancel</button>
          <button type="button" id="ctSave" class="scan-btn create-track-btn">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.classList.add('hidden');
      }
    });

    modal.querySelector('#ctCancel').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    return modal;
  };

  const openCreateTrackModal = (prefillTrackId) => {
    const modal = ensureCreateTrackModal();
    const payload = window.__dashboardIdentity || {};
    const currentUserName = getUserDisplayName(payload);

    modal.querySelector('#ctName').value = currentUserName || '';
    modal.querySelector('#ctAddress').value = '';
    modal.querySelector('#ctTrackid').value = prefillTrackId;
    modal.querySelector('#ctVan').value = 'BR-00-0000';
    modal.querySelector('#ctRoute').value = 'Farmer to Market';
    modal.classList.remove('hidden');

    modal.querySelector('#ctSave').onclick = async () => {
      const name = modal.querySelector('#ctName').value.trim();
      const address = modal.querySelector('#ctAddress').value.trim();
      const trackid = modal.querySelector('#ctTrackid').value.trim().toUpperCase();
      const vanNumber = modal.querySelector('#ctVan').value.trim();
      const route = modal.querySelector('#ctRoute').value.trim();

      if (!name || !address || !trackid || !vanNumber || !route) {
        alert('Please fill all fields.');
        return;
      }

      const createdRecord = {
        name,
        village: address,
        address,
        van_number: vanNumber,
        trackid,
        route,
        status: 'Created',
        image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=60',
        updates: [`Tracking record created for ${name}`],
      };

      try {
        const audience = getAudience(payload);
        const subject = payload.sub;
        if (!window.firebase || !firebase.apps.length || !audience || !subject) {
          throw new Error('Firebase context unavailable');
        }

        // Use push() so each new tracking record is appended instead of overwriting an existing key.
        await firebase.database().ref(`${audience}/objects/${subject}`).push(createdRecord);
        scanInput.value = createdRecord.trackid;
        await showRecordData(createdRecord, true);
        modal.classList.add('hidden');
      } catch (error) {
        qrDataBox.textContent = 'Failed to save tracking record. Please try again.';
      }
    };
  };

  const createTrackingRecord = async () => {
    openCreateTrackModal(generateTrackId());
  };

  scanBtn.addEventListener('click', processScan);

  if (createTrackBtn) {
    createTrackBtn.addEventListener('click', () => {
      createTrackingRecord();
    });
  }

  scanInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      processScan();
    }
  });
}

setupFarmerPanel();
setupScannerPanel();
setupJourneyUpdater();
ensureUserBadge();
ensureWelcomeBanner();
initFirebaseDashboard();

window.setTab = setTab;
window.filterSH = filterSH;
window.metricDetail = metricDetail;
window.selectBatch = selectBatch;
window.switchBatch = switchBatch;
window.expandStage = expandStage;
window.openScan = openScan;
