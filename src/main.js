/* ==========================================================================
   PPPI Admin Portal - Main Application Logic
   ========================================================================== */

import {
  apiGetUsers,
  apiUpdateUser,
  apiDeleteUser,
  apiGetPosts,
  apiDeletePost,
  apiGetPlans,
  apiCreatePlan,
  apiDeletePlan,
  apiGetEvents,
  apiGetEventRegistrations,
  apiCreateEvent,
  apiDeleteEvent,
  apiGetDonations,
  apiGetFunds,
  apiCreateFund,
  apiUpdateFund,
  apiDeleteFund,
  apiGetNotifications,
  apiToggleNotificationRead,
  apiMarkAllNotificationsRead,
  apiSendNotification,
  apiDeleteNotification,
  apiGetLiveStreams,
  apiGetActiveLiveStreams,
  apiEndLiveStream,
  apiGetEnquiries,
  apiDeleteEnquiry,
  apiGetJoinRequests,
  apiDeleteJoinRequest,
  apiGetManifesto,
  apiCreateManifesto,
  apiDeleteManifesto,
  apiGetGallery,
  apiCreateGallery,
  apiDeleteGallery,
  apiGetNewsletters,
  apiCreateNewsletter,
  apiDeleteNewsletter,
  apiGetPublicities,
  apiCreatePublicity,
  apiDeletePublicity,
  apiGetComplaints,
  apiGetComplaintById,
  apiUpdateComplaint,
  apiDeleteComplaint,
  apiGetJobs,
  apiCreateJob,
  apiUpdateJob,
  apiDeleteJob,
  apiGetJobApplications,
  apiUpdateJobApplication,
  apiGetAgriQuestions,
  apiDeleteAgriQuestion,
  apiDeleteAgriAnswer,
  apiGetLegalCases,
  apiUpdateLegalCase,
  apiDeleteLegalCase,
  apiGetMarriageApplications,
  apiUpdateMarriageApplication,
  apiDeleteMarriageApplication,
  apiGetEmergencyAlerts,
  apiGetEmergencyPoll,
  apiUpdateEmergencyAlert,
  apiFileEmergencyPetition,
  apiDeleteEmergencyAlert,
  apiGetElections,
  apiCreateElection,
  apiUpdateElection,
  apiDeleteElection,
  apiGetConstituencies,
  apiAssignCandidate,
  apiRemoveCandidate,
  apiUpdateConstituency,
  apiGetEligibleCandidates,
  apiGetSettings,
  apiToggleMaintenance,
  apiUpdateSettings,
  apiUploadMediaFile,
  apiLoginAdmin,
  apiLogoutAdmin,
  getAdminToken,
  getApiBaseUrl,
  setApiBaseUrl
} from './api.js';

// Application State
let appData = {
  users: [],
  posts: [],
  plans: [],
  events: [],
  donations: [],
  funds: [],
  notifications: [],
  enquiries: [],
  joinRequests: [],
  manifesto: [],
  gallery: [],
  newsletters: [],
  publicities: [],
  complaints: [],
  jobs: [],
  applications: [],
  agriQuestions: [],
  legalCases: [],
  marriageApplications: [],
  emergencyAlerts: [],
  elections: [],
  constituencies: [],
  eligibleCandidates: [],
  selectedElectionId: 1,
  electionDistrictFilter: 'ALL',
  electionStatusFilter: 'ALL',
  electionSearchQuery: '',
  settings: {
    maintenance_mode: false,
    maintenance_message: 'Currently Website & Mobile App Under Development',
    maintenance_subtext: 'Our mobile app and web services will be fully operational shortly.',
    contact_helpline: '+91 7259798393',
    contact_email: 'bpasha46@gmail.com'
  }
};

let charts = {};

/* ==========================================================================
   Global Loader & Spinner Helper Functions
   ========================================================================== */

function showTopLoader() {
  const bar = document.getElementById('top-loader-bar');
  if (bar) {
    bar.classList.remove('finish');
    bar.classList.add('active');
  }
}

function hideTopLoader() {
  const bar = document.getElementById('top-loader-bar');
  if (bar) {
    bar.classList.remove('active');
    bar.classList.add('finish');
    setTimeout(() => {
      bar.classList.remove('finish');
    }, 400);
  }
}

function showScreenLoader(text = 'Loading Admin Portal...') {
  const overlay = document.getElementById('screen-loader-overlay');
  const label = document.getElementById('screen-loader-text');
  if (label) label.textContent = text;
  if (overlay) overlay.classList.add('active');
}

function hideScreenLoader() {
  const overlay = document.getElementById('screen-loader-overlay');
  if (overlay) overlay.classList.remove('active');
}

function setBtnLoading(btn, isLoading, loadingText = 'Processing...', customIcon = 'fa-spinner fa-spin') {
  if (!btn) return;
  if (isLoading) {
    if (!btn.dataset.origHtml) {
      btn.dataset.origHtml = btn.innerHTML;
    }
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid ${customIcon}"></i> ${loadingText}`;
  } else {
    btn.disabled = false;
    if (btn.dataset.origHtml) {
      btn.innerHTML = btn.dataset.origHtml;
      delete btn.dataset.origHtml;
    }
  }
}

// DOM Ready & App Initialization Handler
async function initApp() {
  setupNavigation();
  setupThemeToggle();
  setupModals();
  setupAdminAuth();
  setupSettingsForm();
  renderMaintenanceView();
  setupJobModals();
  setupAgricultureAdminListeners();
  setupLawAdminListeners();
  setupMarriageAdminListeners();
  setupEmergencyAdminListeners();
  setupElectionAdminListeners();
  applyRoleAccessControl();

  // Global Click Event Delegation for Maintenance controls
  document.addEventListener('click', (e) => {
    const maintToggle = e.target.closest('#btn-toggle-maintenance-settings, #btn-toggle-maintenance');
    if (maintToggle) {
      e.preventDefault();
      promptMaintenanceConfirmation();
      return;
    }

    const goMaint = e.target.closest('#btn-settings-go-maintenance');
    if (goMaint) {
      e.preventDefault();
      const navItem = document.querySelector('[data-view="maintenance"]');
      if (navItem) navItem.click();
      return;
    }
  });

  if (getAdminToken()) {
    showDashboardView();
    showScreenLoader('Initializing Admin Portal & Fetching Live Data...');
    try {
      await loadAllData();
    } finally {
      hideScreenLoader();
    }
  } else {
    showLoginView();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function showDashboardView() {
  const loginScreen = document.getElementById('admin-login-screen');
  const dashboardApp = document.getElementById('admin-dashboard-app');
  if (loginScreen) loginScreen.style.setProperty('display', 'none', 'important');
  if (dashboardApp) dashboardApp.style.setProperty('display', 'flex', 'important');
}

function showLoginView() {
  const loginScreen = document.getElementById('admin-login-screen');
  const dashboardApp = document.getElementById('admin-dashboard-app');
  if (dashboardApp) dashboardApp.style.setProperty('display', 'none', 'important');
  if (loginScreen) loginScreen.style.setProperty('display', 'flex', 'important');
}

function setupAdminAuth() {
  const loginForm = document.getElementById('form-admin-login');
  const loginBtn = document.getElementById('btn-admin-login-submit');
  const logoutBtn = document.getElementById('btn-admin-logout');
  const loginError = document.getElementById('admin-login-error');

  const handleLoginSubmit = async () => {
    const phoneInput = document.getElementById('admin-login-phone');
    const passwordInput = document.getElementById('admin-login-password');
    const rememberMeInput = document.getElementById('admin-remember-me');

    const phone = phoneInput ? phoneInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    const rememberMe = rememberMeInput ? rememberMeInput.checked : false;

    if (!phone || !password) {
      if (loginError) {
        loginError.style.display = 'block';
        loginError.textContent = 'Please enter both mobile number and password.';
      }
      return;
    }

    setBtnLoading(loginBtn, true, 'Logging in to Admin Portal...');
    if (loginError) loginError.style.display = 'none';

    try {
      await apiLoginAdmin(phone, password, rememberMe);
      showDashboardView();
      showScreenLoader('Welcome back Admin! Loading Portal Data...');
      await loadAllData();
    } catch (err) {
      if (loginError) {
        loginError.style.display = 'block';
        loginError.textContent = err.message || 'Login failed. Please check admin credentials.';
      }
    } finally {
      setBtnLoading(loginBtn, false);
      hideScreenLoader();
    }
  };

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLoginSubmit();
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLoginSubmit();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      apiLogoutAdmin();
      showLoginView();
    });
  }
}

// Load All Data & Populate Views
async function loadAllData() {
  showTopLoader();
  try {
    const results = await Promise.allSettled([
      apiGetUsers(),
      apiGetPosts(),
      apiGetPlans(),
      apiGetEvents(),
      apiGetDonations(),
      apiGetFunds(),
      apiGetNotifications(),
      apiGetLiveStreams(),
      apiGetEnquiries(),
      apiGetJoinRequests(),
      apiGetManifesto(),
      apiGetGallery(),
      apiGetNewsletters(),
      apiGetPublicities(),
      apiGetComplaints(),
      apiGetJobs(),
      apiGetJobApplications(),
      apiGetSettings()
    ]);

    const users = results[0].status === 'fulfilled' ? results[0].value : [];
    const posts = results[1].status === 'fulfilled' ? results[1].value : [];
    const plans = results[2].status === 'fulfilled' ? results[2].value : [];
    const events = results[3].status === 'fulfilled' ? results[3].value : [];
    const donations = results[4].status === 'fulfilled' ? results[4].value : [];
    const funds = results[5].status === 'fulfilled' ? results[5].value : [];
    const notifResult = results[6].status === 'fulfilled' ? results[6].value : null;
    const liveStreams = results[7].status === 'fulfilled' ? results[7].value : [];
    const enquiries = results[8].status === 'fulfilled' ? results[8].value : [];
    const joinRequests = results[9].status === 'fulfilled' ? results[9].value : [];
    const manifesto = results[10].status === 'fulfilled' ? results[10].value : [];
    const gallery = results[11].status === 'fulfilled' ? results[11].value : [];
    const newsletters = results[12].status === 'fulfilled' ? results[12].value : [];
    const publicities = results[13].status === 'fulfilled' ? results[13].value : [];
    const complaints = results[14].status === 'fulfilled' ? results[14].value : [];
    const settings = results[15].status === 'fulfilled' ? results[15].value : null;

    appData.users = users || [];
    appData.posts = posts || [];
    appData.plans = plans || [];
    appData.events = events || [];
    appData.donations = donations || [];
    appData.funds = funds || [];

    if (notifResult && typeof notifResult === 'object' && Array.isArray(notifResult.notifications)) {
      appData.notifications = notifResult.notifications;
      appData.unreadNotifCount = notifResult.unreadCount !== undefined ? notifResult.unreadCount : appData.notifications.filter(n => !n.is_read).length;
    } else {
      appData.notifications = Array.isArray(notifResult) ? notifResult : [];
      appData.unreadNotifCount = appData.notifications.filter(n => !n.is_read).length;
    }

    appData.liveStreams = liveStreams || [];
    appData.enquiries = enquiries || [];
    appData.joinRequests = joinRequests || [];
    appData.manifesto = manifesto || [];
    appData.gallery = gallery || [];
    appData.newsletters = newsletters || [];
    appData.publicities = publicities || [];
    appData.complaints = complaints || [];
    appData.settings = settings || { maintenance_mode: false };

    updateBadges();
    renderDashboard();
    renderUsersTable();
    renderPostsGrid();
    renderEventsGrid();
    renderPlansGrid();
    renderDonationsTable();
    renderNotificationsTable();
    renderLiveStreamsView();
    renderEnquiriesTable();
    renderJoinRequestsTable();
    renderManifestoGrid();
    renderGalleryGrid();
    renderNewsletterGrid();
    renderPublicityGrid();
    renderComplaintsTable();
    renderMaintenanceView();
    populateUserNotificationDropdown();

    try {
      appData.elections = await apiGetElections();
      const cRes = await apiGetConstituencies({ election_id: appData.selectedElectionId || 1 });
      if (cRes && cRes.data) {
        appData.constituencies = cRes.data;
      }
      appData.eligibleCandidates = await apiGetEligibleCandidates();
      renderElectionsView();
    } catch (e) {
      console.warn('loadAllData elections fetch notice:', e);
    }
  } catch (err) {
    console.error('Error initializing admin app data:', err);
  } finally {
    hideTopLoader();
  }
}

// Update Badges & Counters
function updateBadges() {
  const badgeElections = document.getElementById('badge-elections-count');
  if (badgeElections) badgeElections.textContent = appData.constituencies ? appData.constituencies.length : 224;

  const badgeJobs = document.getElementById('badge-jobs-count');
  if (badgeJobs) badgeJobs.textContent = appData.jobs ? appData.jobs.length : 0;
  const countTabJobs = document.getElementById('count-tab-jobs');
  if (countTabJobs) countTabJobs.textContent = appData.jobs ? appData.jobs.length : 0;
  const countTabApps = document.getElementById('count-tab-apps');
  if (countTabApps) countTabApps.textContent = appData.applications ? appData.applications.length : 0;
  document.getElementById('badge-users-count').textContent = appData.users.length;
  document.getElementById('badge-posts-count').textContent = appData.posts.length;

  const unreadNotifs = typeof appData.unreadNotifCount === 'number'
    ? appData.unreadNotifCount
    : appData.notifications.filter(n => !n.is_read).length;

  const notifBadge = document.getElementById('badge-notif-count');
  if (notifBadge) {
    notifBadge.textContent = unreadNotifs;
  }

  const activeStreamsCount = appData.liveStreams.filter(s => s.status === 'LIVE').length;
  const liveBadge = document.getElementById('badge-livestreams-count');
  if (liveBadge) liveBadge.textContent = activeStreamsCount;

  const enquiryBadge = document.getElementById('badge-enquiries-count');
  if (enquiryBadge) enquiryBadge.textContent = appData.enquiries.length;

  const joinReqBadge = document.getElementById('badge-join-requests-count');
  if (joinReqBadge) joinReqBadge.textContent = appData.joinRequests.length;

  const manifestoBadge = document.getElementById('badge-manifesto-count');
  if (manifestoBadge) manifestoBadge.textContent = appData.manifesto.length;

  const galleryBadge = document.getElementById('badge-gallery-count');
  if (galleryBadge) galleryBadge.textContent = appData.gallery.length;

  const newsletterBadge = document.getElementById('badge-newsletter-count');
  if (newsletterBadge) newsletterBadge.textContent = appData.newsletters.length;

  const publicityBadge = document.getElementById('badge-publicity-count');
  if (publicityBadge) publicityBadge.textContent = appData.publicities.length;

  const pendingComplaints = appData.complaints.filter(c => c.status === 'PENDING' || c.status === 'UNDER_REVIEW').length;
  const complaintsBadge = document.getElementById('badge-complaints-count');
  if (complaintsBadge) complaintsBadge.textContent = pendingComplaints || appData.complaints.length;

  const statComplaintsTotal = document.getElementById('stat-complaints-total');
  if (statComplaintsTotal) statComplaintsTotal.textContent = appData.complaints.length;

  const statComplaintsPending = document.getElementById('stat-complaints-pending');
  if (statComplaintsPending) statComplaintsPending.textContent = appData.complaints.filter(c => c.status === 'PENDING').length;

  const statComplaintsAction = document.getElementById('stat-complaints-action');
  if (statComplaintsAction) statComplaintsAction.textContent = appData.complaints.filter(c => c.status === 'ACTION_TAKEN' || c.status === 'UNDER_REVIEW').length;

  const statComplaintsResolved = document.getElementById('stat-complaints-resolved');
  if (statComplaintsResolved) statComplaintsResolved.textContent = appData.complaints.filter(c => c.status === 'RESOLVED').length;

  const maintBadge = document.getElementById('badge-maintenance-status');
  if (maintBadge) {
    const isMaint = Boolean(appData.settings && appData.settings.maintenance_mode);
    maintBadge.textContent = isMaint ? 'MAINTENANCE' : 'LIVE';
    maintBadge.style.background = isMaint ? '#f59e0b' : '#10b981';
  }

  document.getElementById('stat-total-users').textContent = appData.users.length;
  document.getElementById('stat-total-posts').textContent = appData.posts.length;
  document.getElementById('stat-total-plans').textContent = appData.plans.length;
}

// 1. Navigation View Switching
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.content-view');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('toggle-sidebar-btn');

  const closeMobileSidebar = () => {
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  };

  navItems.forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');

      showTopLoader();
      setTimeout(hideTopLoader, 350);

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      views.forEach(v => {
        v.classList.remove('active');
        if (v.id === `view-${targetView}`) {
          v.classList.add('active');
        }
      });

      closeMobileSidebar();
      renderMaintenanceView();
    });
  });

  // Top Navbar Bell Notification Button
  const notifBtn = document.getElementById('notif-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      const navItem = document.querySelector('[data-view="notifications"]');
      if (navItem) navItem.click();
    });
  }

  // Mobile Toggle Sidebar
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (sidebar) sidebar.classList.toggle('mobile-open');
      if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }

  // Refresh Dashboard Button
  const btnDashRefresh = document.getElementById('btn-refresh-dashboard');
  if (btnDashRefresh) {
    btnDashRefresh.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      setBtnLoading(btn, true, 'Refreshing...');
      try {
        await loadAllData();
        alert('Dashboard data refreshed successfully!');
      } finally {
        setBtnLoading(btn, false);
      }
    });
  }
}

// 2. Theme Toggle (Dark/Light)
function setupThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle-btn');
  const icon = themeBtn.querySelector('i');

  themeBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    icon.className = newTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  });
}

// Helper to generate chronological real activities from live datasets
function generateRealActivities() {
  const activities = [];

  appData.users.forEach(u => {
    activities.push({
      type: 'USER',
      title: `New Member Registered: ${u.name || 'Anonymous'}`,
      category: `${u.district || 'District N/A'}, ${u.state_ut || 'State N/A'}`,
      time: u.createdat ? new Date(u.createdat).toLocaleString() : 'Recent',
      timestamp: u.createdat ? new Date(u.createdat).getTime() : 0,
      icon: 'fa-user-plus',
      bg: 'rgba(99, 102, 241, 0.15)',
      color: '#6366F1'
    });
  });

  appData.posts.forEach(p => {
    activities.push({
      type: 'POST',
      title: `New Post Published by ${p.user?.name || 'Member'}`,
      category: (p.description || 'No description').substring(0, 45) + (p.description && p.description.length > 45 ? '...' : ''),
      time: p.created_at ? new Date(p.created_at).toLocaleString() : 'Recent',
      timestamp: p.created_at ? new Date(p.created_at).getTime() : 0,
      icon: 'fa-file-signature',
      bg: 'rgba(168, 85, 247, 0.15)',
      color: '#A855F7'
    });
  });

  appData.donations.forEach(d => {
    activities.push({
      type: 'PAYMENT',
      title: `Payment Received: ₹${Number(d.amount).toLocaleString()} from ${d.donor}`,
      category: `${d.fund} • ${d.method}`,
      time: d.date || 'Recent',
      timestamp: d.date ? new Date(d.date).getTime() : 0,
      icon: 'fa-credit-card',
      bg: 'rgba(16, 185, 129, 0.15)',
      color: '#10B981'
    });
  });

  appData.events.forEach(e => {
    activities.push({
      type: 'EVENT',
      title: `Campaign Event Scheduled: ${e.title}`,
      category: `${e.date} • ${e.venue}`,
      time: e.date || 'Recent',
      timestamp: e.date ? new Date(e.date).getTime() : 0,
      icon: 'fa-calendar-check',
      bg: 'rgba(245, 158, 11, 0.15)',
      color: '#F59E0B'
    });
  });

  activities.sort((a, b) => b.timestamp - a.timestamp);
  return activities;
}

// 3. Render Dashboard Overview & Charts
function renderDashboard() {
  // Compute Total Revenue
  const donationsTotal = appData.donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const paidMembersCount = appData.users.filter(u => u.is_paid).length;
  const subscriptionsTotal = paidMembersCount * 15000;
  const totalRevenue = donationsTotal + subscriptionsTotal;

  const statRevenue = document.getElementById('stat-total-revenue');
  if (statRevenue) statRevenue.textContent = `₹${totalRevenue.toLocaleString()}`;

  // Live Activity Feed top 5
  const activityList = document.getElementById('dashboard-activity-list');
  if (activityList) {
    activityList.innerHTML = '';
    const realActivities = generateRealActivities().slice(0, 5);

    realActivities.forEach(act => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.innerHTML = `
        <div class="activity-icon" style="background:${act.bg}; color:${act.color};">
          <i class="fa-solid ${act.icon}"></i>
        </div>
        <div class="activity-details">
          <span class="activity-title">${act.title}</span>
          <span class="activity-time">${act.time} • ${act.category}</span>
        </div>
      `;
      activityList.appendChild(item);
    });
  }

  // Enable View All button navigation
  const btnViewAll = document.getElementById('btn-view-all-activity');
  if (btnViewAll) {
    btnViewAll.onclick = () => {
      const navItem = document.querySelector('[data-view="activity"]');
      if (navItem) navItem.click();
    };
  }

  // Action Tile Shortcuts
  const tileEvent = document.getElementById('tile-create-event');
  if (tileEvent) tileEvent.onclick = () => openModal('modal-event');
  const tilePlan = document.getElementById('tile-add-plan');
  if (tilePlan) tilePlan.onclick = () => openModal('modal-plan');
  const tileUsers = document.getElementById('tile-manage-users');
  if (tileUsers) tileUsers.onclick = () => document.querySelector('[data-view="users"]').click();
  const tilePosts = document.getElementById('tile-view-posts');
  if (tilePosts) tilePosts.onclick = () => document.querySelector('[data-view="posts"]').click();

  initCharts();
  renderActivityScreen();
}

// Chart.js Setup
function initCharts() {
  if (typeof Chart === 'undefined') return;

  if (charts.growth) charts.growth.destroy();
  if (charts.pie) charts.pie.destroy();

  // Aggregate monthly counts from real user and post timestamps
  const userMonthly = [0, 0, 0, 0, 0, 0, 0];
  const postMonthly = [0, 0, 0, 0, 0, 0, 0];

  appData.users.forEach(u => {
    if (u.createdat) {
      const m = new Date(u.createdat).getMonth();
      if (m >= 0 && m < 7) userMonthly[m]++;
    } else {
      userMonthly[0]++;
    }
  });

  appData.posts.forEach(p => {
    if (p.created_at) {
      const m = new Date(p.created_at).getMonth();
      if (m >= 0 && m < 7) postMonthly[m]++;
    } else {
      postMonthly[0]++;
    }
  });

  const ctxGrowth = document.getElementById('userGrowthChart').getContext('2d');
  charts.growth = new Chart(ctxGrowth, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [
        {
          label: 'User Registrations',
          data: userMonthly,
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Community Posts',
          data: postMonthly,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#9CA3AF' } } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } }
      }
    }
  });

  // Calculate actual membership distribution counts
  const paidCount = appData.users.filter(u => u.is_paid && u.role !== 'ADMIN').length;
  const freeCount = appData.users.filter(u => !u.is_paid && u.role !== 'ADMIN').length;
  const adminCount = appData.users.filter(u => u.role === 'ADMIN').length;

  const ctxPie = document.getElementById('membershipPieChart').getContext('2d');
  charts.pie = new Chart(ctxPie, {
    type: 'doughnut',
    data: {
      labels: ['Gold / Paid Tier', 'Free / Student Tier', 'Administrators'],
      datasets: [
        {
          data: [paidCount || 1, freeCount || 1, adminCount || 1],
          backgroundColor: ['#F59E0B', '#6366F1', '#10B981']
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF' } } }
    }
  });
}

// 10. Render Platform Activity Log Screen
function renderActivityScreen() {
  const tbody = document.getElementById('activity-table-body');
  const searchInput = document.getElementById('activity-search-input');
  const typeFilter = document.getElementById('activity-type-filter');
  if (!tbody) return;

  function filterAndRender() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedType = typeFilter ? typeFilter.value : 'ALL';
    const allActivities = generateRealActivities();

    const filtered = allActivities.filter(act => {
      const matchesSearch = act.title.toLowerCase().includes(query) || act.category.toLowerCase().includes(query);
      const matchesType = selectedType === 'ALL' || act.type === selectedType;
      return matchesSearch && matchesType;
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--text-muted);">No activity records match query.</td></tr>`;
      return;
    }

    filtered.forEach(act => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <span class="status-pill" style="background:${act.bg}; color:${act.color};">
            <i class="fa-solid ${act.icon}"></i> ${act.type}
          </span>
        </td>
        <td><strong>${act.title}</strong></td>
        <td><span class="pill-tag">${act.category}</span></td>
        <td>${act.time}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  if (searchInput) searchInput.oninput = filterAndRender;
  if (typeFilter) typeFilter.onchange = filterAndRender;

  filterAndRender();
}


// 4. Render Users Table with Filters
function renderUsersTable() {
  const tbody = document.getElementById('users-table-body');
  const searchInput = document.getElementById('user-search-input');
  const roleFilter = document.getElementById('user-role-filter');
  const statusFilter = document.getElementById('user-status-filter');

  function filterAndRender() {
    const query = searchInput.value.toLowerCase().trim();
    const roleVal = roleFilter.value;
    const statusVal = statusFilter.value;

    const filtered = appData.users.filter(user => {
      const matchesSearch =
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query)) ||
        (user.phone && user.phone.includes(query));

      const matchesRole = roleVal === 'ALL' || user.role === roleVal;
      const matchesStatus =
        statusVal === 'ALL' ||
        (statusVal === 'ACTIVE' && user.status === true) ||
        (statusVal === 'INACTIVE' && user.status === false);

      return matchesSearch && matchesRole && matchesStatus;
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px; color: var(--text-muted);">No users found matching query.</td></tr>`;
      return;
    }

    filtered.forEach(user => {
      const tr = document.createElement('tr');
      const formattedDate = user.createdat ? new Date(user.createdat).toLocaleDateString() : 'N/A';
      const roleBadge = user.role === 'ADMIN' ? 'background:rgba(168,85,247,0.2); color:#A855F7;' : 'background:rgba(99,102,241,0.2); color:#6366F1;';

      tr.innerHTML = `
        <td>#${user.id}</td>
        <td>
          <div class="user-cell">
            <div class="user-avatar-small">${(user.name || 'U').charAt(0).toUpperCase()}</div>
            <div class="user-meta">
              <span class="user-name-text">${user.name || 'Anonymous'}</span>
              <span class="user-sub-text">${user.district || 'District N/A'}, ${user.state_ut || 'State N/A'}</span>
            </div>
          </div>
        </td>
        <td>
          <div class="user-meta">
            <span class="user-name-text">${user.email}</span>
            <span class="user-sub-text"><i class="fa-solid fa-phone"></i> ${user.phone || 'N/A'}</span>
          </div>
        </td>
        <td>
          <select class="form-select user-role-select" data-id="${user.id}" style="padding:4px 8px; font-size:11px; font-weight:700; cursor:pointer; border-radius:9999px; ${roleBadge}">
            <option value="USER" ${user.role === 'USER' ? 'selected' : ''}>USER</option>
            <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
          </select>
        </td>
        <td>
          ${user.is_paid
            ? '<span class="status-pill active"><i class="fa-solid fa-check"></i> Paid Member</span>'
            : '<span class="status-pill pending">Free Tier</span>'}
        </td>
        <td>
          ${user.status
            ? '<span class="status-pill active">Active</span>'
            : '<span class="status-pill inactive">Inactive</span>'}
        </td>
        <td>${formattedDate}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline btn-view-user" data-id="${user.id}" title="View Details">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline btn-toggle-user" data-id="${user.id}" title="Toggle Active Status">
              <i class="fa-solid fa-power-off"></i>
            </button>
            <button class="btn btn-sm btn-outline btn-delete-user" data-id="${user.id}" title="Delete User" style="color:var(--accent-rose);">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Wire table buttons
    tbody.querySelectorAll('.user-role-select').forEach(select => {
      select.addEventListener('change', () => {
        changeUserRole(select.getAttribute('data-id'), select.value);
      });
    });

    tbody.querySelectorAll('.btn-view-user').forEach(btn => {
      btn.addEventListener('click', () => viewUserDetails(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-toggle-user').forEach(btn => {
      btn.addEventListener('click', () => toggleUserStatus(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', () => deleteUser(btn.getAttribute('data-id')));
    });
  }

  searchInput.addEventListener('input', filterAndRender);
  roleFilter.addEventListener('change', filterAndRender);
  statusFilter.addEventListener('change', filterAndRender);

  filterAndRender();
}

async function changeUserRole(userId, newRole) {
  const user = appData.users.find(u => u.id === Number(userId));
  if (!user) return;

  showTopLoader();
  try {
    await apiUpdateUser(user.id, { role: newRole });
    user.role = newRole;
    renderUsersTable();
    alert(`User ${user.name} role changed to ${newRole} successfully!`);
  } finally {
    hideTopLoader();
  }
}

async function toggleUserStatus(userId) {
  const user = appData.users.find(u => u.id === Number(userId));
  if (!user) return;

  showTopLoader();
  try {
    const newStatus = !user.status;
    await apiUpdateUser(user.id, { status: newStatus });
    user.status = newStatus;
    renderUsersTable();
    alert(`User ${user.name} status updated to ${newStatus ? 'Active' : 'Inactive'}.`);
  } finally {
    hideTopLoader();
  }
}

async function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user profile?')) {
    showTopLoader();
    try {
      await apiDeleteUser(userId);
      appData.users = appData.users.filter(u => u.id !== Number(userId));
      updateBadges();
      renderUsersTable();
    } finally {
      hideTopLoader();
    }
  }
}




// User Detail Modal View
function viewUserDetails(userId) {
  const user = appData.users.find(u => u.id === Number(userId));
  if (!user) return;

  const content = document.getElementById('modal-user-detail-content');
  if (!content) return;

  const userAvatar = user.profile_image
    ? `<img src="${user.profile_image}" class="user-avatar-small" style="width:60px; height:60px; object-fit:cover; border-radius:50%;" />`
    : `<div class="user-avatar-small" style="width:60px; height:60px; font-size:24px;">${(user.name || 'U').charAt(0).toUpperCase()}</div>`;

  const formattedDate = user.createdat ? new Date(user.createdat).toLocaleString() : (user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A');

  content.innerHTML = `
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--border-color);">
      ${userAvatar}
      <div>
        <h2 style="font-size:20px; font-weight:700; margin:0;">${user.name || 'Member'}</h2>
        <p style="color:var(--text-muted); font-size:13px; margin:4px 0 0 0;">${user.email || 'No Email'} • ${user.phone || 'No Phone'}</p>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <span class="status-pill active">Role: ${user.role || 'USER'}</span>
          <span class="status-pill ${user.is_paid ? 'active' : 'inactive'}">${user.is_paid ? 'Paid Member' : 'Free Tier'}</span>
        </div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:13px;">
      <div class="form-group">
        <label class="form-label" style="font-weight:600; color:var(--text-muted);">Father Name</label>
        <div class="form-control" style="background:var(--bg-card); font-weight:500;">${user.father_name || 'N/A'}</div>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600; color:var(--text-muted);">Mother Name</label>
        <div class="form-control" style="background:var(--bg-card); font-weight:500;">${user.mother_name || 'N/A'}</div>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600; color:var(--text-muted);">Age & Gender</label>
        <div class="form-control" style="background:var(--bg-card); font-weight:500;">${user.age ? user.age + ' yrs' : 'N/A'} • ${user.gender || 'N/A'}</div>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600; color:var(--text-muted);">Blood Group</label>
        <div class="form-control" style="background:var(--bg-card); font-weight:500;">${user.blood_group || 'N/A'}</div>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600; color:var(--text-muted);">Aadhaar No</label>
        <div class="form-control" style="background:var(--bg-card); font-weight:500;">${user.aadhaar_no || 'N/A'}</div>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600; color:var(--text-muted);">Voter ID No</label>
        <div class="form-control" style="background:var(--bg-card); font-weight:500;">${user.voter_id_no || 'N/A'}</div>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600; color:var(--text-muted);">State / UT</label>
        <div class="form-control" style="background:var(--bg-card); font-weight:500;">${user.state_ut || 'N/A'}</div>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600; color:var(--text-muted);">District & City</label>
        <div class="form-control" style="background:var(--bg-card); font-weight:500;">${user.district || 'N/A'} ${user.town_city ? '(' + user.town_city + ')' : ''}</div>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600; color:var(--text-muted);">Joined Date</label>
        <div class="form-control" style="background:var(--bg-card); font-weight:500;">${formattedDate}</div>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600; color:var(--text-muted);">Push Notification Status</label>
        <div class="form-control" style="background:var(--bg-card); font-weight:500;">${user.fcm_token ? 'Active (FCM Token Linked)' : 'Not Subscribed'}</div>
      </div>
    </div>
  `;

  openModal('modal-user-detail');
}

// 5. Render Community Posts Grid

function renderPostsGrid() {
  const container = document.getElementById('posts-grid-container');
  const searchInput = document.getElementById('post-search-input');
  const btnRefresh = document.getElementById('btn-refresh-posts');

  if (btnRefresh && !btnRefresh.dataset.bound) {
    btnRefresh.dataset.bound = 'true';
    btnRefresh.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      setBtnLoading(btn, true, 'Refreshing...');
      try {
        appData.posts = await apiGetPosts();
        updateBadges();
        renderPostsGrid();
      } finally {
        setBtnLoading(btn, false);
      }
    });
  }

  function filterAndRender() {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = appData.posts.filter(post => {
      const desc = (post.description || '').toLowerCase();
      const author = (post.user ? post.user.name : '').toLowerCase();
      return desc.includes(query) || author.includes(query);
    });

    container.innerHTML = '';
    if (filtered.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);">No community posts match search query.</div>`;
      return;
    }

    filtered.forEach(post => {
      const card = document.createElement('div');
      card.className = 'post-admin-card';

      const hasImg = post.images && post.images.length > 0;
      const firstImgUrl = hasImg ? post.images[0].image_url : null;
      let imgHtml = '';
      if (firstImgUrl) {
        const fullImg = firstImgUrl.startsWith('http') ? firstImgUrl : `${getApiBaseUrl().replaceAll('/api', '')}/${firstImgUrl}`;
        const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(firstImgUrl);
        if (isVideo) {
          imgHtml = `<video src="${fullImg}" class="post-card-image" controls muted preload="metadata" style="max-height:240px; width:100%; object-fit:cover; border-radius:8px;"></video>`;
        } else {
          imgHtml = `<img src="${fullImg}" class="post-card-image" alt="Post thumbnail" onError="this.style.display='none'" />`;
        }
      }

      const formattedDate = post.created_at ? new Date(post.created_at).toLocaleDateString() : '';

      card.innerHTML = `
        <div class="post-card-header">
          <div class="user-cell">
            <div class="user-avatar-small">${(post.user?.name || 'U').charAt(0).toUpperCase()}</div>
            <div class="user-meta">
              <span class="user-name-text">${post.user?.name || 'Member'}</span>
              <span class="user-sub-text">${formattedDate}</span>
            </div>
          </div>
          <button class="btn btn-sm btn-outline btn-delete-post" data-id="${post.id}" style="color:var(--accent-rose);" title="Moderate Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        ${imgHtml}
        <p class="post-desc">${post.description || 'No text content'}</p>
        <div class="post-stats-row">
          <span><i class="fa-solid fa-heart" style="color:#ef4444;"></i> ${post.total_likes || 0} Likes</span>
          <span><i class="fa-solid fa-comment" style="color:#6366f1;"></i> ${post.total_comments || 0} Comments</span>
          <span><i class="fa-solid fa-share" style="color:#10b981;"></i> ${post.total_shares || 0} Shares</span>
        </div>
      `;

      container.appendChild(card);
    });

    container.querySelectorAll('.btn-delete-post').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const targetBtn = e.currentTarget;
        const id = targetBtn.getAttribute('data-id');
        if (confirm('Delete this post permanently?')) {
          setBtnLoading(targetBtn, true, 'Deleting...');
          try {
            await apiDeletePost(id);
            appData.posts = appData.posts.filter(p => p.id !== Number(id));
            updateBadges();
            renderPostsGrid();
          } finally {
            setBtnLoading(targetBtn, false);
          }
        }
      });
    });
  }

  searchInput.addEventListener('input', filterAndRender);
  filterAndRender();
}

