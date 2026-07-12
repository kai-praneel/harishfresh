# HarishFresh Production Deployment Guide

This document outlines the end-to-end process for deploying the HarishFresh platform to a production environment (like Render). It is designed to be completely environment-driven, meaning no code changes are required to deploy.

## Architecture Overview
The platform is maintained as a **single Git repository (monorepo)** containing both the frontend and backend. It consists of:
1. **PostgreSQL Database**: Managed database for storing application data.
2. **Backend API (FastAPI)**: Serves data, handles business logic, and manages ImageKit interactions.
3. **Frontend Application (Next.js)**: The customer-facing storefront and admin dashboard.
4. **ImageKit (Storage)**: A cloud CDN and media storage provider for product images.

> [!IMPORTANT]
> Keep all sensitive credentials (like database URLs, Razorpay keys, and ImageKit private keys) securely within your deployment platform's Environment Variables settings. Never commit them to version control or expose them to the frontend.

---

## 1. Environment Templates and Setup
To maintain a clear separation between environments and ensure security:
- **Environment Templates**: 
  - `backend/.env.example` serves as the backend environment variable template.
  - `frontend/.env.local.example` serves as the frontend environment variable template.
  - Developers should copy these templates to `.env` and `.env.local` respectively and populate them with environment-specific values.
  - The actual `.env` and `.env.local` files must remain excluded from version control through `.gitignore`.
- **Local Development**: Set `STORAGE_PROVIDER=local` in the backend so images are saved directly to your local machine (the `uploads/` directory).
- **Production**: Configure environment variables directly in your deployment platform's dashboard. Set `STORAGE_PROVIDER=imagekit` so images are uploaded to the cloud CDN.

## 2. Managed PostgreSQL Setup
1. Create a managed PostgreSQL database (e.g., Render PostgreSQL).
2. Copy the **Internal Database URL** (for the backend running on the same platform) or the **External Database URL**.

## 3. ImageKit Configuration
1. Sign up for a free [ImageKit](https://imagekit.io) account.
2. Navigate to **Developer Options** in the ImageKit dashboard.
3. Copy the following keys:
   - **URL Endpoint** (e.g., `https://ik.imagekit.io/your_id/`)
   - **Public Key**
   - **Private Key** (Keep this secure; only the backend will use it).

## 4. Backend Deployment (Render Web Service)

### Setup
Render should deploy the Backend as a separate Web Service from the same repository.
1. Create a new **Web Service** on Render and connect it to your repository.
2. **Crucial**: Set the **Root Directory** to `backend`.
3. Set the following build and start commands:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Environment Variables
Configure the following environment variables in the Render dashboard for the Backend service:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | Your PostgreSQL connection string. |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend URLs (e.g., `https://your-frontend.onrender.com`). |
| `FRONTEND_URL` | The primary frontend URL (used for redirects/links if any). |
| `STORAGE_PROVIDER` | Set exactly to `imagekit`. |
| `IMAGEKIT_PUBLIC_KEY` | Your ImageKit Public Key. |
| `IMAGEKIT_PRIVATE_KEY` | Your ImageKit Private Key (Keep Secret!). |
| `IMAGEKIT_URL_ENDPOINT` | Your ImageKit URL Endpoint. |
| `RAZORPAY_KEY_ID` | Razorpay Key ID. |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret. |
| `ADMIN_USERNAME` | Admin login username. |
| `ADMIN_PASSWORD` | Admin login password. |
| `SECRET_KEY` | A long, random string for JWT signing. |

### One-time Database Migration
After the backend deploys successfully for the first time, you need to run the database migration to ensure the new storage tracking columns are present.
- In the Render Dashboard, go to your Backend Web Service.
- Open the **Shell** tab.
- Run the following command:
  ```bash
  python scripts/migrate_db.py
  ```
  *(This will safely add `image_file_id` to the products table).*

---

## 5. Frontend Deployment (Render Web Service)

### Setup
Render should deploy the Frontend as a separate Web Service from the same repository.
1. Create a second **Web Service** on Render connected to the same repository.
2. **Crucial**: Set the **Root Directory** to `frontend`.
3. Set the following commands:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

### Environment Variables
Configure the following environment variables in the Render dashboard for the Frontend service:

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | The public URL of your deployed Backend Service (e.g., `https://your-backend.onrender.com`). |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Your Razorpay Key ID (Safe to expose). |

> [!CAUTION]
> Never put the Razorpay Secret Key, Database URL, or ImageKit Private Key in the frontend environment variables. Only use variables prefixed with `NEXT_PUBLIC_`.

## 6. Custom Domain Configuration
Once your services are running on the default Render subdomains (`.onrender.com`), you should connect your custom domain (e.g., `www.harishfresh.com`).

1. **Connecting the Domain**: In the Render Dashboard for your Frontend service, go to settings and add your custom domain. Follow the prompts to configure your DNS records (CNAME/A records).
2. **Update Environment Variables**: 
   - **Frontend**: Ensure any hardcoded URLs or analytics tags point to the new domain.
   - **Backend**: 
     - Update the `CORS_ORIGINS` to include your new `https://www.yourcustomdomain.com`.
     - Update `FRONTEND_URL` to `https://www.yourcustomdomain.com`.
3. **Verify HTTPS**: Render automatically provisions TLS/SSL certificates for custom domains. Verify that visiting `https://www.yourcustomdomain.com` loads securely and displays the lock icon in the browser. Ensure all API requests correctly target the `https://` backend URL.

---

## 7. Final Production Acceptance Checklist
Before handing over the application, perform a complete walkthrough of the following core functionalities in the live production environment to ensure total platform stability.

- [ ] **Homepage**: Loads correctly with the new dynamic hero banner, free delivery message, featured products, and all category cards visible.
- [ ] **Categories**: Navigation filters products correctly.
- [ ] **Products**: Individual product pages load fast, displaying correct pricing, descriptions, and stock statuses.
- [ ] **Product Images**: Product images render smoothly from the ImageKit CDN.
- [ ] **Cart**: Adding, updating quantities, and removing items works seamlessly. Total calculation is accurate.
- [ ] **Checkout**: Validation for phone number and address fields works. Delivery radius validation (if enabled) executes properly based on Google Maps location mapping.
- [ ] **Razorpay**: The Razorpay overlay opens, test/live payments complete successfully, and orders are accurately marked as confirmed in the database.
- [ ] **Orders**: Customers can track orders using their order ID.
- [ ] **Admin Dashboard**: Authentication allows entry. Dashboard stats populate correctly.
- [ ] **Product & Category Management**: Admin can create, edit, and delete both products and categories without issue.
- [ ] **Image Upload / Update / Delete**: Uploading an image triggers ImageKit. Updating an image deletes the old ImageKit file and uploads the new one. Deleting a product entirely removes the image from the CDN.
- [ ] **Image Rendering**: The frontend exclusively uses the ImageKit URL for fetching and rendering media (no broken image links).
- [ ] **Environment Configuration**: Sensitive data (keys, DB URLs) are absent from the frontend source code and network payload.
- [ ] **HTTPS**: The custom domain forces HTTPS securely.
- [ ] **Custom Domain**: Site operates entirely on the custom domain without any cross-origin resource sharing (CORS) errors in the browser console.
