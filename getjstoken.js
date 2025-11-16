import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env file');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const scopes = ['https://www.googleapis.com/auth/calendar.readonly'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('\n=================================');
console.log('STEP 1: Visit this URL in your browser:');
console.log('=================================\n');
console.log(authUrl);
console.log('\n');

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/oauth2callback')) {
    const qs = new URL(req.url, 'http://localhost:3000').searchParams;
    const code = qs.get('code');
    
    try {
      const { tokens } = await oauth2Client.getToken(code);
      console.log('\n=================================');
      console.log('SUCCESS! Your refresh token:');
      console.log('=================================\n');
      console.log(tokens.refresh_token);
      console.log('\n=================================');
      console.log('Copy this token to your .env file');
      console.log('=================================\n');
      
      res.end('Authentication successful! Check your terminal for the refresh token. You can close this window.');
      server.close();
    } catch (error) {
      console.error('Error getting token:', error);
      res.end('Error! Check your terminal.');
      server.close();
    }
  }
}).listen(3000, () => {
  console.log('Waiting for authentication...\n');
});