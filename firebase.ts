import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { UserPlus, Search, MessageCircle, Loader2, CheckCircle2, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactsModal({ isOpen, onClose }: Props) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', info: '', category: 'Friends' });
  const [categories, setCategories] = useState(['Friends', 'Classmates', 'Others']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser || !isOpen) return;

    const q = query(collection(db, 'users', auth.currentUser.uid, 'contacts'));
    const unsub = onSnapshot(q, (snap) => {
      setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub;
  }, [isOpen]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newContact.info.trim()) return;

    setAddLoading(true);
    setAddError('');

    try {
      const info = newContact.info.trim().toLowerCase();
      let matchedUser: any = null;
      
      const emailQ = query(collection(db, 'users'), where('email', '==', info));
      const emailSnap = await getDocs(emailQ);
      
      if (!emailSnap.empty) {
        matchedUser = { id: emailSnap.docs[0].id, ...emailSnap.docs[0].data() };
      } else {
        const phoneQ = query(collection(db, 'users'), where('phone', '==', info));
        const phoneSnap = await getDocs(phoneQ);
        if (!phoneSnap.empty) {
          matchedUser = { id: phoneSnap.docs[0].id, ...phoneSnap.docs[0].data() };
        }
      }

      await addDoc(collection(db, 'users', auth.currentUser.uid, 'contacts'), {
        name: newContact.name || (matchedUser ? matchedUser.fullName : info),
        info: info,
        uid: matchedUser ? matchedUser.id : null,
        isRegistered: !!matchedUser,
        category: newContact.category,
        addedAt: new Date().toISOString()
      });

      setIsAddOpen(false);
      setNewContact({ name: '', info: '', category: 'Friends' });
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const startChat = async (contact: any) => {
    if (!auth.currentUser || !contact.uid) return;
    
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid),
      where('type', '==', 'private')
    );
    const snap = await getDocs(q);
    const existing = snap.docs.find(d => d.data().participants.includes(contact.uid));

    if (existing) {
      onClose();
      navigate(`/chats/${existing.id}`);
    } else {
      const newChat = await addDoc(collection(db, 'chats'), {
        participants: [auth.currentUser.uid, contact.uid],
        type: 'private',
        createdAt: new Date().toISOString(),
        lastMessage: 'Started a new conversation',
        lastMessageAt: new Date().toISOString(),
        createdById: auth.currentUser.uid
      });
      onClose();
      navigate(`/chats/${newChat.id}`);
    }
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.info.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-black md:max-w-md md:mx-auto md:shadow-2xl md:ring-1 md:ring-neutral-800">
          {/* Header */}
          <div className="p-4 flex items-center gap-4 border-b dark:border-neutral-900 border-neutral-100 bg-white dark:bg-black sticky top-0 z-10">
            <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full">
              <X size={24} />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-black tracking-tight uppercase italic">Select Contact</h2>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{contacts.length} contacts</p>
            </div>
            <button 
              onClick={() => setIsAddOpen(true)}
              className="p-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-xl hover:scale-105 transition-transform"
            >
              <UserPlus size={18} />
            </button>
          </div>

          {/* Categories bar */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-b dark:border-neutral-900 border-neutral-100">
            {['All', ...categories].map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                  activeCategory === cat 
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black' 
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              <input 
                placeholder="Search contacts..." 
                className="w-full h-11 pl-10 pr-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl outline-none focus:ring-1 focus:ring-neutral-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-12">
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin text-neutral-500" /></div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center p-12 text-neutral-500 font-medium">
                {searchTerm ? 'No matches found' : "Your contact list is empty. Add someone to start chatting!"}
              </div>
            ) : (
              filteredContacts.map(contact => (
                <motion.div 
                  key={contact.id}
                  layoutId={contact.id}
                  onClick={() => contact.isRegistered && startChat(contact)}
                  className={`p-3 rounded-2xl flex items-center justify-between transition-colors cursor-pointer group ${
                    contact.isRegistered ? 'hover:bg-neutral-50 dark:hover:bg-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/50 border dark:border-neutral-800 border-neutral-100' : 'opacity-60 bg-neutral-100/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-2 ${contact.isRegistered ? 'border-green-500 text-green-500' : 'border-neutral-500 text-neutral-500'}`}>
                      {contact.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-black dark:text-white">
                        <h3 className="font-bold text-sm">{contact.name}</h3>
                        <span className="px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[8px] font-bold text-neutral-400 uppercase">{contact.category || 'Others'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[10px] text-neutral-500 font-medium">{contact.info}</p>
                        <span className="text-[8px] font-bold uppercase tracking-wider">
                          {contact.isRegistered ? (
                            <span className="text-green-500">On CRE Connect ✅</span>
                          ) : (
                            <span className="text-neutral-500">Not on CRE Connect ❌</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {contact.isRegistered ? (
                    <MessageCircle size={16} className="text-neutral-500 group-hover:scale-110 transition-transform" />
                  ) : (
                    <button className="text-[8px] font-black uppercase tracking-widest bg-neutral-200 dark:bg-neutral-800 px-3 py-1 rounded-full text-neutral-500">Invite</button>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Add Sub-modal */}
          <AnimatePresence>
            {isAddOpen && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAddOpen(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
                />
                <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  className="relative w-full max-w-sm bg-white dark:bg-neutral-900 p-6 rounded-[28px] shadow-2xl border dark:border-neutral-800"
                >
                  <h2 className="text-xl font-black uppercase italic mb-4">Add Contact</h2>
                  <form onSubmit={handleAddContact} className="space-y-4">
                    <input 
                      placeholder="Name"
                      className="w-full h-12 px-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl outline-none"
                      value={newContact.name}
                      onChange={e => setNewContact({...newContact, name: e.target.value})}
                    />
                    <input 
                      required
                      placeholder="Email or Phone"
                      className="w-full h-12 px-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl outline-none"
                      value={newContact.info}
                      onChange={e => setNewContact({...newContact, info: e.target.value})}
                    />
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-neutral-500">Category</label>
                       <div className="flex flex-wrap gap-2">
                         {categories.map(cat => (
                           <button 
                            key={cat}
                            type="button"
                            onClick={() => setNewContact({...newContact, category: cat})}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              newContact.category === cat 
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black' 
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                            }`}
                           >
                             {cat}
                           </button>
                         ))}
                       </div>
                    </div>

                    {addError && <p className="text-red-500 text-[10px] font-bold">{addError}</p>}
                    <button 
                      disabled={addLoading}
                      className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-black font-black rounded-xl disabled:opacity-50"
                    >
                      {addLoading ? <Loader2 className="animate-spin" /> : 'Save Contact'}
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
