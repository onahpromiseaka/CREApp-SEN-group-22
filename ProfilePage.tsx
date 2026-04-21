import { useState, useEffect, useRef } from 'react';
import { getCREAI } from '../services/gemini';
import { MessageSquare, Send, Bot, User, Cpu, Terminal, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export default function CREAIPage() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'model', parts: [{ text: "Hello! I'm CREAI, your tech assistant. How can I help you excel in your studies and projects today?" }] }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', parts: [{ text: userMsg }] }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // Check if it's a tech query (naive check for now, Gemini handles it better with prompts)
      const isTech = /code|program|software|hardware|network|database|debug|algorithm|math|engineering/i.test(userMsg);
      
      const response = await getCREAI(userMsg, newMessages, isTech);
      setMessages([...newMessages, { role: 'model', parts: [{ text: response }] }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'model', parts: [{ text: "I'm having trouble connecting to the neural network. Please try again later." }] }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black font-sans">
      <div className="p-4 border-b dark:border-neutral-900 border-neutral-100 flex items-center gap-3">
        <div className="p-2 bg-neutral-900 dark:bg-white rounded-xl">
          <Cpu size={24} className="text-white dark:text-black" />
        </div>
        <div>
          <h2 className="text-lg font-black uppercase italic tracking-tighter">CREAI Assistant</h2>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Powered by Gemini 3.0</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === 'model' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black' : 'bg-neutral-100 dark:bg-neutral-800'
              }`}>
                {msg.role === 'model' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${
                msg.role === 'model' ? 'bg-neutral-50 dark:bg-neutral-900 border dark:border-neutral-800' : 'bg-neutral-100 dark:bg-neutral-800'
              }`}>
                <div className="prose dark:prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black flex items-center justify-center animate-pulse">
              <Bot size={18} />
            </div>
            <div className="flex items-center gap-1.5 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border dark:border-neutral-800">
              <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t dark:border-neutral-900 border-neutral-100">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <input 
              placeholder="Ask anything about tech..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full h-14 pl-5 pr-14 bg-neutral-100 dark:bg-neutral-900 rounded-2xl outline-none focus:ring-1 focus:ring-neutral-500 transition-all font-medium"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-2 p-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
        <div className="mt-3 flex justify-center gap-4">
          <QuickAction icon={<Terminal size={12}/>} text="Debug Code" onClick={() => setInput('Can you help me debug this function: ')} />
          <QuickAction icon={<Sparkles size={12}/>} text="Explain React" onClick={() => setInput('Explain how React useEffect works in detail.')} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, text, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 border dark:border-neutral-800 border-neutral-200 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors"
    >
      {icon}
      {text}
    </button>
  );
}
