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

const farmerTrackingData = [
  {
    name: 'Raju Prasad',
    village: 'Bidupur',
    trackid: 'TRK-2038',
    route: 'Samastipur to Patna Market',
    status: 'In Transit',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=60',
    updates: ['Harvest completed on Apr 03', 'Quality check passed on Apr 04', 'Loaded in van BR-15-G-4821'],
  },
  {
    name: 'Suresh Kumar',
    village: 'Muzaffarpur',
    trackid: 'TRK-1998',
    route: 'Muzaffarpur Warehouse to Patna',
    status: 'On Route',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=60',
    updates: ['Wheat batch packed on Apr 05', 'IoT sensor attached', 'Transit started with ETA 3h 20m'],
  },
  {
    name: 'Meera Devi',
    village: 'Vaishali',
    trackid: 'TRK-1924',
    route: 'Vaishali to Patna City Market',
    status: 'Delivered',
    image: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=900&q=60',
    updates: ['Batch verified Grade-A', 'Warehouse dispatch complete', 'Delivered at market and sold'],
  },
];

function renderHistory(items) {
  const list = document.getElementById('historyList');
  if (!list) return;
  list.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
}

function selectFarmerByIndex(index) {
  const farmer = farmerTrackingData[index];
  if (!farmer) return;

  document.querySelectorAll('.farmer-item').forEach((item, idx) => {
    item.classList.toggle('active', idx === index);
  });

  const trackFarmer = document.getElementById('trackFarmer');
  const trackMeta = document.getElementById('trackMeta');
  const trackStatus = document.getElementById('trackStatus');
  const cropImage = document.getElementById('cropImage');

  if (trackFarmer) trackFarmer.textContent = `${farmer.name} (${farmer.trackid})`;
  if (trackMeta) trackMeta.textContent = `${farmer.route} | Village: ${farmer.village}`;
  if (trackStatus) trackStatus.textContent = farmer.status;
  if (cropImage) cropImage.src = farmer.image;

  renderHistory(farmer.updates);
}

function setupFarmerPanel() {
  const farmerList = document.getElementById('farmerList');
  if (!farmerList) return;

  farmerList.innerHTML = farmerTrackingData
    .map(
      (farmer, idx) => `
      <button type="button" class="farmer-item" data-index="${idx}">
        <div class="farmer-name">${farmer.name}</div>
        <div class="farmer-sub">${farmer.village} | ${farmer.trackid}</div>
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

  selectFarmerByIndex(0);
}

function setupScannerPanel() {
  const scanInput = document.getElementById('scanInput');
  const scanBtn = document.getElementById('scanBtn');
  const qrDataBox = document.getElementById('qrDataBox');

  if (!scanInput || !scanBtn || !qrDataBox) return;

  const processScan = () => {
    const rawValue = scanInput.value.trim();
    if (!rawValue) {
      qrDataBox.textContent = 'Please enter QR text or track ID.';
      return;
    }

    const normalized = rawValue.replace(/^QR:/i, '');
    const found = farmerTrackingData.find(
      (item) => item.trackid.toLowerCase() === normalized.toLowerCase(),
    );

    if (!found) {
      qrDataBox.textContent = `No data found for: ${normalized}`;
      return;
    }

    qrDataBox.textContent = `name: ${found.name}\ntrackid: ${found.trackid}\naddress: ${found.village}\nstatus: ${found.status}\nroute: ${found.route}`;
    const selectedIndex = farmerTrackingData.findIndex((x) => x.trackid === found.trackid);
    selectFarmerByIndex(selectedIndex);
  };

  scanBtn.addEventListener('click', processScan);
  scanInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      processScan();
    }
  });
}

setupFarmerPanel();
setupScannerPanel();

window.setTab = setTab;
window.filterSH = filterSH;
window.metricDetail = metricDetail;
window.selectBatch = selectBatch;
window.switchBatch = switchBatch;
window.expandStage = expandStage;
window.openScan = openScan;