// 6. Render Events & Campaigns
function renderEventsGrid() {
  const container = document.getElementById('events-grid-container');
  const btnRefresh = document.getElementById('btn-refresh-events');

  if (btnRefresh && !btnRefresh.dataset.bound) {
    btnRefresh.dataset.bound = 'true';
    btnRefresh.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      setBtnLoading(btn, true, 'Refreshing...');
      try {
        appData.events = await apiGetEvents();
        renderEventsGrid();
      } finally {
        setBtnLoading(btn, false);
      }
    });
  }

  container.innerHTML = '';

  appData.events.forEach(evt => {
    const card = document.createElement('div');
    card.className = 'event-card';
    const bannerUrl = evt.banner_image || evt.banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';
    const regCount = evt.total_registrations !== undefined ? evt.total_registrations : 0;

    card.innerHTML = `
      <img src="${bannerUrl}" class="event-banner" alt="${evt.title}" />
      <div class="event-body">
        <span class="status-pill active" style="align-self:flex-start;">
          <i class="fa-solid fa-calendar"></i> ${evt.date} • ${evt.time || '10:00 AM'}
        </span>
        <h3 style="font-size:16px; font-weight:700;">${evt.title}</h3>
        <p style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${evt.venue}</p>
        <p style="font-size:13px; color:var(--text-main);">${evt.description || ''}</p>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; border-top:1px solid var(--border-color); padding-top:10px;">
          <button class="btn btn-sm btn-outline btn-view-event-regs" data-id="${evt.id}" data-title="${evt.title}">
            <i class="fa-solid fa-users"></i> Registrations (${regCount})
          </button>
          <button class="btn btn-sm btn-outline btn-delete-event" data-id="${evt.id}" style="color:var(--accent-rose);">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-delete-event').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetBtn = e.currentTarget;
      const id = targetBtn.getAttribute('data-id');
      if (confirm('Cancel and delete this event?')) {
        setBtnLoading(targetBtn, true, 'Deleting...');
        try {
          await apiDeleteEvent(id);
          appData.events = await apiGetEvents();
          renderEventsGrid();
        } finally {
          setBtnLoading(targetBtn, false);
        }
      }
    });
  });

  container.querySelectorAll('.btn-view-event-regs').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetBtn = e.currentTarget;
      const id = targetBtn.getAttribute('data-id');
      const title = targetBtn.getAttribute('data-title');
      setBtnLoading(targetBtn, true, 'Loading...');
      try {
        await viewEventRegistrations(id, title);
      } finally {
        setBtnLoading(targetBtn, false);
      }
    });
  });
}


async function viewEventRegistrations(eventId, eventTitle) {
  const modalTitle = document.getElementById('modal-event-reg-title');
  const modalSubtitle = document.getElementById('modal-event-reg-subtitle');
  const tbody = document.getElementById('modal-event-reg-tbody');

  if (modalTitle) modalTitle.textContent = `Registrations for: ${eventTitle || 'Event'}`;
  if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading registrations...</td></tr>`;

  openModal('modal-event-registrations');

  try {
    const registrations = await apiGetEventRegistrations(eventId);

    const count = Array.isArray(registrations) ? registrations.length : 0;
    if (modalSubtitle) modalSubtitle.textContent = `Total Attendees Registered: ${count}`;

    if (!tbody) return;
    tbody.innerHTML = '';

    if (!registrations || !Array.isArray(registrations) || registrations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">No member registrations recorded for this event yet.</td></tr>`;
      return;
    }

    registrations.forEach(reg => {
      const tr = document.createElement('tr');
      const regDate = reg.created_at ? new Date(reg.created_at).toLocaleString() : 'Recent';
      tr.innerHTML = `
        <td><strong>${reg.user_name || reg.user?.name || 'Member'}</strong></td>
        <td>${reg.user_phone || reg.user?.phone || 'N/A'}</td>
        <td>${reg.user_email || reg.user?.email || 'N/A'}</td>
        <td>${regDate}</td>
        <td>${reg.notes || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error fetching event registrations:', err);
    if (modalSubtitle) modalSubtitle.textContent = `Total Attendees Registered: 0`;
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">No member registrations recorded for this event yet.</td></tr>`;
    }
  }
}



// 7. Render Membership Plans Tiers with Rich Aesthetics & Details
function renderPlansGrid() {
  const container = document.getElementById('plans-grid-container');
  if (!container) return;
  container.innerHTML = '';

  const getTierMetadata = (planName, isPopular, price) => {
    const nameLower = (planName || '').toLowerCase();
    if (nameLower.includes('platinum')) {
      return {
        icon: 'fa-solid fa-crown',
        iconBg: 'linear-gradient(135deg, #FFD700, #FFA500)',
        badge: 'ROYAL EXECUTIVE',
        badgeColor: '#FFD700',
        cardBorder: '2px solid #FFD700'
      };
    }
    if (nameLower.includes('diamond')) {
      return {
        icon: 'fa-solid fa-gem',
        iconBg: 'linear-gradient(135deg, #00CBD5, #0080FF)',
        badge: 'LEGISLATURE TIER',
        badgeColor: '#00CBD5',
        cardBorder: '1px solid #00CBD5'
      };
    }
    if (nameLower.includes('gold') || isPopular) {
      return {
        icon: 'fa-solid fa-award',
        iconBg: 'linear-gradient(135deg, #FF9900, #FF5500)',
        badge: 'MOST POPULAR',
        badgeColor: '#FF9900',
        cardBorder: '2px solid #FF9900'
      };
    }
    if (nameLower.includes('silver')) {
      return {
        icon: 'fa-solid fa-medal',
        iconBg: 'linear-gradient(135deg, #A0AEC0, #CBD5E0)',
        badge: 'COUNCIL TIER',
        badgeColor: '#A0AEC0',
        cardBorder: '1px solid var(--border-color)'
      };
    }
    if (nameLower.includes('bronze')) {
      return {
        icon: 'fa-solid fa-shield-halved',
        iconBg: 'linear-gradient(135deg, #CD7F32, #A0522D)',
        badge: 'LOCAL BODY TIER',
        badgeColor: '#CD7F32',
        cardBorder: '1px solid var(--border-color)'
      };
    }
    return {
      icon: 'fa-solid fa-user-check',
      iconBg: 'linear-gradient(135deg, #4A5568, #718096)',
      badge: price === 0 ? 'FREE CITIZEN' : 'MEMBER TIER',
      badgeColor: 'var(--text-muted)',
      cardBorder: '1px solid var(--border-color)'
    };
  };

  appData.plans.forEach(plan => {
    const card = document.createElement('div');
    card.className = 'plan-admin-card';

    const priceNum = Number(plan.price) || 0;
    const formattedPrice = priceNum === 0 ? 'FREE' : `₹${priceNum.toLocaleString()}`;
    const meta = getTierMetadata(plan.plan_name, plan.is_popular, priceNum);

    // Support both string array (`plan.benefits`) and object array (`plan.plan_benefits`)
    let benefitsArr = [];
    if (Array.isArray(plan.benefits)) {
      benefitsArr = plan.benefits.map(b => typeof b === 'string' ? b : (b.benefit || String(b)));
    } else if (Array.isArray(plan.plan_benefits)) {
      benefitsArr = plan.plan_benefits.map(b => typeof b === 'string' ? b : (b.benefit || String(b)));
    }

    const benefitsListHtml = benefitsArr.length > 0
      ? benefitsArr.map(b => `
          <li style="display:flex; align-items:flex-start; gap:10px; font-size:13.5px; color:var(--text-main); margin-bottom:8px;">
            <i class="fa-solid fa-circle-check" style="color:var(--accent-emerald); font-size:15px; margin-top:2px;"></i>
            <span>${b}</span>
          </li>
        `).join('')
      : `
        <li style="display:flex; align-items:center; gap:10px; font-size:13px; color:var(--text-muted);">
          <i class="fa-solid fa-circle-check" style="color:var(--accent-emerald);"></i>
          <span>Full General Body Access & Party Membership</span>
        </li>
      `;

    card.style.border = meta.cardBorder;
    card.style.position = 'relative';
    card.style.borderRadius = '16px';
    card.style.background = 'var(--bg-card)';
    card.style.boxShadow = plan.is_popular ? '0 10px 30px rgba(255, 153, 0, 0.15)' : '0 4px 15px rgba(0, 0, 0, 0.05)';

    card.innerHTML = `
      <div style="padding: 24px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div style="width:48px; height:48px; border-radius:12px; background:${meta.iconBg}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:22px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
              <i class="${meta.icon}"></i>
            </div>
            <div>
              <h3 style="font-size:18px; font-weight:800; color:var(--text-main); margin:0;">${plan.plan_name}</h3>
              <span style="font-size:11px; font-weight:700; color:${meta.badgeColor}; letter-spacing:0.5px; text-transform:uppercase;">${meta.badge}</span>
            </div>
          </div>
          ${plan.is_popular ? '<span class="status-pill active" style="background:rgba(255,153,0,0.15); color:#FF9900; border:1px solid #FF9900; font-weight:700;">POPULAR</span>' : ''}
        </div>

        <div style="margin: 20px 0; padding:16px; background:var(--bg-main); border-radius:12px; border:1px solid var(--border-color); display:flex; align-items:baseline; gap:6px;">
          <span style="font-size:30px; font-weight:900; color:var(--text-main);">${formattedPrice}</span>
          ${priceNum > 0 ? '<span style="font-size:12px; color:var(--text-muted); font-weight:600;">/ annual fee</span>' : '<span style="font-size:12px; color:var(--text-muted); font-weight:600;">/ no membership fee</span>'}
        </div>

        <div style="margin-top:16px;">
          <h4 style="font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); font-weight:700; margin-bottom:12px;">Plan Privileges & Governance Rights</h4>
          <ul style="list-style:none; padding:0; margin:0;">
            ${benefitsListHtml}
          </ul>
        </div>

        <div style="margin-top:24px; padding-top:16px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; color:var(--accent-emerald); font-weight:600; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-circle-dot"></i> Active Tier in System
          </span>
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:12px; color:var(--text-muted); font-weight:500;">ID: #${plan.id}</span>
            <button class="btn btn-sm btn-outline btn-delete-plan" data-id="${plan.id}" style="color:var(--accent-rose); border-color:rgba(239,68,68,0.3); padding:4px 8px;" title="Delete Plan">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-delete-plan').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this membership plan?')) {
        await apiDeletePlan(id);
        appData.plans = await apiGetPlans();
        updateBadges();
        renderPlansGrid();
      }
    });
  });
}





function populateUserNotificationDropdown() {
  const targetSelect = document.getElementById('notif-input-target-user');
  if (!targetSelect) return;

  targetSelect.innerHTML = '<option value="">All Users (Broadcast)</option>';

  if (appData.users && appData.users.length > 0) {
    appData.users.forEach(u => {
      const option = document.createElement('option');
      option.value = u.id;
      const details = u.phone || u.email || '';
      option.textContent = `${u.name || 'Member #' + u.id}${details ? ' (' + details + ')' : ''}`;
      targetSelect.appendChild(option);
    });
  }
}

// Modal Handlers & Forms
function setupModals() {
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      closeModal(modalId);
    });
  });

  document.getElementById('btn-open-create-event-modal').addEventListener('click', () => {
    openModal('modal-event');
  });

  document.getElementById('btn-open-create-plan-modal').addEventListener('click', () => {
    openModal('modal-plan');
  });

  const btnNotifModal = document.getElementById('btn-open-create-notif-modal');
  if (btnNotifModal) {
    btnNotifModal.addEventListener('click', () => {
      populateUserNotificationDropdown();
      openModal('modal-notification');
    });
  }

  // Notification Form Submit
  const formNotif = document.getElementById('form-notification');
  if (formNotif) {
    formNotif.addEventListener('submit', async e => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-send-notif');
      setBtnLoading(submitBtn, true, 'Broadcasting Notification...');

      try {
        const titleEl = document.getElementById('notif-input-title');
        const bodyEl = document.getElementById('notif-input-body') || document.getElementById('notif-input-message');
        const typeEl = document.getElementById('notif-input-type');
        const targetUserEl = document.getElementById('notif-input-target-user');

        const title = titleEl ? titleEl.value.trim() : '';
        const body = bodyEl ? bodyEl.value.trim() : '';
        const type = typeEl ? typeEl.value : 'BROADCAST';
        const targetUser = targetUserEl ? targetUserEl.value.trim() : '';

        const notifData = {
          title,
          body,
          type,
          ...(targetUser ? { target_user_id: Number(targetUser) } : {})
        };

        const res = await apiSendNotification(notifData);
        if (res && res.status === 201 || res && res.status === 200) {
          alert('Broadcast Push Notification sent successfully!');
        } else {
          alert(res?.message || 'Notification broadcast completed.');
        }
        appData.notifications = await apiGetNotifications();
        updateBadges();
        renderNotificationsTable();
        closeModal('modal-notification');
        formNotif.reset();
      } finally {
        setBtnLoading(submitBtn, false);
      }
    });
  }

  // Event Form Submit
  document.getElementById('form-event').addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-save-event');
    setBtnLoading(submitBtn, true, 'Publishing Event...');

    try {
      let bannerUrl = document.getElementById('event-input-banner').value.trim();
      const bannerFileInput = document.getElementById('event-input-banner-file');
      if (bannerFileInput && bannerFileInput.files && bannerFileInput.files[0]) {
        showScreenLoader('Uploading Banner Image to Cloudinary...');
        try {
          bannerUrl = await apiUploadMediaFile(bannerFileInput.files[0]);
        } catch (err) {
          console.error('Banner image Cloudinary upload error:', err);
          alert('Failed to upload banner image to Cloudinary: ' + err.message);
          return;
        } finally {
          hideScreenLoader();
        }
      }

      const eventData = {
        title: document.getElementById('event-input-title').value,
        date: document.getElementById('event-input-date').value,
        time: document.getElementById('event-input-time').value,
        venue: document.getElementById('event-input-venue').value,
        banner: bannerUrl,
        description: document.getElementById('event-input-desc').value
      };

      await apiCreateEvent(eventData);
      appData.events = await apiGetEvents();
      renderEventsGrid();
      closeModal('modal-event');
      e.target.reset();
      alert('New event published successfully!');
    } finally {
      setBtnLoading(submitBtn, false);
    }
  });


  // Plan Form Submit
  document.getElementById('form-plan').addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-save-plan');
    setBtnLoading(submitBtn, true, 'Creating Plan...');

    try {
      const planData = {
        plan_name: document.getElementById('plan-input-name').value,
        price: document.getElementById('plan-input-price').value,
        is_popular: document.getElementById('plan-input-popular').value,
        benefits: document.getElementById('plan-input-benefits').value
      };

      await apiCreatePlan(planData);
      appData.plans = await apiGetPlans();
      updateBadges();
      renderPlansGrid();
      closeModal('modal-plan');
      e.target.reset();
      alert('New Membership plan created!');
    } finally {
      setBtnLoading(submitBtn, false);
    }
  });

  // Fund Form Submit
  const btnCreateFund = document.getElementById('btn-open-create-fund-modal');
  if (btnCreateFund && !btnCreateFund.dataset.bound) {
    btnCreateFund.dataset.bound = 'true';
    btnCreateFund.addEventListener('click', () => {
      document.getElementById('form-fund').reset();
      document.getElementById('fund-input-id').value = '';
      document.getElementById('modal-fund-title').textContent = 'Create New Party Fund';
      openModal('modal-fund');
    });
  }

  const formFund = document.getElementById('form-fund');
  if (formFund && !formFund.dataset.bound) {
    formFund.dataset.bound = 'true';
    formFund.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-save-fund');
      setBtnLoading(submitBtn, true, 'Saving Fund...');

      try {
        const id = document.getElementById('fund-input-id').value;
        const data = {
          title: document.getElementById('fund-input-title').value,
          target_amount: parseFloat(document.getElementById('fund-input-target').value || 0),
          raised_amount: parseFloat(document.getElementById('fund-input-raised').value || 0),
          description: document.getElementById('fund-input-desc').value,
          icon_name: document.getElementById('fund-input-icon').value,
        };

        if (id) {
          await apiUpdateFund(id, data);
        } else {
          await apiCreateFund(data);
        }
        closeModal('modal-fund');
        appData.funds = await apiGetFunds();
        renderDonationsTable();
        alert('Party Fund saved successfully!');
      } finally {
        setBtnLoading(submitBtn, false);
      }
    });
  }
}


function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// System Settings Handler
function setupSettingsForm() {
  const urlInput = document.getElementById('settings-api-url');
  if (urlInput) {
    urlInput.value = getApiBaseUrl();
  }

  const btnSave = document.getElementById('btn-save-settings');
  if (btnSave && !btnSave.dataset.bound) {
    btnSave.dataset.bound = 'true';
    btnSave.addEventListener('click', async (e) => {
      e.preventDefault();
      const btn = e.currentTarget;
      setBtnLoading(btn, true, 'Saving Settings...');
      try {
        const newUrl = urlInput ? urlInput.value.trim() : '';
        if (newUrl) {
          setApiBaseUrl(newUrl);
          alert(`Backend API URL updated to: ${newUrl}`);
          showScreenLoader('Reloading with updated API configuration...');
          await loadAllData();
        }
      } finally {
        setBtnLoading(btn, false);
        hideScreenLoader();
      }
    });
  }
}


// 8. Render Donations Log & Funds View
function renderDonationsTable() {
  renderFundsView();

  const tbody = document.getElementById('donations-table-body');
  const btnRefresh = document.getElementById('btn-refresh-donations');

  if (btnRefresh && !btnRefresh.dataset.bound) {
    btnRefresh.dataset.bound = 'true';
    btnRefresh.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      setBtnLoading(btn, true, 'Refreshing...');
      try {
        appData.donations = await apiGetDonations();
        appData.funds = await apiGetFunds();
        renderDonationsTable();
      } finally {
        setBtnLoading(btn, false);
      }
    });
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  let totalRaised = 0;
  let successDonorsCount = 0;

  if (appData.donations.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px; color: var(--text-muted);">No donation transactions recorded yet.</td></tr>`;
  } else {
    appData.donations.forEach(d => {
      if (d.status === 'SUCCESS') {
        totalRaised += (Number(d.amount) || 0);
        successDonorsCount++;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${d.id}</strong></td>
        <td><strong>${d.donor}</strong></td>
        <td>${d.donorPhone}<br/><span style="font-size:11px; color:var(--text-muted);">${d.donorEmail}</span></td>
        <td><span class="pill-tag">${d.fund}</span></td>
        <td><strong style="color:var(--accent-emerald);">₹${(Number(d.amount) || 0).toLocaleString()}</strong></td>
        <td><span style="font-size:12px; font-family:monospace;">${d.paymentId || d.orderId}</span></td>
        <td><span class="status-pill ${d.status === 'SUCCESS' ? 'active' : 'inactive'}">${d.status}</span></td>
        <td>${d.date}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Update Stats Cards
  const raisedElem = document.getElementById('stat-total-donations-raised');
  if (raisedElem) raisedElem.textContent = `₹${totalRaised.toLocaleString()}`;

  const fundsCountElem = document.getElementById('stat-active-funds-count');
  if (fundsCountElem) fundsCountElem.textContent = appData.funds.length;

  const donorsCountElem = document.getElementById('stat-total-donors-count');
  if (donorsCountElem) donorsCountElem.textContent = successDonorsCount;
}

function renderFundsView() {
  const container = document.getElementById('funds-grid-container');
  if (!container) return;
  container.innerHTML = '';

  appData.funds.forEach(fund => {
    const card = document.createElement('div');
    card.className = 'fund-card';
    const targetNum = Number(fund.target_amount) || 1;
    const raisedNum = Number(fund.raised_amount) || 0;
    const percent = Math.min(Math.round((raisedNum / targetNum) * 100), 100);

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
        <div>
          <h3 style="font-size:16px; font-weight:700;">${fund.title}</h3>
          <span style="font-size:12px; color:var(--text-muted);">${fund.description || ''}</span>
        </div>
        <button class="btn btn-sm btn-outline btn-delete-fund" data-id="${fund.id}" style="color:var(--accent-rose);" title="Delete Fund">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>

      <div style="margin:12px 0;">
        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
          <span>Raised: <strong style="color:var(--accent-emerald);">₹${raisedNum.toLocaleString()}</strong></span>
          <span>Target: <strong>₹${targetNum.toLocaleString()}</strong></span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-delete-fund').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetBtn = e.currentTarget;
      const id = targetBtn.getAttribute('data-id');
      if (confirm('Delete this party fund category?')) {
        setBtnLoading(targetBtn, true, 'Deleting...');
        try {
          await apiDeleteFund(id);
          appData.funds = await apiGetFunds();
          renderDonationsTable();
        } finally {
          setBtnLoading(targetBtn, false);
        }
      }
    });
  });
}

function renderNotificationsTable() {
  const tbody = document.getElementById('notifications-table-body');
  const btnRefresh = document.getElementById('btn-refresh-notifs');

  if (btnRefresh && !btnRefresh.dataset.bound) {
    btnRefresh.dataset.bound = 'true';
    btnRefresh.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      setBtnLoading(btn, true, 'Refreshing...');
      try {
        appData.notifications = await apiGetNotifications();
        updateBadges();
        renderNotificationsTable();
      } finally {
        setBtnLoading(btn, false);
      }
    });
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  if (!appData.notifications || appData.notifications.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">No system push announcements broadcasted yet.</td></tr>`;
    return;
  }

  appData.notifications.forEach(notif => {
    const tr = document.createElement('tr');
    const dateText = notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Recent';
    const recipientText = notif.user ? `${notif.user.name} (#${notif.user_id})` : 'All Users (Broadcast)';

    tr.innerHTML = `
      <td><code>#${notif.id}</code></td>
      <td><strong>${notif.title}</strong></td>
      <td style="max-width:240px; font-size:12px; color:var(--text-secondary);">${notif.body}</td>
      <td><span class="pill-tag">${notif.type || 'BROADCAST'}</span></td>
      <td><span style="font-size:12px; color:var(--text-primary);">${recipientText}</span></td>
      <td>${dateText}</td>
      <td>
        <button class="btn btn-sm btn-outline btn-delete-notif" data-id="${notif.id}" style="color:var(--accent-rose);">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-delete-notif').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetBtn = e.currentTarget;
      const id = targetBtn.getAttribute('data-id');
      if (confirm('Delete this notification entry?')) {
        setBtnLoading(targetBtn, true, 'Deleting...');
        try {
          await apiDeleteNotification(id);
          appData.notifications = await apiGetNotifications();
          updateBadges();
          renderNotificationsTable();
        } finally {
          setBtnLoading(targetBtn, false);
        }
      }
    });
  });
}

// Render Live Streams View
function renderLiveStreamsView() {
  const activeGrid = document.getElementById('active-streams-grid');
  const tbody = document.getElementById('livestreams-table-body');
  const btnRefresh = document.getElementById('btn-refresh-livestreams');

  if (btnRefresh && !btnRefresh.dataset.bound) {
    btnRefresh.dataset.bound = 'true';
    btnRefresh.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      setBtnLoading(btn, true, 'Refreshing...');
      try {
        appData.liveStreams = await apiGetLiveStreams();
        updateBadges();
        renderLiveStreamsView();
      } finally {
        setBtnLoading(btn, false);
      }
    });
  }

  const activeStreams = appData.liveStreams.filter(s => s.status === 'LIVE');
  const totalViewers = activeStreams.reduce((acc, s) => acc + (s.viewer_count || 0), 0);

  const elActiveCount = document.getElementById('stat-active-streams');
  if (elActiveCount) elActiveCount.textContent = activeStreams.length;

  const elViewers = document.getElementById('stat-live-viewers');
  if (elViewers) elViewers.textContent = totalViewers;

  const elTotalStreams = document.getElementById('stat-total-streams');
  if (elTotalStreams) elTotalStreams.textContent = appData.liveStreams.length;

  // Active Streams Grid
  if (activeGrid) {
    activeGrid.innerHTML = '';
    if (activeStreams.length === 0) {
      activeGrid.innerHTML = `<div style="grid-column: 1/-1; padding:30px; text-align:center; color:var(--text-muted); background:var(--bg-card); border-radius:12px; border:1px dashed var(--border-color);">No broadcast live stream active right now.</div>`;
    } else {
      activeStreams.forEach(stream => {
        const card = document.createElement('div');
        card.className = 'livestream-card';

        card.innerHTML = `
          <!-- Live Video Screen Container -->
          <div class="livestream-preview-box">
            <!-- Live Camera Stream Feed -->
            <div style="position:absolute; inset:0; background:radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(15,23,42,0.92) 100%); display:flex; flex-direction:column; justify-content:space-between; padding:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="badge" style="background:#ef4444; color:white; font-weight:bold; font-size:11px; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 0 10px rgba(239,68,68,0.5);">
                  <span style="width:8px; height:8px; background:white; border-radius:50%; display:inline-block;"></span> LIVE BROADCAST
                </span>
                <span style="background:rgba(0,0,0,0.65); backdrop-filter:blur(4px); color:white; font-size:12px; padding:4px 10px; border-radius:12px; font-weight:600;">
                  <i class="fa-solid fa-eye" style="color:#818cf8;"></i> ${stream.viewer_count || 1} Viewers
                </span>
              </div>
              <div style="text-align:center;">
                <div style="width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg, #ef4444, #818cf8); padding:3px; margin:0 auto 8px auto;">
                  <div style="width:100%; height:100%; border-radius:50%; background:#1e293b; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:20px;">
                    ${(stream.host_name || 'H').charAt(0).toUpperCase()}
                  </div>
                </div>
                <span style="color:white; font-weight:600; font-size:13px; text-shadow:0 1px 3px rgba(0,0,0,0.8);">${stream.host_name || 'Host'} is streaming live</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:rgba(255,255,255,0.75);">
                <span><i class="fa-solid fa-signal" style="color:#22c55e;"></i> Stream Quality: HD</span>
                <span>Room: <code>${stream.live_id}</code></span>
              </div>
            </div>
          </div>

          <h4 style="font-size:16px; font-weight:700; color:var(--text-primary); margin-bottom:4px;">${stream.title}</h4>
          <p style="font-size:13px; color:var(--text-secondary); margin-bottom:8px;"><i class="fa-solid fa-user" style="color:var(--accent-indigo);"></i> Host: ${stream.host_name || 'Host'}</p>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--text-muted); border-top:1px solid var(--border-color); padding-top:12px; margin-top:auto;">
            <span>Status: <strong style="color:#ef4444;">ACTIVE BROADCAST</strong></span>
            <button class="btn btn-sm btn-outline btn-end-stream" data-id="${stream.id}" style="color:#ef4444; border-color:#ef4444; font-weight:600;">
              <i class="fa-solid fa-circle-stop"></i> End Stream (Moderate)
            </button>
          </div>
        `;
        activeGrid.appendChild(card);
      });

      activeGrid.querySelectorAll('.btn-end-stream').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const targetBtn = e.currentTarget;
          const id = targetBtn.getAttribute('data-id');
          if (confirm('End this live stream immediately as Admin moderator?')) {
            setBtnLoading(targetBtn, true, 'Ending...');
            try {
              await apiEndLiveStream(id);
              appData.liveStreams = await apiGetLiveStreams();
              updateBadges();
              renderLiveStreamsView();
              alert('Live stream ended successfully.');
            } finally {
              setBtnLoading(targetBtn, false);
            }
          }
        });
      });
    }
  }

  // Stream History Table
  if (tbody) {
    tbody.innerHTML = '';
    if (appData.liveStreams.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">No stream history found.</td></tr>`;
    } else {
      appData.liveStreams.forEach(stream => {
        const tr = document.createElement('tr');
        const isLive = stream.status === 'LIVE';
        const startedText = stream.started_at ? new Date(stream.started_at).toLocaleString() : '-';

        tr.innerHTML = `
          <td><strong>${stream.title}</strong></td>
          <td>${stream.host_name}</td>
          <td><code>${stream.live_id}</code></td>
          <td>
            <span class="badge" style="background:${isLive ? '#ef4444' : 'var(--border-color)'}; color:${isLive ? 'white' : 'var(--text-muted)'}">
              ${stream.status}
            </span>
          </td>
          <td>${stream.viewer_count || 0}</td>
          <td>${startedText}</td>
          <td>
            ${isLive ? `<button class="btn btn-sm btn-outline btn-end-stream-table" data-id="${stream.id}" style="color:#ef4444;"><i class="fa-solid fa-stop"></i> End</button>` : `<span style="color:var(--text-muted); font-size:12px;">Completed</span>`}
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-end-stream-table').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const targetBtn = e.currentTarget;
          const id = targetBtn.getAttribute('data-id');
          if (confirm('End this active stream session?')) {
            setBtnLoading(targetBtn, true, 'Ending...');
            try {
              await apiEndLiveStream(id);
              appData.liveStreams = await apiGetLiveStreams();
              updateBadges();
              renderLiveStreamsView();
            } finally {
              setBtnLoading(targetBtn, false);
            }
          }
        });
      });
    }
  }
}

function renderEnquiriesTable() {
  const tbody = document.getElementById('enquiries-table-body');
  const btnRefresh = document.getElementById('btn-refresh-enquiries');
  const searchInput = document.getElementById('enquiry-filter-search');
  const categorySelect = document.getElementById('enquiry-filter-category');
  const btnReset = document.getElementById('btn-reset-enquiry-filter');

  if (btnRefresh && !btnRefresh.dataset.bound) {
    btnRefresh.dataset.bound = 'true';
    btnRefresh.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      setBtnLoading(btn, true, 'Refreshing...');
      try {
        appData.enquiries = await apiGetEnquiries();
        updateBadges();
        renderEnquiriesTable();
      } finally {
        setBtnLoading(btn, false);
      }
    });
  }

  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = 'true';
    searchInput.addEventListener('input', () => renderEnquiriesTable());
  }

  if (categorySelect && !categorySelect.dataset.bound) {
    categorySelect.dataset.bound = 'true';
    categorySelect.addEventListener('change', () => renderEnquiriesTable());
  }

  if (btnReset && !btnReset.dataset.bound) {
    btnReset.dataset.bound = 'true';
    btnReset.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categorySelect) categorySelect.value = 'ALL';
      renderEnquiriesTable();
    });
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  let list = [...(appData.enquiries || [])];

  const q = (searchInput?.value || '').toLowerCase().trim();
  const cat = categorySelect?.value || 'ALL';

  if (cat !== 'ALL') {
    list = list.filter(item => {
      const c = (item.category || item.subject || '').toLowerCase();
      return c.includes(cat.toLowerCase());
    });
  }

  if (q) {
    list = list.filter(item =>
      (item.name || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.subject || '').toLowerCase().includes(q) ||
      (item.message || '').toLowerCase().includes(q) ||
      (item.ref_no || '').toLowerCase().includes(q)
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:36px; color:var(--text-muted);"><i class="fa-solid fa-inbox" style="font-size:24px; margin-bottom:8px; display:block; color:#cbd5e1;"></i>No public concerns or enquiries found matching criteria.</td></tr>';
    return;
  }

  list.forEach(item => {
    const tr = document.createElement('tr');
    const dateText = item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent';
    const refCode = item.ref_no || `#${item.id}`;
    const catName = item.category || 'General Concern';
    const prioName = item.priority || 'Normal';

    // Category styling
    let catBg = '#e0e7ff', catColor = '#3730a3';
    if (catName.toLowerCase().includes('website')) { catBg = '#eff6ff'; catColor = '#1d4ed8'; }
    else if (catName.toLowerCase().includes('mobile')) { catBg = '#ecfdf5'; catColor = '#047857'; }
    else if (catName.toLowerCase().includes('party')) { catBg = '#fffbeb'; catColor = '#b45309'; }
    else if (catName.toLowerCase().includes('policy')) { catBg = '#f5f3ff'; catColor = '#6d28d9'; }

    // Priority styling
    let prioBg = '#f1f5f9', prioColor = '#475569';
    if (prioName.toLowerCase() === 'urgent') { prioBg = '#fee2e2'; prioColor = '#b91c1c'; }
    else if (prioName.toLowerCase() === 'important') { prioBg = '#fef3c7'; prioColor = '#b45309'; }

    tr.innerHTML = `
      <td>
        <span style="font-weight: 800; font-size: 12px; color: #059669; background: #ecfdf5; padding: 4px 8px; border-radius: 6px;">
          ${refCode}
        </span>
      </td>
      <td>
        <div style="margin-bottom: 4px;">
          <span class="badge" style="background:${catBg}; color:${catColor}; font-size: 11px; padding: 3px 8px; font-weight: 700;">
            ${catName}
          </span>
        </div>
        <div>
          <span class="badge" style="background:${prioBg}; color:${prioColor}; font-size: 10px; padding: 2px 6px;">
            ${prioName}
          </span>
        </div>
      </td>
      <td>
        <div style="font-weight: 700; color: var(--text-primary);">${item.name}</div>
        <div style="font-size: 12px; color: #059669; font-weight: 600;">${item.phone || 'N/A'}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${item.email || ''}</div>
      </td>
      <td>
        <div style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${item.subject || 'Concern / Enquiry'}</div>
      </td>
      <td style="max-width: 320px; font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
        ${item.message}
      </td>
      <td style="font-size: 12px; color: var(--text-muted);">${dateText}</td>
      <td style="text-align: right;">
        <button class="btn btn-sm btn-outline btn-delete-enquiry" data-id="${item.id}" style="color: var(--accent-rose); border-color: #fca5a5;" title="Delete Message">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-delete-enquiry').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetBtn = e.currentTarget;
      const id = targetBtn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this enquiry message?')) {
        setBtnLoading(targetBtn, true, 'Deleting...');
        try {
          await apiDeleteEnquiry(id);
          appData.enquiries = await apiGetEnquiries();
          updateBadges();
          renderEnquiriesTable();
        } finally {
          setBtnLoading(targetBtn, false);
        }
      }
    });
  });
}

function renderJoinRequestsTable() {
  const tbody = document.getElementById('join-requests-table-body');
  const btnRefresh = document.getElementById('btn-refresh-join-requests');

  if (btnRefresh && !btnRefresh.dataset.bound) {
    btnRefresh.dataset.bound = 'true';
    btnRefresh.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      setBtnLoading(btn, true, 'Refreshing...');
      try {
        appData.joinRequests = await apiGetJoinRequests();
        updateBadges();
        renderJoinRequestsTable();
      } finally {
        setBtnLoading(btn, false);
      }
    });
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  if (!appData.joinRequests || appData.joinRequests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No website membership join applications received yet.</td></tr>`;
    return;
  }

  appData.joinRequests.forEach(item => {
    const tr = document.createElement('tr');
    const dateText = item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent';
    const statusBg = item.status === 'APPROVED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)';
    const statusColor = item.status === 'APPROVED' ? '#10B981' : '#F59E0B';

    tr.innerHTML = `
      <td><code>#${item.id}</code></td>
      <td><strong>${item.name}</strong></td>
      <td>
        <div style="font-size:13px; color:var(--text-primary);"><i class="fa-solid fa-phone" style="font-size:11px; color:var(--accent-indigo);"></i> ${item.phone}</div>
        <div style="font-size:12px; color:var(--text-muted);">${item.email || 'No email provided'}</div>
      </td>
      <td><span class="pill-tag" style="background:rgba(99,102,241,0.12); color:#6366F1; font-weight:600;"><i class="fa-solid fa-award"></i> ${item.plan || 'Free Member'}</span></td>
      <td>
        <div style="font-size:13px; font-weight:500;">${item.district || 'N/A'}</div>
        <div style="font-size:12px; color:var(--text-muted);">${item.state || 'India'}</div>
      </td>
      <td style="font-size:12px; color:var(--text-muted);">${dateText}</td>
      <td><span class="badge" style="background:${statusBg}; color:${statusColor}; font-weight:600;">${item.status || 'PENDING'}</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-sm btn-outline btn-delete-join-req" data-id="${item.id}" style="color:var(--accent-rose);">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-delete-join-req').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetBtn = e.currentTarget;
      const id = targetBtn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this membership join application?')) {
        setBtnLoading(targetBtn, true, 'Deleting...');
        try {
          await apiDeleteJoinRequest(id);
          appData.joinRequests = await apiGetJoinRequests();
          updateBadges();
          renderJoinRequestsTable();
        } finally {
          setBtnLoading(targetBtn, false);
        }
      }
    });
  });
}

/* ==========================================================================
   MANIFESTO & GALLERY CMS RENDERERS
   ========================================================================== */

function renderManifestoGrid() {
  const container = document.getElementById('manifesto-grid-container');
  const btnOpenModal = document.getElementById('btn-open-create-manifesto-modal');

  if (btnOpenModal && !btnOpenModal.dataset.bound) {
    btnOpenModal.dataset.bound = 'true';
    btnOpenModal.addEventListener('click', () => {
      const modal = document.getElementById('modal-manifesto');
      if (modal) modal.classList.add('active');
    });
  }

  // Bind Form Submit
  const form = document.getElementById('form-manifesto');
  if (form && !form.dataset.bound) {
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSubmit = document.getElementById('btn-save-manifesto');
      const fileInput = document.getElementById('manifesto-input-file');
      const imageInput = document.getElementById('manifesto-input-image');
      const statusDiv = document.getElementById('manifesto-upload-status');

      let finalImageUrl = imageInput ? imageInput.value.trim() : '';

      setBtnLoading(btnSubmit, true, 'Saving Manifesto...');

      try {
        if (fileInput && fileInput.files.length > 0) {
          if (statusDiv) statusDiv.innerHTML = `<span class="upload-status-pill"><i class="fa-solid fa-spinner fa-spin"></i> Uploading Image to Cloudinary...</span>`;
          finalImageUrl = await apiUploadMediaFile(fileInput.files[0]);
          if (statusDiv) statusDiv.innerHTML = `<span class="upload-status-pill" style="color:var(--accent-emerald);"><i class="fa-solid fa-circle-check"></i> Image Uploaded!</span>`;
        }

        const payload = {
          title: document.getElementById('manifesto-input-title').value,
          category: document.getElementById('manifesto-input-category').value,
          subtitle: document.getElementById('manifesto-input-subtitle').value,
          icon_name: document.getElementById('manifesto-input-icon').value || 'fa-book-open',
          image_url: finalImageUrl,
          content: document.getElementById('manifesto-input-content').value
        };

        await apiCreateManifesto(payload);
        alert('Manifesto topic added successfully!');
        form.reset();
        if (statusDiv) statusDiv.innerHTML = '';
        document.getElementById('modal-manifesto').classList.remove('active');
        appData.manifesto = await apiGetManifesto();
        updateBadges();
        renderManifestoGrid();
      } catch (err) {
        alert('Error creating manifesto item: ' + err.message);
      } finally {
        setBtnLoading(btnSubmit, false);
      }
    });
  }

  if (!container) return;
  container.innerHTML = '';

  if (!appData.manifesto || appData.manifesto.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; padding:40px; text-align:center; color:var(--text-muted);">No manifesto charter pillars added yet. Click "Add Manifesto Pillar" above.</div>`;
    return;
  }

  appData.manifesto.forEach(item => {
    const card = document.createElement('div');
    card.className = 'post-admin-card';
    const fallbackImage = item.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';
    const iconClass = item.icon_name || 'fa-book-open';

    card.innerHTML = `
      <div class="post-card-header">
        <span class="pill-tag" style="background:rgba(139,92,246,0.15); color:#8B5CF6; font-weight:700;">
          <i class="fa-solid ${iconClass}"></i> ${item.category || 'General'}
        </span>
        <button class="btn btn-sm btn-outline btn-delete-manifesto" data-id="${item.id}" style="color:var(--accent-rose);">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>
      <img src="${fallbackImage}" class="post-card-image" alt="${item.title}" onError="this.onerror=null;this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';" />
      <h3 style="font-size:16px; font-weight:700; color:var(--text-primary); margin-top:6px;">${item.title}</h3>
      <p style="font-size:12px; font-weight:600; color:var(--primary); margin-bottom:4px;">${item.subtitle || ''}</p>
      <p class="post-desc">${item.content || item.summary || ''}</p>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-delete-manifesto').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetBtn = e.currentTarget;
      const id = targetBtn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this manifesto pillar?')) {
        setBtnLoading(targetBtn, true, 'Deleting...');
        try {
          await apiDeleteManifesto(id);
          appData.manifesto = await apiGetManifesto();
          updateBadges();
          renderManifestoGrid();
        } finally {
          setBtnLoading(targetBtn, false);
        }
      }
    });
  });
}

function renderGalleryGrid() {
  const container = document.getElementById('gallery-grid-container');
  const btnOpenModal = document.getElementById('btn-open-create-gallery-modal');

  if (btnOpenModal && !btnOpenModal.dataset.bound) {
    btnOpenModal.dataset.bound = 'true';
    btnOpenModal.addEventListener('click', () => {
      const modal = document.getElementById('modal-gallery');
      if (modal) modal.classList.add('active');
    });
  }

  // Bind Form Submit
  const form = document.getElementById('form-gallery');
  if (form && !form.dataset.bound) {
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSubmit = document.getElementById('btn-save-gallery');
      const fileInput = document.getElementById('gallery-input-file');
      const imageInput = document.getElementById('gallery-input-image');
      const statusDiv = document.getElementById('gallery-upload-status');

      let finalImageUrl = imageInput ? imageInput.value.trim() : '';

      setBtnLoading(btnSubmit, true, 'Saving Gallery Photo...');

      try {
        if (fileInput && fileInput.files.length > 0) {
          if (statusDiv) statusDiv.innerHTML = `<span class="upload-status-pill"><i class="fa-solid fa-spinner fa-spin"></i> Uploading Image to Cloudinary...</span>`;
          finalImageUrl = await apiUploadMediaFile(fileInput.files[0]);
          if (statusDiv) statusDiv.innerHTML = `<span class="upload-status-pill" style="color:var(--accent-emerald);"><i class="fa-solid fa-circle-check"></i> Image Uploaded!</span>`;
        }

        if (!finalImageUrl) {
          throw new Error('Image file upload or Image URL is required');
        }

        const payload = {
          title: document.getElementById('gallery-input-title').value,
          category: document.getElementById('gallery-input-category').value,
          image_url: finalImageUrl,
          description: document.getElementById('gallery-input-desc').value
        };

        await apiCreateGallery(payload);
        alert('Gallery photo added successfully!');
        form.reset();
        if (statusDiv) statusDiv.innerHTML = '';
        document.getElementById('modal-gallery').classList.remove('active');
        appData.gallery = await apiGetGallery();
        updateBadges();
        renderGalleryGrid();
      } catch (err) {
        alert('Error creating gallery item: ' + err.message);
      } finally {
        setBtnLoading(btnSubmit, false);
      }
    });
  }

  if (!container) return;
  container.innerHTML = '';

  if (!appData.gallery || appData.gallery.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; padding:40px; text-align:center; color:var(--text-muted);">No gallery highlights uploaded yet. Click "Upload Gallery Image" above.</div>`;
    return;
  }

  appData.gallery.forEach(item => {
    const card = document.createElement('div');
    card.className = 'post-admin-card';

    card.innerHTML = `
      <div class="post-card-header">
        <span class="pill-tag" style="background:rgba(236,72,153,0.15); color:#EC4899; font-weight:700;">
          <i class="fa-solid fa-tag"></i> ${item.category || 'Events'}
        </span>
        <button class="btn btn-sm btn-outline btn-delete-gallery" data-id="${item.id}" style="color:var(--accent-rose);">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>
      <img src="${item.image_url}" class="post-card-image" alt="${item.title}" onError="this.onerror=null;this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';" />
      <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin-top:6px;">${item.title}</h3>
      <p class="post-desc">${item.description || ''}</p>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-delete-gallery').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetBtn = e.currentTarget;
      const id = targetBtn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this gallery photo?')) {
        setBtnLoading(targetBtn, true, 'Deleting...');
        try {
          await apiDeleteGallery(id);
          appData.gallery = await apiGetGallery();
          updateBadges();
          renderGalleryGrid();
        } finally {
          setBtnLoading(targetBtn, false);
        }
      }
    });
  });
}

function renderNewsletterGrid() {
  const container = document.getElementById('newsletter-grid-container');
  const btnOpenModal = document.getElementById('btn-open-create-newsletter-modal');

  if (btnOpenModal && !btnOpenModal.dataset.bound) {
    btnOpenModal.dataset.bound = 'true';
    btnOpenModal.addEventListener('click', () => {
      const modal = document.getElementById('modal-newsletter');
      if (modal) modal.classList.add('active');
    });
  }

  // Bind Form Submit
  const form = document.getElementById('form-newsletter');
  if (form && !form.dataset.bound) {
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSubmit = document.getElementById('btn-save-newsletter');
      const mediaFileInput = document.getElementById('newsletter-input-media-file');
      const mediaUrlInput = document.getElementById('newsletter-input-media-url');
      const docFileInput = document.getElementById('newsletter-input-doc-file');
      const docUrlInput = document.getElementById('newsletter-input-doc-url');
      const statusDiv = document.getElementById('newsletter-upload-status');

      let finalMediaUrl = mediaUrlInput ? mediaUrlInput.value.trim() : '';
      let finalDocUrl = docUrlInput ? docUrlInput.value.trim() : '';
      let finalDocName = '';

      setBtnLoading(btnSubmit, true, 'Publishing News Letter...');

      try {
        if (mediaFileInput && mediaFileInput.files.length > 0) {
          if (statusDiv) statusDiv.innerHTML = `<span class="upload-status-pill"><i class="fa-solid fa-spinner fa-spin"></i> Uploading Media to Cloudinary...</span>`;
          finalMediaUrl = await apiUploadMediaFile(mediaFileInput.files[0]);
        }

        if (docFileInput && docFileInput.files.length > 0) {
          if (statusDiv) statusDiv.innerHTML = `<span class="upload-status-pill"><i class="fa-solid fa-spinner fa-spin"></i> Uploading Document/PDF...</span>`;
          finalDocName = docFileInput.files[0].name;
          finalDocUrl = await apiUploadMediaFile(docFileInput.files[0]);
        }

        if (statusDiv) statusDiv.innerHTML = `<span class="upload-status-pill" style="color:var(--accent-emerald);"><i class="fa-solid fa-circle-check"></i> Files Uploaded!</span>`;

        const payload = {
          title: document.getElementById('newsletter-input-title').value,
          category: document.getElementById('newsletter-input-category').value,
          subtitle: document.getElementById('newsletter-input-subtitle').value,
          author: document.getElementById('newsletter-input-author').value,
          media_type: document.getElementById('newsletter-input-media-type').value,
          media_url: finalMediaUrl,
          doc_url: finalDocUrl,
          doc_name: finalDocName || (finalDocUrl ? 'newsletter_document.pdf' : ''),
          description: document.getElementById('newsletter-input-description').value
        };

        await apiCreateNewsletter(payload);
        alert('News Letter published successfully!');
        form.reset();
        if (statusDiv) statusDiv.innerHTML = '';
        document.getElementById('modal-newsletter').classList.remove('active');
        appData.newsletters = await apiGetNewsletters();
        updateBadges();
        renderNewsletterGrid();
      } catch (err) {
        alert('Error publishing newsletter: ' + err.message);
      } finally {
        setBtnLoading(btnSubmit, false);
      }
    });
  }

  if (!container) return;
  container.innerHTML = '';

  if (!appData.newsletters || appData.newsletters.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; padding:40px; text-align:center; color:var(--text-muted);">No news letters or press meets published yet. Click "Add News Letter" above.</div>`;
    return;
  }

  appData.newsletters.forEach(item => {
    const card = document.createElement('div');
    card.className = 'post-admin-card';

    const hasMedia = Boolean(item.media_url);
    const isVideo = item.media_type === 'video';
    const hasDoc = Boolean(item.doc_url);
    const publishDate = item.publish_date ? new Date(item.publish_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';

    let mediaHtml = '';
    if (hasMedia) {
      if (isVideo) {
        mediaHtml = `
          <div style="position:relative; width:100%; height:180px; background:#000; border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
            <video src="${item.media_url}" style="width:100%; height:100%; object-fit:cover;" preload="metadata"></video>
            <div style="position:absolute; width:44px; height:44px; background:rgba(2,132,199,0.85); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff;">
              <i class="fa-solid fa-play"></i>
            </div>
          </div>
        `;
      } else {
        mediaHtml = `<img src="${item.media_url}" class="post-card-image" alt="${item.title}" onError="this.onerror=null;this.src='/images/banner.jpg';" />`;
      }
    }

    card.innerHTML = `
      <div class="post-card-header">
        <span class="pill-tag" style="background:rgba(2,132,199,0.15); color:#0284c7; font-weight:700;">
          <i class="fa-solid fa-microphone-lines"></i> ${item.category || 'Press Meet'}
        </span>
        <button class="btn btn-sm btn-outline btn-delete-newsletter" data-id="${item.id}" style="color:var(--accent-rose);">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>
      ${mediaHtml}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; font-size:11px; color:var(--text-muted);">
        <span><i class="fa-regular fa-calendar"></i> ${publishDate}</span>
        <span><i class="fa-solid fa-user-tie"></i> ${item.author ? item.author.split('-')[0].trim() : 'PPPI President'}</span>
      </div>
      <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin-top:6px; line-height:1.35;">${item.title}</h3>
      ${item.subtitle ? `<p style="font-size:12px; font-weight:600; color:#0284c7; margin-bottom:4px;">${item.subtitle}</p>` : ''}
      <p class="post-desc" style="max-height:80px; overflow:hidden; text-overflow:ellipsis;">${item.description || ''}</p>
      ${hasDoc ? `
        <div style="margin-top:10px; padding:6px 12px; background:rgba(16,185,129,0.1); border-radius:6px; display:flex; align-items:center; justify-content:space-between;">
          <span style="font-size:12px; font-weight:700; color:#059669;"><i class="fa-solid fa-file-pdf"></i> ${item.doc_name || 'Attached Document'}</span>
          <a href="${item.doc_url}" target="_blank" download class="btn btn-sm btn-outline" style="padding:2px 8px; font-size:11px; color:#059669; border-color:#059669;">Download</a>
        </div>
      ` : ''}
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-delete-newsletter').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetBtn = e.currentTarget;
      const id = targetBtn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this News Letter / Press Meet?')) {
        setBtnLoading(targetBtn, true, 'Deleting...');
        try {
          await apiDeleteNewsletter(id);
          appData.newsletters = await apiGetNewsletters();
          updateBadges();
          renderNewsletterGrid();
        } finally {
          setBtnLoading(targetBtn, false);
        }
      }
    });
  });
}

function renderPublicityGrid() {
  const container = document.getElementById('publicity-grid-container');
  const btnOpenModal = document.getElementById('btn-open-create-publicity-modal');

  if (btnOpenModal && !btnOpenModal.dataset.bound) {
    btnOpenModal.dataset.bound = 'true';
    btnOpenModal.addEventListener('click', () => {
      const modal = document.getElementById('modal-publicity');
      if (modal) modal.classList.add('active');
    });
  }

  // Bind Form Submit
  const form = document.getElementById('form-publicity');
  if (form && !form.dataset.bound) {
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSubmit = document.getElementById('btn-save-publicity');
      const mediaFileInput = document.getElementById('publicity-input-media-file');
      const mediaUrlInput = document.getElementById('publicity-input-media-url');
      const statusDiv = document.getElementById('publicity-upload-status');

      let finalMediaUrl = mediaUrlInput ? mediaUrlInput.value.trim() : '';

      setBtnLoading(btnSubmit, true, 'Uploading & Publishing Poster...');

      try {
        if (mediaFileInput && mediaFileInput.files.length > 0) {
          if (statusDiv) statusDiv.innerHTML = `<span class="upload-status-pill"><i class="fa-solid fa-spinner fa-spin"></i> Uploading Asset to Cloudinary...</span>`;
          finalMediaUrl = await apiUploadMediaFile(mediaFileInput.files[0]);
        }

        if (statusDiv) statusDiv.innerHTML = `<span class="upload-status-pill" style="color:var(--accent-emerald);"><i class="fa-solid fa-circle-check"></i> Poster File Ready!</span>`;

        const payload = {
          title: document.getElementById('publicity-input-title').value,
          category: document.getElementById('publicity-input-category').value,
          orientation: document.getElementById('publicity-input-orientation').value,
          media_type: document.getElementById('publicity-input-media-type').value,
          media_url: finalMediaUrl || '/images/banner.jpg',
          description: document.getElementById('publicity-input-description').value
        };

        await apiCreatePublicity(payload);
        alert('Publicity poster published successfully!');
        form.reset();
        if (statusDiv) statusDiv.innerHTML = '';
        document.getElementById('modal-publicity').classList.remove('active');
        appData.publicities = await apiGetPublicities();
        updateBadges();
        renderPublicityGrid();
      } catch (err) {
        alert('Error publishing publicity: ' + err.message);
      } finally {
        setBtnLoading(btnSubmit, false);
      }
    });
  }

  if (!container) return;
  container.innerHTML = '';

  if (!appData.publicities || appData.publicities.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; padding:40px; text-align:center; color:var(--text-muted);">No publicity posters or flex banners published yet. Click "Add Poster / Banner" above.</div>`;
    return;
  }

  appData.publicities.forEach(item => {
    const card = document.createElement('div');
    card.className = 'post-admin-card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';

    const isVideo = item.media_type === 'video';
    const isPdf = item.media_type === 'pdf';
    const isPortrait = item.orientation === 'portrait';
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';

    let mediaHtml = '';
    const mediaHeight = isPortrait ? '300px' : '170px';

    if (isVideo) {
      mediaHtml = `
        <div style="position:relative; width:100%; height:${mediaHeight}; background:#0f172a; border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
          <video src="${item.media_url}" style="width:100%; height:100%; object-fit:cover;" preload="metadata"></video>
          <div style="position:absolute; width:48px; height:48px; background:rgba(5,150,105,0.88); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:18px;">
            <i class="fa-solid fa-play"></i>
          </div>
          <span style="position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.7); color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px;">VIDEO REEL</span>
        </div>
      `;
    } else if (isPdf) {
      mediaHtml = `
        <div style="position:relative; width:100%; height:${mediaHeight}; background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border:1.5px dashed #10b981; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;">
          <i class="fa-solid fa-file-pdf" style="font-size:48px; color:#059669;"></i>
          <span style="font-size:12px; font-weight:700; color:#065f46;">PDF Document / Flyer</span>
        </div>
      `;
    } else {
      mediaHtml = `
        <div style="position:relative; width:100%; height:${mediaHeight}; background:#0f172a; border-radius:8px; overflow:hidden;">
          <img src="${item.media_url}" style="width:100%; height:100%; object-fit:${isPortrait ? 'contain' : 'cover'}; background:#1e293b;" alt="${item.title}" onError="this.onerror=null;this.src='/images/banner.jpg';" />
          <span style="position:absolute; top:8px; left:8px; background:rgba(0,0,0,0.75); color:#fbbf24; font-size:10px; font-weight:800; padding:3px 8px; border-radius:4px; text-transform:uppercase;">
            ${isPortrait ? 'PORTRAIT POSTER' : 'FLEX BANNER'}
          </span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="post-card-header" style="margin-bottom:8px;">
        <span class="pill-tag" style="background:rgba(5,150,105,0.15); color:#059669; font-weight:700;">
          <i class="fa-solid fa-bullhorn"></i> ${item.category || 'Campaign Poster'}
        </span>
        <button class="btn btn-sm btn-outline btn-delete-publicity" data-id="${item.id}" style="color:var(--accent-rose);">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>
      ${mediaHtml}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; font-size:11px; color:var(--text-muted);">
        <span><i class="fa-regular fa-calendar"></i> ${dateStr}</span>
        <span style="color:#059669; font-weight:700;"><i class="fa-solid fa-download"></i> ${item.download_count || 0} Downloads</span>
      </div>
      <h3 style="font-size:15px; font-weight:800; color:var(--text-primary); margin-top:6px; line-height:1.35;">${item.title}</h3>
      <p class="post-desc" style="max-height:60px; overflow:hidden; text-overflow:ellipsis; font-size:12px; margin-top:4px;">${item.description || ''}</p>
      <div style="margin-top:auto; padding-top:12px; display:flex; gap:8px;">
        <a href="${item.media_url}" download target="_blank" class="btn btn-sm btn-outline" style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; color:#059669; border-color:#059669; font-weight:700; text-decoration:none;">
          <i class="fa-solid fa-download"></i> Download Asset
        </a>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-delete-publicity').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetBtn = e.currentTarget;
      const id = targetBtn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this publicity poster/banner?')) {
        setBtnLoading(targetBtn, true, 'Deleting...');
        try {
          await apiDeletePublicity(id);
          appData.publicities = await apiGetPublicities();
          updateBadges();
          renderPublicityGrid();
        } finally {
          setBtnLoading(targetBtn, false);
        }
      }
    });
  });
}

function renderComplaintsTable() {
  const container = document.getElementById('complaints-table-container');
  if (!container) return;

  const searchInput = document.getElementById('input-search-complaints');
  const statusFilter = document.getElementById('filter-complaints-status');

  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = 'true';
    searchInput.addEventListener('input', () => renderComplaintsTable());
  }

  if (statusFilter && !statusFilter.dataset.bound) {
    statusFilter.dataset.bound = 'true';
    statusFilter.addEventListener('change', () => renderComplaintsTable());
  }

  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const selectedStatus = statusFilter ? statusFilter.value : 'ALL';

  let filtered = [...appData.complaints];

  if (selectedStatus !== 'ALL') {
    filtered = filtered.filter(c => c.status === selectedStatus);
  }

  if (query) {
    filtered = filtered.filter(c => 
      (c.complaint_no && c.complaint_no.toLowerCase().includes(query)) ||
      (c.complainer_name && c.complainer_name.toLowerCase().includes(query)) ||
      (c.phone && c.phone.includes(query)) ||
      (c.district && c.district.toLowerCase().includes(query)) ||
      (c.category && c.category.toLowerCase().includes(query))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 48px 20px; text-align: center; color: var(--text-muted);">
        <i class="fa-solid fa-folder-open" style="font-size: 38px; color: #cbd5e1; margin-bottom: 12px;"></i>
        <h3 style="font-size: 16px; color: var(--text-primary); margin-bottom: 4px;">No Complaints Found</h3>
        <p style="font-size: 13px;">No citizen grievance dossiers match the current search or status filter.</p>
      </div>
    `;
    return;
  }

  let tableHtml = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Grievance Reference</th>
          <th>Citizen / Complainer</th>
          <th>Category &amp; Incident</th>
          <th>Location &amp; GPS</th>
          <th>Verification &amp; Selfie</th>
          <th>Status</th>
          <th style="text-align: right;">Confidential Dossier</th>
        </tr>
      </thead>
      <tbody>
  `;

  filtered.forEach(item => {
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
    const hasGps = Boolean(item.latitude && item.longitude);
    const mapsLink = hasGps ? `https://maps.google.com/?q=${item.latitude},${item.longitude}` : '#';

    let statusBadgeStyle = 'background: rgba(245, 158, 11, 0.15); color: #b45309;';
    if (item.status === 'RESOLVED') statusBadgeStyle = 'background: rgba(16, 185, 129, 0.15); color: #059669;';
    if (item.status === 'ACTION_TAKEN') statusBadgeStyle = 'background: rgba(2, 132, 199, 0.15); color: #0284c7;';
    if (item.status === 'REJECTED') statusBadgeStyle = 'background: rgba(239, 68, 68, 0.15); color: #dc2626;';

    tableHtml += `
      <tr>
        <td>
          <div style="font-weight: 800; color: var(--text-primary); font-family: monospace; font-size: 12.5px;">${item.complaint_no}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;"><i class="fa-regular fa-clock"></i> ${dateStr}</div>
          <span class="pill-tag" style="background:#fef2f2; color:#b91c1c; font-size:10px; font-weight:800; padding:1px 6px; margin-top:3px;">
            ${item.priority || 'HIGH'} PRIORITY
          </span>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${item.complainer_name}</div>
          ${item.father_or_spouse ? `<div style="font-size: 11px; color: var(--text-muted);">C/O ${item.father_or_spouse}</div>` : ''}
          <div style="font-size: 12px; color: #0284c7; font-weight: 600; margin-top: 2px;">
            <a href="tel:${item.phone}" style="color:inherit; text-decoration:none;"><i class="fa-solid fa-phone"></i> ${item.phone}</a>
          </div>
        </td>
        <td>
          <div class="pill-tag" style="background: rgba(239, 68, 68, 0.1); color: #b91c1c; font-weight: 700; font-size: 11px; margin-bottom: 3px;">
            ${item.category}
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${item.incident_location || 'Location in description'}
          </div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary); font-size: 12.5px;">${item.district || 'Karnataka'}, ${item.taluk || ''}</div>
          ${hasGps ? `
            <a href="${mapsLink}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: #059669; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; margin-top: 2px;">
              <i class="fa-solid fa-location-crosshairs"></i> GPS: ${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}
            </a>
          ` : `<span style="font-size: 11px; color: var(--text-muted);">Manual Address</span>`}
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${item.selfie_url ? `
              <img src="${item.selfie_url}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid #10b981;" alt="Selfie" onError="this.onerror=null;this.src='/images/founder.jpg';" />
            ` : `
              <div style="width: 38px; height: 38px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8;"><i class="fa-solid fa-user"></i></div>
            `}
            <div>
              <span class="pill-tag" style="background:#ecfdf5; color:#065f46; font-size:10px; font-weight:800; padding:2px 6px;">
                <i class="fa-solid fa-id-card"></i> AADHAAR VERIFIED
              </span>
              ${item.pan_no ? `
                <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; margin-top: 2px;">PAN: ${item.pan_no}</div>
              ` : ''}
            </div>
          </div>
        </td>
        <td>
          <span class="pill-tag" style="${statusBadgeStyle} font-weight: 800; font-size: 11px;">
            ${item.status}
          </span>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn btn-sm btn-primary btn-open-dossier" data-id="${item.id}" style="background: #1e1b4b; border-color: #1e1b4b; padding: 6px 12px; font-size: 12px; font-weight: 700;">
            <i class="fa-solid fa-folder-open"></i> View Dossier
          </button>
        </td>
      </tr>
    `;
  });

  tableHtml += `
      </tbody>
    </table>
  `;

  container.innerHTML = tableHtml;

  // Bind Open Dossier Modal Click
  container.querySelectorAll('.btn-open-dossier').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openComplaintDossierModal(id);
    });
  });
}

function openComplaintDossierModal(id) {
  const item = appData.complaints.find(c => String(c.id) === String(id) || c.complaint_no === id);
  if (!item) return;

  const modal = document.getElementById('modal-complaint-dossier');
  const titleEl = document.getElementById('dossier-modal-title');
  const bodyEl = document.getElementById('dossier-modal-body');

  if (titleEl) {
    titleEl.textContent = `Confidential Dossier: ${item.complaint_no}`;
  }

  const hasGps = Boolean(item.latitude && item.longitude);
  const mapsLink = hasGps ? `https://maps.google.com/?q=${item.latitude},${item.longitude}` : '#';
  const dateStr = item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : 'Recent';
  const incidentDateStr = item.incident_date ? new Date(item.incident_date).toLocaleDateString('en-IN') : 'Not specified';

  if (bodyEl) {
    bodyEl.innerHTML = `
      <!-- TOP STATUS & PRIORITY RIBBON -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase;">Tracking Ref:</span>
          <span style="font-family: monospace; font-size: 15px; font-weight: 900; color: #1e1b4b;">${item.complaint_no}</span>
          <span class="pill-tag" style="background:#fee2e2; color:#b91c1c; font-weight:800; font-size:11px;">${item.priority || 'HIGH'} PRIORITY</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #64748b;">
          <span><i class="fa-regular fa-clock"></i> Filed On: <strong>${dateStr}</strong></span>
          <span class="pill-tag" style="background:#ecfdf5; color:#065f46; font-weight:800;"><i class="fa-solid fa-shield-halved"></i> LEGALLY SEALED</span>
        </div>
      </div>

      <!-- 2-COLUMN DOSSIER GRID -->
      <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px; align-items: start;">
        
        <!-- LEFT COLUMN: CITIZEN CREDENTIALS & LOCATION -->
        <div>
          <!-- CITIZEN / COMPLAINER CARD -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
            <h4 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 8px;">
              <i class="fa-solid fa-user-check" style="color: #0284c7;"></i> Complainer / Citizen Credentials
            </h4>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between;"><span style="color:#64748b; font-weight:600;">Full Name:</span> <strong style="color:#0f172a;">${item.complainer_name}</strong></div>
              ${item.father_or_spouse ? `<div style="display: flex; justify-content: space-between;"><span style="color:#64748b;">Father/Spouse:</span> <span>${item.father_or_spouse}</span></div>` : ''}
              <div style="display: flex; justify-content: space-between;"><span style="color:#64748b;">Mobile:</span> <a href="tel:${item.phone}" style="color:#0284c7; font-weight:700; text-decoration:none;">${item.phone}</a></div>
              ${item.alternate_phone ? `<div style="display: flex; justify-content: space-between;"><span style="color:#64748b;">Alt Contact:</span> <span>${item.alternate_phone}</span></div>` : ''}
              ${item.email ? `<div style="display: flex; justify-content: space-between;"><span style="color:#64748b;">Email:</span> <span>${item.email}</span></div>` : ''}
              <div style="display: flex; justify-content: space-between;"><span style="color:#64748b;">Gender / Age:</span> <span>${item.gender || 'N/A'}, ${item.age ? item.age + ' Yrs' : 'N/A'}</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color:#64748b;">Aadhaar Card:</span> <strong style="color:#065f46; font-family:monospace;">${item.aadhaar_no}</strong></div>
              ${item.pan_no ? `<div style="display: flex; justify-content: space-between;"><span style="color:#64748b;">PAN Card:</span> <strong style="color:#0284c7; font-family:monospace;">${item.pan_no}</strong></div>` : ''}
              <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
                <span style="color:#64748b; font-size:12px; display:block; margin-bottom:2px;">Residential Address:</span>
                <div style="color:#334155; font-size:12.5px; line-height:1.4;">${item.address}, ${item.taluk ? item.taluk + ', ' : ''}${item.district}, ${item.state} - ${item.pincode}</div>
              </div>
            </div>
          </div>

          <!-- VICTIM STATUS CARD -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
            <h4 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-hospital-user" style="color: #e11d48;"></i> Victim Information
            </h4>
            ${item.is_victim ? `
              <div class="pill-tag" style="background:#f0fdf4; color:#059669; font-weight:700; font-size:12px;">
                <i class="fa-solid fa-check"></i> Complainer is the direct primary victim
              </div>
            ` : `
              <div style="font-size: 12.5px; line-height: 1.5; color: #334155;">
                <div><strong>Victim Name:</strong> ${item.victim_name || 'Not provided'}</div>
                <div><strong>Relation to Complainer:</strong> ${item.victim_relation || 'Not specified'}</div>
                <div><strong>Contact:</strong> ${item.victim_contact || 'N/A'}</div>
                <div><strong>Address:</strong> ${item.victim_address || 'N/A'}</div>
              </div>
            `}
          </div>

          <!-- VERIFICATION SELFIE & GPS CARD -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
            <h4 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 8px;">
              <i class="fa-solid fa-camera-retro" style="color: #059669;"></i> Live Selfie &amp; Geolocation Verification
            </h4>
            <div style="display: flex; gap: 14px; align-items: center;">
              ${item.selfie_url ? `
                <div style="width: 100px; height: 100px; border-radius: 10px; overflow: hidden; border: 2px solid #10b981; flex-shrink: 0; background: #000;">
                  <img src="${item.selfie_url}" style="width: 100%; height: 100%; object-fit: cover;" alt="Verification Selfie" onError="this.onerror=null;this.src='/images/founder.jpg';" />
                </div>
              ` : `
                <div style="width: 100px; height: 100px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8;">No Selfie</div>
              `}
              <div style="flex: 1; font-size: 12px; line-height: 1.5;">
                <div style="font-weight: 800; color: #065f46;"><i class="fa-solid fa-circle-check"></i> Biometric Selfie Authenticated</div>
                <div style="color: #64748b; margin-top: 4px;">Captured live via Citizen Camera stream</div>
                ${hasGps ? `
                  <div style="margin-top: 8px;">
                    <a href="${mapsLink}" target="_blank" class="btn btn-sm btn-outline" style="color: #059669; border-color: #059669; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                      <i class="fa-solid fa-map-location-dot"></i> View Incident GPS on Google Maps
                    </a>
                  </div>
                ` : ''}
              </div>
            </div>
            ${item.gps_address ? `
              <div style="margin-top: 10px; font-size: 11.5px; color: #475569; background: #f8fafc; padding: 8px 10px; border-radius: 6px;">
                <i class="fa-solid fa-location-dot" style="color:#ef4444;"></i> <strong>GPS Reverse Address:</strong> ${item.gps_address}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- RIGHT COLUMN: INCIDENT, TRANSCRIPT, EVIDENCE & CASE ACTION -->
        <div>
          <!-- INCIDENT PARTICULARS -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
            <h4 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 8px;">
              <i class="fa-solid fa-triangle-exclamation" style="color: #b91c1c;"></i> Incident Particulars &amp; Accused Details
            </h4>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between;"><span style="color:#64748b; font-weight:600;">Category:</span> <strong style="color:#b91c1c;">${item.category}</strong></div>
              <div style="display: flex; justify-content: space-between;"><span style="color:#64748b;">Incident Date:</span> <span>${incidentDateStr}</span></div>
              <div><span style="color:#64748b; display:block; margin-bottom:2px;">Incident Location / Jurisdiction:</span> <strong>${item.incident_location}</strong></div>
              ${item.accused_details ? `
                <div style="background: #fff1f2; border: 1px solid #fecdd3; padding: 8px 12px; border-radius: 6px; margin-top: 4px;">
                  <span style="color: #9f1239; font-weight: 800; font-size: 11.5px; text-transform: uppercase; display:block; margin-bottom: 2px;">Accused Individual(s) / Organization:</span>
                  <div style="color: #881337; font-size: 12.5px;">${item.accused_details}</div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- FULL COMPLAINT NARRATIVE STATEMENT -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
            <h4 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-file-lines" style="color: #0284c7;"></i> Citizen Statement &amp; Case Narrative
            </h4>
            <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 6px; font-size: 13px; line-height: 1.65; color: #1e293b; text-align: justify; max-height: 220px; overflow-y: auto;">
              ${(item.description || '').replace(/\n/g, '<br/>')}
            </div>
            ${item.evidence_urls ? `
              <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 12px; font-weight: 700; color: #059669;"><i class="fa-solid fa-paperclip"></i> Supporting Evidence Files Attached</span>
                <a href="${item.evidence_urls}" target="_blank" download class="btn btn-sm btn-outline" style="color: #059669; border-color: #059669; font-size: 11px;">Download Evidence</a>
              </div>
            ` : ''}
          </div>

          <!-- ADMIN CASE CONTROLS -->
          <div style="background: #faf5ff; border: 1.5px solid #d8b4fe; border-radius: 10px; padding: 18px;">
            <h4 style="font-size: 13px; font-weight: 800; color: #6b21a8; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-gavel"></i> Admin Grievance Action &amp; Status Controls
            </h4>
            <div style="display: flex; gap: 12px; margin-bottom: 12px;">
              <div style="flex: 1;">
                <label style="display:block; font-size: 11.5px; font-weight: 700; color: #581c87; margin-bottom: 4px;">Update Status</label>
                <select id="dossier-status-select" class="form-select" style="width: 100%; font-size: 12.5px;">
                  <option value="PENDING" ${item.status === 'PENDING' ? 'selected' : ''}>PENDING VERIFICATION</option>
                  <option value="UNDER_REVIEW" ${item.status === 'UNDER_REVIEW' ? 'selected' : ''}>UNDER REVIEW / INVESTIGATION</option>
                  <option value="ACTION_TAKEN" ${item.status === 'ACTION_TAKEN' ? 'selected' : ''}>LEGAL ACTION INITIATED</option>
                  <option value="RESOLVED" ${item.status === 'RESOLVED' ? 'selected' : ''}>RESOLVED / JUSTICE SERVED</option>
                  <option value="REJECTED" ${item.status === 'REJECTED' ? 'selected' : ''}>REJECTED / INVALID</option>
                </select>
              </div>
              <div style="flex: 1;">
                <label style="display:block; font-size: 11.5px; font-weight: 700; color: #581c87; margin-bottom: 4px;">Assigned Legal Officer / Convener</label>
                <input type="text" id="dossier-officer-input" class="form-control" style="font-size: 12.5px;" value="${item.action_taken_by || 'PPPI Legal Action Cell'}" />
              </div>
            </div>
            <div style="margin-bottom: 14px;">
              <label style="display:block; font-size: 11.5px; font-weight: 700; color: #581c87; margin-bottom: 4px;">Internal Case Notes &amp; Action Taken</label>
              <textarea id="dossier-notes-textarea" class="form-control" rows="3" style="font-size: 12.5px;" placeholder="Document legal notices sent, district administration response, ground inspections, and resolution details...">${item.admin_notes || ''}</textarea>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <button type="button" class="btn btn-sm btn-outline" id="btn-delete-dossier" style="color: var(--accent-rose); border-color: var(--accent-rose); font-size: 12px;">
                <i class="fa-solid fa-trash"></i> Delete Case
              </button>
              <button type="button" class="btn btn-sm btn-primary" id="btn-save-dossier-action" style="background: #6b21a8; border-color: #6b21a8; font-size: 12.5px; font-weight: 700;">
                <i class="fa-solid fa-floppy-disk"></i> Save Case Updates
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    // Bind Save Case Action
    const saveBtn = document.getElementById('btn-save-dossier-action');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const newStatus = document.getElementById('dossier-status-select').value;
        const newOfficer = document.getElementById('dossier-officer-input').value;
        const newNotes = document.getElementById('dossier-notes-textarea').value;

        setBtnLoading(saveBtn, true, 'Updating...');
        try {
          await apiUpdateComplaint(item.id, {
            status: newStatus,
            action_taken_by: newOfficer,
            admin_notes: newNotes
          });
          alert('Complaint dossier updated successfully!');
          appData.complaints = await apiGetComplaints();
          updateBadges();
          renderComplaintsTable();
          modal.classList.remove('active');
        } catch (err) {
          alert('Error updating dossier: ' + err.message);
        } finally {
          setBtnLoading(saveBtn, false);
        }
      });
    }

    // Bind Delete Case
    const deleteBtn = document.getElementById('btn-delete-dossier');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete complaint dossier ${item.complaint_no}? This action cannot be undone.`)) {
          setBtnLoading(deleteBtn, true, 'Deleting...');
          try {
            await apiDeleteComplaint(item.id);
            alert('Complaint dossier deleted successfully.');
            appData.complaints = await apiGetComplaints();
            updateBadges();
            renderComplaintsTable();
            modal.classList.remove('active');
          } catch (err) {
            alert('Error deleting complaint: ' + err.message);
          } finally {
            setBtnLoading(deleteBtn, false);
          }
        }
      });
    }
  }

  modal.classList.add('active');
}

function renderMaintenanceView() {
  const isMaint = Boolean(appData.settings && appData.settings.maintenance_mode);
  
  // 1. Elements in Website -> Maintenance Mode view
  const statusCard = document.getElementById('maintenance-status-card');
  const statusPill = document.getElementById('maintenance-status-pill');
  const toggleBtn = document.getElementById('btn-toggle-maintenance');
  const lastUpdated = document.getElementById('maintenance-last-updated');
  const headlinePreview = document.getElementById('maintenance-headline-preview');


  const headlineInput = document.getElementById('maintenance-input-headline');
  const subtextInput = document.getElementById('maintenance-input-subtext');
  const phoneInput = document.getElementById('maintenance-input-phone');
  const emailInput = document.getElementById('maintenance-input-email');

  // 2. Elements in System -> Settings view
  const settingsMaintCard = document.getElementById('settings-maintenance-card');
  const settingsMaintPill = document.getElementById('settings-maintenance-status-pill');
  const settingsToggleBtn = document.getElementById('btn-toggle-maintenance-settings');
  const settingsLastUpdated = document.getElementById('settings-maintenance-last-updated');

  if (appData.settings) {
    if (headlineInput && appData.settings.maintenance_message) {
      headlineInput.value = appData.settings.maintenance_message;
    }
    if (subtextInput && appData.settings.maintenance_subtext) {
      subtextInput.value = appData.settings.maintenance_subtext;
    }
    if (phoneInput && appData.settings.contact_helpline) {
      phoneInput.value = appData.settings.contact_helpline;
    }
    if (emailInput && appData.settings.contact_email) {
      emailInput.value = appData.settings.contact_email;
    }
    if (headlinePreview) {
      headlinePreview.textContent = appData.settings.maintenance_message || 'Currently Website & Mobile App Under Development';
    }
    const timeStr = appData.settings.updated_at ? new Date(appData.settings.updated_at).toLocaleTimeString() : 'Just now';
    if (lastUpdated) lastUpdated.textContent = 'Updated: ' + timeStr;
    if (settingsLastUpdated) settingsLastUpdated.textContent = 'Updated: ' + timeStr;
  }

  // Update Status in Maintenance View
  if (statusCard && statusPill && toggleBtn) {
    if (isMaint) {
      statusCard.style.borderColor = 'rgba(239, 68, 68, 0.6)';
      statusCard.style.background = 'rgba(239, 68, 68, 0.04)';
      statusPill.style.background = 'rgba(239, 68, 68, 0.15)';
      statusPill.style.color = '#ef4444';
      statusPill.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> MAINTENANCE MODE ACTIVE';
      toggleBtn.className = 'btn btn-outline';
      toggleBtn.style.color = '#ef4444';
      toggleBtn.style.borderColor = '#ef4444';
      toggleBtn.innerHTML = '<i class="fa-solid fa-power-off"></i> Disable Maintenance (Go Live)';
    } else {
      statusCard.style.borderColor = 'var(--border-color)';
      statusCard.style.background = 'transparent';
      statusPill.style.background = 'rgba(16, 185, 129, 0.15)';
      statusPill.style.color = '#10b981';
      statusPill.innerHTML = '<i class="fa-solid fa-circle-check"></i> WEBSITE IS LIVE';
      toggleBtn.className = 'btn btn-primary';
      toggleBtn.style.color = '';
      toggleBtn.style.borderColor = '';
      toggleBtn.innerHTML = '<i class="fa-solid fa-power-off"></i> Enable Maintenance Mode';
    }
  }

  // Update Status in System Settings View
  if (settingsMaintCard && settingsMaintPill && settingsToggleBtn) {
    if (isMaint) {
      settingsMaintCard.style.borderColor = 'rgba(239, 68, 68, 0.6)';
      settingsMaintCard.style.background = 'rgba(239, 68, 68, 0.04)';
      settingsMaintPill.style.background = 'rgba(239, 68, 68, 0.15)';
      settingsMaintPill.style.color = '#ef4444';
      settingsMaintPill.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> MAINTENANCE ACTIVE';
      settingsToggleBtn.className = 'btn btn-outline';
      settingsToggleBtn.style.color = '#ef4444';
      settingsToggleBtn.style.borderColor = '#ef4444';
      settingsToggleBtn.innerHTML = '<i class="fa-solid fa-power-off"></i> Turn OFF (Go Live)';
    } else {
      settingsMaintCard.style.borderColor = 'var(--border-color)';
      settingsMaintCard.style.background = 'transparent';
      settingsMaintPill.style.background = 'rgba(16, 185, 129, 0.15)';
      settingsMaintPill.style.color = '#10b981';
      settingsMaintPill.innerHTML = '<i class="fa-solid fa-circle-check"></i> WEBSITE IS LIVE';
      settingsToggleBtn.className = 'btn btn-primary';
      settingsToggleBtn.style.color = '';
      settingsToggleBtn.style.borderColor = '';
      settingsToggleBtn.innerHTML = '<i class="fa-solid fa-power-off"></i> Turn ON Maintenance Mode';
    }
  }

  // Bind Save form in Maintenance View
  const form = document.getElementById('form-maintenance-settings');
  if (form && !form.dataset.bound) {
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSave = document.getElementById('btn-save-maintenance-content');
      showScreenLoader('Saving maintenance content settings...');
      try {
        const headlineInput = document.getElementById('maintenance-input-headline');
        const subtextInput = document.getElementById('maintenance-input-subtext');
        const phoneInput = document.getElementById('maintenance-input-phone');
        const emailInput = document.getElementById('maintenance-input-email');

        const payload = {
          maintenance_message: headlineInput ? headlineInput.value.trim() : '',
          maintenance_subtext: subtextInput ? subtextInput.value.trim() : '',
          contact_helpline: phoneInput ? phoneInput.value.trim() : '',
          contact_email: emailInput ? emailInput.value.trim() : ''
        };
        const res = await apiUpdateSettings(payload);
        appData.settings = res;
        updateBadges();
        renderMaintenanceView();
        alert('Maintenance content settings saved successfully!');
      } catch (err) {
        alert('Error saving settings: ' + err.message);
      } finally {
        hideScreenLoader();
      }
    });
  }
}

// Top-Level Central Confirmation & Execution Handler
function promptMaintenanceConfirmation() {
  const currentMaint = Boolean(appData.settings && appData.settings.maintenance_mode);
  const targetState = !currentMaint;

  const modal = document.getElementById('modal-confirm-maintenance');
  const title = document.getElementById('modal-confirm-maint-title');
  const question = document.getElementById('modal-confirm-maint-question');
  const desc = document.getElementById('modal-confirm-maint-desc');
  const icon = document.getElementById('modal-confirm-maint-icon');
  const actionBtn = document.getElementById('btn-modal-confirm-maint-action');

  if (targetState) {
    // Turn ON Maintenance Mode
    if (title) title.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:#f59e0b;"></i> Confirm Maintenance Mode';
    if (icon) {
      icon.style.background = 'rgba(245,158,11,0.15)';
      icon.style.color = '#f59e0b';
      icon.innerHTML = '<i class="fa-solid fa-power-off"></i>';
    }
    if (question) question.textContent = 'Are you sure you want to turn ON maintenance mode?';
    if (desc) desc.textContent = 'When enabled, all public website visitors will see the "Currently Website & Mobile App Under Development" screen with both official party banners until you turn it off.';
    if (actionBtn) {
      actionBtn.className = 'btn btn-primary';
      actionBtn.style.background = '';
      actionBtn.style.borderColor = '';
      actionBtn.innerHTML = '<i class="fa-solid fa-power-off"></i> Yes, Turn ON Maintenance Mode';
    }
  } else {
    // Turn OFF Maintenance Mode (Go Live)
    if (title) title.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#10b981;"></i> Confirm Website Go Live';
    if (icon) {
      icon.style.background = 'rgba(16,185,129,0.15)';
      icon.style.color = '#10b981';
      icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    }
    if (question) question.textContent = 'Are you sure you want to turn OFF maintenance mode and bring the website LIVE?';
    if (desc) desc.textContent = 'The full public political portal, memberships, manifesto, and all pages will become immediately accessible to all visitors.';
    if (actionBtn) {
      actionBtn.className = 'btn btn-primary';
      actionBtn.style.background = '#10b981';
      actionBtn.style.borderColor = '#10b981';
      actionBtn.innerHTML = '<i class="fa-solid fa-check"></i> Yes, Bring Website LIVE';
    }
  }

  if (modal) {
    modal.classList.add('active');
  }

  if (actionBtn) {
    actionBtn.onclick = async (e) => {
      e.preventDefault();
      if (modal) modal.classList.remove('active');

      // Show API Call Loader Overlay
      showScreenLoader(targetState ? 'Enabling Maintenance Mode on Website & Mobile App...' : 'Disabling Maintenance Mode & Bringing Website Live...');

      try {
        const headlineInput = document.getElementById('maintenance-input-headline');
        const subtextInput = document.getElementById('maintenance-input-subtext');
        const headline = headlineInput ? headlineInput.value.trim() : (appData.settings?.maintenance_message || 'Currently Website & Mobile App Under Development');
        const subtext = subtextInput ? subtextInput.value.trim() : (appData.settings?.maintenance_subtext || '');

        const res = await apiToggleMaintenance(targetState, headline, subtext);
        if (res) {
          appData.settings = res;
        } else {
          if (!appData.settings) appData.settings = {};
          appData.settings.maintenance_mode = targetState;
        }

        updateBadges();
        renderMaintenanceView();
        alert(`✅ Success: Maintenance Mode is now ${targetState ? 'ENABLED (Website shows Under Development screen)' : 'DISABLED (Website is LIVE)'}!`);
      } catch (err) {
        console.error('Error updating maintenance mode:', err);
        alert('Maintenance status updated: ' + err.message);
      } finally {
        hideScreenLoader();
        renderMaintenanceView();
      }
    };
  }
}




/* ==========================================================================
   ROLE ACCESS CONTROL (ADMIN vs EMPLOYER)
   ========================================================================== */
function applyRoleAccessControl() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('pppi_admin_user') || '{}');
  } catch (e) {}

  const isEmployer = user && user.role === 'EMPLOYER';
  const roleBadge = document.getElementById('employer-mode-badge');
  const userProfileRole = document.querySelector('.user-profile-role');

  if (isEmployer) {
    // Hide admin-only navigation links & section headers
    document.querySelectorAll('[data-role="admin"]').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    if (roleBadge) {
      roleBadge.textContent = user.company_name ? `${user.company_name} • RECRUITER` : 'EMPLOYER DESK';
    }
    if (userProfileRole) {
      userProfileRole.textContent = 'Company Recruiter';
    }

    // Automatically activate Employment view for employer
    setTimeout(() => {
      const empNav = document.querySelector('[data-view="employment"]');
      if (empNav) empNav.click();
    }, 50);
  } else {
    // Show all modules for full ADMIN
    document.querySelectorAll('[data-role="admin"]').forEach(el => {
      el.style.removeProperty('display');
    });
    if (roleBadge) {
      roleBadge.textContent = 'MASTER ADMIN';
    }
    if (userProfileRole) {
      userProfileRole.textContent = 'System Administrator';
    }
  }
}

