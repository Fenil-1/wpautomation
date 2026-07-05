import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Send, Mic, Paperclip, Smile, Edit2, Megaphone, CheckCheck, Info, X, Trash2 } from 'lucide-react';
import { broadcastsApi } from '../api/broadcasts';

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const ChatWindow = ({ onEditBroadcast }) => {
  const {
    broadcasts,
    selectedBroadcastId,
    setSelectedBroadcastId,
    sendBroadcast,
    deleteBroadcast,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsFilter, setStatsFilter] = useState('total');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [progress, setProgress] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const isBroadcastActive = selectedBroadcastId !== null;
  const activeBroadcast = isBroadcastActive ? broadcasts.find(b => b.id === selectedBroadcastId) : null;

  // Poll delivery progress every 2.5s while a broadcast is open.
  useEffect(() => {
    if (!selectedBroadcastId) return;
    let active = true;
    let timer = null;
    const tick = async () => {
      try {
        const p = await broadcastsApi.progress(selectedBroadcastId);
        if (active) setProgress(p);
      } catch {
        /* broadcast may have been deleted; ignore */
      }
      if (active) timer = setTimeout(tick, 2500);
    };
    setProgress(null);
    setJustSent(false);
    setStatsFilter('total');
    tick();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [selectedBroadcastId]);

  // A broadcast shows its message bubble once it has been sent (any recipient
  // has moved past 'pending'), or immediately after the user hits send.
  const terminalOrActive = progress
    ? progress.sent + progress.failed + progress.skipped + progress.processing
    : 0;
  const showMessageBubble = justSent || terminalOrActive > 0;

  // Load per-recipient breakdown when the stats modal opens.
  useEffect(() => {
    if (!statsOpen || !selectedBroadcastId) return;
    let active = true;
    setRecipientsLoading(true);
    broadcastsApi
      .recipients(selectedBroadcastId)
      .then((list) => active && setRecipients(list))
      .catch(() => active && setRecipients([]))
      .finally(() => active && setRecipientsLoading(false));
    return () => {
      active = false;
    };
  }, [statsOpen, selectedBroadcastId]);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [showMessageBubble]);

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    // One campaign message per broadcast: once sent, the message is fixed.
    if (showMessageBubble) {
      setInputText('');
      return;
    }
    setSending(true);
    try {
      await sendBroadcast(selectedBroadcastId, inputText.trim());
      setJustSent(true);
      setInputText('');
    } catch {
      /* keep the text so the user can retry */
    } finally {
      setSending(false);
    }
  };

  const recipientCount = activeBroadcast?.recipientCount ?? progress?.total ?? 0;

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
            <Megaphone className="w-4 h-4 fill-white/10" />
          </div>

          {/* Conversation info */}
          <div className="min-w-0">
            <h4 className="font-semibold text-[15px] text-wa-text-primary truncate leading-tight">
              {activeBroadcast?.name}
            </h4>
            <span className="text-[12px] text-wa-text-secondary truncate block leading-normal">
              {`${recipientCount} recipients`}
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
          📢 You are broadcasting to <strong>{recipientCount} recipients</strong>. Messages sent here will deliver as individual chats.
        </div>

        {/* The single campaign message bubble (shown once sent) */}
        {showMessageBubble && (
          <div className="flex items-center space-x-2 group w-full justify-end">
            <div className="flex flex-col items-center space-y-1">
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="p-1.5 hover:bg-red-50 rounded-full text-wa-text-secondary hover:text-red-500 transition-all shrink-0 cursor-pointer"
                title="Delete broadcast"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="max-w-[75%] md:max-w-[65%] rounded-xl px-3 py-1.5 text-[14.5px] leading-relaxed shadow-xs relative flex flex-col bg-wa-bubble-sent text-wa-text-primary rounded-tr-none">
              {/* Message text */}
              <p className="whitespace-pre-wrap break-words">{activeBroadcast?.message}</p>

              {(() => {
                const total = progress?.total ?? recipientCount;
                const sent = progress?.sent ?? 0;
                const failed = progress?.failed ?? 0;
                const skipped = progress?.skipped ?? 0;
                return (
                  <div className="mt-2 pt-1.5 border-t border-black/5 flex items-center justify-between text-xs select-none">
                    {/* Quick Glance Metrics */}
                    <div className="flex items-center space-x-2.5 text-[10px] text-wa-text-secondary">
                      <span>Total: <strong className="text-wa-text-primary">{total}</strong></span>
                      <span>Sent: <strong className="text-wa-green-dark">{sent}</strong></span>
                      <span>Failed: <strong className="text-sky-600">{failed}</strong></span>
                      <span>Skipped: <strong className="text-amber-600">{skipped}</strong></span>
                    </div>

                    {/* Detailed Info Button */}
                    <button
                      type="button"
                      onClick={() => setStatsOpen(true)}
                      className="flex flex-col items-center justify-center text-wa-text-secondary hover:text-wa-green transition-all cursor-pointer px-2 py-0.5 rounded-md hover:bg-black/5 shrink-0"
                      title="View Message Statistics"
                    >
                      <Info className="w-5 h-5 stroke-[2px]" />
                      <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wider text-wa-text-secondary/80">info</span>
                    </button>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end space-x-1 mt-1 select-none">
                <span className="text-[9px] text-wa-text-secondary/80 font-medium">
                  {formatTime(activeBroadcast?.updatedAt)}
                </span>
                <CheckCheck className="w-3.5 h-3.5 text-sky-500 stroke-[2.5px]" />
              </div>
            </div>
          </div>
        )}

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
            disabled={sending}
            className="p-2.5 bg-wa-green text-white rounded-full hover:bg-wa-green-dark transition-colors shadow-xs disabled:opacity-50"
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

      {/* Broadcast Delivery Statistics Modal */}
      {statsOpen && (() => {
        const total = progress?.total ?? 0;
        const sent = progress?.sent ?? 0;
        const failed = progress?.failed ?? 0;
        const skipped = progress?.skipped ?? 0;
        const pending = (progress?.pending ?? 0) + (progress?.processing ?? 0);
        const progressPercent = progress?.percentage ?? 0;

        const displayedList = recipients.filter((r) => {
          if (statsFilter === 'total') return true;
          if (statsFilter === 'sent') return r.status === 'sent';
          if (statsFilter === 'failed') return r.status === 'failed';
          if (statsFilter === 'skipped') return r.status === 'skipped';
          return true;
        });

        return (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100"
            onClick={() => setStatsOpen(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[85vh] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-wa-green text-white p-4 flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center space-x-2">
                  <Megaphone className="w-5 h-5" />
                  <span>Delivery Statistics</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setStatsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-5 flex-1 overflow-y-auto space-y-5 select-text">
                {/* Message Text Preview */}
                <div className="bg-wa-bubble-sent border border-wa-border/50 rounded-xl p-3 text-[14px] leading-relaxed max-w-[85%] ml-auto shadow-xs">
                  <p className="whitespace-pre-wrap text-wa-text-primary pr-6">{activeBroadcast?.message}</p>
                  <span className="text-[9px] text-wa-text-secondary text-right block mt-1">{formatTime(activeBroadcast?.updatedAt)}</span>
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
                    <div className="text-lg font-bold text-wa-text-primary">{total}</div>
                    <div className="text-[9px] uppercase font-semibold text-wa-text-secondary mt-0.5 tracking-wider">Total</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatsFilter('sent')}
                    className={`border rounded-xl p-2.5 text-center cursor-pointer transition-all ${
                      statsFilter === 'sent'
                        ? 'bg-wa-green/10 border-wa-green'
                        : 'bg-gray-50 border-wa-border hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-lg font-bold text-wa-green-dark">{sent}</div>
                    <div className="text-[9px] uppercase font-semibold text-wa-text-secondary mt-0.5 tracking-wider">Sent</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatsFilter('failed')}
                    className={`border rounded-xl p-2.5 text-center cursor-pointer transition-all ${
                      statsFilter === 'failed'
                        ? 'bg-sky-50 border-sky-400'
                        : 'bg-gray-50 border-wa-border hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-lg font-bold text-sky-500">{failed}</div>
                    <div className="text-[9px] uppercase font-semibold text-wa-text-secondary mt-0.5 tracking-wider">Failed</div>
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
                    <div className="text-lg font-bold text-amber-500">{skipped}</div>
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
                      style={{ width: `${total > 0 ? (sent / total) * 100 : 0}%` }}
                    />
                    <div
                      className="bg-sky-400 h-full transition-all duration-300"
                      style={{ width: `${total > 0 ? (failed / total) * 100 : 0}%` }}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all duration-300"
                      style={{ width: `${total > 0 ? (skipped / total) * 100 : 0}%` }}
                    />
                    <div
                      className="bg-gray-300 h-full transition-all duration-300"
                      style={{ width: `${total > 0 ? (pending / total) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-wa-text-secondary font-semibold pt-1 flex-wrap gap-x-2 gap-y-1">
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-wa-green mr-1"></span> Sent ({sent})</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-sky-400 mr-1"></span> Failed ({failed})</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-400 mr-1"></span> Skipped ({skipped})</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-300 mr-1"></span> Pending ({pending})</span>
                  </div>
                </div>

                {/* Recipients List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-wa-text-secondary uppercase tracking-wider">
                    {statsFilter === 'total' && 'Total List'}
                    {statsFilter === 'sent' && 'Sent List'}
                    {statsFilter === 'failed' && 'Failed List'}
                    {statsFilter === 'skipped' && 'Skipped List'}
                  </h4>
                  <div className="border border-wa-border rounded-xl divide-y divide-wa-border max-h-[220px] overflow-y-auto">
                    {recipientsLoading && (
                      <div className="text-center py-8 text-sm text-wa-text-secondary">Loading…</div>
                    )}
                    {!recipientsLoading && displayedList.map(recipient => (
                      <div key={recipient.id} className="p-3 flex items-center justify-between text-sm hover:bg-gray-50 transition-colors">
                        <div className="min-w-0 pr-3">
                          <div className="font-semibold text-wa-text-primary truncate">{recipient.name || 'Unknown'}</div>
                          <div className="text-xs text-wa-text-secondary truncate mt-0.5">{recipient.businessName ? `${recipient.businessName} • ` : ''}{recipient.countryCode} {recipient.phoneNumber}</div>
                        </div>
                        <div className="flex flex-col items-end space-y-1 shrink-0 select-none">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            recipient.status === 'sent' ? 'bg-green-50 text-wa-green-dark border border-green-100' :
                            recipient.status === 'failed' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                            recipient.status === 'skipped' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-gray-100 text-wa-text-secondary border border-gray-200'
                          }`}>
                            {recipient.status === 'sent' ? 'Sent' :
                             recipient.status === 'failed' ? 'Failed' :
                             recipient.status === 'skipped' ? 'Skipped' :
                             recipient.status === 'processing' ? 'Processing' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {!recipientsLoading && displayedList.length === 0 && (
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
                  onClick={() => setStatsOpen(false)}
                  className="py-2 px-5 bg-wa-green hover:bg-wa-green-dark text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal Card */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100"
          onClick={() => setDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-xs flex flex-col p-5 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-wa-border"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-3 text-red-500">
              <div className="p-2 bg-red-50 rounded-full">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-wa-text-primary">Delete Broadcast?</h3>
            </div>

            <p className="text-xs text-wa-text-secondary leading-relaxed mb-5">
              Are you sure you want to delete this broadcast? This permanently removes the broadcast and all of its recipient records.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="py-1.5 px-3.5 border border-wa-border text-wa-text-secondary rounded-xl hover:bg-wa-hover-chat transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteBroadcast(selectedBroadcastId);
                  setDeleteConfirm(false);
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
