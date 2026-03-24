import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { initFirebase } from '@/lib/firebase';
import { ALLERGENS } from './signup';

// ─── Severity options ─────────────────────────────────────────────────────────
// These are shown for each selected allergen in Step 2.
// 'anaphylaxis' gets a red warning badge on menus — it's the most serious.
const SEVERITY_OPTIONS = [
  { value: 'mild',         label: 'Mild',         desc: 'Discomfort, no emergency',  color: '#F59E0B', bg: '#FEF3C7' },
  { value: 'severe',       label: 'Severe',        desc: 'Needs medication',           color: '#1A3A2A', bg: '#EAF3DE' },
  { value: 'anaphylaxis',  label: 'Anaphylaxis',   desc: 'Life-threatening emergency', color: '#A32D2D', bg: '#FCEBEB' },
];

export default function DinerOnboarding() {
  const router  = useRouter();
  const [step, setStep]               = useState(1); // Steps 1, 2, 3
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Step 1: which allergens does this person have?
  const [selectedAllergens, setSelectedAllergens] = useState([]);

  // Step 2: how severe is each one?
  // Shape: { peanuts: 'anaphylaxis', gluten: 'severe', ... }
  const [severityMap, setSeverityMap] = useState({});

  // Step 3: lifestyle preferences (optional extras)
  const [preferences, setPreferences] = useState([]);

  const PREFERENCES = [
    { value: 'vegan',        label: 'Vegan',         emoji: '🌱' },
    { value: 'vegetarian',   label: 'Vegetarian',    emoji: '🥗' },
    { value: 'halal',        label: 'Halal',         emoji: '☪️' },
    { value: 'kosher',       label: 'Kosher',        emoji: '✡️' },
    { value: 'low_sodium',   label: 'Low Sodium',    emoji: '🧂' },
    { value: 'low_fodmap',   label: 'Low FODMAP',    emoji: '🫀' },
  ];

  // Make sure only logged-in users can access this page
  useEffect(() => {
    const app  = initFirebase();
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        // Not logged in — send them to sign up
        router.push('/diner/signup');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Toggle an allergen on/off in Step 1
  const toggleAllergen = (value) => {
    setSelectedAllergens((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  };

  // Toggle a lifestyle preference on/off in Step 3
  const togglePreference = (value) => {
    setPreferences((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  // Set severity for a specific allergen in Step 2
  const setSeverity = (allergen, level) => {
    setSeverityMap((prev) => ({ ...prev, [allergen]: level }));
  };

  // Move from Step 1 → Step 2
  // Auto-set all selected allergens to 'severe' as a default so Step 2 isn't blank
  const goToStep2 = () => {
    if (selectedAllergens.length === 0) {
      // They said they have no allergies — skip to step 3 (preferences)
      setStep(3);
      return;
    }
    const defaults = {};
    selectedAllergens.forEach((a) => { defaults[a] = 'severe'; });
    setSeverityMap(defaults);
    setStep(2);
  };

  // Save everything to Firebase and go to profile
  const finishOnboarding = async () => {
    setLoading(true);
    try {
      const app = initFirebase();
      const db  = getFirestore(app);

      await updateDoc(doc(db, 'users', user.uid), {
        allergies:          selectedAllergens,    // array: ['peanuts', 'gluten']
        severity:           severityMap,          // object: { peanuts: 'anaphylaxis' }
        preferences:        preferences,          // array: ['vegan']
        onboardingComplete: true,
      });

      router.push('/diner/profile');
    } catch (err) {
      console.error('Error saving profile:', err);
      setLoading(false);
    }
  };

  // Don't render until we know who the user is
  if (authLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <p style={{ color: '#6B7280', textAlign: 'center', paddingTop: '80px' }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Set up your profile — Linen</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div style={styles.page}>
        <div style={styles.container}>

          {/* Progress dots */}
          <div style={styles.progressRow}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  ...styles.dot,
                  ...(n === step ? styles.dotActive : {}),
                  ...(n < step  ? styles.dotDone  : {}),
                }}
              />
            ))}
          </div>

          {/* ── STEP 1: Pick your allergens ───────────────────────────────── */}
          {step === 1 && (
            <>
              <p style={styles.stepLabel}>Step 1 of 3</p>
              <h1 style={styles.heading}>What are you allergic to?</h1>
              <p style={styles.subheading}>
                Select all that apply. You can update this anytime from your profile.
              </p>

              <div style={styles.allergenGrid}>
                {ALLERGENS.map((allergen) => {
                  const isSelected = selectedAllergens.includes(allergen.value);
                  return (
                    <button
                      key={allergen.value}
                      onClick={() => toggleAllergen(allergen.value)}
                      style={{
                        ...styles.allergenChip,
                        ...(isSelected ? styles.allergenChipSelected : {}),
                      }}
                    >
                      <span style={styles.allergenEmoji}>{allergen.emoji}</span>
                      <span style={{
                        ...styles.allergenLabel,
                        ...(isSelected ? styles.allergenLabelSelected : {}),
                      }}>
                        {allergen.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedAllergens.length === 0 && (
                <p style={styles.noAllergyNote}>
                  If you don't have any allergies, you can still browse menus and leave reviews for others.
                </p>
              )}

              <button onClick={goToStep2} style={styles.primaryButton}>
                {selectedAllergens.length === 0 ? 'Continue without allergies →' : `Continue with ${selectedAllergens.length} selected →`}
              </button>
            </>
          )}

          {/* ── STEP 2: Set severity for each selected allergen ───────────── */}
          {step === 2 && (
            <>
              <p style={styles.stepLabel}>Step 2 of 3</p>
              <h1 style={styles.heading}>How serious are your reactions?</h1>
              <p style={styles.subheading}>
                We use this to show you the right level of warnings on menus. 
                If you're unsure, choose "Severe".
              </p>

              {/* IMPORTANT LEGAL NOTE: We surface this disclaimer during onboarding */}
              <div style={styles.disclaimerBox}>
                <p style={styles.disclaimerText}>
                  ⚠️ Linen is a guide to help you make informed decisions — not a substitute for 
                  speaking with restaurant staff about your allergies. Always confirm with your server.
                </p>
              </div>

              {selectedAllergens.map((allergenValue) => {
                const allergen = ALLERGENS.find((a) => a.value === allergenValue);
                return (
                  <div key={allergenValue} style={styles.severityRow}>
                    <div style={styles.severityLabel}>
                      <span style={{ marginRight: '6px' }}>{allergen?.emoji}</span>
                      {allergen?.label}
                    </div>
                    <div style={styles.severityOptions}>
                      {SEVERITY_OPTIONS.map((opt) => {
                        const isSelected = severityMap[allergenValue] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setSeverity(allergenValue, opt.value)}
                            style={{
                              ...styles.severityChip,
                              ...(isSelected ? {
                                backgroundColor: opt.bg,
                                borderColor: opt.color,
                                color: opt.color,
                              } : {}),
                            }}
                            title={opt.desc}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div style={styles.buttonRow}>
                <button onClick={() => setStep(1)} style={styles.backButton}>← Back</button>
                <button onClick={() => setStep(3)} style={styles.primaryButtonFlex}>Continue →</button>
              </div>
            </>
          )}

          {/* ── STEP 3: Dietary preferences (optional) ───────────────────── */}
          {step === 3 && (
            <>
              <p style={styles.stepLabel}>Step 3 of 3</p>
              <h1 style={styles.heading}>Any dietary preferences?</h1>
              <p style={styles.subheading}>
                Optional — this helps us filter menus for you. Skip if none apply.
              </p>

              <div style={styles.allergenGrid}>
                {PREFERENCES.map((pref) => {
                  const isSelected = preferences.includes(pref.value);
                  return (
                    <button
                      key={pref.value}
                      onClick={() => togglePreference(pref.value)}
                      style={{
                        ...styles.allergenChip,
                        ...(isSelected ? styles.allergenChipSelected : {}),
                      }}
                    >
                      <span style={styles.allergenEmoji}>{pref.emoji}</span>
                      <span style={{
                        ...styles.allergenLabel,
                        ...(isSelected ? styles.allergenLabelSelected : {}),
                      }}>
                        {pref.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div style={styles.buttonRow}>
                <button
                  onClick={() => setStep(selectedAllergens.length > 0 ? 2 : 1)}
                  style={styles.backButton}
                >
                  ← Back
                </button>
                <button
                  onClick={finishOnboarding}
                  style={{ ...styles.primaryButtonFlex, opacity: loading ? 0.7 : 1 }}
                  disabled={loading}
                >
                  {loading ? 'Saving…' : 'Finish setup →'}
                </button>
              </div>
            </>
          )}

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
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '32px 16px 80px',
  },
  container: {
    width: '100%',
    maxWidth: '420px',
  },
  progressRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '24px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#D1D5DB',
    transition: 'all 0.2s ease',
  },
  dotActive: {
    backgroundColor: '#1A3A2A',
    width: '20px',
    borderRadius: '4px',
  },
  dotDone: {
    backgroundColor: '#6B9E7A',
  },
  stepLabel: {
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '8px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  heading: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px',
    lineHeight: '1.2',
  },
  subheading: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  allergenGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '24px',
  },
  allergenChip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '14px 8px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  allergenChipSelected: {
    borderColor: '#1A3A2A',
    backgroundColor: '#EAF3DE',
  },
  allergenEmoji: {
    fontSize: '22px',
  },
  allergenLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  allergenLabelSelected: {
    color: '#1A3A2A',
  },
  noAllergyNote: {
    fontSize: '13px',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  disclaimerBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '20px',
    border: '1px solid #FDE68A',
  },
  disclaimerText: {
    fontSize: '12px',
    color: '#78350F',
    lineHeight: '1.5',
  },
  severityRow: {
    marginBottom: '20px',
  },
  severityLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
  },
  severityOptions: {
    display: 'flex',
    gap: '8px',
  },
  severityChip: {
    flex: 1,
    height: '38px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#fff',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  primaryButton: {
    width: '100%',
    height: '50px',
    backgroundColor: '#1A3A2A',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '500',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
  },
  primaryButtonFlex: {
    flex: 1,
    height: '50px',
    backgroundColor: '#1A3A2A',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '500',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
  },
  backButton: {
    height: '50px',
    width: '90px',
    backgroundColor: 'transparent',
    color: '#374151',
    fontSize: '15px',
    fontWeight: '500',
    borderRadius: '12px',
    border: '1px solid #D1D5DB',
    cursor: 'pointer',
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '8px',
  },
};