/* ==========================================================================
   EMPLOYMENT & RECRUITMENT VIEW IMPLEMENTATION
   ========================================================================== */
let activeEmploymentTab = 'jobs';
let selectedJobFilterForApps = 'ALL';

function renderEmploymentView() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('pppi_admin_user') || '{}');
  } catch (e) {}

  const isEmployer = user && user.role === 'EMPLOYER';
  const currentEmployerId = user ? user.id : null;

  // Filter jobs by employer if logged in as Employer
  const visibleJobs = (isEmployer && currentEmployerId)
    ? appData.jobs.filter(j => String(j.employer_id) === String(currentEmployerId) || j.employer_id === 999 || j.employer_id === 1)
    : appData.jobs;

  const jobIds = visibleJobs.map(j => j.id);
  const visibleApps = isEmployer
    ? appData.applications.filter(a => jobIds.includes(a.job_id))
    : appData.applications;

  // 1. Update Metrics
  const totalVacancies = visibleJobs.length;
  const activeVacancies = visibleJobs.filter(j => (j.status || '').toUpperCase() === 'ACTIVE').length;
  const totalApps = visibleApps.length;
  const shortlistedApps = visibleApps.filter(a => (a.status || '').toUpperCase() === 'SHORTLISTED' || (a.status || '').toUpperCase() === 'HIRED').length;

  const statTotal = document.getElementById('stat-jobs-total');
  if (statTotal) statTotal.textContent = totalVacancies;
  const statActive = document.getElementById('stat-jobs-active');
  if (statActive) statActive.textContent = activeVacancies;
  const statApps = document.getElementById('stat-jobs-apps');
  if (statApps) statApps.textContent = totalApps;
  const statShortlisted = document.getElementById('stat-jobs-shortlisted');
  if (statShortlisted) statShortlisted.textContent = shortlistedApps;

  const countTabJobs = document.getElementById('count-tab-jobs');
  if (countTabJobs) countTabJobs.textContent = totalVacancies;
  const countTabApps = document.getElementById('count-tab-apps');
  if (countTabApps) countTabApps.textContent = totalApps;

  // 2. Wire Tab Switching
  const btnTabJobs = document.getElementById('tab-btn-jobs');
  const btnTabApps = document.getElementById('tab-btn-applications');
  const paneJobs = document.getElementById('tab-pane-jobs');
  const paneApps = document.getElementById('tab-pane-applications');

  if (btnTabJobs && btnTabApps) {
    btnTabJobs.onclick = () => {
      activeEmploymentTab = 'jobs';
      btnTabJobs.style.background = '#0284c7';
      btnTabJobs.style.color = '#ffffff';
      btnTabApps.style.background = '#f1f5f9';
      btnTabApps.style.color = '#475569';
      if (paneJobs) paneJobs.style.display = 'block';
      if (paneApps) paneApps.style.display = 'none';
    };

    btnTabApps.onclick = () => {
      activeEmploymentTab = 'apps';
      btnTabApps.style.background = '#0284c7';
      btnTabApps.style.color = '#ffffff';
      btnTabJobs.style.background = '#f1f5f9';
      btnTabJobs.style.color = '#475569';
      if (paneJobs) paneJobs.style.display = 'none';
      if (paneApps) paneApps.style.display = 'block';
      renderApplicationsTable();
    };
  }

  // Populate Filter Dropdown for Applications
  const filterAppsJob = document.getElementById('filter-apps-job');
  if (filterAppsJob) {
    filterAppsJob.innerHTML = '<option value="ALL">All Job Vacancies</option>' +
      visibleJobs.map(j => `<option value="${j.id}" ${String(selectedJobFilterForApps) === String(j.id) ? 'selected' : ''}>${j.title} (${j.company_name})</option>`).join('');
  }

  renderJobsTable(visibleJobs);
  renderApplicationsTable(visibleApps);
  setupJobModals();
}

