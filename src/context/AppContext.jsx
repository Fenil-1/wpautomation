import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

const initialContacts = [
  { id: '1', name: 'Rajesh Kumar', business: 'Surat Fabrics', phone: '+91 98765 43210', avatar: 'RK', image: 'https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '2', name: 'Priya Patel', business: 'Jaipur Kurtis', phone: '+91 94270 98765', avatar: 'PP', image: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '3', name: 'Mohit', business: 'Tezi Marketing', phone: '+91 98981 92203', avatar: 'M', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 8 },
  { id: '4', name: 'Fenil', business: 'WhatsApp Automation', phone: '+91 99988 87766', avatar: 'F', image: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 1 },
  { id: '5', name: 'Suresh Patel', business: 'Ahmedabad Weaves', phone: '+91 98250 12345', avatar: 'SP', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '6', name: 'Amit Sharma', business: 'Mumbai Retailers', phone: '+91 99887 76655', avatar: 'AS', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '7', name: 'Karthik Venkat', business: 'Chennai Loom', phone: '+91 90012 34567', avatar: 'KV', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '8', name: 'Manoj Singh', business: 'Patna Garments', phone: '+91 82103 45678', avatar: 'MS', image: 'https://images.unsplash.com/photo-1614644147724-2d4785d69962?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '9', name: 'Anjali Gupta', business: 'Delhi Wholesale', phone: '+91 95601 23456', avatar: 'AG', image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '10', name: 'Vikram Rathore', business: 'Jodhpur Textiles', phone: '+91 91160 54321', avatar: 'VR', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '11', name: 'Ritu Sharma', business: 'Ludhiana Woolens', phone: '+91 98140 12345', avatar: 'RS', image: 'https://images.unsplash.com/photo-1631016800696-5ea8801b3c2a?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '12', name: 'Deepak Verma', business: 'Kolkata Silk', phone: '+91 93310 98765', avatar: 'DV', image: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '13', name: 'Rahul Gupta', business: 'Indore Outfits', phone: '+91 94250 54321', avatar: 'RG', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '14', name: 'Sunil Mehta', business: 'Surat Sarees', phone: '+91 98240 67890', avatar: 'SM', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '15', name: 'Murugan Swamy', business: 'Tamilnadu Handloom', phone: '+91 94440 12345', avatar: 'MS', image: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '16', name: 'Shatrughan Prasad', business: 'Bihar Fabrics', phone: '+91 70040 56789', avatar: 'SP', image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: '17', name: 'Pankaj Kumar', business: 'Muzaffarpur Weaves', phone: '+91 91220 98765', avatar: 'PK', image: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
];

const initialBroadcasts = [
  { id: 'b1', name: 'Fabric suppliers', memberIds: ['1', '5', '10', '14'], image: 'https://images.unsplash.com/photo-1584290860011-64137b755879?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: 'b2', name: 'Kurti suppliers', memberIds: ['2', '9', '11'], image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: 'b3', name: 'Unstitched suppliers', memberIds: ['10', '14', '5'], image: 'https://images.unsplash.com/photo-1558271881-8e44b41b5185?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: 'b4', name: 'Cash customers', memberIds: ['6', '12', '13'], image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: 'b5', name: 'Tamilnadu customers', memberIds: ['7', '15'], image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
  { id: 'b6', name: 'Bihar customers', memberIds: ['8', '16', '17'], image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=100&h=100&q=80', unreadCount: 0 },
];

const initialChatMessages = {
  '1': [
    { id: 'm1_1', text: 'Got the new linen catalogs. Let me know the order quantity.', sender: 'them', timestamp: 'Yesterday, 3:02 PM', status: 'read' },
    { id: 'm1_2', text: 'Sure, checking fabric quality first. Will let you know by tomorrow morning.', sender: 'me', timestamp: 'Yesterday, 3:05 PM', status: 'read' },
  ],
  '2': [
    { id: 'm2_1', text: 'Sent the sample shipment yesterday. Tracker is in your email.', sender: 'them', timestamp: 'Today, 11:30 AM', status: 'read' },
    { id: 'm2_2', text: 'Thanks Priya, will confirm once received.', sender: 'me', timestamp: 'Today, 11:45 AM', status: 'read' }
  ],
  '3': [
    { id: 'm3_1', text: 'Hi, we have special discounts on wholesale cotton prints this week.', sender: 'me', timestamp: '3:50 PM', status: 'read' },
    { id: 'm3_2', text: 'Mohit: Not much interested on changing the software', sender: 'them', timestamp: '3:59 PM', status: 'unread' }
  ],
  '4': [
    { id: 'm4_1', text: '~Fenil: check this out!!', sender: 'them', timestamp: '1:09 PM', status: 'unread' }
  ]
};

const initialBroadcastMessages = {
  'b1': [
    {
      id: 'mb1_1',
      text: 'Dhamaka Offer! 💥 Aaj cotton fabric rolls bulk buy karne par flat 10% off! 🧵 Offer sirf Saturday tak valid hai. Payment terms flexibility limit standard support! 🚀 Call kijiye and booking lock karein. 🙏',
      sender: 'me',
      timestamp: 'Yesterday, 10:00 AM',
      status: 'delivered',
      recipients: [
        { contactId: '1', status: 'read', time: 'Yesterday, 10:05 AM' },
        { contactId: '5', status: 'read', time: 'Yesterday, 10:12 AM' },
        { contactId: '4', status: 'delivered', time: 'Yesterday, 10:02 AM' },
        { contactId: '14', status: 'sent', time: 'Yesterday, 10:00 AM' }
      ]
    }
  ],
  'b2': [
    {
      id: 'mb2_1',
      text: 'Monsoon Premium Kurtis Sale is Live! 👗 Heavy rayon & georgette kurtis starts from just ₹180! Wholesale lot booking par shipping completely free. 🛍️ Catalogue bhej raha hoon, slots fast book ho rahe hain!',
      sender: 'me',
      timestamp: 'Today, 09:10 AM',
      status: 'read',
      recipients: [
        { contactId: '2', status: 'read', time: 'Today, 09:15 AM' },
        { contactId: '9', status: 'read', time: 'Today, 09:18 AM' },
        { contactId: '11', status: 'read', time: 'Today, 09:20 AM' }
      ]
    }
  ],
  'b3': [
    {
      id: 'mb3_1',
      text: 'Summer Special Unstitched Suits Launch! 🌸 Cotton chanderi & organza suit sets ka premium lot stock ready hai. Flat ₹50/meter discount first 500 meters booking par! 📦 Fast dispatch available.',
      sender: 'me',
      timestamp: 'Yesterday, 04:15 PM',
      status: 'delivered',
      recipients: [
        { contactId: '10', status: 'delivered', time: 'Yesterday, 04:30 PM' },
        { contactId: '14', status: 'sent', time: 'Yesterday, 04:20 PM' },
        { contactId: '5', status: 'delivered', time: 'Yesterday, 04:25 PM' }
      ]
    }
  ],
  'b4': [
    {
      id: 'mb4_1',
      text: 'Instant Cash Payment Special! 💸 Apne outstanding balance par immediate cash settlement kijiye aur payiye direct 8% extra discount! 💰 Maximum profit, zero credit load. Limited slots.',
      sender: 'me',
      timestamp: 'Today, 12:35 PM',
      status: 'delivered',
      recipients: [
        { contactId: '6', status: 'read', time: 'Today, 12:45 PM' },
        { contactId: '12', status: 'delivered', time: 'Today, 12:42 PM' },
        { contactId: '13', status: 'sent', time: 'Today, 12:40 PM' }
      ]
    }
  ],
  'b5': [
    {
      id: 'mb5_1',
      text: 'Tamilnadu Festival Special! 🌾 Pongal stock booking starting now! Pure silk & cotton sarees bundles order karne par flat 12% wholesale discount. 🚚 Direct safe shipping to Chennai/Madurai.',
      sender: 'me',
      timestamp: 'Today, 02:00 PM',
      status: 'read',
      recipients: [
        { contactId: '7', status: 'read', time: 'Today, 02:10 PM' },
        { contactId: '15', status: 'read', time: 'Today, 02:15 PM' }
      ]
    }
  ],
  'b6': [
    {
      id: 'mb6_1',
      text: 'Chhath & Diwali Premium Collection Launch! 🪔 Bihar retail bulk buyers ke liye special scheme: Order above ₹50,000 and get free logistics to Patna/Muzaffarpur! 📦 Catalogue check kijiye aur order lock karein.',
      sender: 'me',
      timestamp: 'Yesterday, 05:55 PM',
      status: 'delivered',
      recipients: [
        { contactId: '8', status: 'read', time: 'Yesterday, 06:10 PM' },
        { contactId: '16', status: 'delivered', time: 'Yesterday, 06:05 PM' },
        { contactId: '17', status: 'sent', time: 'Yesterday, 06:00 PM' }
      ]
    }
  ]
};

const SCHEMA_VERSION = 'v8';
if (localStorage.getItem('wa_schema_version') !== SCHEMA_VERSION) {
  localStorage.clear();
  localStorage.setItem('wa_schema_version', SCHEMA_VERSION);
}

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'broadcasts'
  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('wa_contacts');
    return saved ? JSON.parse(saved) : initialContacts;
  });
  
  const [broadcasts, setBroadcasts] = useState(() => {
    const saved = localStorage.getItem('wa_broadcasts');
    return saved ? JSON.parse(saved) : initialBroadcasts;
  });

  const [chatMessages, setChatMessages] = useState(() => {
    const saved = localStorage.getItem('wa_chat_messages');
    return saved ? JSON.parse(saved) : initialChatMessages;
  });

  const [broadcastMessages, setBroadcastMessages] = useState(() => {
    const saved = localStorage.getItem('wa_broadcast_messages');
    return saved ? JSON.parse(saved) : initialBroadcastMessages;
  });

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('wa_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('wa_broadcasts', JSON.stringify(broadcasts));
  }, [broadcasts]);

  useEffect(() => {
    localStorage.setItem('wa_chat_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('wa_broadcast_messages', JSON.stringify(broadcastMessages));
  }, [broadcastMessages]);

  const sendChatMessage = (contactId, text) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage = {
      id: `m_${Date.now()}`,
      text,
      sender: 'me',
      timestamp: timeStr,
      status: 'sent'
    };

    setChatMessages(prev => {
      const history = prev[contactId] || [];
      return {
        ...prev,
        [contactId]: [...history, newMessage]
      };
    });

    // Simulate delivery receipts
    setTimeout(() => {
      setChatMessages(prev => {
        const history = prev[contactId] || [];
        return {
          ...prev,
          [contactId]: history.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m)
        };
      });
    }, 1500);

    setTimeout(() => {
      setChatMessages(prev => {
        const history = prev[contactId] || [];
        return {
          ...prev,
          [contactId]: history.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m)
        };
      });
    }, 3000);
  };

  const sendBroadcastMessage = (broadcastId, text) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const group = broadcasts.find(b => b.id === broadcastId);
    if (!group) return;

    const initialRecipients = group.memberIds.map(memberId => ({
      contactId: memberId,
      status: 'sent',
      time: timeStr
    }));

    const newBMessage = {
      id: `bm_${Date.now()}`,
      text,
      sender: 'me',
      timestamp: timeStr,
      status: 'sent',
      recipients: initialRecipients
    };

    // Update Broadcast Thread
    setBroadcastMessages(prev => {
      const history = prev[broadcastId] || [];
      return {
        ...prev,
        [broadcastId]: [...history, newBMessage]
      };
    });

    // Mirror message in individual chats of all group members and run staggered status updates
    group.memberIds.forEach((memberId, index) => {
      const individualMessage = {
        id: `m_bcast_${newBMessage.id}_${memberId}`,
        text: `[Broadcast] ${text}`,
        sender: 'me',
        timestamp: timeStr,
        status: 'sent'
      };

      setChatMessages(prev => {
        const history = prev[memberId] || [];
        return {
          ...prev,
          [memberId]: [...history, individualMessage]
        };
      });

      // Staggered Delivery Simulation
      const deliveryDelay = 800 + (index * 400); // 800ms, 1200ms, 1600ms...
      const readDelay = deliveryDelay + 1000 + (index * 600); // 1800ms, 2800ms, 3800ms...

      setTimeout(() => {
        const delTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Update recipient status to 'delivered'
        setBroadcastMessages(prev => {
          const list = prev[broadcastId] || [];
          return {
            ...prev,
            [broadcastId]: list.map(msg => {
              if (msg.id === newBMessage.id) {
                const updated = msg.recipients.map(r => 
                  r.contactId === memberId ? { ...r, status: 'delivered', time: delTime } : r
                );
                const allDelivered = updated.every(r => r.status === 'delivered' || r.status === 'read');
                return { 
                  ...msg, 
                  status: allDelivered ? 'delivered' : msg.status, 
                  recipients: updated 
                };
              }
              return msg;
            })
          };
        });

        // Update mirrored individual message status to 'delivered'
        setChatMessages(prev => {
          const history = prev[memberId] || [];
          return {
            ...prev,
            [memberId]: history.map(m => m.id === individualMessage.id ? { ...m, status: 'delivered' } : m)
          };
        });
      }, deliveryDelay);

      // Staggered Read Simulation
      setTimeout(() => {
        const readTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Update recipient status to 'read'
        setBroadcastMessages(prev => {
          const list = prev[broadcastId] || [];
          return {
            ...prev,
            [broadcastId]: list.map(msg => {
              if (msg.id === newBMessage.id) {
                const updated = msg.recipients.map(r => 
                  r.contactId === memberId ? { ...r, status: 'read', time: readTime } : r
                );
                const allRead = updated.every(r => r.status === 'read');
                return { 
                  ...msg, 
                  status: allRead ? 'read' : 'delivered', 
                  recipients: updated 
                };
              }
              return msg;
            })
          };
        });

        // Update mirrored individual message status to 'read'
        setChatMessages(prev => {
          const history = prev[memberId] || [];
          return {
            ...prev,
            [memberId]: history.map(m => m.id === individualMessage.id ? { ...m, status: 'read' } : m)
          };
        });
      }, readDelay);
    });
  };

  const createBroadcastGroup = (name, memberIds) => {
    const newGroup = {
      id: `b_${Date.now()}`,
      name,
      memberIds,
      unreadCount: 0
    };
    setBroadcasts(prev => [...prev, newGroup]);
    return newGroup.id;
  };

  const updateBroadcastGroup = (id, name, memberIds) => {
    setBroadcasts(prev => prev.map(b => b.id === id ? { ...b, name, memberIds } : b));
  };

  const deleteBroadcastGroup = (id) => {
    setBroadcasts(prev => prev.filter(b => b.id !== id));
    if (selectedBroadcastId === id) {
      setSelectedBroadcastId(null);
    }
  };

  const markChatAsRead = (contactId) => {
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, unreadCount: 0 } : c));
  };

  return (
    <AppContext.Provider
      value={{
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
        sendChatMessage,
        sendBroadcastMessage,
        createBroadcastGroup,
        updateBroadcastGroup,
        deleteBroadcastGroup,
        markChatAsRead
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
