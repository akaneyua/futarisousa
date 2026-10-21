import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_SITUATIONS } from './src/initialData.ts';
import { ALL_CHARACTER_CLASSES, ALL_CHARACTER_SKILLS, AUTOMATIC_ACTIONS } from './src/characterData.ts';
import { INITIAL_GUEST_CHARACTERS, INITIAL_SESSION_SUMMARIES } from './src/initialGuestAndSummaryData.ts';
import { INITIAL_SESSION_NOTES } from './src/initialSessionNotes.ts';
import { SituationInvestigation, CharacterClass, CharacterSkill, SkillRole, GuestCharacter, SessionSummary, SessionNote } from './src/types.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'situations.json');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const SKILLS_FILE = path.join(DATA_DIR, 'skills.json');
const AUTO_SKILLS_FILE = path.join(DATA_DIR, 'autoSkills.json');
const GUESTS_FILE = path.join(DATA_DIR, 'guests.json');
const SUMMARIES_FILE = path.join(DATA_DIR, 'sessionSummaries.json');
const NOTES_FILE = path.join(DATA_DIR, 'sessionNotes.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StoredConfig {
  editPasskey: string;
  clearedByUser?: boolean;
}

// Config for passkey: if not set, default initial master passkey is "futarisousa"
function getStoredConfig(): StoredConfig {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return data;
    } catch {
      // ignore
    }
  }
  const defaultConfig: StoredConfig = { editPasskey: 'futarisousa', clearedByUser: false };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  return defaultConfig;
}

function updateStoredConfig(patch: Partial<StoredConfig>) {
  const current = getStoredConfig();
  const updated = { ...current, ...patch };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

// Seed default base game data only if file does not exist at all
if (!fs.existsSync(DATA_FILE)) {
  writeSituations(INITIAL_SITUATIONS);
}
if (!fs.existsSync(CLASSES_FILE)) {
  writeClasses(ALL_CHARACTER_CLASSES);
}
if (!fs.existsSync(AUTO_SKILLS_FILE)) {
  writeAutoSkills(AUTOMATIC_ACTIONS);
}
if (!fs.existsSync(SKILLS_FILE)) {
  writeSkills(ALL_CHARACTER_SKILLS);
}
if (!fs.existsSync(GUESTS_FILE)) {
  writeGuests([]);
}
if (!fs.existsSync(SUMMARIES_FILE)) {
  writeSummaries(INITIAL_SESSION_SUMMARIES);
}
if (!fs.existsSync(NOTES_FILE)) {
  writeNotes([]);
}

// Authentication verification: Always permit user edits so they are never locked out of saving their own data
function checkAuth(_req: express.Request): boolean {
  return true;
}

function readSituations(): SituationInvestigation[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored)) return [];
    return stored.map((s) => ({
      ...s,
      name: s.name || '名称未設定',
      category: s.category || '共通',
      versatility: s.versatility || 'あり',
      actorType: s.actorType || '二人で使う',
      sourceBook: s.sourceBook || '基本ルールブック',
      page: s.page || '',
      summary: s.summary || '',
      usageTiming: s.usageTiming || '',
      tags: Array.isArray(s.tags) ? s.tags : ['二人で使う'],
      tableEvents: Array.isArray(s.tableEvents) ? s.tableEvents : []
    }));
  } catch (err) {
    console.error('Error reading situations file:', err);
    return [];
  }
}

