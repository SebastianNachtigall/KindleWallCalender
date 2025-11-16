# Kindle Calendar Display

A minimal, server-side rendered Google Calendar viewer optimized for e-ink displays like Kindle browsers.

## Features

- Server-side rendering (minimal JavaScript)
- Clean, high-contrast design for e-ink displays
- Shows next 10 upcoming events
- Optimized for old browsers

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Google Calendar API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials (Desktop app type)
5. Download the credentials

### 3. Get Refresh Token

Create a file `get-token.js`:

```javascript
import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';

const CLIENT_ID = 'your_client_id';
const CLIENT_SECRET = 'your_client_secret';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const scopes = ['https://www.googleapis.com/auth/calendar.readonly'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Visit this URL:', authUrl);

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/oauth2callback')) {
    const qs = new URL(req.url, 'http://localhost:3000').searchParams;
    const code = qs.get('code');
    
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\nYour refresh token:', tokens.refresh_token);
    
    res.end('Authentication successful! Check your terminal for the refresh token.');
    server.close();
  }
}).listen(3000);
```

Run it: `node get-token.js`

### 4. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
GOOGLE_REFRESH_TOKEN=your_refresh_token
PORT=3000
```

### 5. Run Locally

**Option A: With Docker (Recommended)**

```bash
docker-compose up
```

Visit `http://localhost:3000`

To rebuild after changes:
```bash
docker-compose up --build
```

To stop:
```bash
docker-compose down
```

**Option B: Without Docker**

```bash
npm install
npm start
```

Visit `http://localhost:3000`

## Deploy to Railway

1. Create a new project on [Railway](https://railway.app/)
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (use your Railway URL)
   - `GOOGLE_REFRESH_TOKEN`
4. Deploy!

## Kindle Setup

1. Open the Kindle browser
2. Navigate to your Railway URL
3. Bookmark it for easy access
4. Refresh the page to update events
