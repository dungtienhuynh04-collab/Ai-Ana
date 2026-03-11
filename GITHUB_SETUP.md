# GitHub Setup Guide

## Push to GitHub

### 1. Create a new repository on GitHub

- Go to https://github.com/new
- Name it `Ai-Ana` (or any name you prefer)
- Do **not** initialize with README (you already have one)
- Click Create repository

### 2. Initialize Git and push

```bash
cd e:\AI_project\cursorpj\Ai-Ana

# Initialize git (if not already done)
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: Nova Bot AI desktop assistant"

# Add your GitHub repo as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/Ai-Ana.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 3. Create a release

When you want to publish a new version:

```bash
# Update version in package.json if needed, then:
git add .
git commit -m "Release v1.0.0"
git push

# Create and push a tag - this triggers the release workflow
git tag v1.0.0
git push origin v1.0.0
```

The GitHub Actions workflow will:

1. Build the Windows app
2. Create a new Release with the tag
3. Attach the `.exe` (installer) and `.zip` (portable) files

### 4. Update README

Replace `YOUR_USERNAME` in README.md with your actual GitHub username so the Releases link works.
