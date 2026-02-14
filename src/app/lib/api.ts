const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getAdminAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("admin_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  user?: T;
  token?: string;
  session_token?: string; // Privacy-first auth uses session_token
}

// Privacy-first auth interfaces
export interface PrivacySignupData {
  username: string;
  password: string;
  recovery_email?: string;
}

export interface PrivacySigninData {
  username: string;
  password: string;
}

export interface CheckUsernameData {
  username: string;
}

export interface CheckUsernameResponse {
  success: boolean;
  available: boolean;
  username: string;
  message: string;
}

export interface ForgotUsernameData {
  recovery_email: string;
}

export interface ForgotPasswordData {
  recovery_email: string;
}

export interface ResetPasswordData {
  token: string;
  new_password: string;
}

// Legacy interfaces (for backward compatibility)
export interface UserSignupData {
  name: string;
  email: string;
  password: string;
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

export interface UserSigninData {
  email: string;
  password: string;
}

export interface TherapistSignupData {
  name: string;
  email: string;
  password: string;
  license_number: string;
  license_state: string;
  years_of_experience: number;
  specialization?: string;
  phone: string;
  college_degree: string;
  masters_institution: string;
  psychologist_type: string;
  successful_cases: number;
  dsm_awareness: string;
  therapy_types: string;
  certificate_image_path?: string;
  degree_image_path?: string;
}

export interface TherapistSigninData {
  email: string;
  password: string;
}

export interface Therapist {
  id: string;
  name: string;
  email: string;
  created_at: string;
  license_number: string;
  license_state: string;
  years_of_experience: number;
  specialization?: string;
  phone: string;
  college_degree: string;
  masters_institution: string;
  psychologist_type: string;
  successful_cases: number;
  dsm_awareness: string;
  therapy_types: string;
  certificate_image_path?: string;
  degree_image_path?: string;
  is_approved: boolean;
}

export interface TherapistStatusResponse {
  is_approved: boolean;
  email: string;
  name: string;
  message: string;
}

export interface Vent {
  id: string;
  message: string;
  created_at: string;
  username?: string; // Anonymous username only (privacy-first)
  user_id?: string; // Legacy support
}

export interface CreateVentData {
  message: string;
  user_id?: string;
}

export interface CreateVentResponse {
  success: boolean;
  message: string;
  vent?: Vent;
  warning?: boolean;
  blocked?: boolean;
  warning_count?: number;
}

export interface GetVentsResponse {
  success: boolean;
  vents: Vent[];
  has_more: boolean;
  total: number;
}

// Journaling interfaces
export interface Journal {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface CreateJournalData {
  title: string;
  content: string;
  user_id: string;
}

export interface CreateJournalResponse {
  success: boolean;
  message: string;
  journal?: Journal;
}

export interface GetJournalsResponse {
  success: boolean;
  journals: Journal[];
  total: number;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw { message: error.message, status: 500 } as ApiError;
    }
    throw { message: 'An unknown error occurred', status: 500 } as ApiError;
  }
}