function renderJobsTable(jobsList = appData.jobs) {
  const container = document.getElementById('jobs-table-container');
  if (!container) return;

  const searchInput = document.getElementById('input-search-jobs');
  const deptSelect = document.getElementById('filter-jobs-dept');
  const statusSelect = document.getElementById('filter-jobs-status');

  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const dept = deptSelect ? deptSelect.value : 'ALL';
  const status = statusSelect ? statusSelect.value : 'ALL';

  const filtered = jobsList.filter(job => {
    if (dept !== 'ALL' && !((job.department || '').toLowerCase().includes(dept.toLowerCase()))) return false;
    if (status !== 'ALL' && (job.status || 'ACTIVE').toUpperCase() !== status.toUpperCase()) return false;
    if (q) {
      const match = (job.title || '').toLowerCase().includes(q) ||
                    (job.company_name || '').toLowerCase().includes(q) ||
                    (job.location || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 48px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-briefcase" style="font-size:42px; margin-bottom:12px; color: #cbd5e1;"></i>
        <h3 style="font-size:16px; font-weight:700; color:var(--text-primary); margin-bottom:6px;">No Job Vacancies Found</h3>
        <p style="font-size:13px; margin:0;">Click "Post New Vacancy" above to publish your company's hiring requirements.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Job Title &amp; Company</th>
          <th>Department &amp; Type</th>
          <th>Location</th>
          <th>Salary Range</th>
          <th>Vacancies</th>
          <th>Status</th>
          <th>Applications</th>
          <th style="text-align:right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(job => {
          const isActive = (job.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
          const appsCount = appData.applications.filter(a => String(a.job_id) === String(job.id)).length;
          return `
            <tr>
              <td>
                <div style="font-weight: 800; color: var(--text-primary); font-size: 13.5px;">${job.title}</div>
                <div style="font-size: 12px; color: #0284c7; font-weight: 600;"><i class="fa-solid fa-building"></i> ${job.company_name}</div>
              </td>
              <td>
                <div style="font-size: 12.5px; font-weight: 600; color: #334155;">${job.department || 'General'}</div>
                <span class="badge" style="background:#f1f5f9; color:#475569; font-size:11px;">${job.job_type || 'Full-time'} • ${job.workplace_type || 'On-site'}</span>
              </td>
              <td>
                <div style="font-size: 12.5px; color: #475569;"><i class="fa-solid fa-location-dot" style="color:#ef4444;"></i> ${job.location}</div>
              </td>
              <td>
                <strong style="color: #059669; font-size: 12.5px;">${job.salary_range}</strong>
              </td>
              <td>
                <span class="badge" style="background: #eff6ff; color: #1d4ed8; font-weight:800;">${job.vacancies_count || 1} Openings</span>
              </td>
              <td>
                <span class="badge" style="background: ${isActive ? '#ecfdf5' : '#fee2e2'}; color: ${isActive ? '#065f46' : '#991b1b'}; font-weight:800;">
                  ${isActive ? 'ACTIVE' : 'CLOSED'}
                </span>
              </td>
              <td>
                <button type="button" class="btn btn-sm btn-outline btn-filter-job-apps" data-job-id="${job.id}" style="font-size: 11px; padding: 4px 8px;">
                  <i class="fa-solid fa-user-group"></i> ${appsCount} Applied
                </button>
              </td>
              <td style="text-align:right;">
                <div style="display:inline-flex; gap:6px;">
                  <button type="button" class="btn btn-sm btn-outline btn-edit-job" data-job-id="${job.id}" title="Edit Vacancy" style="padding: 4px 8px; font-size: 11.5px;">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline btn-toggle-job-status" data-job-id="${job.id}" data-current-status="${job.status || 'ACTIVE'}" title="Toggle Active/Closed" style="padding: 4px 8px; font-size: 11.5px; color: #d97706;">
                    <i class="fa-solid fa-power-off"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline btn-delete-job" data-job-id="${job.id}" title="Delete Vacancy" style="padding: 4px 8px; font-size: 11.5px; color: #dc2626;">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  // Bind Actions in Jobs Table
  container.querySelectorAll('.btn-filter-job-apps').forEach(btn => {
    btn.onclick = () => {
      selectedJobFilterForApps = btn.getAttribute('data-job-id');
      const btnTabApps = document.getElementById('tab-btn-applications');
      if (btnTabApps) btnTabApps.click();
    };
  });

  container.querySelectorAll('.btn-edit-job').forEach(btn => {
    btn.onclick = () => {
      const jobId = btn.getAttribute('data-job-id');
      const job = appData.jobs.find(j => String(j.id) === String(jobId));
      if (job) openJobEditorModal(job);
    };
  });

  container.querySelectorAll('.btn-toggle-job-status').forEach(btn => {
    btn.onclick = async () => {
      const jobId = btn.getAttribute('data-job-id');
      const current = (btn.getAttribute('data-current-status') || 'ACTIVE').toUpperCase();
      const newStatus = current === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
      try {
        await apiUpdateJob(jobId, { status: newStatus });
        appData.jobs = await apiGetJobs();
        updateBadges();
        renderEmploymentView();
      } catch (err) {
        alert('Failed to update job status: ' + err.message);
      }
    };
  });

  container.querySelectorAll('.btn-delete-job').forEach(btn => {
    btn.onclick = async () => {
      const jobId = btn.getAttribute('data-job-id');
      if (confirm('Are you sure you want to permanently delete this job vacancy and all associated applications?')) {
        try {
          await apiDeleteJob(jobId);
          appData.jobs = await apiGetJobs();
          appData.applications = await apiGetJobApplications();
          updateBadges();
          renderEmploymentView();
        } catch (err) {
          alert('Failed to delete job: ' + err.message);
        }
      }
    };
  });

  // Bind Filters
  if (searchInput) searchInput.oninput = () => renderJobsTable(jobsList);
  if (deptSelect) deptSelect.onchange = () => renderJobsTable(jobsList);
  if (statusSelect) statusSelect.onchange = () => renderJobsTable(jobsList);
}

function renderApplicationsTable(appsList = appData.applications) {
  const container = document.getElementById('applications-table-container');
  if (!container) return;

  const searchInput = document.getElementById('input-search-apps');
  const jobFilterSelect = document.getElementById('filter-apps-job');
  const statusFilterSelect = document.getElementById('filter-apps-status');

  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const selectedJobId = jobFilterSelect ? jobFilterSelect.value : 'ALL';
  const selectedStatus = statusFilterSelect ? statusFilterSelect.value : 'ALL';

  const filtered = appsList.filter(app => {
    if (selectedJobId !== 'ALL' && String(app.job_id) !== String(selectedJobId)) return false;
    if (selectedStatus !== 'ALL' && (app.status || 'SUBMITTED').toUpperCase() !== selectedStatus.toUpperCase()) return false;
    if (q) {
      const match = (app.candidate_name || '').toLowerCase().includes(q) ||
                    (app.candidate_phone || '').toLowerCase().includes(q) ||
                    (app.candidate_email || '').toLowerCase().includes(q) ||
                    (app.qualification || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 48px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-user-tie" style="font-size:42px; margin-bottom:12px; color: #cbd5e1;"></i>
        <h3 style="font-size:16px; font-weight:700; color:var(--text-primary); margin-bottom:6px;">No Candidate Applications Found</h3>
        <p style="font-size:13px; margin:0;">Applications submitted by job seekers on the website will be listed here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Candidate Particulars</th>
          <th>Applied Job Position</th>
          <th>Qualification &amp; Exp</th>
          <th>Location &amp; CTC</th>
          <th>Resume Attachment</th>
          <th>Application Status</th>
          <th style="text-align:right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(app => {
          const parentJob = app.job || appData.jobs.find(j => String(j.id) === String(app.job_id)) || { title: 'General Application', company_name: 'PPPI' };
          const statusColors = {
            SUBMITTED: { bg: '#e0f2fe', text: '#0369a1' },
            REVIEWING: { bg: '#fef3c7', text: '#b45309' },
            SHORTLISTED: { bg: '#dcfce7', text: '#15803d' },
            INTERVIEW_SCHEDULED: { bg: '#ede9fe', text: '#6d28d9' },
            HIRED: { bg: '#d1fae5', text: '#065f46' },
            REJECTED: { bg: '#fee2e2', text: '#b91c1c' }
          };
          const color = statusColors[app.status] || statusColors.SUBMITTED;

          return `
            <tr>
              <td>
                <div style="font-weight: 800; color: var(--text-primary); font-size: 13.5px;">${app.candidate_name}</div>
                <div style="font-size: 11.5px; color: #64748b;"><i class="fa-solid fa-phone"></i> ${app.candidate_phone}</div>
                <div style="font-size: 11.5px; color: #64748b;"><i class="fa-solid fa-envelope"></i> ${app.candidate_email}</div>
              </td>
              <td>
                <div style="font-weight: 700; color: #0284c7; font-size: 13px;">${parentJob.title}</div>
                <div style="font-size: 11.5px; color: #475569;">${parentJob.company_name}</div>
              </td>
              <td>
                <div style="font-size: 12.5px; font-weight: 600; color: #1e293b;">${app.qualification}</div>
                <div style="font-size: 11.5px; color: #64748b;">Exp: ${app.experience_years || 'Fresher'}</div>
              </td>
              <td>
                <div style="font-size: 12px; color: #334155;">${app.current_location}</div>
                <div style="font-size: 11.5px; color: #059669; font-weight:700;">Exp: ${app.expected_salary || 'As per norms'}</div>
              </td>
              <td>
                ${app.resume_url ? `
                  <a href="${app.resume_url}" target="_blank" download="Resume_${app.candidate_name.replace(/\s+/g, '_')}" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 4px 8px; color: #0284c7;">
                    <i class="fa-solid fa-file-pdf"></i> Download Resume
                  </a>
                ` : `<span style="color:#94a3b8; font-size:11px;">Not Uploaded</span>`}
              </td>
              <td>
                <select class="form-select select-app-status" data-app-id="${app.id}" style="font-size: 11.5px; font-weight:700; padding: 4px 8px; background: ${color.bg}; color: ${color.text}; border: 1px solid ${color.text}40;">
                  <option value="SUBMITTED" ${app.status === 'SUBMITTED' ? 'selected' : ''}>SUBMITTED</option>
                  <option value="REVIEWING" ${app.status === 'REVIEWING' ? 'selected' : ''}>REVIEWING</option>
                  <option value="SHORTLISTED" ${app.status === 'SHORTLISTED' ? 'selected' : ''}>SHORTLISTED</option>
                  <option value="INTERVIEW_SCHEDULED" ${app.status === 'INTERVIEW_SCHEDULED' ? 'selected' : ''}>INTERVIEW SCHEDULED</option>
                  <option value="HIRED" ${app.status === 'HIRED' ? 'selected' : ''}>HIRED</option>
                  <option value="REJECTED" ${app.status === 'REJECTED' ? 'selected' : ''}>REJECTED</option>
                </select>
              </td>
              <td style="text-align:right;">
                <button type="button" class="btn btn-sm btn-primary btn-inspect-applicant" data-app-id="${app.id}" style="font-size: 11.5px; padding: 5px 10px; background: #0284c7; border-color:#0284c7;">
                  <i class="fa-solid fa-eye"></i> Review Dossier
                </button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  // Bind Status Dropdown changes
  container.querySelectorAll('.select-app-status').forEach(sel => {
    sel.onchange = async () => {
      const appId = sel.getAttribute('data-app-id');
      const newStatus = sel.value;
      try {
        await apiUpdateJobApplication(appId, { status: newStatus });
        appData.applications = await apiGetJobApplications();
        renderEmploymentView();
      } catch (err) {
        alert('Failed to update status: ' + err.message);
      }
    };
  });

  // Bind Inspect Dossier modal
  container.querySelectorAll('.btn-inspect-applicant').forEach(btn => {
    btn.onclick = () => {
      const appId = btn.getAttribute('data-app-id');
      const app = appData.applications.find(a => String(a.id) === String(appId));
      if (app) openApplicantDossierModal(app);
    };
  });

  // Bind Filters
  if (searchInput) searchInput.oninput = () => renderApplicationsTable(appsList);
  if (jobFilterSelect) {
    jobFilterSelect.onchange = () => {
      selectedJobFilterForApps = jobFilterSelect.value;
      renderApplicationsTable(appsList);
    };
  }
  if (statusFilterSelect) statusFilterSelect.onchange = () => renderApplicationsTable(appsList);
}

function openJobEditorModal(job = null) {
  const modal = document.getElementById('modal-job-editor');
  if (!modal) return;

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('pppi_admin_user') || '{}');
  } catch (e) {}

  const defaultCompany = user ? (user.company_name || user.name || 'Pasha GreenTech Solutions') : 'Pasha GreenTech Solutions';

  document.getElementById('job-input-id').value = job ? job.id : '';
  document.getElementById('job-modal-title').innerHTML = job
    ? '<i class="fa-solid fa-pen-to-square" style="color:#0284c7;"></i> Edit Job Vacancy'
    : '<i class="fa-solid fa-briefcase" style="color:#0284c7;"></i> Post New Job Vacancy';

  document.getElementById('job-input-title').value = job ? job.title : '';
  document.getElementById('job-input-company').value = job ? job.company_name : defaultCompany;
  document.getElementById('job-input-dept').value = job ? (job.department || '') : 'Engineering';
  document.getElementById('job-input-type').value = job ? (job.job_type || 'Full-time') : 'Full-time';
  document.getElementById('job-input-workplace').value = job ? (job.workplace_type || 'On-site') : 'On-site';
  document.getElementById('job-input-location').value = job ? job.location : 'Dalasanur / Kolar, Karnataka';
  document.getElementById('job-input-district').value = job ? (job.district || 'Kolar') : 'Kolar';
  document.getElementById('job-input-salary').value = job ? job.salary_range : '₹25,000 - ₹35,000 / month';
  document.getElementById('job-input-vacancies').value = job ? (job.vacancies_count || 1) : 2;
  document.getElementById('job-input-experience').value = job ? (job.experience_level || '') : 'Freshers / 0-2 Years';
  document.getElementById('job-input-qualification').value = job ? job.education_qualification : 'ITI Electrical / Diploma / Any Degree';
  document.getElementById('job-input-description').value = job ? job.description : '';
  document.getElementById('job-input-responsibilities').value = job ? (job.responsibilities || '') : '';
  document.getElementById('job-input-requirements').value = job ? (job.requirements || '') : '';
  document.getElementById('job-input-email').value = job ? (job.contact_email || '') : (user ? user.email : '');
  document.getElementById('job-input-phone').value = job ? (job.contact_phone || '') : (user ? user.phone : '');
  document.getElementById('job-input-status').value = job ? (job.status || 'ACTIVE') : 'ACTIVE';

  modal.classList.add('active');
}

function openApplicantDossierModal(app) {
  const modal = document.getElementById('modal-applicant-dossier');
  const body = document.getElementById('applicant-dossier-body');
  if (!modal || !body) return;

  const parentJob = app.job || appData.jobs.find(j => String(j.id) === String(app.job_id)) || { title: 'General Vacancy', company_name: 'PPPI' };

  body.innerHTML = `
    <div style="margin-bottom: 20px;">
      <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div>
            <h3 style="margin:0 0 4px 0; font-size:18px; font-weight:800; color:#0f172a;">${app.candidate_name}</h3>
            <span style="font-size:13px; color:#0284c7; font-weight:700;">Candidate Application for: ${parentJob.title}</span>
          </div>
          <span class="badge" style="background: #0284c7; color: white; padding: 6px 12px; font-weight:800; font-size:12px;">
            ID #APP-${app.id}
          </span>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:13px; color:#334155;">
          <div><strong>Mobile Phone:</strong> <a href="tel:${app.candidate_phone}" style="color:#0284c7; font-weight:700;">${app.candidate_phone}</a></div>
          <div><strong>Email Address:</strong> <a href="mailto:${app.candidate_email}" style="color:#0284c7; font-weight:700;">${app.candidate_email}</a></div>
          <div><strong>Qualification:</strong> ${app.qualification}</div>
          <div><strong>Experience:</strong> ${app.experience_years || 'Fresher'}</div>
          <div><strong>Current Location:</strong> ${app.current_location}</div>
          <div><strong>Expected Salary:</strong> ${app.expected_salary || 'Negotiable'}</div>
          <div><strong>Applied On:</strong> ${new Date(app.created_at || Date.now()).toLocaleString('en-IN')}</div>
        </div>
      </div>

      ${app.cover_note ? `
        <div style="background:#fffbeb; border-left:4px solid #f59e0b; padding:12px 16px; border-radius:0 8px 8px 0; font-size:13px; color:#92400e; margin-bottom:16px;">
          <strong>Candidate Cover Note:</strong><br/>
          ${app.cover_note}
        </div>
      ` : ''}

      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:18px; display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:12px;">
          <i class="fa-solid fa-file-pdf" style="font-size:32px; color:#ef4444;"></i>
          <div>
            <h4 style="margin:0 0 2px 0; font-size:14px; font-weight:800; color:#0f172a;">Candidate Resume / Curriculum Vitae</h4>
            <span style="font-size:12px; color:#64748b;">PDF / Word Document attached by candidate</span>
          </div>
        </div>
        ${app.resume_url ? `
          <a href="${app.resume_url}" target="_blank" download class="btn btn-sm btn-primary" style="background:#0284c7; border-color:#0284c7; font-weight:700;">
            <i class="fa-solid fa-download"></i> Download Resume
          </a>
        ` : `<span style="color:#94a3b8; font-size:12px;">No document attached</span>`}
      </div>

      <!-- STATUS & RECRUITER NOTES -->
      <div style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:10px; padding:18px;">
        <h4 style="margin:0 0 12px 0; font-size:14px; font-weight:800; color:#166534;">
          <i class="fa-solid fa-sliders"></i> Recruiter Action &amp; Application Status
        </h4>

        <div style="display:flex; gap:12px; margin-bottom:12px;">
          <div style="flex:1;">
            <label style="display:block; font-size:12px; font-weight:700; color:#166534; margin-bottom:4px;">Application Status</label>
            <select id="modal-app-status-select" class="form-select" style="width:100%; font-weight:700;">
              <option value="SUBMITTED" ${app.status === 'SUBMITTED' ? 'selected' : ''}>SUBMITTED</option>
              <option value="REVIEWING" ${app.status === 'REVIEWING' ? 'selected' : ''}>REVIEWING</option>
              <option value="SHORTLISTED" ${app.status === 'SHORTLISTED' ? 'selected' : ''}>SHORTLISTED</option>
              <option value="INTERVIEW_SCHEDULED" ${app.status === 'INTERVIEW_SCHEDULED' ? 'selected' : ''}>INTERVIEW SCHEDULED</option>
              <option value="HIRED" ${app.status === 'HIRED' ? 'selected' : ''}>HIRED</option>
              <option value="REJECTED" ${app.status === 'REJECTED' ? 'selected' : ''}>REJECTED</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:12px; font-weight:700; color:#166534; margin-bottom:4px;">Internal Recruiter Notes / Interview Feedback</label>
          <textarea id="modal-app-notes-textarea" class="form-control" rows="3" placeholder="Document interview date, technical ratings, or joining details...">${app.employer_notes || ''}</textarea>
        </div>

        <div style="text-align:right;">
          <button type="button" class="btn btn-sm btn-primary" id="btn-save-applicant-action" style="background:#166534; border-color:#166534; font-weight:700; padding:8px 18px;">
            <i class="fa-solid fa-check"></i> Save Application Updates
          </button>
        </div>
      </div>
    </div>
  `;

  // Bind save action
  const saveBtn = document.getElementById('btn-save-applicant-action');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const newStatus = document.getElementById('modal-app-status-select').value;
      const newNotes = document.getElementById('modal-app-notes-textarea').value;
      try {
        await apiUpdateJobApplication(app.id, {
          status: newStatus,
          employer_notes: newNotes
        });
        alert('Application status & notes updated successfully!');
        appData.applications = await apiGetJobApplications();
        renderEmploymentView();
        modal.classList.remove('active');
      } catch (err) {
        alert('Error saving updates: ' + err.message);
      }
    };
  }

  modal.classList.add('active');
}

function setupJobModals() {
  const openCreateBtn = document.getElementById('btn-open-create-job-modal');
  if (openCreateBtn) {
    openCreateBtn.onclick = () => openJobEditorModal(null);
  }

  const jobForm = document.getElementById('form-job-editor');
  if (jobForm) {
    jobForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('job-input-id').value;
      let user = null;
      try {
        user = JSON.parse(localStorage.getItem('pppi_admin_user') || '{}');
      } catch (e) {}

      const payload = {
        employer_id: user ? user.id : 1,
        title: document.getElementById('job-input-title').value.trim(),
        company_name: document.getElementById('job-input-company').value.trim(),
        department: document.getElementById('job-input-dept').value.trim(),
        job_type: document.getElementById('job-input-type').value,
        workplace_type: document.getElementById('job-input-workplace').value,
        location: document.getElementById('job-input-location').value.trim(),
        district: document.getElementById('job-input-district').value.trim(),
        salary_range: document.getElementById('job-input-salary').value.trim(),
        vacancies_count: parseInt(document.getElementById('job-input-vacancies').value || '1', 10),
        experience_level: document.getElementById('job-input-experience').value.trim(),
        education_qualification: document.getElementById('job-input-qualification').value.trim(),
        description: document.getElementById('job-input-description').value.trim(),
        responsibilities: document.getElementById('job-input-responsibilities').value.trim(),
        requirements: document.getElementById('job-input-requirements').value.trim(),
        contact_email: document.getElementById('job-input-email').value.trim(),
        contact_phone: document.getElementById('job-input-phone').value.trim(),
        status: document.getElementById('job-input-status').value
      };

      try {
        if (id) {
          await apiUpdateJob(id, payload);
          alert('Job vacancy updated successfully!');
        } else {
          await apiCreateJob(payload);
          alert('Job vacancy posted successfully! It is now visible on the website Employment portal.');
        }
        appData.jobs = await apiGetJobs();
        updateBadges();
        renderEmploymentView();
        const modal = document.getElementById('modal-job-editor');
        if (modal) modal.classList.remove('active');
      } catch (err) {
        alert('Failed to save job: ' + err.message);
      }
    };
  }
}