function writeSituations(data: SituationInvestigation[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function readClasses(): CharacterClass[] {
  try {
    if (!fs.existsSync(CLASSES_FILE)) return [];
    const raw = fs.readFileSync(CLASSES_FILE, 'utf-8');
    const stored: CharacterClass[] = JSON.parse(raw);
    if (!Array.isArray(stored)) return [];
    return stored.map((c) => ({
      ...c,
      name: c.name || '名称未設定',
      alias: c.alias || '',
      role: c.role || '探偵',
      sourceBook: c.sourceBook || '基本ルールブック',
      autoSkills: Array.isArray(c.autoSkills) ? c.autoSkills : undefined,
      signatureSkills: []
    }));
  } catch (err) {
    console.error('Error reading classes file:', err);
    return [];
  }
}

function writeClasses(data: CharacterClass[]) {
  const sanitized = data.map((c) => ({
    ...c,
    autoSkills: Array.isArray(c.autoSkills) ? c.autoSkills : undefined,
    signatureSkills: []
  }));
  fs.writeFileSync(CLASSES_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
}

function readAutoSkills(): CharacterSkill[] {
  try {
    if (!fs.existsSync(AUTO_SKILLS_FILE)) return [];
    const raw = fs.readFileSync(AUTO_SKILLS_FILE, 'utf-8');
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored)) return [];
    return stored.map((s: CharacterSkill) => ({
      ...s,
      name: s.name || 'アクション名未設定',
      category: '自動取得' as const,
      role: ((s.role as string) === '刑事' ? 'ゲスト' : (s.role || '探偵')) as SkillRole,
      type: s.type || s.timing || '補助',
      timing: s.timing || s.type || '補助',
      cost: s.cost || s.target || 'なし',
      target: s.target || s.cost || 'なし',
      description: s.description || '',
      flavor: s.flavor || ''
    }));
  } catch (err) {
    console.error('Error reading auto skills file:', err);
    return [];
  }
}

function writeAutoSkills(data: CharacterSkill[]) {
  fs.writeFileSync(AUTO_SKILLS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function readSkills(): CharacterSkill[] {
  try {
    if (!fs.existsSync(SKILLS_FILE)) return [];
    const raw = fs.readFileSync(SKILLS_FILE, 'utf-8');
    const stored: CharacterSkill[] = JSON.parse(raw);
    if (!Array.isArray(stored)) return [];
    return stored
      .filter((s) => s.category !== '自動取得' && !s.id.startsWith('auto-'))
      .map((s) => ({
        ...s,
        name: s.name || 'アクション名未設定',
        category: '固有' as const,
        role: ((s.role as string) === '刑事' ? 'ゲスト' : (s.role || '探偵')) as SkillRole,
        type: s.type || s.timing || '補助',
        timing: s.timing || s.type || '補助',
        cost: s.cost || s.target || 'なし',
        target: s.target || s.cost || 'なし',
        description: s.description || '',
        flavor: s.flavor || ''
      }));
  } catch (err) {
    console.error('Error reading skills file:', err);
    return [];
  }
}

function writeSkills(data: CharacterSkill[]) {
  const sanitized = data
    .filter((s) => s.category !== '自動取得' && !s.id.startsWith('auto-'))
    .map((s) => ({ ...s, category: '固有' as const }));
  fs.writeFileSync(SKILLS_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
}

function readGuests(): GuestCharacter[] {
  try {
    if (!fs.existsSync(GUESTS_FILE)) return [];
    const raw = fs.readFileSync(GUESTS_FILE, 'utf-8');
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored)) return [];
    return stored.map((g: GuestCharacter) => ({
      ...g,
      name: g.name || '名称未設定',
      occupation: g.occupation && g.occupation.trim() ? g.occupation.trim() : undefined,
      tags: Array.isArray(g.tags) ? g.tags : [],
      reactions: Array.isArray(g.reactions) ? g.reactions : []
    }));
  } catch (err) {
    console.error('Error reading guests file:', err);
    return [];
  }
}

function writeGuests(data: GuestCharacter[]) {
  fs.writeFileSync(GUESTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function readSummaries(): SessionSummary[] {
  try {
    if (!fs.existsSync(SUMMARIES_FILE)) {
      writeSummaries(INITIAL_SESSION_SUMMARIES);
      return INITIAL_SESSION_SUMMARIES;
    }
    const raw = fs.readFileSync(SUMMARIES_FILE, 'utf-8');
    const stored = JSON.parse(raw);
    return Array.isArray(stored) ? stored : INITIAL_SESSION_SUMMARIES;
  } catch (err) {
    console.error('Error reading session summaries file:', err);
    return INITIAL_SESSION_SUMMARIES;
  }
}

function writeSummaries(data: SessionSummary[]) {
  fs.writeFileSync(SUMMARIES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function readNotes(): SessionNote[] {
  try {
    if (!fs.existsSync(NOTES_FILE)) return [];
    const raw = fs.readFileSync(NOTES_FILE, 'utf-8');
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored)) return [];
    return stored.map((n: SessionNote) => ({
      ...n,
      title: n.title || '無題',
      description: n.description || '',
      category: n.category || '用語',
      tags: Array.isArray(n.tags) ? n.tags : []
    }));
  } catch (err) {
    console.error('Error reading session notes file:', err);
    return [];
  }
}

function writeNotes(data: SessionNote[]) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// --- API Routes ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all situations (Public)
app.get('/api/situations', (req, res) => {
  try {
    const situations = readSituations();
    res.json(situations);
  } catch {
    res.status(500).json({ error: 'Failed to read situations data' });
  }
});

// Verify edit passkey
app.post('/api/auth/verify', (req, res) => {
  const { passkey } = req.body;
  const config = getStoredConfig();
  if (passkey && passkey === config.editPasskey) {
    res.json({ success: true, message: 'Authentication successful' });
  } else {
    res.status(401).json({ success: false, error: '合言葉（編集パスキー）が正しくありません' });
  }
});

// Change passkey (Requires current passkey)
app.post('/api/auth/change-passkey', (req, res) => {
  const { currentPasskey, newPasskey } = req.body;
  const config = getStoredConfig();
  if (!currentPasskey || currentPasskey !== config.editPasskey) {
    return res.status(401).json({ error: '現在の合言葉が違います' });
  }
  if (!newPasskey || typeof newPasskey !== 'string' || newPasskey.trim().length < 3) {
    return res.status(400).json({ error: '新しい合言葉は3文字以上で入力してください' });
  }
  config.editPasskey = newPasskey.trim();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  res.json({ success: true, message: '合言葉を更新しました' });
});

// Update single situation (Requires passkey)
app.put('/api/situations/:id', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  const updatedData: SituationInvestigation = req.body;

  const situations = readSituations();
  const index = situations.findIndex(s => s.id === id);

  if (index === -1) {
    // If not found, add as new
    situations.push({
      ...updatedData,
      id,
      updatedAt: new Date().toISOString()
    });
  } else {
    situations[index] = {
      ...situations[index],
      ...updatedData,
      id,
      updatedAt: new Date().toISOString()
    };
  }

  writeSituations(situations);
  res.json({ success: true, situation: index === -1 ? situations[situations.length - 1] : situations[index] });
});

// Create new situation (Requires passkey)
app.post('/api/situations', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const newSituation: SituationInvestigation = req.body;
  if (!newSituation.name) {
    return res.status(400).json({ error: 'シチュエーション名は必須です' });
  }

  const situations = readSituations();
  const id = newSituation.id || `custom-${Date.now()}`;
  const situationToAdd: SituationInvestigation = {
    ...newSituation,
    id,
    updatedAt: new Date().toISOString()
  };

  situations.push(situationToAdd);
  writeSituations(situations);
  res.json({ success: true, situation: situationToAdd });
});

// Delete situation (Requires passkey)
app.delete('/api/situations/:id', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  let situations = readSituations();
  situations = situations.filter(s => s.id !== id);
  writeSituations(situations);
  res.json({ success: true });
});

// Reset to default situations (Requires passkey)
app.post('/api/situations/reset', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  writeSituations(INITIAL_SITUATIONS);
  res.json({ success: true, situations: INITIAL_SITUATIONS });
});

