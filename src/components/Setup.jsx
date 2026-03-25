import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { T } from '../lib/utils'

export default function Setup({ session, onSaveProfile }) {
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [bizName, setBizName] = useState('')
  const [lang, setLang] = useState('hh')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(session ? 'profile' : 'email')

  const l = T[lang]

  async function sendMagicLink() {
    if (!email || !email.includes('@')) {
      setError('Valid email address daalo')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    if (error) setError(error.message)
    else setEmailSent(true)
    setLoading(false)
  }

  async function saveProfile() {
    if (!bizName.trim()) {
      setError(l.fillAll)
      return
    }
    setLoading(true)
    setError('')
    await onSaveProfile(bizName.trim(), lang)
    setLoading(false)
  }

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: '#6B7280', textTransform: 'uppercase',
    letterSpacing: '.3px', marginBottom: 5
  }
  const inputStyle = {
    width: '100%', padding: '12px 14px',
    border: '1.5px solid #E5E7EB', borderRadius: 8,
    fontSize: 15, fontFamily: "'DM Sans', sans-serif",
    color: '#111827', background: '#fff',
    outline: 'none', boxSizing: 'border-box'
  }
  const btnStyle = {
    width: '100%', padding: 13, borderRadius: 8,
    fontSize: 15, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer', border: 'none',
    background: loading ? '#9CA3AF' : '#16A34A',
    color: 'white', marginTop: 4
  }
  const errorStyle = {
    background: '#FEF2F2', border: '1px solid #FECACA',
    borderRadius: 8, padding: '8px 12px',
    fontSize: 13, color: '#991B1B', marginBottom: 12
  }

  const langButtons = (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      {['en', 'hi', 'hh'].map(code => (
        <button
          key={code}
          onClick={() => setLang(code)}
          style={{
            flex: 1, padding: 10, borderRadius: 8,
            border: '1.5px solid',
            borderColor: lang === code ? '#16A34A' : '#E5E7EB',
            background: lang === code ? '#F0FDF4' : '#fff',
            color: lang === code ? '#14532D' : '#6B7280',
            fontWeight: lang === code ? 600 : 500,
            fontSize: 13, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif"
          }}
        >
          {code === 'en' ? 'English' : code === 'hi' ? 'हिंदी' : 'Hinglish'}
        </button>
      ))}
    </div>
  )

  return (
    <div style={{
      maxWidth: 390, margin: '0 auto',
      minHeight: '100vh', background: '#fff',
      padding: '48px 24px 32px'
    }}>
      <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 14 }}>🧠</div>
      <div style={{ fontSize: 24, fontWeight: 600, textAlign: 'center', marginBottom: 6 }}>AI CFO</div>
      <div style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 1.6, marginBottom: 32 }}>
        {l.tagline}
      </div>

      {step === 'email' && !emailSent && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Email address</label>
            <input
              style={inputStyle}
              type="email"
              placeholder="e.g. sharma@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
            />
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
              {lang === 'hi'
                ? 'आपके email पर एक login link भेजा जाएगा'
                : lang === 'en'
                ? 'A login link will be sent to your email'
                : 'Aapke email pe ek login link bheja jaayega'}
            </div>
          </div>
          {error && <div style={errorStyle}>{error}</div>}
          <button style={btnStyle} onClick={sendMagicLink} disabled={loading}>
            {loading
              ? 'Sending...'
              : lang === 'hi'
              ? 'Login Link भेजें'
              : lang === 'en'
              ? 'Send Login Link'
              : 'Login Link Bhejo'}
          </button>
          <div style={{ marginTop: 20 }}>
            {langButtons}
          </div>
        </div>
      )}

      {step === 'email' && emailSent && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {lang === 'hi' ? 'Email check करें!' : lang === 'en' ? 'Check your email!' : 'Email check karo!'}
          </div>
          <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>
            {lang === 'hi'
              ? `${email} पर एक login link भेजा गया है। उस link पर click करें।`
              : lang === 'en'
              ? `A login link was sent to ${email}. Click it to sign in.`
              : `${email} pe ek login link bheja gaya hai. Us link pe click karo.`}
          </div>
          <button
            style={{ ...btnStyle, background: '#6B7280' }}
            onClick={() => setEmailSent(false)}
          >
            {lang === 'hi' ? '← वापस जाएं' : lang === 'en' ? '← Go back' : '← Wapas jao'}
          </button>
        </div>
      )}

      {step === 'profile' && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>{l.bizname}</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g. Sharma Textiles"
              value={bizName}
              onChange={e => setBizName(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>{l.langLabel}</label>
          </div>
          {langButtons}
          {error && <div style={errorStyle}>{error}</div>}
          <button style={btnStyle} onClick={saveProfile} disabled={loading}>
            {loading ? 'Saving...' : l.start}
          </button>
        </div>
      )}
    </div>
  )
}
