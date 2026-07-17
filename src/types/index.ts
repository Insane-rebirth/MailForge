export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  subscription_tier: 'free' | 'pro' | 'business'
  emails_used_this_month: number
  last_usage_reset: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface EmailHistory {
  id: string
  user_id: string
  input_data: {
    prospectInfo: string
    productDescription: string
  }
  output_subject: string
  output_body: string
  created_at: string
}

export interface UserUsage {
  emails_used: number
  monthly_quota: number
  subscription_tier: 'free' | 'pro' | 'business'
}

export interface PricingPlan {
  id: string
  name: string
  monthlyQuota: number
  price: number
}
