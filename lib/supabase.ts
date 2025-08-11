import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  name?: string
  use_case?: string
  referral_source?: string
  created_at: string
  updated_at: string
}

export interface Portfolio {
  id: string
  user_id: string
  subdomain: string
  custom_domain?: string
  title?: string
  description?: string
  is_published: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ResumeData {
  id: string
  portfolio_id: string
  original_resume_url?: string
  parsed_text?: string
  extracted_json?: any
  enhanced_json?: any
  final_json?: any
  template_id: number
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  portfolio_id: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_price_id?: string
  status: string
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface Deployment {
  id: string
  portfolio_id: string
  vercel_deployment_id?: string
  vercel_project_id?: string
  deployment_url?: string
  status: string
  created_at: string
  updated_at: string
} 