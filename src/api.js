/* ==========================================================================
   PPPI Admin Portal - API Integration Layer
   Target Server: http://localhost:5000/api
   ========================================================================== */

const DEFAULT_API_URL = "https://api.pppiconnect.com/api";

let API_BASE_URL =
  localStorage.getItem('pppi_api_url') ||
  DEFAULT_API_URL;

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function setApiBaseUrl(url) {
  API_BASE_URL = url;
  localStorage.setItem('pppi_api_url', url);
}

/* ==========================================================================
   Admin Authentication Layer
   ========================================================================== */
export function getAdminToken() {
  return localStorage.getItem('pppi_admin_token') || sessionStorage.getItem('pppi_admin_token') || null;
}

export async function apiLoginAdmin(phone, password, rememberMe = false) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: String(phone).trim(),
      password: String(password).trim(),
      client_type: 'admin'
    })
  });

  const data = await res.json();

  if (!res.ok || data.status !== 200) {
    throw new Error(data.message || 'Login failed. Invalid admin credentials.');
  }

  const token = data.data?.token;
  if (!token) {
    throw new Error('Invalid authentication response from server.');
  }

  localStorage.setItem('pppi_admin_token', token);
  localStorage.setItem('pppi_admin_user', JSON.stringify(data.data.user));
  sessionStorage.setItem('pppi_admin_token', token);
  sessionStorage.setItem('pppi_admin_user', JSON.stringify(data.data.user));

  return data;
}

export function apiLogoutAdmin() {
  localStorage.removeItem('pppi_admin_token');
  localStorage.removeItem('pppi_admin_user');
  sessionStorage.removeItem('pppi_admin_token');
  sessionStorage.removeItem('pppi_admin_user');
}

// Demo fallback mock data when server is offline or empty
const MOCK_USERS = [
  {
    id: 1,
    name: 'Ravi Kumar',
    email: 'ravi.kumar@example.com',
    phone: '9876543210',
    role: 'ADMIN',
    status: true,
    is_paid: true,
    createdat: '2026-01-15T10:00:00Z',
    father_name: 'Suresh Kumar',
    blood_group: 'O+',
    district: 'Chennai',
    state_ut: 'Tamil Nadu'
  },
  {
    id: 2,
    name: 'Ananya Sharma',
    email: 'ananya.s@example.com',
    phone: '9812345678',
    role: 'USER',
    status: true,
    is_paid: true,
    createdat: '2026-02-10T14:30:00Z',
    father_name: 'Ramesh Sharma',
    blood_group: 'B+',
    district: 'Bangalore',
    state_ut: 'Karnataka'
  },
  {
    id: 3,
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    phone: '9765432109',
    role: 'USER',
    status: true,
    is_paid: false,
    createdat: '2026-03-01T09:15:00Z',
    father_name: 'Mahipal Singh',
    blood_group: 'A+',
    district: 'Jaipur',
    state_ut: 'Rajasthan'
  },
  {
    id: 4,
    name: 'Priya Sundaram',
    email: 'priya.sundaram@example.com',
    phone: '9654321098',
    role: 'USER',
    status: false,
    is_paid: true,
    createdat: '2026-03-12T16:20:00Z',
    father_name: 'Sundaram K',
    blood_group: 'AB+',
    district: 'Coimbatore',
    state_ut: 'Tamil Nadu'
  }
];