/* ==========================================================================
   AGRICULTURE & FARMERS Q&A COMMUNITY FORUM MANAGEMENT (ADMIN ONLY)
   ========================================================================== */
function renderAgricultureView() {
  const container = document.getElementById('agri-admin-feed-container');
  if (!container) return;

  const questions = appData.agriQuestions || [];

  // Update KPI counters
  let totalAnswers = 0;
  let totalLikes = 0;
  const categoriesSet = new Set();

  questions.forEach(q => {
    if (q.category) categoriesSet.add(q.category);
    if (q.answers && Array.isArray(q.answers)) {
      totalAnswers += q.answers.length;
      q.answers.forEach(a => {
        totalLikes += (a.likes_count || 0);
      });
    }
  });

  const statQ = document.getElementById('stat-agri-questions-total');
  const statA = document.getElementById('stat-agri-answers-total');
  const statC = document.getElementById('stat-agri-categories-total');
  const statL = document.getElementById('stat-agri-likes-total');

  if (statQ) statQ.textContent = questions.length;
  if (statA) statA.textContent = totalAnswers;
  if (statC) statC.textContent = categoriesSet.size || 6;
  if (statL) statL.textContent = totalLikes;

  // Filter and search
  const catFilter = document.getElementById('agri-admin-filter-category')?.value || 'ALL';
  const searchVal = (document.getElementById('agri-admin-search')?.value || '').trim().toLowerCase();

  let filtered = questions.filter(q => q.status === 'ACTIVE' || !q.status);
  if (catFilter !== 'ALL') {
    filtered = filtered.filter(q => (q.category || '').toLowerCase() === catFilter.toLowerCase());
  }
  if (searchVal) {
    filtered = filtered.filter(q =>
      (q.question && q.question.toLowerCase().includes(searchVal)) ||
      (q.description && q.description.toLowerCase().includes(searchVal)) ||
      (q.user_name && q.user_name.toLowerCase().includes(searchVal)) ||
      (q.user_mobile && q.user_mobile.includes(searchVal))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-seedling" style="font-size: 36px; color: #16a34a; margin-bottom: 12px; display:block;"></i>
        <h4 style="font-size:16px; font-weight:700; color:var(--text-primary); margin-bottom:4px;">No Questions Found</h4>
        <p style="font-size:13px;">No agricultural discussions match your search or category filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      ${filtered.map(q => {
        const answers = (q.answers || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return `
          <div class="card" style="border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; background: var(--bg-card); box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <!-- Question Header Row -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 12px; flex-wrap:wrap; gap:10px;">
              <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
                <span class="pill-tag" style="background:#dcfce7; color:#15803d; font-size:11px; font-weight:800; padding:4px 10px; border-radius:20px;">
                  <i class="fa-solid fa-tag"></i> ${escapeHtml(q.category || 'Farming')}
                </span>
                <span style="font-size:13px; font-weight:800; color:var(--text-primary);">
                  <i class="fa-solid fa-user-circle"></i> ${escapeHtml(q.user_name || 'Farmer')}
                </span>
                <span style="font-size:12px; color:var(--text-muted); background:var(--bg-body, #f1f5f9); padding:2px 8px; border-radius:6px;">
                  <i class="fa-solid fa-phone"></i> ${escapeHtml(q.user_mobile || 'N/A')}
                </span>
                <span style="font-size:11.5px; color:var(--text-muted); margin-left:6px;">
                  <i class="fa-regular fa-clock"></i> ${q.created_at ? new Date(q.created_at).toLocaleDateString('en-IN') : 'Recent'}
                </span>
              </div>
              <div>
                <button type="button" class="btn btn-sm btn-outline-danger btn-delete-agri-q" data-qid="${q.id}" style="color:#ef4444; border-color:#fca5a5; font-size:12px; font-weight:700; padding:5px 12px;">
                  <i class="fa-solid fa-trash"></i> Delete Question
                </button>
              </div>
            </div>

            <!-- Question Title & Description -->
            <h4 style="font-size:16px; font-weight:800; color:var(--text-primary); margin-bottom:8px; line-height:1.4;">
              ${escapeHtml(q.question)}
            </h4>
            ${q.description ? `
              <p style="font-size:13.5px; color:var(--text-muted); line-height:1.6; margin-bottom:14px;">
                ${escapeHtml(q.description)}
              </p>
            ` : ''}

            <!-- Answers Sub-Thread -->
            <div style="background:var(--bg-body, #f8fafc); border:1px dashed var(--border-color); border-radius:10px; padding:14px; margin-top:12px;">
              <div style="font-size:13px; font-weight:800; color:var(--text-primary); margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                <span><i class="fa-solid fa-comments" style="color:#0284c7;"></i> Community Answers (${answers.length})</span>
                <span style="font-size:11.5px; color:#15803d; font-weight:700;">Recent answers at top</span>
              </div>

              ${answers.length === 0 ? `
                <div style="font-size:12.5px; color:var(--text-muted); font-style:italic; padding:6px 0;">
                  No answers submitted yet for this question.
                </div>
              ` : `
                <div style="display:flex; flex-direction:column; gap:12px;">
                  ${answers.map((ans, aIdx) => `
                    <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:12px 14px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
                      <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
                          <strong style="font-size:13.5px; color:var(--text-primary);">${escapeHtml(ans.author_name || 'Contributor')}</strong>
                          <span style="font-size:11.5px; color:#0284c7; background:#e0f2fe; padding:2px 8px; border-radius:6px; font-weight:700;">
                            <i class="fa-solid fa-certificate"></i> ${escapeHtml(ans.author_profession || 'Agricultural Specialist')}
                          </span>
                          <span style="font-size:11px; color:var(--text-muted);">
                            ${ans.created_at ? new Date(ans.created_at).toLocaleString('en-IN') : ''}
                          </span>
                        </div>

                        <div style="font-size:13px; color:var(--text-primary); line-height:1.55; margin-bottom:8px;">
                          ${escapeHtml(ans.answer_text)}
                        </div>

                        ${ans.media_url ? `
                          <div style="margin:8px 0; font-size:12px;">
                            ${ans.media_type === 'VIDEO' ? `
                              <a href="${escapeHtml(ans.media_url)}" target="_blank" style="display:inline-flex; align-items:center; gap:6px; color:#0284c7; font-weight:700; background:#f0f9ff; padding:4px 10px; border-radius:6px; text-decoration:none; border:1px solid #bae6fd;">
                                <i class="fa-solid fa-video"></i> Open Video Demonstration
                              </a>
                            ` : `
                              <a href="${escapeHtml(ans.media_url)}" target="_blank" style="display:inline-flex; align-items:center; gap:6px; color:#15803d; font-weight:700; background:#f0fdf4; padding:4px 10px; border-radius:6px; text-decoration:none; border:1px solid #bbf7d0;">
                                <i class="fa-solid fa-image"></i> View Demonstration Photo
                              </a>
                            `}
                          </div>
                        ` : ''}

                        <div style="font-size:12px; color:var(--text-muted); display:flex; gap:16px; align-items:center;">
                          <span><i class="fa-solid fa-thumbs-up" style="color:#16a34a;"></i> <strong>${ans.likes_count || 0}</strong> Helpful Likes</span>
                          <span><i class="fa-solid fa-thumbs-down" style="color:#ef4444;"></i> <strong>${ans.dislikes_count || 0}</strong> Dislikes</span>
                        </div>
                      </div>

                      <div>
                        <button type="button" class="btn btn-sm btn-outline-danger btn-delete-agri-ans" data-ansid="${ans.id}" title="Remove this answer" style="color:#ef4444; border-color:#fca5a5; font-size:11.5px; padding:4px 10px; font-weight:700;">
                          <i class="fa-solid fa-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Bind Delete Question Buttons
  container.querySelectorAll('.btn-delete-agri-q').forEach(btn => {
    btn.onclick = async () => {
      const qid = parseInt(btn.getAttribute('data-qid'), 10);
      if (!qid) return;
      const ok = confirm(`Are you sure you want to permanently delete Question #${qid} and all associated answers?`);
      if (!ok) return;

      try {
        await apiDeleteAgriQuestion(qid);
        alert('Question and associated answers have been removed by administrator.');
        appData.agriQuestions = await apiGetAgriQuestions();
    try {
      appData.legalCases = await apiGetLegalCases();
    try {
      appData.marriageApplications = await apiGetMarriageApplications();
    appData.emergencyAlerts = await apiGetEmergencyAlerts();
    } catch(e) {
      console.warn('apiGetMarriageApplications fallback notice:', e);
    }
    } catch(e) {
      console.warn('apiGetLegalCases fallback notice:', e);
    }
        updateBadges();
        renderAgricultureView();
    renderLawView();
    renderMarriagesView();
      } catch (err) {
        alert('Failed to delete question: ' + err.message);
      }
    };
  });

  // Bind Delete Answer Buttons
  container.querySelectorAll('.btn-delete-agri-ans').forEach(btn => {
    btn.onclick = async () => {
      const ansId = parseInt(btn.getAttribute('data-ansid'), 10);
      if (!ansId) return;
      const ok = confirm('Are you sure you want to permanently delete this answer?');
      if (!ok) return;

      try {
        await apiDeleteAgriAnswer(ansId);
        alert('Answer removed by administrator.');
        appData.agriQuestions = await apiGetAgriQuestions();
        updateBadges();
        renderAgricultureView();
      } catch (err) {
        alert('Failed to delete answer: ' + err.message);
      }
    };
  });
}

function setupAgricultureAdminListeners() {
  const refreshBtn = document.getElementById('btn-refresh-agriculture');
  if (refreshBtn) {
    refreshBtn.onclick = async () => {
      showTopLoader();
      try {
        appData.agriQuestions = await apiGetAgriQuestions();
        updateBadges();
        renderAgricultureView();
        alert('Agriculture & Farmers forum discussions refreshed!');
      } finally {
        hideTopLoader();
      }
    };
  }

  const catSelect = document.getElementById('agri-admin-filter-category');
  if (catSelect) {
    catSelect.onchange = () => renderAgricultureView();
  }

  const searchInp = document.getElementById('agri-admin-search');
  if (searchInp) {
    searchInp.oninput = () => renderAgricultureView();
  }
}


/* ==========================================================================
   LAW & JUDICIARY (PENDING COURT CASES REDRESSAL) MANAGEMENT - ADMIN ONLY
   ========================================================================== */
function renderLawView() {
  const tbody = document.getElementById('tbody-law-cases');
  if (!tbody) return;

  const cases = appData.legalCases || [];

  // Update KPI counters
  let totalCases = cases.length;
  let severeDelays = 0;
  let assignedCount = 0;
  let inMediationCount = 0;

  cases.forEach(c => {
    const h = String(c.hearings_count || '');
    if (h.includes('25') || h.includes('28') || h.includes('30') || h.includes('42') || h.includes('50')) {
      severeDelays++;
    }
    if (c.status === 'ADVOCATE_ASSIGNED' || c.assigned_advocate) {
      assignedCount++;
    }
    if (c.status === 'IN_MEDIATION' || (c.legal_aid_required && c.legal_aid_required.includes('Lok Adalat'))) {
      inMediationCount++;
    }
  });

  const kpiTotal = document.getElementById('kpi-law-total');
  if (kpiTotal) kpiTotal.textContent = totalCases;
  const kpiStalled = document.getElementById('kpi-law-stalled');
  if (kpiStalled) kpiStalled.textContent = severeDelays;
  const kpiAssigned = document.getElementById('kpi-law-assigned');
  if (kpiAssigned) kpiAssigned.textContent = assignedCount;
  const kpiMediation = document.getElementById('kpi-law-mediation');
  if (kpiMediation) kpiMediation.textContent = inMediationCount;

  // Filter logic
  const searchVal = (document.getElementById('law-filter-search')?.value || '').toLowerCase().trim();
  const tierVal = document.getElementById('law-filter-tier')?.value || 'ALL';
  const statusVal = document.getElementById('law-filter-status')?.value || 'ALL';

  const filtered = cases.filter(c => {
    if (tierVal !== 'ALL' && !String(c.court_tier || '').includes(tierVal)) return false;
    if (statusVal !== 'ALL' && c.status !== statusVal) return false;
    if (searchVal) {
      const q = searchVal;
      const match = (c.litigant_name && c.litigant_name.toLowerCase().includes(q)) ||
                    (c.case_ref_no && c.case_ref_no.toLowerCase().includes(q)) ||
                    (c.court_name && c.court_name.toLowerCase().includes(q)) ||
                    (c.case_number && c.case_number.toLowerCase().includes(q)) ||
                    (c.phone && c.phone.includes(q)) ||
                    (c.district && c.district.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px 16px; color: #64748b;">
          <i class="fa-solid fa-scale-unbalanced" style="font-size: 28px; margin-bottom: 8px; display: block; color: #cbd5e1;"></i>
          No pending court cases matching your search filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const isSevere = String(c.hearings_count || '').includes('25') || String(c.hearings_count || '').includes('42') || String(c.hearings_count || '').includes('50');
    return `
      <tr>
        <td>
          <div style="font-family: monospace; font-size: 11.5px; font-weight: 800; color: #1e3a5f;">${escapeHtml(c.case_ref_no || '')}</div>
          <strong style="color: #0f172a; font-size: 13.5px;">${escapeHtml(c.litigant_name || 'Anonymous')}</strong>
          <div style="font-size: 11px; color: #64748b;">${escapeHtml(c.litigant_role || 'Petitioner')}</div>
        </td>
        <td>
          <div><i class="fa-solid fa-phone" style="font-size: 10px; color: #16a34a; margin-right: 4px;"></i>${escapeHtml(c.phone || 'N/A')}</div>
          <div style="font-size: 11px; color: #64748b;"><i class="fa-solid fa-location-dot" style="font-size: 10px; margin-right: 3px;"></i>${escapeHtml(c.district || 'Kolar')}, ${escapeHtml(c.state || 'Karnataka')}</div>
        </td>
        <td>
          <strong style="font-size: 12.5px; color: #1e293b;">${escapeHtml(c.case_number || 'N/A')}</strong>
          <div style="font-size: 11px; color: #0284c7; font-weight: 600;">${escapeHtml(c.case_type || 'Civil Suit')}</div>
          <div style="font-size: 10.5px; color: #64748b; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHtml(c.court_name || '')}
          </div>
        </td>
        <td>
          <span style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 800; ${isSevere ? 'background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5;' : 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;'}">
            ${isSevere ? '<i class="fa-solid fa-triangle-exclamation" style="font-size: 10px; margin-right: 3px;"></i>' : ''}${escapeHtml(c.hearings_count || '10+ Hearings')}
          </span>
        </td>
        <td>
          <div style="margin-bottom: 4px;">
            <span class="badge ${c.status === 'ADVOCATE_ASSIGNED' ? 'badge-primary' : c.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}">
              ${(c.status || 'PENDING_REVIEW').replace(/_/g, ' ')}
            </span>
          </div>
          <small style="color: #64748b; font-size: 10.5px; display: block; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHtml(c.case_stage || '')}
          </small>
        </td>
        <td>
          ${c.assigned_advocate ? `
            <div style="font-weight: 700; color: #1d4ed8; font-size: 12px;">
              <i class="fa-solid fa-user-tie" style="margin-right: 4px;"></i>${escapeHtml(c.assigned_advocate)}
            </div>
          ` : `
            <span style="font-size: 11px; color: #94a3b8; font-style: italic;">Awaiting Assignment</span>
          `}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn btn-sm btn-outline-primary btn-view-law-dossier" data-id="${c.id}" title="Review Case Dossier" style="margin-right: 4px;">
            <i class="fa-solid fa-eye"></i> View
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger btn-delete-law-case" data-id="${c.id}" title="Delete Case">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Bind View Dossier buttons
  document.querySelectorAll('.btn-view-law-dossier').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const item = cases.find(x => String(x.id) === String(id));
      if (item) openLawDossierModal(item);
    };
  });

  // Bind Delete buttons
  document.querySelectorAll('.btn-delete-law-case').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Are you sure you want to remove this confidential legal case from the registry?')) return;
      try {
        await apiDeleteLegalCase(id);
        alert('Legal case dossier successfully removed.');
        appData.legalCases = await apiGetLegalCases();
        updateBadges();
        renderLawView();
      } catch (err) {
        alert('Failed to delete legal case: ' + err.message);
      }
    };
  });
}

function openLawDossierModal(item) {
  let modal = document.getElementById('modal-law-dossier');
  if (!modal) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'modal-law-dossier';
    modalDiv.className = 'modal';
    modalDiv.style.display = 'none';
    modalDiv.innerHTML = `
      <div class="modal-dialog" style="max-width: 780px;">
        <div class="modal-content" style="border-radius: 12px; overflow: hidden;">
          <div class="modal-header" style="background: #1e3a5f; color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
            <h3 class="modal-title" style="margin: 0; font-size: 16px;"><i class="fa-solid fa-scale-balanced" style="margin-right: 8px;"></i>Confidential Judicial Dossier Review</h3>
            <button type="button" id="btn-close-law-dossier-x" style="color: white; background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body" id="law-modal-body" style="padding: 20px; max-height: 75vh; overflow-y: auto;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modalDiv);
    modal = modalDiv;

    document.getElementById('btn-close-law-dossier-x').onclick = () => {
      modal.style.display = 'none';
    };
  }

  const body = document.getElementById('law-modal-body');
  if (!body) return;

  body.innerHTML = `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <span style="font-family: monospace; font-size: 15px; font-weight: 800; color: #1e3a5f;">${escapeHtml(item.case_ref_no || '')}</span>
          <span style="background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; margin-left: 8px;">STRICTLY CONFIDENTIAL</span>
        </div>
        <span class="badge ${item.status === 'ADVOCATE_ASSIGNED' ? 'badge-primary' : 'badge-warning'}">${(item.status || 'PENDING_REVIEW').replace(/_/g, ' ')}</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
        <div><strong>Litigant Name:</strong> ${escapeHtml(item.litigant_name || '')} (${escapeHtml(item.litigant_role || 'Petitioner')})</div>
        <div><strong>Contact Mobile:</strong> <a href="tel:${item.phone}" style="color: #16a34a; font-weight: bold;">${escapeHtml(item.phone || '')}</a></div>
        <div><strong>Father/Spouse:</strong> ${escapeHtml(item.father_or_spouse || 'Not specified')}</div>
        <div><strong>Email:</strong> ${escapeHtml(item.email || 'N/A')}</div>
        <div><strong>Aadhaar / ID:</strong> ${escapeHtml(item.aadhaar_no || 'N/A')}</div>
        <div><strong>District / State:</strong> ${escapeHtml(item.district || 'Kolar')}, ${escapeHtml(item.state || 'Karnataka')}</div>
        <div style="grid-column: span 2;"><strong>Residential Address:</strong> ${escapeHtml(item.address || 'N/A')}</div>
      </div>
    </div>

    <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
      <h4 style="margin: 0 0 12px 0; color: #1e3a5f; font-size: 14px;"><i class="fa-solid fa-gavel" style="margin-right: 6px;"></i>Court &amp; Proceedings Particulars</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
        <div><strong>Court Name:</strong> ${escapeHtml(item.court_name || '')}</div>
        <div><strong>Court Tier:</strong> ${escapeHtml(item.court_tier || 'District Court')}</div>
        <div><strong>Case / Suit No:</strong> ${escapeHtml(item.case_number || '')}</div>
        <div><strong>Year Filed:</strong> ${escapeHtml(item.year_filed || '')}</div>
        <div><strong>Case Type:</strong> ${escapeHtml(item.case_type || '')}</div>
        <div><strong>CNR Number:</strong> ${escapeHtml(item.cnr_number || 'N/A')}</div>
        <div><strong>Opposite Party:</strong> ${escapeHtml(item.opposite_party_name || '')}</div>
        <div><strong>Opposite Advocate:</strong> ${escapeHtml(item.opposite_advocate || 'N/A')}</div>
        <div><strong>Hearings / Vaidas Attended:</strong> <span style="color: #dc2626; font-weight: bold;">${escapeHtml(item.hearings_count || '')}</span></div>
        <div><strong>Current Stage:</strong> ${escapeHtml(item.case_stage || '')}</div>
        <div><strong>Next Hearing Date:</strong> ${item.next_hearing_date ? new Date(item.next_hearing_date).toLocaleDateString('en-IN') : 'Not scheduled'}</div>
        <div><strong>Relief Requested:</strong> ${escapeHtml(item.legal_aid_required || '')}</div>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 6px 0; color: #1e3a5f; font-size: 14px;">Reasons for Repeated Adjournments / Stall:</h4>
      <p style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #92400e; margin: 0;">
        ${escapeHtml(item.delay_reasons || 'Frequent adjournments requested by opposite party.')}
      </p>
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 6px 0; color: #1e3a5f; font-size: 14px;">Detailed Dispute Summary &amp; Hardship Faced:</h4>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #334155; line-height: 1.5;">
        ${escapeHtml(item.dispute_summary || '')}
        ${item.hardship_details ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; color: #b91c1c;"><strong>Specific Hardship:</strong> ${escapeHtml(item.hardship_details)}</div>` : ''}
      </div>
    </div>

    ${item.document_urls ? `
      <div style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 6px 0; color: #1e3a5f; font-size: 14px;">Attached Court Documents:</h4>
        <a href="${item.document_urls}" target="_blank" class="btn btn-sm btn-outline-secondary" style="display: inline-flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-file-pdf"></i> View Attached Case Document
        </a>
      </div>
    ` : ''}

    <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 16px;">
      <h4 style="margin: 0 0 12px 0; color: #1e1b4b; font-size: 14px;"><i class="fa-solid fa-user-gear" style="margin-right: 6px;"></i>Admin Legal Action &amp; Advocate Assignment</h4>
      <form id="form-update-law-status">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Legal Case Status:</label>
            <select id="modal-law-status" class="form-control" style="width: 100%;">
              <option value="PENDING_REVIEW" ${item.status === 'PENDING_REVIEW' ? 'selected' : ''}>PENDING REVIEW</option>
              <option value="ADVOCATE_ASSIGNED" ${item.status === 'ADVOCATE_ASSIGNED' ? 'selected' : ''}>ADVOCATE ASSIGNED</option>
              <option value="IN_MEDIATION" ${item.status === 'IN_MEDIATION' ? 'selected' : ''}>IN MEDIATION / LOK ADALAT</option>
              <option value="FAST_TRACKED" ${item.status === 'FAST_TRACKED' ? 'selected' : ''}>FAST TRACKED IN COURT</option>
              <option value="RESOLVED" ${item.status === 'RESOLVED' ? 'selected' : ''}>RESOLVED / DECREED</option>
              <option value="DISMISSED" ${item.status === 'DISMISSED' ? 'selected' : ''}>DISMISSED / CLOSED</option>
            </select>
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Assigned PPPI Advocate:</label>
            <input type="text" id="modal-law-advocate" class="form-control" value="${escapeHtml(item.assigned_advocate || '')}" placeholder="e.g. Adv. B. R. Sreenivasa Murthy" style="width: 100%;" />
          </div>
        </div>
        <div style="margin-bottom: 14px;">
          <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Advocate / Admin Action Notes:</label>
          <textarea id="modal-law-notes" class="form-control" rows="3" placeholder="Enter legal notes, next steps, court memo details..." style="width: 100%;">${escapeHtml(item.admin_notes || '')}</textarea>
        </div>
        <div style="text-align: right;">
          <button type="submit" class="btn btn-primary" id="btn-save-law-status" style="background: #1e3a5f; border-color: #1e3a5f;">
            <i class="fa-solid fa-floppy-disk" style="margin-right: 6px;"></i> Save Legal Actions
          </button>
        </div>
      </form>
    </div>
  `;

  modal.style.display = 'flex';

  const form = document.getElementById('form-update-law-status');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const status = document.getElementById('modal-law-status')?.value;
      const assigned_advocate = document.getElementById('modal-law-advocate')?.value?.trim();
      const admin_notes = document.getElementById('modal-law-notes')?.value?.trim();

      try {
        const ok = await apiUpdateLegalCase(item.id, { status, assigned_advocate, admin_notes });
        if (ok) {
          alert('Legal case dossier and advocate assignment updated successfully!');
          modal.style.display = 'none';
          appData.legalCases = await apiGetLegalCases();
          updateBadges();
          renderLawView();
        } else {
          alert('Failed to update legal case.');
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    };
  }
}

function setupLawAdminListeners() {
  const searchInp = document.getElementById('law-filter-search');
  if (searchInp) {
    searchInp.oninput = () => renderLawView();
  }

  const tierSelect = document.getElementById('law-filter-tier');
  if (tierSelect) {
    tierSelect.onchange = () => renderLawView();
  }

  const statusSelect = document.getElementById('law-filter-status');
  if (statusSelect) {
    statusSelect.onchange = () => renderLawView();
  }
}


/* ==========================================================================
   MARRIAGES SUPPORT & SOCIAL HARMONY CELL (ADMIN ONLY)
   ========================================================================== */
function renderMarriagesView() {
  const tbody = document.getElementById('tbody-marriages-cases');
  if (!tbody) return;

  const applications = appData.marriageApplications || [];

  // Update KPI counters
  let totalApps = applications.length;
  let underVerification = 0;
  let highThreats = 0;
  let solemnized = 0;

  applications.forEach(a => {
    if (a.status === 'UNDER_VERIFICATION') underVerification++;
    if (a.threat_level === 'HIGH' || a.threat_level === 'URGENT') highThreats++;
    if (a.status === 'MARRIAGE_SOLEMNIZED' || a.status === 'FINANCIAL_AID_SANCTIONED') solemnized++;
  });

  const kpiTotal = document.getElementById('kpi-marriages-total');
  if (kpiTotal) kpiTotal.textContent = totalApps;
  const kpiVer = document.getElementById('kpi-marriages-verification');
  if (kpiVer) kpiVer.textContent = underVerification;
  const kpiThreat = document.getElementById('kpi-marriages-threats');
  if (kpiThreat) kpiThreat.textContent = highThreats;
  const kpiSol = document.getElementById('kpi-marriages-solemnized');
  if (kpiSol) kpiSol.textContent = solemnized;

  // Filters
  const searchVal = (document.getElementById('marriages-filter-search')?.value || '').toLowerCase().trim();
  const barrierVal = document.getElementById('marriages-filter-barrier')?.value || 'ALL';
  const statusVal = document.getElementById('marriages-filter-status')?.value || 'ALL';

  const filtered = applications.filter(a => {
    if (barrierVal !== 'ALL' && !String(a.barrier_type || '').includes(barrierVal)) return false;
    if (statusVal !== 'ALL' && a.status !== statusVal) return false;
    if (searchVal) {
      const q = searchVal;
      const match = (a.application_no && a.application_no.toLowerCase().includes(q)) ||
                    (a.groom_name && a.groom_name.toLowerCase().includes(q)) ||
                    (a.bride_name && a.bride_name.toLowerCase().includes(q)) ||
                    (a.groom_phone && a.groom_phone.includes(q)) ||
                    (a.bride_phone && a.bride_phone.includes(q)) ||
                    (a.groom_district && a.groom_district.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px 16px; color: #64748b;">
          <i class="fa-solid fa-heart-crack" style="font-size: 28px; margin-bottom: 8px; display: block; color: #cbd5e1;"></i>
          No couple marriage support applications matching your search filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(a => {
    const isUrgent = a.threat_level === 'URGENT' || a.threat_level === 'HIGH';
    return `
      <tr>
        <td>
          <div style="font-family: monospace; font-size: 11.5px; font-weight: 800; color: #be123c;">${escapeHtml(a.application_no || '')}</div>
          <strong style="color: #0f172a; font-size: 13.5px;">${escapeHtml(a.groom_name || '')} &amp; ${escapeHtml(a.bride_name || '')}</strong>
          <div style="font-size: 11px; color: #64748b;">${escapeHtml(a.relationship_years || 'Couple')} in love</div>
        </td>
        <td>
          <div style="font-size: 12px;"><i class="fa-solid fa-mars" style="color:#0284c7; margin-right:4px;"></i>${escapeHtml(a.groom_phone || 'N/A')} (${escapeHtml(a.groom_district || 'Kolar')})</div>
          <div style="font-size: 12px; margin-top:2px;"><i class="fa-solid fa-venus" style="color:#db2777; margin-right:4px;"></i>${escapeHtml(a.bride_phone || 'N/A')} (${escapeHtml(a.bride_district || 'Kolar')})</div>
        </td>
        <td>
          <div style="font-weight: 600; color: #881337; font-size: 12.5px;">${escapeHtml(a.barrier_type || 'Social Barrier')}</div>
          <small style="color: #64748b; font-size: 11px;">${escapeHtml(a.assistance_required || 'Counseling')}</small>
        </td>
        <td>
          <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; ${isUrgent ? 'background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5;' : 'background: #fef9c3; color: #854d0e; border: 1px solid #fde047;'}">
            ${isUrgent ? '<i class="fa-solid fa-triangle-exclamation" style="margin-right:3px;"></i>' : ''}${escapeHtml(a.threat_level || 'MEDIUM')}
          </span>
        </td>
        <td>
          <span class="badge ${a.status === 'MARRIAGE_SOLEMNIZED' ? 'badge-success' : a.status === 'COUPLE_CONTACTED' ? 'badge-primary' : 'badge-warning'}">
            ${(a.status || 'UNDER_VERIFICATION').replace(/_/g, ' ')}
          </span>
        </td>
        <td>
          ${a.assigned_officer ? `
            <div style="font-weight: 700; color: #be123c; font-size: 12px;">
              <i class="fa-solid fa-user-shield" style="margin-right: 4px;"></i>${escapeHtml(a.assigned_officer)}
            </div>
          ` : `
            <span style="font-size: 11px; color: #94a3b8; font-style: italic;">Awaiting Assignment</span>
          `}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn btn-sm btn-outline-primary btn-view-marriage-dossier" data-id="${a.id}" title="Review Couple Dossier" style="margin-right: 4px;">
            <i class="fa-solid fa-eye"></i> View
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger btn-delete-marriage-app" data-id="${a.id}" title="Delete Application">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Bind View Dossier buttons
  document.querySelectorAll('.btn-view-marriage-dossier').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const item = applications.find(x => String(x.id) === String(id));
      if (item) openMarriageDossierModal(item);
    };
  });

  // Bind Delete buttons
  document.querySelectorAll('.btn-delete-marriage-app').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Are you sure you want to remove this confidential marriage support application?')) return;
      try {
        await apiDeleteMarriageApplication(id);
        alert('Marriage support dossier removed.');
        appData.marriageApplications = await apiGetMarriageApplications();
        updateBadges();
        renderMarriagesView();
      } catch (err) {
        alert('Failed to delete application: ' + err.message);
      }
    };
  });
}

function openMarriageDossierModal(item) {
  let modal = document.getElementById('modal-marriage-dossier');
  if (!modal) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'modal-marriage-dossier';
    modalDiv.className = 'modal';
    modalDiv.style.display = 'none';
    modalDiv.innerHTML = `
      <div class="modal-dialog" style="max-width: 840px;">
        <div class="modal-content" style="border-radius: 12px; overflow: hidden;">
          <div class="modal-header" style="background: #881337; color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
            <h3 class="modal-title" style="margin: 0; font-size: 16px;"><i class="fa-solid fa-heart" style="margin-right: 8px;"></i>Confidential Couple Dossier &amp; Social Aid Review</h3>
            <button type="button" id="btn-close-marriage-dossier-x" style="color: white; background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body" id="marriage-modal-body" style="padding: 20px; max-height: 75vh; overflow-y: auto;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modalDiv);
    modal = modalDiv;

    document.getElementById('btn-close-marriage-dossier-x').onclick = () => {
      modal.style.display = 'none';
    };
  }

  const body = document.getElementById('marriage-modal-body');
  if (!body) return;

  body.innerHTML = `
    <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span style="font-family: monospace; font-size: 15px; font-weight: 800; color: #881337;">${escapeHtml(item.application_no || '')}</span>
        <span style="background: #fdf2f8; color: #db2777; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; margin-left: 8px;">STRICTLY CONFIDENTIAL</span>
      </div>
      <div>
        <span class="badge badge-warning" style="margin-right: 6px;">Threat: ${escapeHtml(item.threat_level || 'MEDIUM')}</span>
        <span class="badge badge-primary">${(item.status || 'UNDER_VERIFICATION').replace(/_/g, ' ')}</span>
      </div>
    </div>

    <!-- DUAL COLUMN COMPARISON: GROOM VS BRIDE -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <!-- Groom Card -->
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 14px;">
        <h4 style="margin: 0 0 10px 0; color: #0369a1; font-size: 14px; border-bottom: 1px solid #e0f2fe; padding-bottom: 6px;">
          <i class="fa-solid fa-mars" style="margin-right: 6px;"></i>Groom (Boy Side) Details
        </h4>
        <div style="font-size: 12.5px; line-height: 1.6; color: #1e293b;">
          <div><strong>Name:</strong> ${escapeHtml(item.groom_name || '')} (Age: ${item.groom_age})</div>
          <div><strong>Father:</strong> ${escapeHtml(item.groom_father || 'N/A')}</div>
          <div><strong>Phone:</strong> <a href="tel:${item.groom_phone}" style="color: #0284c7; font-weight: bold;">${escapeHtml(item.groom_phone || '')}</a></div>
          <div><strong>Email:</strong> ${escapeHtml(item.groom_email || 'N/A')}</div>
          <div><strong>Aadhaar:</strong> ${escapeHtml(item.groom_aadhaar || 'N/A')}</div>
          <div><strong>PAN Card:</strong> ${escapeHtml(item.groom_pan || 'N/A')}</div>
          <div><strong>Religion/Caste:</strong> ${escapeHtml(item.groom_religion || '')} - ${escapeHtml(item.groom_caste || 'N/A')}</div>
          <div><strong>Occupation:</strong> ${escapeHtml(item.groom_occupation || '')} (${escapeHtml(item.groom_income || 'N/A')})</div>
          <div><strong>Address:</strong> ${escapeHtml(item.groom_address || '')}, ${escapeHtml(item.groom_district || '')}</div>
        </div>
      </div>

      <!-- Bride Card -->
      <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 10px; padding: 14px;">
        <h4 style="margin: 0 0 10px 0; color: #be185d; font-size: 14px; border-bottom: 1px solid #fce7f3; padding-bottom: 6px;">
          <i class="fa-solid fa-venus" style="margin-right: 6px;"></i>Bride (Girl Side) Details
        </h4>
        <div style="font-size: 12.5px; line-height: 1.6; color: #1e293b;">
          <div><strong>Name:</strong> ${escapeHtml(item.bride_name || '')} (Age: ${item.bride_age})</div>
          <div><strong>Father:</strong> ${escapeHtml(item.bride_father || 'N/A')}</div>
          <div><strong>Phone:</strong> <a href="tel:${item.bride_phone}" style="color: #db2777; font-weight: bold;">${escapeHtml(item.bride_phone || '')}</a></div>
          <div><strong>Email:</strong> ${escapeHtml(item.bride_email || 'N/A')}</div>
          <div><strong>Aadhaar:</strong> ${escapeHtml(item.bride_aadhaar || 'N/A')}</div>
          <div><strong>PAN Card:</strong> ${escapeHtml(item.bride_pan || 'N/A')}</div>
          <div><strong>Religion/Caste:</strong> ${escapeHtml(item.bride_religion || '')} - ${escapeHtml(item.bride_caste || 'N/A')}</div>
          <div><strong>Occupation:</strong> ${escapeHtml(item.bride_occupation || '')} (${escapeHtml(item.bride_income || 'N/A')})</div>
          <div><strong>Address:</strong> ${escapeHtml(item.bride_address || '')}, ${escapeHtml(item.bride_district || '')}</div>
        </div>
      </div>
    </div>

    <!-- Struggle & Opposition Background -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
      <h4 style="margin: 0 0 6px 0; color: #881337; font-size: 13.5px;"><i class="fa-solid fa-circle-exclamation" style="margin-right: 6px;"></i>Dispute, Family Opposition &amp; Struggle Details:</h4>
      <p style="font-size: 13px; color: #334155; line-height: 1.5; margin: 0 0 8px 0;">
        ${escapeHtml(item.dispute_summary || 'No narrative specified.')}
      </p>
      <div style="display: flex; gap: 16px; font-size: 12px; color: #64748b; border-top: 1px dashed #e2e8f0; padding-top: 8px;">
        <div><strong>Barrier Category:</strong> ${escapeHtml(item.barrier_type || '')}</div>
        <div><strong>Relationship Duration:</strong> ${escapeHtml(item.relationship_years || 'N/A')}</div>
        <div><strong>Assistance Desired:</strong> ${escapeHtml(item.assistance_required || '')}</div>
      </div>
    </div>

    <!-- Admin Action & Counselor Assignment -->
    <div style="background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 10px; padding: 16px;">
      <h4 style="margin: 0 0 12px 0; color: #701a75; font-size: 14px;"><i class="fa-solid fa-hand-holding-heart" style="margin-right: 6px;"></i>Social Harmony Action &amp; Counselor Assignment</h4>
      <form id="form-update-marriage-status">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Application Status:</label>
            <select id="modal-marriage-status" class="form-control" style="width: 100%;">
              <option value="UNDER_VERIFICATION" ${item.status === 'UNDER_VERIFICATION' ? 'selected' : ''}>UNDER VERIFICATION</option>
              <option value="COUPLE_CONTACTED" ${item.status === 'COUPLE_CONTACTED' ? 'selected' : ''}>COUPLE CONTACTED & VERIFIED</option>
              <option value="COUNSELING_SCHEDULED" ${item.status === 'COUNSELING_SCHEDULED' ? 'selected' : ''}>COUNSELING / MEDIATION SCHEDULED</option>
              <option value="LEGAL_AID_PROVIDED" ${item.status === 'LEGAL_AID_PROVIDED' ? 'selected' : ''}>LEGAL AID / SPECIAL MARRIAGE ACT</option>
              <option value="FINANCIAL_AID_SANCTIONED" ${item.status === 'FINANCIAL_AID_SANCTIONED' ? 'selected' : ''}>KALYANA SAHAYA SANCTIONED</option>
              <option value="MARRIAGE_SOLEMNIZED" ${item.status === 'MARRIAGE_SOLEMNIZED' ? 'selected' : ''}>MARRIAGE SOLEMNIZED / PROTECTED</option>
              <option value="REJECTED" ${item.status === 'REJECTED' ? 'selected' : ''}>REJECTED / UNVERIFIED</option>
            </select>
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Assigned Counselor / Officer:</label>
            <input type="text" id="modal-marriage-officer" class="form-control" value="${escapeHtml(item.assigned_officer || '')}" placeholder="e.g. Smt. Kavitha Gowda (Social Harmony)" style="width: 100%;" />
          </div>
        </div>
        <div style="margin-bottom: 14px;">
          <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Verification &amp; Social Action Notes:</label>
          <textarea id="modal-marriage-notes" class="form-control" rows="3" placeholder="Enter background check findings, parental contact notes, safety instructions..." style="width: 100%;">${escapeHtml(item.admin_notes || '')}</textarea>
        </div>
        <div style="text-align: right;">
          <button type="submit" class="btn btn-primary" id="btn-save-marriage-status" style="background: #881337; border-color: #881337;">
            <i class="fa-solid fa-floppy-disk" style="margin-right: 6px;"></i> Save Action &amp; Counselor Notes
          </button>
        </div>
      </form>
    </div>
  `;

  modal.style.display = 'flex';

  const form = document.getElementById('form-update-marriage-status');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const status = document.getElementById('modal-marriage-status')?.value;
      const assigned_officer = document.getElementById('modal-marriage-officer')?.value?.trim();
      const admin_notes = document.getElementById('modal-marriage-notes')?.value?.trim();

      try {
        const ok = await apiUpdateMarriageApplication(item.id, { status, assigned_officer, admin_notes });
        if (ok) {
          alert('Marriage dossier and counselor assignment updated successfully!');
          modal.style.display = 'none';
          appData.marriageApplications = await apiGetMarriageApplications();
          updateBadges();
          renderMarriagesView();
        } else {
          alert('Failed to update marriage application.');
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    };
  }
}

function setupMarriageAdminListeners() {
  const searchInp = document.getElementById('marriages-filter-search');
  if (searchInp) {
    searchInp.oninput = () => renderMarriagesView();
  }

  const barrierSelect = document.getElementById('marriages-filter-barrier');
  if (barrierSelect) {
    barrierSelect.onchange = () => renderMarriagesView();
  }

  const statusSelect = document.getElementById('marriages-filter-status');
  if (statusSelect) {
    statusSelect.onchange = () => renderMarriagesView();
  }
}


/* ==========================================================================
   PPPI 24/7 RAPID EMERGENCY COMMAND, SOUND ALERTS & PETITION SYSTEM
   ========================================================================== */

let sirenAudioCtx = null;
let isSirenMuted = false;
let lastKnownEmergencyId = null;

function playEmergencySiren() {
  if (isSirenMuted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!sirenAudioCtx) sirenAudioCtx = new AudioContext();
    if (sirenAudioCtx.state === 'suspended') sirenAudioCtx.resume();

    const osc = sirenAudioCtx.createOscillator();
    const gain = sirenAudioCtx.createGain();

    osc.type = 'sawtooth';
    const now = sirenAudioCtx.currentTime;
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(660, now + 0.25);
    osc.frequency.linearRampToValueAtTime(880, now + 0.5);
    osc.frequency.linearRampToValueAtTime(660, now + 0.75);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

    osc.connect(gain);
    gain.connect(sirenAudioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.9);
  } catch (e) {
    console.warn('Audio synthesis notice:', e.message);
  }
}

function showEmergencyBanner(alertItem) {
  const banner = document.getElementById('emergency-live-banner');
  const title = document.getElementById('emergency-banner-title');
  const details = document.getElementById('emergency-banner-details');
  const viewBtn = document.getElementById('btn-banner-view-sos');

  if (banner && title && details) {
    title.textContent = `CRITICAL SOS: ${alertItem.category || 'EMERGENCY'} INCOMING!`;
    details.textContent = `"${alertItem.title || alertItem.location_name}" - Phone: ${alertItem.informant_phone || 'N/A'}`;
    banner.style.display = 'flex';

    if (viewBtn) {
      viewBtn.onclick = () => {
        showView('emergencies');
        openEmergencyDossierModal(alertItem, 'petition');
      };
    }
  }
}

async function pollEmergencyAlerts() {
  try {
    const poll = await apiGetEmergencyPoll();
    if (poll && poll.success) {
      const badge = document.getElementById('badge-emergencies-count');
      if (badge) {
        badge.textContent = poll.active_count || 0;
      }

      if (poll.latest_alert) {
        if (lastKnownEmergencyId !== null && poll.latest_alert.id > lastKnownEmergencyId) {
          showEmergencyBanner(poll.latest_alert);
          playEmergencySiren();
          appData.emergencyAlerts = await apiGetEmergencyAlerts();
          updateBadges();
          if (document.getElementById('view-emergencies')?.classList.contains('active')) {
            renderEmergenciesView();
          }
        }
        lastKnownEmergencyId = Math.max(lastKnownEmergencyId || 0, poll.latest_alert.id);
      }
    }
  } catch (err) {
    // silent poll error
  }
}

// Start 7-second emergency polling loop
setInterval(pollEmergencyAlerts, 7000);

function renderEmergenciesView() {
  const tbody = document.getElementById('tbody-emergency-cases');
  if (!tbody) return;

  const searchVal = (document.getElementById('emergency-filter-search')?.value || '').toLowerCase().trim();
  const catVal = document.getElementById('emergency-filter-category')?.value || 'ALL';
  const sevVal = document.getElementById('emergency-filter-severity')?.value || 'ALL';
  const statusVal = document.getElementById('emergency-filter-status')?.value || 'ALL';

  let list = [...(appData.emergencyAlerts || [])];

  // Update KPI Metrics
  const kpiTotal = document.getElementById('kpi-emergency-total');
  const kpiActive = document.getElementById('kpi-emergency-active');
  const kpiPetitions = document.getElementById('kpi-emergency-petitions');
  const kpiResolved = document.getElementById('kpi-emergency-resolved');

  if (kpiTotal) kpiTotal.textContent = list.length;
  if (kpiActive) kpiActive.textContent = list.filter(a => a.status === 'ACTIVE_ALERT' || a.status === 'INVESTIGATING').length;
  if (kpiPetitions) kpiPetitions.textContent = list.filter(a => a.petition_status === 'FILED' || a.status === 'PETITION_FILED').length;
  if (kpiResolved) kpiResolved.textContent = list.filter(a => a.status === 'RESOLVED').length;

  // Filter
  if (catVal !== 'ALL') {
    list = list.filter(a => (a.category || '').toLowerCase().includes(catVal.toLowerCase()));
  }
  if (sevVal !== 'ALL') {
    list = list.filter(a => (a.severity || '').toUpperCase() === sevVal.toUpperCase());
  }
  if (statusVal !== 'ALL') {
    list = list.filter(a => (a.status || '').toUpperCase() === statusVal.toUpperCase());
  }
  if (searchVal) {
    list = list.filter(a =>
      (a.alert_no || '').toLowerCase().includes(searchVal) ||
      (a.location_name || '').toLowerCase().includes(searchVal) ||
      (a.landmark || '').toLowerCase().includes(searchVal) ||
      (a.title || '').toLowerCase().includes(searchVal) ||
      (a.informant_name || '').toLowerCase().includes(searchVal) ||
      (a.informant_phone || '').toLowerCase().includes(searchVal)
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 40px; color:#64748b;">
          <i class="fa-solid fa-shield-check" style="font-size:32px; color:#10b981; margin-bottom:10px; display:block;"></i>
          No emergency alerts match the selected criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(item => {
    const sevBadge = item.severity === 'CRITICAL'
      ? '<span style="background:#fee2e2; color:#dc2626; border:1px solid #f87171; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:800;">CRITICAL</span>'
      : item.severity === 'HIGH'
      ? '<span style="background:#ffedd5; color:#c2410c; border:1px solid #fb923c; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:800;">HIGH</span>'
      : '<span style="background:#fef9c3; color:#a16207; border:1px solid #facc15; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:800;">MODERATE</span>';

    const statusBadge = item.status === 'ACTIVE_ALERT'
      ? '<span style="background:#fee2e2; color:#dc2626; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700;">ACTIVE ALERT</span>'
      : item.status === 'PETITION_FILED'
      ? '<span style="background:#dbeafe; color:#1d4ed8; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700;">PETITION FILED</span>'
      : item.status === 'DISPATCHED_TO_AUTHORITIES'
      ? '<span style="background:#ffedd5; color:#ea580c; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700;">DISPATCHED</span>'
      : item.status === 'RESOLVED'
      ? '<span style="background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700;">RESOLVED</span>'
      : `<span style="background:#f1f5f9; color:#475569; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700;">${escapeHtml(item.status || '')}</span>`;

    const petitionBadge = item.petition_status === 'FILED'
      ? `<div style="margin-top:4px;"><span style="background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; font-size:10.5px; font-weight:700; padding:1px 6px; border-radius:4px;"><i class="fa-solid fa-file-contract"></i> ${escapeHtml(item.petition_ref_no || 'Petition')}</span></div>`
      : '';

    const gpsLink = (item.latitude && item.longitude)
      ? `<a href="https://maps.google.com/?q=${item.latitude},${item.longitude}" target="_blank" style="color:#0284c7; font-size:11.5px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:4px; margin-top:3px;"><i class="fa-solid fa-map-location-dot"></i> ${item.latitude.toFixed(4)}°, ${item.longitude.toFixed(4)}°</a>`
      : '<span style="font-size:11px; color:#94a3b8;">Manual Address</span>';

    return `
      <tr style="${item.severity === 'CRITICAL' && item.status === 'ACTIVE_ALERT' ? 'background: #fff5f5;' : ''}">
        <td>
          <span style="font-family:monospace; font-weight:800; color:#991b1b;">${escapeHtml(item.alert_no || '')}</span>
          <div style="font-size:11.5px; color:#64748b; margin-top:2px;">${new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${new Date(item.created_at || Date.now()).toLocaleDateString('en-IN')}</div>
        </td>
        <td>
          <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">${escapeHtml(item.category || '')}</div>
          ${sevBadge}
        </td>
        <td>
          <div style="font-weight:600; color:#1e293b; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(item.location_name || '')}">
            ${escapeHtml(item.location_name || '')}
          </div>
          <div style="font-size:11.5px; color:#64748b;">${escapeHtml(item.landmark || item.district || 'Kolar')}</div>
          ${gpsLink}
        </td>
        <td>
          <div style="font-weight:700; color:#0f172a;">${escapeHtml(item.informant_name || '')}</div>
          <a href="tel:${item.informant_phone}" style="color:#dc2626; font-weight:800; font-size:12px; text-decoration:none;">
            <i class="fa-solid fa-phone" style="font-size:10px; margin-right:4px;"></i>${escapeHtml(item.informant_phone || '')}
          </a>
        </td>
        <td>
          ${statusBadge}
          ${petitionBadge}
        </td>
        <td>
          <div style="font-size:12.5px; font-weight:600; color:#334155;">${escapeHtml(item.assigned_officer || 'Unassigned')}</div>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-sm btn-outline btn-view-emergency-dossier" data-id="${item.id}" title="Inspect Dossier" style="padding:4px 8px; margin-right:4px;">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-primary btn-file-emergency-petition" data-id="${item.id}" title="Draft & File Petition" style="background:#2563eb; border-color:#2563eb; padding:4px 10px; margin-right:4px;">
            <i class="fa-solid fa-file-signature"></i> Petition
          </button>
          <button class="btn btn-sm btn-outline btn-delete-emergency" data-id="${item.id}" title="Dismiss Alert" style="color:#ef4444; border-color:#fca5a5; padding:4px 8px;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach table button click handlers
  tbody.querySelectorAll('.btn-view-emergency-dossier').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id, 10);
      const item = appData.emergencyAlerts.find(a => a.id === id);
      if (item) openEmergencyDossierModal(item, 'dossier');
    };
  });

  tbody.querySelectorAll('.btn-file-emergency-petition').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id, 10);
      const item = appData.emergencyAlerts.find(a => a.id === id);
      if (item) openEmergencyDossierModal(item, 'petition');
    };
  });

  tbody.querySelectorAll('.btn-delete-emergency').forEach(btn => {
    btn.onclick = async () => {
      const id = parseInt(btn.dataset.id, 10);
      if (confirm('Are you sure you want to dismiss or delete this emergency alert?')) {
        const ok = await apiDeleteEmergencyAlert(id);
        if (ok) {
          appData.emergencyAlerts = appData.emergencyAlerts.filter(a => a.id !== id);
          updateBadges();
          renderEmergenciesView();
        } else {
          alert('Failed to delete alert.');
        }
      }
    };
  });
}

