import { GuestCharacter, SessionSummary } from './types.ts';

// SVG placeholder avatars with detective noir atmosphere
export const DEFAULT_AVATAR_FEMALE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="%232d2420"/><circle cx="100" cy="75" r="42" fill="%23d8b58a"/><path d="M50,185 C50,135 75,120 100,120 C125,120 150,135 150,185 Z" fill="%2378350f"/><path d="M60,65 C60,40 80,30 100,30 C120,30 140,40 140,65 C140,85 130,105 130,105 L70,105 C70,105 60,85 60,65 Z" fill="%23451a03"/><circle cx="85" cy="75" r="4" fill="%232d2420"/><circle cx="115" cy="75" r="4" fill="%232d2420"/><path d="M92,92 Q100,98 108,92" stroke="%2392400e" stroke-width="2" fill="none"/></svg>`;

export const DEFAULT_AVATAR_MALE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="%231e293b"/><circle cx="100" cy="75" r="42" fill="%23deb887"/><path d="M45,185 C45,130 75,122 100,122 C125,122 155,130 155,185 Z" fill="%230f172a"/><path d="M55,60 C55,35 80,25 100,25 C120,25 145,35 145,60 L145,70 L55,70 Z" fill="%23334155"/><circle cx="85" cy="75" r="4" fill="%230f172a"/><circle cx="115" cy="75" r="4" fill="%230f172a"/><path d="M90,92 L110,92" stroke="%23334155" stroke-width="2.5" stroke-linecap="round"/></svg>`;

export const DEFAULT_AVATAR_MYSTERIOUS = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="%231c1917"/><path d="M100,30 C65,30 50,60 50,100 C50,150 70,185 100,185 C130,185 150,150 150,100 C150,60 135,30 100,30 Z" fill="%23292524"/><ellipse cx="100" cy="78" rx="35" ry="42" fill="%2344403c"/><circle cx="86" cy="76" r="5" fill="%23f59e0b"/><circle cx="114" cy="76" r="5" fill="%23f59e0b"/><path d="M60,185 C60,140 80,130 100,130 C120,130 140,140 140,185 Z" fill="%2378350f"/><path d="M70,40 L130,40 L120,25 L80,25 Z" fill="%230c0a09"/></svg>`;

// 画像未設定時のシークレット用アバター
export const SECRET_AVATAR_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="secGrad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"><stop offset="0%25" stop-color="%2318181b"/><stop offset="50%25" stop-color="%2309090b"/><stop offset="100%25" stop-color="%231c1917"/></linearGradient></defs><rect width="200" height="200" fill="url(%23secGrad)"/><path d="M100 45 C80 45 68 62 68 86 C68 108 80 120 100 120 C120 120 132 108 132 86 C132 62 120 45 100 45 Z" fill="%2327272a"/><path d="M40 185 C40 145 68 130 100 130 C132 130 160 145 160 185 Z" fill="%2318181b"/><g transform="translate(100, 100) rotate(-14)"><rect x="-65" y="-18" width="130" height="36" rx="4" fill="%23450a0a" fill-opacity="0.9" stroke="%23ef4444" stroke-width="2.5" stroke-dasharray="6,2"/><text x="0" y="6" font-family="monospace, sans-serif" font-size="19" font-weight="900" fill="%23fca5a5" text-anchor="middle" letter-spacing="4">SECRET</text></g><text x="100" y="174" font-family="serif" font-size="11" font-weight="bold" fill="%23a1a1aa" text-anchor="middle" letter-spacing="2">？？？ / 未確認</text></svg>`;

export const INITIAL_GUEST_CHARACTERS: GuestCharacter[] = [];

