export type SituationCategory = '共通' | 'その他のシチュエーション';

export type ActorType = '二人で使う' | '探偵だけ' | '助手だけ' | 'NPCが登場する';

export type CharacterRole = '探偵' | '助手' | '刑事';

export type SkillRole = '探偵' | '助手' | 'フタリ' | 'ゲスト' | '刑事';

export type SituationVersatility = 'あり' | '条件付きあり' | 'なし' | '条件付きなし';

export interface CharacterSkill {
  id: string;
  name: string;        // 題名
  role: SkillRole;     // 探偵 / 助手 / フタリ / ゲスト
  category?: '固有' | '自動取得'; // 固有アクション または 自動取得アクション
  type: string;        // タイプ (例: 調査, 判定, 支援, 補助, 回復, 特殊, 常時)
  cost: string;        // コスト (例: なし, 1, 精神力1, 余裕1)
  description: string; // 内容 (効果・ルール詳細)
  flavor: string;      // フレーバー
  timing?: string;     // 互換性用
  target?: string;     // 互換性用
  relatedSituationIds?: string[];
  updatedAt?: string;
}

export interface BackgroundTableItem {
  roll: number;        // 出目 (探偵・刑事は1D10の1〜10、助手は1D6の1〜6)
  title: string;       // 背景名 (例: 名探偵の先祖(真))
  description: string; // 説明文
}

export interface CharacterClass {
  id: string;
  name: string;
  role: CharacterRole;
  alias: string;        // 英語名・通称
  concept?: string;     // コンセプト・人物像（非推奨・オプショナル）
  description: string;  // フレーバー・解説
  skillsAcquired?: string; // 修得技能 (例: 洞察カテゴリから2つ、鑑識カテゴリから2つ、好きなカテゴリから2つ)
  backgroundTable?: BackgroundTableItem[]; // 背景表 (探偵・刑事は1D10の全10種、助手は1D6の全6種)
  autoSkills?: CharacterSkill[]; // クラス個別指定の自動取得アクション（未指定時は役割共通の自動取得アクションを使用）
  signatureSkills: CharacterSkill[]; // 固有アクション（クラス固有のスキル）
  recommendedSituationIds: string[]; // 相性の良いシチュエーション捜査
  sourceBook: string;   // 収録書籍
  investigationStyle?: string; // 捜査スタイル（非推奨・オプショナル）
  perceptionTendency?: string; // 知覚・ステータスの傾向（非推奨・オプショナル）
  updatedAt?: string;
}

export interface TableEventItem {
  roll: number;                 // 出目 (1〜6)
  title: string;                // 題名 (例: 気になるもの)
  summary?: string;             // ●概要 (シチュエーションの目的や発生の状況説明)
  description: string;          // ●描写 (情景・導入演出)
  process?: string;             // ●処理 (判定技能・キーワード・効果など)
  recurring?: string;           // ●再発生 (2回目以降に出た場合の処理)
  extendedDescription?: string; // 互換性用
}
export type TableEvent = TableEventItem;

export interface SituationInvestigation {
  id: string;
  name: string;
  abbreviation?: string;        // 捜査方法の略称 (短縮名・チャット用呼び名、例: 現場、なぜ、協力者、閉鎖)
  category: SituationCategory;
  sourceBook: string;           // 収録書籍① (サプリメント・初出書籍など)
  page: string;                 // 掲載ページ①
  sourceBook2?: string;         // 収録書籍② (大判ルールブック等)
  page2?: string;               // 掲載ページ②
  summary: string;              // 概要
  versatility?: SituationVersatility; // 汎用性 (あり / 条件付きあり / 条件付きなし / なし)
  versatilityDescription?: string;    // (非推奨・非表示)
  usageTiming: string;          // 使用タイミング (どんな状況で使うものなのか)
  details?: string;             // (非推奨・非表示)
  actorType: ActorType;
  tags: string[];
  tableEvents?: TableEventItem[]; // 1〜6のイベント (題名・描写・処理・再発生)
  relatedClassIds?: string[];   // 関連する探偵・助手クラス
  updatedAt?: string;
  updatedBy?: string;
}

export interface AppConfig {
  configured: boolean;
  hasEditPasskey: boolean;
}