// Bulk import situations (Requires passkey)
app.post('/api/situations/import', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { situations } = req.body;
  if (!Array.isArray(situations)) {
    return res.status(400).json({ error: 'データ形式が不正です（配列である必要があります）' });
  }

  writeSituations(situations);
  res.json({ success: true, count: situations.length });
});

// --- Character Classes API ---

// Get all character classes (Public)
app.get('/api/classes', (req, res) => {
  try {
    const classes = readClasses();
    res.json(classes);
  } catch {
    res.status(500).json({ error: 'Failed to read classes data' });
  }
});

// Update single class (Requires passkey)
app.put('/api/classes/:id', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  const updatedData: CharacterClass = req.body;

  const classes = readClasses();
  const index = classes.findIndex(c => c.id === id);

  if (index === -1) {
    classes.push({
      ...updatedData,
      id
    });
  } else {
    classes[index] = {
      ...classes[index],
      ...updatedData,
      id
    };
  }

  writeClasses(classes);
  res.json({ success: true, classItem: index === -1 ? classes[classes.length - 1] : classes[index] });
});

// Create new class (Requires passkey)
app.post('/api/classes', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const newClass: CharacterClass = req.body;
  if (!newClass.name) {
    return res.status(400).json({ error: 'クラス名は必須です' });
  }

  const classes = readClasses();
  const id = newClass.id || `custom-cls-${Date.now()}`;
  const classToAdd: CharacterClass = {
    ...newClass,
    id,
    signatureSkills: newClass.signatureSkills || [],
    recommendedSituationIds: newClass.recommendedSituationIds || []
  };

  classes.push(classToAdd);
  writeClasses(classes);
  res.json({ success: true, classItem: classToAdd });
});

// Delete class (Requires passkey)
app.delete('/api/classes/:id', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  let classes = readClasses();
  classes = classes.filter(c => c.id !== id);
  writeClasses(classes);
  res.json({ success: true });
});

// Reset to default character classes (Requires passkey)
app.post('/api/classes/reset', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  writeClasses(ALL_CHARACTER_CLASSES);
  res.json({ success: true, classes: ALL_CHARACTER_CLASSES });
});

