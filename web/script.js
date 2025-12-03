// Global State
let allPatients = [];
let currentPatientId = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);

    // Initial Load
    setTimeout(() => {
        loadPatients();
    }, 500); // Small delay to ensure backend is ready
});

// Navigation
function switchTab(tabId) {
    // Update Nav Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${tabId}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Update Content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    // Update Title
    const titles = {
        'dashboard': 'Patient Management',
        'reports': 'Reports & Actions',
        'settings': 'Settings'
    };
    document.getElementById('page-title').innerText = titles[tabId];
}

// Theme
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    const isDark = body.getAttribute('data-theme') === 'dark';

    if (isDark) {
        body.setAttribute('data-theme', 'light');
        icon.innerText = 'dark_mode';
    } else {
        body.setAttribute('data-theme', 'dark');
        icon.innerText = 'light_mode';
    }
}

// Toast Notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- API Calls ---

async function loadPatients() {
    try {
        const response = await window.pywebview.api.get_patients();
        allPatients = JSON.parse(response);
        renderTable(allPatients);
        showToast('Patients Loaded');
    } catch (error) {
        console.error('Error loading patients:', error);
        showToast('Error loading data');
    }
}

function renderTable(patients) {
    const tbody = document.getElementById('patient-table-body');
    tbody.innerHTML = '';

    patients.forEach(p => {
        const tr = document.createElement('tr');
        tr.onclick = () => selectPatient(p.id);
        tr.innerHTML = `
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${p.age}</td>
            <td>${p.gender}</td>
            <td>${p.date || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterPatients() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = allPatients.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
    );
    renderTable(filtered);
}

async function selectPatient(id) {
    currentPatientId = id;

    // Highlight Row
    const rows = document.querySelectorAll('.patient-table tr');
    rows.forEach(r => r.classList.remove('selected'));
    // (Simple highlight logic, could be improved with ID lookup)

    try {
        const response = await window.pywebview.api.get_patient_details(id);
        const data = JSON.parse(response);
        populateForm(data);

        // Update QR Preview if available
        updateQRPreview(data.name, data.id);
    } catch (error) {
        console.error(error);
    }
}

function populateForm(data) {
    document.getElementById('p-id').value = data.id || '';
    document.getElementById('p-name').value = data.name || '';
    document.getElementById('p-age').value = data.age || '';
    document.getElementById('p-gender').value = data.gender || 'Male';
    document.getElementById('p-clinic').value = data.clinic || '';
    document.getElementById('p-doctor').value = data.doctor || '';
    document.getElementById('p-date').value = data.last_modified || '';
    document.getElementById('p-phone').value = data.phone || '';
    document.getElementById('p-email').value = data.email || '';
    document.getElementById('p-abs').value = data.abs || '';
    document.getElementById('p-conc').value = data.conc || '';
    document.getElementById('p-trans').value = data.trans || '';

    // Update Status Indicators
    updateStatusIndicators(data.status);
}

function updateStatusIndicators(status) {
    const setStatus = (id, active) => {
        const el = document.getElementById(id);
        if (active) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    };

    if (!status) {
        // Reset all
        ['saved', 'generated', 'emailed', 'whatsapp'].forEach(s => setStatus(`status-${s}`, false));
        return;
    }

    setStatus('status-saved', status.saved);
    setStatus('status-generated', status.generated);
    setStatus('status-emailed', status.emailed);
    setStatus('status-whatsapp', status.whatsapp);
}

function clearForm() {
    currentPatientId = null;
    document.getElementById('patient-form').reset();
    document.getElementById('p-id').focus();
    updateStatusIndicators(null);
    showToast('Ready for new patient');
}

async function savePatient() {
    const data = {
        id: document.getElementById('p-id').value,
        name: document.getElementById('p-name').value,
        age: document.getElementById('p-age').value,
        gender: document.getElementById('p-gender').value,
        clinic: document.getElementById('p-clinic').value,
        doctor: document.getElementById('p-doctor').value,
        date: document.getElementById('p-date').value,
        phone: document.getElementById('p-phone').value,
        email: document.getElementById('p-email').value,
        abs: document.getElementById('p-abs').value,
        conc: document.getElementById('p-conc').value,
        trans: document.getElementById('p-trans').value
    };

    if (!data.id) {
        showToast('Patient ID is required');
        return;
    }

    try {
        const result = await window.pywebview.api.save_patient(JSON.stringify(data));
        if (result) {
            showToast('Patient Saved Successfully');
            loadPatients(); // Refresh list
            // Refresh details to get updated status (though saved is implicit)
            selectPatient(data.id);
        } else {
            showToast('Failed to save');
        }
    } catch (error) {
        console.error(error);
        showToast('Error saving patient');
    }
}

async function deletePatient() {
    if (!currentPatientId) {
        showToast('Select a patient first');
        return;
    }

    if (!confirm('Are you sure you want to delete this patient?')) return;

    try {
        const result = await window.pywebview.api.delete_patient(currentPatientId);
        if (result) {
            showToast('Patient Deleted');
            clearForm();
            loadPatients();
        } else {
            showToast('Delete failed');
        }
    } catch (error) {
        console.error(error);
    }
}

async function generateReport() {
    if (!currentPatientId) {
        showToast('Save patient first');
        return;
    }

    showToast('Generating Report... Please Wait');

    try {
        const result = await window.pywebview.api.generate_report(currentPatientId);
        const res = JSON.parse(result);

        if (res.success) {
            showToast('Report Generated!');
            // Switch to reports tab to show QR
            switchTab('reports');
            // Force refresh QR
            const name = document.getElementById('p-name').value;
            updateQRPreview(name, currentPatientId);
            // Refresh status
            selectPatient(currentPatientId);
        } else {
            showToast('Generation Failed: ' + res.message);
        }
    } catch (error) {
        console.error(error);
        showToast('Error calling generator');
    }
}

async function updateQRPreview(name, id) {
    try {
        // Ask backend for the QR image path or base64
        const qrData = await window.pywebview.api.get_qr_data(name, id);
        const display = document.getElementById('qr-display');

        if (qrData) {
            display.innerHTML = `<img src="${qrData}" alt="QR Code">`;
            document.getElementById('qr-status').innerText = `Report Ready for ${name}`;
        } else {
            display.innerHTML = `
                <span class="material-icons-round" style="font-size: 48px; color: var(--text-secondary);">qr_code_scanner</span>
                <p>QR not found. Generate report first.</p>
            `;
            document.getElementById('qr-status').innerText = '';
        }
    } catch (error) {
        console.error(error);
    }
}

// Actions
function sendEmail() {
    if (!currentPatientId) return showToast('Select patient first');
    window.pywebview.api.send_email(currentPatientId);
    setTimeout(() => selectPatient(currentPatientId), 1000); // Refresh status after delay
}

function sendWhatsapp() {
    if (!currentPatientId) return showToast('Select patient first');
    window.pywebview.api.send_whatsapp(currentPatientId);
    setTimeout(() => selectPatient(currentPatientId), 1000); // Refresh status after delay
}




function printQR() {
    window.print(); // Simple print, or call backend for specific printing
}

function openFolder() {
    if (!currentPatientId) return showToast('Select patient first');
    window.pywebview.api.open_folder(currentPatientId);
}

function openVercel() {
    window.pywebview.api.open_vercel();
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
        clockEl.innerText = timeString;
    }
}