const MOCK_POSTS = [
  {
    id: 101,
    user_id: 1,
    user: { id: 1, name: 'Ravi Kumar', profile_image: '' },
    description: 'Welcome to the PPPI Community Platform! Excited to share our new digital initiatives.',
    images: [{ id: 1, image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80' }],
    total_likes: 24,
    total_comments: 8,
    total_shares: 5,
    status: true,
    created_at: '2026-03-20T11:00:00Z'
  },
  {
    id: 102,
    user_id: 2,
    user: { id: 2, name: 'Ananya Sharma', profile_image: '' },
    description: 'Great workshop on youth empowerment organized by PPPI team today in Bangalore.',
    images: [{ id: 2, image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80' }],
    total_likes: 45,
    total_comments: 14,
    total_shares: 12,
    status: true,
    created_at: '2026-03-22T15:30:00Z'
  }
];

const MOCK_PLANS = [
  {
    id: 1,
    plan_name: 'Gold Membership Plan',
    price: 15000.00,
    is_free: false,
    is_popular: true,
    status: true,
    plan_benefits: [
      { id: 1, benefit: 'Full Voting & General Body Access' },
      { id: 2, benefit: 'Priority Event Invitations' },
      { id: 3, benefit: 'Official ID Card & Member Badge' },
      { id: 4, benefit: 'Direct Representative Connect' }
    ]
  },
  {
    id: 2,
    plan_name: 'Silver Membership Plan',
    price: 5000.00,
    is_free: false,
    is_popular: false,
    status: true,
    plan_benefits: [
      { id: 5, benefit: 'Community Member Access' },
      { id: 6, benefit: 'Digital Newsletter & Updates' },
      { id: 7, benefit: 'Event Participation' }
    ]
  },
  {
    id: 3,
    plan_name: 'Student & Youth Membership',
    price: 0.00,
    is_free: true,
    is_popular: false,
    status: true,
    plan_benefits: [
      { id: 8, benefit: 'Free Access to Youth Workshops' },
      { id: 9, benefit: 'Volunteer Recognition Certificate' }
    ]
  }
];

let MOCK_EVENTS = [
  {
    id: 1,
    title: 'PPPI Annual Leadership Conference 2026',
    date: '2026-08-15',
    time: '10:00 AM',
    venue: 'Chennai Trade Center, Chennai',
    banner: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    description: 'Join party leaders, policy makers, and active members for our annual strategy conference.'
  },
  {
    id: 2,
    title: 'Youth Political Engagement Workshop',
    date: '2026-09-02',
    time: '02:30 PM',
    venue: 'Town Hall, Bangalore',
    banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    description: 'Interactive session focusing on youth leadership and civic technology.'
  }
];

const MOCK_DONATIONS = [
  { id: 'TXN-9021', donor: 'Ravi Kumar', fund: 'Gold Membership Fee', amount: 15000, method: 'Razorpay UPI', status: 'SUCCESS', date: '2026-03-24 14:22' },
  { id: 'TXN-9022', donor: 'Ananya Sharma', fund: 'Development Fund', amount: 5000, method: 'Razorpay Card', status: 'SUCCESS', date: '2026-03-25 11:05' },
  { id: 'TXN-9023', donor: 'Karthik Raja', fund: 'Event Sponsorship', amount: 25000, method: 'Netbanking', status: 'SUCCESS', date: '2026-03-26 16:45' },
  { id: 'TXN-9024', donor: 'Priya Sundaram', fund: 'Gold Membership Fee', amount: 15000, method: 'Razorpay GPay', status: 'SUCCESS', date: '2026-03-27 09:30' }
];

/* Helper HTTP Request wrapper */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const token = getAdminToken();
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      },
      ...options
    });
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API Call Failed: ${endpoint}] Falling back to mock/demo handler`, err);
    return null;
  }
}

/* 1. USERS API */
export async function apiGetUsers() {

  const data = await request('/users');
  if (data && data.data && data.data.length > 0) {
    return data.data;
  }
  return MOCK_USERS;
}

export async function apiUpdateUser(userId, updateData) {
  const data = await request(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
  if (data && data.data) {
    return data.data;
  }
  // Mock local update fallback
  const index = MOCK_USERS.findIndex(u => u.id === Number(userId));
  if (index !== -1) {
    MOCK_USERS[index] = { ...MOCK_USERS[index], ...updateData };
    return MOCK_USERS[index];
  }
  return updateData;
}

export async function apiDeleteUser(userId) {
  const res = await request(`/users/${userId}`, { method: 'DELETE' });
  const index = MOCK_USERS.findIndex(u => u.id === Number(userId));
  if (index !== -1) {
    MOCK_USERS.splice(index, 1);
  }
  return res ? res.status === 200 : true;
}

/* 2. POSTS API */
export async function apiGetPosts() {
  const data = await request('/posts');
  if (data && data.data) {
    if (Array.isArray(data.data.posts)) {
      return data.data.posts;
    }
    if (Array.isArray(data.data)) {
      return data.data;
    }
  }
  return MOCK_POSTS;
}

export async function apiDeletePost(postId) {
  const token = getAdminToken();
  const res = await request(`/posts/${postId}`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  const index = MOCK_POSTS.findIndex(p => p.id === Number(postId));
  if (index !== -1) {
    MOCK_POSTS.splice(index, 1);
  }
  return res ? res.status === 200 : true;
}

/* 6. NOTIFICATIONS API */
let MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Welcome to PPPI Community',
    message: 'Thank you for joining the PPPI network. Complete your profile to connect with members.',
    target: 'All Members',
    created_at: '2026-03-25 10:00 AM'
  },
  {
    id: 2,
    title: 'Upcoming Leadership Summit 2026',
    message: 'Register now for the annual leadership summit in Chennai Trade Center.',
    target: 'Gold Plan Members',
    created_at: '2026-03-28 02:30 PM'
  }
];

/* 3. PLANS API */
export async function apiGetPlans() {
  const data = await request('/plans');
  if (data && data.data) {
    return data.data;
  }
  return [];
}

export async function apiCreatePlan(planData) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE_URL}/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      plan_name: planData.plan_name,
      price: Number(planData.price),
      is_popular: planData.is_popular === 'true' || planData.is_popular === true,
      benefits: typeof planData.benefits === 'string'
        ? planData.benefits.split(',').map(b => b.trim()).filter(Boolean)
        : (planData.benefits || [])
    })
  });
  return await res.json();
}

export async function apiDeletePlan(id) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE_URL}/plans/${id}`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  return await res.json();
}

