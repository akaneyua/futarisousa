import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Book,
  Bookmark,
  Plus,
  KeyRound,
  Filter,
  X,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Check,
  FileDown,
  FileUp,
  Info,
  Users,
  Compass,
  Zap,
  LayoutGrid,
  List,
  Star,
  UserCheck,
  BookOpen,
  Database,
  HardDrive,
  Table,
  ScrollText,
  Save,
  ShieldCheck
} from 'lucide-react';
import { SituationInvestigation, SituationCategory, ActorType, CharacterClass, CharacterSkill, SituationVersatility, GuestCharacter, SessionSummary, SessionNote } from './types.ts';
import { INITIAL_SOURCE_BOOKS, INITIAL_TAG_LIST } from './initialData.ts';
import { ALL_CHARACTER_CLASSES, ALL_CHARACTER_SKILLS, AUTOMATIC_ACTIONS } from './characterData.ts';
import { INITIAL_GUEST_CHARACTERS, INITIAL_SESSION_SUMMARIES } from './initialGuestAndSummaryData.ts';
import { INITIAL_SESSION_NOTES } from './initialSessionNotes.ts';
import { SituationCard } from './components/SituationCard.tsx';
import { SituationQuickTableView } from './components/SituationQuickTableView.tsx';
import { SituationContentTableView } from './components/SituationContentTableView.tsx';
import { SituationDetail } from './components/SituationDetail.tsx';
import { EditSituationModal } from './components/EditSituationModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CharacterClassesView } from './components/CharacterClassesView.tsx';
import { ImportBackupModal } from './components/ImportBackupModal.tsx';
import { GuestsView } from './components/GuestsView.tsx';
import { SessionSummaryView } from './components/SessionSummaryView.tsx';
import { SessionNotesView } from './components/SessionNotesView.tsx';
import {
  savePersistentData,
  loadPersistentData,
  clearPersistentData,
  hasAnyData,
  AppDataBundle
} from './utils/persistentStorage.ts';

