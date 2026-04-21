import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Hash, Phone, Building, Briefcase, ChevronRight } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const [formData, setFormData] = useState({
    fullName: '',
    regNo: '',
    phone: '',
    department: '',
    email: '',
    password: '',
    specialization: '',
    otp: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    
    // Validate Reg No format YYYY/XXXXXX
    if (!isLogin && !/^\d{4}\/[A-Z0-9]{6}$/.test(formData.regNo)) {
      setError('Registration Number must be in format YYYY/XXXXXX (e.g. 2023/ABC123)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      if (data.debug_otp) {
        setSuccess(`[DEV] Code: ${data.debug_otp}`);
      } else {
        setSuccess('OTP sent successfully to your inbox!');
      }
      
      setResendCooldown(30);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email = formData.email.toLowerCase().trim();

    try {
      // 1. Verify OTP
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, code: formData.otp })
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error(verifyData.error || 'OTP verification failed');

      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, formData.password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, formData.password);
        await updateProfile(userCred.user, { displayName: formData.fullName });
        
        // Store extra user info
        await setDoc(doc(db, 'users', userCred.user.uid), {
          fullName: formData.fullName,
          registrationNumber: formData.regNo,
          phone: formData.phone,
          department: formData.department,
          email: email,
          specialization: formData.specialization,
          theme: 'dark',
          stats: {
            messagesSent: 0,
            lessonsCompleted: 0,
            loginFrequency: 1
          },
          createdAt: new Date().toISOString()
        });
      }
      navigate('/chats');
    } catch (err: any) {
      console.error('Auth Error:', err);
      let message = err.message;
      
      // Handle specific Firebase Auth errors
      if (err.code === 'auth/operation-not-allowed') {
        message = 'Email/Password Authentication is not enabled in the Firebase Console. Go to Authentication > Sign-in method to enable it.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'The email or password you entered is incorrect. If you haven\'t created an account yet, please click "Register" below.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 dark:bg-black bg-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">CRE Connect</h1>
          <p className="text-neutral-500 font-medium">Join the next-gen tech community</p>
        </div>

        <div className="dark:bg-neutral-900 bg-neutral-50 p-8 rounded-3xl border dark:border-neutral-800 border-neutral-200">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOTP} 
                className="space-y-4"
              >
                {!isLogin && (
                  <>
                    <Input icon={<User size={18}/>} placeholder="Full Name" value={formData.fullName} onChange={v => setFormData({...formData, fullName: v})} required />
                    <Input icon={<Hash size={18}/>} placeholder="Reg No (YYYY/XXXXXX)" value={formData.regNo} onChange={v => setFormData({...formData, regNo: v})} required />
                    <Input icon={<Phone size={18}/>} placeholder="Phone Number" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} required />
                    <Input icon={<Building size={18}/>} placeholder="Department" value={formData.department} onChange={v => setFormData({...formData, department: v})} required />
                    <Input icon={<Briefcase size={18}/>} placeholder="Specialization" value={formData.specialization} onChange={v => setFormData({...formData, specialization: v})} required />
                  </>
                )}
                <Input icon={<Mail size={18}/>} placeholder="Email" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} required />
                <Input icon={<Lock size={18}/>} placeholder="Password" type="password" value={formData.password} onChange={v => setFormData({...formData, password: v})} required />
                
                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                
                <button 
                  disabled={loading}
                  className="w-full py-4 bg-white dark:bg-neutral-100 text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (isLogin ? 'Login' : 'Next')}
                  <ChevronRight size={20} />
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleFinalSubmit}
                className="space-y-4 text-center"
              >
                <div className="space-y-2 mb-6">
                  <h3 className="text-xl font-bold">Verify your Email</h3>
                  <p className="text-sm text-neutral-500">We've sent a 6-digit code to {formData.email}</p>
                </div>
                
                <Input 
                  icon={<Lock size={18}/>} 
                  placeholder="6-digit OTP" 
                  value={formData.otp} 
                  onChange={v => setFormData({...formData, otp: v})} 
                  required 
                />
                
                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                {success && <p className="text-green-500 text-sm font-medium">{success}</p>}
                
                <button 
                  disabled={loading}
                  className="w-full py-4 bg-neutral-900 border border-neutral-700 dark:bg-white text-white dark:text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Complete Verification'}
                </button>

                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    type="button"
                    disabled={loading || resendCooldown > 0}
                    onClick={() => handleSendOTP()}
                    className="text-sm font-bold text-neutral-400 hover:text-white transition-colors disabled:opacity-30"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Didn\'t get a code? Resend'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="text-sm text-neutral-500 hover:text-white transition-colors"
                  >
                    Edit details
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={() => { setIsLogin(!isLogin); setStep(1); setError(''); }}
          className="w-full text-neutral-500 font-bold hover:text-black dark:hover:text-white transition-colors"
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </button>
      </motion.div>
    </div>
  );
}

function Input({ icon, placeholder, type = 'text', value, onChange, required }: any) {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors">
        {icon}
      </div>
      <input 
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-14 pl-12 pr-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl border border-transparent focus:border-neutral-500 focus:bg-neutral-200 dark:focus:bg-neutral-700 outline-none transition-all font-medium"
      />
    </div>
  );
}