/* 4. EVENTS API */
export async function apiGetEvents() {
  const token = getAdminToken();
  const data = await request('/events', {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  if (data && Array.isArray(data.data)) {
    return data.data;
  }
  return MOCK_EVENTS;
}

export async function apiGetEventRegistrations(eventId) {
  const token = getAdminToken();
  try {
    const data = await request(`/events/${eventId}/registrations`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (data) {
      if (Array.isArray(data.data)) return data.data;
      if (data.data && Array.isArray(data.data.registrations)) return data.data.registrations;
      if (Array.isArray(data.registrations)) return data.registrations;
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('apiGetEventRegistrations error:', e);
  }
  return [];
}

export async function apiCreateEvent(eventData) {
  const token = getAdminToken();
  const res = await request('/events', {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: JSON.stringify({
      title: eventData.title,
      description: eventData.description,
      date: eventData.date,
      time: eventData.time,
      venue: eventData.venue,
      banner_image: eventData.banner || eventData.banner_image || '',
      organizer: eventData.organizer || 'PPPI Headquarters'
    })
  });
  if (res && res.data) {
    return res.data;
  }
  const newEvent = {
    id: Date.now(),
    title: eventData.title,
    date: eventData.date,
    time: eventData.time,
    venue: eventData.venue,
    banner_image: eventData.banner || eventData.banner_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    description: eventData.description,
    total_registrations: 0
  };
  MOCK_EVENTS.unshift(newEvent);
  return newEvent;
}


export async function apiDeleteEvent(eventId) {
  const token = getAdminToken();
  const res = await request(`/events/${eventId}`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  MOCK_EVENTS = MOCK_EVENTS.filter(e => e.id !== Number(eventId));
  return res ? res.status === 200 : true;
}

const MOCK_EVENT_REGISTRATIONS = [
  {
    id: 1,
    event_id: 2,
    user_name: 'Prem',
    user_phone: '9988776655',
    user_email: 'prem@gmail.com',
    created_at: '2026-07-29T13:30:07.931Z',
    notes: 'Attending with 2 members'
  },
  {
    id: 2,
    event_id: 1,
    user_name: 'Ravi Kumar',
    user_phone: '9876543210',
    user_email: 'ravi.kumar@example.com',
    created_at: '2026-07-28T10:15:00.000Z',
    notes: 'Keynote Speaker'
  }
];






/* 5. FUNDS & DONATIONS MODULE */
export async function apiGetFunds() {
  const data = await request('/funds');
  if (data && data.data) {
    return data.data;
  }
  return [];
}

export async function apiCreateFund(fundData) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE_URL}/funds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(fundData)
  });
  return await res.json();
}

export async function apiUpdateFund(id, fundData) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE_URL}/funds/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(fundData)
  });
  return await res.json();
}

