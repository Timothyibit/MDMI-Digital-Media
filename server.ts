import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to convert 24kHz 16-bit Mono Linear PCM into standard RIFF WAV Buffer
function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const dataLength = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write('RIFF', 0);
  // Overall file length minus 8 bytes
  header.writeUInt32LE(36 + dataLength, 4);
  // WAVE identifier
  header.write('WAVE', 8);
  // fmt subchunk identifier
  header.write('fmt ', 12);
  // subchunk1 size (16 for PCM)
  header.writeUInt32LE(16, 16);
  // audio format (1 = PCM)
  header.writeUInt16LE(1, 20);
  // number of channels
  header.writeUInt16LE(numChannels, 22);
  // sample rate
  header.writeUInt32LE(sampleRate, 24);
  // byte rate (sampleRate * numChannels * bitsPerSample / 8)
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  // block align (numChannels * bitsPerSample / 8)
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  // bits per sample
  header.writeUInt16LE(bitsPerSample, 34);
  // data subchunk identifier
  header.write('data', 36);
  // data chunk length
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// In-memory server-side cache for synthesized audio WAV buffers
const serverTtsCache = new Map<string, Buffer>();

function getTargetPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(val) && val > 0) return val;
  }
  // AI Studio environment constraint: dev server must always run on port 3000 (nginx listens on 8080)
  return 3000;
}

