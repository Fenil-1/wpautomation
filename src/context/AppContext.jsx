import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { broadcastsApi } from '../api/broadcasts';

// Backend-driven application state. Broadcasts now live in PostgreSQL — the
// only local state here is transient UI state (which broadcast is selected).
// All dummy data and localStorage persistence have been removed.

const AppContext = createContext();

// One-time cleanup of legacy localStorage keys from the dummy-data prototype.
try {
  ['wa_contacts', 'wa_broadcasts', 'wa_broadcast_messages', 'wa_schema_version'].forEach((k) =>
    localStorage.removeItem(k),
  );
} catch {
  /* ignore */
}

export const AppProvider = ({ children }) => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState(null);

  const refreshBroadcasts = useCallback(async () => {
    try {
      const res = await broadcastsApi.list({ pageSize: 100, sortBy: 'updatedAt', sortOrder: 'desc' });
      setBroadcasts(res.items);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBroadcasts();
  }, [refreshBroadcasts]);

  /**
   * Create a draft broadcast and resolve its audience. The message defaults to
   * the list name as a placeholder until the user composes one in the chat.
   */
  const createBroadcast = useCallback(
    async ({ name, contactIds = [], groupIds = [] }) => {
      const broadcast = await broadcastsApi.create({ name, message: name });
      const resolve =
        contactIds.length || groupIds.length
          ? await broadcastsApi.resolve(broadcast.id, { groupIds, contactIds })
          : null;
      await refreshBroadcasts();
      return { broadcast, resolve };
    },
    [refreshBroadcasts],
  );

  /** Update a broadcast's name and, if a selection is provided, re-resolve. */
  const updateBroadcast = useCallback(
    async (id, { name, contactIds, groupIds }) => {
      if (name !== undefined) await broadcastsApi.update(id, { name });
      let resolve = null;
      if ((contactIds && contactIds.length) || (groupIds && groupIds.length)) {
        resolve = await broadcastsApi.resolve(id, {
          groupIds: groupIds || [],
          contactIds: contactIds || [],
        });
      }
      await refreshBroadcasts();
      return resolve;
    },
    [refreshBroadcasts],
  );

  const deleteBroadcast = useCallback(
    async (id) => {
      await broadcastsApi.remove(id);
      setSelectedBroadcastId((prev) => (prev === id ? null : prev));
      await refreshBroadcasts();
    },
    [refreshBroadcasts],
  );

  /** Set the campaign message and enqueue delivery. Returns immediately. */
  const sendBroadcast = useCallback(
    async (id, message) => {
      await broadcastsApi.update(id, { message });
      const result = await broadcastsApi.send(id);
      await refreshBroadcasts();
      return result;
    },
    [refreshBroadcasts],
  );

  return (
    <AppContext.Provider
      value={{
        broadcasts,
        loading,
        error,
        selectedBroadcastId,
        setSelectedBroadcastId,
        refreshBroadcasts,
        createBroadcast,
        updateBroadcast,
        deleteBroadcast,
        sendBroadcast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