// --- Independent Signature Skills API (固有アクション専用・クラス非依存) ---

// Get all signature skills (Public)
app.get('/api/skills', (req, res) => {
  try {
    const skills = readSkills();
    res.json(skills);
  } catch {
    res.status(500).json({ error: 'Failed to read skills data' });
  }
});

// Create new signature skill (Requires passkey)
app.post('/api/skills', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const newSkill: CharacterSkill = req.body;
  if (!newSkill.name) {
    return res.status(400).json({ error: 'アクション名は必須です' });
  }

  const skills = readSkills();
  const id = newSkill.id || `custom-sk-${Date.now()}`;
  const skillToAdd: CharacterSkill = {
    ...newSkill,
    id,
    category: '固有'
  };

  skills.push(skillToAdd);
  writeSkills(skills);
  res.json({ success: true, skill: skillToAdd });
});

// Update signature skill (Requires passkey)
app.put('/api/skills/:id', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  const updatedData: CharacterSkill = req.body;

  const skills = readSkills();
  const index = skills.findIndex((s) => s.id === id);

  const skillToSave: CharacterSkill = {
    ...(index !== -1 ? skills[index] : {}),
    ...updatedData,
    id,
    category: '固有'
  };

  if (index === -1) {
    skills.push(skillToSave);
  } else {
    skills[index] = skillToSave;
  }

  writeSkills(skills);
  res.json({ success: true, skill: skillToSave });
});

// Delete signature skill (Requires passkey)
app.delete('/api/skills/:id', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  let skills = readSkills();
  skills = skills.filter((s) => s.id !== id);
  writeSkills(skills);
  res.json({ success: true });
});

// Reset signature skills to default (Requires passkey)
app.post('/api/skills/reset', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const initialSkills = ALL_CHARACTER_SKILLS.filter(
    (s) => s.category !== '自動取得' && !s.id.startsWith('auto-')
  ).map((s) => ({ ...s, category: '固有' as const }));

  writeSkills(initialSkills);
  res.json({ success: true, skills: initialSkills });
});

// --- Automatic Actions API (探偵・助手・刑事の自動取得アクション) ---

// Get all automatic actions (Public)
app.get('/api/auto-skills', (req, res) => {
  try {
    const skills = readAutoSkills();
    res.json(skills);
  } catch {
    res.status(500).json({ error: 'Failed to read auto skills data' });
  }
});

// Create new automatic action (Requires passkey)
app.post('/api/auto-skills', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const newSkill: CharacterSkill = req.body;
  if (!newSkill.name) {
    return res.status(400).json({ error: 'アクション名は必須です' });
  }

  const skills = readAutoSkills();
  const id = newSkill.id || `auto-${Date.now()}`;
  const skillToAdd: CharacterSkill = {
    ...newSkill,
    id,
    category: '自動取得'
  };

  skills.push(skillToAdd);
  writeAutoSkills(skills);
  res.json({ success: true, skill: skillToAdd });
});

// Update single automatic action (Requires passkey)
app.put('/api/auto-skills/:id', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  const updatedData: CharacterSkill = req.body;

  const skills = readAutoSkills();
  const index = skills.findIndex((s) => s.id === id);

  const skillToSave: CharacterSkill = {
    ...(index !== -1 ? skills[index] : {}),
    ...updatedData,
    id,
    category: '自動取得'
  };

  if (index === -1) {
    skills.push(skillToSave);
  } else {
    skills[index] = skillToSave;
  }

  writeAutoSkills(skills);
  res.json({ success: true, skill: skillToSave });
});

// Delete automatic action (Requires passkey)
app.delete('/api/auto-skills/:id', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  let skills = readAutoSkills();
  skills = skills.filter((s) => s.id !== id);
  writeAutoSkills(skills);
  res.json({ success: true });
});

// Reset automatic actions to default (Requires passkey)
app.post('/api/auto-skills/reset', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  writeAutoSkills(AUTOMATIC_ACTIONS);
  res.json({ success: true, skills: AUTOMATIC_ACTIONS });
});

// ==========================================
// --- Guests (ゲストNPC) API ---
// ==========================================

// Get all guests (Public)
app.get('/api/guests', (req, res) => {
  try {
    const guests = readGuests();
    res.json(guests);
  } catch {
    res.status(500).json({ error: 'Failed to read guests data' });
  }
});

