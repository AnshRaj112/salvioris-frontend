export interface ReferralCode {
  id: string;
  code: string;
  created_at: string;
  expires_at?: string;
  usage_limit?: number;
  usage_count: number;
  is_revoked: boolean;
}

export interface ConnectedUser {
  user_id: string;
  username: string;
  connected_at: string;
  connection_type: string;
}

export interface ConnectionRequest {
  id: string;
  user_id: string;
  username: string;
  created_at: string;
  note?: string;
}

export interface ReferralAnalytics {
  total_codes: number;
  active_codes: number;
  total_signups: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface OnboardedPatient {
  id: string;
  user_id: string;
  patient_name: string;
  patient_email: string;
  username: string;
  referral_code: string;
  onboarded_at: string;
  status: "pending" | "activated";
}
