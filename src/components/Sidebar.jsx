import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, MoreVertical, Edit2, CheckCheck, Users, Megaphone } from 'lucide-react';

const Sidebar = ({ onCreateBroadcast }) => {
  const {
    activeTab,
    setActiveTab,
    contacts,
    broadcasts,
    chatMessages,
    broadcastMessages,
    selectedChatId,
    setSelectedChatId,
    selectedBroadcastId,
    setSelectedBroadcastId,
    markChatAsRead
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Unread'

  const handleItemClick = (id) => {
    if (activeTab === 'chats') {
      setSelectedChatId(id);
      setSelectedBroadcastId(null);
      markChatAsRead(id);
    } else {
      setSelectedBroadcastId(id);
      setSelectedChatId(null);
    }
  };

  // Get last message info
  const getLastMessage = (id, type) => {
    if (type === 'chat') {
      const msgs = chatMessages[id];
      if (msgs && msgs.length > 0) {
        return msgs[msgs.length - 1];
      }
      return null;
    } else {
      const msgs = broadcastMessages[id];
      if (msgs && msgs.length > 0) {
        return msgs[msgs.length - 1];
      }
      return null;
    }
  };

  // Filter lists based on search & unread status
  const getFilteredItems = () => {
    if (activeTab === 'chats') {
      return contacts
        .filter(contact => {
          const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.business.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesFilter = activeFilter === 'All' || contact.unreadCount > 0;
          return matchesSearch && matchesFilter;
        })
        .map(contact => {
          const lastMsg = getLastMessage(contact.id, 'chat');
          return {
            id: contact.id,
            title: contact.name,
            subtitle: contact.business,
            lastMessage: lastMsg ? lastMsg.text : 'Start a conversation',
            time: lastMsg ? lastMsg.timestamp : '',
            unread: contact.unreadCount,
            avatar: contact.avatar,
            image: contact.image,
            type: 'chat',
            sender: lastMsg ? lastMsg.sender : null
          };
        });
    } else {
      return broadcasts
        .filter(broadcast => {
          const matchesSearch = broadcast.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesFilter = activeFilter === 'All' || broadcast.unreadCount > 0;
          return matchesSearch && matchesFilter;
        })
        .map(broadcast => {
          const lastMsg = getLastMessage(broadcast.id, 'broadcast');
          return {
            id: broadcast.id,
            title: broadcast.name,
            subtitle: `${broadcast.memberIds.length} recipients`,
            lastMessage: lastMsg ? lastMsg.text : 'No broadcasts sent yet',
            time: lastMsg ? lastMsg.timestamp : '',
            unread: broadcast.unreadCount,
            avatar: 'B',
            image: broadcast.image,
            type: 'broadcast',
            sender: lastMsg ? lastMsg.sender : null
          };
        });
    }
  };

  const listItems = getFilteredItems();

  return (
    <div className="w-full md:w-[380px] lg:w-[420px] h-full bg-white flex flex-col border-r border-wa-border shrink-0">
      
      {/* Top Header */}
      <div className="h-16 flex items-center justify-between px-4 py-3 bg-white border-b border-wa-border">
        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-wa-text-primary capitalize">
          {activeTab}
        </h1>

        {/* Action icons */}
        <div className="flex items-center space-x-4 text-wa-text-secondary">
          {activeTab === 'broadcasts' ? (
            <button
              onClick={onCreateBroadcast}
              className="p-2 hover:bg-wa-hover-chat rounded-full transition-colors relative group"
              title="Create new broadcast list"
            >
              <Plus className="w-6 h-6 text-wa-green font-bold" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full bg-wa-green/10 text-wa-green flex items-center justify-center font-bold text-sm">
              YOU
            </div>
          )}
          <button className="p-2 hover:bg-wa-hover-chat rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs - Desktop View Only */}
      <div className="hidden md:flex bg-white border-b border-wa-border px-2">
        <button
          onClick={() => {
            setActiveTab('chats');
            setSelectedChatId(null);
            setSelectedBroadcastId(null);
          }}
          className={`flex-1 text-center py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'chats'
              ? 'border-wa-green text-wa-green'
              : 'border-transparent text-wa-text-secondary hover:text-wa-text-primary'
          }`}
        >
          Chats
        </button>
        <button
          onClick={() => {
            setActiveTab('broadcasts');
            setSelectedChatId(null);
            setSelectedBroadcastId(null);
          }}
          className={`flex-1 text-center py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'broadcasts'
              ? 'border-wa-green text-wa-green'
              : 'border-transparent text-wa-text-secondary hover:text-wa-text-primary'
          }`}
        >
          Broadcasts
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="bg-wa-hover-chat rounded-xl flex items-center px-4 py-2 border border-transparent focus-within:border-wa-green/30 focus-within:bg-white transition-all shadow-xs">
          <Search className="w-5 h-5 text-wa-text-secondary mr-3" />
          <input
            type="text"
            placeholder={activeTab === 'chats' ? "Search or start a new chat..." : "Search broadcast lists..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[15px] text-wa-text-primary placeholder:text-wa-text-secondary"
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
          const isSelected = activeTab === 'chats'
            ? selectedChatId === item.id
            : selectedBroadcastId === item.id;

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
                <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center overflow-hidden font-bold text-sm select-none ${
                  item.type === 'broadcast'
                    ? 'bg-wa-green text-white shadow-xs'
                    : 'bg-wa-green/10 text-wa-green-dark border border-wa-green/10'
                }`}>
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : item.type === 'broadcast' ? (
                    <Megaphone className="w-5 h-5 fill-white/20" />
                  ) : (
                    item.avatar
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
                    {item.type === 'chat' && item.subtitle && (
                      <span className="text-wa-green text-[11px] px-1 bg-wa-green/10 rounded mr-1.5 font-semibold">
                        {item.subtitle}
                      </span>
                    )}
                    {item.type === 'broadcast' && (
                      <span className="text-gray-400 text-[11px] px-1 bg-gray-100 rounded mr-1.5 font-semibold">
                        {item.subtitle}
                      </span>
                    )}
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
                {item.type === 'broadcast' && (
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
                )}
              </div>
            </div>
          );
        })}

        {listItems.length === 0 && (
          <div className="text-center py-12 px-6 text-wa-text-secondary text-sm">
            {activeTab === 'chats' 
              ? 'No conversations found.' 
              : 'No broadcast lists found. Click the "+" button at the top to create one.'}
          </div>
        )}
      </div>

    </div>
  );
};

export default Sidebar;