export default function App() {
  // Navigation Active Section: 'situations' | 'classes' | 'skills' | 'guests' | 'summaries' | 'session-notes'
  const [activeSection, setActiveSection] = useState<'situations' | 'classes' | 'skills' | 'guests' | 'summaries' | 'session-notes'>('situations');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Data state
  // Data state (starts completely blank as requested by user)
  const [situations, setSituations] = useState<SituationInvestigation[]>([]);
  const [characterClasses, setCharacterClasses] = useState<CharacterClass[]>([]);
  const [signatureSkills, setSignatureSkills] = useState<CharacterSkill[]>([]);
  const [autoSkills, setAutoSkills] = useState<CharacterSkill[]>([]);
  const [guests, setGuests] = useState<GuestCharacter[]>([]);
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([]);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [classesLoading, setClassesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Persistent Storage and Auto-Recovery States
  const isHydratedRef = useRef<boolean>(false);
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'restored'>('idle');

  // Authentication state - defaults to 'futarisousa' so editing/deleting is never blocked
  const [passkey, setPasskey] = useState<string>(() => {
    return localStorage.getItem('futarisousa_passkey') || 'futarisousa';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Selection & Modal states
  const [selectedSituationId, setSelectedSituationId] = useState<string | null>(null);
  const [editingSituation, setEditingSituation] = useState<SituationInvestigation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    isDanger?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Favorite (pinned) state stored in LocalStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('futarisousa_favs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // 'all', '共通', 'その他のシチュエーション', 'fav'
  const [selectedVersatility, setSelectedVersatility] = useState<string>('all'); // 'all', '高', '中', '特殊', '低'
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'contentTable'>('cards'); // 'cards' | 'table' | 'contentTable'
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [selectedActors, setSelectedActors] = useState<ActorType[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFiltersMobile, setShowFiltersMobile] = useState<boolean>(false);

  // Fetch situations from backend server
  const fetchSituations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/situations');
      if (!res.ok) throw new Error('シチュエーション一覧の取得に失敗しました');
      const data: SituationInvestigation[] = await res.json();
      setSituations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'データ通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // Fetch character classes from backend server
  const fetchClasses = async () => {
    setClassesLoading(true);
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data: CharacterClass[] = await res.json();
        if (Array.isArray(data)) {
          setCharacterClasses(data);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch character classes:', err);
    } finally {
      setClassesLoading(false);
    }
  };

  // Fetch signature skills from backend server
  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/skills');
      if (res.ok) {
        const data: CharacterSkill[] = await res.json();
        if (Array.isArray(data)) {
          setSignatureSkills(data);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch signature skills:', err);
    }
  };

  // Fetch automatic skills from backend server
  const fetchAutoSkills = async () => {
    try {
      const res = await fetch('/api/auto-skills');
      if (res.ok) {
        const data: CharacterSkill[] = await res.json();
        if (Array.isArray(data)) {
          setAutoSkills(data);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch automatic skills:', err);
    }
  };

  // Fetch guests from backend server
  const fetchGuests = async () => {
    try {
      const res = await fetch('/api/guests');
      if (res.ok) {
        const data: GuestCharacter[] = await res.json();
        if (Array.isArray(data)) {
          setGuests(data);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch guests:', err);
    }
  };

  // Fetch session summaries from backend server
  const fetchSessionSummaries = async () => {
    try {
      const res = await fetch('/api/session-summaries');
      if (res.ok) {
        const data: SessionSummary[] = await res.json();
        if (Array.isArray(data)) {
          setSessionSummaries(data);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch session summaries:', err);
    }
  };

  // Fetch session notes (便利帳: 用語・キャラ作成・小ネタ) from backend server
  const fetchSessionNotes = async () => {
    try {
      const res = await fetch('/api/session-notes');
      if (res.ok) {
        const data: SessionNote[] = await res.json();
        if (Array.isArray(data)) {
          setSessionNotes(data);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch session notes:', err);
    }
  };

  // Dual-Layer Persistence & Auto-Recovery Protocol
  useEffect(() => {
    let isMounted = true;

    const initializeAndSync = async () => {
      try {
        // Step 1: Immediately retrieve local persistent data from browser (IndexedDB & LocalStorage)
        const localData = await loadPersistentData();
        const localHasData = hasAnyData(localData);

        if (localHasData && localData && isMounted) {
          if (Array.isArray(localData.situations)) setSituations(localData.situations);
          if (Array.isArray(localData.characterClasses)) setCharacterClasses(localData.characterClasses);
          if (Array.isArray(localData.signatureSkills)) setSignatureSkills(localData.signatureSkills);
          if (Array.isArray(localData.autoSkills)) setAutoSkills(localData.autoSkills);
          if (Array.isArray(localData.guests)) setGuests(localData.guests);
          if (Array.isArray(localData.sessionSummaries)) setSessionSummaries(localData.sessionSummaries);
          if (Array.isArray(localData.sessionNotes)) setSessionNotes(localData.sessionNotes);
          if (localData.updatedAt) {
            try {
              const d = new Date(localData.updatedAt);
              setLastAutoSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            } catch {
              // ignore
            }
          }
          setLoading(false);
          setClassesLoading(false);
          setAutoSaveStatus('saved');
        }

        // Step 2: Concurrently fetch data from backend server
        const [
          resSituations,
          resClasses,
          resSkills,
          resAutoSkills,
          resGuests,
          resSummaries,
          resNotes
        ] = await Promise.allSettled([
          fetch('/api/situations').then((r) => (r.ok ? r.json() : [])),
          fetch('/api/classes').then((r) => (r.ok ? r.json() : [])),
          fetch('/api/skills').then((r) => (r.ok ? r.json() : [])),
          fetch('/api/auto-skills').then((r) => (r.ok ? r.json() : [])),
          fetch('/api/guests').then((r) => (r.ok ? r.json() : [])),
          fetch('/api/session-summaries').then((r) => (r.ok ? r.json() : [])),
          fetch('/api/session-notes').then((r) => (r.ok ? r.json() : []))
        ]);

        const srvSituations = resSituations.status === 'fulfilled' && Array.isArray(resSituations.value) ? resSituations.value : [];
        const srvClasses = resClasses.status === 'fulfilled' && Array.isArray(resClasses.value) ? resClasses.value : [];
        const srvSkills = resSkills.status === 'fulfilled' && Array.isArray(resSkills.value) ? resSkills.value : [];
        const srvAutoSkills = resAutoSkills.status === 'fulfilled' && Array.isArray(resAutoSkills.value) ? resAutoSkills.value : [];
        const srvGuests = resGuests.status === 'fulfilled' && Array.isArray(resGuests.value) ? resGuests.value : [];
        const srvSummaries = resSummaries.status === 'fulfilled' && Array.isArray(resSummaries.value) ? resSummaries.value : [];
        const srvNotes = resNotes.status === 'fulfilled' && Array.isArray(resNotes.value) ? resNotes.value : [];

        const serverBundle: AppDataBundle = {
          situations: srvSituations,
          characterClasses: srvClasses,
          signatureSkills: srvSkills,
          autoSkills: srvAutoSkills,
          guests: srvGuests,
          sessionSummaries: srvSummaries,
          sessionNotes: srvNotes,
          updatedAt: new Date().toISOString()
        };

        // Bidirectional resilient merge: never discard locally created items if server lacks them
        // 1. Session Summaries merge (by ID)
        const summariesMap = new Map<string, SessionSummary>();
        for (const s of srvSummaries) {
          summariesMap.set(s.id, s);
        }
        if (localData?.sessionSummaries && Array.isArray(localData.sessionSummaries)) {
          for (const s of localData.sessionSummaries) {
            if (!summariesMap.has(s.id)) {
              summariesMap.set(s.id, s);
            } else {
              const srvItem = summariesMap.get(s.id)!;
              const srvTime = srvItem.updatedAt ? new Date(srvItem.updatedAt).getTime() : 0;
              const locTime = s.updatedAt ? new Date(s.updatedAt).getTime() : 0;
              if (locTime > srvTime) {
                summariesMap.set(s.id, s);
              }
            }
          }
        }
        const mergedSummaries = Array.from(summariesMap.values());

        // 2. Guests merge (by ID, filtering fabricated dummies)
        const cleanLocalGuests = (localData?.guests || []).filter(
          (g) => !['guest-amamiya-shiori', 'guest-kanzaki-reiji', 'guest-kurosawa-yuma'].includes(g.id)
        );
        const guestsMap = new Map<string, GuestCharacter>();
        for (const g of srvGuests) {
          guestsMap.set(g.id, g);
        }
        for (const g of cleanLocalGuests) {
          if (!guestsMap.has(g.id)) {
            guestsMap.set(g.id, g);
          } else {
            const srvG = guestsMap.get(g.id)!;
            const srvTime = srvG.updatedAt ? new Date(srvG.updatedAt).getTime() : 0;
            const locTime = g.updatedAt ? new Date(g.updatedAt).getTime() : 0;
            if (locTime > srvTime) {
              guestsMap.set(g.id, g);
            }
          }
        }
        const mergedGuests = Array.from(guestsMap.values());

        // 3. Session Notes merge (by ID, filtering old fabricated dummies)
        const cleanLocalNotes = (localData?.sessionNotes || []).filter(
          (n) => !n.id.startsWith('note-term-') && n.id !== 'note-default'
        );
        const notesMap = new Map<string, SessionNote>();
        for (const n of srvNotes) {
          notesMap.set(n.id, n);
        }
        for (const n of cleanLocalNotes) {
          if (!notesMap.has(n.id)) {
            notesMap.set(n.id, n);
          } else {
            const srvN = notesMap.get(n.id)!;
            const srvTime = srvN.updatedAt ? new Date(srvN.updatedAt).getTime() : 0;
            const locTime = n.updatedAt ? new Date(n.updatedAt).getTime() : 0;
            if (locTime > srvTime) {
              notesMap.set(n.id, n);
            }
          }
        }
        const mergedNotes = Array.from(notesMap.values());

        // 4. Situations, Classes, Skills merge
        const situationsMap = new Map<string, SituationInvestigation>();
        for (const s of srvSituations) {
          situationsMap.set(s.id, s);
        }
        if (localData?.situations && Array.isArray(localData.situations)) {
          for (const s of localData.situations) {
            if (!situationsMap.has(s.id)) {
              situationsMap.set(s.id, s);
            } else {
              const srvS = situationsMap.get(s.id)!;
              const srvTime = srvS.updatedAt ? new Date(srvS.updatedAt).getTime() : 0;
              const locTime = s.updatedAt ? new Date(s.updatedAt).getTime() : 0;
              if (locTime > srvTime) {
                situationsMap.set(s.id, s);
              }
            }
          }
        }
        const mergedSituations = Array.from(situationsMap.values());

        // Classes merge
        const classesMap = new Map<string, CharacterClass>();
        for (const c of srvClasses) {
          classesMap.set(c.id, c);
        }
        if (localData?.characterClasses && Array.isArray(localData.characterClasses)) {
          for (const c of localData.characterClasses) {
            if (!classesMap.has(c.id)) {
              classesMap.set(c.id, c);
            } else {
              const srvC = classesMap.get(c.id)!;
              const srvTime = srvC.updatedAt ? new Date(srvC.updatedAt).getTime() : 0;
              const locTime = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
              if (locTime > srvTime) {
                classesMap.set(c.id, c);
              }
            }
          }
        }
        const mergedClasses = Array.from(classesMap.values());

        // Signature skills merge
        const skillsMap = new Map<string, CharacterSkill>();
        for (const sk of srvSkills) {
          skillsMap.set(sk.id, sk);
        }
        if (localData?.signatureSkills && Array.isArray(localData.signatureSkills)) {
          for (const sk of localData.signatureSkills) {
            if (!skillsMap.has(sk.id)) {
              skillsMap.set(sk.id, sk);
            } else {
              const srvSk = skillsMap.get(sk.id)!;
              const srvTime = srvSk.updatedAt ? new Date(srvSk.updatedAt).getTime() : 0;
              const locTime = sk.updatedAt ? new Date(sk.updatedAt).getTime() : 0;
              if (locTime > srvTime) {
                skillsMap.set(sk.id, sk);
              }
            }
          }
        }
        const mergedSkills = Array.from(skillsMap.values());

        // Auto skills merge
        const autoSkillsMap = new Map<string, CharacterSkill>();
        for (const ask of srvAutoSkills) {
          autoSkillsMap.set(ask.id, ask);
        }
        if (localData?.autoSkills && Array.isArray(localData.autoSkills)) {
          for (const ask of localData.autoSkills) {
            if (!autoSkillsMap.has(ask.id)) {
              autoSkillsMap.set(ask.id, ask);
            } else {
              const srvAsk = autoSkillsMap.get(ask.id)!;
              const srvTime = srvAsk.updatedAt ? new Date(srvAsk.updatedAt).getTime() : 0;
              const locTime = ask.updatedAt ? new Date(ask.updatedAt).getTime() : 0;
              if (locTime > srvTime) {
                autoSkillsMap.set(ask.id, ask);
              }
            }
          }
        }
        const mergedAutoSkills = Array.from(autoSkillsMap.values());

        const mergedBundle: AppDataBundle = {
          situations: mergedSituations,
          characterClasses: mergedClasses,
          signatureSkills: mergedSkills,
          autoSkills: mergedAutoSkills,
          guests: mergedGuests,
          sessionSummaries: mergedSummaries,
          sessionNotes: mergedNotes,
          updatedAt: new Date().toISOString()
        };

        if (isMounted) {
          setSituations(mergedSituations);
          setCharacterClasses(mergedClasses);
          setSignatureSkills(mergedSkills);
          setAutoSkills(mergedAutoSkills);
          setGuests(mergedGuests);
          setSessionSummaries(mergedSummaries);
          setSessionNotes(mergedNotes);
          await savePersistentData(mergedBundle);
          setLastAutoSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          setAutoSaveStatus('saved');
        }

        // If local storage had collections or items that the server was missing, push to server:
        const serverWasMissingData =
          mergedSituations.length > srvSituations.length ||
          mergedClasses.length > srvClasses.length ||
          mergedSkills.length > srvSkills.length ||
          mergedAutoSkills.length > srvAutoSkills.length ||
          mergedGuests.length > srvGuests.length ||
          mergedSummaries.length > srvSummaries.length ||
          mergedNotes.length > srvNotes.length ||
          mergedSummaries.some((s) => !srvSummaries.some((srv) => srv.id === s.id)) ||
          mergedGuests.some((g) => !srvGuests.some((srv) => srv.id === g.id)) ||
          mergedNotes.some((n) => !srvNotes.some((srv) => srv.id === n.id));

        if (serverWasMissingData) {
          try {
            await fetch('/api/backup/import', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-edit-passkey': passkey || 'futarisousa'
              },
              body: JSON.stringify(mergedBundle)
            });
            if (isMounted) {
              setStatusNotice('最新データをサーバーと自動同期しました');
              setTimeout(() => setStatusNotice(null), 3500);
            }
          } catch (syncErr) {
            console.warn('[Sync] Failed to push local data to server:', syncErr);
          }
        }
      } catch (err: any) {
        console.error('[PersistentStorage] Error during initialization:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setClassesLoading(false);
          isHydratedRef.current = true;
        }
      }
    };

    initializeAndSync();

    return () => {
      isMounted = false;
    };
  }, []);

  // Continuous Auto-Persistence: Debounced save whenever state changes
  useEffect(() => {
    if (!isHydratedRef.current) return;

    const currentBundle: AppDataBundle = {
      situations,
      characterClasses,
      signatureSkills,
      autoSkills,
      guests,
      sessionSummaries,
      sessionNotes,
      updatedAt: new Date().toISOString()
    };

    setAutoSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await savePersistentData(currentBundle);
        setLastAutoSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setAutoSaveStatus('saved');
      } catch (err) {
        console.warn('Auto-save error:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [situations, characterClasses, signatureSkills, autoSkills, guests, sessionSummaries, sessionNotes]);

  // Save favorites to LocalStorage
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('futarisousa_favs', JSON.stringify(updated));
      return updated;
    });
  };

  // Auth Handlers
  const handleAuthSuccess = (validPasskey: string) => {
    setPasskey(validPasskey);
    localStorage.setItem('futarisousa_passkey', validPasskey);
  };

  const handleLogout = () => {
    setPasskey('');
    localStorage.removeItem('futarisousa_passkey');
  };

  // Save situation handler (create or update)
  const handleSaveSituation = async (situation: SituationInvestigation) => {
    const isNew = !situations.some((s) => s.id === situation.id);
    const url = isNew ? '/api/situations' : `/api/situations/${situation.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-edit-passkey': passkey,
      },
      body: JSON.stringify(situation),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '保存に失敗しました');
    }

    const result = await res.json();
    if (isNew) {
      setSituations((prev) => [...prev, result.situation]);
    } else {
      setSituations((prev) =>
        prev.map((s) => (s.id === situation.id ? result.situation : s))
      );
    }
    // Update currently selected situation if viewing
    if (selectedSituationId === situation.id) {
      setSelectedSituationId(situation.id);
    }
  };

  // Delete situation handler
  const handleDeleteSituation = async (situationId: string) => {
    const res = await fetch(`/api/situations/${situationId}`, {
      method: 'DELETE',
      headers: {
        'x-edit-passkey': passkey,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'シチュエーションの削除に失敗しました');
    }

    setSituations((prev) => prev.filter((s) => s.id !== situationId));
    if (selectedSituationId === situationId) {
      setSelectedSituationId(null);
    }
  };

  // Reset situations to initial template
  const handleResetSituations = async () => {
    const res = await fetch('/api/situations/reset', {
      method: 'POST',
      headers: {
        'x-edit-passkey': passkey,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'シチュエーションの初期化に失敗しました');
    }

    await fetchSituations();
  };

  // Clear all data to completely blank state (まっさらな状態にする)
  const handleClearAllData = async () => {
    try {
      isHydratedRef.current = false;
      const res = await fetch('/api/all/clear', {
        method: 'POST',
        headers: {
          'x-edit-passkey': passkey,
        },
      });
      if (res.ok) {
        await clearPersistentData();
        setSituations([]);
        setCharacterClasses([]);
        setSignatureSkills([]);
        setAutoSkills([]);
        setGuests([]);
        setSessionSummaries([]);
        setSessionNotes([]);
        setSelectedSituationId(null);
        setSelectedClassId(null);
        setLastAutoSavedTime(null);
        setAutoSaveStatus('idle');
        setStatusNotice('全データをまっさらに初期化しました');
        setTimeout(() => setStatusNotice(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to clear all data:', err);
    } finally {
      setTimeout(() => {
        isHydratedRef.current = true;
      }, 500);
    }
  };

  // Save character class handler (create or update)
  const handleSaveClass = async (classData: CharacterClass) => {
    const isNew = !characterClasses.some((c) => c.id === classData.id);
    const url = isNew ? '/api/classes' : `/api/classes/${classData.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-edit-passkey': passkey,
      },
      body: JSON.stringify(classData),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'クラスの保存に失敗しました');
    }

    const result = await res.json();
    const saved = result.classItem || result.class;
    if (isNew) {
      setCharacterClasses((prev) => [...prev, saved]);
    } else {
      setCharacterClasses((prev) =>
        prev.map((c) => (c.id === classData.id ? saved : c))
      );
    }
  };

  // Delete character class handler
  const handleDeleteClass = async (classId: string) => {
    const res = await fetch(`/api/classes/${classId}`, {
      method: 'DELETE',
      headers: {
        'x-edit-passkey': passkey,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'クラスの削除に失敗しました');
    }

    setCharacterClasses((prev) => prev.filter((c) => c.id !== classId));
  };

  // Reset character classes handler
  const handleResetClasses = async () => {
    const res = await fetch('/api/classes/reset', {
      method: 'POST',
      headers: {
        'x-edit-passkey': passkey,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'クラスの初期化に失敗しました');
    }

    await fetchClasses();
  };

  // Save signature skill handler (create or update)
  const handleSaveSkill = async (skill: CharacterSkill) => {
    const isNew = !signatureSkills.some((s) => s.id === skill.id);
    const url = isNew ? '/api/skills' : `/api/skills/${skill.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-edit-passkey': passkey,
      },
      body: JSON.stringify(skill),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '固有アクションの保存に失敗しました');
    }

    const result = await res.json();
    if (isNew) {
      setSignatureSkills((prev) => [...prev, result.skill]);
    } else {
      setSignatureSkills((prev) =>
        prev.map((s) => (s.id === skill.id ? result.skill : s))
      );
    }
  };

  // Delete signature skill handler
  const handleDeleteSkill = async (skillId: string) => {
    const res = await fetch(`/api/skills/${skillId}`, {
      method: 'DELETE',
      headers: {
        'x-edit-passkey': passkey,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '固有アクションの削除に失敗しました');
    }

    setSignatureSkills((prev) => prev.filter((s) => s.id !== skillId));
  };

  // Reset signature skills handler
  const handleResetSkills = async () => {
    const res = await fetch('/api/skills/reset', {
      method: 'POST',
      headers: {
        'x-edit-passkey': passkey,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '固有アクションの初期化に失敗しました');
    }

    await fetchSkills();
  };

  // Save automatic skill handler (create or update)
  const handleSaveAutoSkill = async (skill: CharacterSkill) => {
    const isNew = !autoSkills.some((s) => s.id === skill.id);
    const url = isNew ? '/api/auto-skills' : `/api/auto-skills/${skill.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-edit-passkey': passkey,
      },
      body: JSON.stringify(skill),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '自動取得アクションの保存に失敗しました');
    }

    const result = await res.json();
    if (isNew) {
      setAutoSkills((prev) => [...prev, result.skill]);
    } else {
      setAutoSkills((prev) =>
        prev.map((s) => (s.id === skill.id ? result.skill : s))
      );
    }
  };

  // Delete automatic skill handler
  const handleDeleteAutoSkill = async (skillId: string) => {
    const res = await fetch(`/api/auto-skills/${skillId}`, {
      method: 'DELETE',
      headers: {
        'x-edit-passkey': passkey,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '自動取得アクションの削除に失敗しました');
    }

    setAutoSkills((prev) => prev.filter((s) => s.id !== skillId));
  };

  // Reset automatic skills handler
  const handleResetAutoSkills = async () => {
    const res = await fetch('/api/auto-skills/reset', {
      method: 'POST',
      headers: {
        'x-edit-passkey': passkey,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '自動取得アクションの初期化に失敗しました');
    }

    await fetchAutoSkills();
  };

  // --- Guests (ゲストNPC) Handlers ---
  const handleSaveGuest = async (guest: GuestCharacter) => {
    const isNew = !guests.some((g) => g.id === guest.id);
    const url = isNew ? '/api/guests' : `/api/guests/${guest.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-edit-passkey': passkey,
      },
      body: JSON.stringify(guest),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'ゲスト情報の保存に失敗しました');
    }

    const result = await res.json();
    if (isNew) {
      setGuests((prev) => [...prev, result.guest]);
    } else {
      setGuests((prev) =>
        prev.map((g) => (g.id === guest.id ? result.guest : g))
      );
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    const res = await fetch(`/api/guests/${guestId}`, {
      method: 'DELETE',
      headers: {
        'x-edit-passkey': passkey,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'ゲストの削除に失敗しました');
    }

    setGuests((prev) => prev.filter((g) => g.id !== guestId));
  };

  const handleResetGuests = async () => {
    const res = await fetch('/api/guests/reset', {
      method: 'POST',
      headers: {
        'x-edit-passkey': passkey,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'ゲスト情報の初期化に失敗しました');
    }

    await fetchGuests();
  };

  // --- Session Summaries (5フェイズ進行サマリー) Handlers ---
  const handleSaveSummary = async (summary: SessionSummary) => {
    // 1. Immediately update local React state so UI reflects changes without delay
    setSessionSummaries((prev) => {
      const exists = prev.some((s) => s.id === summary.id);
      if (exists) {
        return prev.map((s) => (s.id === summary.id ? summary : s));
      } else {
        return [...prev, summary];
      }
    });

    // 2. Persist to server
    const isNew = !sessionSummaries.some((s) => s.id === summary.id);
    const url = isNew ? '/api/session-summaries' : `/api/session-summaries/${summary.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-edit-passkey': passkey || 'futarisousa',
      },
      body: JSON.stringify(summary),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'サーバーへの進行サマリー保存に失敗しました');
    }

    const result = await res.json();
    let nextSummaries: SessionSummary[];
    if (Array.isArray(result.summaries)) {
      nextSummaries = result.summaries;
    } else {
      const savedItem = result.sessionSummary || summary;
      const exists = sessionSummaries.some((s) => s.id === savedItem.id);
      nextSummaries = exists
        ? sessionSummaries.map((s) => (s.id === savedItem.id ? savedItem : s))
        : [...sessionSummaries, savedItem];
    }

    setSessionSummaries(nextSummaries);
    try {
      await savePersistentData({
        situations,
        characterClasses,
        signatureSkills,
        autoSkills,
        guests,
        sessionSummaries: nextSummaries,
        sessionNotes,
        updatedAt: new Date().toISOString()
      });
      setLastAutoSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setAutoSaveStatus('saved');
    } catch (saveErr) {
      console.warn('Local save warning for summaries:', saveErr);
    }
  };

  const handleDeleteSummary = async (summaryId: string) => {
    const res = await fetch(`/api/session-summaries/${summaryId}`, {
      method: 'DELETE',
      headers: {
        'x-edit-passkey': passkey || 'futarisousa',
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'セッションサマリーの削除に失敗しました');
    }

    const result = await res.json().catch(() => ({}));
    if (Array.isArray(result.summaries)) {
      setSessionSummaries(result.summaries);
    } else {
      setSessionSummaries((prev) => {
        const next = prev.filter((s) => s.id !== summaryId);
        return next.length > 0 ? next : INITIAL_SESSION_SUMMARIES;
      });
    }
  };

  const handleResetSummaries = async () => {
    const res = await fetch('/api/session-summaries/reset', {
      method: 'POST',
      headers: {
        'x-edit-passkey': passkey || 'futarisousa',
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'セッションサマリーの初期化に失敗しました');
    }

    await fetchSessionSummaries();
  };

  // --- Session Notes (便利帳: 用語・キャラ作成・小ネタ) Handlers ---
  const handleSaveNote = async (note: SessionNote) => {
    const isNew = !sessionNotes.some((n) => n.id === note.id);
    const url = isNew ? '/api/session-notes' : `/api/session-notes/${note.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-edit-passkey': passkey,
      },
      body: JSON.stringify(note),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '便利帳項目の保存に失敗しました');
    }

    const result = await res.json();
    if (isNew) {
      setSessionNotes((prev) => [...prev, result.note]);
    } else {
      setSessionNotes((prev) =>
        prev.map((n) => (n.id === note.id ? result.note : n))
      );
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const res = await fetch(`/api/session-notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        'x-edit-passkey': passkey,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '便利帳項目の削除に失敗しました');
    }

    setSessionNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const handleBatchSaveNotes = async (updatedNotes: SessionNote[]) => {
    const res = await fetch('/api/session-notes-batch', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-edit-passkey': passkey,
      },
      body: JSON.stringify(updatedNotes),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '便利帳タグの更新に失敗しました');
    }

    const map = new Map(updatedNotes.map((n) => [n.id, n]));
    setSessionNotes((prev) =>
      prev.map((n) => (map.has(n.id) ? { ...n, ...map.get(n.id)! } : n))
    );
  };

  const handleResetNotes = async () => {
    const res = await fetch('/api/session-notes/reset', {
      method: 'POST',
      headers: {
        'x-edit-passkey': passkey,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '便利帳項目の初期化に失敗しました');
    }

    await fetchSessionNotes();
  };

  // Filter toggles
  const toggleBookFilter = (book: string) => {
    setSelectedBooks((prev) =>
      prev.includes(book) ? prev.filter((b) => b !== book) : [...prev, book]
    );
  };

  const toggleActorFilter = (actor: ActorType) => {
    setSelectedActors((prev) =>
      prev.includes(actor) ? prev.filter((a) => a !== actor) : [...prev, actor]
    );
  };

  const toggleTagFilter = (tag: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedVersatility('all');
    setSelectedBooks([]);
    setSelectedActors([]);
    setSelectedTags([]);
  };

  // Save / Preserve current state (現状を保管: サーバー・ブラウザ・JSONバックアップの確実な三重保管)
  const handleSaveCurrentState = async () => {
    try {
      const now = new Date();
      const currentBundle: AppDataBundle = {
        situations,
        characterClasses,
        signatureSkills,
        autoSkills,
        guests,
        sessionSummaries,
        sessionNotes,
        updatedAt: now.toISOString()
      };

      setAutoSaveStatus('saving');

      // 1. Save to browser persistent storage (IndexedDB + LocalStorage)
      await savePersistentData(currentBundle);
      setLastAutoSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setAutoSaveStatus('saved');

      // 2. Sync to server backend files
      try {
        await fetch('/api/backup/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-edit-passkey': passkey || 'futarisousa',
          },
          body: JSON.stringify(currentBundle),
        });
      } catch (srvErr) {
        console.warn('Server sync warning:', srvErr);
      }

      // 3. Download JSON backup file for external safe storage
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
        exportedAt: now.toISOString(),
        ...currentBundle
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `futarisousa-backup-${now.toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatusNotice('現在の全データ（シチュエーション・クラス・アクション・ゲスト・サマリー・便利帳）を正常に保管しました');
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to save current state:', err);
      setStatusNotice('保管中にエラーが発生しました: ' + (err.message || ''));
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  // Export JSON (Complete backup helper)
  const handleExportJSON = () => {
    handleSaveCurrentState();
  };

  // Import JSON Success handler
  const handleImportSuccess = (resultData: {
    situations: SituationInvestigation[];
    characterClasses: CharacterClass[];
    signatureSkills: CharacterSkill[];
    autoSkills: CharacterSkill[];
    guests?: GuestCharacter[];
    sessionSummaries?: SessionSummary[];
    sessionNotes?: SessionNote[];
    message: string;
  }) => {
    if (resultData.situations) setSituations(resultData.situations);
    if (resultData.characterClasses) setCharacterClasses(resultData.characterClasses);
    if (resultData.signatureSkills) setSignatureSkills(resultData.signatureSkills);
    if (resultData.autoSkills) setAutoSkills(resultData.autoSkills);
    if (resultData.guests) setGuests(resultData.guests);
    if (resultData.sessionSummaries) setSessionSummaries(resultData.sessionSummaries);
    if (resultData.sessionNotes) setSessionNotes(resultData.sessionNotes);
    setStatusNotice(resultData.message || 'バックアップから正常に復元されました');
    setTimeout(() => {
      setStatusNotice(null);
    }, 5000);
  };

  const totalSkillsCount = useMemo(() => {
    return signatureSkills.length;
  }, [signatureSkills]);

  const totalAutoSkillsCount = useMemo(() => {
    return autoSkills.length;
  }, [autoSkills]);

  // Filtered Situations
  const filteredSituations = useMemo(() => {
    return situations.filter((item) => {
      // Category filter
      if (selectedCategory === '共通' && item.category !== '共通') return false;
      if (selectedCategory === 'その他のシチュエーション' && item.category !== 'その他のシチュエーション') return false;
      if (selectedCategory === 'fav' && !favorites.includes(item.id)) return false;

      // Versatility filter
      if (selectedVersatility !== 'all') {
        let v = item.versatility as string;
        if (v === '高') v = 'あり';
        else if (v === '中') v = '条件付きあり';
        else if (v === '特殊') v = '条件付きなし';
        else if (v === '低') v = 'なし';
        if (v !== selectedVersatility) {
          return false;
        }
      }

      // Book filter (matches either sourceBook or sourceBook2)
      if (selectedBooks.length > 0) {
        const matchBook1 = selectedBooks.includes(item.sourceBook);
        const matchBook2 = item.sourceBook2 ? selectedBooks.includes(item.sourceBook2) : false;
        if (!matchBook1 && !matchBook2) {
          return false;
        }
      }

      // Actor filter
      if (selectedActors.length > 0 && !selectedActors.includes(item.actorType)) {
        return false;
      }

      // Tag filter (AND match)
      if (selectedTags.length > 0) {
        const itemTags = Array.isArray(item.tags) ? item.tags : [];
        const hasAllTags = selectedTags.every((t) => itemTags.includes(t));
        if (!hasAllTags) return false;
      }

      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const itemTags = Array.isArray(item.tags) ? item.tags : [];
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchAbbr = item.abbreviation ? item.abbreviation.toLowerCase().includes(q) : false;
        const matchBook =
          (item.sourceBook || '').toLowerCase().includes(q) ||
          (item.page && item.page.toLowerCase().includes(q)) ||
          (item.sourceBook2 && item.sourceBook2.toLowerCase().includes(q)) ||
          (item.page2 && item.page2.toLowerCase().includes(q));
        const matchSummary = (item.summary || '').toLowerCase().includes(q);
        const matchTiming = (item.usageTiming || '').toLowerCase().includes(q);
        const matchDetails = item.details?.toLowerCase().includes(q);
        const matchTags = itemTags.some((t) => (t || '').toLowerCase().includes(q));

        if (!matchName && !matchAbbr && !matchBook && !matchSummary && !matchTiming && !matchDetails && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }, [situations, selectedCategory, selectedVersatility, favorites, selectedBooks, selectedActors, selectedTags, searchQuery]);

  const selectedSituation = useMemo(() => {
    return situations.find((s) => s.id === selectedSituationId) || null;
  }, [situations, selectedSituationId]);

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedVersatility !== 'all' ? 1 : 0) +
    selectedBooks.length +
    selectedActors.length +
    selectedTags.length +
    (searchQuery ? 1 : 0);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans flex flex-col selection:bg-amber-200">
      {/* App Header */}
      <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-amber-700/80 flex items-center justify-center font-serif font-bold text-amber-100 text-base shadow-inner">
              捜
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-detective-title tracking-wide text-amber-100">
                フタリソウサ
              </h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 text-xs">
            {/* Auto-Save & Persistent Protection Badge */}
            <div
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-stone-800/90 border border-stone-700/80 text-[11px] font-sans select-none"
              title="ブラウザ(IndexedDB/LocalStorage)とサーバーの両方に常時二重保存されています。タブを更新したり一定期間後に再訪してもデータは保持されます。"
            >
              {autoSaveStatus === 'saving' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span className="text-amber-300 font-medium">保存中...</span>
                </>
              ) : autoSaveStatus === 'restored' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span className="text-sky-300 font-medium hidden sm:inline">自動復元・同期済</span>
                  <span className="text-sky-300 font-medium sm:hidden">復元済</span>
                </>
              ) : lastAutoSavedTime ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-stone-300 hidden md:inline">
                    自動保存済 <span className="text-stone-400 font-mono text-[10px]">({lastAutoSavedTime})</span>
                  </span>
                  <span className="text-stone-300 md:hidden">保存済</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-stone-400 hidden sm:inline">保護中</span>
                  <span className="text-stone-400 sm:hidden">保護中</span>
                </>
              )}
            </div>

            {/* Current State Save Button (現状を保管) */}
            <button
              type="button"
              id="save-current-state-btn"
              onClick={handleSaveCurrentState}
              title="現在の全データ（シチュエーション・クラス・アクション・ゲスト・サマリー・便利帳）をサーバー・ブラウザ・ファイルに確実に保管"
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-50 border border-emerald-600 font-serif flex items-center gap-1.5 transition-colors text-xs cursor-pointer shadow-xs font-bold"
            >
              <Save className="w-3.5 h-3.5 text-emerald-200 stroke-[2.2]" />
              <span>現状を保管</span>
            </button>

            {/* Import / Restore JSON button */}
            <button
              type="button"
              id="import-json-btn"
              onClick={() => setIsImportModalOpen(true)}
              title="保存したバックアップJSONファイルからデータを復元"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1 transition-colors text-xs cursor-pointer"
            >
              <FileUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">復元</span>
            </button>

            {/* New Situation button (visible when on situations tab) */}
            {activeSection === 'situations' && (
              <button
                type="button"
                id="add-situation-btn"
                onClick={() => {
                  setEditingSituation(null);
                  setIsEditModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center gap-1 transition-colors shadow-xs text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">新規追加</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Navigation Tabs (3 Sections) */}
        <div className="bg-stone-950/80 border-t border-stone-800/80 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto text-xs font-serif py-1.5">
            <button
              type="button"
              id="tab-situations-btn"
              onClick={() => setActiveSection('situations')}
              className={`px-3.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                activeSection === 'situations'
                  ? 'bg-amber-900 text-amber-100 shadow-xs border border-amber-700'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>シチュエーション調査 ({situations.length}種)</span>
            </button>

            <button
              type="button"
              id="tab-classes-btn"
              onClick={() => setActiveSection('classes')}
              className={`px-3.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                activeSection === 'classes'
                  ? 'bg-amber-900 text-amber-100 shadow-xs border border-amber-700'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>クラス調書（探偵・助手・刑事） ({characterClasses.length}種)</span>
            </button>

            <button
              type="button"
              id="tab-skills-btn"
              onClick={() => setActiveSection('skills')}
              className={`px-3.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                activeSection === 'skills'
                  ? 'bg-amber-900 text-amber-100 shadow-xs border border-amber-700'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>固有アクション ({totalSkillsCount}種)</span>
            </button>

            <button
              type="button"
              id="tab-guests-btn"
              onClick={() => setActiveSection('guests')}
              className={`px-3.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                activeSection === 'guests'
                  ? 'bg-amber-900 text-amber-100 shadow-xs border border-amber-700'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>ゲスト調書（NPC） ({guests.length}名)</span>
            </button>

            <button
              type="button"
              id="tab-summaries-btn"
              onClick={() => setActiveSection('summaries')}
              className={`px-3.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                activeSection === 'summaries'
                  ? 'bg-amber-900 text-amber-100 shadow-xs border border-amber-700'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5 text-amber-400" />
              <span>進行サマリー（5フェイズ）</span>
            </button>

            <button
              type="button"
              id="tab-session-notes-btn"
              onClick={() => setActiveSection('session-notes')}
              className={`px-3.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                activeSection === 'session-notes'
                  ? 'bg-amber-900 text-amber-100 shadow-xs border border-amber-700'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>セッション便利帳（用語・小ネタ） ({sessionNotes.length}件)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 py-4 sm:py-6 flex-1 flex flex-col gap-4">
        {/* Status Notification Toast */}
        {statusNotice && (
          <div className="p-3.5 bg-emerald-950/90 border border-emerald-700/80 rounded-xl text-emerald-200 text-xs sm:text-sm font-serif flex items-center justify-between shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="text-emerald-400 hover:text-emerald-100 p-1 rounded hover:bg-emerald-900/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeSection === 'guests' ? (
          <GuestsView
            guests={guests}
            onSaveGuest={handleSaveGuest}
            onDeleteGuest={handleDeleteGuest}
            onResetGuests={handleResetGuests}
            isEditorAuthenticated={true}
            passkey={passkey}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        ) : activeSection === 'summaries' ? (
          <SessionSummaryView
            summaries={sessionSummaries}
            onSaveSummary={handleSaveSummary}
            onDeleteSummary={handleDeleteSummary}
            onResetSummaries={handleResetSummaries}
            isEditorAuthenticated={true}
            passkey={passkey}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        ) : activeSection === 'session-notes' ? (
          <SessionNotesView
            notes={sessionNotes}
            onSaveNote={handleSaveNote}
            onBatchUpdateNotes={handleBatchSaveNotes}
            onDeleteNote={handleDeleteNote}
            onResetNotes={handleResetNotes}
            isEditorAuthenticated={true}
            passkey={passkey}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        ) : activeSection === 'classes' ? (
          <CharacterClassesView
            situations={situations}
            characterClasses={characterClasses}
            signatureSkills={signatureSkills}
            autoSkills={autoSkills}
            viewTab="classes"
            selectedClassId={selectedClassId}
            onSelectClassId={(id) => setSelectedClassId(id)}
            onSelectSituation={(sit) => {
              setSelectedSituationId(sit.id);
            }}
            onSaveClass={handleSaveClass}
            onDeleteClass={handleDeleteClass}
            onResetClasses={handleResetClasses}
            onSaveSkill={handleSaveSkill}
            onDeleteSkill={handleDeleteSkill}
            onResetSkills={handleResetSkills}
            onSaveAutoSkill={handleSaveAutoSkill}
            onDeleteAutoSkill={handleDeleteAutoSkill}
            onResetAutoSkills={handleResetAutoSkills}
            isEditorAuthenticated={true}
            passkey={passkey}
          />
        ) : activeSection === 'skills' ? (
          <CharacterClassesView
            situations={situations}
            characterClasses={characterClasses}
            signatureSkills={signatureSkills}
            autoSkills={autoSkills}
            viewTab="skills"
            onSwitchToTab={(tab) => {
              if (tab === 'classes') setActiveSection('classes');
              else if (tab === 'skills') setActiveSection('skills');
            }}
            onSwitchToClasses={(clsId) => {
              if (clsId) setSelectedClassId(clsId);
              setActiveSection('classes');
            }}
            onSelectSituation={(sit) => {
              setSelectedSituationId(sit.id);
            }}
            onSaveClass={handleSaveClass}
            onDeleteClass={handleDeleteClass}
            onResetClasses={handleResetClasses}
            onSaveSkill={handleSaveSkill}
            onDeleteSkill={handleDeleteSkill}
            onResetSkills={handleResetSkills}
            onSaveAutoSkill={handleSaveAutoSkill}
            onDeleteAutoSkill={handleDeleteAutoSkill}
            onResetAutoSkills={handleResetAutoSkills}
            isEditorAuthenticated={true}
            passkey={passkey}
          />
        ) : (
          <>
            {/* Search & Quick Filter Bar */}
            <section className="bg-white rounded-xl shadow-xs border border-stone-200/90 p-3 sm:p-4 space-y-3">

          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="main-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="シチュエーション名、状況、タグ、キーワード（閉鎖、警察、探偵、NPC など）で即座に検索…"
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-stone-50 hover:bg-stone-50/80 focus:bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 focus:outline-none transition-all placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Category Chips (One-tap for smartphone reach) */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs font-serif">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-stone-900 text-amber-200 shadow-xs border border-amber-800/40'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                全捜査項目 ({situations.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('共通')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors shrink-0 ${
                  selectedCategory === '共通'
                    ? 'bg-amber-950 text-amber-200 shadow-xs border border-amber-700'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                【共通】捜査 ({situations.filter((s) => s.category === '共通').length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('その他のシチュエーション')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors shrink-0 ${
                  selectedCategory === 'その他のシチュエーション'
                    ? 'bg-stone-800 text-amber-100 shadow-xs border border-stone-600'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                その他のシチュエーション (
                {situations.filter((s) => s.category === 'その他のシチュエーション').length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('fav')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 shrink-0 ${
                  selectedCategory === 'fav'
                    ? 'bg-amber-700 text-white shadow-xs border border-amber-800'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                重要証拠（保存済） ({favorites.length})
              </button>
            </div>

            {/* Mobile Filter Toggle & Clear */}
            <div className="flex items-center gap-2 text-xs ml-auto">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  id="clear-all-filters-btn"
                  onClick={clearAllFilters}
                  className="text-stone-500 hover:text-stone-900 flex items-center gap-1 px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  条件解除 ({activeFilterCount})
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                className={`sm:hidden px-2.5 py-1 rounded border flex items-center gap-1 text-xs font-medium ${
                  showFiltersMobile || selectedBooks.length > 0 || selectedTags.length > 0
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-stone-100 border-stone-300 text-stone-700'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>絞り込み詳細</span>
              </button>
            </div>
          </div>

          {/* Collapsible Filter Details Section (Visible on desktop or when expanded on mobile) */}
          <div className={`${showFiltersMobile ? 'block' : 'hidden sm:block'} pt-3 border-t border-stone-100 space-y-3`}>
            {/* Row 1: Source Books filter */}
            <div className="text-xs">
              <span className="font-bold text-stone-700 mr-2 inline-flex items-center gap-1 mb-1">
                <Book className="w-3.5 h-3.5 text-stone-500" />
                収録作品で絞り込み:
              </span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {INITIAL_SOURCE_BOOKS.map((book) => {
                  const isSelected = selectedBooks.includes(book);
                  return (
                    <button
                      key={book}
                      type="button"
                      onClick={() => toggleBookFilter(book)}
                      className={`px-2 py-1 rounded text-xs transition-colors border ${
                        isSelected
                          ? 'bg-amber-800 text-amber-50 border-amber-800 font-medium'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {book}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Versatility filter */}
            <div className="text-xs">
              <span className="font-bold text-stone-700 mr-2 inline-flex items-center gap-1 mb-1">
                <Compass className="w-3.5 h-3.5 text-amber-700" />
                汎用性で絞り込み:
              </span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {[
                  { key: 'all', label: 'すべて' },
                  { key: 'あり', label: 'あり (王道捜査)' },
                  { key: '条件付きあり', label: '条件付きあり (定番)' },
                  { key: '条件付きなし', label: '条件付きなし (特殊展開)' },
                  { key: 'なし', label: 'なし (限定)' },
                ].map((v) => {
                  const isSelected = selectedVersatility === v.key;
                  return (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => setSelectedVersatility(v.key)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                        isSelected
                          ? 'bg-amber-900 text-amber-100 border-amber-900 font-bold shadow-2xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Actor Type & Primary Tags */}
            <div className="text-xs flex flex-wrap items-center gap-x-4 gap-y-2">
              <div>
                <span className="font-bold text-stone-700 mr-1">参加形態:</span>
                <div className="inline-flex flex-wrap gap-1">
                  {(['二人で使う', '探偵だけ', '助手だけ', 'NPCが登場する'] as ActorType[]).map((actor) => {
                    const isSelected = selectedActors.includes(actor);
                    return (
                      <button
                        key={actor}
                        type="button"
                        onClick={() => toggleActorFilter(actor)}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${
                          isSelected
                            ? 'bg-stone-800 text-white border-stone-800 font-medium'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {actor}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="font-bold text-stone-700 mr-1">タグ:</span>
                <div className="inline-flex flex-wrap gap-1">
                  {INITIAL_TAG_LIST.filter((t) => !['二人で使う', '探偵だけ', '助手だけ', 'NPCが登場する'].includes(t)).map(
                    (tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={(e) => toggleTagFilter(tag, e)}
                          className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors ${
                            isSelected
                              ? 'bg-amber-100 border-amber-400 text-amber-900 font-medium'
                              : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          #{tag}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* List Section */}
        <section className="flex-1">
          {/* Results count & View Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 mb-3 px-1">
            <div className="flex items-center gap-2">
              <span>
                該当件数: <span className="font-bold text-stone-800 text-sm">{filteredSituations.length}</span> 件
              </span>
              {searchQuery && <span className="text-stone-600">（「{searchQuery}」の検索結果）</span>}
              {selectedVersatility !== 'all' && (
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-300">
                  汎用性: {selectedVersatility}
                </span>
              )}
            </div>

            {/* View Mode Toggle: Cards vs Quick Table vs Content Table */}
            <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-lg border border-stone-300 flex-wrap">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="カード形式で表示"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>カード</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="概要・汎用性の早見表形式で表示"
              >
                <List className="w-3.5 h-3.5" />
                <span>早見表</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('contentTable')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'contentTable'
                    ? 'bg-amber-900 text-amber-100 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="1D6出目の題名・情景描写・判定処理を表形式で横断表示"
              >
                <Table className="w-3.5 h-3.5 text-amber-500" />
                <span>内容表（1D6詳細）</span>
              </button>
            </div>
          </div>

          {/* Loading / Error states */}
          {loading ? (
            <div className="py-20 text-center text-stone-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-700" />
              シチュエーション捜査データを読み込み中…
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center text-rose-800 text-sm">
              <p className="font-bold mb-1">データの取得に失敗しました</p>
              <p className="text-xs mb-3">{error}</p>
              <button
                type="button"
                onClick={fetchSituations}
                className="px-4 py-1.5 bg-rose-700 text-white rounded text-xs font-medium"
              >
                再読み込み
              </button>
            </div>
          ) : filteredSituations.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-10 text-center space-y-3">
              <Compass className="w-8 h-8 mx-auto text-amber-700/60" />
              <p className="text-base font-bold text-stone-800">
                {situations.length === 0
                  ? 'シチュエーション捜査データはまだ登録されていません（まっさらな状態です）'
                  : '該当するシチュエーション捜査が見つかりませんでした'}
              </p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {situations.length === 0
                  ? '「＋ 新規シチュエーション作成」から独自の捜査表を登録してください。'
                  : '別のキーワードやタグで検索するか、フィルター条件を解除してお試しください。'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSituation(null);
                    setIsEditModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>＋ 新規シチュエーション作成</span>
                </button>
                {situations.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex items-center px-4 py-2 bg-stone-800 text-stone-100 rounded text-xs font-medium hover:bg-stone-900 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    絞り込み条件をリセット
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'contentTable' ? (
            /* Content Table / 1D6 Details */
            <SituationContentTableView
              situations={filteredSituations}
              selectedSituationId={selectedSituationId || undefined}
              favorites={favorites}
              onSelect={(sit) => setSelectedSituationId(sit.id)}
              onToggleFavorite={(id, e) => toggleFavorite(id, e)}
            />
          ) : viewMode === 'table' ? (
            /* Table / Quick View */
            <SituationQuickTableView
              situations={filteredSituations}
              selectedSituationId={selectedSituationId || undefined}
              favorites={favorites}
              onSelect={(sit) => setSelectedSituationId(sit.id)}
              onToggleFavorite={(id, e) => toggleFavorite(id, e)}
            />
          ) : (
            /* Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSituations.map((sit) => (
                <SituationCard
                  key={sit.id}
                  situation={sit}
                  isSelected={selectedSituationId === sit.id}
                  isFavorite={favorites.includes(sit.id)}
                  onClick={() => setSelectedSituationId(sit.id)}
                  onToggleFavorite={(e) => toggleFavorite(sit.id, e)}
                  onTagClick={(tag, e) => toggleTagFilter(tag, e)}
                />
              ))}
            </div>
          )}
        </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-4 border-t border-stone-800 text-center mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            『バディサスペンスTRPG フタリソウサ』（冒険企画局 / 平野累次 著）非公式シチュエーション整理ツール
          </p>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-stone-400">オンライン共有対応</span>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="text-amber-400 hover:underline"
            >
              {passkey ? '編集パスキー管理' : '特定人物の編集ログイン'}
            </button>
          </div>
        </div>
      </footer>

      {/* Detail Slide/Modal Sheet */}
      {selectedSituation && (
        <SituationDetail
          situation={selectedSituation}
          onClose={() => setSelectedSituationId(null)}
          isFavorite={favorites.includes(selectedSituation.id)}
          onToggleFavorite={() => toggleFavorite(selectedSituation.id)}
          onOpenEdit={() => {
            setEditingSituation(selectedSituation);
            setIsEditModalOpen(true);
          }}
          isEditorAuthenticated={true}
          onTagClick={(tag) => toggleTagFilter(tag)}
        />
      )}


      {/* Edit Situation Modal */}
      {isEditModalOpen && (
        <EditSituationModal
          situation={editingSituation}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingSituation(null);
          }}
          onSave={handleSaveSituation}
          passkey={passkey}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        currentPasskey={passkey}
        onLogout={handleLogout}
      />

      {/* Import Backup Modal */}
      <ImportBackupModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        passkey={passkey}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-stone-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl text-stone-100 font-serif">
            <h3 className="text-base font-bold text-amber-200">{confirmDialog.title}</h3>
            <p className="text-xs text-stone-300 leading-relaxed whitespace-pre-line">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-serif transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={async () => {
                  const fn = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await fn();
                }}
                className={`px-4 py-1.5 rounded-lg font-bold text-xs font-serif transition-colors cursor-pointer shadow-xs ${
                  confirmDialog.isDanger
                    ? 'bg-rose-700 hover:bg-rose-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                }`}
              >
                {confirmDialog.confirmLabel || '実行する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
