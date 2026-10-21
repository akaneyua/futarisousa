import { CharacterClass, CharacterSkill, SkillRole, BackgroundTableItem } from './types.ts';

const makeSkill = (
  id: string,
  name: string,
  role: SkillRole,
  type: string,
  cost: string,
  description: string,
  flavor: string,
  timing?: string,
  target?: string,
  relatedSituationIds: string[] = []
): CharacterSkill => ({
  id,
  name,
  role,
  category: '固有',
  type,
  cost,
  description,
  flavor,
  timing: timing || type,
  target: target || cost,
  relatedSituationIds
});

/**
 * 運命の血統 1D10背景表
 */
export const BLOODLINE_BACKGROUND_TABLE: BackgroundTableItem[] = [
  {
    roll: 1,
    title: '名探偵の先祖(真)',
    description:
      '自分の先祖に著名な探偵がいる。その名を出せば、誰もが知るような大人物だ。自分はその血を濃く引いているようで、探偵としての才能を存分に発揮している。'
  },
  {
    roll: 2,
    title: '名探偵の先祖(想)',
    description:
      '自分の先祖は著名な探偵だ。しかし、その活躍は「フィクション」として語られている。例えば、シャーロック・ホームズ。彼は存在しないと言われているが……。それは真実ではない。自分がその血を引いているのだから。'
  },
  {
    roll: 3,
    title: '親が世界的に探偵',
    description:
      '自分の親は、世界的に名の知れた名探偵だ。数々の難事件も解決している。自分にもその血が流れていて、事件に対する鋭い洞察力を受け継ぐことになった。'
  },
  {
    roll: 4,
    title: '街の名探偵',
    description:
      '自分の親は、街でよく名の知れた名探偵だ。街の人々から愛され、頼りにされていた。自分もその血を引いているのか、探偵としての活動する力が備わっている。'
  },
  {
    roll: 5,
    title: '推理作家',
    description:
      '自分を育てた人物は、著名な推理作家であった。その思考能力は自分にも受け継がれており、トリックを暴く力は探偵並みにあると言ってもいいだろう。'
  },
  {
    roll: 6,
    title: '育ての親',
    description:
      '自分を育ててくれた人物は、事件を解決に導いたことのある人物である。その人物の教えを受けて、自分は探偵の才を開花させた。'
  },
  {
    roll: 7,
    title: '堕ちた名探偵',
    description:
      'かつて、自分の親はあらゆる事件を解決し、名探偵として有名だった。しかし、今では優れた思考能力を悪用し、人々を駒のように扱っている。能力を引き継いだ自分もいつかはそうなるのだろうか？'
  },
  {
    roll: 8,
    title: '大悪人の血',
    description:
      '世間を騒がせた大悪党や大怪盗。その血があなたにも流れている。故に、悪人の思考をトレースすることができ、結果として名探偵のようにふるまえる。'
  },
  {
    roll: 9,
    title: '隠された血筋',
    description:
      'どういうわけか、自分のルーツは抹消されている。自分が何者なのかすら、わからない。ただ、自分には事件を解決できる力があって、それがルーツに関係していると直感できる。'
  },
  {
    roll: 10,
    title: 'クローン',
    description:
      '自分は有名な名探偵のDNAから生まれた存在だ。そのためか、名探偵の力を生まれながらに備わっていた。'
  }
];

/**
 * フタリソウサ 探偵クラス（探偵型）一覧
 */
