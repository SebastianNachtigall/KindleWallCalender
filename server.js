import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Google Calendar API setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Calendar ID - defaults to 'primary' (your main calendar)
// To use a different calendar, set CALENDAR_ID in .env to the calendar's ID
const CALENDAR_ID = process.env.CALENDAR_ID || 'primary';

// Timezone - defaults to 'Europe/Berlin'
// Set TIMEZONE in .env to your timezone (e.g., 'America/New_York', 'Europe/London')
const TIMEZONE = process.env.TIMEZONE || 'Europe/Berlin';

// German date/time labels
const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }));
  return `${DAYS[localDate.getDay()]}, ${localDate.getDate()}. ${MONTHS[localDate.getMonth()]}`;
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const hours = localDate.getHours().toString().padStart(2, '0');
  const minutes = localDate.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

function formatLastUpdated() {
  const now = new Date();
  const localNow = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const hours = localNow.getHours().toString().padStart(2, '0');
  const minutes = localNow.getMinutes().toString().padStart(2, '0');
  
  return `${DAYS[localNow.getDay()]}, ${localNow.getDate()}. ${MONTHS[localNow.getMonth()]} um ${hours}:${minutes}`;
}

// API endpoint to get calendar events
app.get('/api/events', async (req, res) => {
  try {
    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items.map(event => ({
      summary: event.summary || 'No title',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      isAllDay: !event.start.dateTime
    }));

    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Main page - server-side rendered
app.get('/', async (req, res) => {
  try {
    // Get calendar info
    const calendarInfo = await calendar.calendars.get({
      calendarId: CALENDAR_ID
    });
    
    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
    
    let eventsHtml = '';
    events.forEach(event => {
      const start = event.start.dateTime || event.start.date;
      const isAllDay = !event.start.dateTime;
      
      eventsHtml += `
        <div class="event">
          <div class="event-date">${formatDate(start)}</div>
          <div class="event-time">${isAllDay ? 'Ganztägig' : formatTime(start)}</div>
          <div class="event-title">${event.summary || 'No title'}</div>
        </div>
      `;
    });

    const lastUpdated = formatLastUpdated();
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="3600">
  <title>Calendar</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      background: #fff;
      color: #000;
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    
    h1 {
      font-size: 28px;
      margin-bottom: 5px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    
    .calendar-name {
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }
    
    .event {
      border-bottom: 1px solid #ccc;
      padding: 15px 0;
    }
    
    .event:last-child {
      border-bottom: none;
    }
    
    .event-date {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .event-time {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .event-title {
      font-size: 18px;
      line-height: 1.4;
    }
    
    .refresh-note {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <h1>Anstehende Termine</h1>
  <div class="calendar-name">${calendarInfo.data.summary}</div>
  ${eventsHtml || '<p>Keine anstehenden Termine</p>'}
  <div class="refresh-note">Zuletzt aktualisiert: ${lastUpdated}<br>Automatische Aktualisierung jede Stunde</div>
</body>
</html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`
<!DOCTYPE html>
<html>
<head>
  <title>Error</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    .error { color: red; }
  </style>
</head>
<body>
  <h1>Error</h1>
  <p class="error">Failed to load calendar events. Please check your configuration.</p>
</body>
</html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
