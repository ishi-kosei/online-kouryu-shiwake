/**
 * オンライン経営者交流会 事前アンケート
 * Google Apps Script でフォームを自動生成するスクリプト
 *
 * 【使い方】
 * 1. https://script.google.com を開く（Googleアカウントでログイン）
 * 2. 「新しいプロジェクト」をクリック
 * 3. このファイルの内容をすべてコピーして貼り付け（既存コードは削除）
 * 4. 上部メニューの「実行」→「createSurveyForm」を選択して実行
 * 5. 初回は権限確認が出るので「許可」をクリック
 * 6. 実行ログ（表示→ログ）にフォームURLとスプレッドシートURLが表示されます
 */

function createSurveyForm() {

  // ===== フォームを作成 =====
  const form = FormApp.create('オンライン経営者交流会 事前アンケート');
  form.setDescription(
    'このアンケートをもとに、相性の良い経営者様との一対一面談をコーディネートします。\n' +
    '所要時間：約5分。★印は必須項目です。'
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);

  // ===== セクション1: 基本情報 =====
  form.addSectionHeaderItem()
    .setTitle('基本情報');

  form.addTextItem()
    .setTitle('お名前')
    .setHelpText('例：山田 太郎')
    .setRequired(true);

  form.addTextItem()
    .setTitle('会社名・屋号')
    .setHelpText('例：株式会社〇〇 / 〇〇事務所')
    .setRequired(true);

  form.addListItem()
    .setTitle('業種')
    .setRequired(true)
    .setChoiceValues([
      'IT/情報通信関係',
      'コンサル関係',
      'デザイン関係',
      '不動産/住宅/建設関係',
      '人材（派遣/紹介）関係',
      '医療/介護/福祉/健康/スポーツ関係',
      '士業（税理士/会計士/弁護士など）',
      '広告関係',
      '店舗（飲食/美容/物販）関係',
      '教育関係',
      '旅行/観光関係',
      '流通/卸売/小売関係',
      '物流/運輸/郵便業',
      '生活品関係/食品（食材）',
      '美容/ファッション関係',
      '製造業関係',
      '農業/林業/漁業/鉱業関係',
      '金融/保険業',
      '電気/ガス/熱供給/水道業',
      'その他',
    ]);

  form.addTextItem()
    .setTitle('役職')
    .setHelpText('例：代表取締役、取締役、部長、フリーランスなど')
    .setRequired(true);

  form.addListItem()
    .setTitle('従業員数')
    .setRequired(true)
    .setChoiceValues([
      '1人（個人事業）',
      '2〜10人',
      '11〜50人',
      '51人以上',
    ]);

  // ===== セクション2: 参加目的 =====
  form.addSectionHeaderItem()
    .setTitle('参加目的');

  form.addCheckboxItem()
    .setTitle('参加目的')
    .setHelpText('当てはまるものをすべて選択してください（複数可）')
    .setRequired(true)
    .setChoiceValues([
      '販路開拓',
      '仕入先・外注先の発掘',
      'ビジネス提携先の発掘',
      '情報収集・学び',
      '資金調達・投資家探し',
      '採用・人材確保',
      'その他',
    ]);

  // ===== セクション3: 自社について =====
  form.addSectionHeaderItem()
    .setTitle('自社について');

  form.addParagraphTextItem()
    .setTitle('自社の強み・提供できること')
    .setHelpText('例：10年以上の製造業の経験をもとに、高品質なOEM製品を小ロットから対応できます。')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('現在の課題・求めているもの')
    .setHelpText('例：新しい販路（特に関東エリア）を開拓したい。ECサイトの立ち上げに詳しい方に相談したい。')
    .setRequired(true);

  // ===== セクション4: 面談希望 =====
  form.addSectionHeaderItem()
    .setTitle('面談希望設定');

  const industryChoices = [
    'IT/情報通信関係',
    'コンサル関係',
    'デザイン関係',
    '不動産/住宅/建設関係',
    '人材（派遣/紹介）関係',
    '医療/介護/福祉/健康/スポーツ関係',
    '士業（税理士/会計士/弁護士など）',
    '広告関係',
    '店舗（飲食/美容/物販）関係',
    '教育関係',
    '旅行/観光関係',
    '流通/卸売/小売関係',
    '物流/運輸/郵便業',
    '生活品関係/食品（食材）',
    '美容/ファッション関係',
    '製造業関係',
    '農業/林業/漁業/鉱業関係',
    '金融/保険業',
    '電気/ガス/熱供給/水道業',
    'その他',
  ];

  form.addCheckboxItem()
    .setTitle('特に話したい業種')
    .setHelpText('特に面談したい業種があれば選択してください（任意・複数可）')
    .setRequired(false)
    .setChoiceValues(industryChoices);

  form.addCheckboxItem()
    .setTitle('避けたい業種')
    .setHelpText('競合など、できれば避けたい業種があれば選択してください（任意・複数可）')
    .setRequired(false)
    .setChoiceValues(industryChoices);

  // ===== セクション5: プロフィール =====
  form.addSectionHeaderItem()
    .setTitle('プロフィール')
    .setHelpText('雑談のきっかけや共通の話題に活用します。');

  form.addCheckboxItem()
    .setTitle('趣味')
    .setHelpText('当てはまるものをすべて選択してください（複数可）')
    .setRequired(true)
    .setChoiceValues([
      'ゴルフ',
      'ポーカー',
      '麻雀',
      'グルメ',
      'お酒',
      '旅行',
      'サウナ',
      '釣り',
      'アウトドア',
      '散歩',
      'シーシャ',
      '音楽',
      'お笑い',
      '格闘技',
      'バスケ',
      'その他',
    ]);

  form.addListItem()
    .setTitle('出身地')
    .setRequired(true)
    .setChoiceValues([
      '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
      '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
      '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
      '岐阜県', '静岡県', '愛知県',
      '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
      '鳥取県', '島根県', '岡山県', '広島県', '山口県',
      '徳島県', '香川県', '愛媛県', '高知県',
      '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
      '海外',
    ]);

  form.addListItem()
    .setTitle('年齢')
    .setHelpText('任意です。回答しない場合はそのまま次へ進んでください。')
    .setRequired(false)
    .setChoiceValues([
      '20代',
      '30代',
      '40代',
      '50代',
      '60代以上',
    ]);

  // ===== スプレッドシートに回答を自動連携 =====
  const ss = SpreadsheetApp.create('経営者交流会アンケート回答');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // ===== 結果をログに出力 =====
  const formUrl    = form.getPublishedUrl();
  const editUrl    = form.getEditUrl();
  const sheetUrl   = ss.getUrl();

  Logger.log('========================================');
  Logger.log('✅ Googleフォームを作成しました！');
  Logger.log('');
  Logger.log('【参加者に配布するURL】');
  Logger.log(formUrl);
  Logger.log('');
  Logger.log('【フォームの編集URL（主催者用）】');
  Logger.log(editUrl);
  Logger.log('');
  Logger.log('【回答が集まるスプレッドシート】');
  Logger.log(sheetUrl);
  Logger.log('========================================');
  Logger.log('スプレッドシートからCSVをダウンロードして 02_admin.html に取り込んでください。');

  // ポップアップでも通知
  const ui = SpreadsheetApp.getUi ? SpreadsheetApp.getUi() : null;
  Browser.msgBox(
    'フォーム作成完了！',
    '参加者用URL:\n' + formUrl + '\n\n回答スプレッドシート:\n' + sheetUrl,
    Browser.Buttons.OK
  );
}
