import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, MoreVertical, Edit2, CheckCheck, Megaphone } from 'lucide-react';

// Format a timestamp for the list preview (time if today, else short date).
const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: '2-digit', month: 'short' });
};

const Sidebar = ({ onCreateBroadcast }) => {
  const { broadcasts, loading, error, selectedBroadcastId, setSelectedBroadcastId } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Unread'

  const handleItemClick = (id) => {
    setSelectedBroadcastId(id);
  };

  // Map backend broadcasts into the existing list-item shape.
  const listItems = broadcasts
    .filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
    // 'Unread' has no backend equivalent yet; it simply matches nothing.
    .filter(() => activeFilter === 'All')
    .map((b) => ({
      id: b.id,
      title: b.name,
      subtitle: `${b.recipientCount} recipients`,
      lastMessage: b.message && b.message !== b.name ? b.message : 'No message yet',
      time: formatTime(b.updatedAt),
      unread: 0,
      avatar: 'B',
      image: null,
      type: 'broadcast',
      sender: 'me',
    }));

  return (
    <div className="w-full md:w-[380px] lg:w-[420px] h-full bg-white flex flex-col border-r border-wa-border shrink-0">

      {/* Top Header */}
      <div className="min-h-16 h-auto pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 flex items-center justify-between px-4 bg-white border-b border-wa-border">
        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-wa-text-primary capitalize">
          Broadcasts
        </h1>

        {/* Action icons */}
        <div className="flex items-center space-x-4 text-wa-text-secondary">
          <button
            onClick={onCreateBroadcast}
            className="p-2 hover:bg-wa-hover-chat rounded-full transition-colors relative group"
            title="Create new broadcast list"
          >
            <Plus className="w-6 h-6 text-wa-green font-bold" />
          </button>
          <button className="p-2 hover:bg-wa-hover-chat rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>



      {/* Search Input */}
      <div className="p-3">
        <div className="bg-wa-hover-chat rounded-xl flex items-center px-4 py-2 border border-transparent focus-within:border-wa-green/30 focus-within:bg-white transition-all shadow-xs">
          <Search className="w-5 h-5 text-wa-text-secondary mr-3" />
          <input
            type="text"
            placeholder="Search broadcast lists..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[16px] text-wa-text-primary placeholder:text-wa-text-secondary"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-3 pb-3 flex space-x-2 border-b border-wa-border">
        <button
          onClick={() => setActiveFilter('All')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            activeFilter === 'All'
              ? 'bg-wa-green/15 text-wa-green-dark'
              : 'bg-wa-hover-chat text-wa-text-secondary hover:bg-wa-border'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter('Unread')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            activeFilter === 'Unread'
              ? 'bg-wa-green/15 text-wa-green-dark'
              : 'bg-wa-hover-chat text-wa-text-secondary hover:bg-wa-border'
          }`}
        >
          Unread
        </button>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {listItems.map(item => {
          const isSelected = selectedBroadcastId === item.id;

          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3.5 border-b border-wa-border cursor-pointer relative transition-all group ${
                isSelected ? 'bg-wa-active-chat' : 'hover:bg-wa-hover-chat'
              }`}
              onClick={() => handleItemClick(item.id)}
            >
              {/* Left Column: Avatar & Text details */}
              <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center overflow-hidden font-bold text-sm select-none bg-wa-green text-white shadow-xs`}>
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <Megaphone className="w-5 h-5 fill-white/20" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="font-semibold text-[15px] text-wa-text-primary truncate block pr-2">
                      {item.title}
                    </span>
                    {item.time && (
                      <span className={`text-[11px] shrink-0 font-medium ${
                        item.unread > 0 ? 'text-wa-badge-green' : 'text-wa-text-secondary'
                      }`}>
                        {item.time}
                      </span>
                    )}
                  </div>

                  <div className="text-[13px] text-wa-text-secondary font-medium mb-0.5 truncate">
                    <span className="text-gray-400 text-[11px] px-1 bg-gray-100 rounded mr-1.5 font-semibold">
                      {item.subtitle}
                    </span>
                  </div>

                  <div className="flex items-center text-[13px] text-wa-text-secondary min-w-0">
                    {item.sender === 'me' && (
                      <CheckCheck className="w-4 h-4 text-sky-500 mr-1 shrink-0" />
                    )}
                    <span className={`truncate ${item.unread > 0 ? 'font-semibold text-wa-text-primary' : ''}`}>
                      {item.lastMessage}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Badges & Edit actions */}
              <div className="flex flex-col items-end space-y-1.5 pl-2 shrink-0 select-none">
                {item.unread > 0 && (
                  <span className="bg-wa-badge-green text-white text-[11px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center shadow-xs">
                    {item.unread}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateBroadcast(item.id);
                  }}
                  className="p-1.5 hover:bg-white rounded-full text-wa-text-secondary hover:text-wa-green opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit list settings"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {loading && listItems.length === 0 && (
          <div className="text-center py-12 px-6 text-wa-text-secondary text-sm">
            Loading broadcasts…
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12 px-6 text-red-500 text-sm">
            Couldn’t load broadcasts. Is the backend running?
          </div>
        )}

        {!loading && !error && listItems.length === 0 && (
          <div className="text-center py-12 px-6 text-wa-text-secondary text-sm">
            No broadcast lists found. Click the "+" button at the top to create one.
          </div>
        )}
      </div>

    </div>
  );
};

export default Sidebar;