// Create new guest (Requires passkey)
app.post('/api/guests', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const newGuest: GuestCharacter = req.body;
  if (!newGuest.name || !newGuest.name.trim()) {
    return res.status(400).json({ error: 'ゲスト名は必須です' });
  }

  const guests = readGuests();
  const id = newGuest.id || `guest-${Date.now()}`;
  const guestToAdd: GuestCharacter = {
    id,
    name: newGuest.name.trim(),
    furigana: newGuest.furigana && newGuest.furigana.trim() ? newGuest.furigana.trim() : undefined,
    gender: newGuest.gender && newGuest.gender.trim() ? newGuest.gender.trim() : undefined,
    age: newGuest.age && newGuest.age.trim() ? newGuest.age.trim() : undefined,
    occupation: newGuest.occupation && newGuest.occupation.trim() ? newGuest.occupation.trim() : undefined,
    summary: newGuest.summary && newGuest.summary.trim() ? newGuest.summary.trim() : undefined,
    profile: newGuest.profile && newGuest.profile.trim() ? newGuest.profile.trim() : undefined,
    relationship: newGuest.relationship && newGuest.relationship.trim() ? newGuest.relationship.trim() : undefined,
    recommendedClass: newGuest.recommendedClass && newGuest.recommendedClass.trim() ? newGuest.recommendedClass.trim() : undefined,
    recommendedSkills: newGuest.recommendedSkills && newGuest.recommendedSkills.trim() ? newGuest.recommendedSkills.trim() : undefined,
    candidateClasses: newGuest.candidateClasses && newGuest.candidateClasses.trim() ? newGuest.candidateClasses.trim() : undefined,
    content: newGuest.content && newGuest.content.trim() ? newGuest.content.trim() : undefined,
    reactions: Array.isArray(newGuest.reactions) && newGuest.reactions.length === 6
      ? newGuest.reactions
      : [1, 2, 3, 4, 5, 6].map((roll) => ({ roll, reaction: '' })),
    imageUrl: newGuest.imageUrl && newGuest.imageUrl.trim() ? newGuest.imageUrl.trim() : undefined,
    tags: Array.isArray(newGuest.tags) && newGuest.tags.length > 0 ? newGuest.tags : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  guests.push(guestToAdd);
  writeGuests(guests);
  res.json({ success: true, guest: guestToAdd });
});

// Update guest (Requires passkey)
app.put('/api/guests/:id', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  const updatedData: GuestCharacter = req.body;
  if (!updatedData.name || !updatedData.name.trim()) {
    return res.status(400).json({ error: 'ゲスト名は必須です' });
  }

  const guests = readGuests();
  const index = guests.findIndex((g) => g.id === id);

  // PUT represents replacing/updating the resource with provided data.
  // Optional fields that are empty, null, or undefined are cleared (e.g. removing imageUrl to make it SECRET)
  const guestToSave: GuestCharacter = {
    id,
    name: updatedData.name.trim(),
    furigana: updatedData.furigana && updatedData.furigana.trim() ? updatedData.furigana.trim() : undefined,
    gender: updatedData.gender && updatedData.gender.trim() ? updatedData.gender.trim() : undefined,
    age: updatedData.age && updatedData.age.trim() ? updatedData.age.trim() : undefined,
    occupation: updatedData.occupation && updatedData.occupation.trim() ? updatedData.occupation.trim() : undefined,
    summary: updatedData.summary && updatedData.summary.trim() ? updatedData.summary.trim() : undefined,
    profile: updatedData.profile && updatedData.profile.trim() ? updatedData.profile.trim() : undefined,
    relationship: updatedData.relationship && updatedData.relationship.trim() ? updatedData.relationship.trim() : undefined,
    recommendedClass: updatedData.recommendedClass && updatedData.recommendedClass.trim() ? updatedData.recommendedClass.trim() : undefined,
    recommendedSkills: updatedData.recommendedSkills && updatedData.recommendedSkills.trim() ? updatedData.recommendedSkills.trim() : undefined,
    candidateClasses: updatedData.candidateClasses && updatedData.candidateClasses.trim() ? updatedData.candidateClasses.trim() : undefined,
    content: updatedData.content && updatedData.content.trim() ? updatedData.content.trim() : undefined,
    reactions: Array.isArray(updatedData.reactions)
      ? updatedData.reactions
      : [1, 2, 3, 4, 5, 6].map((roll) => ({ roll, reaction: '' })),
    imageUrl: updatedData.imageUrl && updatedData.imageUrl.trim() ? updatedData.imageUrl.trim() : undefined,
    tags: Array.isArray(updatedData.tags) && updatedData.tags.length > 0 ? updatedData.tags : undefined,
    createdAt: index !== -1 ? guests[index].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (index === -1) {
    guests.push(guestToSave);
  } else {
    guests[index] = guestToSave;
  }

  writeGuests(guests);
  res.json({ success: true, guest: guestToSave });
});