export async function apiDeleteFund(id) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE_URL}/funds/${id}`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  return await res.json();
}

export async function apiGetDonations() {
  const token = getAdminToken();
  const data = await request('/donations', {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });

  if (data && data.data && data.data.length > 0) {
    return data.data.map(d => ({
      id: d.donation_id || `DON_${d.id}`,
      donor: d.user ? d.user.name : 'Party Supporter',
      donorPhone: d.user?.phone || 'N/A',
      donorEmail: d.user?.email || 'N/A',
      fund: d.fund?.title || 'General Fund',
      amount: Number(d.amount),
      method: d.razorpay_payment_id ? `Razorpay (${d.razorpay_payment_id})` : 'Razorpay Gateway',
      orderId: d.razorpay_order_id || 'N/A',
      paymentId: d.razorpay_payment_id || 'N/A',
      status: d.status,
      date: d.created_at ? new Date(d.created_at).toLocaleString() : 'Recent'
    }));
  }

  return MOCK_DONATIONS;
}

/* 6. LIVE STREAMS MODULE */
export async function apiGetLiveStreams() {
  const data = await request('/live-streams');
  if (data && data.data) {
    return data.data;
  }
  return [];
}

export async function apiGetActiveLiveStreams() {
  const data = await request('/live-streams/active');
  if (data && data.data) {
    return data.data;
  }
  return [];
}

export async function apiEndLiveStream(streamId) {
  const token = getAdminToken();
  const data = await request(`/live-streams/${streamId}/end`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });
  return data;
}

/* 7. PUSH NOTIFICATIONS MODULE */
export async function apiSendNotification(notificationData) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE_URL}/notifications/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(notificationData)
  });
  return await res.json();
}

export async function apiGetNotifications() {
  const token = getAdminToken();
  const data = await request('/notifications/all', {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });

  if (data && data.data) {
    const rawList = Array.isArray(data.data.notifications) ? data.data.notifications : (Array.isArray(data.data) ? data.data : []);
    const unreadCount = typeof data.data.unreadCount === 'number' ? data.data.unreadCount : rawList.filter(n => !n.is_read).length;

    const list = rawList.map(n => ({
      id: n.id,
      title: n.title,
      message: n.body,
      target: n.type || 'BROADCAST',
      is_read: n.is_read !== undefined ? Boolean(n.is_read) : false,
      recipient: n.user ? n.user.name : (n.user_id ? `User #${n.user_id}` : 'All Members'),
      created_at: n.created_at ? new Date(n.created_at).toLocaleString() : 'Recent'
    }));

    return { notifications: list, unreadCount };
  }

  return { notifications: [], unreadCount: 0 };
}

export async function apiToggleNotificationRead(id) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/toggle-read`, {
    method: 'PATCH',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  return await res.json();
}

export async function apiMarkAllNotificationsRead() {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE_URL}/notifications/admin-read-all`, {
    method: 'PATCH',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  return await res.json();
}

export async function apiDeleteNotification(id) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  return await res.json();
}



