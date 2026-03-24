import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { initFirebase } from '@/lib/firebase';

export default function DinerSignin() {
  const router = useRouter();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSignin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const app  = initFirebase();
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/diner/profile');
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email or password is incorrect. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address above, then click "Forgot password".');
      return;
    }
    try {
      const app  = initFirebase();
      const auth = getAuth(app);
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch {
      setError('Could not send reset email. Check the email address and try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Sign in — Linen</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div style={styles.page}>
        <div style={styles.container}>

          <div style={styles.logo}>Linen</div>
          <p style={styles.tagline}>Welcome back</p>

          <h1 style={styles.heading}>Sign in to your account</h1>
          <p style={styles.subheading}>
            New here?{' '}
            <Link href="/diner/signup" style={styles.link}>Create an account</Link>
          </p>

          <form onSubmit={handleSignin} style={styles.form}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              autoComplete="email"
              required
            />

            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoComplete="current-password"
              required
            />

            {error && <p style={styles.errorText}>{error}</p>}

            {resetSent && (
              <p style={styles.successText}>
                ✓ Reset email sent! Check your inbox.
              </p>
            )}

            <button
              type="submit"
              style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>

            <button
              type="button"
              onClick={handleForgotPassword}
              style={styles.forgotButton}
            >
              Forgot password?
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F8F6F1',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 16px 60px',
  },
  container: { width: '100%', maxWidth: '400px' },
  logo: {
    fontSize: '28px', fontWeight: '600', color: '#1A3A2A',
    letterSpacing: '-0.5px', marginBottom: '4px',
  },
  tagline: { fontSize: '13px', color: '#6B7280', marginBottom: '32px' },
  heading: { fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '6px' },
  subheading: { fontSize: '14px', color: '#6B7280', marginBottom: '24px' },
  link: { color: '#1A3A2A', textDecoration: 'underline' },
  form: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' },
  input: {
    width: '100%', height: '46px', borderRadius: '10px',
    border: '1px solid #D1D5DB', backgroundColor: '#fff',
    padding: '0 14px', fontSize: '15px', color: '#111827',
    marginBottom: '16px', outline: 'none', WebkitAppearance: 'none',
  },
  errorText: {
    fontSize: '13px', color: '#A32D2D', backgroundColor: '#FCEBEB',
    borderRadius: '8px', padding: '10px 14px', marginBottom: '12px',
  },
  successText: {
    fontSize: '13px', color: '#1A3A2A', backgroundColor: '#EAF3DE',
    borderRadius: '8px', padding: '10px 14px', marginBottom: '12px',
  },
  button: {
    width: '100%', height: '50px', backgroundColor: '#1A3A2A',
    color: '#fff', fontSize: '16px', fontWeight: '500',
    borderRadius: '12px', border: 'none', cursor: 'pointer', marginBottom: '12px',
  },
  forgotButton: {
    background: 'none', border: 'none', color: '#6B7280',
    fontSize: '13px', cursor: 'pointer', textAlign: 'center', width: '100%',
  },
};
