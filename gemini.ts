import { Phone, Video, Info, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { format } from 'date-fns';

export default function CallLogsPage() {
  const mockCalls = [
    { id: 1, name: 'Dr. Smith', type: 'audio', status: 'missed', time: new Date(Date.now() - 3600000) },
    { id: 2, name: 'Eng. Sarah', type: 'video', status: 'incoming', time: new Date(Date.now() - 86400000) },
    { id: 3, name: 'Project Group', type: 'audio', status: 'outgoing', time: new Date(Date.now() - 172800000) }
  ];

  return (
    <div className="flex-1 bg-white dark:bg-black p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">Call Logs</h2>
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Secure Voice & Video</p>
      </div>

      <div className="space-y-1">
        {mockCalls.map(call => (
          <div key={call.id} className="flex items-center gap-4 py-4 border-b dark:border-neutral-900 border-neutral-100 group">
            <div className={`p-3 rounded-2xl ${
              call.status === 'missed' ? 'bg-red-500/10 text-red-500' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
            }`}>
              {call.status === 'incoming' && <PhoneIncoming size={20} />}
              {call.status === 'outgoing' && <PhoneOutgoing size={20} />}
              {call.status === 'missed' && <PhoneMissed size={20} />}
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{call.name}</h3>
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {call.type === 'video' ? <Video size={10}/> : <Phone size={10}/>}
                <span>{call.type} call</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-neutral-400 uppercase">{format(call.time, 'MMM dd, HH:mm')}</p>
              <button className="p-2 text-neutral-500 hover:text-white transition-all"><Info size={18}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
