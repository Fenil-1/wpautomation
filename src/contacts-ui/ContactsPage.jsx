import React, { useState } from 'react';
import { Users, Contact2 } from 'lucide-react';
import ContactsView from './ContactsView';
import GroupsView from './GroupsView';

// Self-contained Contacts + Groups management screen (route: /contacts).
// Backend-powered; completely isolated from the broadcast app. Reuses the
// existing wa-* theme so it feels native.
export default function ContactsPage() {
  const [tab, setTab] = useState('contacts');

  return (
    <div
      className="w-screen flex flex-col bg-gray-100 md:py-4 md:px-6 lg:py-6 lg:px-12 overflow-hidden font-sans"
      style={{ height: '100dvh' }}
    >
      <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto bg-white md:rounded-2xl md:shadow-md overflow-hidden border border-wa-border">
        {/* Header */}
        <div className="px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-0 bg-white border-b border-wa-border">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-wa-text-primary">Contacts</h1>
          </div>
          <div className="flex gap-1">
            <TabButton active={tab === 'contacts'} onClick={() => setTab('contacts')} icon={Contact2}>
              Contacts
            </TabButton>
            <TabButton active={tab === 'groups'} onClick={() => setTab('groups')} icon={Users}>
              Groups
            </TabButton>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0">
          {tab === 'contacts' ? <ContactsView /> : <GroupsView />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active
          ? 'border-wa-green text-wa-green-dark'
          : 'border-transparent text-wa-text-secondary hover:text-wa-text-primary'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}