export const DETECTIVE_CLASSES: CharacterClass[] = [
  {
    id: 'det-bloodline',
    name: '運命の血統',
    alias: 'Bloodline of Destiny',
    role: '探偵',
    concept: '名探偵や大悪党、怪盗などの血と異能を宿す運命の継承者',
    description:
      '名探偵の血を受け継ぐ者。名探偵に類する何者か（怪盗や推理作家など）を親族や師匠に持ち、その影響下にある者も含まれます。',
    skillsAcquired: '洞察カテゴリから2つ、鑑識カテゴリから2つ、好きなカテゴリから2つ',
    backgroundTable: BLOODLINE_BACKGROUND_TABLE,
    investigationStyle: '血に刻まれた直感と鋭い洞察、特異な思考トレースによる真相究明',
    perceptionTendency: '【直感】【洞察】【鑑識】が高く、血脈の才能で難事件の核心を見抜く。',
    sourceBook: '基本ルールブック / クラスデータ',
    recommendedSituationIds: [
      'common-why',
      'other-unexpected-hint',
      'other-super-detective',
      'common-from-opposite',
      'other-traditional'
    ],
    signatureSkills: [
      makeSkill(
        'sk-blood-1',
        '血の直感',
        '探偵',
        '補助',
        '1',
        '判定のサイコロを振った後、使用できる。判定に使用したサイコロの目をすべて4に変更できる。',
        '「私の血が告げている……答えはこれ以外にあり得ない」と瞳を鋭く輝かせる。'
      )
    ]
  },
  {
    id: 'det-orthodox',
    name: '本格派',
    alias: 'Orthodox Detective',
    role: '探偵',
    concept: '論理と観察眼で謎を解き明かす、古典的王道の名探偵',
    description:
      '細微な痕跡や矛盾を見逃さず、証拠と証言の積み重ねから冷徹な論理で真相を導き出すタイプ。常識的な礼儀作法を弁えつつも、謎を前にすると妥協を許さない探究心を発揮します。',
    skillsAcquired: '鑑識カテゴリから2つ、教養カテゴリから2つ、好きなカテゴリから2つ',
    backgroundTable: [
      { roll: 1, title: '名門探偵事務所の後継ぎ', description: '代々続く老舗の探偵事務所の跡取りとして幼少から推理の英才教育を受けてきた。' },
      { roll: 2, title: '英国仕込みの紳士淑女', description: '留学先の本場で正統派推理の神髄を学び、瀟洒なマナーと共に現場に立つ。' },
      { roll: 3, title: '書斎の蒐集家', description: '膨大な犯罪記録と法医学書を読破した知識の泉を持ち、過去の事例と照合する。' },
      { roll: 4, title: '元エリート法学生', description: '法廷で裁けぬ真実を暴くため、自ら現場に立つ道を選んだ秀才。' },
      { roll: 5, title: '時計仕掛けの精密思考', description: '感情に流されず、すべての事象をタイムテーブルと物理法則で把握する。' },
      { roll: 6, title: '師匠からの遺志', description: '敬愛する師匠が遺したメモと虫眼鏡を携え、未解決事件の解明を誓う。' },
      { roll: 7, title: '潔癖な真実狂', description: '嘘や欺瞞にアレルギーがあり、白黒つけるまで夜も眠れない。' },
      { roll: 8, title: 'パズル狂の素顔', description: '事件を世界で最も魅力的な論理パズルと捉え、冷静沈着に解き進める。' },
      { roll: 9, title: '名家のアウトロー', description: '厳格な名家を飛び出し、自由な立場で真実を追究する道を選んだ。' },
      { roll: 10, title: '宿敵を追う孤高の瞳', description: 'かつて自分を出し抜いた完全犯罪者との決着をつけるため、観察眼を研ぎ澄ます。' }
    ],
    investigationStyle: '現場検証、タイムラインの整理、物的証拠の分析、綿密な仮説検証',
    perceptionTendency: '【視覚】【知性】【論理】が高く、小さな見落としを即座に拾い上げる。',
    sourceBook: '基本ルールブック P.34',
    recommendedSituationIds: [
      'common-scene',
      'common-why',
      'other-experiment',
      'other-traditional',
      'other-closed-space'
    ],
    signatureSkills: [
      makeSkill(
        'sk-orth-1',
        '微細な観察眼',
        '探偵',
        '常駐',
        'なし',
        '現場に散らばる微細な痕跡（繊維、指紋、埃の偏りなど）から、犯人の行動パターンを特定する。',
        'ルーペを取り出し、周囲が気にも留めない床の傷に視線を落とす。',
        '常駐',
        '自身または証拠品',
        ['common-scene', 'other-traditional']
      ),
      makeSkill(
        'sk-orth-2',
        '演繹的論理展開',
        '探偵',
        '補助',
        '1',
        '矛盾する2つ以上の証言や事実を突き合わせ、第三の隠された真実をあぶり出す。',
        '「もしAが真実なら、Bの行動は絶対にあり得ない。つまり……」手帳に素早くペンを走らせる。',
        '補助',
        '獲得した手がかり',
        ['common-why', 'other-closed-space']
      )
    ]
  },
  {
    id: 'det-genius',
    name: '天才肌',
    alias: 'Genius Detective',
    role: '探偵',
    concept: '圧倒的な直感とひらめきで一気に真実を射抜く異能の探偵',
    description:
      '退屈を極端に嫌い、凡人には理解できない思考の飛躍によって核心を掴むタイプ。普段は気まぐれでだらしなく見えますが、閃いた瞬間の集中力は凄まじく、関係者の心理的盲点を突きます。',
    skillsAcquired: '洞察カテゴリから2つ、直感カテゴリから2つ、好きなカテゴリから2つ',
    backgroundTable: [
      { roll: 1, title: '神童の退屈', description: '幼い頃から周囲の大人を凌駕する頭脳を持ち、退屈を紛らわせるために難事件を追う。' },
      { roll: 2, title: '共感覚の持ち主', description: '嘘や悪意が音や色として知覚される特殊な感覚を生まれ持っている。' },
      { roll: 3, title: '生活能力ゼロの奇才', description: '靴下の履き方も怪しいが、一度事件に入り込めば超人的な頭脳回転を見せる。' },
      { roll: 4, title: 'チェスの元世界覇者', description: '盤上の詰めろを読むように、犯人の行動心理を百手先まで予測する。' },
      { roll: 5, title: '眠れる獅子', description: '事件が起こるまでは無気力に丸まっているが、スイッチが入ると神速で動く。' },
      { roll: 6, title: '天才児のコンプレックス', description: '天才であるが故に他者の感情が理解できず、助手の存在を唯一の錨としている。' },
      { roll: 7, title: '電脳の申し子', description: '複雑な情報も脳内で瞬時にマッピングし、相関図を立体的に組み立てる。' },
      { roll: 8, title: '奇術師の弟子', description: 'タネや仕掛けを看破する達人であり、マジックの視覚誘導を見抜く。' },
      { roll: 9, title: '一度見たら忘れない目', description: '完全記憶能力を持ち、街角の看板や人々の服装を克明に記憶している。' },
      { roll: 10, title: '気まぐれな神託', description: '本人はなぜ分かったのか説明できないが、直感が100%的中する。' }
    ],
    investigationStyle: '直感的な問いかけ、日常会話からの連想、大胆な心理的ブラフ',
    perceptionTendency: '【直感】【第六感】が突出しており、常識外れな手がかりを結びつける。',
    sourceBook: '基本ルールブック P.36',
    recommendedSituationIds: [
      'other-unexpected-hint',
      'other-super-detective',
      'other-godspeed',
      'common-from-opposite',
      'other-weird-assistant'
    ],
    signatureSkills: [
      makeSkill(
        'sk-gen-1',
        '電撃的ひらめき',
        '探偵',
        '補助',
        '1',
        '助手の日常的な呟きや失敗行動から触発され、事件の核心に直結する大きな手掛かりを閃く。',
        '「……今、何と言った？ そうか、それだ！ なぜ気づかなかったんだ！」',
        '補助',
        '状況',
        ['other-unexpected-hint', 'other-super-detective']
      )
    ]
  },
  {
    id: 'det-eccentric',
    name: '変人',
    alias: 'Eccentric Detective',
    role: '探偵',
    concept: '常人離れした執着と偏愛を持つ、規格外の奇人探偵',
    description:
      '独自の美学、あるいは特殊なフェチズム（毒物、土壌、時計、暗号など）に異常な情熱を燃やす探偵。社会的な常識や空気は読めませんが、その偏執的な知識が難事件の突破口となります。',
    skillsAcquired: '鑑識カテゴリから2つ、学術カテゴリから2つ、好きなカテゴリから2つ',
    backgroundTable: [
      { roll: 1, title: '毒草・薬物マニア', description: '致死量から解毒法まであらゆる薬毒物を知り尽くし、匂いだけで調合を当てる。' },
      { roll: 2, title: '奇書蒐集家', description: '世界中のオカルト本や奇書を集める私設図書館に住み、古今東西の怪事件を熟知。' },
      { roll: 3, title: '骨董・アンティーク狂', description: '年代物の家具や装飾品の材質、歴史的背景から事件の背景を読み解く。' },
      { roll: 4, title: '暗号中毒', description: '日常会話も暗号化したがる偏執狂。どんな難解なメッセージも一瞬で解読する。' },
      { roll: 5, title: '解剖学の求道者', description: '人体の構造や骨格の可動域に異常な執着を持ち、傷跡から凶器の角度を算出。' },
      { roll: 6, title: '地下街の隠者', description: '日の光を嫌い、地下や薄暗い部屋でのみ驚異的な思考力を発揮する。' },
      { roll: 7, title: '虫愛づる探偵', description: '現場に飛来する昆虫や土壌微生物から死亡推定時刻を秒単位で割り出す。' },
      { roll: 8, title: '悪臭の鑑賞者', description: '常人なら吐き気を催す腐敗臭や薬品臭に美を見出し、冷静に成分を分析する。' },
      { roll: 9, title: '奇天烈な発明家', description: '自作の奇妙な調査ガジェットを多数開発し、現場で助手を使って実験する。' },
      { roll: 10, title: '死者との対話者', description: '遺体に語りかけるように観察し、死者が遺した無言のメッセージを汲み取る。' }
    ],
    investigationStyle: '特殊文献の読破、危険物や異物の嗅ぎ分け、馴染みの奇妙な店での情報収集',
    perceptionTendency: '【嗅覚】【マニアックな知識】に特化。普通なら気味悪がられる物証に大興奮する。',
    sourceBook: '基本ルールブック P.38',
    recommendedSituationIds: [
      'other-familiar-shop',
      'other-secret-exchange',
      'other-calm-down-detective',
      'other-detective-only',
      'other-closed-space'
    ],
    signatureSkills: [
      makeSkill(
        'sk-ecc-1',
        '偏執的鑑識眼',
        '探偵',
        '常駐',
        'なし',
        '一般人が見向きもしない鉱物片、毒物反応、珍しいタバコの灰などから産地や購入経路を特定する。',
        '現場の泥を指で掬い、嬉々として匂いを嗅ぎ、味わうかのように観察する。'
      )
    ]
  },
  {
    id: 'det-active',
    name: '行動派',
    alias: 'Active / Hardboiled',
    role: '探偵',
    concept: '足で稼ぎ、体を張って現場を駆け抜けるハードボイルド探偵',
    description:
      '安楽椅子に座っているのを嫌い、自らの足と拳、そしてタフな精神力で真相を掴み取るタフガイ。危険な張り込みや容疑者の追跡、時には裏社会の脅威にも屈せず真っ向から立ち向かいます。',
    skillsAcquired: '肉体カテゴリから2つ、交渉カテゴリから2つ、好きなカテゴリから2つ',
    backgroundTable: [
      { roll: 1, title: '元ボクサーの用心棒', description: '鍛え上げた肉体とタフネスを誇り、チンピラ相手なら拳一つで道を切り拓く。' },
      { roll: 2, title: '路地裏の野良犬', description: '裏社会の掟を熟知し、危険な情報屋とも腹を割って取引できる肝っ玉を持つ。' },
      { roll: 3, title: '不眠不休のタフガイ', description: '何日間の張り込みでもへこたれず、対象の油断した一瞬を決して逃さない。' },
      { roll: 4, title: '元傭兵のサバイバー', description: '戦場で培った危機察知能力とトラップ看破術で、危険な現場も難なく突破する。' },
      { roll: 5, title: '愛車と生きる男/女', description: '手入れの行き届いたクラシックカーや大型バイクを駆り、逃走犯を追い詰める。' },
      { roll: 6, title: '義理と人情の街角', description: '下町の住人たちから愛され、路地の八百屋や飲み屋から次々と目撃証言が集まる。' },
      { roll: 7, title: '傷だらけのトレンチコート', description: '数々の修羅場をくぐり抜けてきた歴戦の証として、体中に古傷が刻まれている。' },
      { roll: 8, title: '一匹狼のプライド', description: '組織に縛られるのを嫌い、己の信念と美学のために体を張って戦う。' },
      { roll: 9, title: '潜入工作の玄人', description: '清掃員や作業員に化けて警戒厳重な施設に忍び込み、決定的な証拠を押収する。' },
      { roll: 10, title: '相棒の盾となる覚悟', description: '「相棒には指一本触れさせない」を信条とし、いざとなれば身を挺して守る。' }
    ],
    investigationStyle: '長時間の張り込み、強行潜入、激しい追跡・カーチェイス、直接対決',
    perceptionTendency: '【体力】【危険察知】【動体視力】に長け、物理的な修羅場を切り抜ける。',
    sourceBook: '基本ルールブック P.40',
    recommendedSituationIds: [
      'other-hardboiled-action',
      'other-keiji-inquiry',
      'common-vs-suspect',
      'other-primitive',
      'other-sightseeing'
    ],
    signatureSkills: [
      makeSkill(
        'sk-act-1',
        '執念の張り込み',
        '探偵',
        '常駐',
        'なし',
        '悪天候や長時間の膠着状態でも集中を切らさず、対象の決定的な密会や動きを捉える。',
        '冷え切った車内、缶コーヒーを啜りながら暗闇の窓の光をじっと見据え続ける。'
      )
    ]
  }
];

