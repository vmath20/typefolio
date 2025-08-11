-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (no auth dependency)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    use_case TEXT,
    referral_source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    custom_domain TEXT,
    title TEXT,
    description TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resume_data table
CREATE TABLE IF NOT EXISTS public.resume_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    original_resume_url TEXT,
    parsed_text TEXT,
    extracted_json JSONB,
    enhanced_json JSONB,
    final_json JSONB,
    template_id INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    status TEXT NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deployments table
CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    vercel_deployment_id TEXT,
    vercel_project_id TEXT,
    deployment_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_subdomain ON public.portfolios(subdomain);
CREATE INDEX IF NOT EXISTS idx_resume_data_portfolio_id ON public.resume_data(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_deployments_portfolio_id ON public.deployments(portfolio_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resume_data_updated_at BEFORE UPDATE ON public.resume_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON public.deployments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolios', 'portfolios', true) ON CONFLICT (id) DO NOTHING;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- Users policies (no auth dependency)
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (true);

-- Portfolios policies (no auth dependency)
CREATE POLICY "Users can view own portfolios" ON public.portfolios FOR SELECT USING (true);
CREATE POLICY "Users can insert own portfolios" ON public.portfolios FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own portfolios" ON public.portfolios FOR UPDATE USING (true);
CREATE POLICY "Users can delete own portfolios" ON public.portfolios FOR DELETE USING (true);
CREATE POLICY "Anyone can view published portfolios" ON public.portfolios FOR SELECT USING (is_published = true);

-- Resume data policies (no auth dependency)
CREATE POLICY "Users can view own resume data" ON public.resume_data FOR SELECT USING (true);
CREATE POLICY "Users can insert own resume data" ON public.resume_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own resume data" ON public.resume_data FOR UPDATE USING (true);
CREATE POLICY "Users can delete own resume data" ON public.resume_data FOR DELETE USING (true);

-- Subscriptions policies (no auth dependency)
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (true);

-- Deployments policies (no auth dependency)
CREATE POLICY "Users can view own deployments" ON public.deployments FOR SELECT USING (true);
CREATE POLICY "Users can insert own deployments" ON public.deployments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own deployments" ON public.deployments FOR UPDATE USING (true);

-- Storage policies for resumes bucket (no auth dependency)
CREATE POLICY "Users can upload own resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "Users can view own resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
CREATE POLICY "Users can update own resumes" ON storage.objects FOR UPDATE USING (bucket_id = 'resumes');
CREATE POLICY "Users can delete own resumes" ON storage.objects FOR DELETE USING (bucket_id = 'resumes');

-- Storage policies for portfolios bucket (public read)
CREATE POLICY "Anyone can view portfolio assets" ON storage.objects FOR SELECT USING (bucket_id = 'portfolios');
CREATE POLICY "Users can upload portfolio assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolios');
CREATE POLICY "Users can update portfolio assets" ON storage.objects FOR UPDATE USING (bucket_id = 'portfolios');
CREATE POLICY "Users can delete portfolio assets" ON storage.objects FOR DELETE USING (bucket_id = 'portfolios');

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_user_portfolio(user_id TEXT)
RETURNS TABLE (
    portfolio_id UUID,
    subdomain TEXT,
    custom_domain TEXT,
    is_published BOOLEAN,
    template_id INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.subdomain, p.custom_domain, p.is_published, rd.template_id
    FROM public.portfolios p
    LEFT JOIN public.resume_data rd ON p.id = rd.portfolio_id
    WHERE p.user_id = user_id AND p.is_active = true
    ORDER BY p.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if subdomain is available
CREATE OR REPLACE FUNCTION is_subdomain_available(subdomain_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE subdomain = subdomain_text AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 