export const INITIAL_SESSION_SUMMARIES: SessionSummary[] = [
  {
    id: 'session-flow-summary',
    title: 'セッション進行サマリー（5フェイズ共通フロー）',
    overview:
      '『フタリソウサ』のセッション進行（たまり場・事件発生・捜査・真相・終了）において、各フェイズの流れとシーン終了時に必要なこと・確認事項をまとめた共通進行シートです。',
    estimatedTime: '全セッション共通',
    tamariPhase: {
      title: 'たまり場フェイズ',
      summary:
        '探偵事務所や行きつけの店などで過ごす日常のシーン。探偵と助手の関係性を演出し、事件が始まる前のウォーミングアップを行います。',
      sceneEndRequirements: [
        {
          text: '助手の【余裕】の初期値（探偵の知命などから算出）を確認する',
          comment: 'セッション全体の最重要リソース。現在値をシート等にメモ'
        },
        {
          text: '探偵の【こだわり】を確認・宣言する',
          comment: 'RPの軸となる特徴や探偵の好みをPL同士で共有'
        },
        {
          text: '【思い出表】などを参照して日常会話やフタリの関係性を描写する',
          comment: '1D6を振って過去の事件や互いの呼び方を決めておくと自然'
        },
        {
          text: '事件の報せ（電話・手紙・訪問・ニュース等）が届き、事件発生フェイズへ移行する',
          comment: '日常から非日常への切り替えを合図する'
        }
      ],
      checkpoints: [
        { text: '助手の【余裕】の初期値を確認する' },
        { text: '探偵の【こだわり】を確認・宣言する' },
        { text: '日常会話やフタリの関係性を描写する' },
        { text: '事件発生フェイズへ移行する' }
      ],
      notes: '助手の「余裕」はセッション全体の重要リソースです。開始時の数値をシート等に明記しておきましょう。'
    },
    incidentPhase: {
      title: '事件発生フェイズ',
      summary:
        '依頼人（ゲストNPC）の来訪、または事件現場への急行。事件の概要と解明すべき謎（知ること）が提示され、正式に捜査を開始します。',
      sceneEndRequirements: [
        {
          text: '依頼人またはゲストNPCの紹介・調書の提示（クラス候補や推奨技能の把握）',
          comment: '第一印象や感情の獲得ルールを確認しておく'
        },
        {
          text: '【事件の概要】（発生場所、被害者、犯行状況、依頼内容）を提示する',
          comment: 'プレイヤー全員にメモ・共有する'
        },
        {
          text: '事件解決のために必要な【知ること】（解明すべき手がかり・謎）を提示する',
          comment: '捜査のゴール・必要なキーワード数の目安を共有'
        },
        {
          text: '探偵と助手が依頼を正式に受諾し、捜査フェイズへの移行を宣言する',
          comment: '現場への移動描写を挟むとスムーズ'
        }
      ],
      checkpoints: [
        { text: 'ゲストNPCの紹介・調書提示' },
        { text: '【事件の概要】の提示' },
        { text: '【知ること】（手がかり・謎）の提示' },
        { text: '捜査フェイズへの移行宣言' }
      ],
      notes: 'ゲストへの第一印象や感情の獲得ルールを確認し、現場への移動描写を挟むとスムーズです。'
    },
    investigationPhase: {
      title: '捜査フェイズ',
      summary:
        '現場のシチュエーション調査や聞き込みを繰り返すメインフェイズ。手がかりや【キーワード】を集め、助手の余裕を管理しながら真相を追い詰めます。',
      sceneEndRequirements: [
        {
          text: 'シチュエーション調査の実行と出目イベントの処理完了',
          comment: '助手の余裕消費や探偵・助手の固有アクションを活用'
        },
        {
          text: '調査成功による【キーワード】の獲得と記録（全員に共有）',
          comment: '手がかりや証言の矛盾を洗い出す'
        },
        {
          text: 'NPCへの聞き込みとリアクションの確認、証言の矛盾の洗い出し',
          comment: '1D6リアクション表を参照して反応を描写'
        },
        {
          text: '助手の【余裕】残量の確認（ピンチ時は休憩シチュエーション等の検討）',
          comment: '残り余裕が少なくなったら安全な行動を優先'
        },
        {
          text: '規定数（通常3つ以上等）のキーワードが集まり、探偵が「真相が分かった」と宣言して真相フェイズへ移行',
          comment: '探偵プレイヤーの合図でクライマックスへ'
        }
      ],
      checkpoints: [
        { text: 'シチュエーション調査の実行とイベント処理' },
        { text: '【キーワード】の獲得と共有' },
        { text: '助手の【余裕】残量の確認' },
        { text: '真相フェイズへの移行宣言' }
      ],
      notes: '助手の余裕は調査表を振るごとに消費されます。探偵の固有アクションや助手の自動取得アクションを活用しましょう。'
    },
    truthPhase: {
      title: '真相フェイズ',
      summary:
        '関係者全員を集めて探偵が華麗に推理を披露するクライマックス！ 集めたキーワードをすべて使ってトリックと犯人を暴きます。',
      sceneEndRequirements: [
        {
          text: '探偵プレイヤーによる推理の披露（集めたキーワードをすべて組み合わせて真相を語る）',
          comment: '探偵の大見せ場！助手がフォロー役として演出をサポート'
        },
        {
          text: '犯人の反論や抵抗に対する助手の支援アクションの処理',
          comment: '判定が必要な場合のダイスロールを処理'
        },
        {
          text: '犯人の自供、または犯行の立証（感情やドラマの決着）',
          comment: '犯人の動機や抱えていた事情の明かし'
        },
        {
          text: '事件の謎がすべて解明されたことを確認し、終了フェイズへ移行する',
          comment: 'エピローグへの準備'
        }
      ],
      checkpoints: [
        { text: '探偵による推理の披露（全キーワード使用）' },
        { text: '助手の支援アクション処理' },
        { text: '犯人の自供・犯行の立証' },
        { text: '終了フェイズへの移行確認' }
      ],
      notes: '探偵の大見せ場です！ 助手がフォロー役として相槌や演出を入れるとバディとしての完成度が高まります。'
    },
    endingPhase: {
      title: '終了フェイズ',
      summary:
        '事件の解決処理、警察への引き渡し、報酬の受け取り、そして探偵と助手が穏やかな日常へ戻るエピローグ。',
      sceneEndRequirements: [
        {
          text: '警察（刑事NPC等）への犯人の身柄引き渡し・事後処理',
          comment: '事件の法的な決着を描写'
        },
        {
          text: '依頼人からの報酬・お礼の受け取りやゲストNPCとの後日談',
          comment: 'ゲストNPCとの絆や感謝の言葉'
        },
        {
          text: '今回の事件で得た【思い出】を決定・シートに記入する',
          comment: 'セッションの余韻をフタリで共有'
        },
        {
          text: '助手の【余裕】を最大値まで全回復する',
          comment: 'セッション終了時のリソース回復'
        },
        {
          text: 'フタリの日常への帰還を描写し、セッション終了の挨拶を行う',
          comment: '「お疲れ様でした！」と感想戦へ'
        }
      ],
      checkpoints: [
        { text: '警察への引き渡しと事件解決の処理' },
        { text: '依頼人からの報酬・お礼の受け取り' },
        { text: '今回の事件の【思い出】の決定・記入' },
        { text: '助手の【余裕】の全回復' },
        { text: 'セッション終了の挨拶' }
      ],
      notes: '「今回の事件はどうだった？」とお互いのPCを称え合い、感想戦を行ってセッションを締めくくります。'
    },
    updatedAt: new Date().toISOString()
  }
];
