'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ArrowLeft, Check, ShieldCheck, Eye, EyeOff, Lock, Mail, User, KeySquare, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { recordPageHit } from '@/lib/firebaseSync';
import { useLanguage } from '@/hooks/useLanguage';

interface VerificationSession {
  name: string;
  email: string;
  passwordHash: string;
  code: string;
}

// Modern secure SHA-256 client-side password hashing helper with custom salt
async function hashPassword(password: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return password; // Fallback for Server-Side Rendering if called during hydration
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "fanratechsafety_2026_salt");
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function GabungPage() {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup');

  
  // Registration States
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  
  // Login States
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [showSigninPassword, setShowSigninPassword] = useState(false);

  // Verification flow state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [verificationSession, setVerificationSession] = useState<VerificationSession | null>(null);
  const [verificationResendTimer, setVerificationResendTimer] = useState(0);

  // Forgot/Reset Password States
  const [isResetFlow, setIsResetFlow] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'otp'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOTPCode, setResetOTPCode] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Censor/Mask email for secure display (e.g., ir***i@gmail.com)
  const censorEmail = (emailStr: string): string => {
    if (!emailStr) return '';
    const [local, domain] = emailStr.split('@');
    if (!domain) return emailStr;
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
  };

  // Error/Success Notification
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password Requirements Checker
  const hasMinLength = signupPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(signupPassword);
  const hasNumber = /[0-9]/.test(signupPassword);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(signupPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecialChar;

  // New Password Requirements Checker for Reset flow
  const isNewPasswordValid = newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);

  // Sanitasi dari input malicious
  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>'"&/;`]/g, '').trim();
  };

  const handleEmailFormatting = (emailStr: string): string => {
    return emailStr.replace(/\s+/g, '').toLowerCase();
  };

  // Resend Timer Countdown
  useEffect(() => {
    if (verificationResendTimer <= 0) return;
    const timer = setTimeout(() => {
      setVerificationResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [verificationResendTimer]);

  // Check if already signed in
  useEffect(() => {
    window.dispatchEvent(new Event('fanratech_start_loading'));
    recordPageHit();
    const session = localStorage.getItem('fanratech_session');
    if (session) {
      router.push('/');
    } else {
      setTimeout(() => {
        window.dispatchEvent(new Event('fanratech_stop_loading'));
      }, 80);
    }
  }, [router]);

  useEffect(() => {
    if (isLoading) {
      window.dispatchEvent(new Event('fanratech_start_loading'));
    } else {
      window.dispatchEvent(new Event('fanratech_stop_loading'));
    }
  }, [isLoading]);

  // Sign In implementation
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = handleEmailFormatting(signinEmail);
    const cleanPassword = signinPassword; // Keep raw for comparison

    if (!cleanEmail || !cleanPassword) {
      setAuthError(t('Harap lengkapi semua kolom.', 'Please fill out all fields.'));
      return;
    }

    setIsLoading(true);

    try {
      const userDocRef = doc(db, 'fanratech_users', cleanEmail);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setAuthError(t('Alamat email belum terdaftar di situs kami.', 'Email address is not registered on our site.'));
        setIsLoading(false);
        return;
      }

      const foundUser = userDocSnap.data();
      const hashedPassword = await hashPassword(cleanPassword);

      // Check match support both hashed passwords and legacy plain-text fallback (for seamless existing data compatibility)
      const isMatched = foundUser.password === hashedPassword || foundUser.password === cleanPassword;

      if (!isMatched) {
        setAuthError(t('Kombinasi kata sandi tidak cocok. Silakan coba lagi.', 'Password combination does not match. Please try again.'));
        setIsLoading(false);
        return;
      }

      // Proactively upgrade plain-text legacy passwords dynamically to modern hashed standard on first login!
      if (foundUser.password === cleanPassword && foundUser.password !== hashedPassword) {
        try {
          await setDoc(userDocRef, { password: hashedPassword }, { merge: true });
          console.log("Dynamically upgraded account authentication to SHA-256 hashed standard for email:", cleanEmail);
        } catch (upgradeErr) {
          console.warn("Non-blocking legacy password upgrade notification:", upgradeErr);
        }
      }

      // Successfully logged in
      localStorage.setItem('fanratech_session', JSON.stringify({
        name: foundUser.name,
        email: foundUser.email,
        createdAt: foundUser.created_at || foundUser.createdAt || new Date().toISOString()
      }));

      setAuthSuccess(t(`Selamat datang kembali, ${foundUser.name}!`, `Welcome back, ${foundUser.name}!`));
      setIsLoading(false);

      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setAuthError(t('Gagal melakukan autentikasi sistem.', 'Failed to perform system authentication.'));
      setIsLoading(false);
    }
  };

  // Google Sign In & Sign Up implementation
  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthSuccess('');
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const name = user.displayName || user.email?.split('@')[0] || 'Pengguna Google';
      const email = user.email || '';

      // Check if user already exists in fanratech_users collection
      const userDocRef = doc(db, 'fanratech_users', email);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Save Google User profile to fanratech_users collection
        await setDoc(userDocRef, {
          name,
          email,
          password: 'OAUTH_GOOGLE_USER',
          created_at: new Date().toISOString()
        });
      }

      // Save session in localStorage format exactly as expected by the page and rest of app
      localStorage.setItem('fanratech_session', JSON.stringify({
        name,
        email,
        createdAt: user.metadata.creationTime || new Date().toISOString()
      }));

      setAuthSuccess(t('Berhasil terhubung secara instan dengan Akun Google!', 'Successfully connected instantly with Google Account!'));
      setIsLoading(false);

      // Perbarui state session lokal dan muat halaman utama
      setTimeout(() => {
        router.push('/');
      }, 1005);
    } catch (err: any) {
      console.error("Firebase Google Auth error:", err);
      setAuthError(t(`Kesalahan integrasi Google: ${err.message || 'Harap periksa konfigurasi provider database.'}`, `Google integration error: ${err.message || 'Please check the database provider configuration.'}`));
      setIsLoading(false);
    }
  };

  // Sign up initiation with email verification dispatch
  const handleSignUpInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanName = sanitizeInput(signupName);
    const cleanEmail = handleEmailFormatting(signupEmail);
    const cleanPassword = signupPassword;

    // Strict Validations
    if (!cleanName || !cleanEmail || !cleanPassword) {
      setAuthError(t('Harap lengkapi semua kolom pendaftaran.', 'Please fill out all registration fields.'));
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 40) {
      setAuthError(t('Nama lengkap harus berkisar antara 2 sampai 40 karakter.', 'Full name must be between 2 and 40 characters.'));
      return;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(cleanEmail)) {
      setAuthError(t('Format alamat email tidak sah atau memiliki simbol tidak diizinkan.', 'Invalid email format or contains restricted symbols.'));
      return;
    }

    if (!isPasswordValid) {
      setAuthError(t('Lengkapi semua ketentuan kata sandi sebelum melanjutkan.', 'Fulfill all password requirements before proceeding.'));
      return;
    }

    setIsLoading(true);

    try {
      // Check if duplicate email in Firestore
      const userDocRef = doc(db, 'fanratech_users', cleanEmail);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        setAuthError(t('Email ini telah terdaftar. Gunakan email lain atau silakan Masuk.', 'This email is already registered. Please use another email or Log In.'));
        setIsLoading(false);
        return;
      }

      // Generate real secure 6-digit pin code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Send real email via Internal API Route which uses standard SMTP (sending Direct to User)
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          name: cleanName,
          code: generatedCode
        }),
      });

      // Hash password securely before setting the verification session
      const hashedPassword = await hashPassword(cleanPassword);

      // Save credentials in memory verification state
      setVerificationSession({
        name: cleanName,
        email: cleanEmail,
        passwordHash: hashedPassword, // Storing password securely
        code: generatedCode
      });

      setIsVerifying(true);
      setVerificationResendTimer(180);
      setAuthSuccess(''); // Empty as requested to remove successful text block on verification landing
      setIsLoading(false);

    } catch (err: any) {
      console.error("Verification dispatch error:", err);
      setAuthError(t('Gagal mengirimkan kode verifikasi OTP.', 'Failed to send OTP verification code.'));
      setIsLoading(false);
    }
  };

  // Complete signup by checking the code
  const handleVerifyCode = async (e: React.FormEvent, codeOverride?: string) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const inputCode = codeOverride ? codeOverride.trim() : verificationCodeInput.trim();

    if (!verificationSession) {
      setAuthError(t('Gagal memverifikasi pendaftaran. Sesi kedaluwarsa.', 'Failed to verify registration. Session expired.'));
      return;
    }

    if (inputCode !== verificationSession.code) {
      setAuthError(t('Kode OTP tidak cocok dengan yang kami kirimkan.', 'OTP code does not match the one we sent.'));
      return;
    }

    setIsLoading(true);

    try {
      const userDocRef = doc(db, 'fanratech_users', verificationSession.email);
      const payload = {
        name: verificationSession.name,
        email: verificationSession.email,
        password: verificationSession.passwordHash,
        created_at: new Date().toISOString()
      };
      
      await setDoc(userDocRef, payload);

      localStorage.setItem('fanratech_session', JSON.stringify({
        name: payload.name,
        email: payload.email,
        createdAt: payload.created_at
      }));

      setAuthSuccess(t('Registrasi Berhasil! Akun Anda aktif sepenuhnya di cloud database.', 'Registration Successful! Your account is fully active in the cloud database.'));
      setIsLoading(false);

      // Reset
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setVerificationCodeInput('');
      setVerificationSession(null);
      setIsVerifying(false);

      // Redirect
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setAuthError(t('Gagal mendaftarkan akun baru ke cloud database.', 'Failed to register the new account in the cloud database.'));
      setIsLoading(false);
    }
  };


  const handleOtpBoxChange = (index: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const chars = verificationCodeInput.split('');
    while (chars.length < 6) {
      chars.push('');
    }
    chars[index] = digit;
    const joined = chars.join('').slice(0, 6);
    setVerificationCodeInput(joined);

    // Focus next element if digit typed
    if (digit && index < 5) {
      const nextEl = document.getElementById(`otp-box-${index + 1}`);
      if (nextEl) (nextEl as HTMLInputElement).focus();
    }

    // Auto verify without useEffect to avoid React Hooks setState cascading warnings
    if (joined.length === 6 && !joined.includes('')) {
      setIsLoading(true);
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleVerifyCode(fakeEvent, joined);
      }, 50);
    }
  };

  const handleOtpBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const chars = verificationCodeInput.split('');
      while (chars.length < 6) {
        chars.push('');
      }
      if (!chars[index] && index > 0) {
        chars[index - 1] = '';
        setVerificationCodeInput(chars.join('').slice(0, 6));
        const prevEl = document.getElementById(`otp-box-${index - 1}`);
        if (prevEl) {
          (prevEl as HTMLInputElement).focus();
          // Ensure cursor goes to end or selects value
          setTimeout(() => {
            (prevEl as HTMLInputElement).select();
          }, 0);
        }
      } else {
        chars[index] = '';
        setVerificationCodeInput(chars.join('').slice(0, 6));
      }
    }
  };

  const handleOtpBoxPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    setVerificationCodeInput(pasted);
    const targetIndex = Math.min(pasted.length, 5);
    const targetEl = document.getElementById(`otp-box-${targetIndex}`);
    if (targetEl) {
      (targetEl as HTMLInputElement).focus();
    }

    if (pasted.length === 6) {
      setIsLoading(true);
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleVerifyCode(fakeEvent, pasted);
      }, 50);
    }
  };

  // Start Password Reset Flow (User clicked Forgot Password)
  const handleStartResetFlow = () => {
    setAuthError('');
    setAuthSuccess('');
    setIsResetFlow(true);
    setResetStep('email');
    setResetEmail('');
    setResetCodeInput('');
    setNewPassword('');
  };

  // Step 1: Handle Reset Email verification and OTP dispatch
  const handleSendResetOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    
    const emailToIdentify = handleEmailFormatting(resetEmail);
    if (!emailToIdentify) {
      setAuthError(t('Silakan masukkan Alamat Email Anda terlebih dahulu untuk memulihkan kata sandi.', 'Please enter your Email Address first to recover your password.'));
      return;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(emailToIdentify)) {
      setAuthError(t('Format alamat email pemulihan tidak sah atau memiliki simbol tidak diizinkan.', 'Invalid recovery email format or contains restricted symbols.'));
      return;
    }

    setIsLoading(true);

    try {
      const userDocRef = doc(db, 'fanratech_users', emailToIdentify);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setAuthError(t('Alamat email tersebut belum terdaftar di database kami.', 'That email address is not registered in our database.'));
        setIsLoading(false);
        return;
      }

      const foundUser = userDocSnap.data();

      // Generate 6-digit OTP
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      setResetOTPCode(generatedCode);
      setResetEmail(emailToIdentify);

      // Send via Internal API endpoint (Direct to User)
      await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: emailToIdentify,
          code: generatedCode,
          type: 'reset',
        })
      });

      setAuthSuccess(t('Kode verifikasi pemulihan sukses dikirimkan!', 'Recovery verification code sent successfully!'));
      setResetStep('otp');
      setIsLoading(false);

    } catch (err: any) {
      console.error(err);
      setAuthError(t('Gagal mengirimkan kode pemulihan verifikasi.', 'Failed to send verification recovery code.'));
      setIsLoading(false);
    }
  };

  // Perform password update after verification matching
  const handleResetPasswordSubmit = async (e: React.FormEvent, codeOverride?: string) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const inputCode = codeOverride ? codeOverride.trim() : resetCodeInput.trim();

    if (!inputCode) {
      setAuthError(t('Silakan masukkan 6-digit kode OTP.', 'Please enter the 6-digit OTP code.'));
      return;
    }

    if (inputCode !== resetOTPCode) {
      setAuthError(t('Kode OTP tidak cocok dengan kode pemulihan yang dikirimkan.', 'OTP code does not match the sent recovery code.'));
      return;
    }

    if (newPassword.length < 8) {
      setAuthError(t('Kata sandi baru minimal harus terdiri dari 8 karakter demi keamanan Anda.', 'New password must be at least 8 characters long for your security.'));
      return;
    }

    // Must match complexity check
    const hasMin = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNum = /[0-9]/.test(newPassword);
    const hasSpec = /[^A-Za-z0-9]/.test(newPassword);
    if (!(hasMin && hasUpper && hasNum && hasSpec)) {
      setAuthError(t('Sandi baru harus mengandung: min. 8 karakter, huruf BESAR, angka, dan simbol unik.', 'New password must contain: min 8 characters, UPPERCASE letter, number, and unique symbol.'));
      return;
    }

    setIsLoading(true);

    try {
      const userDocRef = doc(db, 'fanratech_users', resetEmail);
      const hashedNewPassword = await hashPassword(newPassword);
      await setDoc(userDocRef, { password: hashedNewPassword }, { merge: true });

      setAuthSuccess(t('Kata sandi sukses diperbarui di cloud database! Silakan masuk kembali dengan kata sandi baru.', 'Password successfully updated in cloud database! Please log in again with new password.'));
      setIsLoading(false);
      
      // Reset state and redirect back to signin screen
      setTimeout(() => {
        setIsResetFlow(false);
        setResetStep('email');
        setActiveTab('signin');
        setNewPassword('');
        setResetCodeInput('');
        setResetOTPCode('');
        setAuthSuccess('');
      }, 2200);

    } catch (err: any) {
      console.error(err);
      setAuthError(t('Terjadi kesalahan keamanan saat menyetel ulang sandi.', 'A security error occurred while resetting password.'));
      setIsLoading(false);
    }
  };

  const handleResetOtpBoxChange = (index: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const chars = resetCodeInput.split('');
    while (chars.length < 6) {
      chars.push('');
    }
    chars[index] = digit;
    const joined = chars.join('').slice(0, 6);
    setResetCodeInput(joined);

    // Focus next element
    if (digit && index < 5) {
      const nextEl = document.getElementById(`reset-otp-box-${index + 1}`);
      if (nextEl) (nextEl as HTMLInputElement).focus();
    }

    // Auto verify password reset when completely filled
    if (joined.length === 6 && !joined.includes('')) {
      setIsLoading(true);
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleResetPasswordSubmit(fakeEvent, joined);
      }, 50);
    }
  };

  const handleResetOtpBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const chars = resetCodeInput.split('');
      while (chars.length < 6) {
        chars.push('');
      }
      if (!chars[index] && index > 0) {
        chars[index - 1] = '';
        setResetCodeInput(chars.join('').slice(0, 6));
        const prevEl = document.getElementById(`reset-otp-box-${index - 1}`);
        if (prevEl) {
          (prevEl as HTMLInputElement).focus();
          setTimeout(() => {
            (prevEl as HTMLInputElement).select();
          }, 0);
        }
      } else {
        chars[index] = '';
        setResetCodeInput(chars.join('').slice(0, 6));
      }
    }
  };

  const handleResetOtpBoxPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    setResetCodeInput(pasted);
    const targetIndex = Math.min(pasted.length, 5);
    const targetEl = document.getElementById(`reset-otp-box-${targetIndex}`);
    if (targetEl) {
      (targetEl as HTMLInputElement).focus();
    }

    if (pasted.length === 6) {
      setIsLoading(true);
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleResetPasswordSubmit(fakeEvent, pasted);
      }, 50);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-between py-8 px-4 sm:px-6 relative overflow-hidden font-sans">
      
      {/* Absolute Decorative elements for modern luxury feel */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-slate-100/50 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-50 rounded-full blur-2xl -z-10 pointer-events-none"></div>

      {/* Header element */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("Kembali", "Back")}</span>
        </button>
        <div className="flex items-center gap-4">
          <span className="font-lobster text-xl select-none tracking-wide text-[#111827]">
            Fanra<span className="text-slate-400 font-normal">Tech</span>
          </span>
        </div>
      </div>

      {/* Main Autentikasi Card */}
      <div className="w-full max-w-md mx-auto bg-white border border-slate-100/80 rounded-2xl shadow-xl shadow-slate-200/40 p-6 sm:p-8 flex-1 flex flex-col justify-center">
        
        <AnimatePresence>
          {isVerifying ? (
            /* VERIFICATION FLOW SCREEN */
            <motion.div
              key="verification"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <Image 
                  src="https://cdn-icons-png.flaticon.com/128/3257/3257792.png" 
                  alt="Verifikasi Kode" 
                  width={48}
                  height={48}
                  className="object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
                <h3 className="text-xl font-display font-medium text-slate-900 tracking-tight leading-none pt-2.5">
                  {t("Verifikasi Akun Anda", "Verify Your Account")}
                </h3>
                <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
                  {lang === 'id' ? (
                    <>
                      Kami telah mengirimkan 6-digit Kode OTP ke email <span className="font-bold text-slate-700">{verificationSession?.email}</span>. Silakan periksa kotak masuk atau spam.
                    </>
                  ) : (
                    <>
                      We have sent a 6-digit OTP code to the email <span className="font-bold text-slate-700">{verificationSession?.email}</span>. Please check your inbox or spam folder.
                    </>
                  )}
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <span>{authSuccess}</span>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="space-y-2.5">
                  <label htmlFor="otp-box-0" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">
                    {t("MASUKKAN KODE VERIFIKASI", "ENTER VERIFICATION CODE")}
                  </label>
                  
                  <div className="grid grid-cols-6 gap-2 max-w-[280px] mx-auto text-center" onPaste={handleOtpBoxPaste}>
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const char = verificationCodeInput[index] || '';
                      return (
                        <input
                          key={index}
                          type="text"
                          id={`otp-box-${index}`}
                          maxLength={1}
                          pattern="[0-9]*"
                          inputMode="numeric"
                          value={char}
                          onChange={(e) => handleOtpBoxChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpBoxKeyDown(index, e)}
                          className="w-full text-center font-bold text-base h-11 bg-slate-50 border border-slate-250 focus:border-[#111827] focus:bg-white rounded-xl outline-none transition duration-200"
                          required
                        />
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[#111827] hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center transition duration-200 cursor-pointer"
                >
                  {isLoading ? t('Memvalidasi OTP...', 'Validating OTP...') : t('Konfirmasi', 'Confirm')}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={verificationResendTimer > 0}
                  onClick={() => {
                    const nextCode = Math.floor(100000 + Math.random() * 900000).toString();
                    setVerificationSession((prev) => prev ? { ...prev, code: nextCode } : null);
                    // Send via Internal API endpoint again with appropriate template
                    if (verificationSession) {
                      fetch('/api/send-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: verificationSession.email,
                          name: verificationSession.name,
                          code: nextCode,
                          type: 'signup'
                        })
                      }).catch(e => console.error(e));
                    }
                    setVerificationResendTimer(180);
                    setAuthSuccess(t('Kode baru sukses dikirimkan!', 'New code sent successfully!'));
                  }}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 disabled:text-slate-400 transition cursor-pointer"
                >
                  {verificationResendTimer > 0 
                    ? (lang === 'id' ? `Kirim ulang kode dalam ${verificationResendTimer}d` : `Resend code in ${verificationResendTimer}s`) 
                    : t('Kirim Ulang Kode OTP', 'Resend OTP Code')}
                </button>
              </div>

            </motion.div>
          ) : isResetFlow ? (
            /* PASSWORD RESET FLOW SCREEN */
            <motion.div
              key={`reset-password-flow-${resetStep}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {resetStep === 'email' ? (
                /* STEP 1: INPUT EMAIL ADDRESS */
                <>
                  <div className="text-center space-y-2">
                    <Image 
                      src="https://cdn-icons-png.flaticon.com/128/6195/6195690.png" 
                      alt="Lupa Sandi" 
                      width={48}
                      height={48}
                      className="object-contain mx-auto"
                      referrerPolicy="no-referrer"
                    />
                    <h3 className="text-xl font-display font-medium text-slate-900 tracking-tight leading-none pt-2.5">
                      {t("Pemulihan Akun", "Account Recovery")}
                    </h3>
                    <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
                      {t(
                        "Masukkan alamat email terdaftar Anda untuk menerima kode OTP verifikasi pemulihan.",
                        "Enter your registered email address to receive a recovery verification OTP code."
                      )}
                    </p>
                  </div>

                  {authError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authSuccess && (
                     <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                       <span>{authSuccess}</span>
                     </div>
                  )}

                  <form onSubmit={handleSendResetOTP} className="space-y-4">
                    <div className="space-y-1">
                      <label htmlFor="reset-email-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                        {t("Alamat Email", "Email Address")}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Image 
                            src="https://cdn-icons-png.flaticon.com/128/11502/11502423.png" 
                            alt="Alamat Email" 
                            width={16}
                            height={16}
                            className="object-contain grayscale opacity-55"
                            referrerPolicy="no-referrer"
                          />
                        </span>
                        <input
                          type="email"
                          id="reset-email-input"
                          maxLength={80}
                          value={resetEmail}
                          onChange={(e) => setResetEmail(handleEmailFormatting(e.target.value))}
                          placeholder="nama@gmail.com"
                          required
                          className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 focus:border-[#111827] focus:bg-white rounded-xl text-xs outline-none transition lowercase"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 bg-[#111827] hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-md"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>{t("Memproses...", "Processing...")}</span>
                        </>
                      ) : (
                        t("Kirim Kode OTP", "Send OTP Code")
                      )}
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetFlow(false);
                        setResetStep('email');
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 transition underline cursor-pointer"
                    >
                      {t("Kembali ke Halaman Masuk", "Back to Log In")}
                    </button>
                  </div>
                </>
              ) : (
                /* STEP 2: VERIFY OTP AND SET NEW PASSWORD */
                <>
                  <div className="text-center space-y-2">
                    <Image 
                      src="https://cdn-icons-png.flaticon.com/128/6195/6195690.png" 
                      alt="Atur Ulang Sandi" 
                      width={48}
                      height={48}
                      className="object-contain mx-auto"
                      referrerPolicy="no-referrer"
                    />
                    <h3 className="text-xl font-display font-medium text-slate-900 tracking-tight leading-none pt-2.5">
                      {t("Atur Ulang Sandi Anda", "Reset Your Password")}
                    </h3>
                    <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
                      {lang === 'id' ? (
                        <>
                          Kami telah mengirimkan 6-digit Kode OTP Pemulihan ke email <span className="font-bold text-slate-700">{censorEmail(resetEmail)}</span>. Silakan masukkan kode tersebut beserta kata sandi baru Anda.
                        </>
                      ) : (
                        <>
                          We have sent a 6-digit recovery OTP code to the email <span className="font-bold text-slate-700">{censorEmail(resetEmail)}</span>. Please enter the code along with your new password.
                        </>
                      )}
                    </p>
                  </div>

                  {authError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authSuccess && (
                     <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                       <span>{authSuccess}</span>
                     </div>
                  )}

                  <form onSubmit={(e) => handleResetPasswordSubmit(e)} className="space-y-4">
                    
                    {/* Reset OTP Code Field */}
                    <div className="space-y-2.5">
                      <label htmlFor="reset-otp-box-0" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">
                        {t("MASUKKAN KODE OTP PEMULIHAN", "ENTER RECOVERY OTP CODE")}
                      </label>
                      
                      <div className="grid grid-cols-6 gap-2 max-w-[280px] mx-auto text-center" onPaste={handleResetOtpBoxPaste}>
                        {[0, 1, 2, 3, 4, 5].map((index) => {
                          const char = resetCodeInput[index] || '';
                          return (
                            <input
                              key={index}
                              type="text"
                              id={`reset-otp-box-${index}`}
                              maxLength={1}
                              pattern="[0-9]*"
                              inputMode="numeric"
                              value={char}
                              onChange={(e) => handleResetOtpBoxChange(index, e.target.value)}
                              onKeyDown={(e) => handleResetOtpBoxKeyDown(index, e)}
                              className="w-full text-center font-bold text-base h-11 bg-slate-50 border border-slate-250 focus:border-[#111827] focus:bg-white rounded-xl outline-none transition duration-200"
                              required
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* New Password input */}
                    <div className="space-y-1">
                      <label htmlFor="reset-new-password" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                        {t("Kata Sandi Baru", "New Password")}
                      </label>
                      <div className="relative">
                         <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                           <Image 
                             src="https://cdn-icons-png.flaticon.com/128/18625/18625221.png" 
                             alt="Kata Sandi" 
                             width={18}
                             height={18}
                             className="object-contain grayscale opacity-55"
                             referrerPolicy="no-referrer"
                           />
                         </span>
                         <input
                           type={showNewPassword ? 'text' : 'password'}
                           id="reset-new-password"
                           maxLength={30}
                           value={newPassword}
                           onChange={(e) => setNewPassword(e.target.value)}
                           placeholder={t("Masukkan sandi baru", "Enter new password")}
                           required
                           className="w-full pl-10 pr-10 h-11 bg-slate-50 border border-slate-200 focus:border-[#111827] focus:bg-white rounded-xl text-xs outline-none transition"
                         />
                         <button
                           type="button"
                           onClick={() => setShowNewPassword(!showNewPassword)}
                           className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[44px]"
                         >
                           {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                         </button>
                      </div>

                      <div className="pt-2 pb-0.5 px-0.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] text-slate-400 font-medium">
                         <div className="flex items-center gap-1">
                           <span className={`w-3 h-3 rounded-full flex items-center justify-center font-bold text-[7px] border shrink-0 ${
                             newPassword.length >= 8 ? 'border-emerald-200 bg-emerald-50 text-emerald-600 font-bold' : 'border-slate-250 bg-slate-50 text-transparent'
                           }`}>
                             {newPassword.length >= 8 ? '✓' : ''}
                           </span>
                           <span>{t("Min. 8 karakter", "Min. 8 characters")}</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <span className={`w-3 h-3 rounded-full flex items-center justify-center font-bold text-[7px] border shrink-0 ${
                             /[A-Z]/.test(newPassword) ? 'border-emerald-200 bg-emerald-50 text-emerald-600 font-bold' : 'border-slate-250 bg-slate-50 text-transparent'
                           }`}>
                             {/[A-Z]/.test(newPassword) ? '✓' : ''}
                           </span>
                           <span>{t("Huruf KAPITAL", "UPPERCASE letter")}</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <span className={`w-3 h-3 rounded-full flex items-center justify-center font-bold text-[7px] border shrink-0 ${
                             /[0-9]/.test(newPassword) ? 'border-emerald-200 bg-emerald-50 text-emerald-600 font-bold' : 'border-slate-250 bg-slate-50 text-transparent'
                           }`}>
                             {/[0-9]/.test(newPassword) ? '✓' : ''}
                           </span>
                           <span>{t("Satu Angka (0-9)", "One Number (0-9)")}</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <span className={`w-3 h-3 rounded-full flex items-center justify-center font-bold text-[7px] border shrink-0 ${
                             /[^A-Za-z0-9]/.test(newPassword) ? 'border-emerald-200 bg-emerald-50 text-emerald-600 font-bold' : 'border-slate-250 bg-slate-50 text-transparent'
                           }`}>
                             {/[^A-Za-z0-9]/.test(newPassword) ? '✓' : ''}
                           </span>
                           <span>{t("Simbol khusus", "Special symbol")}</span>
                         </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !isNewPasswordValid}
                      className={`w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition duration-200 select-none ${
                        isNewPasswordValid && !isLoading
                          ? 'bg-[#111827] hover:bg-slate-800 text-white cursor-pointer shadow-md'
                          : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? t('Mengatur ulang...', 'Resetting...') : t('Simpan Kata Sandi Baru', 'Save New Password')}
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep('email');
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 transition underline cursor-pointer"
                    >
                      {t("Kembali ke masukkan email", "Back to Email input")}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            /* REGULAR ROUTER SWITCH (SIGN IN & SIGN UP) */
            <motion.div
              key="auth-forms"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Tab Selector Segmented Controls */}
              <div className="grid grid-cols-2 bg-slate-50 p-1.5 rounded-full border border-slate-100 select-none">
                <button
                  onClick={() => {
                    if (activeTab !== 'signup') {
                      setActiveTab('signup');
                      setAuthError('');
                      setAuthSuccess('');
                    }
                  }}
                  disabled={activeTab === 'signup'}
                  className={`py-1.5 text-xs font-bold rounded-full transition duration-300 pointer-events-auto cursor-pointer disabled:cursor-default ${
                    activeTab === 'signup'
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'text-slate-400 hover:text-[#111827]'
                  }`}
                >
                  {t("Daftar Akun", "Register Account")}
                </button>
                <button
                  onClick={() => {
                    if (activeTab !== 'signin') {
                      setActiveTab('signin');
                      setAuthError('');
                      setAuthSuccess('');
                    }
                  }}
                  disabled={activeTab === 'signin'}
                  className={`py-1.5 text-xs font-bold rounded-full transition duration-300 pointer-events-auto cursor-pointer disabled:cursor-default ${
                    activeTab === 'signin'
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'text-slate-400 hover:text-[#111827]'
                  }`}
                >
                  {t("Masuk Akun", "Log In")}
                </button>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-display font-medium tracking-tight text-slate-900 leading-none">
                  {activeTab === 'signup' ? t('Bergabung ke ', 'Join ') : t('Masuk ke ', 'Sign In to ')}
                  <span className="font-lobster text-[#111827]">FanraTech</span>
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeTab === 'signup' 
                    ? t('Dapatkan akses yang lebih lengkap dan kemudahan komunikasi interaktif.', 'Gain complete access and interact with outstanding visuals easily.') 
                    : t('Akses instan akun Anda serta layani kreasi visual dengan aman.', 'Instantly access your account and explore premium visual artwork securely.')}
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100/60 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <span>{authSuccess}</span>
                </div>
              )}

              {activeTab === 'signup' ? (
                /* SIGN UP FORM BODY */
                <form onSubmit={handleSignUpInit} className="space-y-4">
                  
                  {/* Name field - replaced with clean user icon & format */}
                  <div className="space-y-1">
                    <label htmlFor="signup-name-field" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                      {t("Nama Lengkap", "Full Name")}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Image 
                          src="https://cdn-icons-png.flaticon.com/128/9308/9308008.png" 
                          alt="Nama Lengkap" 
                          width={16}
                          height={16}
                          className="object-contain grayscale opacity-55"
                          referrerPolicy="no-referrer"
                        />
                      </span>
                      <input
                        type="text"
                        id="signup-name-field"
                        maxLength={40}
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder={t("Misal: Pria Solo", "e.g., John Doe")}
                        required
                        className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 focus:border-[#111827] focus:bg-white rounded-xl text-xs outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Email field - rebranded to just "Alamat Email" with new icon */}
                  <div className="space-y-1">
                    <label htmlFor="signup-email-field" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                      {t("Alamat Email", "Email Address")}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Image 
                          src="https://cdn-icons-png.flaticon.com/128/11502/11502423.png" 
                          alt="Alamat Email" 
                          width={16}
                          height={16}
                          className="object-contain grayscale opacity-55"
                          referrerPolicy="no-referrer"
                        />
                      </span>
                      <input
                        type="email"
                        id="signup-email-field"
                        maxLength={80}
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(handleEmailFormatting(e.target.value))}
                        placeholder="nama@gmail.com"
                        required
                        className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 focus:border-[#111827] focus:bg-white rounded-xl text-xs outline-none transition lowercase"
                      />
                    </div>
                  </div>

                  {/* Password field - rebranded to just "Kata Sandi" with new icon */}
                  <div className="space-y-1">
                    <label htmlFor="signup-password-field" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                      {t("Kata Sandi", "Password")}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Image 
                          src="https://cdn-icons-png.flaticon.com/128/18625/18625221.png" 
                          alt="Kata Sandi" 
                          width={18}
                          height={18}
                          className="object-contain grayscale opacity-55"
                          referrerPolicy="no-referrer"
                        />
                      </span>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        id="signup-password-field"
                        maxLength={30}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-10 h-11 bg-slate-50 border border-slate-200 focus:border-[#111827] focus:bg-white rounded-xl text-xs outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[44px]"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Simplified, smaller, beautiful 2-column requirements grid */}
                    <div className="pt-2 pb-0.5 px-0.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] text-slate-400 font-medium">
                      <div className="flex items-center gap-1">
                        <span className={`w-3 h-3 rounded-full flex items-center justify-center font-bold text-[7px] border shrink-0 ${
                          hasMinLength ? 'border-emerald-200 bg-emerald-50 text-emerald-600 font-bold' : 'border-slate-250 bg-slate-50 text-transparent'
                        }`}>
                          {hasMinLength ? '✓' : ''}
                        </span>
                        <span>{t("Min. 8 karakter", "Min. 8 characters")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-3 h-3 rounded-full flex items-center justify-center font-bold text-[7px] border shrink-0 ${
                          hasUppercase ? 'border-emerald-200 bg-emerald-50 text-emerald-600 font-bold' : 'border-slate-250 bg-slate-50 text-transparent'
                        }`}>
                          {hasUppercase ? '✓' : ''}
                        </span>
                        <span>{t("Huruf KAPITAL", "UPPERCASE letter")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-3 h-3 rounded-full flex items-center justify-center font-bold text-[7px] border shrink-0 ${
                          hasNumber ? 'border-emerald-200 bg-emerald-50 text-emerald-600 font-bold' : 'border-slate-250 bg-slate-50 text-transparent'
                        }`}>
                          {hasNumber ? '✓' : ''}
                        </span>
                        <span>{t("Satu Angka (0-9)", "One Number (0-9)")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-3 h-3 rounded-full flex items-center justify-center font-bold text-[7px] border shrink-0 ${
                          hasSpecialChar ? 'border-emerald-200 bg-emerald-50 text-emerald-600 font-bold' : 'border-slate-250 bg-slate-50 text-transparent'
                        }`}>
                          {hasSpecialChar ? '✓' : ''}
                        </span>
                        <span>{t("Simbol khusus", "Special symbol")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit buttons with refined visual loadings */}
                  <button
                    type="submit"
                    disabled={isLoading || !isPasswordValid}
                    className={`w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition duration-200 select-none ${
                      isPasswordValid && !isLoading
                        ? 'bg-[#111827] hover:bg-slate-800 text-white cursor-pointer shadow-md'
                        : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{t("Daftar...", "Registering...")}</span>
                      </>
                    ) : (
                      t("Daftar", "Register")
                    )}
                  </button>

                </form>
              ) : (
                /* SIGN IN FORM BODY */
                <form onSubmit={handleSignIn} className="space-y-4">
                  
                  {/* Email field - rebranded with new icon */}
                  <div className="space-y-1">
                    <label htmlFor="signin-email-field" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                      {t("Alamat Email", "Email Address")}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Image 
                          src="https://cdn-icons-png.flaticon.com/128/11502/11502423.png" 
                          alt="Alamat Email" 
                          width={16}
                          height={16}
                          className="object-contain grayscale opacity-55"
                          referrerPolicy="no-referrer"
                        />
                      </span>
                      <input
                        type="email"
                        id="signin-email-field"
                        maxLength={80}
                        value={signinEmail}
                        onChange={(e) => setSigninEmail(handleEmailFormatting(e.target.value))}
                        placeholder="nama@gmail.com"
                        required
                        className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 focus:border-[#111827] focus:bg-white rounded-xl text-xs outline-none transition lowercase"
                      />
                    </div>
                  </div>

                  {/* Password field - rebranded and custom icon */}
                  <div className="space-y-1">
                    <label htmlFor="signin-password-field" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                      {t("Kata Sandi", "Password")}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Image 
                          src="https://cdn-icons-png.flaticon.com/128/18625/18625221.png" 
                          alt="Kata Sandi" 
                          width={18}
                          height={18}
                          className="object-contain grayscale opacity-55"
                          referrerPolicy="no-referrer"
                        />
                      </span>
                      <input
                        type={showSigninPassword ? 'text' : 'password'}
                        id="signin-password-field"
                        maxLength={30}
                        value={signinPassword}
                        onChange={(e) => setSigninPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-10 h-11 bg-slate-50 border border-slate-200 focus:border-[#111827] focus:bg-white rounded-xl text-xs outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSigninPassword(!showSigninPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[44px]"
                      >
                        {showSigninPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit action button */}
                  <div className="space-y-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 bg-[#111827] hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-md"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>{t("Masuk...", "Signing In...")}</span>
                        </>
                      ) : (
                        t("Masuk", "Sign In")
                      )}
                    </button>

                    {/* Subtle Forgot Password Button (Tidak mencolok, as requested) */}
                    <button
                      type="button"
                      onClick={handleStartResetFlow}
                      className="text-[10px] font-bold text-slate-400 hover:text-black hover:underline block text-center mx-auto bg-transparent border-0 py-1 transition cursor-pointer"
                    >
                      {t("Lupa kata sandi?", "Forgot password?")}
                    </button>
                  </div>

                  {/* Professional security box with requested icon and clean phrasing */}
                  <div className="p-3 bg-slate-50 opacity-95 rounded-xl border border-slate-100 flex items-start gap-2.5">
                    <Image 
                      src="https://cdn-icons-png.flaticon.com/128/4674/4674660.png" 
                      alt="Sistem Keamanan" 
                      width={16}
                      height={16}
                      className="object-contain grayscale opacity-60 shrink-0 mt-0.5"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                      {t(
                        "Autentikasi FanraTech terlindungi oleh sistem enkripsi standar industri. Kode verifikasi hanya dikirimkan secara instan langsung ke alamat email terdaftar demi menjamin privasi dan keamanan akun Anda.",
                        "FanraTech authentication is protected by industry-standard encryption. Verification codes are sent instantly directly to your registered email to ensure the absolute privacy and security of your account."
                      )}
                    </p>
                  </div>

                </form>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Footer copyright */}
      <div className="w-full text-center mt-8 space-y-1">
        <p className="text-[10px] text-slate-400 font-sans">
          &copy; 2026 FanraTech Indonesia. Seluruh Hak Cipta Dilindungi Undang-Undang.
        </p>
      </div>

    </div>
  );
}