export const api = {
  // Privacy-first auth (new endpoints)
  privacySignup: (data: PrivacySignupData) =>
    apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  privacySignin: (data: PrivacySigninData) =>
    apiRequest('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  checkUsername: async (data: CheckUsernameData): Promise<CheckUsernameResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/check-username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData as CheckUsernameResponse;
  },

  forgotUsername: (data: ForgotUsernameData) =>
    apiRequest('/api/auth/forgot-username', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  forgotPassword: (data: ForgotPasswordData) =>
    apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (data: ResetPasswordData) =>
    apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Legacy user auth (for backward compatibility)
  userSignup: (data: UserSignupData) =>
    apiRequest('/api/auth/user/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  userSignin: (data: UserSigninData) =>
    apiRequest('/api/auth/user/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Therapist auth - accepts FormData with files and form fields
  therapistSignup: async (formData: FormData): Promise<ApiResponse<Therapist>> => {
    const url = `${API_BASE_URL}/api/auth/therapist/signup`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type - browser will set it with boundary for multipart/form-data
      });

      const data = await response.json();

      if (!response.ok) {
        throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
      }

      return data;
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        throw error;
      }
      throw { message: error instanceof Error ? error.message : 'An unknown error occurred', status: 500 } as ApiError;
    }
  },

  therapistSignin: (data: TherapistSigninData) =>
    apiRequest('/api/auth/therapist/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Therapist status
  checkTherapistStatus: async (email: string): Promise<TherapistStatusResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/therapist/status?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data as TherapistStatusResponse;
  },

  // File upload
  uploadFile: async (file: File, folder: string = ''): Promise<string> => {
    if (!file) {
      throw { message: 'No file provided', status: 400 } as ApiError;
    }

    const formData = new FormData();
    formData.append('file', file);

    // Build URL with optional folder parameter
    let uploadUrl = `${API_BASE_URL}/api/upload`;
    if (folder) {
      uploadUrl += `?folder=${encodeURIComponent(folder)}`;
    }

    console.log('Uploading to:', uploadUrl);
    console.log('File:', file.name, file.size, file.type);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
      });

      console.log('Upload response status:', response.status);

      let data;
      try {
        data = await response.json();
      } catch {
        const text = await response.text();
        console.error('Failed to parse response as JSON:', text);
        throw { message: `Server error: ${text}`, status: response.status } as ApiError;
      }

      console.log('Upload response data:', data);

      if (!response.ok) {
        console.error('Upload error response:', data);
        throw { message: data.message || data.error || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
      }

      if (!data.success) {
        console.error('Upload not successful:', data);
        throw { message: data.message || 'Upload failed', status: 500 } as ApiError;
      }

      if (!data.url || data.url === "") {
        console.error('Upload response missing URL:', data);
        throw { message: 'Upload failed: No URL returned from server', status: 500 } as ApiError;
      }

      console.log('File uploaded successfully, URL:', data.url);
      return data.url;
    } catch (error) {
      console.error('Upload fetch error:', error);
      if (error && typeof error === 'object' && 'status' in error) {
        throw error;
      }
      throw { message: error instanceof Error ? error.message : 'Network error during upload', status: 500 } as ApiError;
    }
  },

  // Admin routes
  getViolations: async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/violations`);
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data;
  },

  getBlockedIPs: async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/blocked-ips`);
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data;
  },

  unblockIP: async (ipAddress: string) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/unblock-ip?ip=${encodeURIComponent(ipAddress)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data;
  },

  getPendingTherapists: async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/therapists/pending`);
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data;
  },

  getApprovedTherapists: async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/therapists/approved`);
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data;
  },

  approveTherapist: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/therapists/approve?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
    });
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data;
  },

  rejectTherapist: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/therapists/reject?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data;
  },

  getAdminGroups: async (limit?: number, skip?: number, search?: string, tag?: string) => {
    const params = new URLSearchParams();
    if (limit != null) params.append("limit", String(limit));
    if (skip != null) params.append("skip", String(skip));
    if (search) params.append("q", search);
    if (tag) params.append("tag", tag);
    const url = `${API_BASE_URL}/api/admin/groups${params.toString() ? `?${params.toString()}` : ""}`;
    const headers: Record<string, string> = { "Content-Type": "application/json", ...getAdminAuthHeaders() };
    const response = await fetch(url, { method: "GET", headers });
    const text = await response.text();
    let data: { success?: boolean; message?: string; groups?: unknown[]; total?: number };
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: response.statusText || `HTTP ${response.status}` };
    }
    if (!response.ok) {
      const message = data?.message || `HTTP ${response.status}`;
      throw { message, status: response.status } as ApiError;
    }
    return {
      success: data?.success !== false,
      groups: Array.isArray(data?.groups) ? data.groups : [],
      total: typeof data?.total === "number" ? data.total : 0,
    } as { success: boolean; groups: Array<{ id: string; name: string; slug?: string; description?: string; created_at: string; member_count: number; created_by: string; tags?: string[] }>; total: number };
  },

  getAdminGroupMembers: async (groupId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/groups/members?group_id=${encodeURIComponent(groupId)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    });
    const data = await response.json();
    if (!response.ok) throw { message: data.message || `HTTP ${response.status}`, status: response.status } as ApiError;
    return data as { success: boolean; members: Array<{ user_id: string; username: string; joined_at: string }>; total: number };
  },

  deleteAdminGroup: async (groupId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/groups?group_id=${encodeURIComponent(groupId)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    });
    const data = await response.json();
    if (!response.ok) throw { message: data.message || `HTTP ${response.status}`, status: response.status } as ApiError;
    return data as { success: boolean; message: string };
  },

  // Vent routes
  createVent: async (data: CreateVentData) => {
    const response = await fetch(`${API_BASE_URL}/api/vent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        const text = await response.text();
        throw { message: `Invalid JSON response: ${text.substring(0, 100)}`, status: response.status } as ApiError;
      }
    } else {
      const text = await response.text();
      throw { message: text || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    
    // Return response even if not ok (for warnings and blocks)
    // The frontend will handle warnings and blocks appropriately
    return responseData as CreateVentResponse;
  },

  getVents: async (userId?: string, limit?: number, skip?: number): Promise<GetVentsResponse> => {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    
    const url = `${API_BASE_URL}/api/vent${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        const text = await response.text();
        throw { message: `Invalid JSON response: ${text.substring(0, 100)}`, status: response.status } as ApiError;
      }
    } else {
      const text = await response.text();
      throw { message: text || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data as GetVentsResponse;
  },

  // Journaling routes
  createJournal: async (data: CreateJournalData): Promise<CreateJournalResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/journals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData as CreateJournalResponse;
  },

  getJournals: async (userId: string, limit?: number, skip?: number): Promise<GetJournalsResponse> => {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());

    const response = await fetch(`${API_BASE_URL}/api/journals?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data as GetJournalsResponse;
  },

  // Feedback routes
  submitFeedback: async (data: { feedback: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData;
  },

  getFeedbacks: async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/feedbacks`);
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data;
  },

  // Contact us routes
  submitContact: async (data: { name: string; email: string; message: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData;
  },

  getContacts: async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/contacts`);
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data;
  },

  // Waitlist routes
  submitUserWaitlist: async (data: { name: string; email: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/waitlist/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        throw { message: 'Failed to parse response', status: response.status } as ApiError;
      }
    } else {
      const text = await response.text();
      throw { message: text || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData;
  },

  submitTherapistWaitlist: async (data: { name: string; email: string; phone?: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/waitlist/therapist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        throw { message: 'Failed to parse response', status: response.status } as ApiError;
      }
    } else {
      const text = await response.text();
      throw { message: text || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData;
  },

  getUserWaitlist: async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/waitlist/user`);
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data;
  },

  getTherapistWaitlist: async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/waitlist/therapist`);
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data;
  },

  deleteUserWaitlistEntry: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/waitlist/user?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAdminAuthHeaders(),
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data;
  },

  deleteTherapistWaitlistEntry: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/waitlist/therapist?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAdminAuthHeaders(),
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data;
  },

  // Admin auth routes
  adminSignin: async (data: { username: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData;
  },
};

// Group community forum interfaces
export interface Group {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  created_by: string;
  created_at: string;
  member_count: number;
  is_public: boolean;
  tags?: string[];
  is_creator?: boolean;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  tags?: string[];
}

export interface CreateGroupResponse {
  success: boolean;
  message: string;
  group?: Group;
}

export interface GetGroupsResponse {
  success: boolean;
  groups: Group[];
  total: number;
}

export interface JoinGroupResponse {
  success: boolean;
  message: string;
}

export interface GroupMember {
  user_id: string;
  username: string;
  joined_at: string;
}

export interface GetGroupMembersResponse {
  success: boolean;
  members: GroupMember[];
  total: number;
}

export interface GroupMessage {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  username: string;
  group_id?: string;
}

export interface GetGroupMessagesResponse {
  success: boolean;
  messages: GroupMessage[];
  has_more: boolean;
  total: number;
}

export interface SendGroupMessageData {
  message: string;
}

export interface SendGroupMessageResponse {
  success: boolean;
  message: string;
  msg?: GroupMessage;
}

export interface UpdateGroupData {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("session_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function getMe(): Promise<{ user_id: string; username: string } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
    const data = await response.json();
    if (!response.ok || !data.success) return null;
    return { user_id: data.user_id, username: data.username };
  } catch {
    return null;
  }
}

// Group community forum API functions (removed)
/*
export const groupApi = {
  createGroup: async (data: CreateGroupData): Promise<CreateGroupResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData as CreateGroupResponse;
  },

  getGroups: async (limit?: number, skip?: number, search?: string, tag?: string): Promise<GetGroupsResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    if (search && search.trim()) params.append('q', search.trim());
    if (tag && tag.trim()) params.append('tag', tag.trim());
    
    const url = `${API_BASE_URL}/api/groups${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    let data: Partial<GetGroupsResponse> | null = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        // Backend returned an empty body or invalid JSON
        throw {
          message: `Invalid JSON response from /api/groups (status ${response.status})`,
          status: response.status,
        } as ApiError;
      }
    } else {
      const text = await response.text();
      throw {
        message: text || `HTTP error! status: ${response.status}`,
        status: response.status,
      } as ApiError;
    }
    
    if (!response.ok) {
      throw {
        message: (data && 'message' in data ? data.message : undefined) || `HTTP error! status: ${response.status}`,
        status: response.status,
      } as ApiError;
    }

    // Ensure groups is always an array
    // At this point, data should not be null since we would have thrown an error above if it was
    if (!data) {
      throw {
        message: `Unexpected error: no data received`,
        status: response.status,
      } as ApiError;
    }
    
    return {
      success: data.success || false,
      groups: Array.isArray(data.groups) ? data.groups : [],
      total: data.total || 0,
    } as GetGroupsResponse;
  },

  joinGroup: async (groupId: string): Promise<JoinGroupResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/groups/join?group_id=${encodeURIComponent(groupId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    
    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData as JoinGroupResponse;
  },

  getGroupMembers: async (groupId: string): Promise<GetGroupMembersResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/groups/members?group_id=${encodeURIComponent(groupId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    // Ensure members is always an array
    return {
      success: data.success || false,
      members: Array.isArray(data.members) ? data.members : [],
      total: data.total || 0,
    } as GetGroupMembersResponse;
  },

  getGroupMessages: async (groupId: string, limit?: number, skip?: number): Promise<GetGroupMessagesResponse> => {
    const params = new URLSearchParams();
    params.append('group_id', groupId);
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/groups/messages?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    // Ensure messages is always an array
    return {
      success: data.success || false,
      messages: Array.isArray(data.messages) ? data.messages : [],
      has_more: data.has_more || false,
      total: data.total || 0,
    } as GetGroupMessagesResponse;
  },

  sendGroupMessage: async (groupId: string, data: SendGroupMessageData): Promise<SendGroupMessageResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/groups/messages?group_id=${encodeURIComponent(groupId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData as SendGroupMessageResponse;
  },

  updateGroup: async (data: UpdateGroupData): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/groups`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData as { success: boolean; message: string };
  },

  deleteGroup: async (groupId: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/groups?group_id=${encodeURIComponent(groupId)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData as { success: boolean; message: string };
  },
};
*/

// New Telegram-style community API
export const groupApi = {
  createGroup: async (data: CreateGroupData): Promise<CreateGroupResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData as CreateGroupResponse;
  },

  getGroups: async (limit?: number, skip?: number, search?: string, tag?: string): Promise<GetGroupsResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    if (search && search.trim()) params.append('q', search.trim());
    if (tag && tag.trim()) params.append('tag', tag.trim());

    const url = `${API_BASE_URL}/api/groups${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }

    return {
      success: data.success || false,
      groups: Array.isArray(data.groups) ? data.groups : [],
      total: data.total || 0,
    } as GetGroupsResponse;
  },

  joinGroup: async (groupId: string): Promise<JoinGroupResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/groups/join?group_id=${encodeURIComponent(groupId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData as JoinGroupResponse;
  },

  getGroupMembers: async (groupId: string): Promise<GetGroupMembersResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/groups/members?group_id=${encodeURIComponent(groupId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return {
      success: data.success || false,
      members: Array.isArray(data.members) ? data.members : [],
      total: data.total || 0,
    } as GetGroupMembersResponse;
  },

  updateGroup: async (data: UpdateGroupData): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/groups`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData as { success: boolean; message: string };
  },

  deleteGroup: async (groupId: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/groups?group_id=${encodeURIComponent(groupId)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw { message: responseData.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return responseData as { success: boolean; message: string };
  },

  removeMember: async (groupId: string, userId: string): Promise<{ success: boolean; message: string }> => {
    const params = new URLSearchParams({ group_id: groupId, user_id: userId });
    const response = await fetch(`${API_BASE_URL}/api/groups/member?${params.toString()}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }
    return data as { success: boolean; message: string };
  },
};

export interface ChatHistoryResponse {
  success: boolean;
  messages: GroupMessage[];
  has_more: boolean;
}

export const chatApi = {
  loadHistory: async (groupId: string, before?: string, limit?: number): Promise<ChatHistoryResponse> => {
    const params = new URLSearchParams();
    params.append("group_id", groupId);
    if (before) params.append("before", before);
    if (limit) params.append("limit", limit.toString());

    const response = await fetch(`${API_BASE_URL}/api/chat/history?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || `HTTP error! status: ${response.status}`, status: response.status } as ApiError;
    }

    const rawMessages = Array.isArray(data.messages) ? data.messages : [];

    interface RawChatMessage {
      id?: string;
      _id?: string;
      sender_id?: string;
      timestamp?: string;
      message?: string;
      created_at?: string;
      user_id?: string;
      username?: string;
      group_id?: string;
    }

    const messages: GroupMessage[] = (rawMessages as RawChatMessage[]).map((m) => ({
      id: m.id || m._id || `${m.sender_id || ""}-${m.timestamp || ""}`,
      message: m.message ?? "",
      created_at: m.created_at || m.timestamp || "",
      user_id: m.user_id || m.sender_id || "",
      username: m.username || "Unknown",
      group_id: m.group_id,
    }));

    return {
      success: data.success,
      messages,
      has_more: data.has_more || false,
    };
  },
};

