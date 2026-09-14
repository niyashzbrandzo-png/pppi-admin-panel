/* ==========================================================================
   PPPI Admin Portal - API Integration Layer
   Target Server: https://api.pppiconnect.com/api
   ========================================================================== */

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const LOCAL_API_URL = "http://localhost:5000/api";
const REMOTE_API_URL = "https://api.pppiconnect.com/api";
const DEFAULT_API_URL = isLocal ? LOCAL_API_URL : REMOTE_API_URL;

let storedApiUrl = localStorage.getItem('pppi_api_url');
let API_BASE_URL = storedApiUrl || DEFAULT_API_URL;

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
  let targetUrl = API_BASE_URL;

  const tryFetch = async (baseUrl) => {
    return await fetch(`${baseUrl}/auth/login`, {
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
  };

  let res;
  try {
    res = await tryFetch(targetUrl);
  } catch (err) {
    const fallbackUrl = targetUrl === LOCAL_API_URL ? REMOTE_API_URL : LOCAL_API_URL;
    console.warn(`Primary API URL (${targetUrl}) failed to fetch. Falling back to ${fallbackUrl}...`);
    try {
      res = await tryFetch(fallbackUrl);
      setApiBaseUrl(fallbackUrl);
    } catch (fallbackErr) {
      throw new Error(`Unable to connect to backend server at ${targetUrl} or ${fallbackUrl}. Please verify the Node server is running.`);
    }
  }

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

let MOCK_EVENTS = [];


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
    const { headers: optHeaders, ...restOptions } = options;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(optHeaders || {})
      },
      ...restOptions
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
  return [];

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
  const txns = [];

  // 1. Fetch real platform transactions (Membership fees & payments from Railway)
  try {
    const txnData = await request('/payments/admin-transactions', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (txnData && Array.isArray(txnData.data) && txnData.data.length > 0) {
      txnData.data.forEach(d => {
        txns.push({
          id: d.transaction_id || `TXN_${d.id}`,
          donor: d.user ? d.user.name : 'Party Member',
          donorPhone: d.user?.phone || 'N/A',
          donorEmail: d.user?.email || 'N/A',
          fund: d.fund_category || (d.type === 'MEMBERSHIP' ? 'Membership Fee' : 'General Donation'),
          amount: Number(d.amount),
          method: d.razorpay_payment_id ? `Razorpay (${d.razorpay_payment_id})` : 'Razorpay Gateway',
          orderId: d.razorpay_order_id || 'N/A',
          paymentId: d.razorpay_payment_id || 'N/A',
          status: d.status,
          date: d.created_at ? new Date(d.created_at).toLocaleString() : 'Recent'
        });
      });
    }
  } catch (err) {
    console.warn('apiGetDonations transaction fetch warning:', err);
  }

  // 2. Also fetch from /donations
  try {
    const data = await request('/donations', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (data && data.data && data.data.length > 0) {
      data.data.forEach(d => {
        txns.push({
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
        });
      });
    }
  } catch (_) {}

  if (txns.length > 0) {
    return txns;
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

/* 8. WEBSITE ENQUIRIES & JOIN APPLICATIONS MODULE */
export async function apiGetEnquiries() {
  const token = getAdminToken();
  const data = await request('/enquiries', {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  if (data && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}

export async function apiDeleteEnquiry(id) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE_URL}/enquiries/${id}`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  return await res.json();
}

export async function apiGetJoinRequests() {
  const token = getAdminToken();
  const data = await request('/enquiries/join-requests', {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  if (data && Array.isArray(data.data)) {
    return data.data;
  }
  return [
    {
      id: 201,
      name: 'Anish Sharma',
      phone: '+91 9876543210',
      email: 'anish.sharma@example.com',
      plan: 'Gold Membership Plan',
      state: 'Delhi NCR',
      district: 'South Delhi',
      status: 'PENDING',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 202,
      name: 'Kavitha Raman',
      phone: '+91 9812345678',
      email: 'kavitha.r@example.com',
      plan: 'Silver Membership Plan',
      state: 'Tamil Nadu',
      district: 'Chennai',
      status: 'CONTACTED',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    }
  ];
}

export async function apiDeleteJoinRequest(id) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE_URL}/enquiries/join-requests/${id}`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  return await res.json();
}


/* 9. CLOUDINARY FILE UPLOAD API */
export async function apiUploadMediaFile(file) {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData
  });

  const data = await res.json();
  if (!res.ok || data.status >= 300) {
    throw new Error(data.message || 'File upload to Cloudinary failed.');
  }

  return data.data?.url || data.url;
}

/* 10. MANIFESTO CMS API */
export function getAuthHeaders() {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function apiGetManifesto() {
  const data = await request('/manifesto');
  return (data && data.data) || [];
}

export async function apiCreateManifesto(payload) {
  const data = await request('/manifesto', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!data || data.status >= 300) {
    throw new Error((data && data.message) || 'Failed to create manifesto topic');
  }
  return data.data;
}

export async function apiDeleteManifesto(id) {
  const data = await request(`/manifesto/${id}`, {
    method: 'DELETE'
  });
  if (!data || (data.status && data.status >= 300)) {
    throw new Error((data && data.message) || 'Failed to delete manifesto topic');
  }
  return data;
}

/* 11. GALLERY CMS API */
export async function apiGetGallery() {
  const data = await request('/gallery');
  return (data && data.data) || [];
}

export async function apiCreateGallery(payload) {
  const data = await request('/gallery', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!data || data.status >= 300) {
    throw new Error((data && data.message) || 'Failed to create gallery item');
  }
  return data.data;
}

export async function apiDeleteGallery(id) {
  const data = await request(`/gallery/${id}`, {
    method: 'DELETE'
  });
  if (!data || (data.status && data.status >= 300)) {
    throw new Error((data && data.message) || 'Failed to delete gallery item');
  }
  return data;
}

/* 12. SYSTEM SETTINGS & MAINTENANCE API */
export async function apiGetSettings() {
  try {
    const token = getAdminToken();
    const res = await fetch(`${API_BASE_URL}/settings`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (data && data.data) {
      localStorage.setItem('pppi_maintenance_settings', JSON.stringify(data.data));
      return data.data;
    }
  } catch (err) {
    console.warn('apiGetSettings fallback to local cache:', err.message);
  }

  const cached = localStorage.getItem('pppi_maintenance_settings');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  return {
    maintenance_mode: false,
    maintenance_message: 'Currently Website & Mobile App Under Development',
    maintenance_subtext: 'We are enhancing our digital governance platform to deliver an unprecedented political membership experience.',
    contact_helpline: '+91 7259798393',
    contact_email: 'bpasha46@gmail.com'
  };
}

export async function apiToggleMaintenance(maintenanceMode, customMessage, customSubtext) {
  const token = getAdminToken();
  const payload = {
    maintenance_mode: Boolean(maintenanceMode),
    maintenance_message: customMessage || 'Currently Website & Mobile App Under Development',
    maintenance_subtext: customSubtext || ''
  };

  try {
    const res = await fetch(`${API_BASE_URL}/settings/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data && data.data) {
      localStorage.setItem('pppi_maintenance_settings', JSON.stringify(data.data));
      return data.data;
    }
  } catch (err) {
    console.warn('apiToggleMaintenance remote failed, saving locally:', err.message);
  }

  const result = {
    maintenance_mode: Boolean(maintenanceMode),
    maintenance_message: payload.maintenance_message,
    maintenance_subtext: payload.maintenance_subtext,
    updated_at: new Date().toISOString()
  };
  localStorage.setItem('pppi_maintenance_settings', JSON.stringify(result));
  return result;
}

export async function apiUpdateSettings(payload) {
  const token = getAdminToken();
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data && data.data) {
      localStorage.setItem('pppi_maintenance_settings', JSON.stringify(data.data));
      return data.data;
    }
  } catch (err) {
    console.warn('apiUpdateSettings remote failed, saving locally:', err.message);
  }

  const result = { ...payload, updated_at: new Date().toISOString() };
  localStorage.setItem('pppi_maintenance_settings', JSON.stringify(result));
  return result;
}

/* ==========================================================================
   14. NEWSLETTER & FOUNDER PRESS MEET API
   ========================================================================== */
const LOCAL_NEWSLETTERS_KEY = 'pppi_newsletters_data';

const DEFAULT_NEWSLETTERS = [
  {
    id: 1,
    title: 'Historic Press Meet of Founder President Mr. B S Vahid Pasha on National Integration',
    subtitle: 'Official Press Declaration from DALASANUR Central Secretariat',
    description: `During the special press meet conducted at Dalasanur Headquarters, Founder & National President Mr. B S Vahid Pasha unveiled the sacred mission of the Pasha People Party of India (PPPI CONNECT). Addressing journalists, editors, and party delegates from across India, the President emphasized that political power is not an instrument of luxury, but a sacred covenant to protect the farmer, feed every starving family before sunset, and establish global natural disaster rescue forces.

"Our mission is simple and pure: Food, shelter, security, and health are fundamental rights for everyone on or off this planet. We are marching forward with the Pineapple emblem to restore truth and dignity to the common citizen."

The official press meet communique and charter document are published herewith for full public inspection and worldwide circulation.`,
    media_type: 'image',
    media_url: '/images/banner.jpg',
    doc_url: '/images/pppi_preamble_banner.jpg',
    doc_name: 'PPPI_Official_Press_Declaration_2026.pdf',
    category: 'Press Meet',
    author: 'Mr. B S Vahid Pasha - Founder & National President',
    publish_date: new Date('2026-09-01T10:00:00Z').toISOString(),
    status: true,
    created_at: new Date('2026-09-01T10:00:00Z').toISOString()
  },
  {
    id: 2,
    title: 'Special Press Conference: Unveiling the Pineapple Emblem & Uttar Pradesh Electoral Vision',
    subtitle: 'Keynote Address by National Leadership & Announcement of State Leadership',
    description: `At a landmark press briefing, the Central Executive Committee of Pasha People Party of India officially launched its state-wide democratic outreach program. The National President highlighted the historical significance of the Pineapple symbol as an emblem of resilience, sweet prosperity, and collective power for working families, small business owners, and rural farmers.

Key topics addressed during the press meet included:
1. Zero tolerance for corruption and extortion in public administration.
2. Immediate relief measures and direct financial security for agricultural laborers.
3. Rapid expansion of the party's mobile governance network (PPPI CONNECT).

The full resolution passed during the press meet is available for public download.`,
    media_type: 'image',
    media_url: '/images/up_cm_irshad_khan_banner.jpg',
    doc_url: '/images/vote_pineapple_card.jpg',
    doc_name: 'Pineapple_Electoral_Charter_UP.pdf',
    category: 'Press Meet',
    author: 'National Working Committee • PPPI Central Headquarters',
    publish_date: new Date('2026-09-08T11:30:00Z').toISOString(),
    status: true,
    created_at: new Date('2026-09-08T11:30:00Z').toISOString()
  }
];

export async function apiGetNewsletters() {
  try {
    const data = await request('/newsletters');
    if (data && Array.isArray(data.data) && data.data.length > 0) {
      localStorage.setItem(LOCAL_NEWSLETTERS_KEY, JSON.stringify(data.data));
      return data.data;
    }
  } catch (err) {
    console.warn('apiGetNewsletters remote fetch error, using local/fallback:', err.message);
  }
  const cached = localStorage.getItem(LOCAL_NEWSLETTERS_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  return DEFAULT_NEWSLETTERS;
}

export async function apiCreateNewsletter(payload) {
  let createdItem = null;
  try {
    const data = await request('/newsletters', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data && data.data) {
      createdItem = data.data;
    }
  } catch (err) {
    console.warn('apiCreateNewsletter remote error, creating locally:', err.message);
  }
  if (!createdItem) {
    createdItem = {
      id: Date.now(),
      title: payload.title,
      subtitle: payload.subtitle || '',
      description: payload.description,
      media_type: payload.media_type || 'image',
      media_url: payload.media_url || '',
      doc_url: payload.doc_url || '',
      doc_name: payload.doc_name || (payload.doc_url ? 'newsletter_document.pdf' : null),
      category: payload.category || 'Press Meet',
      author: payload.author || 'Mr. B S Vahid Pasha - Founder & National President',
      publish_date: payload.publish_date || new Date().toISOString(),
      status: true,
      created_at: new Date().toISOString()
    };
  }
  const current = await apiGetNewsletters();
  const updated = [createdItem, ...current.filter(x => x.id !== createdItem.id)];
  localStorage.setItem(LOCAL_NEWSLETTERS_KEY, JSON.stringify(updated));
  return createdItem;
}

export async function apiDeleteNewsletter(id) {
  try {
    await request(`/newsletters/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('apiDeleteNewsletter remote error, deleting locally:', err.message);
  }
  const current = await apiGetNewsletters();
  const updated = current.filter(item => String(item.id) !== String(id));
  localStorage.setItem(LOCAL_NEWSLETTERS_KEY, JSON.stringify(updated));
  return { success: true, id };
}

/* ==========================================================================
   PUBLICITIES & POSTERS API
   ========================================================================== */
const LOCAL_PUBLICITIES_KEY = 'pppi_admin_publicities_cache';

const DEFAULT_PUBLICITIES = [
  {
    id: 1,
    title: 'Official PPPI National Flag & Symbol Proclamation Poster',
    description: 'High-resolution official election campaign poster featuring Founder President Mr. B S Vahid Pasha, Party Flag (Red, White, Green), and the Pineapple symbol. Optimized for 12x18 and 18x24 wall printing.',
    media_type: 'image',
    media_url: '/images/banner.jpg',
    orientation: 'portrait',
    category: 'Campaign Poster',
    download_count: 342,
    status: true,
    created_at: new Date('2026-09-02T10:00:00Z').toISOString()
  },
  {
    id: 2,
    title: 'Kisan Kranti & Agriculture Revolution Flex Banner',
    description: 'Wide-format high-res flex banner announcing 100% farmer loan waiver and 1.5x MSP guarantee. Designed for stage backdrops and street flex hoardings.',
    media_type: 'image',
    media_url: '/images/banner.jpg',
    orientation: 'landscape',
    category: 'Flex Banner',
    download_count: 512,
    status: true,
    created_at: new Date('2026-09-05T14:30:00Z').toISOString()
  },
  {
    id: 3,
    title: 'Sacred Preamble Proclamation Wall Poster',
    description: 'Official portrait poster displaying the Sacred Preamble of Pasha People Party of India for distribution across taluks, public offices, and volunteer homes.',
    media_type: 'image',
    media_url: '/images/founder.jpg',
    orientation: 'portrait',
    category: 'Campaign Poster',
    download_count: 289,
    status: true,
    created_at: new Date('2026-09-08T11:00:00Z').toISOString()
  },
  {
    id: 4,
    title: 'Dalasanur National Convention Official Video Reel',
    description: 'Dynamic publicity video highlighting the mass turnout, address by Founder President Mr. B S Vahid Pasha, and the Pineapple election emblem launch.',
    media_type: 'video',
    media_url: '/images/banner.jpg',
    orientation: 'portrait',
    category: 'Videos & Reels',
    download_count: 678,
    status: true,
    created_at: new Date('2026-09-10T09:15:00Z').toISOString()
  }
];

export async function apiGetPublicities() {
  try {
    const data = await request('/publicities');
    if (data && Array.isArray(data.data) && data.data.length > 0) {
      localStorage.setItem(LOCAL_PUBLICITIES_KEY, JSON.stringify(data.data));
      return data.data;
    }
  } catch (err) {
    console.warn('apiGetPublicities remote fetch error, using local/fallback:', err.message);
  }
  const cached = localStorage.getItem(LOCAL_PUBLICITIES_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  return DEFAULT_PUBLICITIES;
}

export async function apiCreatePublicity(payload) {
  let createdItem = null;
  try {
    const data = await request('/publicities', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data && data.data) {
      createdItem = data.data;
    }
  } catch (err) {
    console.warn('apiCreatePublicity remote error, creating locally:', err.message);
  }
  if (!createdItem) {
    createdItem = {
      id: Date.now(),
      title: payload.title,
      description: payload.description,
      media_type: payload.media_type || 'image',
      media_url: payload.media_url || '/images/banner.jpg',
      orientation: payload.orientation || 'portrait',
      category: payload.category || 'Campaign Poster',
      download_count: 0,
      status: true,
      created_at: new Date().toISOString()
    };
  }
  const current = await apiGetPublicities();
  const updated = [createdItem, ...current.filter(x => x.id !== createdItem.id)];
  localStorage.setItem(LOCAL_PUBLICITIES_KEY, JSON.stringify(updated));
  return createdItem;
}

export async function apiDeletePublicity(id) {
  try {
    await request(`/publicities/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('apiDeletePublicity remote error, deleting locally:', err.message);
  }
  const current = await apiGetPublicities();
  const updated = current.filter(item => String(item.id) !== String(id));
  localStorage.setItem(LOCAL_PUBLICITIES_KEY, JSON.stringify(updated));
  return { success: true, id };
}

/* ==========================================================================
   PUBLIC COMPLAINTS & GRIEVANCE CELL API
   ========================================================================== */
const LOCAL_COMPLAINTS_KEY = 'pppi_admin_complaints_cache';

const DEFAULT_COMPLAINTS = [
  {
    id: 1,
    complaint_no: 'PPPI-CMP-894102-4521',
    complainer_name: 'Rajeshwari S. Gowda',
    father_or_spouse: 'Late Shankarappa Gowda',
    phone: '9845123456',
    alternate_phone: '9845123457',
    email: 'rajeshwari.gowda@gmail.com',
    gender: 'Female',
    age: 44,
    aadhaar_no: '5421-8932-1145',
    pan_no: 'BQJPG4582K',
    address: 'Survey No. 42/1, Dalasanur Cross Road, Kolar Rural',
    state: 'Karnataka',
    district: 'Kolar',
    taluk: 'Srinivaspur',
    pincode: '563126',
    is_victim: true,
    victim_name: null,
    victim_contact: null,
    victim_relation: null,
    victim_address: null,
    category: 'Land Grabbing & Property Encroachment',
    incident_date: new Date('2026-09-08T09:30:00Z').toISOString(),
    incident_location: 'Dalasanur Survey No. 42/1, Near Old Gram Panchayat Office',
    accused_details: 'Local Real Estate Syndicate & Revenue Inspector S. Manjunath',
    description: 'Our ancestral agricultural land measuring 2.4 acres was illegally fenced and forged documents were registered by local land grabbers with corrupt revenue officials. Despite repeated petitions to the Tahsildar office, no inspection was conducted and we are receiving continuous threats to vacate our farmland.',
    selfie_url: '/images/founder.jpg',
    evidence_urls: '/images/banner.jpg',
    latitude: 13.2678,
    longitude: 78.2043,
    gps_address: 'Dalasanur, Srinivaspur Taluk, Kolar District, Karnataka 563126',
    status: 'UNDER_REVIEW',
    priority: 'HIGH',
    admin_notes: 'Initial legal review completed. Advocate team dispatched notice to Assistant Commissioner Kolar Sub-division for spot inspection.',
    action_taken_by: 'Adv. S. Ramanathan (PPPI Legal Action Cell)',
    created_at: new Date('2026-09-09T10:15:00Z').toISOString()
  },
  {
    id: 2,
    complaint_no: 'PPPI-CMP-781423-6319',
    complainer_name: 'Mohammed Farooq Khan',
    father_or_spouse: 'Abdul Wahab Khan',
    phone: '7259798393',
    alternate_phone: '9448112233',
    email: 'farooq.k@yahoo.com',
    gender: 'Male',
    age: 38,
    aadhaar_no: '8874-2319-5561',
    pan_no: 'AFKPK7712M',
    address: '#14/B, Market Road, Near Town Police Station',
    state: 'Karnataka',
    district: 'Chikkaballapur',
    taluk: 'Chintamani',
    pincode: '563125',
    is_victim: false,
    victim_name: 'Zubair Khan (Son)',
    victim_contact: '9448112233',
    victim_relation: 'Son',
    victim_address: '#14/B, Market Road, Chintamani',
    category: 'Corruption & Bribery in Public Office',
    incident_date: new Date('2026-09-10T11:00:00Z').toISOString(),
    incident_location: 'Town Municipal Council Office, 2nd Floor, Room 14',
    accused_details: 'Assistant Town Planning Officer & Municipal Broker',
    description: 'Demand of ₹75,000 cash bribe for issuing building completion certificate and khata transfer for our small residential shop. Officer refused to receive the official application without prior cash payment.',
    selfie_url: '/images/banner.jpg',
    evidence_urls: '/images/banner.jpg',
    latitude: 13.4012,
    longitude: 78.0567,
    gps_address: 'Chintamani Town Municipal Council, Chikkaballapur District',
    status: 'ACTION_TAKEN',
    priority: 'URGENT',
    admin_notes: 'Lokayukta complaint drafted and submitted. Party taluk committee staging public demonstration outside TMC office.',
    action_taken_by: 'Kolar-Chikkaballapur District Convener',
    created_at: new Date('2026-09-11T12:00:00Z').toISOString()
  }
];

export async function apiGetComplaints() {
  try {
    const data = await request('/complaints');
    if (data && Array.isArray(data.data) && data.data.length > 0) {
      localStorage.setItem(LOCAL_COMPLAINTS_KEY, JSON.stringify(data.data));
      return data.data;
    }
  } catch (err) {
    console.warn('apiGetComplaints remote fetch error, using local/fallback:', err.message);
  }
  const cached = localStorage.getItem(LOCAL_COMPLAINTS_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  return DEFAULT_COMPLAINTS;
}

export async function apiGetComplaintById(id) {
  try {
    const data = await request(`/complaints/${id}`);
    if (data && data.data) return data.data;
  } catch (err) {
    console.warn('apiGetComplaintById remote error:', err.message);
  }
  const all = await apiGetComplaints();
  return all.find(c => String(c.id) === String(id) || c.complaint_no === id) || null;
}

export async function apiUpdateComplaint(id, payload) {
  try {
    const data = await request(`/complaints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    if (data && data.data) return data.data;
  } catch (err) {
    console.warn('apiUpdateComplaint remote error, updating locally:', err.message);
  }
  const all = await apiGetComplaints();
  const updated = all.map(c => {
    if (String(c.id) === String(id) || c.complaint_no === id) {
      return { ...c, ...payload, updated_at: new Date().toISOString() };
    }
    return c;
  });
  localStorage.setItem(LOCAL_COMPLAINTS_KEY, JSON.stringify(updated));
  return updated.find(c => String(c.id) === String(id) || c.complaint_no === id);
}

export async function apiDeleteComplaint(id) {
  try {
    await request(`/complaints/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('apiDeleteComplaint remote error, deleting locally:', err.message);
  }
  const all = await apiGetComplaints();
  const updated = all.filter(c => String(c.id) !== String(id) && c.complaint_no !== id);
  localStorage.setItem(LOCAL_COMPLAINTS_KEY, JSON.stringify(updated));
  return { success: true, id };
}

/* ==========================================================================
   Jobs & Employment Recruitment API Layer
   ========================================================================== */
const LOCAL_JOBS_KEY = 'pppi_local_jobs';
const LOCAL_APPLICATIONS_KEY = 'pppi_local_applications';

export async function apiGetJobs(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const data = await request(`/jobs${query ? `?${query}` : ''}`);
    if (data && (data.data || Array.isArray(data))) {
      const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      if (list.length > 0) {
        localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(list));
        return list;
      }
    }
  } catch (err) {
    console.warn('apiGetJobs remote fetch notice (using cache/defaults):', err.message);
  }

  const cached = localStorage.getItem(LOCAL_JOBS_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  return [];
}

export async function apiGetJobById(id) {
  try {
    const data = await request(`/jobs/${id}`);
    if (data && data.data) return data.data;
  } catch (err) {
    console.warn('apiGetJobById remote error:', err.message);
  }
  const all = await apiGetJobs();
  return all.find(j => String(j.id) === String(id)) || null;
}

export async function apiCreateJob(payload) {
  try {
    const data = await request('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data && data.data) {
      const all = await apiGetJobs();
      all.unshift(data.data);
      localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(all));
      return data.data;
    }
  } catch (err) {
    console.warn('apiCreateJob remote error, creating locally:', err.message);
  }

  const newJob = {
    id: Date.now(),
    ...payload,
    applications_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const all = await apiGetJobs();
  all.unshift(newJob);
  localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(all));
  return newJob;
}

export async function apiUpdateJob(id, payload) {
  try {
    const data = await request(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    if (data && data.data) return data.data;
  } catch (err) {
    console.warn('apiUpdateJob remote error, updating locally:', err.message);
  }

  const all = await apiGetJobs();
  const updated = all.map(j => {
    if (String(j.id) === String(id)) {
      return { ...j, ...payload, updated_at: new Date().toISOString() };
    }
    return j;
  });
  localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(updated));
  return updated.find(j => String(j.id) === String(id));
}

export async function apiDeleteJob(id) {
  try {
    await request(`/jobs/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('apiDeleteJob remote error, deleting locally:', err.message);
  }
  const all = await apiGetJobs();
  const updated = all.filter(j => String(j.id) !== String(id));
  localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(updated));
  return { success: true, id };
}

export async function apiGetJobApplications(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const data = await request(`/jobs/applications${query ? `?${query}` : ''}`);
    if (data && (data.data || Array.isArray(data))) {
      const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      if (list.length > 0) {
        localStorage.setItem(LOCAL_APPLICATIONS_KEY, JSON.stringify(list));
        return list;
      }
    }
  } catch (err) {
    console.warn('apiGetJobApplications remote fetch notice:', err.message);
  }

  const cached = localStorage.getItem(LOCAL_APPLICATIONS_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  return [];
}

export async function apiUpdateJobApplication(id, payload) {
  try {
    const data = await request(`/jobs/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    if (data && data.data) return data.data;
  } catch (err) {
    console.warn('apiUpdateJobApplication remote error, updating locally:', err.message);
  }

  const all = await apiGetJobApplications();
  const updated = all.map(a => {
    if (String(a.id) === String(id)) {
      return { ...a, ...payload, updated_at: new Date().toISOString() };
    }
    return a;
  });
  localStorage.setItem(LOCAL_APPLICATIONS_KEY, JSON.stringify(updated));
  return updated.find(a => String(a.id) === String(id));
}

/* ==========================================================================
   Agriculture & Farmers Community Forum APIs
   ========================================================================== */
export async function apiGetAgriQuestions() {
  try {
    const data = await request('/agriculture/questions');
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
  } catch (err) {
    console.warn('apiGetAgriQuestions remote fetch notice:', err.message);
  }
  return [];
}

export async function apiDeleteAgriQuestion(questionId) {
  try {
    const res = await request(`/agriculture/questions/${questionId}`, {
      method: 'DELETE'
    });
    return res && res.status === 200;
  } catch (err) {
    console.error('apiDeleteAgriQuestion error:', err.message);
    return false;
  }
}

export async function apiDeleteAgriAnswer(answerId) {
  try {
    const res = await request(`/agriculture/answers/${answerId}`, {
      method: 'DELETE'
    });
    return res && res.status === 200;
  } catch (err) {
    console.error('apiDeleteAgriAnswer error:', err.message);
    return false;
  }
}

/* ==========================================================================
   Law & Judiciary (Pending Court Cases) APIs
   ========================================================================== */
export async function apiGetLegalCases() {
  try {
    const data = await request('/law/cases');
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
  } catch (err) {
    console.warn('apiGetLegalCases remote fetch notice:', err.message);
  }
  return [];
}

export async function apiUpdateLegalCase(caseId, payload) {
  try {
    const res = await request(`/law/cases/${caseId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return res && (res.status === 200 || res.success);
  } catch (err) {
    console.error('apiUpdateLegalCase error:', err.message);
    return false;
  }
}

export async function apiDeleteLegalCase(caseId) {
  try {
    const res = await request(`/law/cases/${caseId}`, {
      method: 'DELETE'
    });
    return res && res.status === 200;
  } catch (err) {
    console.error('apiDeleteLegalCase error:', err.message);
    return false;
  }
}

/* ==========================================================================
   Marriages Support & Social Harmony APIs
   ========================================================================== */
export async function apiGetMarriageApplications() {
  try {
    const data = await request('/marriages/applications');
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
  } catch (err) {
    console.warn('apiGetMarriageApplications remote fetch notice:', err.message);
  }
  return [];
}

export async function apiUpdateMarriageApplication(appId, payload) {
  try {
    const res = await request(`/marriages/applications/${appId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return res && (res.status === 200 || res.success);
  } catch (err) {
    console.error('apiUpdateMarriageApplication error:', err.message);
    return false;
  }
}

export async function apiDeleteMarriageApplication(appId) {
  try {
    const res = await request(`/marriages/applications/${appId}`, {
      method: 'DELETE'
    });
    return res && res.status === 200;
  } catch (err) {
    console.error('apiDeleteMarriageApplication error:', err.message);
    return false;
  }
}

/* ==========================================================================
   PPPI 24/7 Rapid Emergency Response & Petition APIs
   ========================================================================== */
export async function apiGetEmergencyAlerts() {
  try {
    const data = await request('/emergencies/alerts');
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
  } catch (err) {
    console.warn('apiGetEmergencyAlerts remote fetch notice:', err.message);
  }
  return [];
}

export async function apiGetEmergencyPoll() {
  try {
    const data = await request('/emergencies/poll');
    return data;
  } catch (err) {
    return null;
  }
}

export async function apiUpdateEmergencyAlert(alertId, payload) {
  try {
    const res = await request(`/emergencies/alerts/${alertId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return res && (res.status === 200 || res.success);
  } catch (err) {
    console.error('apiUpdateEmergencyAlert error:', err.message);
    return false;
  }
}

export async function apiFileEmergencyPetition(alertId, payload) {
  try {
    const res = await request(`/emergencies/alerts/${alertId}/petition`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res && (res.status === 200 || res.success);
  } catch (err) {
    console.error('apiFileEmergencyPetition error:', err.message);
    return false;
  }
}

export async function apiDeleteEmergencyAlert(alertId) {
  try {
    const res = await request(`/emergencies/alerts/${alertId}`, {
      method: 'DELETE'
    });
    return res && res.status === 200;
  } catch (err) {
    console.error('apiDeleteEmergencyAlert error:', err.message);
    return false;
  }
}

/* ==========================================================================
   PPPI Elections & Karnataka 224 Assembly Constituencies APIs
   ========================================================================== */
export async function apiGetElections() {
  try {
    const data = await request('/elections');
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
  } catch (err) {
    console.warn('apiGetElections remote fetch notice:', err.message);
  }
  return [];
}

export async function apiCreateElection(payload) {
  try {
    const res = await request('/elections', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res && res.data ? res.data : res;
  } catch (err) {
    console.error('apiCreateElection error:', err.message);
    throw err;
  }
}

export async function apiUpdateElection(electionId, payload) {
  try {
    const res = await request(`/elections/${electionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return res && (res.status === 200 || res.success);
  } catch (err) {
    console.error('apiUpdateElection error:', err.message);
    throw err;
  }
}

export async function apiDeleteElection(electionId) {
  try {
    const res = await request(`/elections/${electionId}`, {
      method: 'DELETE'
    });
    return res && (res.status === 200 || res.success);
  } catch (err) {
    console.error('apiDeleteElection error:', err.message);
    return false;
  }
}

export async function apiGetConstituencies(params = {}) {
  try {
    const qs = new URLSearchParams();
    if (params.election_id) qs.append('election_id', params.election_id);
    if (params.district && params.district !== 'ALL') qs.append('district', params.district);
    if (params.status && params.status !== 'ALL') qs.append('status', params.status);
    if (params.search) qs.append('search', params.search);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const data = await request(`/elections/constituencies${query}`);
    return data;
  } catch (err) {
    console.warn('apiGetConstituencies error:', err.message);
    return { success: false, data: [], districts: [] };
  }
}

export async function apiAssignCandidate(constituencyId, payload) {
  try {
    const res = await request(`/elections/constituencies/${constituencyId}/candidate`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res;
  } catch (err) {
    console.error('apiAssignCandidate error:', err.message);
    throw err;
  }
}

export async function apiRemoveCandidate(constituencyId) {
  try {
    const res = await request(`/elections/constituencies/${constituencyId}/candidate`, {
      method: 'DELETE'
    });
    return res && (res.status === 200 || res.success);
  } catch (err) {
    console.error('apiRemoveCandidate error:', err.message);
    return false;
  }
}

export async function apiUpdateConstituency(constituencyId, payload) {
  try {
    const res = await request(`/elections/constituencies/${constituencyId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return res && (res.status === 200 || res.success);
  } catch (err) {
    console.error('apiUpdateConstituency error:', err.message);
    throw err;
  }
}

export async function apiGetEligibleCandidates() {
  try {
    const data = await request('/elections/candidates/eligible-users');
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
  } catch (err) {
    console.warn('apiGetEligibleCandidates error:', err.message);
  }
  return [];
}

