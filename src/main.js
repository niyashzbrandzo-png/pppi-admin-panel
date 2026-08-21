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
  joinRequests: []
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
    const [users, posts, plans, events, donations, funds, notifResult, liveStreams, enquiries, joinRequests] = await Promise.all([
      apiGetUsers(),
      apiGetPosts(),
      apiGetPlans(),
      apiGetEvents(),
      apiGetDonations(),
      apiGetFunds(),
      apiGetNotifications(),
      apiGetLiveStreams(),
      apiGetEnquiries(),
      apiGetJoinRequests()
    ]);

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
    populateUserNotificationDropdown();
  } catch (err) {
    console.error('Error initializing admin app data:', err);
  } finally {
    hideTopLoader();
  }
}

// Update Badges & Counters
function updateBadges() {
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
  document.getElementById('settings-api-url').value = getApiBaseUrl();

  document.getElementById('btn-save-settings').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    setBtnLoading(btn, true, 'Saving Settings...');
    try {
      const newUrl = document.getElementById('settings-api-url').value.trim();
      setApiBaseUrl(newUrl);
      alert(`Backend API URL updated to: ${newUrl}`);
      showScreenLoader('Reloading with updated API configuration...');
      await loadAllData();
    } finally {
      setBtnLoading(btn, false);
      hideScreenLoader();
    }
  });
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

  if (!tbody) return;
  tbody.innerHTML = '';

  if (!appData.enquiries || appData.enquiries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">No website contact enquiries received yet.</td></tr>`;
    return;
  }

  appData.enquiries.forEach(item => {
    const tr = document.createElement('tr');
    const dateText = item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent';

    tr.innerHTML = `
      <td><code>#${item.id}</code></td>
      <td><strong>${item.name}</strong></td>
      <td>
        <div style="font-size:13px; color:var(--text-primary);">${item.email}</div>
        <div style="font-size:12px; color:var(--text-muted);">${item.phone || 'N/A'}</div>
      </td>
      <td><span class="pill-tag">${item.subject || 'General'}</span></td>
      <td style="max-width:300px; font-size:13px; color:var(--text-secondary); line-height:1.4;">${item.message}</td>
      <td style="font-size:12px; color:var(--text-muted);">${dateText}</td>
      <td>
        <button class="btn btn-sm btn-outline btn-delete-enquiry" data-id="${item.id}" style="color:var(--accent-rose);">
          <i class="fa-solid fa-trash"></i> Delete
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
