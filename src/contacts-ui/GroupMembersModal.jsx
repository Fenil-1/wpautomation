import React, { useCallback, useEffect, useState } from 'react';
import { Search, UserMinus, UserPlus } from 'lucide-react';
import { contactsApi } from '../api/contacts';
import { groupsApi } from '../api/groups';
import { ApiError } from '../api/client';
import { Modal, Avatar, Spinner, useDebounced, SecondaryButton } from './ui';

// Manage the contacts belonging to a group: list current members (remove) and
// search all contacts to add. Refreshes itself after each change and calls
// onChanged() so the parent group list updates its member count.
export default function GroupMembersModal({ group, onClose, onChanged }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 350);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await contactsApi.list({ groupId: group.id, pageSize: 100, sortBy: 'name', sortOrder: 'asc' });
      setMembers(page.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [group.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Search all contacts to add (exclude current members).
  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    contactsApi
      .list({ search: debounced, pageSize: 20, sortBy: 'name', sortOrder: 'asc' })
      .then((page) => {
        if (cancelled) return;
        const memberIds = new Set(members.map((m) => m.id));
        setResults(page.items.filter((c) => !memberIds.has(c.id)));
      })
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setSearching(false));
    return () => {
      cancelled = true;
    };
  }, [debounced, members]);

  const addContact = async (contact) => {
    setBusyId(contact.id);
    try {
      await groupsApi.addContacts(group.id, [contact.id]);
      await loadMembers();
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add contact');
    } finally {
      setBusyId(null);
    }
  };

  const removeContact = async (contact) => {
    setBusyId(contact.id);
    try {
      await groupsApi.removeContact(group.id, contact.id);
      await loadMembers();
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove contact');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal title={`Members · ${group.name}`} onClose={onClose} maxWidth="max-w-lg" footer={<SecondaryButton onClick={onClose}>Done</SecondaryButton>}>
      <div className="p-4 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>
        )}

        {/* Add contacts */}
        <div>
          <div className="bg-wa-hover-chat rounded-lg flex items-center px-3 py-1.5 border border-wa-border focus-within:border-wa-green transition-colors">
            <Search className="w-5 h-5 text-wa-text-secondary mr-2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts to add…"
              className="w-full bg-transparent border-none outline-none text-[16px] text-wa-text-primary py-1"
            />
            {searching && <Spinner className="w-4 h-4" />}
          </div>
          {results.length > 0 && (
            <div className="mt-2 border border-wa-border rounded-lg divide-y divide-wa-border max-h-48 overflow-y-auto">
              {results.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={c.name} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-wa-text-primary truncate">{c.name}</div>
                      <div className="text-xs text-wa-text-secondary truncate">
                        {c.businessName ? `${c.businessName} • ` : ''}
                        {c.countryCode} {c.phoneNumber}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => addContact(c)}
                    disabled={busyId === c.id}
                    className="p-1.5 rounded-full text-wa-green hover:bg-wa-green/10 disabled:opacity-40"
                    title="Add to group"
                  >
                    {busyId === c.id ? <Spinner className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current members */}
        <div>
          <div className="text-xs font-semibold uppercase text-wa-text-secondary mb-2">
            {loading ? 'Members' : `${members.length} member${members.length === 1 ? '' : 's'}`}
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-wa-text-secondary py-6 text-center">No members yet. Search above to add contacts.</p>
          ) : (
            <div className="border border-wa-border rounded-lg divide-y divide-wa-border max-h-64 overflow-y-auto">
              {members.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={c.name} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-wa-text-primary truncate">{c.name}</div>
                      <div className="text-xs text-wa-text-secondary truncate">
                        {c.businessName ? `${c.businessName} • ` : ''}
                        {c.countryCode} {c.phoneNumber}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeContact(c)}
                    disabled={busyId === c.id}
                    className="p-1.5 rounded-full text-red-500 hover:bg-red-50 disabled:opacity-40"
                    title="Remove from group"
                  >
                    {busyId === c.id ? <Spinner className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
