# FLO Spa Booking - Deployment Guide

## 🚀 Free Hosting Options

### Recommended Setup:

- **Frontend**: Vercel (Free)
- **Database**: Railway or PlanetScale (Free tier)

---

## 📋 Step-by-Step Deployment

### Option 1: Vercel + Railway (Easiest)

#### 1. Set Up Database on Railway

1. Go to [railway.app](https://railway.app/)
2. Sign up with GitHub
3. Click "New Project" → "Provision MySQL"
4. Once created, click on MySQL service
5. Go to "Variables" tab and copy the `DATABASE_URL`
   - It looks like: `mysql://root:password@containers-us-west-xx.railway.app:port/railway`

#### 2. Deploy to Vercel

1. Push your code to GitHub:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/spa-booking-stlucia.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com/)
3. Sign up with GitHub
4. Click "New Project"
5. Import your GitHub repository
6. Configure environment variables:
   - `DATABASE_URL`: Paste Railway MySQL URL
   - `NEXTAUTH_URL`: Will be your Vercel URL (e.g., `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET`: Generate one with: `openssl rand -base64 32`
   - `STRIPE_SECRET_KEY`: Leave empty or use test key
   - `STRIPE_WEBHOOK_SECRET`: Leave empty for now
7. Click "Deploy"

#### 3. Set Up Database Schema

After deployment, run migrations:

1. In your Vercel project, go to "Settings" → "Environment Variables"
2. Copy the `DATABASE_URL`
3. In your local terminal:

   ```bash
   # Set the production database URL temporarily
   export DATABASE_URL="your-railway-mysql-url"

   # Push schema to production database
   npx prisma db push

   # Seed the database
   npx tsx prisma/seed.ts
   ```

#### 4. Update NEXTAUTH_URL

1. After first deploy, copy your Vercel URL (e.g., `https://flo-spa.vercel.app`)
2. Go to Vercel → Your Project → Settings → Environment Variables
3. Update `NEXTAUTH_URL` to your actual Vercel URL
4. Redeploy

---

### Option 2: Vercel + PlanetScale

#### 1. Set Up Database on PlanetScale

1. Go to [planetscale.com](https://planetscale.com/)
2. Sign up (free tier available)
3. Create new database: "spa-booking"
4. Get connection string:
   - Click "Connect"
   - Select "Prisma"
   - Copy the `DATABASE_URL`

#### 2. Update Prisma Schema

Since PlanetScale doesn't support foreign key constraints by default:

In `prisma/schema.prisma`, add to the datasource:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```

#### 3. Deploy to Vercel (same as Option 1, step 2-4)

---

### Option 3: Railway (All-in-One)

1. Go to [railway.app](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Railway will auto-detect Next.js
5. Add MySQL service: "New" → "Database" → "MySQL"
6. Set environment variables in Railway dashboard
7. Deploy!

---

## 🔐 Important: Environment Variables

Make sure to set these in your hosting platform:

**Required:**

- `DATABASE_URL` - From Railway/PlanetScale
- `NEXTAUTH_URL` - Your deployed app URL
- `NEXTAUTH_SECRET` - Random secret string

**Optional:**

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Generate NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

---

## 📝 Post-Deployment Checklist

- [ ] Database schema pushed (`prisma db push`)
- [ ] Database seeded with sample data
- [ ] `NEXTAUTH_URL` updated with actual deployment URL
- [ ] Test login functionality
- [ ] Test booking flow
- [ ] Check all spa images load correctly

---

## 🐛 Troubleshooting

**"Error: P1001 - Can't reach database"**

- Check DATABASE_URL is correct
- Ensure database allows external connections
- Railway: Check if MySQL service is running

**"NextAuth configuration error"**

- Verify NEXTAUTH_URL matches your deployed URL
- Check NEXTAUTH_SECRET is set

**Build fails on Vercel**

- Check build logs
- Ensure `prisma generate` runs in build script (already configured)
- Verify all dependencies are in package.json

---

## 💰 Cost Breakdown (Free Tiers)

- **Vercel**: Free (100GB bandwidth, unlimited projects)
- **Railway**: $5 credit/month (MySQL ~$5/month after trial)
- **PlanetScale**: Free (1 database, 5GB storage, 1 billion row reads/month)

**Recommendation**: Start with Vercel + PlanetScale for completely free hosting, or Vercel + Railway for easier setup.
