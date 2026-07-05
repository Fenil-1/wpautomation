import React, { useCallback, useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { groupsApi } from '../api/groups';
import { ApiError } from '../api/client';
import { LoadingState, ErrorState, EmptyState, PrimaryButton, useDebounced } from './ui';
import GroupFormModal from './GroupFormModal';
import GroupMembersModal from './GroupMembersModal';

export default function GroupsView() {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput, 350);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [editing, setEditing] = useState(undefined); // undefined=closed, null=create, obj=edit
  const [managing, setManaging] = useState(null); // group whose members are open

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    groupsApi
      .list({ pageSize: 100, search: search || undefined, sortBy: 'name', sortOrder: 'asc' }, controller.signal)
      .then((res) => setData(res))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err : { message: String(err) });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [search, refreshTick]);

  const onDelete = async (group) => {
    if (!confirm(`Delete group "${group.name}"? Members are not deleted, only the group.`)) return;
    try {
      await groupsApi.remove(group.id);
      refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete group');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-wa-border flex items-center gap-3 bg-white">
        <div className="flex-1 bg-wa-hover-chat rounded-xl flex items-center px-4 py-2 border border-transparent focus-within:border-wa-green/30 focus-within:bg-white transition-all">
          <Search className="w-5 h-5 text-wa-text-secondary mr-3" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search groups…"
            className="w-full bg-transparent border-none outline-none text-[16px] text-wa-text-primary placeholder:text-wa-text-secondary"
          />
        </div>
        <PrimaryButton type="button" onClick={() => setEditing(null)}>
          <Plus className="w-4 h-4" /> Add
        </PrimaryButton>
      </div>

      <div className="flex-1 overflow-y-auto bg-wa-active-chat/40 p-4">
        {loading && !data ? (
          <LoadingState label="Loading groups…" />
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : data.items.length === 0 ? (
          <EmptyState label="No groups yet. Click Add to create one." />
        ) : (
          <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
            {data.items.map((g) => (
              <div key={g.id} className="rounded-xl border border-wa-border bg-white p-4 shadow-xs flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.color || '#00a884' }} />
                    <h3 className="font-semibold text-wa-text-primary truncate">{g.name}</h3>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => setEditing(g)} className="p-1.5 rounded-full hover:bg-wa-hover-chat text-wa-text-secondary hover:text-wa-green" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(g)} className="p-1.5 rounded-full hover:bg-wa-hover-chat text-wa-text-secondary hover:text-red-500" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-wa-text-secondary mt-1 line-clamp-2 min-h-[2.5rem]">
                  {g.description || 'No description'}
                </p>
                <button
                  onClick={() => setManaging(g)}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-wa-green hover:text-wa-green-dark self-start"
                >
                  <Users className="w-4 h-4" />
                  {g.memberCount} member{g.memberCount === 1 ? '' : 's'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing !== undefined && (
        <GroupFormModal
          group={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            refresh();
          }}
        />
      )}
      {managing && (
        <GroupMembersModal group={managing} onClose={() => setManaging(null)} onChanged={refresh} />
      )}
    </div>
  );
}
