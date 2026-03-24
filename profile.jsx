import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initFirebase } from '@/lib/firebase';
import { ALLERGENS } from './signup';

// Severity badge config — used to color-code allergy tags
const SEVERITY_STYLES = {
  anaphylaxis: { background: '#FCEBEB', color: '#A32D2D', border: '#F7C1C1', label: '⚠ Anaphylaxis' },
  severe:      { background: '#EAF3DE', color: '#1A3A2A', border: '#C0DD97', label: 'Severe'        },
  mild:        { background: '#FEF3C7', color: '#78350F', border: '#FDE68A', label: 'Mild'          },
};

export default function DinerProfile() {
  const router = useRouter();
  const [profile, setProfile]         = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showMenu, setShowMenu]       = useState(false);

  useEffect(() => {
    const app  = initFirebase();
    const auth = getAuth(app);
    const db   = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/diner/signup');
        return;
      }

      // Load the user's profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();

        // If they haven't finished onboarding, send them back
        if (!data.onboardingComplete) {
          router.push('/diner/onboarding');
          return;
        }
        setProfile({ uid: firebaseUser.uid, ...data });
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const app  = initFirebase();
    const auth = getAuth(app);
    await signOut(auth);
    router.push('/diner/signup');
  };

  // Get initials for avatar circle
  const getInitials = (name = '') => {
    const words = name.trim().split(' ');
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return words[0]?.[0]?.toUpperCase() || '?';
  };

  if (authLoading || !profile) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <p style={{ color: '#6B7280', textAlign: 'center', paddingTop: '80px' }}>Loading your profile…</p>
        </div>
      </div>
    );
  }

  const allergenDetails = (profile.allergies || []).map((value) => {
    const allergen  = ALLERGENS.find((a) => a.value === value);
    const severity  = profile.severity?.[value] || 'severe';
    const sevStyle  = SEVERITY_STYLES[severity] || SEVERITY_STYLES.severe;
    return { ...allergen, severity, sevStyle };
  });

  const hasAnaphylaxis = allergenDetails.some((a) => a.severity === 'anaphylaxis');

  return (
    <>
      <Head>
        <title>My Profile — Linen</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div style={styles.page}>
        <div style={styles.container}>

          {/* ── Top nav ───────────────────────────────────────────────────── */}
          <div style={styles.topNav}>
            <div style={styles.logoSmall}>Linen</div>
            <button onClick={() => setShowMenu(!showMenu)} style={styles.menuButton}>
              ⋯
            </button>
          </div>

          {/* Dropdown menu */}
          {showMenu && (
            <div style={styles.dropdown}>
              <Link href="/diner/onboarding" style={styles.dropdownItem}>
                ✏️ Edit allergy profile
              </Link>
              <div style={styles.dropdownDivider} />
              <button onClick={handleSignOut} style={styles.dropdownItemButton}>
                Sign out
              </button>
            </div>
          )}

          {/* ── Profile card ──────────────────────────────────────────────── */}
          <div style={styles.card}>
            <div style={styles.avatarCircle}>
              {getInitials(profile.name)}
            </div>
            <div style={styles.profileName}>{profile.name}</div>
            <div style={styles.profileEmail}>{profile.email}</div>

            {/* Anaphylaxis warning — shown prominently if they have one */}
            {hasAnaphylaxis && (
              <div style={styles.anaphylaxisWarning}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                <span style={styles.anaphylaxisText}>
                  You carry an EpiPen risk. Always inform your server before ordering.
                </span>
              </div>
            )}

            {/* Allergy tags */}
            {allergenDetails.length > 0 ? (
              <>
                <p style={styles.sectionLabel}>Your allergies</p>
                <div style={styles.tagsRow}>
                  {allergenDetails.map((a) => (
                    <span
                      key={a.value}
                      style={{
                        ...styles.tag,
                        backgroundColor: a.sevStyle.background,
                        color:           a.sevStyle.color,
                        borderColor:     a.sevStyle.border,
                      }}
                    >
                      {a.emoji} {a.label}
                      {a.severity === 'anaphylaxis' && ' ⚠'}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p style={styles.noAllergyNote}>No allergies on file. You can browse and review any restaurant.</p>
            )}

            {/* Preferences */}
            {profile.preferences?.length > 0 && (
              <>
                <p style={styles.sectionLabel}>Dietary preferences</p>
                <div style={styles.tagsRow}>
                  {profile.preferences.map((pref) => (
                    <span key={pref} style={styles.prefTag}>
                      {pref.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Stats row ─────────────────────────────────────────────────── */}
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>0</div>
              <div style={styles.statLabel}>Restaurants</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>0</div>
              <div style={styles.statLabel}>Reviews</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>0</div>
              <div style={styles.statLabel}>Saved</div>
            </div>
          </div>

          {/* ── CTA: Find restaurants ─────────────────────────────────────── */}
          <div style={styles.ctaBox}>
            <div style={styles.ctaEmoji}>🍽</div>
            <h2 style={styles.ctaHeading}>Ready to eat out safely?</h2>
            <p style={styles.ctaText}>
              Browse restaurants near you and see exactly what&apos;s safe to eat — filtered for your allergies.
            </p>
            <Link href="/diner/explore" style={styles.ctaButton}>
              Find restaurants →
            </Link>
          </div>

          {/* ── Legal disclaimer ──────────────────────────────────────────── */}
          <div style={styles.disclaimerBox}>
            <p style={styles.disclaimerText}>
              📋 Allergen information on Linen is sourced from restaurants and our community. 
              Always confirm with restaurant staff before ordering, especially for severe or anaphylactic allergies. 
              Linen is not a medical service.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F8F6F1',
    display: 'flex',
    justifyContent: 'center',
    padding: '0 0 80px',
  },
  container: {
    width: '100%',
    maxWidth: '440px',
    padding: '0 16px',
  },
  topNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 0 16px',
    position: 'relative',
  },
  logoSmall: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1A3A2A',
  },
  menuButton: {
    fontSize: '22px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#374151',
    padding: '4px 8px',
    lineHeight: '1',
  },
  dropdown: {
    position: 'absolute',
    top: '60px',
    right: '16px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    zIndex: 100,
    minWidth: '180px',
  },
  dropdownItem: {
    display: 'block',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#374151',
    textDecoration: 'none',
  },
  dropdownItemButton: {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#A32D2D',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: '#F3F4F6',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px 20px',
    marginBottom: '12px',
    border: '1px solid #E5E7EB',
  },
  avatarCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#EAF3DE',
    color: '#1A3A2A',
    fontSize: '20px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  profileName: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '2px',
  },
  profileEmail: {
    fontSize: '13px',
    color: '#9CA3AF',
    marginBottom: '16px',
  },
  anaphylaxisWarning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    backgroundColor: '#FCEBEB',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '16px',
    border: '1px solid #F7C1C1',
  },
  anaphylaxisText: {
    fontSize: '13px',
    color: '#A32D2D',
    lineHeight: '1.4',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '8px',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '16px',
  },
  tag: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '5px 10px',
    borderRadius: '20px',
    border: '1px solid',
  },
  prefTag: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '5px 10px',
    borderRadius: '20px',
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: '1px solid #E5E7EB',
    textTransform: 'capitalize',
  },
  noAllergyNote: {
    fontSize: '13px',
    color: '#9CA3AF',
    lineHeight: '1.5',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '12px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px 8px',
    textAlign: 'center',
    border: '1px solid #E5E7EB',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
  },
  statLabel: {
    fontSize: '11px',
    color: '#9CA3AF',
    marginTop: '2px',
  },
  ctaBox: {
    backgroundColor: '#1A3A2A',
    borderRadius: '16px',
    padding: '24px 20px',
    marginBottom: '12px',
    textAlign: 'center',
  },
  ctaEmoji: {
    fontSize: '28px',
    marginBottom: '8px',
  },
  ctaHeading: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '8px',
  },
  ctaText: {
    fontSize: '13px',
    color: '#A8D5B8',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  ctaButton: {
    display: 'inline-block',
    backgroundColor: '#fff',
    color: '#1A3A2A',
    fontSize: '14px',
    fontWeight: '600',
    padding: '12px 24px',
    borderRadius: '10px',
    textDecoration: 'none',
  },
  disclaimerBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: '10px',
    padding: '12px 14px',
    border: '1px solid #E5E7EB',
  },
  disclaimerText: {
    fontSize: '11px',
    color: '#9CA3AF',
    lineHeight: '1.6',
  },
};
