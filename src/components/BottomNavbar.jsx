import React from 'react';
import { useApp } from '../context/AppContext';
import { Megaphone, MessageSquare } from 'lucide-react';

const BottomNavbar = () => {
  const { activeTab, setActiveTab, broadcasts, contacts } = useApp();

  // Calculate unread items
  const unreadChats = contacts.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const unreadBroadcasts = broadcasts.reduce((acc, b) => acc + (b.unreadCount || 0), 0);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-wa-border flex justify-around items-center z-30 px-6 pb-2">
      {/* Broadcasts Tab Button */}
      <button
        onClick={() => setActiveTab('broadcasts')}
        className={`flex flex-col items-center justify-center w-20 relative transition-colors ${
          activeTab === 'broadcasts' ? 'text-wa-green' : 'text-wa-text-secondary'
        }`}
      >
        <div className="relative p-1">
          <Megaphone className={`w-6 h-6 ${activeTab === 'broadcasts' ? 'fill-wa-green/10' : ''}`} />
          {unreadBroadcasts > 0 && (
            <span className="absolute -top-1 -right-2 bg-wa-badge-green text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadBroadcasts}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium mt-0.5">Broadcasts</span>
      </button>

      {/* Chats Tab Button */}
      <button
        onClick={() => setActiveTab('chats')}
        className={`flex flex-col items-center justify-center w-20 relative transition-colors ${
          activeTab === 'chats' ? 'text-wa-green' : 'text-wa-text-secondary'
        }`}
      >
        <div className="relative p-1">
          <MessageSquare className={`w-6 h-6 ${activeTab === 'chats' ? 'fill-wa-green/10' : ''}`} />
          {unreadChats > 0 && (
            <span className="absolute -top-1 -right-2 bg-wa-badge-green text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadChats}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium mt-0.5">Chats</span>
      </button>
    </div>
  );
};

export default BottomNavbar;