// --- ゲスト（NPC）情報 ---
export interface GuestReactionItem {
  roll: number;        // 1D6の出目 (1〜6)
  title?: string;      // タイトル・見出し（オプショナル）
  reaction: string;    // 反応・言動・描写
  effect?: string;     // 効果・ゲーム内処理（オプショナル）
}

export interface GuestCharacter {
  id: string;
  name: string;                // 名前
  furigana?: string;           // フリガナ (よみがな・ルビ)
  gender?: string;             // 性別 (例: 女性, 男性, その他, 未入力なら非表示)
  age?: string;                // 年齢 (例: 24歳, 20代半ば, 未入力なら非表示)
  occupation?: string;         // 職業 (例: 記者, 医者, 会社員, 学生, 刑事, バーテンダーなど)
  summary?: string;            // 概要 (一言説明・立場)
  profile?: string;            // プロフィール (年齢、職業、外見、性格など)
  relationship?: string;       // 関係性 (探偵・助手や他NPC、被害者との関係・感情・因縁)
  relationships?: string;      // 互換用
  recommendedClass?: string;   // 推奨クラス (例: 助手, 刑事など)
  recommendedSkills?: string;  // 推奨技能 (例: 聞き込み, 観察, 心理 など)
  candidateClasses?: string;   // クラス候補 (例: 助手, 刑事, 一般人 など)
  classCandidates?: string;    // 互換用 (クラス候補)
  sourceBook?: string;         // 収録書籍
  content?: string;            // 内容 (秘密、抱える事情、事件における立ち位置、GM情報)
  reactions?: GuestReactionItem[]; // リアクション表 (1D6: 1〜6)
  reactionTable?: GuestReactionItem[]; // 互換用 (リアクション表)
  imageUrl?: string;           // 画像URL または base64データURL（未設定時はシークレット表示）
  tags?: string[];             // タグ (依頼人, 容疑者, 被害者, 目撃者など)
  createdAt?: string;
  updatedAt?: string;
}

// --- セッション進行サマリー（5フェイズ） ---
export interface PhaseRequirementItem {
  text: string;                  // 注意する項目内容
  comment?: string;              // 補足コメント・注意メモ
}

export interface PhaseSummary {
  title?: string;                  // フェイズサブタイトル
  summary: string;                 // 要約・進行の流れ
  sceneEndRequirements?: (string | PhaseRequirementItem)[]; // シーン終了時に必要なこと（注意する項目）
  checkpoints?: (string | PhaseRequirementItem)[];          // チェックポイント（互換用）
  notes?: string;                  // 共通メモ・注意点・ルール確認事項
}

export interface SessionSummary {
  id: string;
  title: string;                   // サマリー名
  overview: string;                // 全体概要
  estimatedTime?: string;          // 備考
  tamariPhase: PhaseSummary;       // たまり場フェイズ
  incidentPhase: PhaseSummary;     // 事件発生フェイズ
  investigationPhase: PhaseSummary;// 捜査フェイズ
  truthPhase: PhaseSummary;        // 真相フェイズ
  endingPhase: PhaseSummary;       // 終了フェイズ
  createdAt?: string;
  updatedAt?: string;
}

// --- セッション便利帳（用語・キャラ作成サマリー・小ネタ） ---
export type SessionNoteCategory = '用語' | 'キャラ作成' | '小ネタ' | '判定・ルール' | 'その他';

export interface SessionNote {
  id: string;
  title: string;                   // 題名
  category: SessionNoteCategory;   // 分類（用語、キャラ作成、小ネタ、判定・ルール、その他）
  description: string;             // 説明・内容（改行・箇条書き・見出し対応）
  tags: string[];                  // タグ（タグ検索用）
  sourceBook?: string;             // 出典・参考書籍・ページ
  isPinned?: boolean;              // ピン留め（優先表示）
  imageUrl?: string;               // 添付画像URL または base64データURL（単一・後方互換）
  imageUrls?: string[];            // 複数添付画像URL または base64データURL一覧
  majorCategory?: string;          // 大見出し
  midCategory?: string;            // 中見出し
  createdAt?: string;
  updatedAt?: string;
}

export interface AppDataBundle {
  situations: SituationInvestigation[];
  characterClasses: CharacterClass[];
  signatureSkills: CharacterSkill[];
  autoSkills: CharacterSkill[];
  guests: GuestCharacter[];
  sessionSummaries: SessionSummary[];
  sessionNotes: SessionNote[];
  updatedAt: string;
}

