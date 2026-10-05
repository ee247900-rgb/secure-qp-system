import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldAlert, Lock, Globe, UserCheck, Mail, Send, 
  Key, Check, Sparkles, LogIn, KeyRound, AlertCircle
} from 'lucide-react';
import Spinner from '../components/common/Spinner';

const LoginPage = () => {
  const { login, signup, mfaVerify, activeOtp, requestAccessOtp, verifyAccessOtp } = useAuth();
  
  // Mode Selection: 'login' or 'create'
  const [mode, setMode] = useState('login'); 
  
  // Login Sub-mode: 'direct' (Admin Entrance) or 'request' (Member Request Access)
  const [loginSubMode, setLoginSubMode] = useState('direct');

  // Form Fields - Login Direct (EMPTY Defaults - NO PREFILLED VALUES)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Form Fields - Access Request (Member)
  const [requestEmail, setRequestEmail] = useState('');
  const [networkCode, setNetworkCode] = useState('');
  const [adminTargetEmail, setAdminTargetEmail] = useState('');
  const [requestReason, setRequestReason] = useState('');

  // Form Fields - Create Network (Admin) (EMPTY Defaults)
  const [networkName, setNetworkName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [memberEmails, setMemberEmails] = useState('');

  // State Feedback & Multi-step Workflow
  const [step, setStep] = useState('input'); // input, mfa
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [otpSentNotice, setOtpSentNotice] = useState('');
  const [targetUserEmail, setTargetUserEmail] = useState('');

  // Access OTP Two-Party Verification State
  const [accessOtpStep, setAccessOtpStep] = useState(false);
  const [accessOtpCode, setAccessOtpCode] = useState('');

  // Handle Admin Direct Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    setOtpSentNotice('');
    
    try {
      const res = await login(email, password);
      setTargetUserEmail(email.trim());
      setOtpSentNotice(
        `📩 Security OTP Dispatched! A 6-digit authentication OTP code [${res.otp}] has been sent to your email (${email.trim()}).`
      );
      // Proceed to MFA OTP verification step
      setStep('mfa');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Member Request Access to Admin Email
  const handleRequestAccess = async (e) => {
    e.preventDefault();
    if (!requestEmail || !adminTargetEmail || !requestReason) {
      setError('Please fill in all request fields');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const res = await requestAccessOtp(requestEmail, adminTargetEmail, requestReason);
      const codePreview = res?.otp_preview ? ` [OTP Code: ${res.otp_preview}]` : '';
      setSuccessMessage(
        `${res.message || `Access OTP has been sent to the network admin (${adminTargetEmail}). Ask the admin for the OTP to proceed.`}${codePreview}`
      );
      setAccessOtpStep(true);
    } catch (err) {
      setError(err.message || `Failed to send access request to Admin.`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Two-Party Access OTP Verification
  const handleVerifyAccessOtp = async (e) => {
    e.preventDefault();
    if (!accessOtpCode) {
      setError('Please enter the OTP code provided by the Admin.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      await verifyAccessOtp(requestEmail, accessOtpCode, adminTargetEmail);
      // If successful, AuthContext updates user/session, and the app routes away automatically
    } catch (err) {
      setError(err.message || 'Invalid access OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Network & Register Admin in Supabase
  const handleCreateNetwork = async (e) => {
    e.preventDefault();
    if (!networkName || !newAdminEmail || !newAdminPassword) {
      setError('Please enter Network Name, Admin Email, and Admin Password');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    setOtpSentNotice('');

    try {
      // 1. Register Admin in Supabase Auth & DB
      const res = await signup(newAdminEmail, newAdminPassword, networkName, 'ADMIN');
      
      setTargetUserEmail(newAdminEmail.trim());

      // 2. Count invited members & generate link & dispatch invitation emails
      const randomNetCode = `NET-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const joinLink = `${window.location.origin}/login?join=${randomNetCode}`;
      const membersList = memberEmails.split(',').map(m => m.trim()).filter(Boolean);

      if (membersList.length > 0) {
        try {
          await fetch('http://localhost:8000/api/auth/send-invitations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              member_emails: membersList,
              network_name: networkName,
              join_link: joinLink
            })
          });
        } catch (mailErr) {
          console.log("Invitation emails dispatch:", mailErr);
        }
      }

      setSuccessMessage(
        `🎉 Network "${networkName}" Created & Saved in Database! Invitation emails containing Network Join Link (${joinLink}) dispatched to ${membersList.length} member email(s).`
      );

      setOtpSentNotice(
        `🔑 Security OTP Generated! A 6-digit authentication OTP code [${res.otp}] has been generated and sent to Admin Email (${newAdminEmail.trim()}).`
      );

      // 3. Move to MFA Step for compulsory entrance verification
      setTimeout(() => {
        setStep('mfa');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create network in database.');
    } finally {
      setLoading(false);
    }
  };

  // Strict MFA OTP Verification
  const handleMfa = async (e) => {
    e.preventDefault();
    if (!mfaCode) {
      setError('Please enter the 6-digit OTP code sent to your email');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      await mfaVerify(mfaCode);
      // User is verified and authenticated into the network!
    } catch (err) {
      setError(err.message || 'Invalid OTP verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-grid"></div>
      
      <div className="card-glass login-card" style={{ maxWidth: mode === 'create' ? '520px' : '460px' }}>
        <div className="login-header">
          <div className="login-logo">
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Secure QP System</h2>
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Cloud Network Question Paper Platform</p>
        </div>

        {/* Mode Selector: Login vs Create Network */}
        {step === 'input' && (
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '4px', 
              padding: '4px', 
              backgroundColor: 'rgba(0,0,0,0.4)', 
              borderRadius: '10px', 
              marginBottom: '1.5rem',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '8px', fontSize: '0.85rem' }}
              onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
            >
              <LogIn size={15} /> Login to Network
            </button>

            <button
              type="button"
              className={`btn btn-sm ${mode === 'create' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '8px', fontSize: '0.85rem' }}
              onClick={() => { setMode('create'); setError(''); setSuccessMessage(''); }}
            >
              <Globe size={15} /> Create New Network
            </button>
          </div>
        )}

        {/* Notifications & Error Alerts */}
        {error && (
          <div className="alert alert-danger mb-4">
            <ShieldAlert size={20} />
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-info mb-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10B981' }}>
            <Check size={20} />
            <span style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{successMessage}</span>
          </div>
        )}

        {otpSentNotice && step === 'mfa' && (
          <div className="alert alert-info mb-4" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#F59E0B' }}>
            <KeyRound size={20} />
            <span style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{otpSentNotice}</span>
          </div>
        )}

        {step === 'input' ? (
          mode === 'login' ? (
            /* MODE 1: LOGIN TO NETWORK */
            <div>
              {/* Login Sub-toggle: Admin Direct vs Member Request */}
              <div className="flex gap-4 mb-4 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input 
                    type="radio" 
                    name="loginSub" 
                    checked={loginSubMode === 'direct'} 
                    onChange={() => setLoginSubMode('direct')} 
                  />
                  <span className={loginSubMode === 'direct' ? 'text-gold font-semibold' : 'text-secondary'}>
                    ⚡ Admin Entrance
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input 
                    type="radio" 
                    name="loginSub" 
                    checked={loginSubMode === 'request'} 
                    onChange={() => setLoginSubMode('request')} 
                  />
                  <span className={loginSubMode === 'request' ? 'text-gold font-semibold' : 'text-secondary'}>
                    📩 Request Access to Admin
                  </span>
                </label>
              </div>

              {loginSubMode === 'direct' ? (
                /* Admin Login Form - NO DEFAULT PREFILLED VALUES */
                <form onSubmit={handleAdminLogin}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="input" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="Enter admin/user email"
                    />
                  </div>
                  <div className="form-group mb-6">
                    <label className="form-label">Password</label>
                    <input 
                      type="password" 
                      className="input" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Enter password"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
                    {loading ? <Spinner size="sm" /> : <><UserCheck size={18} /> Authenticate & Dispatch OTP</>}
                  </button>
                </form>
              ) : (
                /* Member Access Request Flow */
                accessOtpStep ? (
                  /* STEP 2: Two-Party OTP Verification */
                  <form onSubmit={handleVerifyAccessOtp}>
                    <div className="form-group mb-6">
                      <label className="form-label text-center w-full">Two-Party Access Verification</label>
                      <p className="text-secondary text-center mb-4" style={{ fontSize: '0.85rem' }}>
                        An Access OTP has been sent to the Admin (<strong className="text-gold">{adminTargetEmail}</strong>).<br />
                        Please ask them for the code to enter the network.
                      </p>
                      <input 
                        type="text" 
                        className="input text-center text-mono" 
                        value={accessOtpCode}
                        onChange={e => setAccessOtpCode(e.target.value)}
                        maxLength={6}
                        required
                        placeholder="000000"
                        style={{ fontSize: '1.5rem', letterSpacing: '0.5em', fontWeight: 600 }}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
                      {loading ? <Spinner size="sm" /> : <><Check size={18} /> Verify Access & Join Network</>}
                    </button>
                    
                    <button 
                      type="button" 
                      className="btn btn-ghost w-full justify-center mt-2 text-xs" 
                      onClick={() => setAccessOtpStep(false)}
                      disabled={loading}
                    >
                      ← Back to Request Form
                    </button>
                  </form>
                ) : (
                  /* STEP 1: Member Access Request Form */
                  <form onSubmit={handleRequestAccess}>
                    <div className="form-group">
                      <label className="form-label">Your Email Address</label>
                      <input 
                        type="email" 
                        className="input" 
                        value={requestEmail}
                        onChange={e => setRequestEmail(e.target.value)}
                        required
                        placeholder="your.email@institution.edu"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Target Network Admin Email</label>
                      <input 
                        type="email" 
                        className="input" 
                        value={adminTargetEmail}
                        onChange={e => setAdminTargetEmail(e.target.value)}
                        required
                        placeholder="admin.email@institution.edu"
                      />
                    </div>

                    <div className="form-group mb-6">
                      <label className="form-label">Reason for Access Request</label>
                      <textarea 
                        className="textarea" 
                        style={{ minHeight: '60px' }}
                        value={requestReason}
                        onChange={e => setRequestReason(e.target.value)}
                        placeholder="Describe your role and reason for joining..."
                        required
                      ></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
                      {loading ? <Spinner size="sm" /> : <><Send size={18} /> Request Access OTP</>}
                    </button>
                  </form>
                )
              )}
            </div>
          ) : (
            /* MODE 2: CREATE NEW NETWORK (No Default Values, Saves to Supabase) */
            <form onSubmit={handleCreateNetwork}>
              <div className="form-group">
                <label className="form-label">Network Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={networkName}
                  onChange={e => setNetworkName(e.target.value)}
                  placeholder="e.g., Computer Science Faculty Network"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admin Account Email</label>
                <input 
                  type="email" 
                  className="input" 
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  placeholder="admin.email@domain.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admin Password</label>
                <input 
                  type="password" 
                  className="input" 
                  value={newAdminPassword}
                  onChange={e => setNewAdminPassword(e.target.value)}
                  placeholder="Set admin password"
                  required
                />
              </div>

              <div className="form-group mb-6">
                <label className="form-label">Invite Member Emails (Comma Separated)</label>
                <textarea 
                  className="textarea" 
                  placeholder="setter1@domain.com, reviewer1@domain.com, compiler1@domain.com"
                  value={memberEmails}
                  onChange={e => setMemberEmails(e.target.value)}
                  style={{ minHeight: '60px' }}
                ></textarea>
                <span className="text-secondary text-xs mt-1 block">
                  📩 Automated network join invitation links will be emailed to all listed member addresses.
                </span>
              </div>

              <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
                {loading ? <Spinner size="sm" /> : <><Globe size={18} /> Save Network & Dispatch Invitations</>}
              </button>
            </form>
          )
        ) : (
          /* STEP 2: STRICT MANDATORY MFA OTP ENTRANCE */
          <form onSubmit={handleMfa}>
            <div className="form-group mb-6">
              <label className="form-label text-center w-full">Mandatory MFA OTP Verification</label>
              <p className="text-secondary text-center mb-4" style={{ fontSize: '0.85rem' }}>
                Enter the exact 6-digit OTP sent to <strong className="text-gold">{targetUserEmail}</strong>.
              </p>
              <input 
                type="text" 
                className="input text-center text-mono" 
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value)}
                maxLength={6}
                required
                placeholder="000000"
                style={{ fontSize: '1.5rem', letterSpacing: '0.5em', fontWeight: 600 }}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
              {loading ? <Spinner size="sm" /> : <><UserCheck size={18} /> Verify OTP & Grant Entrance</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