/**
 * フタリソウサ 助手クラス（助手型）一覧
 */
export const ASSISTANT_CLASSES: CharacterClass[] = [
  {
    id: 'ast-devoted',
    name: '健気',
    alias: 'Devoted Assistant',
    role: '助手',
    concept: '探偵を心から崇拝・敬愛し、どんな無茶にも笑顔で寄り添う一番の理解者',
    description:
      '探偵の才能を誰よりも信じ、どんな奇行や無理難題にも一生懸命に応えようとする助手。探偵が落ち込んだり行き詰まった時には、温かい信頼と励ましで「余裕」を取り戻させます。',
    skillsAcquired: '生活カテゴリから2つ、交渉カテゴリから2つ、好きなカテゴリから2つ',
    backgroundTable: [
      { roll: 1, title: '命を救われた恩義', description: '過去の事件で探偵に命を救われ、その恩に報いるため生涯を共にする決意をした。' },
      { roll: 2, title: '熱烈な一番弟子', description: '探偵の著作や噂に憧れ、門前払いを何度も乗り越えて助手として認められた。' },
      { roll: 3, title: '幼馴染の腐れ縁', description: '物心ついた頃からの付き合いで、探偵の弱点も好物もすべて知り尽くしている。' },
      { roll: 4, title: '住み込み家政係', description: '家賃や食事の管理を一手に引き受け、探偵が生活破綻しないよう支え続ける。' },
      { roll: 5, title: '癒しのマスコット', description: 'その場の空気をパッと明るくする天真爛漫さで、ピリピリした現場を和ませる。' },
      { roll: 6, title: '無私の献身', description: '自分の用事は後回しにしてでも、探偵の捜査を最優先でサポートする。' }
    ],
    investigationStyle: '献身的なおつかい、聞き込みでの愛嬌、探偵のメンタルケア、危険時の盾',
    perceptionTendency: '【愛着】【観察（探偵の表情）】に優れ、探偵のコンディションを保つ。',
    sourceBook: '基本ルールブック P.44',
    recommendedSituationIds: [
      'other-assistant-only',
      'other-calm-down-detective',
      'common-why',
      'other-sightseeing',
      'other-familiar-shop'
    ],
    signatureSkills: [
      makeSkill(
        'sk-dev-1',
        '無償のサポート',
        '助手',
        '補助',
        'なし',
        '探偵の疲れを察して温かい飲み物を差し入れたり、優しい言葉をかけて【余裕】を回復させる。',
        '「探偵さん、少し根を詰めすぎですよ。はい、ホットココアを淹れてきました」'
      )
    ]
  },
  {
    id: 'ast-victim',
    name: '振り回され',
    alias: 'Trouble-prone / Bystander',
    role: '助手',
    concept: '探偵の奇行や事件のトラブルに絶えず巻き込まれる、苦労性の常識人ツッコミ役',
    description:
      '一般人の感覚を持ち、「なんで私がこんな目に!?」とボヤきながらも放っておけない優しいお人好し。なぜか事件の鍵となるトラブルや怪しい人物に真っ先に遭遇する体質を持っています。',
    skillsAcquired: '生活カテゴリから2つ、直感カテゴリから2つ、好きなカテゴリから2つ',
    backgroundTable: [
      { roll: 1, title: 'たまたま居合わせた一般人', description: '第一発見者になったことが縁で、なし崩し的に助手をやらされている。' },
      { roll: 2, title: '貧乏暇なしアルバイター', description: '割のいい高時給バイトの募集に応募したら、命がけの探偵事務所だった。' },
      { roll: 3, title: '苦労性の大家さん', description: '家賃滞納を回収しに来るたび、事件に巻き込まれて手伝わされる。' },
      { roll: 4, title: '死神体質', description: '行く先々で殺人事件や怪奇事件に出くわす、恐るべきトラブル引き寄せ体質。' },
      { roll: 5, title: '常識人の悲哀', description: '周囲の変人たちに鋭くツッコミを入れ続け、いつも胃薬が手放せない。' },
      { roll: 6, title: 'お人好しの極み', description: '泣いている人を見ると見捨てられず、結局探偵に頭を下げて依頼を頼む。' }
    ],
    investigationStyle: 'トラブルへの直面、悲鳴による探偵の呼び寄せ、一般人目線からの素朴な疑問',
    perceptionTendency: '【危機遭遇】【常識感覚】が高く、助手の悲鳴が事件を大きく動かす。',
    sourceBook: '基本ルールブック P.46',
    recommendedSituationIds: [
      'other-unexpected-hint',
      'other-weird-assistant',
      'other-closed-space',
      'other-calm-down-detective',
      'common-from-opposite'
    ],
    signatureSkills: [
      makeSkill(
        'sk-vic-1',
        '何気ない素朴な疑問',
        '助手',
        '補助',
        'なし',
        '助手自身は何も考えずに発した「素朴な疑問」が、探偵の思考の壁を打ち破る特大のヒントとなる。',
        '「でもこれ、左利きの人なら逆向きに置くんじゃないですか？……えっ、私何か変なこと言いました？」'
      )
    ]
  },
  {
    id: 'ast-business',
    name: 'ビジネス・仕事人',
    alias: 'Business / Professional Assistant',
    role: '助手',
    concept: '事務所の経営、スケジュール管理、経費精算を司る敏腕マネージャー助手',
    description:
      '報酬交渉や依頼人とのアポイントメント、公式な書類作成など実務を一手に担う現実主義者。ドライに見えてその実、探偵が金銭的・社会的に破綻しないよう完璧にガードしています。',
    skillsAcquired: '交渉カテゴリから2つ、学術カテゴリから2つ、好きなカテゴリから2つ',
    backgroundTable: [
      { roll: 1, title: '敏腕マネージャー', description: '芸能人や政財界とのコネクションを持ち、過密な調査スケジュールを完璧に管理する。' },
      { roll: 2, title: '元エリート秘書', description: '書類作成、法的手続き、名刺交換などビジネスの礼儀作法で先方の信頼を勝ち取る。' },
      { roll: 3, title: '経理の鬼', description: '領収書のない経費は1円たりとも認めず、探偵の無駄遣いを厳しく監視する。' },
      { roll: 4, title: '契約書の番人', description: '依頼人との契約条項を綿密に結び、事件後の報酬未払いや法廷闘争を未然に防ぐ。' },
      { roll: 5, title: '沈着冷静な交渉人', description: '相手の脅しやハッタリを冷笑で受け流し、有利な条件を提示して話をまとめる。' },
      { roll: 6, title: 'ガジェット調達屋', description: '捜査に必要な特殊機材や車両を合法的なルートで素早く手配する。' }
    ],
    investigationStyle: '公的アポ取り、依頼料や経費の請求、関係機関とのスマートな交渉、資料ファイリング',
    perceptionTendency: '【交渉力】【スケジュール管理】【情報整理】に長け、無駄な足踏みを防ぐ。',
    sourceBook: '基本ルールブック P.48',
    recommendedSituationIds: [
      'common-collaborator',
      'other-guest-investigation',
      'other-colleague-coop',
      'other-secret-exchange',
      'other-representative-npc'
    ],
    signatureSkills: [
      makeSkill(
        'sk-bus-1',
        '迅速なアポイントメント',
        '助手',
        '補助',
        '1',
        '多忙な要人や気難しい相手に正規の手続きで素早く面談を取り付け、門前払いを防ぐ。',
        '手帳とスマートフォンを滑らかに操作し、「15時より面談枠を確保しました」'
      )
    ]
  },
  {
    id: 'ast-partner',
    name: '相棒・対等パートナー',
    alias: 'Equal Partner',
    role: '助手',
    concept: '対等な目線で意見をぶつけ合い、背中を預け合って事件に挑む真の相棒',
    description:
      '主従関係ではなく、互いの能力を認め合う対等なパートナー。探偵の推理に鋭いツッコミや別の視点を提示し、別行動でも単独で証拠を集めてくるなど、実力派のバディとして活躍します。',
    skillsAcquired: '肉体カテゴリから2つ、洞察カテゴリから2つ、好きなカテゴリから2つ',
    backgroundTable: [
      { roll: 1, title: '元同僚のライバル', description: 'かつて同じ組織で競い合ったライバルであり、誰よりも探偵の力量を認めている。' },
      { roll: 2, title: '背中合わせの相棒', description: '修羅場を幾度も共にくぐり抜け、言葉がなくても合図ひとつで呼吸を合わせられる。' },
      { roll: 3, title: '武闘派のブレーキ役', description: '探偵の頭脳と自身の腕っぷしを組み合わせ、最強のバディとして君臨する。' },
      { roll: 4, title: '悪友コンビ', description: '憎まれ口を叩き合いながらも、ピンチの時には絶対に駆けつける熱い絆。' },
      { roll: 5, title: '別動隊のプロ', description: '探偵とは真逆のルートから独自に調査を進め、決定的な裏付けを取ってくる。' },
      { roll: 6, title: '最後の切り札', description: '探偵が万策尽きた時、「ここからは俺の出番だな」と頼もしく前に出る。' }
    ],
    investigationStyle: '二手に分かれての二重捜査、ブレインストーミング、同時アタック、背中合わせの格闘',
    perceptionTendency: '【独立行動力】【議論・ディベート能力】【信頼感】が高く、穴のない捜査を展開。',
    sourceBook: '基本ルールブック P.52 / サプリメント『探偵の友達』',
    recommendedSituationIds: [
      'other-colleague-coop',
      'other-detective-only',
      'other-assistant-only',
      'other-experiment',
      'common-collaborator'
    ],
    signatureSkills: [
      makeSkill(
        'sk-par-1',
        '二面挟み撃ち',
        '助手',
        '補助',
        '2',
        '探偵と別ルートで同時に調査を進め、短時間で2倍の情報量を持ち寄る。',
        '「お前は現場を洗え。俺は裏口の足跡を追う。1時間後に落ち合おう」'
      )
    ]
  }
];

