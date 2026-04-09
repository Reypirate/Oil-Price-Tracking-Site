# Oil Price Tracker SaaS

A comprehensive, automated web application for tracking global commodity prices. This platform provides real-time data visualization, personalized user portfolios, and an automated background engine that dispatches email alerts based on custom price thresholds.

## Built With

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)

### Primary Stack
- **Framework:** Next.js (App Router) with React Canary
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Infrastructure:** [Vercel Cron](https://vercel.com/docs/cron-jobs) for automated background tasks
- **Data Oracle:** [OilPriceAPI.com](https://oilpriceapi.com/) for real-time commodity data
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + Lucide Icons
- **Visuals:** [Recharts](https://recharts.org/) for price analytics
- **Communication:** [Resend](https://resend.com/) for transactional alerts
- **Reliability:** [Zod](https://zod.dev/) for type-safe validation

### Developer Experience (DX)
- **Runtime:** [Bun](https://bun.sh/) for optimized execution
- **Linting & Formatting:** [Biome](https://biomejs.dev/) + [Oxlint](https://oxlint.dev/)
- **Workflow:** [Husky](https://typicode.github.io/husky/) + [Lint-staged](https://github.com/lint-staged/lint-staged)


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
    Navigate to your Supabase project dashboard. Open the SQL Editor and execute the contents of the `supabase/schema.sql` file located in this repository. This will provision the necessary tables (`profiles`, `portfolios`, `alerts`) and enforce Row Level Security policies.

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
