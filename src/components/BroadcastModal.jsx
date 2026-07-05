import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { X, Search, Check, Trash2 } from 'lucide-react';
import { contactsApi } from '../api/contacts';
import { broadcastsApi } from '../api/broadcasts';

const PAGE_SIZE = 50;

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';

const BroadcastModal = ({ isOpen, onClose, broadcastId = null }) => {
  const { broadcasts, createBroadcast, updateBroadcast, deleteBroadcast } = useApp();
  const [name, setName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Backend-driven contact list (search + infinite scroll).
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = broadcastId !== null;
  const listRef = useRef(null);
  const reqIdRef = useRef(0);

  // Initialise the form when opening.
  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery('');
    setError(null);
    if (isEditMode) {
      const b = broadcasts.find((x) => x.id === broadcastId);
      setName(b?.name ?? '');
      // Pre-select current recipients (reconstructed from the backend).
      broadcastsApi
        .recipients(broadcastId)
        .then((recips) => setSelectedContacts(recips.map((r) => r.contactId)))
        .catch(() => setSelectedContacts([]));
    } else {
      setName('');
      setSelectedContacts([]);
    }
  }, [isOpen, broadcastId, isEditMode, broadcasts]);

  // Load a page of contacts (backend search + pagination).
  const loadContacts = useCallback(async (search, pageNum) => {
    const reqId = ++reqIdRef.current;
    setLoadingContacts(true);
    try {
      const res = await contactsApi.list({
        search: search || undefined,
        page: pageNum,
        pageSize: PAGE_SIZE,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      if (reqId !== reqIdRef.current) return; // stale response
      setTotal(res.total);
      setContacts((prev) => (pageNum === 1 ? res.items : [...prev, ...res.items]));
      setHasMore(res.page < res.totalPages);
      setPage(res.page);
    } catch {
      if (reqId === reqIdRef.current) setHasMore(false);
    } finally {
      if (reqId === reqIdRef.current) setLoadingContacts(false);
    }
  }, []);

  // Debounced search -> reload from page 1.
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => loadContacts(searchQuery, 1), 300);
    return () => clearTimeout(t);
  }, [isOpen, searchQuery, loadContacts]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el || loadingContacts || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
      loadContacts(searchQuery, page + 1);
    }
  };

  if (!isOpen) return null;

  const handleToggleContact = (id) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id],
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (selectedContacts.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      if (isEditMode) {
        await updateBroadcast(broadcastId, { name: name.trim(), contactIds: selectedContacts });
      } else {
        await createBroadcast({ name: name.trim(), contactIds: selectedContacts });
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save broadcast');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isEditMode && confirm(`Are you sure you want to delete the broadcast list "${name}"?`)) {
      setSaving(true);
      try {
        await deleteBroadcast(broadcastId);
        onClose();
      } catch (err) {
        setError(err?.message || 'Failed to delete broadcast');
        setSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[85vh] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="bg-wa-green text-white p-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {isEditMode ? 'Edit Broadcast List' : 'New Broadcast List'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 space-y-4 flex-shrink-0">
            {/* List Name Input */}
            <div>
              <label htmlFor="broadcastName" className="block text-xs font-semibold text-wa-text-secondary uppercase mb-1">
                List Name
              </label>
              <input
                id="broadcastName"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Surat Suppliers, Bihar Retailers..."
                className="w-full border-b-2 border-wa-border focus:border-wa-green outline-none py-2 text-wa-text-primary text-base transition-colors"
                required
              />
            </div>

            {/* Selected Counter */}
            <div className="flex justify-between items-center text-sm text-wa-text-secondary">
              <span>{selectedContacts.length} of {total} contacts selected</span>
              {selectedContacts.length === 0 && (
                <span className="text-red-500 text-xs">Select at least 1 contact</span>
              )}
            </div>

            {/* Contact Search */}
            <div className="bg-wa-hover-chat rounded-lg flex items-center px-3 py-1.5 border border-wa-border focus-within:border-wa-green transition-colors">
              <Search className="w-5 h-5 text-wa-text-secondary mr-2" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[16px] text-wa-text-primary py-1"
              />
            </div>

            {error && <div className="text-red-500 text-xs">{error}</div>}
          </div>

          {/* Contacts Selection List */}
          <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-2">
            {contacts.map(contact => {
              const isSelected = selectedContacts.includes(contact.id);
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleToggleContact(contact.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-wa-hover-chat rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-wa-green/10 text-wa-green flex items-center justify-center font-bold text-sm">
                      {initials(contact.name)}
                    </div>
                    <div>
                      <div className="font-semibold text-wa-text-primary text-sm leading-tight">{contact.name}</div>
                      <div className="text-xs text-wa-text-secondary mt-0.5">{contact.businessName ? `${contact.businessName} • ` : ''}{contact.countryCode} {contact.phoneNumber}</div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? 'bg-wa-green border-wa-green' : 'border-wa-text-secondary/40'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                  </div>
                </button>
              );
            })}
            {loadingContacts && (
              <div className="text-center py-4 text-wa-text-secondary text-sm">Loading…</div>
            )}
            {!loadingContacts && contacts.length === 0 && (
              <div className="text-center py-8 text-wa-text-secondary text-sm">
                No contacts found matching "{searchQuery}"
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-wa-border bg-gray-50 flex items-center justify-between flex-shrink-0">
            {isEditMode ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center space-x-1.5 text-red-500 hover:text-red-600 transition-colors py-2 px-3 hover:bg-red-50 rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-semibold">Delete List</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 border border-wa-border text-wa-text-secondary rounded-xl hover:bg-wa-hover-chat transition-colors text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || selectedContacts.length === 0 || saving}
                className="py-2 px-5 bg-wa-green text-white rounded-xl hover:bg-wa-green-dark transition-colors disabled:opacity-50 disabled:hover:bg-wa-green text-sm font-semibold shadow-sm"
              >
                {isEditMode ? 'Save Changes' : 'Create List'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

export default BroadcastModal;