/**
 * フタリケイジ 刑事クラス（刑事型）一覧
 */
export const POLICE_CLASSES: CharacterClass[] = [
  {
    id: 'pol-veteran',
    name: 'ベテラン刑事（叩き上げ）',
    alias: 'Veteran Detective Officer',
    role: '刑事',
    concept: '靴底を減らして現場を歩き、百戦錬磨の勘と人情でホシを挙げるベテラン捜査官',
    description:
      '長年の現場経験で培われた鋭い勘と人情味あふれる説得力を持つ叩き上げ刑事。机上の理論よりも現場百回を信条とし、容疑者の心の隙間に入り込んで自供を引き出します。',
    skillsAcquired: '鑑識カテゴリから2つ、交渉カテゴリから2つ、好きなカテゴリから2つ',
    backgroundTable: [
      { roll: 1, title: '現場百回の執念', description: '誰もが諦めた現場に何度も足を運び、見落とされた決定的な証拠を見つけ出す。' },
      { roll: 2, title: '取調室の落としの名人', description: '好物の差し入れと温かい言葉で頑なな容疑者の涙を誘い、自供へと導く。' },
      { roll: 3, title: '所轄の古狸', description: '管轄エリアの路地や住人の人間関係を隅々まで知り尽くしている。' },
      { roll: 4, title: '殉職した相棒の誓い', description: 'かつて命を落とした相棒の手錠を受け継ぎ、正義を貫くことを誓っている。' },
      { roll: 5, title: '刑事部屋の頑固親父', description: '若い捜査員を時に怒鳴り、時に背中を押して一人前の刑事に育て上げる。' },
      { roll: 6, title: '靴底の減った革靴', description: '地道なシラミ潰しの聞き込みこそ最大の武器と信じる足で稼ぐスタイル。' },
      { roll: 7, title: '情報屋との厚い信頼', description: '裏通りの怪しげな情報屋たちとも長年の付き合いで太いパイプを持つ。' },
      { roll: 8, title: '定年間近の意地', description: '退官の日が迫る中、長年追い続けてきた未解決事件の再捜査に執念を燃やす。' },
      { roll: 9, title: '修羅場を潜った傷跡', description: '過去の銃撃戦や刃傷沙汰の傷跡が体に残り、犯罪者の威嚇にも眉一つ動かさない。' },
      { roll: 10, title: '人情味あふれる説諭', description: '罪を憎んで人を憎まず。罪を償った後の人生まで見据えて容疑者を諭す。' }
    ],
    investigationStyle: '地道な聞き込みローラー作戦、張り込み、取調室での心理的駆け引き',
    perceptionTendency: '【人情・交渉】【現場勘】【忍耐力】に優れ、粘り強い捜査を展開する。',
    sourceBook: 'サプリメント『フタリケイジ』',
    recommendedSituationIds: [
      'other-keiji-inquiry',
      'other-keiji-large-scale',
      'common-vs-suspect',
      'other-representative-npc'
    ],
    signatureSkills: [
      makeSkill(
        'sk-vet-1',
        '現場百回の眼力',
        'ゲスト',
        '常駐',
        'なし',
        '一度調べ尽くされた現場や証拠品を再検証し、他の捜査官が見落としていた微細な矛盾を炙り出す。',
        '「おい、鑑識。もう一度ここをルミノールで照らしてくれ。嫌な予感がする」'
      ),
      makeSkill(
        'sk-vet-2',
        '落としの尋問',
        'ゲスト',
        '補助',
        '1',
        '容疑者の心情やプライドに寄り添い、頑なな黙秘を崩して真実の供述を引き出す。',
        '「お前さんの故郷の母ちゃんが、この寒空の下で泣いてるぞ。全部話して楽になりな」'
      )
    ]
  },
  {
    id: 'pol-career',
    name: 'キャリア・警視',
    alias: 'Elite Inspector',
    role: '刑事',
    concept: '警察機構の巨大な組織力と最新鑑識網をチェスの駒のように操る若きエリート',
    description:
      '国家公務員総合職試験をパスした警察庁のキャリア組。若くして警視以上の階級を持ち、所轄の捜査本部を統括。感情を排した冷徹なデータ分析と公的権限で事件を外堀から包囲します。',
    skillsAcquired: '洞察カテゴリから2つ、法規・学術カテゴリから2つ、好きなカテゴリから2つ',
    backgroundTable: [
      { roll: 1, title: '警察庁の超新星', description: '東大法学部を首席卒業し、最年少で捜査一課の指揮官に抜擢されたエリート。' },
      { roll: 2, title: '科学捜査の推進者', description: 'AI監視カメラやDNAプロファイリングなど最新技術を現場に積極導入する。' },
      { roll: 3, title: '冷徹なチェスプレイヤー', description: '捜査員を合理的な駒として配置し、最小の犠牲で最大の成果を狙う。' },
      { roll: 4, title: '警察組織の改革者', description: '旧弊な体質や隠蔽工作を嫌悪し、クリーンな新時代の警察を目指す。' },
      { roll: 5, title: '法と令状の信奉者', description: '違法捜査を一切認めず、完璧な手続きと法的証拠のみで犯人を詰む。' },
      { roll: 6, title: '現場へのリスペクト', description: 'エリートでありながら叩き上げの勘や職人技にも敬意を払う度量の持ち主。' },
      { roll: 7, title: '政財界の圧力に抗う者', description: '上層部からのもみ消し要請にも毅然と反発し、正義のために職を賭す。' },
      { roll: 8, title: '冷徹な仮面の下の情熱', description: '表向きは冷静沈着だが、心の奥底には悪を許さぬ激しい正義の炎を宿す。' },
      { roll: 9, title: '公的包囲網の発動者', description: '検問、指名手配、報道統制などを一斉に指令し、逃亡犯の退路を瞬時に断つ。' },
      { roll: 10, title: '相棒の刑事への信頼', description: '現場で共に汗を流す相棒を深く信頼し、背広の泥を厭わず現場に立つ。' }
    ],
    investigationStyle: '大規模な捜査網の展開、公的データベース照会、監視カメラ網の解析、法規の適用',
    perceptionTendency: '【組織統率】【論理分析】【法知識】が高く、言い逃れの余地を許さない。',
    sourceBook: 'サプリメント『フタリケイジ』',
    recommendedSituationIds: [
      'other-keiji-large-scale',
      'common-collaborator',
      'other-representative-npc'
    ],
    signatureSkills: [
      makeSkill(
        'sk-car-1',
        '緊急配備・一斉照会',
        'ゲスト',
        '補助',
        '2',
        '警察組織のデータベースに緊急照会を行い、逃走車両のナンバーや容疑者の素性を瞬時に特定する。',
        '警察無線を取り、「全車両へ緊急手配。ターゲットの逃走ルートを遮断せよ」と鋭く指示する。'
      )
    ]
  },
  {
    id: 'pol-forensic',
    name: '科学鑑識官',
    alias: 'Forensic Specialist',
    role: '刑事',
    concept: '物証は嘘をつかない――科学の光で現場の真実を語らせる鑑識のスペシャリスト',
    description:
      '指紋、ルミノール反応、繊維片、足痕など、現場に残された微物証から犯人の足取りを暴き出すプロ。物言わぬ死者や遺留品の声を聞き、科学的根拠に基づいて捜査員を導きます。',
    skillsAcquired: '鑑識カテゴリから3つ、学術カテゴリから1つ、好きなカテゴリから2つ',
    backgroundTable: [
      { roll: 1, title: '科捜研の奇才', description: '化学分析から画像解析までこなす科学捜査研究所出身のスペシャリスト。' },
      { roll: 2, title: '鑑識一筋の職人', description: 'ピンセットと刷毛を手に何十年も現場のゴミを拾い続けてきた伝説の鑑識官。' },
      { roll: 3, title: '法医学の協力者', description: '監察医と密接に連携し、解剖結果から凶器の形状や犯人の体格を即座に割り出す。' },
      { roll: 4, title: '現場保全の鬼', description: '「足跡を踏むな！」と怒鳴りつけ、現場の些細な乱れも絶対に許さない。' },
      { roll: 5, title: '微物証の語り部', description: '「物証は決して嘘をつきません」を信念に、科学的真実を静かに語る。' },
      { roll: 6, title: '特殊撮影のプロ', description: '赤外線カメラや斜光撮影を駆使し、肉眼では見えない擦過痕を鮮明に浮き彫りにする。' },
      { roll: 7, title: '毒物・劇薬の鑑定士', description: '未知の薬品や合成毒にも迅速に対応し、その製造元や入手経路を特定する。' },
      { roll: 8, title: '鑑識車両の主', description: '最新の移動鑑識ラボ車両を操り、現場に居ながらにして高度な分析を行う。' },
      { roll: 9, title: 'デジタル鑑識のエキスパート', description: '破損したスマートフォンや防犯カメラのハードディスクからデータを復元する。' },
      { roll: 10, title: '刑事への信頼', description: '「俺が証拠を見つける。ホシを挙げるのはお前の仕事だ」と相棒に物証を託す。' }
    ],
    investigationStyle: '指紋採取、ルミノール検査、微物証の顕微鏡分析、足痕・タイヤ痕の石膏採取',
    perceptionTendency: '【鑑識科学】【微細観察】【客観分析】に特化。',
    sourceBook: 'サプリメント『フタリケイジ』',
    recommendedSituationIds: [
      'common-scene',
      'other-experiment',
      'other-traditional'
    ],
    signatureSkills: [
      makeSkill(
        'sk-for-1',
        '精密ルミノール反応',
        'ゲスト',
        '常駐',
        'なし',
        '洗い流された血痕や微量な体液反応を可視化し、犯行の真の現場や動線を暴き出す。',
        '試薬を吹き付け、紫外線を照射する。「青白く光っている……ここが最初の凶行現場だ」'
      )
    ]
  }
];

