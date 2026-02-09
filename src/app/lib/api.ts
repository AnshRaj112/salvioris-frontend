const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface ApiError {
  message: string;
  status?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  user?: T;
  token?: string;
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
      } catch (e) {
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
      } catch (e) {
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
      } catch (error) {
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
      } catch (error) {
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
};

