import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Send, Mic, Paperclip, Smile, Edit2, Megaphone, Check, CheckCheck, Info, X } from 'lucide-react';

const ChatWindow = ({ onEditBroadcast }) => {
  const {
    activeTab,
    contacts,
    broadcasts,
    chatMessages,
    broadcastMessages,
    selectedChatId,
    setSelectedChatId,
    selectedBroadcastId,
    setSelectedBroadcastId,
    sendChatMessage,
    sendBroadcastMessage
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [statsMessage, setStatsMessage] = useState(null);
  const messagesEndRef = useRef(null);

  const isChatActive = activeTab === 'chats' && selectedChatId !== null;
  const isBroadcastActive = activeTab === 'broadcasts' && selectedBroadcastId !== null;

  // Find active entity
  const activeContact = isChatActive ? contacts.find(c => c.id === selectedChatId) : null;
  const activeBroadcast = isBroadcastActive ? broadcasts.find(b => b.id === selectedBroadcastId) : null;

  // Get active messages
  const messages = isChatActive
    ? chatMessages[selectedChatId] || []
    : isBroadcastActive
    ? broadcastMessages[selectedBroadcastId] || []
    : [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isChatActive && !isBroadcastActive) {
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
    setSelectedChatId(null);
    setSelectedBroadcastId(null);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (isChatActive) {
      sendChatMessage(selectedChatId, inputText.trim());
    } else if (isBroadcastActive) {
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
      <div className="h-16 bg-white border-b border-wa-border flex items-center justify-between px-4 py-2 shrink-0">
        
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
          <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden font-bold text-sm select-none ${
            isBroadcastActive 
              ? 'bg-wa-green text-white shadow-xs' 
              : 'bg-wa-green/10 text-wa-green-dark'
          }`}>
            {isBroadcastActive ? (
              activeBroadcast?.image ? (
                <img src={activeBroadcast.image} alt={activeBroadcast.name} className="w-full h-full object-cover" />
              ) : (
                <Megaphone className="w-4 h-4 fill-white/10" />
              )
            ) : (
              activeContact?.image ? (
                <img src={activeContact.image} alt={activeContact.name} className="w-full h-full object-cover" />
              ) : (
                activeContact?.avatar
              )
            )}
          </div>

          {/* Conversation info */}
          <div className="min-w-0">
            <h4 className="font-semibold text-[15px] text-wa-text-primary truncate leading-tight">
              {isChatActive ? activeContact?.name : activeBroadcast?.name}
            </h4>
            <span className="text-[12px] text-wa-text-secondary truncate block leading-normal">
              {isChatActive 
                ? `${activeContact?.business} • ${activeContact?.phone}`
                : `${activeBroadcast?.memberIds.length} recipients`}
            </span>
          </div>
        </div>

        {/* Right section: Edit Broadcast details */}
        <div className="flex items-center text-wa-text-secondary space-x-2">
          {isBroadcastActive && (
            <button
              onClick={() => onEditBroadcast(selectedBroadcastId)}
              className="p-2 hover:bg-wa-hover-chat rounded-full text-wa-text-primary hover:text-wa-green transition-all"
              title="Edit broadcast recipients"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 wa-chat-bg flex flex-col space-y-2">
        
        {/* Broadcast info banner in messages stream */}
        {isBroadcastActive && (
          <div className="self-center bg-white border border-yellow-200/50 rounded-xl px-4 py-2.5 text-center text-xs text-wa-text-secondary max-w-sm shadow-xs mb-3">
            📢 You are broadcasting to <strong>{activeBroadcast?.memberIds.length} recipients</strong>. Messages sent here will deliver as individual chats.
          </div>
        )}

        {/* Render message bubbles */}
        {messages.map((msg) => {
          const isMe = msg.sender === 'me';
          return (
            <div
              key={msg.id}
              className={`max-w-[75%] md:max-w-[65%] rounded-xl px-3 py-1.5 text-[14.5px] leading-relaxed shadow-xs relative flex flex-col ${
                isMe
                  ? 'self-end bg-wa-bubble-sent text-wa-text-primary rounded-tr-none'
                  : 'self-start bg-wa-bubble-received text-wa-text-primary rounded-tl-none'
              }`}
            >
              {/* Message text */}
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              
              {/* Bubble timestamp & status indicator */}
              {!(isBroadcastActive && isMe) && (
                <div className="flex items-center justify-end space-x-1 mt-1 select-none">
                  <span className="text-[9px] text-wa-text-secondary/80 font-medium">
                    {msg.timestamp}
                  </span>
                  {isMe && renderStatusTicks(msg.status)}
                </div>
              )}

              {isBroadcastActive && isMe && (() => {
                const totalIntended = msg.recipients?.length || 0;
                const totalDelivered = msg.recipients?.filter(r => r.status === 'delivered' || r.status === 'read').length || 0;
                const totalRead = msg.recipients?.filter(r => r.status === 'read').length || 0;

                return (
                  <div className="mt-2 pt-1.5 border-t border-black/5 flex items-center justify-between text-xs select-none">
                    {/* Quick Glance Metrics */}
                    <div className="flex items-center space-x-3 text-[11px] text-wa-text-secondary">
                      <span>Total: <strong className="text-wa-text-primary">{totalIntended}</strong></span>
                      <span>Delivered: <strong className="text-wa-green-dark">{totalDelivered}</strong></span>
                      <span>Seen: <strong className="text-sky-600">{totalRead}</strong></span>
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
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Action Bar */}
      <form onSubmit={handleSend} className="bg-wa-hover-chat p-3 flex items-center space-x-2 shrink-0 border-t border-wa-border">
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
          placeholder="Type a message..."
          className="flex-1 bg-white rounded-xl py-2.5 px-4 outline-none text-[15px] border border-transparent focus:border-wa-green/20 text-wa-text-primary placeholder:text-wa-text-secondary shadow-xs"
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
        const progressPercent = totalIntended > 0 ? Math.round((totalDelivered / totalIntended) * 100) : 0;

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
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-gray-50 border border-wa-border rounded-xl p-2.5 text-center">
                    <div className="text-xl font-bold text-wa-text-primary">{totalIntended}</div>
                    <div className="text-[9px] uppercase font-semibold text-wa-text-secondary mt-0.5 tracking-wider">Intended</div>
                  </div>
                  <div className="bg-gray-50 border border-wa-border rounded-xl p-2.5 text-center">
                    <div className="text-xl font-bold text-wa-green-dark">{totalDelivered}</div>
                    <div className="text-[9px] uppercase font-semibold text-wa-text-secondary mt-0.5 tracking-wider">Delivered</div>
                  </div>
                  <div className="bg-gray-50 border border-wa-border rounded-xl p-2.5 text-center">
                    <div className="text-xl font-bold text-sky-500">{totalRead}</div>
                    <div className="text-[9px] uppercase font-semibold text-wa-text-secondary mt-0.5 tracking-wider">Seen</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 bg-gray-50/50 p-3 rounded-xl border border-wa-border">
                  <div className="flex justify-between text-xs font-semibold text-wa-text-secondary">
                    <span>Delivery Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-sky-400 h-full transition-all duration-300" 
                      style={{ width: `${totalIntended > 0 ? (totalRead / totalIntended) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-wa-green h-full transition-all duration-300" 
                      style={{ width: `${totalIntended > 0 ? ((totalDelivered - totalRead) / totalIntended) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-wa-text-secondary font-semibold pt-1">
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-sky-400 mr-1"></span> Read ({totalRead})</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-wa-green mr-1"></span> Delivered ({totalDelivered - totalRead})</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-300 mr-1"></span> Pending ({totalIntended - totalDelivered})</span>
                  </div>
                </div>

                {/* Recipients List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-wa-text-secondary uppercase tracking-wider">Delivery Breakdown</h4>
                  <div className="border border-wa-border rounded-xl divide-y divide-wa-border max-h-[220px] overflow-y-auto">
                    {currentStatsMessage.recipients?.map(recipient => {
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
                              'bg-gray-100 text-wa-text-secondary border border-gray-200'
                            }`}>
                              {recipient.status === 'read' ? 'Seen' : recipient.status === 'delivered' ? 'Delivered' : 'Sent'}
                            </span>
                            <span className="text-[10px] text-wa-text-secondary/70">{recipient.time}</span>
                          </div>
                        </div>
                      );
                    })}
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

    </div>
  );
};

export default ChatWindow;
