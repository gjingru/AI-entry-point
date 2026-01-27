# Pebble MCP Setup Guide

## Prerequisites

To install `@rippling/pebble-mcp`, you need:

1. **GitHub Personal Access Token** with package read permissions
2. **Access to Rippling's private packages**

## Step 1: Create GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `read:packages` (Download packages from GitHub Package Registry)
   - ✅ `repo` (Full control of private repositories)
4. Copy the generated token

## Step 2: Configure Authentication

Replace `YOUR_GITHUB_TOKEN_HERE` in `.npmrc` with your actual token:

```bash
# Edit .npmrc file
nano .npmrc
```

Or update the token directly:
```bash
sed -i '' 's/YOUR_GITHUB_TOKEN_HERE/your_actual_token_here/g' .npmrc
```

## Step 3: Install Package

```bash
npm install @rippling/pebble-mcp@0.104.0
```

## Step 4: Verify Installation

```bash
npm list @rippling/pebble-mcp
```

## Alternative: Try Public Pebble Packages

If you don't have access to Rippling's private packages, you can try:

```bash
# Try installing the main Pebble UI package
npm install @rippling/pebble
npm install @rippling/ui-utils
```

## Troubleshooting

- **401 Unauthorized**: Check your GitHub token has correct permissions
- **404 Not Found**: Verify you have access to Rippling's private packages
- **Token Issues**: Regenerate token and update .npmrc

## Next Steps

Once installed, you can:
1. Import MCP functions for design-to-code workflows
2. Use Pebble components in your React app
3. Integrate with Figma for automated asset management
