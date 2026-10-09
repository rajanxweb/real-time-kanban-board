# Manual Deployment Guide

This guide deploys PostgreSQL to Neon, the Express API to Render, and the Vite client to Vercel. The API allows exactly the origin configured in `CLIENT_ORIGIN`; use the production Vercel URL there.

## 1. Create the Neon database

1. Sign in to [Neon](https://console.neon.tech/) and create a project and PostgreSQL database.
2. Open **Connect** in the project dashboard and select the branch, database, and role for this app.
3. Copy the connection string with **Pooled connection** enabled. This URL has `-pooler` in its hostname. Save it as `DATABASE_URL`; Prisma Client uses this URL for application queries.
4. Copy the connection string again with **Pooled connection** disabled. Save it as `DIRECT_URL`; Prisma migrations use the direct database connection.
5. Keep the `sslmode=require` parameter and do not commit either URL.

Neon describes pooled connection strings in its [connection guide](https://neon.com/docs/get-started/connect-neon). Prisma v6 supports a separate `directUrl` for migration commands when the application URL uses a pooler ([Prisma schema reference](https://www.prisma.io/docs/orm/v6/reference/prisma-schema-reference)).

## 2. Create the Vercel project and get its URL

1. In the [Vercel Dashboard](https://vercel.com/dashboard), choose **Add New → Project** and import this GitHub repository.
2. Set the project configuration:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Deploy once to create the project’s production URL. The app can build before its API environment variables are configured; its API requests will not work until the later steps are complete.
4. Copy the production URL, for example `https://your-project.vercel.app`.

Vercel’s [Vite SPA guide](https://vercel.com/docs/frameworks/frontend/vite) documents these project settings and the rewrite behavior.

## 3. Deploy the server to Render

1. In the [Render Dashboard](https://dashboard.render.com/), choose **New + → Web Service**, connect this GitHub repository, and select the deployment branch.
2. Set **Root Directory** to `server`.
3. Set **Build Command** to `npm ci && npm run build`.
4. Set **Start Command** to `npx prisma migrate deploy && npm start`.
5. Add these environment variables in the service’s **Environment** settings:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled connection string from step 1 |
   | `DIRECT_URL` | Neon direct connection string from step 1 |
   | `JWT_SECRET` | A newly generated random secret; keep it private |
   | `CLIENT_ORIGIN` | The production Vercel URL copied in step 2 |
   | `TRUST_PROXY_HOPS` | `1` |

   Render supplies `PORT`; the server listens on that port at `0.0.0.0`. `TRUST_PROXY_HOPS=1` configures Express to use the client address forwarded through Render’s single proxy hop. Keep this value aligned with the hosting proxy path; Express documents the security implications of trusting forwarded headers [here](https://expressjs.com/en/guide/behind-proxies/).

6. Create the service and wait for the first deploy. Copy its public URL, for example `https://your-api.onrender.com`.

Render’s official [Express deploy guide](https://render.com/docs/deploy-node-express-app) and [web service settings](https://render.com/docs/web-services) describe the dashboard fields and port behavior.

## 4. Configure and redeploy the Vercel client

1. Open the Vercel project’s **Settings → Environment Variables**.
2. Add both variables for the **Production** environment (and Preview too if you have a separately configured preview API):

   | Name | Value |
   | --- | --- |
   | `VITE_API_BASE_URL` | `https://your-api.onrender.com/api/v1` |
   | `VITE_SOCKET_URL` | `https://your-api.onrender.com` |

   Replace `your-api` with the Render service name. These values are embedded during the Vite build, so save them before deploying and redeploy after changing either value.

3. Redeploy the Vercel project so the new build embeds these values.
4. Confirm Render’s `CLIENT_ORIGIN` matches the exact Vercel production URL. If you use a custom Vercel domain, set `CLIENT_ORIGIN` to that domain and save the change so Render redeploys. REST CORS and Socket.IO CORS both use this same setting.
5. For Preview deployments, use the matching preview origin in Render before testing; the server intentionally accepts one configured origin.

The project includes [`client/vercel.json`](../client/vercel.json) so Vercel serves the Vite entry page for client-side routes. See Vercel’s [environment variable guide](https://vercel.com/docs/environment-variables) for current dashboard labels and behavior.

## Free plan notes

Free services may sleep or scale to zero when idle, which can make the first request slow. Free plans also have usage, storage, and connection limits. Provider plans and limits can change; check the current [Render free plan details](https://render.com/docs/free) and [Neon compute documentation](https://neon.com/docs/manage/endpoints) before deployment.
