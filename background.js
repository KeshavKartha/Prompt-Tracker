/**
 * @file Background service worker for Prompt Tracker extension.
 * Handles UUID management, cloud sync, and communication with React website.
 */

// ============================================================================
// CONFIGURATION - Update these before deployment
// ============================================================================
const API_BASE_URL = 'http://localhost:3000/api'; // TODO: Replace with your actual API URL

const ALLOWED_ORIGINS = [
  'https://your-website.com',   // TODO: Replace with your actual website
  'http://localhost:3000'       // Dev only - remove in production
];

// ============================================================================
// UUID MANAGEMENT
// ============================================================================

/**
 * Generate a UUID v4
 * @returns {string} A new UUID v4 string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get existing UUID or create a new one
 * @returns {Promise<string>} The user's UUID
 */
async function getOrCreateUUID() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['userUUID'], (data) => {
      if (data.userUUID) {
        resolve(data.userUUID);
      } else {
        const newUUID = generateUUID();
        chrome.storage.sync.set({ userUUID: newUUID }, () => {
          console.log('[PromptTracker] Generated new UUID:', newUUID);
          resolve(newUUID);
        });
      }
    });
  });
}

// ============================================================================
// EXTENSION LIFECYCLE
// ============================================================================

/**
 * Called when extension is installed or updated
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    const uuid = await getOrCreateUUID();
    console.log('[PromptTracker] Extension installed/updated. UUID:', uuid);

    // Register with backend on first install
    if (details.reason === 'install') {
      await registerWithBackend(uuid);
    }
  }
});

// ============================================================================
// MESSAGE HANDLERS - Content Scripts
// ============================================================================

/**
 * Listen for messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_UUID') {
    getOrCreateUUID().then(uuid => sendResponse({ uuid }));
    return true; // Keep channel open for async response
  }

  if (message.type === 'SYNC_CONVERSATION') {
    syncConversation(message.data)
      .then(() => sendResponse({ success: true }))
      .catch(err => {
        console.error('[PromptTracker] Sync failed:', err.message);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (message.type === 'DELETE_CONVERSATION') {
    deleteConversation(message.data)
      .then(() => sendResponse({ success: true }))
      .catch(err => {
        console.error('[PromptTracker] Delete failed:', err.message);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});

// ============================================================================
// MESSAGE HANDLERS - External (React Website)
// ============================================================================

/**
 * Listen for messages from React website via externally_connectable
 */
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  // Verify sender origin
  if (!ALLOWED_ORIGINS.includes(sender.origin)) {
    console.warn('[PromptTracker] Rejected message from unauthorized origin:', sender.origin);
    sendResponse({ error: 'Unauthorized origin' });
    return;
  }

  if (message.type === 'GET_UUID_FOR_WEBSITE') {
    getOrCreateUUID().then(uuid => {
      console.log('[PromptTracker] Sent UUID to website');
      sendResponse({ uuid });
    });
    return true; // Keep channel open for async response
  }
});

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Sync a conversation to the backend
 * @param {Object} data - Conversation data
 * @param {string} data.platform - 'chatgpt' or 'gemini'
 * @param {string} data.conversationId - The conversation ID
 * @param {Array} data.prompts - Array of prompt objects
 * @returns {Promise<Object>} Response from the API
 */
async function syncConversation(data) {
  const uuid = await getOrCreateUUID();

  const response = await fetch(`${API_BASE_URL}/sync/conversation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-UUID': uuid
    },
    body: JSON.stringify({
      uuid,
      platform: data.platform,
      conversationId: data.conversationId,
      conversationTitle: data.conversationTitle || null,
      prompts: data.prompts
    })
  });

  if (!response.ok) {
    // Queue for retry on failure
    await queueFailedSync(data);
    throw new Error(`Sync failed: ${response.status}`);
  }

  console.log('[PromptTracker] Synced conversation:', data.conversationId);
  return response.json();
}

/**
 * Delete a conversation from the backend
 * @param {Object} data - Deletion data
 * @param {string} data.platform - 'chatgpt' or 'gemini'
 * @param {string} data.conversationId - The conversation ID to delete
 */
async function deleteConversation(data) {
  const uuid = await getOrCreateUUID();

  const response = await fetch(
    `${API_BASE_URL}/sync/conversation/${data.conversationId}?uuid=${uuid}&platform=${data.platform}`,
    {
      method: 'DELETE',
      headers: { 'X-User-UUID': uuid }
    }
  );

  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }

  console.log('[PromptTracker] Deleted conversation:', data.conversationId);
}

/**
 * Register user with backend on first install
 * @param {string} uuid - The user's UUID
 */
async function registerWithBackend(uuid) {
  try {
    await fetch(`${API_BASE_URL}/sync/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid })
    });
    console.log('[PromptTracker] Registered with backend');
  } catch (err) {
    console.error('[PromptTracker] Failed to register with backend:', err);
    // Non-critical, will be registered on first sync
  }
}

// ============================================================================
// SYNC QUEUE (Offline Support)
// ============================================================================

/**
 * Queue a failed sync operation for retry
 * @param {Object} data - The sync data to retry
 */
async function queueFailedSync(data) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['syncQueue'], (result) => {
      const queue = result.syncQueue || [];
      queue.push({
        ...data,
        timestamp: Date.now(),
        retryCount: 0
      });
      chrome.storage.local.set({ syncQueue: queue }, () => {
        console.log('[PromptTracker] Queued sync for retry. Queue size:', queue.length);
        resolve();
      });
    });
  });
}

/**
 * Process the sync queue - retry failed operations
 */
async function processSyncQueue() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['syncQueue'], async (result) => {
      const queue = result.syncQueue || [];

      if (queue.length === 0) {
        resolve();
        return;
      }

      console.log('[PromptTracker] Processing sync queue. Items:', queue.length);
      const remaining = [];

      for (const item of queue) {
        try {
          // Don't re-queue on success (syncConversation won't queue because we're handling errors here)
          const uuid = await getOrCreateUUID();
          const response = await fetch(`${API_BASE_URL}/sync/conversation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-UUID': uuid
            },
            body: JSON.stringify({
              uuid,
              platform: item.platform,
              conversationId: item.conversationId,
              prompts: item.prompts
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          console.log('[PromptTracker] Queue item synced:', item.conversationId);
        } catch (err) {
          // Keep in queue if under retry limit
          if (item.retryCount < 5) {
            remaining.push({ ...item, retryCount: item.retryCount + 1 });
            console.log('[PromptTracker] Retry failed, will retry again. Count:', item.retryCount + 1);
          } else {
            console.log('[PromptTracker] Max retries reached, dropping:', item.conversationId);
          }
        }
      }

      chrome.storage.local.set({ syncQueue: remaining }, () => {
        console.log('[PromptTracker] Queue processing complete. Remaining:', remaining.length);
        resolve();
      });
    });
  });
}

// ============================================================================
// PERIODIC SYNC (using chrome.alarms)
// ============================================================================

// Create alarm for periodic queue processing
chrome.alarms.create('processSyncQueue', { periodInMinutes: 5 });

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'processSyncQueue') {
    console.log('[PromptTracker] Alarm triggered: processing sync queue');
    processSyncQueue();
  }
});

// Process queue on startup
processSyncQueue();