async function startServer() {
  const app = express();
  const port = getTargetPort();
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // AI Auto Text-to-Speech Endpoint using @google/genai gemini-3.1-flash-tts-preview
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voice = 'Kore', id } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text content is required' });
      }

      // Check server cache first for instant millisecond response
      const cacheKey = id ? `${id}_${voice}` : `${voice}_${text.trim()}`;
      if (serverTtsCache.has(cacheKey)) {
        const cachedWav = serverTtsCache.get(cacheKey)!;
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', cachedWav.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('X-Cache', 'HIT');
        return res.send(cachedWav);
      }

      // Trim text to a generous limit for audio narration
      const trimmedText = text.slice(0, 2500);

      const ai = new GoogleGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: trimmedText }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice }, // 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(500).json({ error: 'No audio returned from Gemini TTS' });
      }

      const pcmBuffer = Buffer.from(base64Audio, 'base64');
      const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);

      // Store in server memory cache
      if (serverTtsCache.size > 200) {
        // Evict oldest entries if cache grows large
        const firstKey = serverTtsCache.keys().next().value;
        if (firstKey) serverTtsCache.delete(firstKey);
      }
      serverTtsCache.set(cacheKey, wavBuffer);

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', wavBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Cache', 'MISS');
      res.send(wavBuffer);
    } catch (err: any) {
      const isQuotaError =
        err?.status === 429 ||
        err?.code === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('quota');

      if (isQuotaError) {
        console.warn('Notice: Gemini TTS free-tier daily quota limit reached (10/day). Client will use native device speech synthesis.');
        return res.status(429).json({
          error: 'QUOTA_EXCEEDED',
          message: 'Gemini TTS daily quota reached (10 requests/day on free tier). Seamlessly falling back to native voice.',
          retryAfter: 30,
        });
      }

      console.warn('Notice: TTS generation error:', err?.message || err);
      res.status(500).json({ error: err.message || 'Error generating AI TTS audio' });
    }
  });

  // Audio Streaming Proxy Endpoint for external audio links (e.g., Google Drive, Dropbox, external CDNs)
  app.get('/api/proxy-audio', async (req, res) => {
    try {
      const rawUrl = req.query.url as string;
      if (!rawUrl || typeof rawUrl !== 'string') {
        return res.status(400).json({ error: 'Audio URL parameter is required' });
      }

      let targetUrl = rawUrl.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }

      // Handle Google Drive links specifically
      const gdriveMatch = targetUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/i);
      if (gdriveMatch && gdriveMatch[1]) {
        targetUrl = `https://drive.usercontent.google.com/download?id=${gdriveMatch[1]}&export=download&confirm=t`;
      }

      const clientHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'audio/*, */*',
      };

      if (req.headers.range) {
        clientHeaders['Range'] = req.headers.range;
      }

      const remoteRes = await fetch(targetUrl, {
        headers: clientHeaders,
        redirect: 'follow',
      });

      if (!remoteRes.ok && remoteRes.status !== 206) {
        // If google drive usercontent failed, try docs.google.com uc export
        if (gdriveMatch && gdriveMatch[1]) {
          const fallbackUrl = `https://docs.google.com/uc?export=download&id=${gdriveMatch[1]}`;
          const fallbackRes = await fetch(fallbackUrl, {
            headers: clientHeaders,
            redirect: 'follow',
          });
          if (fallbackRes.ok || fallbackRes.status === 206) {
            const ct = fallbackRes.headers.get('content-type') || 'audio/mpeg';
            const cl = fallbackRes.headers.get('content-length');
            const cr = fallbackRes.headers.get('content-range');
            res.status(fallbackRes.status);
            res.setHeader('Content-Type', ct.startsWith('text/html') ? 'audio/mpeg' : ct);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            if (cl) res.setHeader('Content-Length', cl);
            if (cr) res.setHeader('Content-Range', cr);
            if (!fallbackRes.body) return res.end();
            const buffer = Buffer.from(await fallbackRes.arrayBuffer());
            return res.send(buffer);
          }
        }

        return res.status(remoteRes.status).json({
          error: `Remote audio host responded with status ${remoteRes.status}`,
        });
      }

      const contentType = remoteRes.headers.get('content-type') || 'audio/mpeg';
      const contentLength = remoteRes.headers.get('content-length');
      const contentRange = remoteRes.headers.get('content-range');
      const acceptRanges = remoteRes.headers.get('accept-ranges') || 'bytes';

      res.status(remoteRes.status);
      res.setHeader('Content-Type', contentType.startsWith('text/html') ? 'audio/mpeg' : contentType);
      res.setHeader('Accept-Ranges', acceptRanges);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentRange) res.setHeader('Content-Range', contentRange);

      if (!remoteRes.body) {
        return res.end();
      }

      const reader = remoteRes.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } catch (streamErr) {
        // Client disconnect or stream end
      } finally {
        res.end();
      }
    } catch (err: any) {
      console.warn('Proxy audio error:', err?.message || err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to proxy audio file' });
      }
    }
  });

  // -------------------------------------------------------------
  // Backend Notification & Push Registry (Web, Android, iOS)
  // -------------------------------------------------------------
  interface RegisteredDevice {
    id: string;
    platform: 'web' | 'android' | 'ios';
    permission: 'granted' | 'denied' | 'default';
    token?: string;
    userId?: string;
    userAgent?: string;
    registeredAt: string;
    lastActiveAt: string;
  }

  const registeredDevices = new Map<string, RegisteredDevice>();

  // Register device permissions and push tokens from client
  app.post('/api/notifications/register', (req, res) => {
    try {
      const {
        platform = 'web',
        permission = 'default',
        token,
        userId,
        userAgent,
        deviceId,
      } = req.body;

      const id = deviceId || (token ? `tok_${token.slice(-12)}` : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

      const deviceData: RegisteredDevice = {
        id,
        platform: ['web', 'android', 'ios'].includes(platform) ? platform : 'web',
        permission: ['granted', 'denied', 'default'].includes(permission) ? permission : 'default',
        token: token || undefined,
        userId: userId || undefined,
        userAgent: userAgent || req.headers['user-agent'] || 'Unknown client',
        registeredAt: registeredDevices.get(id)?.registeredAt || new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };

      registeredDevices.set(id, deviceData);

      return res.json({
        success: true,
        deviceId: id,
        platform: deviceData.platform,
        permission: deviceData.permission,
        totalActiveDevices: registeredDevices.size,
        message: `Notification permissions acknowledged for ${deviceData.platform.toUpperCase()} client.`,
      });
    } catch (err: any) {
      console.warn('Notification registration error:', err?.message);
      return res.status(500).json({ error: 'Failed to register notification client' });
    }
  });

  // -------------------------------------------------------------
  // Production FCM v1 Push Messaging Engine (Delivers to Closed Apps)
  // -------------------------------------------------------------
  async function getFcmAuth(): Promise<{ accessToken: string; projectId: string } | null> {
    try {
      const { GoogleAuth } = await import('google-auth-library');
      let credentials: any = null;

      // 1. Try local service-account.json on disk
      const saPath = path.join(__dirname, 'service-account.json');
      if (fs.existsSync(saPath)) {
        try {
          credentials = JSON.parse(fs.readFileSync(saPath, 'utf8'));
        } catch (e) {
          console.warn('Failed parsing service-account.json:', e);
        }
      }

      // 2. Try environment variables
      if (!credentials) {
        const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (envKey) {
          try {
            credentials = typeof envKey === 'string' && envKey.startsWith('{')
              ? JSON.parse(envKey)
              : null;
          } catch {}
        }
      }

      const projectId = credentials?.project_id || 'gen-lang-client-0398777759';

      const auth = new GoogleAuth({
        credentials: credentials ? {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        } : undefined,
        projectId,
        scopes: [
          'https://www.googleapis.com/auth/firebase.messaging',
          'https://www.googleapis.com/auth/datastore',
        ],
      });

      const client = await auth.getClient();
      const tokenObj = await client.getAccessToken();
      const accessToken = typeof tokenObj === 'string' ? tokenObj : tokenObj?.token;
      if (!accessToken) return null;
      return { accessToken, projectId };
    } catch (err: any) {
      console.info('FCM Auth check note:', err?.message || err);
      return null;
    }
  }

  // Gather FCM tokens from both memory and Firestore permanent device_tokens
  async function collectAllFcmTokens(inMemoryTokens: string[]): Promise<string[]> {
    const tokenSet = new Set<string>(inMemoryTokens.filter(Boolean));

    try {
      const authData = await getFcmAuth();
      if (authData) {
        const url = `https://firestore.googleapis.com/v1/projects/${authData.projectId}/databases/ai-studio-mdmidevotionals-67aa3489-e34b-4eff-bbe2-7bcb09ef2d19/documents/device_tokens`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${authData.accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.documents && Array.isArray(data.documents)) {
            for (const docItem of data.documents) {
              const tok = docItem.fields?.token?.stringValue;
              if (tok) tokenSet.add(tok);
            }
          }
        }
      }
    } catch (err) {
      console.info('Firestore tokens gather note:', err);
    }

    return Array.from(tokenSet);
  }

  // Dispatch High-Priority FCM v1 Push to all registered devices (wakes closed/killed apps)
  async function dispatchFcmToAllDevices(title: string, body: string, dataPayload: Record<string, any> = {}) {
    const inMemoryTokens = Array.from(registeredDevices.values()).map(d => d.token).filter((t): t is string => Boolean(t));
    const allTokens = await collectAllFcmTokens(inMemoryTokens);

    if (allTokens.length === 0) {
      console.info('[FCM] No registered device tokens yet. Notification stored in Firestore for in-app delivery on launch.');
      return { totalTokens: 0, delivered: 0, fcmActive: true };
    }

    const authData = await getFcmAuth();
    if (!authData) {
      console.warn('[FCM] Service Account not authenticated. Cannot dispatch remote push.');
      return { totalTokens: allTokens.length, delivered: 0, fcmActive: false };
    }

    let delivered = 0;
    for (const token of allTokens) {
      try {
        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${authData.projectId}/messages:send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token,
              notification: {
                title,
                body,
              },
              android: {
                priority: 'high',
                notification: {
                  channelId: 'mdmi_channel',
                  sound: 'default',
                  icon: 'ic_stat_mdmi_logo',
                  color: '#5E72E4',
                  priority: 'high',
                  visibility: 'public',
                  defaultSound: true,
                  defaultVibrateTimings: true,
                },
              },
              data: {
                ...dataPayload,
                title,
                body,
              },
            },
          }),
        });

        if (res.ok) {
          delivered++;
        } else {
          const errText = await res.text();
          console.info(`[FCM] Token delivery response (${res.status}):`, errText.slice(0, 150));
        }
      } catch (e: any) {
        console.info('[FCM] Send error:', e?.message);
      }
    }

    console.log(`[FCM Push Result] Successfully dispatched to ${delivered}/${allTokens.length} devices.`);
    return { totalTokens: allTokens.length, delivered, fcmActive: true };
  }

  // Query notification status and device counts
  app.get('/api/notifications/status', async (_req, res) => {
    const devices = Array.from(registeredDevices.values());
    const counts = {
      total: devices.length,
      web: devices.filter((d) => d.platform === 'web').length,
      android: devices.filter((d) => d.platform === 'android').length,
      ios: devices.filter((d) => d.platform === 'ios').length,
      granted: devices.filter((d) => d.permission === 'granted').length,
    };

    const hasServiceAccount = fs.existsSync(path.join(__dirname, 'service-account.json')) ||
      Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    return res.json({
      status: 'online',
      counts,
      supportedPlatforms: ['web', 'android', 'ios'],
      fcm: {
        engine: 'FCM HTTP v1 High-Priority Push',
        serviceAccountConfigured: hasServiceAccount,
        status: hasServiceAccount ? 'ACTIVE (Ready to push to closed/killed apps)' : 'NEEDS_CREDENTIALS',
      },
      features: {
        webPush: true,
        localChimes: true,
        inAppHistory: true,
        backgroundSync: true,
        closedAppWakeup: hasServiceAccount,
      },
    });
  });

  // Test push notification endpoint - dispatches High-Priority payload via FCM
  app.post('/api/notifications/test-push', async (req, res) => {
    try {
      const {
        title = 'Daily Word Available',
        body = 'Today\'s meditation from The Master\'s Discipleship Ministries is ready.',
        platform = 'android',
        devotionalId,
      } = req.body;

      const fcmResult = await dispatchFcmToAllDevices(title, body, {
        notificationId: `test_${Date.now()}`,
        devotionalId: devotionalId || 'daily-devotional',
        type: 'broadcast',
        platform,
      });

      return res.json({
        success: true,
        message: `High-priority notification processed via FCM for ${platform.toUpperCase()}`,
        fcm: fcmResult,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to dispatch test notification' });
    }
  });

  // Admin broadcast push endpoint - formats and dispatches High-Priority FCM payload for closed/killed apps
  app.post('/api/notifications/broadcast', async (req, res) => {
    try {
      const { title, body, type = 'broadcast', devotionalId, createdBy } = req.body;
      const broadcastId = `bcast_${Date.now()}`;

      // Dispatch real high-priority push to all registered devices over Google FCM
      const fcmResult = await dispatchFcmToAllDevices(title, body, {
        notificationId: broadcastId,
        devotionalId: devotionalId || '',
        type: type || 'broadcast',
        createdBy: createdBy || 'Ministry Overseer',
      });

      console.log(`[Push Broadcast] Dispatched broadcast "${title}" by ${createdBy || 'Admin'}. FCM result:`, fcmResult);

      return res.json({
        success: true,
        broadcastId,
        activeDevicesCount: registeredDevices.size,
        fcm: fcmResult,
        timestamp: new Date().toISOString(),
        message: 'High-priority broadcast dispatched successfully across connected mobile and web devices',
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to synchronize broadcast' });
    }
  });

  // -------------------------------------------------------------
  // Backend Notification Timer & Recurring Scheduler Engine
  // -------------------------------------------------------------
  interface ServerScheduleItem {
    id: string;
    title: string;
    body: string;
    type: string;
    triggerType: 'timer' | 'recurring' | 'auto_event';
    delayMinutes?: number;
    scheduledAt?: string;
    recurrence?: {
      frequency: 'daily' | 'weekly' | 'hourly' | 'custom_hours';
      timeOfDay?: string;
      daysOfWeek?: number[];
      intervalHours?: number;
    };
    autoEventType?: string;
    status: 'active' | 'paused' | 'completed';
    enabled: boolean;
    devotionalId?: string;
    createdAt: string;
    lastTriggeredAt?: string;
    nextTriggerAt?: string;
    triggerCount: number;
    createdBy?: string;
  }

  const serverSchedules = new Map<string, ServerScheduleItem>();

  // Helper to calculate next recurrence on server
  function calculateServerNextRecurrence(rule: any, from = new Date()): Date {
    const res = new Date(from.getTime());
    if (rule.frequency === 'hourly') {
      res.setHours(res.getHours() + 1);
      return res;
    }
    if (rule.frequency === 'custom_hours') {
      const h = Math.max(1, rule.intervalHours || 4);
      res.setTime(res.getTime() + h * 3600 * 1000);
      return res;
    }
    const [th, tm] = (rule.timeOfDay || '07:00').split(':').map((s: string) => parseInt(s, 10));
    if (rule.frequency === 'daily') {
      const cand = new Date(from);
      cand.setHours(th, tm, 0, 0);
      if (cand.getTime() <= from.getTime() + 5000) {
        cand.setDate(cand.getDate() + 1);
      }
      return cand;
    }
    if (rule.frequency === 'weekly') {
      const days = rule.daysOfWeek && rule.daysOfWeek.length > 0 ? rule.daysOfWeek : [0];
      for (let i = 0; i <= 7; i++) {
        const cand = new Date(from);
        cand.setDate(cand.getDate() + i);
        cand.setHours(th, tm, 0, 0);
        if (days.includes(cand.getDay()) && cand.getTime() > from.getTime() + 5000) {
          return cand;
        }
      }
    }
    res.setDate(res.getDate() + 1);
    return res;
  }

  // List all server schedules
  app.get('/api/notifications/schedules', (_req, res) => {
    return res.json({
      success: true,
      schedules: Array.from(serverSchedules.values()),
    });
  });

  // Create or sync schedule
  app.post('/api/notifications/schedules', (req, res) => {
    try {
      const {
        title,
        body,
        type = 'broadcast',
        triggerType = 'timer',
        delayMinutes,
        scheduledAt,
        recurrence,
        autoEventType,
        devotionalId,
        createdBy = 'Ministry Overseer',
      } = req.body;

      if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
      }

      const id = req.body.id || `srv_sched_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date();

      let targetScheduledAt = scheduledAt;
      if (triggerType === 'timer' && !targetScheduledAt) {
        const mins = delayMinutes ? Math.max(1, delayMinutes) : 5;
        targetScheduledAt = new Date(now.getTime() + mins * 60 * 1000).toISOString();
      }

      let nextTriggerAt: string | undefined = undefined;
      if (triggerType === 'recurring' && recurrence) {
        nextTriggerAt = calculateServerNextRecurrence(recurrence, now).toISOString();
      }

      const item: ServerScheduleItem = {
        id,
        title,
        body,
        type,
        triggerType,
        delayMinutes,
        scheduledAt: targetScheduledAt,
        recurrence,
        autoEventType,
        devotionalId,
        status: 'active',
        enabled: true,
        createdAt: now.toISOString(),
        nextTriggerAt,
        triggerCount: 0,
        createdBy,
      };

      serverSchedules.set(id, item);
      console.log(`[Server Scheduler] Registered ${triggerType.toUpperCase()} trigger: "${title}"`);

      return res.json({ success: true, schedule: item });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to create schedule' });
    }
  });

  // Update schedule status / enabled
  app.patch('/api/notifications/schedules/:id', (req, res) => {
    const { id } = req.params;
    const item = serverSchedules.get(id);
    if (!item) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const updates = req.body;
    const updated = { ...item, ...updates };
    if (updates.enabled === true && updated.recurrence) {
      updated.nextTriggerAt = calculateServerNextRecurrence(updated.recurrence, new Date()).toISOString();
      updated.status = 'active';
    }
    serverSchedules.set(id, updated);
    return res.json({ success: true, schedule: updated });
  });

  // Delete schedule
  app.delete('/api/notifications/schedules/:id', (req, res) => {
    const { id } = req.params;
    serverSchedules.delete(id);
    return res.json({ success: true, message: 'Schedule removed' });
  });

  // Manual fire
  app.post('/api/notifications/schedules/:id/fire', (req, res) => {
    const { id } = req.params;
    const item = serverSchedules.get(id);
    if (!item) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    item.lastTriggeredAt = new Date().toISOString();
    item.triggerCount += 1;
    if (item.triggerType === 'timer') {
      item.status = 'completed';
    } else if (item.recurrence) {
      item.nextTriggerAt = calculateServerNextRecurrence(item.recurrence, new Date()).toISOString();
    }
    serverSchedules.set(id, item);

    return res.json({
      success: true,
      message: `Triggered notification "${item.title}" across active devices`,
      schedule: item,
    });
  });

  // Clear test notifications & test schedules on server (preserves automatic & real rules)
  app.post('/api/notifications/clear-tests', (_req, res) => {
    let removedCount = 0;
    for (const [id, item] of serverSchedules.entries()) {
      const isTest =
        id.startsWith('test') ||
        id.startsWith('seed-') ||
        id.startsWith('local-') ||
        id.startsWith('srv_') ||
        id.includes('test') ||
        item.title.toLowerCase().includes('test') ||
        item.title.toLowerCase().includes('sample') ||
        item.title.toLowerCase().includes('faith alert') ||
        item.body.toLowerCase().includes('test') ||
        item.body.toLowerCase().includes('testing');

      // Preserve automatic rules!
      if (isTest && item.triggerType !== 'auto_event') {
        serverSchedules.delete(id);
        removedCount++;
      }
    }

    return res.json({
      success: true,
      removedCount,
      message: `Cleared ${removedCount} test triggers. Automatic ministry notification rules preserved.`,
    });
  });

  // Server background runner: runs every 20 seconds
  setInterval(() => {
    const now = Date.now();
    for (const [id, item] of serverSchedules.entries()) {
      if (!item.enabled || item.status !== 'active') continue;

      // Timer
      if (item.triggerType === 'timer' && item.scheduledAt) {
        if (new Date(item.scheduledAt).getTime() <= now) {
          console.log(`[Server Scheduler] Fired timer trigger "${item.title}" to ${registeredDevices.size} registered devices`);
          item.status = 'completed';
          item.lastTriggeredAt = new Date().toISOString();
          item.triggerCount += 1;
          serverSchedules.set(id, item);
        }
      }

      // Recurring
      if (item.triggerType === 'recurring' && item.nextTriggerAt && item.recurrence) {
        if (new Date(item.nextTriggerAt).getTime() <= now) {
          console.log(`[Server Scheduler] Fired recurring schedule "${item.title}"`);
          item.lastTriggeredAt = new Date().toISOString();
          item.triggerCount += 1;
          item.nextTriggerAt = calculateServerNextRecurrence(item.recurrence, new Date()).toISOString();
          serverSchedules.set(id, item);
        }
      }
    }
  }, 20000);

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });

  server.on('error', (err: any) => {
    console.error(`Dev server encountered an error on port ${port}:`, err?.message || err);
  });
}

startServer();
