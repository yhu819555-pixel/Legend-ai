# Deploy Legend AI

## Free hosting (Render + Neon)

This is a hobby/testing deployment path; it does not require a VPS, Linux machine, or custom domain.

### Architecture
- Render Free Web Service runs the Node.js API from `backend/` and provides an HTTPS `onrender.com` URL.
- Neon Free provides managed PostgreSQL. Choose the Singapore region for a closer APAC location.
- The repository root `render.yaml` defines the Render Blueprint. It deploys the `feature/mvp-foundation` branch.

### 1. Create the database on Neon
1. Create a free account at https://neon.com/.
2. Create a project named `legend-ai`, choosing Singapore (`ap-southeast-1`) if offered.
3. Open the project's Connect dialog and copy the pooled connection string (hostname contains `-pooler`) for the app.
4. Keep this connection string private. Do not put it in GitHub or send it in chat.

### 2. Deploy the API on Render
1. Create a free account at https://render.com/.
2. Connect the GitHub account that owns `yhu819555-pixel/Legend-ai`.
3. In Render, choose New > Blueprint.
4. Select `yhu819555-pixel/Legend-ai`, branch `feature/mvp-foundation`, and the root `render.yaml` file.
5. Render reads the Blueprint and asks for the three secret values:
   - `DATABASE_URL`: the Neon pooled connection string.
   - `APP_API_TOKEN`: generate a long random secret (at least 32 random bytes). Keep it private.
   - `AI_API_KEY`: your OpenAI API key. This is a separate provider credential and may incur API charges.
6. Confirm the service uses the Free plan, review the resources and any billing prompts, then deploy the Blueprint.
7. Wait for the deployment to finish. Copy the service's HTTPS URL, for example `https://legend-ai-api.onrender.com`.
8. Test `https://YOUR-SERVICE.onrender.com/health`; expected JSON is `{"status":"ok","service":"my-ai-agent-api"}`.

### 3. Connect the Android app
In Legend AI Settings:
- Backend URL: the Render HTTPS service URL.
- Access token: the exact `APP_API_TOKEN` set in Render.

The OpenAI API key stays on Render and must never be entered in the Android app.

### Free-tier limitations and safety
- Render Free web services sleep after 15 minutes without traffic and can take about a minute to wake up. Their filesystem is temporary.
- Neon Free currently includes 1 GB storage per project and 100 compute-hours per month; compute scales to zero after 5 minutes idle. Monitor usage.
- Free hosting is suitable for testing/hobby use, not production guarantees. Do not store important data without separate backups.
- This backend currently uses one shared app token, not per-user accounts or project-level user isolation. Keep the service private to your own testing; do not distribute the token or expose the app as a public multi-user service.
- OpenAI API usage is billed separately according to the account's API pricing. Free hosting does not mean free AI requests.
- Do not commit secrets, put them in APKs, or paste them into chat.

## VPS deployment

The Docker-based VPS setup remains available for later, if you obtain a Linux server and domain. It is not required for the free Render + Neon path.