/**
 * フタリソウサ 公式自動取得アクション（役割別基本アクション）
 * ※ クラスの固有アクションとは独立し、探偵・助手・刑事の各キャラクターが無条件で自動取得するアクション
 */
export const AUTOMATIC_ACTIONS: CharacterSkill[] = [
  // 探偵の自動取得アクション
  {
    id: 'auto-det-hirameki',
    name: 'ひらめき',
    role: '探偵',
    category: '自動取得',
    type: '補助',
    cost: 'なし',
    description:
      '判定の直後に使用できる。または知覚判定を行わずに【手がかり】を1つ獲得する。ダイスの出目が気に入らない場合に振り直すか、鋭い直感で即座に真相の糸口を掴む。',
    flavor: '「……そうか、そういうことだったのか！ 全てが一本の線に繋がったぞ！」',
    timing: '調査中',
    target: '自身'
  },
  {
    id: 'auto-det-trust',
    name: 'パートナーへの信頼',
    role: '探偵',
    category: '自動取得',
    type: '補助',
    cost: 'なし',
    description:
      '助手が行動する際、探偵が深い信頼を寄せることで、助手の緊張を解きほぐし【余裕】を1点回復させる。または助手の判定をサポートする。',
    flavor: '「君がいてくれたからこそ、ここまで辿り着けた。頼りにしているよ」',
    timing: '調査中',
    target: '助手'
  },
  {
    id: 'auto-det-meikyu',
    name: '迷宮入り（最後の推理）',
    role: '探偵',
    category: '自動取得',
    type: '補助',
    cost: 'なし',
    description:
      '集めた全ての手がかりを繋ぎ合わせ、犯人のトリックと動機、犯行の全貌を関係者全員の前で暴き立てる。真相解明フェイズへと移行する。',
    flavor: '「謎はすべて解けた。犯人は……あなたですね」',
    timing: '真相解明時',
    target: '全体'
  },

  // 助手の自動取得アクション
  {
    id: 'auto-ast-assist',
    name: 'アシスト',
    role: '助手',
    category: '自動取得',
    type: '補助',
    cost: 'なし',
    description:
      '探偵の調査や判定を物理的・精神的に手助けする。探偵が判定で振るサイコロを1個増やし、捜査の成功率を高める。',
    flavor: '「探偵さん、これを使ってください！ 私も全力で手伝います！」',
    timing: '判定直前',
    target: '探偵'
  },
  {
    id: 'auto-ast-sympathy',
    name: '感情の共有',
    role: '助手',
    category: '自動取得',
    type: '補助',
    cost: 'なし',
    description:
      '探偵と共に悩み、喜び、不安を分かち合うことで、探偵の精神的負荷を和らげる。【余裕】が減少した探偵に温かく寄り添い、気持ちを落ち着かせる。',
    flavor: '「大丈夫ですよ、探偵さん。どんな難事件でも、私が最後までお供します」',
    timing: '調査中',
    target: '探偵'
  },
  {
    id: 'auto-ast-dragged',
    name: '引っ張り回される',
    role: '助手',
    category: '自動取得',
    type: '補助',
    cost: 'なし',
    description:
      '探偵の突拍子もない思いつきや急な呼び出しに無理やり付き合わされ、ドタバタと現場へ駆けつける。その過程で思いがけない目撃者や手がかりと遭遇する。',
    flavor: '「ちょっと、待ってくださいよ！ いきなり走り出すなんて聞いてません！」',
    timing: '調査中',
    target: '自身'
  },

  // 刑事（ゲスト）の自動取得アクション
  {
    id: 'auto-pol-warrant',
    name: '捜査要請（公的権限）',
    role: 'ゲスト',
    category: '自動取得',
    type: '補助',
    cost: 'なし',
    description:
      '警察手帳を提示し、公的な捜査協力を要請する。民間人や施設管理者からの立ち入り拒否や情報提供の拒絶を退け、正規のルートで協力を取り付ける。',
    flavor: '「所轄の者です。事件の重要参考事項につき、ご協力願います」',
    timing: '調査中',
    target: '関係者'
  },
  {
    id: 'auto-pol-command',
    name: '現場指揮（バックアップ）',
    role: 'ゲスト',
    category: '自動取得',
    type: '補助',
    cost: 'なし',
    description:
      '現場の捜査員や部下に的確な指示を飛ばし、鑑識や交通整理、周囲の警戒網を迅速に敷かせる。',
    flavor: '「鑑識班、至急足痕の採取を急げ！ 周辺の聞き込み班は配置につけ！」',
    timing: '判定時',
    target: '部下・現場'
  }
];

