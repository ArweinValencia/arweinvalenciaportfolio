(function () {
    window.addEventListener('DOMContentLoaded', () => {
        // --- MESSAGES STORAGE ---
        let messages = JSON.parse(localStorage.getItem('portfolio_messages') || '[]');
        function saveMessages() { localStorage.setItem('portfolio_messages', JSON.stringify(messages)); }

        // Contact form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('contactName').value.trim();
                const email = document.getElementById('contactEmail').value.trim();
                const msg = document.getElementById('contactMsg').value.trim();
                if (!name || !email || !msg) return alert('Please fill all fields.');
                messages.unshift({ id: Date.now(), name, email, message: msg, timestamp: new Date().toLocaleString() });
                saveMessages();
                alert('✨ Message sent! I will reply soon.');
                e.target.reset();
            });
        }

        // --- ADMIN LOGIC with Search, Filters, Pagination, Delete ---
        const loginModal = document.getElementById('adminLoginModal');
        const dashboardModal = document.getElementById('adminDashboardModal');
        let isLoggedIn = false;
        let currentPage = 1;
        const itemsPerPage = 5;

        function clearLoginInputs() {
            const userField = document.getElementById('adminUsername');
            const passField = document.getElementById('adminPassword');
            if (userField) userField.value = '';
            if (passField) passField.value = '';
            const errDiv = document.getElementById('loginError');
            if (errDiv) errDiv.innerText = '';
        }
        function showLoginModal() { clearLoginInputs(); if (loginModal) loginModal.classList.add('active'); }
        function hideLoginModal() { if (loginModal) loginModal.classList.remove('active'); }
        function showDashboard() { if (!isLoggedIn) return; updateFilterOptions(); applyFiltersAndRender(); if (dashboardModal) dashboardModal.classList.add('active'); }
        function hideDashboard() { if (dashboardModal) dashboardModal.classList.remove('active'); if (isLoggedIn) isLoggedIn = false; }

        // Helper: extract year and month from timestamp string (e.g., "4/10/2025, 3:30:00 PM")
        function getYearMonth(timestamp) {
            let parts = timestamp.split(',')[0].split('/');
            if (parts.length === 3) {
                let month = parseInt(parts[0]), year = parseInt(parts[2]);
                return { year, month };
            }
            return null;
        }

        function updateFilterOptions() {
            const yearSet = new Set();
            const monthSet = new Set();
            messages.forEach(m => {
                const ym = getYearMonth(m.timestamp);
                if (ym) {
                    yearSet.add(ym.year);
                    monthSet.add(ym.month);
                }
            });
            const yearSelect = document.getElementById('yearFilter');
            const monthSelect = document.getElementById('monthFilter');
            if (yearSelect) {
                yearSelect.innerHTML = '<option value="">All Years</option>';
                [...yearSet].sort().forEach(y => { yearSelect.innerHTML += `<option value="${y}">${y}</option>`; });
            }
            if (monthSelect) {
                monthSelect.innerHTML = '<option value="">All Months</option>';
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                [...monthSet].sort((a, b) => a - b).forEach(m => { monthSelect.innerHTML += `<option value="${m}">${monthNames[m - 1]}</option>`; });
            }
        }

        function getFilteredMessages() {
            const searchTerm = document.getElementById('searchMessages')?.value.toLowerCase() || '';
            const yearVal = document.getElementById('yearFilter')?.value;
            const monthVal = document.getElementById('monthFilter')?.value;
            return messages.filter(m => {
                const matchSearch = searchTerm === '' || m.name.toLowerCase().includes(searchTerm) || m.email.toLowerCase().includes(searchTerm) || m.message.toLowerCase().includes(searchTerm);
                let matchYear = true, matchMonth = true;
                const ym = getYearMonth(m.timestamp);
                if (ym) {
                    if (yearVal && ym.year != yearVal) matchYear = false;
                    if (monthVal && ym.month != monthVal) matchMonth = false;
                } else {
                    matchYear = !yearVal; matchMonth = !monthVal;
                }
                return matchSearch && matchYear && matchMonth;
            });
        }

        function renderMessages() {
            const filtered = getFilteredMessages();
            const totalPages = Math.ceil(filtered.length / itemsPerPage);
            if (currentPage > totalPages) currentPage = totalPages || 1;
            const start = (currentPage - 1) * itemsPerPage;
            const paginated = filtered.slice(start, start + itemsPerPage);
            const container = document.getElementById('messagesList');
            if (!container) return;
            if (paginated.length === 0) { container.innerHTML = '<div class="message-item">No messages match.</div>'; }
            else {
                container.innerHTML = paginated.map(m => `
                <div class="message-item" data-id="${m.id}">
                    <button class="delete-msg" data-id="${m.id}"><i class="fas fa-trash-alt"></i></button>
                    <div><span class="message-label"><i class="fas fa-user"></i> Name:</span> ${escapeHtml(m.name)}</div>
                    <div><span class="message-label"><i class="fas fa-envelope"></i> Email:</span> ${escapeHtml(m.email)}</div>
                    <div><span class="message-label"><i class="fas fa-comment"></i> Message:</span> ${escapeHtml(m.message)}</div>
                    <div><span class="message-label"><i class="fas fa-clock"></i> Timestamp:</span> ${escapeHtml(m.timestamp)}</div>
                </div>
                <div class="message-divider"></div>
            `).join('');
                // attach delete event listeners
                document.querySelectorAll('.delete-msg').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = parseInt(btn.getAttribute('data-id'));
                        messages = messages.filter(m => m.id !== id);
                        saveMessages();
                        updateFilterOptions();
                        const filteredNow = getFilteredMessages();
                        if (currentPage > Math.ceil(filteredNow.length / itemsPerPage)) currentPage = Math.max(1, Math.ceil(filteredNow.length / itemsPerPage));
                        applyFiltersAndRender();
                    });
                });
            }
            const pageInfo = document.getElementById('pageInfo');
            if (pageInfo) pageInfo.innerText = `Page ${currentPage} of ${totalPages || 1}`;
            const prevBtn = document.getElementById('prevPageBtn');
            const nextBtn = document.getElementById('nextPageBtn');
            if (prevBtn) prevBtn.disabled = (currentPage <= 1);
            if (nextBtn) nextBtn.disabled = (currentPage >= totalPages || totalPages === 0);
        }

        function applyFiltersAndRender() {
            currentPage = 1;
            renderMessages();
        }

        function escapeHtml(str) {
            return str.replace(/[&<>]/g, function (m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; });
        }

        function login(username, password) {
            if (username === 'admin' && password === 'arwein092623') {
                isLoggedIn = true;
                hideLoginModal();
                showDashboard();
                return true;
            } else {
                const errDiv = document.getElementById('loginError');
                if (errDiv) errDiv.innerText = 'Invalid username or password.';
                return false;
            }
        }
        function logout() { isLoggedIn = false; hideDashboard(); }

        // Event listeners for admin
        const adminPanelBtn = document.getElementById('adminPanelBtn');
        if (adminPanelBtn) {
            adminPanelBtn.addEventListener('click', () => { if (isLoggedIn) showDashboard(); else showLoginModal(); });
        }
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', () => { login(document.getElementById('adminUsername').value, document.getElementById('adminPassword').value); });
        }
        const closeAdminModal = document.getElementById('closeAdminModalBtn');
        if (closeAdminModal) closeAdminModal.addEventListener('click', () => { hideLoginModal(); clearLoginInputs(); });
        const closeDashboardModal = document.getElementById('closeDashboardModalBtn');
        if (closeDashboardModal) closeDashboardModal.addEventListener('click', () => { hideDashboard(); });
        const logoutAdminBtn = document.getElementById('logoutAdminBtn');
        if (logoutAdminBtn) logoutAdminBtn.addEventListener('click', logout);
        const searchInput = document.getElementById('searchMessages');
        if (searchInput) searchInput.addEventListener('input', () => applyFiltersAndRender());
        const yearFilter = document.getElementById('yearFilter');
        if (yearFilter) yearFilter.addEventListener('change', () => applyFiltersAndRender());
        const monthFilter = document.getElementById('monthFilter');
        if (monthFilter) monthFilter.addEventListener('change', () => applyFiltersAndRender());
        const prevPageBtn = document.getElementById('prevPageBtn');
        if (prevPageBtn) prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderMessages(); } });
        const nextPageBtn = document.getElementById('nextPageBtn');
        if (nextPageBtn) nextPageBtn.addEventListener('click', () => { const filtered = getFilteredMessages(); const totalPages = Math.ceil(filtered.length / itemsPerPage); if (currentPage < totalPages) { currentPage++; renderMessages(); } });

        // Password toggle
        const toggleBtn = document.getElementById('togglePasswordBtn');
        const passwordField = document.getElementById('adminPassword');
        if (toggleBtn && passwordField) {
            toggleBtn.addEventListener('click', () => {
                const type = passwordField.type === 'password' ? 'text' : 'password';
                passwordField.type = type;
                toggleBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            });
        }
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) { hideLoginModal(); clearLoginInputs(); }
            if (e.target === dashboardModal) { hideDashboard(); }
        });

        // --- THEME, VANTA, TEXT SIZE ---
        const themeCheckbox = document.getElementById('themeCheckbox');
        const themeSunIcon = document.getElementById('themeSunIcon');
        let vantaEffect = null, themeOverlay = null;
        function createOverlay() { const ov = document.createElement('div'); ov.className = 'theme-transition-overlay'; document.body.appendChild(ov); return ov; }
        if (themeSunIcon) {
            themeSunIcon.addEventListener('click', () => {
                if (themeCheckbox) {
                    themeCheckbox.checked = false;
                    setTheme('light');
                }
            });
        }
        function initVanta(theme) {
            const isDark = theme === 'dark';
            if (vantaEffect) vantaEffect.destroy();
            if (typeof VANTA !== 'undefined' && document.getElementById('vanta-geometric-bg')) {
                vantaEffect = VANTA.NET({ el: "#vanta-geometric-bg", mouseControls: true, touchControls: true, gyroControls: false, minHeight: 200, minWidth: 200, scale: 1.0, scaleMobile: 1.0, color: isDark ? 0xb77cff : 0xc1742b, backgroundColor: isDark ? 0x0a0f1f : 0xfdf4e3, points: 11.0, maxDistance: 21.0, spacing: 13.5 });
            }
        }
        function setTheme(theme) {
            if (!themeOverlay) themeOverlay = createOverlay();
            themeOverlay.classList.add('active');
            setTimeout(() => {
                if (theme === 'dark') { document.body.classList.add('dark'); localStorage.setItem('portfolio-theme', 'dark'); themeCheckbox.checked = true; initVanta('dark'); }
                else { document.body.classList.remove('dark'); localStorage.setItem('portfolio-theme', 'light'); themeCheckbox.checked = false; initVanta('light'); }
                setTimeout(() => themeOverlay.classList.remove('active'), 200);
            }, 20);
        }
        const savedTheme = localStorage.getItem('portfolio-theme');
        if (savedTheme === 'dark') setTheme('dark'); else setTheme('light');
        if (themeCheckbox) themeCheckbox.addEventListener('change', (e) => { if (e.target.checked) setTheme('dark'); else setTheme('light'); });

        function setFontSize(size) {
            document.body.classList.remove('font-small', 'font-medium', 'font-large');
            if (size === 'small') document.body.classList.add('font-small');
            else if (size === 'medium') document.body.classList.add('font-medium');
            else if (size === 'large') document.body.classList.add('font-large');
            localStorage.setItem('preferred-font-size', size);
        }
        const savedFont = localStorage.getItem('preferred-font-size');
        if (savedFont && ['small', 'medium', 'large'].includes(savedFont)) setFontSize(savedFont); else setFontSize('medium');
        document.querySelectorAll('.font-size-option').forEach(opt => {
            opt.addEventListener('click', () => { setFontSize(opt.getAttribute('data-font-size')); const dd = document.getElementById('settingsDropdown'); if (dd) dd.classList.remove('show'); });
        });
        const settingsBtn = document.getElementById('settingsBtn'), dropdown = document.getElementById('settingsDropdown');
        if (settingsBtn && dropdown) {
            settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); });
            window.addEventListener('click', (e) => { if (!settingsBtn.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('show'); });
        }
        const resetPrefBtn = document.getElementById('resetPrefBtn');
        if (resetPrefBtn) resetPrefBtn.addEventListener('click', () => { localStorage.removeItem('portfolio-theme'); localStorage.removeItem('preferred-font-size'); setTheme('light'); setFontSize('medium'); if (dropdown) dropdown.classList.remove('show'); alert('Reset to Light & Medium text.'); });
        const aboutBtn = document.getElementById('aboutBtn');
        if (aboutBtn) aboutBtn.addEventListener('click', (e) => { e.preventDefault(); alert('Arwein Portfolio v2.0'); if (dropdown) dropdown.classList.remove('show'); });
        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) helpBtn.addEventListener('click', (e) => { e.preventDefault(); alert('Use theme toggle, settings, admin panel.'); if (dropdown) dropdown.classList.remove('show'); });
        const mobileBtn = document.getElementById('mobileMenuBtn'), navLinks = document.getElementById('navLinks');
        if (mobileBtn && navLinks) mobileBtn.addEventListener('click', () => navLinks.classList.toggle('show'));

        // Certificate modal
        const certData = { cisco_combined: { title: "Cisco Certifications", images: ["./img/Getting_Started_with_Cisco_Packet_Tracer_certificate.jpg", "./img/Ethical_Hacker_certificate.jpg"], descriptions: ["Packet Tracer", "Ethical Hacker"] }, adv_seminar: { title: "Advanced Seminar Series", images: ["./img/CC_DAY_1_ADVANCE_SEMINAR.png", "./img/CC_DAY_2_ADVANCE_SEMINAR.png"], descriptions: ["Day 1: IT Specialist", "Day 2: Color in Graphic Design"] }, bugsailearn: { title: "BUGSAI TBI LAWIG Cohort 1", images: ["./img/CP_CUSTOMER_VALIDATION.jpg", "./img/CP_LEAN_CANVAS_DEVELOPMENT.jpg"], descriptions: ["Customer Validation", "Lean Canvas Development"] }, pitching: { title: "Level App 2.0 & DOST XI Pitching", images: ["./img/CP_LEVEL_APP.jpeg", "./img/CR_PITCHING_COMPETITION.jpeg"], descriptions: ["Level App 2.0 Exhibit", "Startup Pitching Competition"] } };
        let certIdx = 0, certType = null;
        const certModal = document.getElementById('certModal'), certImg = document.getElementById('modalCertImg'), certCap = document.getElementById('modalCaption');
        function updateCertImg(i) { let d = certData[certType]; if (!d) return; certImg.src = d.images[i]; certCap.innerHTML = `<strong>${d.title}</strong><br>${d.descriptions[i]}`; certImg.onerror = () => { certImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' fill='%23b77cff' text-anchor='middle' dy='.3em'%3ECertificate%3C/text%3E%3C/svg%3E"; }; let cs = document.getElementById('imageCounter'); if (cs && d.images.length > 1) cs.textContent = `${i + 1}/${d.images.length}`; }
        function showCert(type) { let d = certData[type]; if (!d) return; certType = type; certIdx = 0; updateCertImg(0); let mc = document.querySelector('.modal-content'); let oldNav = document.querySelector('.modal-nav'); if (oldNav) oldNav.remove(); if (d.images.length > 1) { let navDiv = document.createElement('div'); navDiv.className = 'modal-nav'; navDiv.style.cssText = 'display:flex; justify-content:space-between; margin-top:1rem; gap:1rem;'; let prev = document.createElement('button'); prev.innerHTML = '← Previous'; prev.style.cssText = 'background:var(--accent); color:white; border:none; padding:0.5rem 1rem; border-radius:2rem; cursor:pointer;'; prev.onclick = () => { if (certIdx > 0) { certIdx--; updateCertImg(certIdx); } }; let next = document.createElement('button'); next.innerHTML = 'Next →'; next.style.cssText = 'background:var(--accent); color:white; border:none; padding:0.5rem 1rem; border-radius:2rem; cursor:pointer;'; next.onclick = () => { if (certIdx < d.images.length - 1) { certIdx++; updateCertImg(certIdx); } }; let counter = document.createElement('span'); counter.id = 'imageCounter'; counter.style.cssText = 'color:var(--accent);'; counter.textContent = `1/${d.images.length}`; navDiv.appendChild(prev); navDiv.appendChild(counter); navDiv.appendChild(next); mc.appendChild(navDiv); } certModal.style.display = 'flex'; }
        document.querySelectorAll('.credential-btn').forEach(btn => btn.addEventListener('click', () => showCert(btn.getAttribute('data-cert'))));
        const closeModalSpan = document.querySelector('.close-modal');
        if (closeModalSpan) closeModalSpan.addEventListener('click', () => { certModal.style.display = 'none'; document.querySelector('.modal-nav')?.remove(); });
        window.addEventListener('click', (e) => { if (e.target === certModal) { certModal.style.display = 'none'; document.querySelector('.modal-nav')?.remove(); } });

        // Resume preview and PDF
        const previewBtn = document.getElementById('previewResumeBtn'), previewModalDiv = document.getElementById('resumePreviewModal'), resumeContainer = document.getElementById('resumeCaptureContainer'), closePrev = document.getElementById('closePreviewModalBtn'), downloadPdf = document.getElementById('downloadPdfFromPreviewBtn');
        function buildResumeHTML() { return `<div class="resume-for-capture" id="resumeToCapture"><div class="resume-header"><h1>Arwein Villar Valencia</h1><p>Creative Developer · Network Specialist · Certified Ethical Hacker</p></div><div class="resume-content"><div style="background:#faf7f0; padding:1rem; border-radius:0.8rem; margin-bottom:1.5rem;"><span>📍 Davao, PH</span> · <span>✉️ arweinvalencia15@gmail.com</span> · <span>📱 +63 912 345 6789</span></div><h2 style="color:#b77cff;">Professional Summary</h2><p>Certified Cisco Packet Tracer & Ethical Hacker, seminar awardee, startup pitching finalist.</p><h2 style="color:#b77cff;">Certifications & Achievements</h2><ul><li>Cisco: Getting Started with Cisco Packet Tracer & Ethical Hacker</li><li>Advanced Seminar Series (Day 1 & 2) – DNSC</li><li>BUGSAI TBI LAWIG Cohort 1 – Customer Validation & Lean Canvas Development</li><li>Level App 2.0 Exhibit & DOST XI Startup Pitching Competition Presenter</li></ul><h2 style="color:#b77cff;">Skills</h2><div><span class="skill-badge">HTML/CSS/JS</span><span class="skill-badge">Canva/Figma</span><span class="skill-badge">UI/UX Design</span></div><hr><p style="text-align:center;">Generated: ${new Date().toLocaleString()}</p></div></div>`; }
        async function showResPreview() { resumeContainer.innerHTML = buildResumeHTML(); previewModalDiv.style.display = 'flex'; }
        async function genPDF() { let el = document.getElementById('resumeToCapture'); if (!el) return; let toast = document.createElement('div'); toast.innerText = '📄 Generating PDF...'; toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:var(--accent);color:white;padding:0.8rem 1.5rem;border-radius:40px;z-index:9999;'; document.body.appendChild(toast); try { let canvas = await html2canvas(el, { scale: 2.5, backgroundColor: '#ffffff' }); let imgData = canvas.toDataURL('image/png'); let { jsPDF } = window.jspdf; let pdf = new jsPDF({ unit: 'mm', format: 'a4' }); let w = 210, h = (canvas.height * w) / canvas.width; pdf.addImage(imgData, 'PNG', 0, 0, w, h); let left = h - 297, pos = -297; while (left > 0) { pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, pos, w, h); left -= 297; pos -= 297; } pdf.save('Arwein_Valencia_Resume.pdf'); toast.innerText = '✅ PDF saved!'; setTimeout(() => toast.remove(), 2000); } catch (e) { toast.innerText = '❌ Error'; setTimeout(() => toast.remove(), 2000); } }
        if (previewBtn) previewBtn.addEventListener('click', showResPreview);
        if (closePrev) closePrev.addEventListener('click', () => previewModalDiv.style.display = 'none');
        if (downloadPdf) downloadPdf.addEventListener('click', genPDF);
        window.addEventListener('click', (e) => { if (e.target === previewModalDiv) previewModalDiv.style.display = 'none'; });

        // Active nav highlight
        const sections = document.querySelectorAll('section'), navItemsAll = document.querySelectorAll('.nav-links a');
        function updateActive() { let cur = '', sc = window.scrollY + 110; sections.forEach(s => { let top = s.offsetTop, h = s.clientHeight; if (sc >= top && sc < top + h) cur = s.getAttribute('id'); }); navItemsAll.forEach(l => { let href = l.getAttribute('href').substring(1); if (href === cur) { l.style.borderBottomColor = 'var(--accent)'; l.style.color = 'var(--accent)'; } else { l.style.borderBottomColor = 'transparent'; l.style.color = 'var(--text-secondary)'; } }); }
        window.addEventListener('scroll', updateActive); window.addEventListener('load', updateActive);
    });
})();