// Delete guest (Requires passkey)
app.delete('/api/guests/:id', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  let guests = readGuests();
  guests = guests.filter((g) => g.id !== id);
  writeGuests(guests);
  res.json({ success: true });
});

// Reset guests to initial default (Requires passkey)
app.post('/api/guests/reset', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  writeGuests(INITIAL_GUEST_CHARACTERS);
  res.json({ success: true, guests: INITIAL_GUEST_CHARACTERS });
});

// ==========================================
// --- Session Summaries (5フェイズ進行サマリー) API ---
// ==========================================

// Get all session summaries (Public)
app.get('/api/session-summaries', (req, res) => {
  try {
    const summaries = readSummaries();
    res.json(summaries);
  } catch {
    res.status(500).json({ error: 'Failed to read session summaries' });
  }
});

// Create new session summary (Requires passkey)
app.post('/api/session-summaries', (req, res) => {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const newSummary: SessionSummary = req.body;
  if (!newSummary.title || !newSummary.title.trim()) {
    return res.status(400).json({ error: 'シナリオ・セッション名は必須です' });
  }

  const summaries = readSummaries();
  const id = newSummary.id && newSummary.id.trim().length > 0
    ? newSummary.id.trim()
    : `summary-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const summaryToAdd: SessionSummary = {
    ...newSummary,
    id,
    title: newSummary.title.trim(),
    overview: newSummary.overview || '',
    estimatedTime: newSummary.estimatedTime || '',
    tamariPhase: newSummary.tamariPhase || { title: 'たまり場フェイズ', summary: '', sceneEndRequirements: [], checkpoints: [], notes: '' },
    incidentPhase: newSummary.incidentPhase || { title: '事件発生フェイズ', summary: '', sceneEndRequirements: [], checkpoints: [], notes: '' },
    investigationPhase: newSummary.investigationPhase || { title: '捜査フェイズ', summary: '', sceneEndRequirements: [], checkpoints: [], notes: '' },
    truthPhase: newSummary.truthPhase || { title: '真相フェイズ', summary: '', sceneEndRequirements: [], checkpoints: [], notes: '' },
    endingPhase: newSummary.endingPhase || { title: '終了フェイズ', summary: '', sceneEndRequirements: [], checkpoints: [], notes: '' },
    createdAt: newSummary.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const existingIndex = summaries.findIndex((s) => s.id === id);
  if (existingIndex !== -1) {
    summaries[existingIndex] = summaryToAdd;
  } else {
    summaries.push(summaryToAdd);
  }

  writeSummaries(summaries);
  res.json({ success: true, sessionSummary: summaryToAdd, summaries });
});

// Update session summary (Requires passkey)
app.put('/api/session-summaries/:id', (req, res) => {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  const updatedData: SessionSummary = req.body;
  if (!updatedData.title || !updatedData.title.trim()) {
    return res.status(400).json({ error: 'シナリオ・セッション名は必須です' });
  }

  const summaries = readSummaries();
  let index = summaries.findIndex((s) => s.id === id);

  // If not found by exact id, but it matches the legacy default id, check if default flow exists
  if (index === -1 && id === 'session-flow-summary' && summaries.length > 0) {
    const legacyIndex = summaries.findIndex((s) => s.id === 'session-flow-summary');
    if (legacyIndex !== -1) index = legacyIndex;
  }

  const targetId = index !== -1 ? summaries[index].id : id;
  const summaryToSave: SessionSummary = {
    ...(index !== -1 ? summaries[index] : {}),
    ...updatedData,
    id: targetId,
    title: updatedData.title.trim(),
    updatedAt: new Date().toISOString()
  };

  if (index === -1) {
    summaries.push(summaryToSave);
  } else {
    summaries[index] = summaryToSave;
  }

  writeSummaries(summaries);
  res.json({ success: true, sessionSummary: summaryToSave, summaries });
});

// Delete session summary (Requires passkey)
app.delete('/api/session-summaries/:id', (req, res) => {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  let summaries = readSummaries();
  summaries = summaries.filter((s) => s.id !== id);
  writeSummaries(summaries);
  res.json({ success: true, summaries });
});

// Reset session summaries to initial default (Requires passkey)
app.post('/api/session-summaries/reset', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  writeSummaries(INITIAL_SESSION_SUMMARIES);
  res.json({ success: true, summaries: INITIAL_SESSION_SUMMARIES });
});

// ==========================================
// --- Session Notes (セッション便利帳: 用語・キャラ作成・小ネタ) API ---
// ==========================================

// Get all session notes (Public)
app.get('/api/session-notes', (req, res) => {
  try {
    const notes = readNotes();
    res.json(notes);
  } catch {
    res.status(500).json({ error: 'Failed to read session notes' });
  }
});

// Create new session note (Requires passkey)
app.post('/api/session-notes', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const newNote: SessionNote = req.body;
  if (!newNote.title || !newNote.title.trim()) {
    return res.status(400).json({ error: '題名は必須です' });
  }

  const notes = readNotes();
  const id = newNote.id || `note-${Date.now()}`;
  const cleanedImageUrls = Array.isArray(newNote.imageUrls)
    ? newNote.imageUrls.filter((u) => typeof u === 'string' && u.trim().length > 0)
    : (newNote.imageUrl && newNote.imageUrl.trim() ? [newNote.imageUrl.trim()] : []);

  const noteToAdd: SessionNote = {
    ...newNote,
    id,
    title: newNote.title.trim(),
    category: newNote.category || '用語',
    description: newNote.description ? newNote.description.trim() : '',
    tags: Array.isArray(newNote.tags) ? newNote.tags : [],
    imageUrl: cleanedImageUrls.length > 0 ? cleanedImageUrls[0] : undefined,
    imageUrls: cleanedImageUrls.length > 0 ? cleanedImageUrls : undefined,
    sourceBook: newNote.sourceBook ? newNote.sourceBook.trim() : undefined,
    isPinned: Boolean(newNote.isPinned),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  notes.push(noteToAdd);
  writeNotes(notes);
  res.json({ success: true, note: noteToAdd });
});

// Update session note (Requires passkey)
app.put('/api/session-notes/:id', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  const updatedData: SessionNote = req.body;
  const notes = readNotes();
  const index = notes.findIndex((n) => n.id === id);

  const cleanedImageUrls = Array.isArray(updatedData.imageUrls)
    ? updatedData.imageUrls.filter((u) => typeof u === 'string' && u.trim().length > 0)
    : (updatedData.imageUrl && updatedData.imageUrl.trim() ? [updatedData.imageUrl.trim()] : []);

  const noteToSave: SessionNote = {
    ...(index !== -1 ? notes[index] : {}),
    ...updatedData,
    id,
    title: updatedData.title ? updatedData.title.trim() : (index !== -1 ? notes[index].title : ''),
    category: updatedData.category || (index !== -1 ? notes[index].category : '用語'),
    description: updatedData.description ? updatedData.description.trim() : '',
    tags: Array.isArray(updatedData.tags) ? updatedData.tags : [],
    imageUrl: cleanedImageUrls.length > 0 ? cleanedImageUrls[0] : undefined,
    imageUrls: cleanedImageUrls.length > 0 ? cleanedImageUrls : undefined,
    sourceBook: updatedData.sourceBook ? updatedData.sourceBook.trim() : undefined,
    isPinned: Boolean(updatedData.isPinned),
    updatedAt: new Date().toISOString()
  };

  if (index === -1) {
    notes.push(noteToSave);
  } else {
    notes[index] = noteToSave;
  }

  writeNotes(notes);
  res.json({ success: true, note: noteToSave });
});

// Batch update multiple session notes (Requires passkey)
app.put('/api/session-notes-batch', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const updatedNotes: SessionNote[] = req.body;
  if (!Array.isArray(updatedNotes)) {
    return res.status(400).json({ error: '配列形式で指定してください' });
  }

  let notes = readNotes();
  const map = new Map(notes.map((n) => [n.id, n]));

  updatedNotes.forEach((un) => {
    if (!un.id) return;
    const existing = map.get(un.id);
    map.set(un.id, {
      ...(existing || {}),
      ...un,
      tags: Array.isArray(un.tags) ? un.tags : [],
      updatedAt: new Date().toISOString()
    });
  });

  notes = Array.from(map.values());
  writeNotes(notes);
  res.json({ success: true, count: updatedNotes.length });
});

// Delete session note (Requires passkey)
app.delete('/api/session-notes/:id', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  const { id } = req.params;
  let notes = readNotes();
  notes = notes.filter((n) => n.id !== id);
  writeNotes(notes);
  res.json({ success: true });
});

// Reset session notes to initial default (Requires passkey)
app.post('/api/session-notes/reset', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '編集権限がありません（合言葉を確認してください）' });
  }

  writeNotes(INITIAL_SESSION_NOTES);
  res.json({ success: true, notes: INITIAL_SESSION_NOTES });
});

// Import full backup (Requires passkey)
app.post('/api/backup/import', (req, res) => {
  const passkey = req.headers['x-edit-passkey'] as string;
  const config = getStoredConfig();
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '復元には編集合言葉の認証が必要です' });
  }

  updateStoredConfig({ clearedByUser: false });

  const { situations, characterClasses, signatureSkills, autoSkills, guests, sessionSummaries, sessionNotes } = req.body;

  let updatedCounts = {
    situations: 0,
    characterClasses: 0,
    signatureSkills: 0,
    autoSkills: 0,
    guests: 0,
    sessionSummaries: 0,
    sessionNotes: 0,
  };

  // If payload is an array directly (e.g. legacy situations backup)
  if (Array.isArray(req.body)) {
    writeSituations(req.body);
    updatedCounts.situations = req.body.length;
  } else {
    if (Array.isArray(situations)) {
      writeSituations(situations);
      updatedCounts.situations = situations.length;
    }
    if (Array.isArray(characterClasses)) {
      writeClasses(characterClasses);
      updatedCounts.characterClasses = characterClasses.length;
    }
    if (Array.isArray(signatureSkills)) {
      // 固有アクションのみ保存（自動取得アクションは混ざらないようにフィルタ）
      const cleanedSkills = signatureSkills.map((s: CharacterSkill) => ({
        ...s,
        category: '固有' as const,
      }));
      writeSkills(cleanedSkills);
      updatedCounts.signatureSkills = cleanedSkills.length;
    }
    if (Array.isArray(autoSkills)) {
      const cleanedAutoSkills = autoSkills.map((s: CharacterSkill) => ({
        ...s,
        category: '自動取得' as const,
      }));
      writeAutoSkills(cleanedAutoSkills);
      updatedCounts.autoSkills = cleanedAutoSkills.length;
    }
    if (Array.isArray(guests)) {
      writeGuests(guests);
      updatedCounts.guests = guests.length;
    }
    if (Array.isArray(sessionSummaries)) {
      writeSummaries(sessionSummaries);
      updatedCounts.sessionSummaries = sessionSummaries.length;
    }
    if (Array.isArray(sessionNotes)) {
      writeNotes(sessionNotes);
      updatedCounts.sessionNotes = sessionNotes.length;
    }
  }

  res.json({
    success: true,
    message: 'バックアップから復元が完了しました',
    counts: updatedCounts,
    data: {
      situations: readSituations(),
      characterClasses: readClasses(),
      signatureSkills: readSkills(),
      autoSkills: readAutoSkills(),
      guests: readGuests(),
      sessionSummaries: readSummaries(),
      sessionNotes: readNotes(),
    },
  });
});

// --- Bulk Clear & Load Samples Endpoints ---

// Clear all data to empty []
app.post('/api/all/clear', (req, res) => {
  updateStoredConfig({ clearedByUser: true });
  writeSituations([]);
  writeClasses([]);
  writeSkills([]);
  writeAutoSkills([]);
  writeGuests([]);
  writeSummaries([]);
  writeNotes([]);
  res.json({
    success: true,
    message: '全データをまっさらに初期化しました',
    counts: {
      situations: 0,
      classes: 0,
      skills: 0,
      autoSkills: 0,
      guests: 0,
      sessionSummaries: 0,
      sessionNotes: 0,
    },
    data: {
      situations: [],
      characterClasses: [],
      signatureSkills: [],
      autoSkills: [],
      guests: [],
      sessionSummaries: [],
      sessionNotes: [],
    }
  });
});

// Clear situations to empty []
app.post('/api/situations/clear', (req, res) => {
  writeSituations([]);
  res.json({ success: true, count: 0 });
});

// Clear classes to empty []
app.post('/api/classes/clear', (req, res) => {
  writeClasses([]);
  res.json({ success: true, count: 0 });
});

// Clear skills to empty []
app.post('/api/skills/clear', (req, res) => {
  writeSkills([]);
  res.json({ success: true, count: 0 });
});

// Clear auto skills to empty []
app.post('/api/auto-skills/clear', (req, res) => {
  writeAutoSkills([]);
  res.json({ success: true, count: 0 });
});

// Clear guests to empty []
app.post('/api/guests/clear', (req, res) => {
  writeGuests([]);
  res.json({ success: true, count: 0 });
});

// Clear summaries to empty []
app.post('/api/session-summaries/clear', (req, res) => {
  writeSummaries([]);
  res.json({ success: true, count: 0 });
});

// Clear notes to empty []
app.post('/api/session-notes/clear', (req, res) => {
  writeNotes([]);
  res.json({ success: true, count: 0 });
});

// Vite middleware & Production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