/**
 * 全クラスの統合リスト（探偵・助手・刑事）
 */
export const ALL_CHARACTER_CLASSES: CharacterClass[] = [
  ...DETECTIVE_CLASSES,
  ...ASSISTANT_CLASSES,
  ...POLICE_CLASSES
];

/**
 * フタリ固有アクション（二人の絆・共同アクション）
 */
export const FUTARI_SIGNATURE_SKILLS: CharacterSkill[] = [
  makeSkill(
    'futari-back-to-back',
    '背中を預けて',
    'フタリ',
    '補助',
    '2',
    '探偵と助手が互いの存在を信じ合い、ピンチを切り抜ける。シチュエーション捜査中、お互いの感情値や余裕を支え合う。',
    '「お前が後ろにいるなら、私は前だけを見ていられる」「もちろんですよ、任せてください」'
  ),
  makeSkill(
    'futari-tacit-understanding',
    '阿吽の呼吸',
    'フタリ',
    '補助',
    '1',
    '言葉を交わさずとも二人の意図が通じ合い、捜査で追加の【情報】または【余裕】を獲得する。',
    '視線を交わした瞬間、二人は同時に同じ証拠品へ手を伸ばした。'
  ),
  makeSkill(
    'futari-promise',
    '二人の約束',
    'フタリ',
    '常駐',
    'なし',
    '事件解決への誓いや二人の間の決め事を思い出し、乱れたペースを取り戻す。',
    '「約束しただろう、どんな真実であれ最後まで見届けると」'
  ),
  makeSkill(
    'futari-divergent-deduction',
    '異なる視点の合流',
    'フタリ',
    '補助',
    '1',
    '探偵の鋭い閃きと助手の素直な着眼点が奇跡的に噛み合い、行き詰まった捜査に突破口を見出す。',
    '「……待て、助手の今の言葉、もう一度言ってくれ！」「えっ、私のただの独り言ですよ？」'
  )
];

