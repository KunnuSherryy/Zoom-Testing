import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ─── In-Memory Storage ─────────────────────────────────────────────────────
let slots = [];

// ─── Zoom: Get Access Token ─────────────────────────────────────────────────
async function getZoomAccessToken() {
  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;

  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error('Missing Zoom credentials in .env');
  }

  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');

  const response = await axios.post(
    'https://zoom.us/oauth/token',
    null,
    {
      params: {
        grant_type: 'account_credentials',
        account_id: ZOOM_ACCOUNT_ID,
      },
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data.access_token;
}

// ─── Zoom: Create Meeting ───────────────────────────────────────────────────
async function createZoomMeeting(startTime, studentName) {
  const token = await getZoomAccessToken();

  const response = await axios.post(
    'https://api.zoom.us/v2/users/me/meetings',
    {
      topic: `Counseling Session – ${studentName}`,
      type: 2,
      start_time: startTime,
      duration: 30,
      settings: {
        waiting_room: false,
        join_before_host: true,
        participant_video: true,
        host_video: true,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    joinUrl: response.data.join_url,
    startUrl: response.data.start_url,
  };
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// POST /slots — Student submits availability
app.post('/slots', (req, res) => {
  const { studentName, times } = req.body;

  if (!studentName || !times || !Array.isArray(times) || times.length === 0) {
    return res.status(400).json({ error: 'studentName and times[] are required.' });
  }

  const slot = {
    id: uuidv4(),
    studentName,
    times,
    selectedTime: null,
    meetingLink: null,
    startUrl: null,
    createdAt: new Date().toISOString(),
  };

  slots.push(slot);
  res.status(201).json({ message: 'Slot submitted successfully.', slot });
});

// GET /slots — Return all slots
app.get('/slots', (req, res) => {
  res.json(slots);
});

// GET /slots/:id — Return a single slot (used by student polling)
app.get('/slots/:id', (req, res) => {
  const slot = slots.find((s) => s.id === req.params.id);
  if (!slot) return res.status(404).json({ error: 'Slot not found.' });
  res.json(slot);
});

// POST /accept — Counselor accepts a time slot; Zoom meeting is created
app.post('/accept', async (req, res) => {
  const { slotId, selectedTime } = req.body;

  if (!slotId || !selectedTime) {
    return res.status(400).json({ error: 'slotId and selectedTime are required.' });
  }

  const slot = slots.find((s) => s.id === slotId);
  if (!slot) return res.status(404).json({ error: 'Slot not found.' });

  if (slot.meetingLink) {
    return res.status(400).json({ error: 'This slot has already been accepted.' });
  }

  try {
    const { joinUrl, startUrl } = await createZoomMeeting(selectedTime, slot.studentName);

    slot.selectedTime = selectedTime;
    slot.meetingLink = joinUrl;
    slot.startUrl = startUrl;

    res.json({ message: 'Meeting created successfully.', slot });
  } catch (err) {
    console.error('Zoom API error:', err?.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to create Zoom meeting.',
      details: err?.response?.data || err.message,
    });
  }
});

// DELETE /slots/:id — Remove a slot (optional cleanup)
app.delete('/slots/:id', (req, res) => {
  const index = slots.findIndex((s) => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Slot not found.' });
  slots.splice(index, 1);
  res.json({ message: 'Slot deleted.' });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', slots: slots.length }));

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅  Backend running on http://localhost:${PORT}`);
});
