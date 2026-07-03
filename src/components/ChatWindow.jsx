import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Send, Mic, Paperclip, Smile, Edit2, Megaphone, Check, CheckCheck, Info, X, Forward, Search, Trash2 } from 'lucide-react';

const ChatWindow = ({ onEditBroadcast }) => {
  const {
    contacts,
    broadcasts,
    broadcastMessages,
    selectedBroadcastId,
    setSelectedBroadcastId,
    sendBroadcastMessage,
    deleteBroadcastMessage
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [statsMessage, setStatsMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const [statsFilter, setStatsFilter] = useState('total');
  const [forwardText, setForwardText] = useState(null);
  const [selectedBroadcasts, setSelectedBroadcasts] = useState([]);
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');
  const [deleteConfirmMessageId, setDeleteConfirmMessageId] = useState(null);

  // Reset stats filter when modal message changes
  useEffect(() => {
    setStatsFilter('total');
  }, [statsMessage]);

  const handleOpenForwardModal = (text) => {
    setForwardText(text);
    setSelectedBroadcasts([]);
    setForwardSearchQuery('');
  };

  const isBroadcastActive = selectedBroadcastId !== null;

  // Find active entity
  const activeBroadcast = isBroadcastActive ? broadcasts.find(b => b.id === selectedBroadcastId) : null;

  // Get active messages
  const messages = isBroadcastActive
    ? broadcastMessages[selectedBroadcastId] || []
    : [];

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  // Scroll to bottom when visual viewport shrinks (keyboard shown)
  useEffect(() => {
    if (window.visualViewport) {
      const handleResize = () => {
        setTimeout(() => scrollToBottom('auto'), 150);
      };
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport.removeEventListener('resize', handleResize);
    }
  }, []);

  if (!isBroadcastActive) {
    return (
      <div className="hidden md:flex flex-col flex-1 items-center justify-center bg-gray-50 h-full border-b-4 border-wa-green/30 select-none">
        <div className="text-center max-w-sm px-6">
          <div className="w-20 h-20 rounded-full bg-wa-green/10 text-wa-green flex items-center justify-center mx-auto mb-5 shadow-xs">
            <Megaphone className="w-10 h-10 stroke-[1.5]" />
          </div>
          <h2 className="text-xl font-semibold text-wa-text-primary mb-2">
            WhatsApp complementary app
          </h2>
          <p className="text-sm text-wa-text-secondary">
            Select a chat or a broadcast group from the list to start messaging.
          </p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    setSelectedBroadcastId(null);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (isBroadcastActive) {
      sendBroadcastMessage(selectedBroadcastId, inputText.trim());
    }
    setInputText('');
  };

  const renderStatusTicks = (status) => {
    if (status === 'sent') {
      return <Check className="w-3.5 h-3.5 text-gray-400 stroke-[2.5px]" />;
    }
    if (status === 'delivered') {
      return <CheckCheck className="w-4 h-4 text-gray-400 stroke-[2.5px]" />;
    }
    if (status === 'read') {
      return <CheckCheck className="w-4 h-4 text-sky-500 stroke-[2.5px]" />;
    }
    return null;
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-white z-20 relative">
      
      {/* Active Conversation Header */}
      <div className="min-h-16 h-auto pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 bg-white border-b border-wa-border flex items-center justify-between px-4 shrink-0">
        
        {/* Left section: Avatar & Details */}
        <div className="flex items-center space-x-3 min-w-0">
          {/* Back button on mobile */}
          <button
            onClick={handleBack}
            className="md:hidden p-1.5 hover:bg-wa-hover-chat rounded-full text-wa-text-secondary transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-wa-text-primary" />
          </button>

          {/* Profile / Group Avatar */}
          <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden font-bold text-sm select-none bg-wa-green text-white shadow-xs`}>
            {activeBroadcast?.image ? (
              <img src={activeBroadcast.image} alt={activeBroadcast.name} className="w-full h-full object-cover" />
            ) : (
              <Megaphone className="w-4 h-4 fill-white/10" />
            )}
          </div>

          {/* Conversation info */}
          <div className="min-w-0">
            <h4 className="font-semibold text-[15px] text-wa-text-primary truncate leading-tight">
              {activeBroadcast?.name}
            </h4>
            <span className="text-[12px] text-wa-text-secondary truncate block leading-normal">
              {`${activeBroadcast?.memberIds?.length || 0} recipients`}
            </span>
          </div>
        </div>

        {/* Right section: Edit Broadcast details */}
        <div className="flex items-center text-wa-text-secondary space-x-2">
          <button
            onClick={() => onEditBroadcast(selectedBroadcastId)}
            className="p-2 hover:bg-wa-hover-chat rounded-full text-wa-text-primary hover:text-wa-green transition-all"
            title="Edit broadcast recipients"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 wa-chat-bg flex flex-col space-y-2">
        
        {/* Broadcast info banner in messages stream */}
        <div className="self-center bg-white border border-yellow-200/50 rounded-xl px-4 py-2.5 text-center text-xs text-wa-text-secondary max-w-sm shadow-xs mb-3">
          📢 You are broadcasting to <strong>{activeBroadcast?.memberIds?.length || 0} recipients</strong>. Messages sent here will deliver as individual chats.
        </div>

        {/* Render message bubbles */}
        {messages.map((msg) => {
          const isMe = msg.sender === 'me';
          return (
            <div 
              key={msg.id} 
              className={`flex items-center space-x-2 group w-full ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {isMe && !msg.isDeleted && (
                <div className="flex flex-col items-center space-y-1">
                  <button
                    type="button"
                    onClick={() => handleOpenForwardModal(msg.text)}
                    className="p-1.5 hover:bg-black/5 rounded-full text-wa-text-secondary hover:text-wa-green transition-all shrink-0 cursor-pointer"
                    title="Forward message"
                  >
                    <Forward className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmMessageId(msg.id)}
                    className="p-1.5 hover:bg-red-50 rounded-full text-wa-text-secondary hover:text-red-500 transition-all shrink-0 cursor-pointer"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div
                className={`max-w-[75%] md:max-w-[65%] rounded-xl px-3 py-1.5 text-[14.5px] leading-relaxed shadow-xs relative flex flex-col ${
                  isMe
                    ? 'bg-wa-bubble-sent text-wa-text-primary rounded-tr-none'
                    : 'bg-wa-bubble-received text-wa-text-primary rounded-tl-none'
                }`}
              >
                {/* Message text */}
                <p className={`whitespace-pre-wrap break-words ${msg.isDeleted ? 'italic text-wa-text-secondary/60 select-none' : ''}`}>{msg.text}</p>
                
                {/* Bubble timestamp & status indicator */}
                {!isMe && (
                  <div className="flex items-center justify-end space-x-1 mt-1 select-none">
                    <span className="text-[9px] text-wa-text-secondary/80 font-medium">
                      {msg.timestamp}
                    </span>
                  </div>
                )}

                {isMe && (() => {
                  if (msg.isDeleted) return null;
                  const totalIntended = msg.recipients?.length || 0;
                  const totalDelivered = msg.recipients?.filter(r => r.status === 'delivered' || r.status === 'read').length || 0;
                  const totalRead = msg.recipients?.filter(r => r.status === 'read').length || 0;
                  const skippedCount = activeBroadcast 
                    ? Math.max(0, activeBroadcast.memberIds.length - totalIntended) 
                    : 0;
                  const totalMembers = activeBroadcast ? activeBroadcast.memberIds.length : (totalIntended + skippedCount);

                  return (
                    <div className="mt-2 pt-1.5 border-t border-black/5 flex items-center justify-between text-xs select-none">
                      {/* Quick Glance Metrics */}
                      <div className="flex items-center space-x-2.5 text-[10px] text-wa-text-secondary">
                        <span>Total: <strong className="text-wa-text-primary">{totalMembers}</strong></span>
                        <span>Delivered: <strong className="text-wa-green-dark">{totalDelivered}</strong></span>
                        <span>Seen: <strong className="text-sky-600">{totalRead}</strong></span>
                        <span>Skipped: <strong className="text-amber-600">{skippedCount}</strong></span>
                      </div>

                      {/* Detailed Info Button */}
                      <button
                        type="button"
                        onClick={() => setStatsMessage(msg)}
                        className="flex flex-col items-center justify-center text-wa-text-secondary hover:text-wa-green transition-all cursor-pointer px-2 py-0.5 rounded-md hover:bg-black/5 shrink-0"
                        title="View Message Statistics"
                      >
                        <Info className="w-5 h-5 stroke-[2px]" />
                        <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wider text-wa-text-secondary/80">info</span>
                      </button>
                    </div>
                  );
                })()}
              </div>

              {!isMe && !msg.isDeleted && (
                <button
                  type="button"
                  onClick={() => handleOpenForwardModal(msg.text)}
                  className="p-1.5 hover:bg-black/5 rounded-full text-wa-text-secondary hover:text-wa-green transition-all shrink-0 cursor-pointer"
                  title="Forward message"
                >
                  <Forward className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Action Bar */}
      <form onSubmit={handleSend} className="bg-wa-hover-chat px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center space-x-2 shrink-0 border-t border-wa-border">
        <div className="flex space-x-1 text-wa-text-secondary">
          <button type="button" className="p-2 hover:bg-wa-border rounded-full transition-colors">
            <Smile className="w-6 h-6" />
          </button>
          <button type="button" className="p-2 hover:bg-wa-border rounded-full transition-colors">
            <Paperclip className="w-6 h-6" />
          </button>
        </div>

        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onFocus={() => {
            setTimeout(() => scrollToBottom('smooth'), 300);
          }}
          placeholder="Type a message..."
          className="flex-1 bg-white rounded-xl py-2.5 px-4 outline-none text-[16px] border border-transparent focus:border-wa-green/20 text-wa-text-primary placeholder:text-wa-text-secondary shadow-xs"
        />

        {inputText.trim() ? (
          <button
            type="submit"
            className="p-2.5 bg-wa-green text-white rounded-full hover:bg-wa-green-dark transition-colors shadow-xs"
          >
            <Send className="w-5 h-5 fill-white stroke-none" />
          </button>
        ) : (
          <button
            type="button"
            className="p-2.5 bg-wa-green text-white rounded-full hover:bg-wa-green-dark transition-colors shadow-xs"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </form>

      {/* Broadcast Message Statistics Modal */}
      {(() => {
        const currentStatsMessage = statsMessage 
          ? messages.find(m => m.id === statsMessage.id) || statsMessage 
          : null;

        if (!currentStatsMessage) return null;

        const totalIntended = currentStatsMessage.recipients?.length || 0;
        const totalDelivered = currentStatsMessage.recipients?.filter(r => r.status === 'delivered' || r.status === 'read').length || 0;
        const totalRead = currentStatsMessage.recipients?.filter(r => r.status === 'read').length || 0;
        const skippedMemberIds = activeBroadcast 
          ? activeBroadcast.memberIds.filter(id => !currentStatsMessage.recipients?.some(r => r.contactId === id))
          : [];
        const unsentCount = skippedMemberIds.length;
        const totalMembers = activeBroadcast ? activeBroadcast.memberIds.length : (totalIntended + unsentCount);
        const progressPercent = totalIntended > 0 ? Math.round((totalDelivered / totalIntended) * 100) : 0;

        let displayedList = [];
        if (statsFilter === 'total') {
          displayedList = [
            ...(currentStatsMessage.recipients || []),
            ...skippedMemberIds.map(id => ({
              contactId: id,
              status: 'skipped',
              time: ''
            }))
          ];
        } else if (statsFilter === 'delivered') {
          displayedList = currentStatsMessage.recipients?.filter(r => r.status === 'delivered' || r.status === 'read') || [];
        } else if (statsFilter === 'seen') {
          displayedList = currentStatsMessage.recipients?.filter(r => r.status === 'read') || [];
        } else if (statsFilter === 'skipped') {
          displayedList = skippedMemberIds.map(id => ({
            contactId: id,
            status: 'skipped',
            time: ''
          }));
        }

        return (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100"
            onClick={() => setStatsMessage(null)}
          >
            <div 
              className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[85vh] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-wa-green text-white p-4 flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center space-x-2">
                  <Megaphone className="w-5 h-5" />
                  <span>Message Statistics</span>
                </h3>
                <button 
                  type="button"
                  onClick={() => setStatsMessage(null)} 
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-5 flex-1 overflow-y-auto space-y-5 select-text">
                {/* Message Text Preview */}
                <div className="bg-wa-bubble-sent border border-wa-border/50 rounded-xl p-3 text-[14px] leading-relaxed max-w-[85%] ml-auto shadow-xs">
                  <p className="whitespace-pre-wrap text-wa-text-primary pr-6">{currentStatsMessage.text}</p>
                  <span className="text-[9px] text-wa-text-secondary text-right block mt-1">{currentStatsMessage.timestamp}</span>
                </div>

                {/* Metrics Blocks */}
                <div className="grid grid-cols-4 gap-2 select-none">
                  <button 
                    type="button"
                    onClick={() => setStatsFilter('total')}
                    className={`border rounded-xl p-2.5 text-center cursor-pointer transition-all ${
                      statsFilter === 'total' 
                        ? 'bg-wa-green/10 border-wa-green' 
                        : 'bg-gray-50 border-wa-border hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-lg font-bold text-wa-text-primary">{totalMembers}</div>
                    <div className="text-[9px] uppercase font-semibold text-wa-text-secondary mt-0.5 tracking-wider">Total</div>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStatsFilter('delivered')}
                    className={`border rounded-xl p-2.5 text-center cursor-pointer transition-all ${
                      statsFilter === 'delivered' 
                        ? 'bg-wa-green/10 border-wa-green' 
                        : 'bg-gray-50 border-wa-border hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-lg font-bold text-wa-green-dark">{totalDelivered}</div>
                    <div className="text-[9px] uppercase font-semibold text-wa-text-secondary mt-0.5 tracking-wider">Delivered</div>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStatsFilter('seen')}
                    className={`border rounded-xl p-2.5 text-center cursor-pointer transition-all ${
                      statsFilter === 'seen' 
                        ? 'bg-sky-50 border-sky-400' 
                        : 'bg-gray-50 border-wa-border hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-lg font-bold text-sky-500">{totalRead}</div>
                    <div className="text-[9px] uppercase font-semibold text-wa-text-secondary mt-0.5 tracking-wider">Seen</div>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStatsFilter('skipped')}
                    className={`border rounded-xl p-2.5 text-center cursor-pointer transition-all ${
                      statsFilter === 'skipped' 
                        ? 'bg-amber-50 border-amber-400' 
                        : 'bg-gray-50 border-wa-border hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-lg font-bold text-amber-500">{unsentCount}</div>
                    <div className="text-[9px] uppercase font-semibold text-wa-text-secondary mt-0.5 tracking-wider">Skipped</div>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 bg-gray-50/50 p-3 rounded-xl border border-wa-border">
                  <div className="flex justify-between text-xs font-semibold text-wa-text-secondary">
                    <span>Delivery Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-wa-green h-full transition-all duration-300" 
                      style={{ width: `${totalMembers > 0 ? ((totalDelivered - totalRead) / totalMembers) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-sky-400 h-full transition-all duration-300" 
                      style={{ width: `${totalMembers > 0 ? (totalRead / totalMembers) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-amber-400 h-full transition-all duration-300" 
                      style={{ width: `${totalMembers > 0 ? (unsentCount / totalMembers) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-gray-300 h-full transition-all duration-300" 
                      style={{ width: `${totalMembers > 0 ? ((totalIntended - totalDelivered) / totalMembers) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-wa-text-secondary font-semibold pt-1 flex-wrap gap-x-2 gap-y-1">
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-wa-green mr-1"></span> Delivered ({totalDelivered - totalRead})</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-sky-400 mr-1"></span> Seen ({totalRead})</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-400 mr-1"></span> Skipped ({unsentCount})</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-300 mr-1"></span> Pending ({totalIntended - totalDelivered})</span>
                  </div>
                </div>

                {/* Recipients List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-wa-text-secondary uppercase tracking-wider">
                    {statsFilter === 'total' && 'Total List'}
                    {statsFilter === 'delivered' && 'Delivered List'}
                    {statsFilter === 'seen' && 'Seen List'}
                    {statsFilter === 'skipped' && 'Skipped List (Unengaged)'}
                  </h4>
                  <div className="border border-wa-border rounded-xl divide-y divide-wa-border max-h-[220px] overflow-y-auto">
                    {displayedList.map(recipient => {
                      const contact = contacts.find(c => c.id === recipient.contactId);
                      return (
                        <div key={recipient.contactId} className="p-3 flex items-center justify-between text-sm hover:bg-gray-50 transition-colors">
                          <div className="min-w-0 pr-3">
                            <div className="font-semibold text-wa-text-primary truncate">{contact?.name || 'Unknown'}</div>
                            <div className="text-xs text-wa-text-secondary truncate mt-0.5">{contact?.business} • {contact?.phone}</div>
                          </div>
                          <div className="flex flex-col items-end space-y-1 shrink-0 select-none">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              recipient.status === 'read' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                              recipient.status === 'delivered' ? 'bg-green-50 text-wa-green-dark border border-green-100' :
                              recipient.status === 'skipped' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-gray-100 text-wa-text-secondary border border-gray-200'
                            }`}>
                              {recipient.status === 'read' ? 'Seen' : 
                               recipient.status === 'delivered' ? 'Delivered' : 
                               recipient.status === 'skipped' ? 'Skipped' : 'Sent'}
                            </span>
                            {recipient.time && <span className="text-[10px] text-wa-text-secondary/70">{recipient.time}</span>}
                          </div>
                        </div>
                      );
                    })}
                    {displayedList.length === 0 && (
                      <div className="text-center py-8 text-sm text-wa-text-secondary">
                        No contacts found for this filter.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Close button */}
              <div className="p-4 bg-gray-50 border-t border-wa-border flex justify-end">
                <button 
                  type="button"
                  onClick={() => setStatsMessage(null)}
                  className="py-2 px-5 bg-wa-green hover:bg-wa-green-dark text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Forward Message Modal */}
      {forwardText !== null && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100"
          onClick={() => {
            setForwardText(null);
            setSelectedBroadcasts([]);
            setForwardSearchQuery('');
          }}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[85vh] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-wa-green text-white p-4 flex items-center justify-between shadow-xs">
              <h3 className="font-semibold text-lg flex items-center space-x-2">
                <Forward className="w-5 h-5" />
                <span>Forward Message</span>
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setForwardText(null);
                  setSelectedBroadcasts([]);
                  setForwardSearchQuery('');
                }} 
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-wa-border flex-shrink-0">
              <div className="bg-wa-hover-chat rounded-lg flex items-center px-3 py-1.5 border border-wa-border focus-within:border-wa-green transition-colors">
                <Search className="w-5 h-5 text-wa-text-secondary mr-2" />
                <input
                  type="text"
                  placeholder="Search broadcast lists..."
                  value={forwardSearchQuery}
                  onChange={e => setForwardSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[16px] text-wa-text-primary py-1"
                />
              </div>
            </div>

            {/* Lists */}
            <div className="flex-1 overflow-y-auto p-2">
              {broadcasts
                .filter(b => b.name.toLowerCase().includes(forwardSearchQuery.toLowerCase()))
                .map(b => {
                  const isChecked = selectedBroadcasts.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBroadcasts(prev =>
                          prev.includes(b.id) ? prev.filter(id => id !== b.id) : [...prev, b.id]
                        );
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-wa-hover-chat rounded-xl transition-all text-left"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-wa-green text-white font-bold text-sm">
                          {b.image ? (
                            <img src={b.image} alt={b.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <Megaphone className="w-4 h-4 fill-white/10" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-wa-text-primary text-sm leading-tight truncate">{b.name}</div>
                          <div className="text-xs text-wa-text-secondary mt-0.5">{b.memberIds.length} recipients</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isChecked ? 'bg-wa-green border-wa-green' : 'border-wa-text-secondary/40'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                      </div>
                    </button>
                  );
                })}
              {broadcasts.filter(b => b.name.toLowerCase().includes(forwardSearchQuery.toLowerCase())).length === 0 && (
                <div className="text-center py-8 text-wa-text-secondary text-sm">
                  No broadcast lists found matching "{forwardSearchQuery}"
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-wa-border bg-gray-50 flex items-center justify-end space-x-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setForwardText(null);
                  setSelectedBroadcasts([]);
                  setForwardSearchQuery('');
                }}
                className="py-2 px-4 border border-wa-border text-wa-text-secondary rounded-xl hover:bg-wa-hover-chat transition-colors text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  selectedBroadcasts.forEach(bId => {
                    sendBroadcastMessage(bId, forwardText);
                  });
                  setForwardText(null);
                  setSelectedBroadcasts([]);
                  setForwardSearchQuery('');
                }}
                disabled={selectedBroadcasts.length === 0}
                className="py-2 px-5 bg-wa-green text-white rounded-xl hover:bg-wa-green-dark transition-colors disabled:opacity-50 disabled:hover:bg-wa-green text-sm font-semibold shadow-sm"
              >
                Forward ({selectedBroadcasts.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Card */}
      {deleteConfirmMessageId !== null && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100"
          onClick={() => setDeleteConfirmMessageId(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-xs flex flex-col p-5 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-wa-border"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-3 text-red-500">
              <div className="p-2 bg-red-50 rounded-full">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-wa-text-primary">Delete Message?</h3>
            </div>
            
            <p className="text-xs text-wa-text-secondary leading-relaxed mb-5">
              Are you sure you want to delete this message? This action will permanently remove it from this broadcast list, and simulated delivery statuses for recipients will stop.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmMessageId(null)}
                className="py-1.5 px-3.5 border border-wa-border text-wa-text-secondary rounded-xl hover:bg-wa-hover-chat transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteBroadcastMessage(selectedBroadcastId, deleteConfirmMessageId);
                  setDeleteConfirmMessageId(null);
                }}
                className="py-1.5 px-4.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors text-xs font-semibold shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatWindow;
