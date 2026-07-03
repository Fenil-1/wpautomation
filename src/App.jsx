import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import BroadcastModal from './components/BroadcastModal';

const AppContent = () => {
  const { selectedBroadcastId } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBroadcastId, setEditingBroadcastId] = useState(null);

  const handleOpenModal = (id = null) => {
    // If it's a string, we are editing. If it's an event or null, we are creating.
    if (id && typeof id === 'string') {
      setEditingBroadcastId(id);
    } else {
      setEditingBroadcastId(null);
    }
    setIsModalOpen(true);
  };

  const hasActiveSelection = selectedBroadcastId !== null;

  return (
    <div className="w-screen h-dvh flex flex-col bg-gray-100 md:py-4 md:px-6 lg:py-6 lg:px-12 select-none overflow-hidden font-sans">
      <div className="flex-1 flex w-full max-w-7xl mx-auto bg-white md:rounded-2xl md:shadow-md overflow-hidden border border-wa-border">
        {/* Left Column (Sidebar + BottomNavbar) */}
        <div className={`h-full flex flex-col ${
          hasActiveSelection ? 'hidden md:flex' : 'flex'
        } w-full md:w-auto`}>
          <Sidebar onCreateBroadcast={handleOpenModal} />
        </div>

        {/* Right Column (ChatWindow) */}
        <div className={`h-full flex-1 flex flex-col ${
          hasActiveSelection ? 'flex' : 'hidden md:flex'
        }`}>
          <ChatWindow onEditBroadcast={handleOpenModal} />
        </div>
      </div>

      {/* Floating Action Button (FAB) for mobile to create broadcast */}
      {!hasActiveSelection && (
        <button
          onClick={() => handleOpenModal(null)}
          className="md:hidden fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.5rem+env(safe-area-inset-right,0px))] w-14 h-14 bg-wa-green text-white rounded-full flex items-center justify-center shadow-lg hover:bg-wa-green-dark transition-all active:scale-95 z-30"
          title="New broadcast list"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
            <line x1="12" x2="12" y1="5" y2="19"/>
            <line x1="5" x2="19" y1="12" y2="12"/>
          </svg>
        </button>
      )}

      {/* Broadcast Creation/Alteration Modal */}
      <BroadcastModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        broadcastId={editingBroadcastId}
      />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
