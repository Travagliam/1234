import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initFirebase } from '@/lib/firebase';

// ─── Allergen list ────────────────────────────────────────────────────────────
// This is the master list. Any allergen added here will automatically
// appear in the onboarding step on the next page.
export const ALLERGENS = [
  { value: 'peanuts',   label: 'Peanuts',   emoji: '🥜' },
  { value: 'tree_nuts', label: 'Tree Nuts',  emoji: '🌰' },
  { value: 'gluten',    label: 'Gluten',     emoji: '🌾' },
  { value: 'dairy',     label: 'Dairy',      emoji: '🥛' },
  { value: 'eggs',      label: 'Eggs',       emoji: '🥚' },
  { value: 'fish',      label: 'Fish',       emoji: '🐟' },
  { value: 'shellfish', label: 'Shellfish',  emoji: '🦐' },
  { value: 'soy',       label: 'Soy',        emoji: '🫘' },
  { value: 'sesame',    label: 'Sesame',     emoji: '🌿' },
  { value: 'mustard',   label: 'Mustard',    emoji: '🌻' },
  { value: 'celery',    label: 'Celery',     emoji: '🥬' },
  { value: 'sulphites', label: 'Sulphites',  emoji: '🍷' },
  { value: 'lupin',     label: 'Lupin',      emoji: '🌸' },
  { value: 'molluscs',  label: 'Molluscs',   emoji: '🐚' },
];

export default function DinerSignup() {
  const router = useRouter();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const app  = initFirebase();
      const auth = getAuth(app);
      const db   = getFirestore(app);

      // 1. Create the Firebase Auth account
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Create the user document in Firestore
      //    accountType: 'diner' is how we tell diner accounts apart from restaurant accounts
      await setDoc(doc(db, 'users', user.uid), {
        name:        name.trim(),
        email:       email.toLowerCase().trim(),
        accountType: 'diner',
        allergies:   [],       // filled in during onboarding step 2
        severity:    {},       // filled in during onboarding step 3
        createdAt:   serverTimestamp(),
        onboardingComplete: false,
      });

      // 3. Send them to the allergy-selection step
      router.push('/diner/onboarding');

    } catch (err) {
      // Translate Firebase error codes into plain English
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('That email address doesn\'t look right.');
      } else {
        setError('Something went wrong. Please try again.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create account — Linen</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div style={styles.page}>
        <div style={styles.container}>

          {/* Logo */}
          <div style={styles.logo}>Linen</div>
          <p style={styles.tagline}>Allergy-safe dining, built for you</p>

          <h1 style={styles.heading}>Create your account</h1>
          <p style={styles.subheading}>
            Already have one?{' '}
            <Link href="/diner/signin" style={styles.link}>Sign in</Link>
          </p>

          <form onSubmit={handleSignup} style={styles.form}>

            <label style={styles.label}>Your name</label>
            <input
              type="text"
              placeholder="Sarah Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              autoComplete="name"
              required
            />

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
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoComplete="new-password"
              required
            />

            {/* Privacy notice */}
            <div style={styles.privacyBox}>
              <p style={styles.privacyText}>
                🔒 Your allergy data is stored securely and used only to personalize your experience. 
                We never sell or share your personal information.
              </p>
            </div>

            {/* Error message */}
            {error && <p style={styles.errorText}>{error}</p>}

            <button
              type="submit"
              style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </button>

          </form>

          <p style={styles.legal}>
            By creating an account you agree to our{' '}
            <Link href="/terms" style={styles.link}>Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" style={styles.link}>Privacy Policy</Link>.
          </p>

        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// All styles are written inline so this file is self-contained.
// Colors use Linen's dark green (#1A3A2A) as the primary brand color.
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F8F6F1',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 16px 60px',
  },
  container: {
    width: '100%',
    maxWidth: '400px',
  },
  logo: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1A3A2A',
    letterSpacing: '-0.5px',
    marginBottom: '4px',
  },
  tagline: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '32px',
  },
  heading: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '6px',
  },
  subheading: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '24px',
  },
  link: {
    color: '#1A3A2A',
    textDecoration: 'underline',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    height: '46px',
    borderRadius: '10px',
    border: '1px solid #D1D5DB',
    backgroundColor: '#fff',
    padding: '0 14px',
    fontSize: '15px',
    color: '#111827',
    marginBottom: '16px',
    outline: 'none',
    WebkitAppearance: 'none',
  },
  privacyBox: {
    backgroundColor: '#EAF3DE',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
  },
  privacyText: {
    fontSize: '12px',
    color: '#27500A',
    lineHeight: '1.5',
  },
  errorText: {
    fontSize: '13px',
    color: '#A32D2D',
    backgroundColor: '#FCEBEB',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '12px',
  },
  button: {
    width: '100%',
    height: '50px',
    backgroundColor: '#1A3A2A',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '500',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  legal: {
    fontSize: '11px',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: '1.5',
  },
};