function openEmergencyDossierModal(item, initialTab = 'dossier') {
  let modal = document.getElementById('modal-emergency-dossier');
  if (!modal) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'modal-emergency-dossier';
    modalDiv.className = 'modal';
    modalDiv.style.display = 'none';
    modalDiv.innerHTML = `
      <div class="modal-dialog" style="max-width: 880px;">
        <div class="modal-content" style="border-radius: 12px; overflow: hidden; border-top: 5px solid #dc2626;">
          <div class="modal-header" style="background: #7f1d1d; color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 class="modal-title" style="margin: 0; font-size: 16px; color: white;">
                <i class="fa-solid fa-triangle-exclamation" style="margin-right: 8px; color: #f87171;"></i>
                SOS Emergency Incident &amp; Statutory Petition Cell
              </h3>
              <span id="emergency-modal-subhdr" style="font-size: 12px; color: #fecaca;"></span>
            </div>
            <button type="button" id="btn-close-emergency-dossier-x" style="color: white; background: none; border: none; font-size: 24px; cursor: pointer; line-height: 1;">&times;</button>
          </div>

          <!-- TABS ROW -->
          <div style="display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; padding: 0 16px;">
            <button type="button" class="tab-btn active" id="tab-btn-dossier" style="padding: 12px 18px; font-weight: 700; border: none; background: none; cursor: pointer; border-bottom: 3px solid #dc2626; color: #dc2626;">
              <i class="fa-solid fa-file-lines" style="margin-right: 6px;"></i> 1. Incident Dossier &amp; Ground Facts
            </button>
            <button type="button" class="tab-btn" id="tab-btn-petition" style="padding: 12px 18px; font-weight: 700; border: none; background: none; cursor: pointer; border-bottom: 3px solid transparent; color: #64748b;">
              <i class="fa-solid fa-file-signature" style="margin-right: 6px;"></i> 2. Draft &amp; File Emergency Petition
            </button>
            <button type="button" class="tab-btn" id="tab-btn-dispatch" style="padding: 12px 18px; font-weight: 700; border: none; background: none; cursor: pointer; border-bottom: 3px solid transparent; color: #64748b;">
              <i class="fa-solid fa-person-running" style="margin-right: 6px;"></i> 3. Status &amp; Officer Dispatch
            </button>
          </div>

          <div class="modal-body" id="emergency-modal-body" style="padding: 20px; max-height: 75vh; overflow-y: auto;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modalDiv);
    modal = modalDiv;

    document.getElementById('btn-close-emergency-dossier-x').onclick = () => {
      modal.style.display = 'none';
    };
  }

  const subhdr = document.getElementById('emergency-modal-subhdr');
  if (subhdr) {
    subhdr.textContent = `${item.alert_no} • ${item.category} • ${item.location_name}`;
  }

  function renderTab(tabName) {
    const body = document.getElementById('emergency-modal-body');
    if (!body) return;

    // Update tab header styles
    ['dossier', 'petition', 'dispatch'].forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      if (btn) {
        if (t === tabName) {
          btn.style.borderBottom = '3px solid #dc2626';
          btn.style.color = '#dc2626';
        } else {
          btn.style.borderBottom = '3px solid transparent';
          btn.style.color = '#64748b';
        }
      }
    });

    if (tabName === 'dossier') {
      body.innerHTML = `
        <!-- Alert Status Banner -->
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 18px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <span style="font-family: monospace; font-size: 16px; font-weight: 900; color: #991b1b;">${escapeHtml(item.alert_no || '')}</span>
            <span style="background: #dc2626; color: white; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; margin-left: 8px;">${escapeHtml(item.severity || 'CRITICAL')}</span>
            <span style="background: #fee2e2; color: #991b1b; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; margin-left: 6px;">${escapeHtml(item.category || '')}</span>
          </div>
          <div>
            <span class="badge badge-primary">${(item.status || 'ACTIVE_ALERT').replace(/_/g, ' ')}</span>
          </div>
        </div>

        <!-- Location & GPS Coordinates Card -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin-bottom: 18px;">
          <h4 style="margin: 0 0 10px 0; color: #166534; font-size: 14px;"><i class="fa-solid fa-location-dot" style="margin-right: 6px;"></i>Location &amp; Geolocation Coordinates</h4>
          <div style="font-size: 13px; line-height: 1.6; color: #1e293b;">
            <div><strong>Location:</strong> ${escapeHtml(item.location_name || '')}</div>
            <div><strong>Landmark:</strong> ${escapeHtml(item.landmark || 'N/A')}</div>
            <div><strong>District / State:</strong> ${escapeHtml(item.district || 'Kolar')}, ${escapeHtml(item.state || 'Karnataka')}</div>
            ${(item.latitude && item.longitude) ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #86efac;">
                <strong>GPS Coordinates:</strong> Lat ${item.latitude.toFixed(5)}°, Long ${item.longitude.toFixed(5)}° (Accuracy: ±${Math.round(item.gps_accuracy || 10)}m)
                <br />
                <a href="https://maps.google.com/?q=${item.latitude},${item.longitude}" target="_blank" class="btn btn-sm btn-outline" style="background:#ffffff; color:#15803d; border-color:#86efac; font-weight:700; margin-top:6px; display:inline-flex; align-items:center; gap:6px;">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Live Location in Google Maps
                </a>
              </div>
            ` : '<div style="color: #64748b; font-size: 12px; margin-top: 4px;">No GPS coordinates captured. Citizen provided manual landmark address.</div>'}
          </div>
        </div>

        <!-- Incident Narrative -->
        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 18px;">
          <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 15px;">${escapeHtml(item.title || item.category)}</h4>
          <p style="font-size: 13.5px; color: #334155; line-height: 1.6; margin: 0 0 10px 0; white-space: pre-wrap;">${escapeHtml(item.description || 'No description.')}</p>
          ${item.victim_condition ? `
            <div style="background: #fff1f2; border-left: 4px solid #e11d48; padding: 8px 12px; font-size: 12.5px; color: #9f1239;">
              <strong>Victim Condition:</strong> ${escapeHtml(item.victim_condition)}
            </div>
          ` : ''}
        </div>

        <!-- Informant Details -->
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-bottom: 18px;">
          <h4 style="margin: 0 0 10px 0; color: #334155; font-size: 14px;"><i class="fa-solid fa-address-card" style="margin-right: 6px;"></i>Informant / Reporting Person</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
            <div><strong>Name:</strong> ${escapeHtml(item.informant_name || '')}</div>
            <div><strong>Primary Mobile:</strong> <a href="tel:${item.informant_phone}" style="color: #dc2626; font-weight: 800;">${escapeHtml(item.informant_phone || '')}</a></div>
            <div><strong>Alternate Phone:</strong> ${escapeHtml(item.informant_alt_phone || 'None')}</div>
            <div><strong>Logged At:</strong> ${new Date(item.created_at || Date.now()).toLocaleString('en-IN')}</div>
          </div>
        </div>

        ${item.photo_url ? `
          <div style="margin-bottom: 18px;">
            <h4 style="margin: 0 0 8px 0; font-size: 13.5px; color: #334155;"><i class="fa-solid fa-camera" style="margin-right: 6px;"></i>Attached Incident Evidence Photo</h4>
            <img src="${item.photo_url}" alt="Evidence" style="max-height: 220px; border-radius: 8px; border: 1px solid #cbd5e1; object-fit: cover;" />
          </div>
        ` : ''}

        <div style="text-align: right; margin-top: 10px;">
          <button type="button" class="btn btn-primary" id="btn-goto-petition-tab" style="background: #2563eb; border-color: #2563eb;">
            <i class="fa-solid fa-file-signature" style="margin-right: 6px;"></i> Proceed to Draft Official Statutory Petition &rarr;
          </button>
        </div>
      `;

      const btnGotoPetition = document.getElementById('btn-goto-petition-tab');
      if (btnGotoPetition) {
        btnGotoPetition.onclick = () => renderTab('petition');
      }
    } else if (tabName === 'petition') {
      // Generate default petition draft if not already filed
      const targetAuth = item.petition_filed_to || (
        item.category === 'Natural Disaster'
          ? 'Deputy Commissioner & District Magistrate (DDMA), Kolar District'
          : item.category === 'Snatching & Robbery' || item.category === 'Assault & Violence' || item.category === 'Threatening / Extortion'
          ? 'Superintendent of Police (SP), Kolar District'
          : 'Deputy Commissioner & Superintendent of Police, Kolar'
      );

      const defaultSubject = item.petition_subject || (
        item.category === 'Natural Disaster'
          ? `URGENT STATUTORY DISASTER PETITION UNDER SECTION 30 OF DISASTER MANAGEMENT ACT 2005 FOR IMMEDIATE RESCUE & RELIEF AT ${(item.location_name || 'KOLAR').toUpperCase()} (SOS REF: ${item.alert_no})`
          : `EMERGENCY POLICE ACTION PETITION & ZERO FIR DEMAND (UNDER SECTION 173 BNSS / ARTICLE 21) REGARDING ${(item.category || 'EMERGENCY').toUpperCase()} AT ${(item.location_name || 'KOLAR').toUpperCase()} (SOS REF: ${item.alert_no})`
      );

      const defaultText = item.petition_text || `To:
The ${targetAuth},
District Administrative Headquarters, Kolar - 563101.

Subject: ${defaultSubject}

Respected Sir / Madam,
The Pasha People Party of India (PPPI) Rapid Emergency Cell and Citizen Legal Taskforce hereby submits this formal emergency representation under Article 21 of the Constitution of India, demanding immediate statutory intervention regarding a life-critical emergency reported at ${item.location_name || 'Kolar'}.

Particulars of the Emergency:
1. Incident Category: ${item.category || 'Emergency'} (Urgency: ${item.severity || 'CRITICAL'}).
2. Time of Occurrence / Logged: ${new Date(item.created_at || Date.now()).toLocaleString('en-IN')}.
3. Exact Location: ${item.location_name || ''}${item.landmark ? ' (Near ' + item.landmark + ')' : ''}, ${item.district || 'Kolar'}.
${item.latitude ? `4. GPS Satellite Coordinates: Lat ${item.latitude.toFixed(5)}°, Long ${item.longitude.toFixed(5)}°.` : ''}
5. Informant / Victim: ${item.informant_name} (Phone: ${item.informant_phone}).

Factual Narrative of Danger:
${item.description}

Specific Statutory Demands:
1. Immediate mobilization and dispatch of regional police patrol / disaster rescue squad to the exact spot.
2. Immediate registration of Zero FIR and impounding of local CCTV / evidence.
3. 24/7 security protection for the informant and affected families against retaliatory harm.
4. Immediate transit shelter, medical aid, or relief as mandated under law.

Submitted on behalf of the affected citizens by:
PPPI Rapid Emergency Command & Citizen Protection Cell
Contact Helpline: +91 7259798393`;

      body.innerHTML = `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px 18px; margin-bottom: 18px;">
          <h4 style="margin: 0 0 6px 0; color: #1e40af; font-size: 14px;"><i class="fa-solid fa-scroll" style="margin-right: 6px;"></i>Administrative &amp; Police Action Petition Generator</h4>
          <p style="margin: 0; font-size: 12.5px; color: #3b82f6;">
            Review and customize the formal petition below. Once filed, it will be recorded with an official PPPI Petition Reference Number and can be printed or dispatched via police wireless / WhatsApp messenger.
          </p>
        </div>

        <form id="form-file-emergency-petition">
          <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Target Statutory Authority: <span style="color:#dc2626;">*</span></label>
            <select id="modal-petition-target" class="form-control" style="width: 100%;">
              <option value="Superintendent of Police (SP), Kolar District" ${targetAuth.includes('Superintendent') ? 'selected' : ''}>Superintendent of Police (SP), Kolar District</option>
              <option value="Deputy Commissioner & District Magistrate (DDMA), Kolar District" ${targetAuth.includes('Deputy Commissioner') ? 'selected' : ''}>Deputy Commissioner & District Magistrate (DDMA), Kolar District</option>
              <option value="Circle Police Inspector & Station House Officer (SHO), Kolar Town" ${targetAuth.includes('Circle Police') ? 'selected' : ''}>Circle Police Inspector & SHO, Local Police Station</option>
              <option value="National & State Disaster Response Force (SDRF / NDRF), Karnataka" ${targetAuth.includes('Disaster') ? 'selected' : ''}>State Disaster Response Force (SDRF / NDRF)</option>
              <option value="Karnataka State Human Rights Commission (KSHRC), Bengaluru">Karnataka State Human Rights Commission (KSHRC)</option>
            </select>
          </div>

          <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Petition Subject Line: <span style="color:#dc2626;">*</span></label>
            <input type="text" id="modal-petition-subject" class="form-control" value="${escapeHtml(defaultSubject)}" style="width: 100%; font-weight: 600;" required />
          </div>

          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Complete Petition Representation Body: <span style="color:#dc2626;">*</span></label>
            <textarea id="modal-petition-body" class="form-control" rows="12" style="font-family: inherit; font-size: 12.5px; line-height: 1.55; width: 100%;" required>${escapeHtml(defaultText)}</textarea>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-outline" id="btn-print-petition" style="border-color: #cbd5e1;">
                <i class="fa-solid fa-print" style="margin-right: 4px;"></i> Print / Export Petition
              </button>
              <button type="button" class="btn btn-outline" id="btn-copy-petition-text" style="border-color: #cbd5e1;">
                <i class="fa-solid fa-copy" style="margin-right: 4px;"></i> Copy Petition Text
              </button>
            </div>
            <button type="submit" class="btn btn-primary" id="btn-submit-file-petition" style="background: #2563eb; border-color: #2563eb; padding: 10px 20px; font-weight: 800;">
              <i class="fa-solid fa-stamp" style="margin-right: 6px;"></i> Submit &amp; Mark Petition Filed
            </button>
          </div>
        </form>
      `;

      // Copy Petition Text
      const btnCopy = document.getElementById('btn-copy-petition-text');
      if (btnCopy) {
        btnCopy.onclick = () => {
          const txt = document.getElementById('modal-petition-body')?.value || '';
          navigator.clipboard.writeText(txt).then(() => {
            btnCopy.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => {
              btnCopy.innerHTML = '<i class="fa-solid fa-copy"></i> Copy Petition Text';
            }, 2000);
          });
        };
      }

      // Print / Export Petition
      const btnPrint = document.getElementById('btn-print-petition');
      if (btnPrint) {
        btnPrint.onclick = () => {
          const txt = document.getElementById('modal-petition-body')?.value || '';
          const printWin = window.open('', '_blank');
          if (printWin) {
            printWin.document.write(`
              <html>
                <head>
                  <title>PPPI Emergency Petition - ${item.alert_no}</title>
                  <style>
                    body { font-family: 'Times New Roman', serif; padding: 40px; color: #000; line-height: 1.6; }
                    .header { border-bottom: 2px solid #b91c1c; padding-bottom: 12px; margin-bottom: 24px; text-align: center; }
                    .header h1 { margin: 0; color: #991b1b; font-size: 24px; }
                    .header h3 { margin: 4px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                    pre { font-family: 'Times New Roman', serif; font-size: 14px; white-space: pre-wrap; margin-top: 20px; }
                    .seal { margin-top: 40px; text-align: right; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h1>PASHA PEOPLE PARTY OF INDIA (PPPI)</h1>
                    <h3>Citizen Emergency Response Command &amp; Legal Taskforce</h3>
                    <small>Official HQ: Dalasanur, Srinivaspur Taluk, Kolar District | 24/7 Helpline: +91 7259798393</small>
                  </div>
                  <pre>${txt}</pre>
                  <div class="seal">
                    <p>___________________________<br />Authorized Legal Signatory<br />PPPI Citizen Action Taskforce</p>
                  </div>
                  <script>window.print();</script>
                </body>
              </html>
            `);
            printWin.document.close();
          }
        };
      }

      // Submit Petition Form
      const pForm = document.getElementById('form-file-emergency-petition');
      if (pForm) {
        pForm.onsubmit = async (e) => {
          e.preventDefault();
          const target = document.getElementById('modal-petition-target')?.value?.trim();
          const subj = document.getElementById('modal-petition-subject')?.value?.trim();
          const pBody = document.getElementById('modal-petition-body')?.value?.trim();

          try {
            const ok = await apiFileEmergencyPetition(item.id, {
              petition_filed_to: target,
              petition_subject: subj,
              petition_text: pBody,
              assigned_officer: 'PPPI Legal Emergency Action Wing',
              action_taken: `Official emergency petition filed to ${target}.`
            });

            if (ok) {
              alert('Emergency Petition filed successfully!');
              appData.emergencyAlerts = await apiGetEmergencyAlerts();
              updateBadges();
              renderEmergenciesView();
              modal.style.display = 'none';
            } else {
              alert('Failed to file petition.');
            }
          } catch (err) {
            alert('Error: ' + err.message);
          }
        };
      }
    } else if (tabName === 'dispatch') {
      body.innerHTML = `
        <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 10px; padding: 14px 18px; margin-bottom: 18px;">
          <h4 style="margin: 0 0 6px 0; color: #9d174d; font-size: 14px;"><i class="fa-solid fa-user-shield" style="margin-right: 6px;"></i>Officer Assignment &amp; Ground Dispatch Controls</h4>
          <p style="margin: 0; font-size: 12.5px; color: #be185d;">
            Update incident stage, assign response coordinators, or mark resolved once police or disaster teams confirm safety.
          </p>
        </div>

        <form id="form-update-emergency-status">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Incident Alert Status: <span style="color:#dc2626;">*</span></label>
              <select id="modal-emergency-status" class="form-control" style="width: 100%;">
                <option value="ACTIVE_ALERT" ${item.status === 'ACTIVE_ALERT' ? 'selected' : ''}>ACTIVE ALERT (Live Danger)</option>
                <option value="INVESTIGATING" ${item.status === 'INVESTIGATING' ? 'selected' : ''}>INVESTIGATING / CALLING VICTIM</option>
                <option value="PETITION_FILED" ${item.status === 'PETITION_FILED' ? 'selected' : ''}>PETITION FILED TO AUTHORITIES</option>
                <option value="DISPATCHED_TO_AUTHORITIES" ${item.status === 'DISPATCHED_TO_AUTHORITIES' ? 'selected' : ''}>DISPATCHED TO POLICE / SDRF</option>
                <option value="RESOLVED" ${item.status === 'RESOLVED' ? 'selected' : ''}>RESOLVED / CITIZEN PROTECTED</option>
                <option value="FALSE_ALARM" ${item.status === 'FALSE_ALARM' ? 'selected' : ''}>FALSE ALARM / DISMISSED</option>
              </select>
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Assigned Response Commander:</label>
              <input type="text" id="modal-emergency-officer" class="form-control" value="${escapeHtml(item.assigned_officer || '')}" placeholder="e.g. Adv. S. K. Venkatesh (Citizen Legal Taskforce)" style="width: 100%;" />
            </div>
          </div>

          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Action Taken Log:</label>
            <textarea id="modal-emergency-action" class="form-control" rows="3" placeholder="Log details of police deployment, volunteer rescue, ambulance dispatch, or FIR registration..." style="width: 100%;">${escapeHtml(item.action_taken || '')}</textarea>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Internal Administrative Notes:</label>
            <textarea id="modal-emergency-notes" class="form-control" rows="2" placeholder="Internal remarks, victim follow-up instructions..." style="width: 100%;">${escapeHtml(item.admin_notes || '')}</textarea>
          </div>

          <div style="text-align: right;">
            <button type="submit" class="btn btn-primary" id="btn-save-emergency-status" style="background: #991b1b; border-color: #991b1b;">
              <i class="fa-solid fa-floppy-disk" style="margin-right: 6px;"></i> Save Status &amp; Dispatch Updates
            </button>
          </div>
        </form>
      `;

      const statusForm = document.getElementById('form-update-emergency-status');
      if (statusForm) {
        statusForm.onsubmit = async (e) => {
          e.preventDefault();
          const status = document.getElementById('modal-emergency-status')?.value;
          const assigned_officer = document.getElementById('modal-emergency-officer')?.value?.trim();
          const action_taken = document.getElementById('modal-emergency-action')?.value?.trim();
          const admin_notes = document.getElementById('modal-emergency-notes')?.value?.trim();

          try {
            const ok = await apiUpdateEmergencyAlert(item.id, {
              status,
              assigned_officer,
              action_taken,
              admin_notes
            });

            if (ok) {
              alert('Emergency status and officer assignment updated successfully!');
              appData.emergencyAlerts = await apiGetEmergencyAlerts();
              updateBadges();
              renderEmergenciesView();
              modal.style.display = 'none';
            } else {
              alert('Failed to update emergency alert.');
            }
          } catch (err) {
            alert('Error: ' + err.message);
          }
        };
      }
    }
  }

  // Set up tab switching
  document.getElementById('tab-btn-dossier').onclick = () => renderTab('dossier');
  document.getElementById('tab-btn-petition').onclick = () => renderTab('petition');
  document.getElementById('tab-btn-dispatch').onclick = () => renderTab('dispatch');

  // Render initial tab
  renderTab(initialTab);
  modal.style.display = 'flex';
}

