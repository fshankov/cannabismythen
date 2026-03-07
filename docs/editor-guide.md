# Editor Guide

This guide explains how to set up and use Keystatic for content editing, including GitHub app creation, collaborator setup, and the editorial workflow.

## For the Repository Owner

### Step 1: Create a GitHub Repository

1. Create a new repository on GitHub (e.g., `cannabis-science-web`)
2. Push the project code to it
3. Set the repository to **private** (recommended during development)

### Step 2: Create a GitHub OAuth App

Keystatic in GitHub mode requires a GitHub OAuth App for authentication.

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   (Direct link: https://github.com/settings/applications/new)

2. Fill in:
   - **Application name**: `Cannabis Science CMS` (or any name)
   - **Homepage URL**: Your deployed site URL (e.g., `https://cannabis-science.example.com`)
   - **Authorization callback URL**: `https://cannabis-science.example.com/api/keystatic/github/oauth/callback`

   For local development, create a second OAuth App with:
   - **Homepage URL**: `http://localhost:4321`
   - **Authorization callback URL**: `http://localhost:4321/api/keystatic/github/oauth/callback`

3. After creation, note the **Client ID** and generate a **Client Secret**.

### Step 3: Configure Environment Variables

Create a `.env` file in the project root (never commit this file):

```
KEYSTATIC_GITHUB_CLIENT_ID=your_client_id_here
KEYSTATIC_GITHUB_CLIENT_SECRET=your_client_secret_here
KEYSTATIC_SECRET=a_random_secret_string
```

Generate the secret with:

```bash
openssl rand -hex 32
```

For deployment platforms (Vercel, Netlify, etc.), set these as environment variables in the platform's settings.

### Step 4: Update keystatic.config.ts

Replace the placeholder values in `keystatic.config.ts`:

```ts
storage: {
  kind: "github",
  repo: {
    owner: "your-github-username",  // ← Replace
    name: "cannabis-science-web",   // ← Replace if different
  },
},
```

### Step 5: Invite Collaborators

1. Go to your repository on GitHub
2. **Settings → Collaborators → Add people**
3. Enter the collaborator's GitHub username or email
4. They will receive an invitation email
5. Once accepted, they have write access to the repository

**Collaborators need:**
- A free GitHub account (https://github.com/join)
- Write access to the repository (you grant this)
- Nothing else — no Git knowledge, no local setup required

### Step 6: Deploy

Deploy to a platform that supports Astro hybrid mode:

**Vercel (recommended):**
```bash
npm install @astrojs/vercel
```

Update `astro.config.mjs`:
```js
import vercel from "@astrojs/vercel";

export default defineConfig({
  // ...
  output: "hybrid",
  adapter: vercel(),
});
```

Set environment variables in Vercel dashboard, then deploy.

## For Collaborators

### Getting Started

1. **You need:** A free GitHub account. If you don't have one, sign up at https://github.com/join
2. **Accept the invitation:** The repository owner will send you an invite. Check your email.
3. **Open the CMS:** Navigate to the deployed site's `/keystatic` URL (e.g., `https://cannabis-science.example.com/keystatic`)
4. **Sign in:** Click "Sign in with GitHub" and authorize the app
5. **Start editing:** You'll see all content collections in the sidebar

### Editing Content

1. Click a collection in the sidebar (e.g., "Factsheets")
2. Click an entry to open it
3. Edit fields and content in the visual editor
4. Click **Save** when done
5. Keystatic creates a Git commit automatically — no Git knowledge needed

### Content Status

- **Draft**: Not visible on the public website. Use this for work in progress.
- **Published**: Visible on the public website.

### Internal Notes

The "Internal Notes" field in every entry is for editorial communication:
- TODOs for yourself or colleagues
- Questions about the content
- Review status
- Source notes

**These notes are never shown on the public website.** They are only visible in the CMS.

### Best Practices

- Always fill in the **Summary** field — it appears in listings and search results
- Use **Internal Notes** for editorial communication instead of HTML comments
- Set status to **Draft** while working, then change to **Published** when ready
- Tags help with organization — use existing tags where possible

## Local Development

For developers who want to run the CMS locally:

```bash
# Clone and install
git clone https://github.com/REPO_OWNER/cannabis-science-web.git
cd cannabis-science-web
npm install

# Create .env with your OAuth credentials
cp .env.example .env
# Edit .env with your values

# Start dev server
npm run dev
```

Visit `http://localhost:4321/keystatic` to use the CMS locally.

### Local Mode (Alternative)

For purely local editing without GitHub OAuth, you can temporarily switch to local mode in `keystatic.config.ts`:

```ts
storage: {
  kind: "local",  // Change from "github" to "local"
},
```

This stores content directly on disk without Git commits. **Do not deploy with local mode.**

## Troubleshooting

**"Not authorized" error in Keystatic:**
- Check that your GitHub OAuth App callback URL matches exactly
- Verify environment variables are set correctly
- Ensure the collaborator has write access to the repository

**Content not appearing on the site:**
- Check the `status` field — it must be `published`
- Verify the site has been rebuilt after the edit (check CI/CD)

**Keystatic shows a blank page:**
- Ensure the dev server is running (`npm run dev`)
- Check browser console for errors
- Verify `astro.config.mjs` has `output: "hybrid"` and the Keystatic integration
