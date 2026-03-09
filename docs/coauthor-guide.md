# Co-Author Access Guide
## How to give team members access to the Keystatic CMS

> **Audience:** Project owner (fshankov) setting up access for co-editors.
> **Stack:** Astro + Keystatic (GitHub mode) + Netlify

---

## How the full workflow works

```
Co-author edits content in browser → Keystatic saves → GitHub commit on main
    → Netlify detects push → rebuilds site (≈ 60–90 s) → live on the web
```

No FTP, no manual deploys. Every "Save" in the CMS is a real Git commit. Netlify watches the repo and rebuilds automatically.

---

## Step 1 — Add co-authors as GitHub collaborators

Co-authors need **Write** access to the repo so Keystatic can commit on their behalf.

1. Go to **https://github.com/fshankov/cannabismythen/settings/access**
2. Click **"Invite a collaborator"**
3. Enter their GitHub username or email
4. Set role to **"Write"** (can push commits, cannot change repo settings)
5. They accept the invite via email or GitHub notification

**Role guide:**

| Role | Can edit content | Can manage branches | Can change repo settings |
|------|-----------------|--------------------|-----------------------|
| Read | ✗ (read-only) | ✗ | ✗ |
| **Write** | ✅ Recommended for content editors | ✅ | ✗ |
| Maintain | ✅ | ✅ | Partially |
| Admin | ✅ | ✅ | ✅ Only for you |

**Recommendation:** Give all co-authors the **Write** role. Reserve Admin for yourself only.

---

## Step 2 — Set up the GitHub OAuth App (one-time, done by owner)

This allows co-authors to log in to Keystatic using their GitHub account.

1. Go to **https://github.com/settings/developers** → OAuth Apps → New OAuth App
2. Fill in:
   - **Application name:** Cannabis Mythen CMS
   - **Homepage URL:** `https://your-netlify-site.netlify.app`
   - **Authorization callback URL:** `https://your-netlify-site.netlify.app/api/keystatic/github/oauth/callback`
3. Click **Register application**
4. Copy **Client ID** and generate a **Client secret**
5. Add to Netlify environment variables (Netlify Dashboard → Site → Environment variables):
   - `KEYSTATIC_GITHUB_CLIENT_ID` = the Client ID
   - `KEYSTATIC_GITHUB_CLIENT_SECRET` = the Client secret
   - `KEYSTATIC_SECRET` = any random string (run `openssl rand -hex 32` to generate one)

> ⚠️ After adding env vars, trigger a Netlify redeploy (Deploys → Trigger deploy → Deploy site).

---

## Step 3 — What co-authors can edit (which pages/collections)

Once logged in at `https://your-site.netlify.app/keystatic`, co-authors see:

| Collection | What it is | Who should edit |
|------------|-----------|-----------------|
| **Factsheets** | The 42 myth factsheets — main scientific content | Domain experts |
| **FAQ** | Frequently asked questions | Any co-author |
| **Quiz** | Quiz questions and answers | Domain experts |
| **Scrollytelling** | Interactive narrative steps | Project lead |
| **Dashboard** | Indicator descriptions | Data team |
| **About** | Team/project description page | Project lead |
| **Meta (Internal)** | Reference docs, internal notes | All co-authors |
| **📋 Project Log** | Progress tracking entries | All co-authors |

> Keystatic currently shows all collections to all logged-in GitHub collaborators. There is no per-collection permission granularity in Keystatic — it relies on GitHub collaborator trust. If you want finer control in the future, Keystatic supports a branch-based review workflow (see below).

---

## Step 4 — Optional: Branch/PR review workflow

By default, saves commit directly to `main` → site rebuilds immediately.
If you want to **review changes before they go live**, you can enable Keystatic's branch workflow:

In `keystatic.config.ts`, change the `storage` block to:

```ts
storage: {
  kind: "github",
  repo: {
    owner: "fshankov",
    name: "cannabismythen",
  },
  branchPrefix: "content/",  // ← add this line
},
```

With this setting:
- Co-authors edit content on auto-created branches (e.g. `content/anna-faq-update`)
- They click **"Create pull request"** when done
- You review the PR on GitHub and merge → Netlify builds the merged result
- Nothing goes live without your approval

**Recommendation:**
- **Direct to main** (current setup): Best for a small trusted team working fast
- **Branch/PR**: Best if you want to review all changes before publishing

---

## Step 5 — Using the Project Log (changelog)

The **📋 Project Log** collection is your shared progress tracker inside the CMS itself.
Co-authors create entries to document what they changed and what still needs doing.

**To log a change:**
1. Go to `/keystatic` → **📋 Project Log** → **New Entry**
2. Fill in: Title, Date (pre-filled with today), Author (your name), Type, Status
3. List which factsheets/items were affected
4. Add free-text notes in the Notes field
5. Save → it commits to the repo, but **is never rendered on the public site**

**Suggested conventions:**
- Use type **✏️ Content Update** for edits to existing factsheets
- Use type **📌 Planned** for things still to do (Status: Planned)
- Use type **🔍 Review / Feedback** when leaving feedback for another author
- Use type **🚀 Milestone** for significant project moments

---

## Step 6 — Practical co-author workflow (send this to them)

> **For co-authors — how to edit content:**
>
> 1. Make sure you have a GitHub account and have accepted the collaborator invite from fshankov
> 2. Go to the website: `https://your-site.netlify.app/keystatic`
> 3. Click **"Sign in with GitHub"** and authorize the app
> 4. You now see the CMS dashboard
> 5. Navigate to a collection (e.g. Factsheets)
> 6. Click on an entry to open the editor
> 7. Make your changes in the rich text editor
> 8. Set **Status** to `Published` when the content is ready
> 9. Add any editorial comments to **Internal Notes** (never shown publicly)
> 10. Click **Save** — this creates a Git commit and triggers an automatic site rebuild
> 11. The live site updates in about 60–90 seconds
> 12. Log your change in **📋 Project Log**

---

## Summary checklist (owner)

- [ ] Add co-authors as **Write** collaborators on GitHub
- [ ] Create GitHub OAuth App and add credentials to Netlify env vars
- [ ] Share the site URL + this guide with co-authors
- [ ] Decide: direct-to-main (fast) or branch/PR (reviewed)
- [ ] Create first Project Log entry to show the team how it works