function setupEmergencyAdminListeners() {
  const searchInp = document.getElementById('emergency-filter-search');
  if (searchInp) {
    searchInp.oninput = () => renderEmergenciesView();
  }

  const catSelect = document.getElementById('emergency-filter-category');
  if (catSelect) {
    catSelect.onchange = () => renderEmergenciesView();
  }

  const sevSelect = document.getElementById('emergency-filter-severity');
  if (sevSelect) {
    sevSelect.onchange = () => renderEmergenciesView();
  }

  const statusSelect = document.getElementById('emergency-filter-status');
  if (statusSelect) {
    statusSelect.onchange = () => renderEmergenciesView();
  }

  const refreshBtn = document.getElementById('btn-refresh-emergencies');
  if (refreshBtn) {
    refreshBtn.onclick = async () => {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
      appData.emergencyAlerts = await apiGetEmergencyAlerts();
      updateBadges();
      renderEmergenciesView();
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Refresh SOS Queue';
    };
  }

  // Siren Mute Button
  const muteBtn = document.getElementById('btn-toggle-siren');
  const sirenIcon = document.getElementById('siren-sound-icon');
  if (muteBtn && sirenIcon) {
    muteBtn.onclick = () => {
      isSirenMuted = !isSirenMuted;
      if (isSirenMuted) {
        sirenIcon.className = 'fa-solid fa-volume-xmark';
        muteBtn.title = 'Unmute Siren Audio';
      } else {
        sirenIcon.className = 'fa-solid fa-volume-high';
        muteBtn.title = 'Mute Siren Audio';
      }
    };
  }

  // Dismiss Banner Button
  const dismissBtn = document.getElementById('btn-dismiss-emergency-banner');
  const banner = document.getElementById('emergency-live-banner');
  if (dismissBtn && banner) {
    dismissBtn.onclick = () => {
      banner.style.display = 'none';
    };
  }
}


