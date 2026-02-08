# How to Publish Your AI Agent

## Recommended Platform: Railway

Railway is excellent for AI apps because it supports long-running processes (no timeouts) and uses Docker containers.

### Prerequisites

1.  A [GitHub](https://github.com/) account.
2.  A [Railway](https://railway.app/) account (sign up with GitHub).
3.  Your API keys (`OPENAI_API_KEY`, etc.).

### Step-by-Step Guide

#### 1. Push your code to GitHub
*(Verify your repository is up to date)*
```bash
git add .
git commit -m "Ready for deployment"
git push
```

#### 2. Deploy to Railway
1.  Log in to [Railway.app](https://railway.app/).
2.  Click **"New Project"** -> **"Deploy from GitHub repo"**.
3.  Select your `job-hunt-ai` repository.
4.  **Important**: Railway will automatically detect the `Dockerfile`.

#### 3. Configure Environment Variables
Your AI will not start without these keys.

1.  Click on your new project card to open it.
2.  Go to the **"Variables"** tab.
3.  Add the following keys (copy values from your local `.env.local`):

| Key | Value |
| :--- | :--- |
| `OPENAI_API_KEY` | `sk-...` (Paste your full key) |
| `OPENAI_ASSISTANT_ID` | `asst_...` (Paste your assistant ID) |
| `EMAIL_USER` | `your_email@gmail.com` |
| `EMAIL_PASS` | `xxxx xxxx ...` (Your App Password) |
| `PORT` | `3000` |

#### 4. Verify Deployment
1.  Go to the **"Settings"** tab.
2.  Under **"Networking"**, click **"Generate Domain"**.
3.  This gives you a public URL (e.g., `job-hunt-ai-production.up.railway.app`).
4.  Click it to test your bot!

### Troubleshooting
-   **Build Failures**: Check the "Build Logs" tab.
-   **Runtime Errors**: Check the "Deploy Logs" tab. Common issues are missing environment variables.

### How to Update
1.  Make changes locally.
2.  Push to GitHub.
3.  **Railway automatically redeploys** your new code.
