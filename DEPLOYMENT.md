# Deployment Guide

## Step 1: Push to GitHub

### If you don't have a repository yet:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Personal website MVP"

# Create repository on GitHub first, then:
git remote add origin https://github.com/mrinaalr/[repository-name].git
git branch -M main
git push -u origin main
```

### If you already have a repository:

```bash
git add .
git commit -m "Add personal website"
git push
```

## Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under **Source**, select:
   - Branch: `main` (or `master`)
   - Folder: `/ (root)`
5. Click **Save**

## Step 3: Set Up Custom Domain (mrinaalr.com)

### Option A: If you already own mrinaalr.com

1. **In GitHub:**
   - Go to Settings → Pages
   - Under "Custom domain", enter: `mrinaalr.com`
   - Check "Enforce HTTPS" (after DNS propagates)

2. **In your domain registrar (GoDaddy, Namecheap, etc.):**
   - Go to DNS settings
   - Add/Edit these records:
     ```
     Type: A
     Name: @ (or root/blank)
     Value: 185.199.108.153
     
     Type: A
     Name: @
     Value: 185.199.109.153
     
     Type: A
     Name: @
     Value: 185.199.110.153
     
     Type: A
     Name: @
     Value: 185.199.111.153
     
     Type: CNAME
     Name: www
     Value: [username].github.io
     ```
   - Save and wait 5-60 minutes for DNS to propagate

### Option B: If you need to buy the domain

1. **Buy the domain:**
   - Go to a registrar (Namecheap, Google Domains, Cloudflare, etc.)
   - Search for `mrinaalr.com`
   - Purchase it (usually $10-15/year)

2. **Follow Option A steps above**

### Verify it's working:

- Visit `mrinaalr.com` (may take a few minutes to hours for DNS)
- GitHub will automatically create an SSL certificate for HTTPS

## Step 4: Add to Resume

### Format 1 (Simple):
```
Personal Website: mrinaalr.com
```

### Format 2 (With description):
```
Personal Website: mrinaalr.com | Portfolio showcasing research projects and technical work
```

### Format 3 (In Projects section):
```
Personal Website (mrinaalr.com)
- Responsive portfolio website highlighting research in online safety and child protection
- Features projects including CaseLinker and End Child Exploitation research
- Built with HTML/CSS, deployed via GitHub Pages
```

### Format 4 (In Contact/Online Presence):
```
Website: mrinaalr.com
GitHub: github.com/mrinaalr
LinkedIn: linkedin.com/in/mrinaalr
```

## Troubleshooting

- **Domain not working?** Wait 24-48 hours for DNS propagation
- **HTTPS not available?** Wait a few hours after adding custom domain
- **404 error?** Make sure `index.html` is in the root of your repository