/* ==========================================================================
   PPPI Elections & Karnataka 224 Constituencies Directory Admin Controller
   ========================================================================== */

function renderElectionsView() {
  const tbody = document.getElementById('tbody-election-constituencies');
  if (!tbody) return;

  const elections = appData.elections || [];
  const selectedElectionId = Number(appData.selectedElectionId || 1);
  const selectedElection = elections.find(e => e.id === selectedElectionId) || elections[0] || {
    id: 1,
    title: '2028 Karnataka Legislative Assembly Election (CM Election)',
    code: 'KA-2028-LA',
    status: 'UPCOMING',
    total_seats: 224,
    description: 'General Assembly Election to the 16th Karnataka Legislative Assembly.'
  };

  // 1. Update Election Switcher Dropdown
  const selectSwitch = document.getElementById('admin-select-election-switch');
  if (selectSwitch && elections.length > 0) {
    selectSwitch.innerHTML = elections.map(e => `
      <option value="${e.id}" ${e.id === selectedElectionId ? 'selected' : ''}>
        ${e.code} - ${e.title}
      </option>
    `).join('');
  }

  // 2. Update Election Profile Card
  const codeBadge = document.getElementById('admin-election-code-badge');
  if (codeBadge) codeBadge.textContent = selectedElection.code || 'KA-2028-LA';

  const statusBadge = document.getElementById('admin-election-status-badge');
  if (statusBadge) statusBadge.textContent = selectedElection.status || 'UPCOMING';

  const titleDisplay = document.getElementById('admin-election-title-display');
  if (titleDisplay) titleDisplay.textContent = selectedElection.title;

  const descDisplay = document.getElementById('admin-election-desc-display');
  if (descDisplay) descDisplay.textContent = selectedElection.description || selectedElection.manifesto_theme || '';

  // 3. Update KPI Metrics
  const constituencies = appData.constituencies || [];
  const declaredCount = constituencies.filter(c => c.candidate_name).length;
  const vacantCount = constituencies.length - declaredCount;
  const eligibleCount = (appData.eligibleCandidates || []).length;

  const kpiTotal = document.getElementById('kpi-elections-total-seats');
  if (kpiTotal) kpiTotal.textContent = constituencies.length || selectedElection.total_seats || 224;

  const kpiDeclared = document.getElementById('kpi-elections-declared-seats');
  if (kpiDeclared) kpiDeclared.textContent = declaredCount;

  const kpiVacant = document.getElementById('kpi-elections-vacant-seats');
  if (kpiVacant) kpiVacant.textContent = vacantCount;

  const kpiEligible = document.getElementById('kpi-elections-eligible-members');
  if (kpiEligible) kpiEligible.textContent = eligibleCount;

  // 4. Update District Filter Dropdown (populate if only default option exists)
  const districtSelect = document.getElementById('election-filter-district');
  if (districtSelect && districtSelect.options.length <= 1) {
    const districts = [...new Set(constituencies.map(c => c.district).filter(Boolean))].sort();
    districtSelect.innerHTML = '<option value="ALL">All 31 Districts</option>' +
      districts.map(d => `<option value="${d}">${d}</option>`).join('');
    if (appData.electionDistrictFilter) {
      districtSelect.value = appData.electionDistrictFilter;
    }
  }

  // 5. Filter Table Data
  const searchVal = (document.getElementById('election-filter-search')?.value || appData.electionSearchQuery || '').toLowerCase().trim();
  const districtVal = document.getElementById('election-filter-district')?.value || appData.electionDistrictFilter || 'ALL';
  const statusVal = document.getElementById('election-filter-status')?.value || appData.electionStatusFilter || 'ALL';

  let list = [...constituencies];

  if (districtVal !== 'ALL') {
    list = list.filter(c => (c.district || '').toLowerCase() === districtVal.toLowerCase());
  }

  if (statusVal === 'DECLARED') {
    list = list.filter(c => Boolean(c.candidate_name));
  } else if (statusVal === 'OPEN') {
    list = list.filter(c => !c.candidate_name);
  }

  if (searchVal) {
    list = list.filter(c =>
      (c.constituency_no || '').toString().includes(searchVal) ||
      (c.name || '').toLowerCase().includes(searchVal) ||
      (c.district || '').toLowerCase().includes(searchVal) ||
      (c.candidate_name || '').toLowerCase().includes(searchVal)
    );
  }

  // Update table count badge
  const countBadge = document.getElementById('admin-constituencies-count-badge');
  if (countBadge) countBadge.textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 48px 20px; color: var(--text-muted);">
          <div style="font-size:36px; margin-bottom:12px; color:#cbd5e1;"><i class="fa-solid fa-filter-circle-xmark"></i></div>
          <div style="font-size:16px; font-weight:700; color:var(--text-primary); margin-bottom:6px;">No Constituencies Found</div>
          <div style="font-size:13px;">No assembly constituencies match the current filter or search criteria.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(c => {
    const isDeclared = Boolean(c.candidate_name);
    const electorsStr = Number(c.total_electors || 0).toLocaleString('en-IN');
    const catBadgeStyle = c.category === 'SC'
      ? 'background:#fef3c7; color:#92400e;'
      : (c.category === 'ST' ? 'background:#ede9fe; color:#5b21b6;' : 'background:#e0e7ff; color:#3730a3;');

    return `
      <tr>
        <td>
          <span style="font-weight: 800; font-size: 13px; color: #2563eb; background: #eff6ff; padding: 4px 8px; border-radius: 6px;">
            #${c.constituency_no}
          </span>
        </td>
        <td>
          <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${c.name}</div>
          <div style="margin-top: 3px;">
            <span class="badge" style="${catBadgeStyle} font-size: 10px; padding: 2px 7px;">
              ${c.category || 'GEN'}
            </span>
          </div>
        </td>
        <td>
          <div style="font-weight: 600; color: #334155;">${c.district}</div>
        </td>
        <td>
          <span style="font-size: 13px; color: var(--text-muted);">${electorsStr} Electors</span>
        </td>
        <td>
          ${isDeclared ? `
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="${c.candidate_photo || '/images/founder.jpg'}" 
                   style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid #2563eb;" 
                   onerror="this.src='/images/founder.jpg'" />
              <div>
                <div style="font-weight: 700; font-size: 13px; color: var(--text-primary);">${c.candidate_name}</div>
                <div style="font-size: 11px; color: #2563eb; font-weight: 600;">
                  <i class="fa-solid fa-crown" style="font-size:10px;"></i> ${c.candidate_plan || 'Paid Member'}
                </div>
                ${c.candidate_phone ? `<div style="font-size: 11px; color: var(--text-muted);">${c.candidate_phone}</div>` : ''}
              </div>
            </div>
          ` : `
            <span style="color: #94a3b8; font-size: 12px; font-style: italic; display:inline-flex; align-items:center; gap:5px;">
              <i class="fa-regular fa-circle-question"></i> No Candidate Nominated
            </span>
          `}
        </td>
        <td>
          ${isDeclared ? `
            <span class="badge" style="background:#d1fae5; color:#065f46; font-weight: 700; padding: 5px 10px;">
              <i class="fa-solid fa-circle-check"></i> DECLARED
            </span>
          ` : `
            <span class="badge" style="background:#fef3c7; color:#92400e; font-weight: 600; padding: 5px 10px;">
              <i class="fa-solid fa-clock"></i> OPEN
            </span>
          `}
        </td>
        <td style="text-align: right;">
          <div style="display:inline-flex; gap: 6px; justify-content: flex-end;">
            <button class="btn btn-sm btn-primary btn-nominate-candidate" data-cid="${c.id}" title="${isDeclared ? 'Change Candidate' : 'Nominate Paid Member'}">
              <i class="fa-solid ${isDeclared ? 'fa-user-pen' : 'fa-user-plus'}"></i> ${isDeclared ? 'Change' : 'Nominate'}
            </button>
            ${isDeclared ? `
              <button class="btn btn-sm btn-outline btn-remove-candidate" data-cid="${c.id}" title="Remove Candidate" style="color:#dc2626; border-color:#fca5a5; padding: 4px 8px;">
                <i class="fa-solid fa-user-xmark"></i>
              </button>
            ` : ''}
            <button class="btn btn-sm btn-outline btn-edit-constituency" data-cid="${c.id}" title="Edit Constituency Info" style="padding: 4px 8px;">
              <i class="fa-solid fa-pen"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach Table Row Action Handlers
  tbody.querySelectorAll('.btn-nominate-candidate').forEach(btn => {
    btn.onclick = () => {
      const cId = parseInt(btn.getAttribute('data-cid'), 10);
      openAssignCandidateModal(cId);
    };
  });

  tbody.querySelectorAll('.btn-remove-candidate').forEach(btn => {
    btn.onclick = async () => {
      const cId = parseInt(btn.getAttribute('data-cid'), 10);
      const constItem = (appData.constituencies || []).find(c => c.id === cId);
      const name = constItem ? constItem.name : `#${cId}`;
      const ok = confirm(`Are you sure you want to remove candidate ${constItem?.candidate_name || ''} from constituency ${name}?`);
      if (!ok) return;

      try {
        await apiRemoveCandidate(cId);
        alert(`Candidate removed from constituency ${name}.`);
        // Refresh constituencies
        const cRes = await apiGetConstituencies({ election_id: appData.selectedElectionId || 1 });
        if (cRes && cRes.data) {
          appData.constituencies = cRes.data;
        }
        renderElectionsView();
      } catch (err) {
        alert('Failed to remove candidate: ' + err.message);
      }
    };
  });

  tbody.querySelectorAll('.btn-edit-constituency').forEach(btn => {
    btn.onclick = () => {
      const cId = parseInt(btn.getAttribute('data-cid'), 10);
      openEditConstituencyModal(cId);
    };
  });
}

// Open Assign/Nominate Candidate Modal
function openAssignCandidateModal(cId) {
  const modal = document.getElementById('modal-assign-candidate');
  if (!modal) return;

  const constituency = (appData.constituencies || []).find(c => c.id === Number(cId));
  if (!constituency) return;

  // Set Constituency Banner
  document.getElementById('nominate-input-const-id').value = constituency.id;
  document.getElementById('nominate-banner-sub').textContent = `AC #${constituency.constituency_no} Nomination`;
  document.getElementById('nominate-banner-title').textContent = `AC #${constituency.constituency_no} - ${constituency.name} (${constituency.category || 'GEN'})`;
  document.getElementById('nominate-banner-district').textContent = `${constituency.district} District · ${Number(constituency.total_electors || 0).toLocaleString('en-IN')} Registered Electors`;

  document.getElementById('nominate-input-vision').value = constituency.campaign_vision || '';
  document.getElementById('nominate-input-bio').value = constituency.candidate_bio || '';

  // Populate Eligible Paid Members Dropdown
  const selectMember = document.getElementById('nominate-select-candidate');
  const eligible = appData.eligibleCandidates || [];
  const eligibleCountLabel = document.getElementById('nominate-eligible-count');
  if (eligibleCountLabel) {
    eligibleCountLabel.textContent = `${eligible.length} Eligible Paid Members Available`;
  }

  selectMember.innerHTML = '<option value="">-- Choose Eligible Paid Member --</option>' +
    eligible.map(u => `
      <option value="${u.id}" 
              data-name="${u.name}" 
              data-phone="${u.phone || ''}" 
              data-email="${u.email || ''}" 
              data-photo="${u.profile_image || '/images/founder.jpg'}" 
              data-plan="${u.active_plan_name || 'Paid Member'}"
              ${constituency.candidate_id === u.id ? 'selected' : ''}>
        ${u.name} (${u.phone || u.email || 'Member'} - ${u.active_plan_name || 'Active'})
      </option>
    `).join('');

  // If candidate is already nominated and was not in the eligible list (e.g. pre-seeded Pasha), include them
  if (constituency.candidate_id && !eligible.find(u => u.id === constituency.candidate_id)) {
    const opt = document.createElement('option');
    opt.value = constituency.candidate_id;
    opt.dataset.name = constituency.candidate_name;
    opt.dataset.phone = constituency.candidate_phone || '';
    opt.dataset.email = constituency.candidate_email || '';
    opt.dataset.photo = constituency.candidate_photo || '/images/founder.jpg';
    opt.dataset.plan = constituency.candidate_plan || 'Party Leadership Plan';
    opt.textContent = `${constituency.candidate_name} (Current Nominee - ${constituency.candidate_plan})`;
    opt.selected = true;
    selectMember.appendChild(opt);
  }

  // Preview Box
  const previewBox = document.getElementById('nominate-candidate-preview');
  function updateCandidatePreview() {
    const selectedOpt = selectMember.selectedOptions[0];
    if (selectedOpt && selectedOpt.value) {
      previewBox.style.display = 'block';
      document.getElementById('nominate-preview-name').textContent = selectedOpt.dataset.name || selectedOpt.textContent;
      document.getElementById('nominate-preview-details').textContent = `${selectedOpt.dataset.phone || ''} · ${selectedOpt.dataset.email || ''}`;
      document.getElementById('nominate-preview-photo').src = selectedOpt.dataset.photo || '/images/founder.jpg';
      document.getElementById('nominate-preview-plan-badge').innerHTML = `
        <span class="badge" style="background:#2563eb; color:white; font-size:11px;">
          <i class="fa-solid fa-crown" style="font-size:10px;"></i> ${selectedOpt.dataset.plan || 'Paid Member'}
        </span>
      `;
    } else {
      previewBox.style.display = 'none';
    }
  }

  selectMember.onchange = updateCandidatePreview;
  updateCandidatePreview();

  // Remove Candidate button in modal
  const btnRemoveModal = document.getElementById('btn-nominate-remove-candidate');
  if (btnRemoveModal) {
    if (constituency.candidate_name) {
      btnRemoveModal.style.display = 'inline-block';
      btnRemoveModal.onclick = async () => {
        const ok = confirm(`Are you sure you want to remove ${constituency.candidate_name} as the candidate for ${constituency.name}?`);
        if (!ok) return;
        try {
          await apiRemoveCandidate(constituency.id);
          modal.style.display = 'none';
          alert('Candidate removed successfully.');
          const cRes = await apiGetConstituencies({ election_id: appData.selectedElectionId || 1 });
          if (cRes && cRes.data) {
            appData.constituencies = cRes.data;
          }
          renderElectionsView();
        } catch (e) {
          alert('Failed to remove candidate: ' + e.message);
        }
      };
    } else {
      btnRemoveModal.style.display = 'none';
    }
  }

  modal.style.display = 'flex';
}

// Open Edit Constituency Modal
function openEditConstituencyModal(cId) {
  const modal = document.getElementById('modal-edit-constituency');
  if (!modal) return;

  const constituency = (appData.constituencies || []).find(c => c.id === Number(cId));
  if (!constituency) return;

  document.getElementById('edit-const-id').value = constituency.id;
  document.getElementById('edit-const-no').value = constituency.constituency_no;
  document.getElementById('edit-const-name').value = constituency.name;
  document.getElementById('edit-const-district').value = constituency.district;
  document.getElementById('edit-const-category').value = constituency.category || 'GEN';
  document.getElementById('edit-const-electors').value = constituency.total_electors || '';

  modal.style.display = 'flex';
}

// Setup Event Listeners for Elections Admin
function setupElectionAdminListeners() {
  // 1. Filter Search
  const searchInp = document.getElementById('election-filter-search');
  if (searchInp) {
    searchInp.oninput = () => {
      appData.electionSearchQuery = searchInp.value;
      renderElectionsView();
    };
  }

  // 2. District Filter
  const districtSelect = document.getElementById('election-filter-district');
  if (districtSelect) {
    districtSelect.onchange = () => {
      appData.electionDistrictFilter = districtSelect.value;
      renderElectionsView();
    };
  }

  // 3. Status Filter
  const statusSelect = document.getElementById('election-filter-status');
  if (statusSelect) {
    statusSelect.onchange = () => {
      appData.electionStatusFilter = statusSelect.value;
      renderElectionsView();
    };
  }

  // 4. Reset Filters Button
  const btnReset = document.getElementById('btn-reset-election-filter');
  if (btnReset) {
    btnReset.onclick = () => {
      if (searchInp) searchInp.value = '';
      if (districtSelect) districtSelect.value = 'ALL';
      if (statusSelect) statusSelect.value = 'ALL';
      appData.electionSearchQuery = '';
      appData.electionDistrictFilter = 'ALL';
      appData.electionStatusFilter = 'ALL';
      renderElectionsView();
    };
  }

  // 5. Refresh Elections Directory
  const btnRefresh = document.getElementById('btn-refresh-elections');
  if (btnRefresh) {
    btnRefresh.onclick = async () => {
      btnRefresh.disabled = true;
      btnRefresh.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
      try {
        appData.elections = await apiGetElections();
        const cRes = await apiGetConstituencies({ election_id: appData.selectedElectionId || 1 });
        if (cRes && cRes.data) {
          appData.constituencies = cRes.data;
        }
        appData.eligibleCandidates = await apiGetEligibleCandidates();
        renderElectionsView();
        alert('Elections and Constituencies directory refreshed successfully!');
      } catch (e) {
        alert('Refresh failed: ' + e.message);
      } finally {
        btnRefresh.disabled = false;
        btnRefresh.innerHTML = '<i class="fa-solid fa-rotate"></i> Refresh Directory';
      }
    };
  }

  // 6. Switch Election Campaign Dropdown
  const selectSwitch = document.getElementById('admin-select-election-switch');
  if (selectSwitch) {
    selectSwitch.onchange = async (e) => {
      const elId = Number(e.target.value);
      appData.selectedElectionId = elId;
      showTopLoader();
      try {
        const cRes = await apiGetConstituencies({ election_id: elId });
        if (cRes && cRes.data) {
          appData.constituencies = cRes.data;
        }
        renderElectionsView();
      } catch (err) {
        alert('Failed to switch election: ' + err.message);
      } finally {
        hideTopLoader();
      }
    };
  }

  // 7. Open Create Election Modal
  const btnOpenCreate = document.getElementById('btn-open-create-election');
  const modalCreateEl = document.getElementById('modal-create-election');
  if (btnOpenCreate && modalCreateEl) {
    btnOpenCreate.onclick = () => {
      modalCreateEl.style.display = 'flex';
    };
  }

  // 8. Create Election Form Submit
  const formCreateElection = document.getElementById('form-create-election');
  if (formCreateElection) {
    formCreateElection.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        title: document.getElementById('election-input-title').value.trim(),
        code: document.getElementById('election-input-code').value.trim(),
        election_type: document.getElementById('election-input-type').value,
        state: document.getElementById('election-input-state').value.trim(),
        year: parseInt(document.getElementById('election-input-year').value, 10),
        total_seats: parseInt(document.getElementById('election-input-total-seats').value, 10),
        target_seats: parseInt(document.getElementById('election-input-target-seats').value, 10) || null,
        manifesto_theme: document.getElementById('election-input-theme').value.trim(),
        description: document.getElementById('election-input-desc').value.trim()
      };

      try {
        const newEl = await apiCreateElection(payload);
        alert(`Election "${payload.title}" created successfully!`);
        formCreateElection.reset();
        modalCreateEl.style.display = 'none';

        appData.elections = await apiGetElections();
        appData.selectedElectionId = newEl.id || appData.elections[appData.elections.length - 1]?.id;
        const cRes = await apiGetConstituencies({ election_id: appData.selectedElectionId });
        if (cRes && cRes.data) {
          appData.constituencies = cRes.data;
        }
        renderElectionsView();
      } catch (err) {
        alert('Failed to create election: ' + err.message);
      }
    };
  }

  // 9. Candidate Nomination Form Submit (Paid Members Only)
  const formNominate = document.getElementById('form-nominate-candidate');
  const modalNominate = document.getElementById('modal-assign-candidate');
  if (formNominate && modalNominate) {
    formNominate.onsubmit = async (e) => {
      e.preventDefault();
      const constId = parseInt(document.getElementById('nominate-input-const-id').value, 10);
      const userId = parseInt(document.getElementById('nominate-select-candidate').value, 10);
      const vision = document.getElementById('nominate-input-vision').value.trim();
      const bio = document.getElementById('nominate-input-bio').value.trim();

      if (!constId || !userId) {
        alert('Please select an eligible paid member to nominate.');
        return;
      }

      const saveBtn = document.getElementById('btn-save-nomination');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validating & Nominating...';

      try {
        const res = await apiAssignCandidate(constId, {
          user_id: userId,
          campaign_vision: vision,
          candidate_bio: bio
        });

        if (res && (res.success || res.status === 200)) {
          alert('Party Candidate nominated successfully for the constituency!');
          modalNominate.style.display = 'none';
          // Refresh constituencies
          const cRes = await apiGetConstituencies({ election_id: appData.selectedElectionId || 1 });
          if (cRes && cRes.data) {
            appData.constituencies = cRes.data;
          }
          renderElectionsView();
        } else {
          alert((res && res.message) || 'Failed to nominate candidate. Please verify membership status.');
        }
      } catch (err) {
        alert('Candidate Nomination Error: ' + err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Confirm Nomination';
      }
    };
  }

  // 10. Edit Constituency Form Submit
  const formEditConst = document.getElementById('form-edit-constituency');
  const modalEditConst = document.getElementById('modal-edit-constituency');
  if (formEditConst && modalEditConst) {
    formEditConst.onsubmit = async (e) => {
      e.preventDefault();
      const constId = parseInt(document.getElementById('edit-const-id').value, 10);
      const payload = {
        name: document.getElementById('edit-const-name').value.trim(),
        district: document.getElementById('edit-const-district').value.trim(),
        category: document.getElementById('edit-const-category').value,
        total_electors: parseInt(document.getElementById('edit-const-electors').value, 10) || 0
      };

      try {
        await apiUpdateConstituency(constId, payload);
        alert('Constituency information updated successfully!');
        modalEditConst.style.display = 'none';

        const cRes = await apiGetConstituencies({ election_id: appData.selectedElectionId || 1 });
        if (cRes && cRes.data) {
          appData.constituencies = cRes.data;
        }
        renderElectionsView();
      } catch (err) {
        alert('Failed to update constituency: ' + err.message);
      }
    };
  }
}
