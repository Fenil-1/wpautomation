import React, { useCallback, useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { contactsApi } from '../api/contacts';
import { groupsApi } from '../api/groups';
import { ApiError } from '../api/client';
import {
  Avatar, Badge, LoadingState, ErrorState, EmptyState, Pagination, PrimaryButton, useDebounced,
} from './ui';
import ContactFormModal from './ContactFormModal';

const PAGE_SIZE = 20;
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Recently added' },
  { value: 'name', label: 'Name' },
  { value: 'lastInteractionAt', label: 'Last interaction' },
  { value: 'engagementScore', label: 'Engagement' },
  { value: 'city', label: 'City' },
];

// Tri-state filter: '' = any, 'true'/'false'.
function TriSelect({ label, value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-wa-border rounded-lg px-2 py-1.5 bg-white text-wa-text-primary outline-none focus:border-wa-green"
      title={label}
    >
      <option value="">{label}: Any</option>
      <option value="true">{label}: Yes</option>
      <option value="false">{label}: No</option>
    </select>
  );
}

export default function ContactsView() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput, 350);
  const [city, setCity] = useState('');
  const cityDebounced = useDebounced(city, 350);
  const [groupId, setGroupId] = useState('');
  const [isBlocked, setIsBlocked] = useState('');
  const [isOptedOut, setIsOptedOut] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [groups, setGroups] = useState([]);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = create, obj = edit

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  // Reset to page 1 whenever a filter/search/sort changes.
  useEffect(() => {
    setPage(1);
  }, [search, cityDebounced, groupId, isBlocked, isOptedOut, sortBy, sortOrder]);

  // Load groups once for the group filter.
  useEffect(() => {
    groupsApi.list({ pageSize: 100, sortBy: 'name', sortOrder: 'asc' })
      .then((res) => setGroups(res.items))
      .catch(() => setGroups([]));
  }, [refreshTick]);

  // Fetch the current page of contacts.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    contactsApi
      .list(
        {
          page,
          pageSize: PAGE_SIZE,
          search: search || undefined,
          city: cityDebounced || undefined,
          groupId: groupId || undefined,
          isBlocked: isBlocked === '' ? undefined : isBlocked === 'true',
          isOptedOut: isOptedOut === '' ? undefined : isOptedOut === 'true',
          sortBy,
          sortOrder,
        },
        controller.signal,
      )
      .then((res) => setData(res))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'NETWORK' && controller.signal.aborted) return;
        setError(err instanceof ApiError ? err : { message: String(err) });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, search, cityDebounced, groupId, isBlocked, isOptedOut, sortBy, sortOrder, refreshTick]);

  const onDelete = async (contact) => {
    if (!confirm(`Delete contact "${contact.name}"?`)) return;
    try {
      await contactsApi.remove(contact.id);
      refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete contact');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-3 border-b border-wa-border space-y-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-wa-hover-chat rounded-xl flex items-center px-4 py-2 border border-transparent focus-within:border-wa-green/30 focus-within:bg-white transition-all">
            <Search className="w-5 h-5 text-wa-text-secondary mr-3" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, phone, business, city…"
              className="w-full bg-transparent border-none outline-none text-[16px] text-wa-text-primary placeholder:text-wa-text-secondary"
            />
          </div>
          <PrimaryButton type="button" onClick={() => setEditing(null)}>
            <Plus className="w-4 h-4" /> Add
          </PrimaryButton>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="text-sm border border-wa-border rounded-lg px-2 py-1.5 bg-white outline-none focus:border-wa-green w-28"
          />
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="text-sm border border-wa-border rounded-lg px-2 py-1.5 bg-white text-wa-text-primary outline-none focus:border-wa-green"
          >
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <TriSelect label="Blocked" value={isBlocked} onChange={setIsBlocked} />
          <TriSelect label="Opted out" value={isOptedOut} onChange={setIsOptedOut} />
          <div className="flex items-center gap-1 ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-wa-border rounded-lg px-2 py-1.5 bg-white text-wa-text-primary outline-none focus:border-wa-green"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>Sort: {o.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              className="p-1.5 border border-wa-border rounded-lg hover:bg-wa-hover-chat text-wa-text-secondary"
              title={`Order: ${sortOrder}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {loading && !data ? (
          <LoadingState label="Loading contacts…" />
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : data.items.length === 0 ? (
          <EmptyState label="No contacts match your filters." />
        ) : (
          <div className={`divide-y divide-wa-border ${loading ? 'opacity-60' : ''}`}>
            {data.items.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-wa-hover-chat group">
                <Avatar name={c.name} color={c.groups[0]?.color} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[15px] text-wa-text-primary truncate">{c.name}</span>
                    {c.isBlocked && <Badge tone="red">Blocked</Badge>}
                    {c.isOptedOut && <Badge tone="amber">Opted out</Badge>}
                  </div>
                  <div className="text-[13px] text-wa-text-secondary truncate">
                    {c.businessName ? `${c.businessName} • ` : ''}
                    {c.countryCode} {c.phoneNumber}
                    {c.city ? ` • ${c.city}` : ''}
                  </div>
                  {c.groups.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.groups.slice(0, 3).map((g) => (
                        <span
                          key={g.id}
                          className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${g.color || '#00a884'}22`, color: g.color || '#008069' }}
                        >
                          {g.name}
                        </span>
                      ))}
                      {c.groups.length > 3 && (
                        <span className="text-[11px] text-wa-text-secondary">+{c.groups.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditing(c)} className="p-2 rounded-full hover:bg-white text-wa-text-secondary hover:text-wa-green" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(c)} className="p-2 rounded-full hover:bg-white text-wa-text-secondary hover:text-red-500" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPage={setPage} />
      )}

      {editing !== undefined && (
        <ContactFormModal
          contact={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            refresh();
          }}
        />
      )}
    </div>
  );
}
