# VidyaAI Setup Instructions

## Google OAuth Setup

To enable Google OAuth authentication, follow these steps:

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
7. Copy the Client ID and Client Secret

### 2. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 3. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Google Gemini API
GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here
```

### 4. Generate NextAuth Secret

You can generate a secure secret using:

```bash
openssl rand -base64 32
```

### 5. Start Development Server

```bash
npm run dev
```

## Features Implemented

- ✅ Landing page with modern UI
- ✅ User authentication with Google OAuth
- ✅ Login and registration pages
- ✅ Dashboard with progress tracking
- ✅ Google Gemini API integration
- ✅ Content processing service
- ✅ Quiz generation service
- ✅ AI tutor conversation service
- ✅ Quiz evaluation service
- ✅ Content analysis service
- ✅ Responsive design
- ✅ Session management

## Next Steps

1. Set up Google OAuth credentials
2. Add environment variables
3. Test authentication flow
4. Implement remaining features (upload, tutor, quiz, progress)
