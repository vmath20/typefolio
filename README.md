2. **Create a Product and Price**

   ```bash
   # Using Stripe CLI or dashboard
   stripe products create --name "Typefolio Portfolio Hosting"
   stripe prices create --product=prod_xxx --unit-amount=500 --currency=usd --recurring[interval]=month
   ```

3. **Set Up Webhooks**

   ```bash
   # Install Stripe CLI
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the webhook secret to your `.env.local`

### 5. Vercel Setup

1. **Deploy to Vercel**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

2. **Configure Domain**

   - In your Vercel dashboard, go to your project
   - Add your domain (typefolio.xyz)
   - Configure DNS settings

3. **Get Vercel Tokens**

   - Go to Vercel dashboard > Settings > Tokens
   - Create a new token
   - Update your `.env.local` with the token

### 6. Run the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## Database Schema

The application uses the following main tables:

- **users**: User profiles and onboarding data
- **portfolios**: Portfolio metadata and settings
- **resume_data**: Parsed and enhanced resume data
- **subscriptions**: Stripe subscription information
- **deployments**: Vercel deployment tracking

## API Endpoints

- `POST /api/parse-resume`: Parse PDF resume to text
- `POST /api/refine-resume`: Enhance resume data with AI
- `POST /api/fetch-logos`: Fetch company/institution logos
- `POST /api/create-checkout-session`: Create Stripe checkout session
- `POST /api/webhooks/stripe`: Handle Stripe webhooks
- `POST /api/deploy-portfolio`: Deploy portfolio to Vercel
- `GET /api/deployment-status`: Check deployment status
- `POST /api/verify-session`: Verify Stripe session

## File Structure

```
typefolio/
├── pages/
│   ├── api/                    # API routes
│   ├── onboarding.tsx         # Onboarding flow
│   ├── index.tsx              # Upload page
│   ├── processing.tsx         # Processing page
│   ├── results.tsx            # Results editing page
│   ├── templates.tsx          # Template selection
│   ├── portfolio.tsx          # Portfolio preview
│   ├── publish.tsx            # Publish page
│   ├── success.tsx            # Success page
│   └── [subdomain].tsx        # Dynamic portfolio pages
├── lib/
│   └── supabase.ts            # Supabase client
├── styles/
│   └── globals.css            # Global styles
├── public/                    # Static assets
└── supabase-schema.sql        # Database schema
```

## Deployment

### Vercel Deployment

1. **Connect to GitHub**

   - Push your code to GitHub
   - Connect your repository to Vercel
   - Configure environment variables in Vercel dashboard

2. **Domain Configuration**

   - Add your domain in Vercel
   - Configure DNS records
   - Set up SSL certificates

3. **Environment Variables**

   - Add all environment variables to Vercel
   - Ensure production keys are used

### Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Stripe webhook endpoint configured
- [ ] Domain DNS configured
- [ ] SSL certificates active
- [ ] Database migrations run
- [ ] Storage buckets created
- [ ] Authentication configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@typefolio.xyz or create an issue in the GitHub repository.

## Roadmap

- [ ] Custom domain support
- [ ] More portfolio templates
- [ ] Analytics dashboard
- [ ] Team collaboration
- [ ] Advanced customization options
- [ ] Mobile app 