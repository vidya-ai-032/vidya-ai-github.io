# VidyaAI Production Deployment Guide

## Google Cloud Run Environment Variables Setup

To fix the production issues where authentication and API calls fail, you need to configure environment variables in Google Cloud Run.

### Step 1: Access Google Cloud Run Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "Cloud Run" in the left sidebar
3. Find your VidyaAI service and click on it

### Step 2: Configure Environment Variables

1. Click "EDIT & DEPLOY NEW REVISION"
2. Scroll down to "Variables & Secrets" section
3. Click "ADD VARIABLE" for each of the following:

#### Required Environment Variables:

| Variable Name           | Value                                                                      | Description                |
| ----------------------- | -------------------------------------------------------------------------- | -------------------------- |
| `GOOGLE_CLIENT_ID`      | `612152786911-hkm08b2t0k15rg8mn7sod3fga3mcmk2a.apps.googleusercontent.com` | Google OAuth Client ID     |
| `GOOGLE_CLIENT_SECRET`  | `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`                                      | Google OAuth Client Secret |
| `NEXTAUTH_SECRET`       | `3IT0aGPyJY6MjQKc6v8dHewXub3fnB4/22PnX2pnlHo=`                             | NextAuth Secret Key        |
| `NEXTAUTH_URL`          | `https://your-cloud-run-url.run.app`                                       | Your Cloud Run service URL |
| `GOOGLE_GEMINI_API_KEY` | `AIzaSyAnRcGUdStW3QCjmR_nfr7ygvt8yBYwu-M`                                  | Gemini API Key             |

### Step 3: Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"
3. Edit your OAuth 2.0 Client ID
4. Add your production redirect URI:
   - `https://your-cloud-run-url.run.app/api/auth/callback/google`
5. Save the changes

### Step 4: Deploy the Changes

1. After adding all environment variables, click "DEPLOY"
2. Wait for the deployment to complete
3. Test the application

## Troubleshooting

### Check Environment Variables in Production

You can check if environment variables are properly set by:

1. Going to your Cloud Run service logs
2. Looking for the "Environment info:" log message
3. If you see red ❌ marks, the variables are missing

### Common Issues

1. **Authentication Fails**: Check `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXTAUTH_URL`
2. **API Calls Fail**: Check `GOOGLE_GEMINI_API_KEY`
3. **Session Issues**: Check `NEXTAUTH_SECRET`

### Debug Commands

To check environment variables in production logs:

```bash
# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=your-service-name" --limit=50
```

## Security Notes

- Never commit environment variables to version control
- Use Google Secret Manager for sensitive values in production
- Rotate API keys regularly
- Monitor API usage and quotas

## Next Steps

After configuring environment variables:

1. Test authentication flow
2. Test document upload and processing
3. Test quiz generation
4. Monitor logs for any remaining issues
