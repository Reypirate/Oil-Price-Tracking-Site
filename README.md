# Oil Price Tracker SaaS

A comprehensive, automated web application for tracking global commodity prices. This platform provides real-time data visualization, personalized user portfolios, and an automated background engine that dispatches email alerts based on custom price thresholds.

## Application Architecture

This project utilizes a modern, serverless stack optimized for performance, scalability, and minimal initial overhead.

* **Frontend:** Next.js (App Router) utilizing Server Components for optimal initial load times and SEO.
* **Styling & Typography:** Tailwind CSS, utilizing Inter for the primary interface and Playfair Display for prominent data points and headers.
* **Data Visualization:** Recharts for rendering interactive, time-series data of commodity prices.
* **Database & Authentication:** Supabase. Handles PostgreSQL data storage, user session management, and Row Level Security (RLS) to ensure data isolation between tenants.
* **Background Processing:** Vercel Cron. Triggers secure API routes on a schedule to process data and evaluate user alerts without requiring active user sessions.
* **Transactional Email:** Resend, paired with React Email for constructing responsive notification templates.
* **Market Data:** OilPriceAPI.com serving as the primary oracle for real-time and historical commodity pricing.

## System Requirements and Setup

### Prerequisites

To run this project locally, you must establish accounts and obtain API keys for the following services:
* Supabase (Project URL and Anon Key)
* Resend (API Key)
* OilPriceAPI.com (API Key)
* Vercel (For deployment and Cron setup)

### Local Development Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/oil-price-tracker.git](https://github.com/yourusername/oil-price-tracker.git)
    cd oil-price-tracker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env.local` file in the root directory. Populate it with your specific service credentials:
    ```env
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_for_admin_tasks
    
    # External API Integrations
    OIL_PRICE_API_KEY=your_oilpriceapi_key
    RESEND_API_KEY=your_resend_api_key
    
    # Internal Security
    CRON_SECRET=generate_a_secure_random_string
    ```

4.  **Database Initialization:**
    Navigate to your Supabase project dashboard. Open the SQL Editor and execute the contents of the `supabase/schema.sql` file located in this repository. This will provision the necessary tables (`users`, `portfolios`, `alerts`, `subscriptions`) and enforce Row Level Security policies.

5.  **Initialize the Development Server:**
    ```bash
    npm run dev
    ```

6.  **Access the Application:**
    Open your browser and navigate to `http://localhost:3000`.

## Automated Alert Engine (Cron)

The core value of this SaaS is the automated alert system. This is managed via the `vercel.json` configuration file, which instructs Vercel to ping the `/api/cron/process-alerts` endpoint at specified intervals (e.g., hourly).

**Execution Flow:**
1.  Vercel Cron issues a GET request to the endpoint, passing the `CRON_SECRET` in the Authorization header.
2.  The server verifies the secret. If valid, it fetches the latest spot prices from OilPriceAPI.com.
3.  The server queries the Supabase `alerts` table for active triggers that match the new price data.
4.  For every matched alert, the server constructs an HTML email and dispatches it via the Resend API, then updates the database record to prevent duplicate alerts.

## Subscription Tiers

The application logic includes tier-based limitations enforced at the application level:
* **Free Tier:** Restricted to tracking a maximum of 2 assets and maintaining 1 active price alert.
* **Paid Tier:** Unlocks unlimited asset tracking and unlimited active price alerts.