/**
 * ゲスト固有アクション（NPC・ゲスト参加者・外部協力者アクション）
 */
export const GUEST_SIGNATURE_SKILLS: CharacterSkill[] = [
  makeSkill(
    'guest-third-perspective',
    '第三者の視点',
    'ゲスト',
    '常駐',
    'なし',
    '事件の当事者でも専門捜査官でもない立場から、誰もが当たり前と見過ごしていた盲点を指摘する。',
    '「あの……素人の変な質問かもしれませんけど、どうして時計が止まっていたんですか？」'
  ),
  makeSkill(
    'guest-confession',
    '事件関係者の告白',
    'ゲスト',
    '補助',
    '1',
    '隠していた秘密や心の内を吐露し、事件の動機や人間関係の核心を明かす。',
    '「もう隠し通すのは無理ですね。あの日、私が部屋へ行ったのは……」'
  ),
  makeSkill(
    'guest-special-connection',
    '特異な情報網',
    'ゲスト',
    '常駐',
    'なし',
    'ゲストキャラクターの職業や立場（記者、医者、裏社会の知人など）を活かし、特別な情報を探偵たちに提供する。',
    '「業界の古いツテを当たってみました。このサイン、十年前のあの一族のものです」'
  ),
  makeSkill(
    'guest-unexpected-intervention',
    '思わぬ横槍',
    'ゲスト',
    '補助',
    'なし',
    'ゲストの突発的な行動や介入により、膠着した状況が一気に動き出す。',
    '「待ってください！ その人を犯人と決めつけるのは早すぎます！」'
  )
];

/**
 * クラス固有アクションの統合リスト（自動取得アクションは含みません）
 * 役割は「探偵」「助手」「フタリ」「ゲスト」の4区分
 */
export const ALL_CHARACTER_SKILLS: CharacterSkill[] = [
  ...ALL_CHARACTER_CLASSES.flatMap((c) =>
    c.signatureSkills.map((s) => ({
      ...s,
      role: ((s.role as string) === '刑事' ? 'ゲスト' : s.role) as SkillRole
    }))
  ),
  ...FUTARI_SIGNATURE_SKILLS,
  ...GUEST_SIGNATURE_SKILLS
];
