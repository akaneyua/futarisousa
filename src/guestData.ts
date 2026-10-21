import { GuestCharacter } from './types.ts';

// Preset avatar silhouettes for instant selection
export const PRESET_AVATARS: { id: string; label: string; url: string }[] = [
  {
    id: 'lady',
    label: '女性・依頼人',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'detective-cop',
    label: '刑事・男性',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'gentleman',
    label: '実業家・紳士',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'informant',
    label: '情報屋・青年',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'elderly',
    label: '老人・当主',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'maid',
    label: 'メイド・助手',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_GUEST_CHARACTERS: GuestCharacter[] = [
  {
    id: 'guest-1',
    name: '城ヶ崎 玲香（じょうがさき れいか）',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    summary: '屋敷で起きた名画盗難事件の調査を依頼してきた旧家の令嬢。事件の真相と家族の秘密に怯えている。',
    profile: '22歳。城ヶ崎家の次女。礼儀正しく落ち着いた物腰の良家のお嬢様。普段は気品漂う佇まいを見せるが、父親の急逝とそれに伴う一族の遺産争いに深く心を痛めている。',
    recommendedSkills: '《心理》《聞き込み》《美術》',
    classCandidates: '助手（巻き込まれ）、お嬢様',
    content: '盗まれた名画「夜の帳」には、亡き当主の隠された遺言が暗号として塗り込められていた。玲香は犯人が身内である可能性を恐れており、警察には言えない真実を暴いてほしいと探偵事務所の扉を叩いた。探偵たちが誠意を持って接すれば、屋敷の見取り図や一族の確執を打ち明けてくれる。',
    reactionTable: [
      {
        roll: 1,
        title: '震える声での懇願',
        reaction: '「どうか、父の最期の願いを守ってください…」と探偵の袖を掴み、涙を浮かべてすがる。',
        effect: 'キーワードまたは屋敷の隠し通路の情報を獲得'
      },
      {
        roll: 2,
        title: '視線を逸らす動揺',
        reaction: '一族の話題になると、握りしめたティーカップをカタカタと震わせ、何かを隠すように俯く。',
        effect: '《心理》判定成功で、彼女が特定の家族を庇っていることに気づく'
      },
      {
        roll: 3,
        title: '合鍵の託け',
        reaction: '「夜分なら、警備の目も緩みますから」と、古風な真鍮の合鍵をそっと探偵に手渡す。',
        effect: '施錠された書斎や保管室の調査が可能になる'
      },
      {
        roll: 4,
        title: '毅然とした拒絶',
        reaction: '核心を突かれた質問に一瞬息を詰めるが、「それ以上は私的な事柄です」と冷たく唇を噛みしめる。',
        effect: '《説得》や《交渉》の判定が必要になる'
      },
      {
        roll: 5,
        title: '涙の告白',
        reaction: '「私、本当は…名画の行方よりも、家族が壊れてしまうのが怖かったんです」と本音を吐露する。',
        effect: '探偵たちに心を開き、以後の判定に有利を得る'
      },
      {
        roll: 6,
        title: '決定的証言',
        reaction: '「そういえば…あの夜、中庭で甘い香水の匂いがしたのを思い出しました！」と閃く。',
        effect: '犯人の身元や手がかりを示す重要キーワードを獲得'
      }
    ],
    sourceBook: '基本ルールブック',
    tags: ['依頼人', 'お嬢様', '重要証言']
  },
  {
    id: 'guest-2',
    name: '鬼塚 剛（おにづか ごう）',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    summary: '所轄の叩き上げベテラン刑事。探偵たちを民間人と煙たがりつつも、その推理力を誰よりも信頼している。',
    profile: '48歳。所轄警察署・刑事課の警部補。くたびれたトレンチコートと咥えタバコがトレードマーク。組織の建前よりも被害者の無念を晴らすことを重んじる一本気な熱血漢。',
    recommendedSkills: '《現場》《鑑識》《警察関係》《事情聴取》',
    classCandidates: '刑事（ベテラン）、刑事（現場主義）',
    content: '警察組織のルールにはうるさいが、探偵が理路整然とした推理を見せると「チッ、勝手にしろ」と現場の立ち入りを目こぼししてくれる。本庁のエリート捜査員と対立しており、探偵たちと密かに情報交換を行うパイプ役となる。',
    reactionTable: [
      {
        roll: 1,
        title: '捜査メモの横流し',
        reaction: '「おい、俺は机の上に何も置いてねえぞ」と背を向け、現場鑑識資料のコピーを置いて立ち去る。',
        effect: '現場の未公開鑑識データを獲得'
      },
      {
        roll: 2,
        title: '現場の目こぼし',
        reaction: '「俺は5分間だけ外でタバコを吸ってくる。中に誰がいようと知ったこっちゃねえ」と笑う。',
        effect: '立ち入り禁止現場の再調査が可能になる'
      },
      {
        roll: 3,
        title: '煙草の煙と忠告',
        reaction: '「上層部がこの件から手を引けと圧力をかけてきている。ヤマに深入りするなよ」と警告する。',
        effect: '事件の背後に大物が絡んでいることを察知'
      },
      {
        roll: 4,
        title: '強面での威圧',
        reaction: '「おい民間人！無茶して死んだら化けて出ても知らんぞ」と怒鳴りつつ、温かい缶コーヒーを放る。',
        effect: 'PC全員の精神的余裕を回復または活力を与える'
      },
      {
        roll: 5,
        title: '過去の無念',
        reaction: '「10年前にも似た事件があった。あのときは犯人を逃がしちまった…」と苦々しく語り出す。',
        effect: '過去の未解決事件との共通点を発見'
      },
      {
        roll: 6,
        title: '緊急無線の速報',
        reaction: '「無線だ！ 容疑者の目撃情報が入ったぞ、車に乗れ！」とパトカーへ手招きする。',
        effect: '容疑者の現在位置へ即座に急行できる'
      }
    ],
    sourceBook: '基本ルールブック',
    tags: ['刑事', '協力者', '現場主義']
  },
  {
    id: 'guest-3',
    name: '雨宮 怜（あまみや れい）',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    summary: '裏通りの古書店「青猫堂」の店主。表向きは物静かな読書家だが、街の闇ルートと裏事情を牛耳る情報屋。',
    profile: '年齢不詳（30代前半に見える）。黒髪の長髪にアンティークの丸眼鏡。常に穏やかで冷ややかな微笑を絶やさない。「情報は対価を払う者にのみ微笑む」が信条。',
    recommendedSkills: '《裏社会》《交渉》《買収》《情報》',
    classCandidates: '助手（裏社会）、情報屋',
    content: '警察が手を出せないブラックマーケットやアンダーグラウンドの動向に精通している。金銭だけでなく、探偵が掴んだ珍しいスキャンダルや別の事件の秘密など、同等の価値を持つネタと引き換えに有力な証拠を提供する。',
    reactionTable: [
      {
        roll: 1,
        title: 'お茶の濁し',
        reaction: '「いらっしゃい。お探しの稀覯本なら昨日のうちに売れてしまいましたよ」と優雅に煙に巻く。',
        effect: '《交渉》または金銭・情報対価の提示が必要'
      },
      {
        roll: 2,
        title: '意味深な耳打ち',
        reaction: '「あの被害者、事件の3日前にある地下カジノで派手に負けていたそうですよ」と核心の端緒を売る。',
        effect: '被害者の隠された借金・トラブルの手がかりを獲得'
      },
      {
        roll: 3,
        title: '交換条件の提示',
        reaction: '「とある人物の身元を調べてくれたら、この防犯カメラの映像をお渡ししましょう」。',
        effect: 'サイドクエストまたは交換条件が発生'
      },
      {
        roll: 4,
        title: '冷徹な警告',
        reaction: '「これ以上その件を嗅ぎ回ると、あなたの背後に消し屋が立ちますよ」と目を細める。',
        effect: '黒幕の危険度を把握し、調査に緊張感が走る'
      },
      {
        roll: 5,
        title: '秘蔵資料の開示',
        reaction: '奥の書架から黄ばんだ古い顧客名簿を取り出し、「これがお探しの偽名リストです」と差し出す。',
        effect: '容疑者の偽名と裏の正体を即座に暴く'
      },
      {
        roll: 6,
        title: '逃走の合図',
        reaction: '「おや、歓迎されない客が路地に入ってきたようだ」と裏口の鍵を開け、探偵たちを逃がす。',
        effect: '敵の急襲を回避し、安全な潜伏先を確保'
      }
    ],
    sourceBook: 'サプリメント',
    tags: ['情報屋', '裏社会', '古書店']
  },
  {
    id: 'guest-4',
    name: '神埼 雅人（かんざき まさと）',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    summary: '被害者と共同事業を展開していた新進気鋭のIT実業家。完璧なアリバイを主張するが、目の奥に焦燥が漂う。',
    profile: '36歳。隙のないオーダーメイドスーツを着こなす冷徹な野心家。頭の回転が極めて速く、警察や探偵の質問にも理路整然と反論するが、プライドが高く挑発に弱い。',
    recommendedSkills: '《論理》《追及》《ハッタリ》《心理》',
    classCandidates: '探偵（冷徹）、重要参考人',
    content: '被害者との間に巨額の損害賠償を巡る密約が存在していた。アリバイ工作は綿密だが、事件現場に残された最新ガジェットや通信記録のタイムスタンプに致命的なズレがある。矛盾を突きつけられると激昂し、思わぬボロを出す。',
    reactionTable: [
      {
        roll: 1,
        title: '冷笑と門前払い',
        reaction: '「警察の取り調べにも全て応じましたよ。探偵ごっこの相手をしている暇はありません」と鼻で笑う。',
        effect: '《ハッタリ》や《追及》で主導権を奪い返す必要がある'
      },
      {
        roll: 2,
        title: '流暢すぎるアリバイ主張',
        reaction: '手帳を開き、分刻みのスケジュールと会食相手の名前を澱みなく淀みなく暗唱する。',
        effect: 'あまりに整いすぎた証言の不自然さに気づく'
      },
      {
        roll: 3,
        title: '弁護士のちらつかせ',
        reaction: '「これ以上の名誉毀損には顧問弁護士を通じて法的措置を講じます」とスマートフォンを叩く。',
        effect: '強気の態度だが、指先が微かに震えている'
      },
      {
        roll: 4,
        title: '動揺の露呈',
        reaction: '探偵が未公開のメール記録に言及した途端、手に持った万年筆を取り落とし、顔色を変える。',
        effect: '《心理》有利。彼が隠そうとしている契約書を特定'
      },
      {
        roll: 5,
        title: '責任転嫁の叫び',
        reaction: '「私を疑う前に、あの怪しい会計士を調べたらどうです！ あいつこそ横領していたんだ！」と喚く。',
        effect: '共犯者または第2の容疑者の存在が浮上'
      },
      {
        roll: 6,
        title: '部分的自白',
        reaction: '「殺してなどいない！ だが…あの夜、口論になって部屋を飛び出したのは事実だ」と頭を抱え込む。',
        effect: '事件発生現場にいた決定的な証言を獲得'
      }
    ],
    sourceBook: '基本ルールブック',
    tags: ['容疑者', '実業家', '重要参考人']
  }
];
