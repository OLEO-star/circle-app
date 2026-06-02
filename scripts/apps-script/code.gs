/**
 * 学部診断 集計エンドポイント（Google Apps Script）
 *
 * 役割:
 *   - フロントエンドから POST される診断結果と納得感スコアを受け取る
 *   - マスタSheets（オーナー用、個人特定情報なし）と学校別Sheets（先生用、
 *     クラス・出席番号あり）に振り分けて追記する
 *   - 未登録の学校コードが来たら、学校別Sheetsを自動生成してマッピングを保存し、
 *     オーナーにメールで通知する
 *
 * デプロイ:
 *   1. Apps Script のスクリプトエディタにこのファイル全体を貼り付ける
 *   2. 下の CONFIG を実 ID に置き換える
 *   3. デプロイ → 新しいデプロイ → 種類:ウェブアプリ → アクセスは「全員」
 *   4. 発行された URL を frontend の ANALYTICS_ENDPOINT に設定
 */

const CONFIG = {
  // マスタSheets ID（オーナー用、全校横断・個人特定情報なし）
  MASTER_SPREADSHEET_ID: '16bhdxjl2HH0xlRhx3uf-PA19jLAug7D-I-m5xe51Kyo',

  // 学校別Sheetsの自動生成先フォルダ ID（Google Driveのフォルダ）
  // 設定方法は scripts/apps-script/README.md を参照
  SCHOOL_FOLDER_ID: '1IgMRIiLtNzON5RkneHjxNqeB4m7rQtbt',

  // 新規学校別Sheets作成時に通知を受け取るメールアドレス
  OWNER_EMAIL: 'kazu39leo@gmail.com',

  // 事前登録の学校コード → 学校別Spreadsheet ID。
  // 母校のように事前に先生と共有準備をする学校はここに登録する（自動生成より優先）。
  // 学校コードは13桁の文部科学省コード（D1始まり=高校、C1始まり=中学）。
  // 中高一貫校で「中学と高校を1つのSheetsに集約したい」場合は、両方の学校コードに
  // 同じSpreadsheet ID を割り当てる（青山学院横浜英和の例を参照）。
  SCHOOL_SHEET_MAP: {
    // 青山学院横浜英和（中高一貫校。中学・高校で別コードだが Sheets は1つに集約）
    'C114310000144': '1Jyh283kqOLZro--Hs31TycAZ-FFxVOaTsRMVSQkZMWU', // 中学校
    'D114310000160': '1Jyh283kqOLZro--Hs31TycAZ-FFxVOaTsRMVSQkZMWU', // 高等学校
  },

  // diagnoses シートのヘッダー（マスタ・全校横断・個人特定なし）。
  // 教員も読みやすいよう日本語化。19軸スコアは展開済み。
  DIAGNOSES_HEADER: [
    '日時', 'セッションID', '診断バージョン',
    'Top1学科', 'Top2学科', 'Top3学科',
    'Top1適合度', 'Top2適合度', 'Top3適合度',
    'カテゴリ順位',
    // 19軸スコア（0〜1、計測されない軸は0）
    '数理', '暗記力', '実験', '野外', 'プログラミング', '制作',
    '言語', '対人ケア', 'ビジネス', '芸術', '抽象思考', 'チームワーク',
    '資格志向', '研究志向', '生命', '動物', '論証・物語', '法・正義', '身体運動',
    '回答変更ログ',
    '学校モード', '学校コード', '学校名', '都道府県コード', '学校種',
    '学年', '年齢',
    '開始時刻', '終了時刻', '所要時間(秒)',
  ],

  // satisfactions シートのヘッダー（マスタ・全校横断）。
  // 希望進路は Top3 まで選べる + その理由（任意）。
  // セッションIDで diagnoses 行と結合できる。
  SATISFACTIONS_HEADER: [
    '日時', 'セッションID', '納得感', '納得感の理由',
    '気になる学部1', '気になる学部2', '気になる学部3', '学部選択の理由',
  ],

  // 学校別 students シートのヘッダー（個別生徒・進路指導用）。
  // 教員が読みやすい順：個人識別 → Top3 → 19軸 → 補助情報
  SCHOOL_STUDENTS_HEADER: [
    '日時', 'セッションID', '学年', 'クラス', '出席番号',
    'Top1学科', 'Top2学科', 'Top3学科',
    'Top1適合度', 'Top2適合度', 'Top3適合度',
    '数理', '暗記力', '実験', '野外', 'プログラミング', '制作',
    '言語', '対人ケア', 'ビジネス', '芸術', '抽象思考', 'チームワーク',
    '資格志向', '研究志向', '生命', '動物', '論証・物語', '法・正義', '身体運動',
    '診断バージョン', '所要時間(秒)',
  ],

  // 学校別 feedback シートのヘッダー（結果ページで生徒が答えたフィードバック）。
  // students シートとセッションIDで結合できる。
  // 先生は「診断が出した Top3」と「生徒が選んだ Top3 学部」を見比べて指導できる。
  SCHOOL_FEEDBACK_HEADER: [
    '日時', 'セッションID', '学年', 'クラス', '出席番号',
    '納得感', '納得感の理由',
    '気になる学部1', '気になる学部2', '気になる学部3', '学部選択の理由',
  ],
};

const SECURITY = {
  // フロント（result/page.tsx の POST_TOKEN）と一致させる共有トークン。
  // 真の秘密ではない（公開WebアプリなのでクライアントJSから抽出可能）が、
  // エンドポイント直叩き・スクリプトによる大量偽投稿をふるい落とす。
  // 一致しない POST は doPost が門前払いする。ローテーション時はフロントと同時に差し替える。
  SHARED_TOKEN: 'b24ea11b1ee94af10fd8c48bba0215225ce8ae22',

  // 1日に自動生成する学校別シートの上限（E: スパム爆発時の被害を頭打ちにする）。
  // 超過した未登録校はマスタ（集計・個人特定なし）には記録されるが、学校別シートは
  // 作られない。正当に複数校が同日導入するなら、この値を一時的に引き上げる。
  DAILY_AUTOCREATE_CAP: 5,
};

// payload の axis_scores (CSV) を 19要素の配列にする。
// 不足分は空文字で埋める（理系版/混合版で 19要素揃わない可能性は今のところないが、念のため）。
function parseAxisScores(csv) {
  const parts = (csv || '').split(',');
  const values = parts.map(function (s) {
    if (s === '' || s == null) return '';
    const n = Number(s);
    return isFinite(n) ? n : '';
  });
  while (values.length < 19) values.push('');
  return values.slice(0, 19);
}

// 出席番号は文字列で送られてくるので、数値ソートを効かせるために数値化する。
// 数値化できない場合は元の文字列のまま返す（"欠席" 等の例外入力ガード）。
function toNumberOrKeep(v) {
  if (v === '' || v == null) return '';
  const n = Number(v);
  return isFinite(n) ? n : v;
}

// 学校別シート（students / feedback）を 学年 → クラス → 出席番号 順にソートする。
// 教員が「クラス順に上から見られる」状態を維持するため、追記直後に毎回呼ぶ。
// 列番号: 1=日時, 2=セッションID, 3=学年, 4=クラス, 5=出席番号
function sortSchoolSheet(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 2 || lastCol === 0) return;
  sheet.getRange(2, 1, lastRow - 1, lastCol).sort([
    { column: 3, ascending: true },
    { column: 4, ascending: true },
    { column: 5, ascending: true },
  ]);
}

/**
 * POST エントリポイント
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    // B: 共有トークン検証。一致しない POST はシート生成も書き込みもせず拒否する。
    // mode:'no-cors' でフロントは応答を読めないが、書き込まれないことが重要。
    if (payload.token !== SECURITY.SHARED_TOKEN) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }
    if (payload.type === 'satisfaction') {
      handleSatisfaction(payload);
    } else {
      handleDiagnosis(payload);
    }
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

/**
 * 学校コードが自動生成対象として妥当か検証する。
 *   - "D1" または "C1" で始まる13桁の文字列のみ受け付ける
 *   - "OTHER_..." やランダム文字列は自動生成しない（スパム対策）
 */
function isValidSchoolCode(code) {
  if (!code || typeof code !== 'string') return false;
  if (code.length !== 13) return false;
  return code.startsWith('D1') || code.startsWith('C1');
}

/**
 * 学校コードから学校別Spreadsheet ID を取得する。
 *   優先順位: 1) CONFIG.SCHOOL_SHEET_MAP（手動登録）
 *             2) PropertiesService（自動生成済み）
 */
function getSchoolSheetId(schoolCode) {
  if (CONFIG.SCHOOL_SHEET_MAP[schoolCode]) {
    return CONFIG.SCHOOL_SHEET_MAP[schoolCode];
  }
  const props = PropertiesService.getScriptProperties();
  return props.getProperty('school_sheet_' + schoolCode);
}

function saveSchoolSheetId(schoolCode, sheetId) {
  PropertiesService.getScriptProperties()
    .setProperty('school_sheet_' + schoolCode, sheetId);
}

/**
 * 新規学校別Spreadsheet を作成し、指定フォルダへ移動。students シートを初期化。
 */
function createSchoolSpreadsheet(schoolCode, schoolName) {
  const title = '学部診断 ' + (schoolName || schoolCode);
  const ss = SpreadsheetApp.create(title);
  const id = ss.getId();

  // 専用フォルダへ移動（SCHOOL_FOLDER_ID が未設定なら My Drive 直下のまま）
  if (CONFIG.SCHOOL_FOLDER_ID && CONFIG.SCHOOL_FOLDER_ID !== 'PLACEHOLDER_SCHOOL_FOLDER_ID') {
    try {
      const file = DriveApp.getFileById(id);
      const folder = DriveApp.getFolderById(CONFIG.SCHOOL_FOLDER_ID);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    } catch (e) {
      // フォルダ移動失敗してもデータ収集自体は続行（後でオーナーが手動移動）
    }
  }

  // students シート初期化（デフォルトの「シート1」をリネーム）
  const defaultSheet = ss.getSheets()[0];
  defaultSheet.setName('students');
  defaultSheet.appendRow(CONFIG.SCHOOL_STUDENTS_HEADER);
  defaultSheet.setFrozenRows(1);

  return id;
}

/**
 * 新規Sheets作成時にオーナーへメール通知（先生への共有設定促し）
 */
function notifyOwnerOfNewSchool(schoolCode, schoolName, sheetId) {
  if (!CONFIG.OWNER_EMAIL) return;
  const url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/edit';
  const subject = '[学部診断] 新しい学校のSheetsが自動作成されました';
  const body = [
    '新しい学校から診断結果が届きました。',
    '',
    '学校名: ' + (schoolName || '(不明)'),
    '学校コード: ' + schoolCode,
    'Sheets URL: ' + url,
    '',
    'この学校の先生に閲覧専用で共有設定を行ってください。',
    '',
    '— 学部診断 集計システム',
  ].join('\n');
  try {
    MailApp.sendEmail(CONFIG.OWNER_EMAIL, subject, body);
  } catch (e) {
    // メール送信失敗しても処理は続行
  }
}

// E: 自動生成の日次カウンタ（Asia/Tokyo の日付でキーを分ける）。
function autoCreateCountKey() {
  return 'autocreate_count_' +
    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd');
}

function getAutoCreateCount() {
  const v = PropertiesService.getScriptProperties().getProperty(autoCreateCountKey());
  const n = v ? parseInt(v, 10) : 0;
  return isFinite(n) ? n : 0;
}

function canAutoCreateToday() {
  return getAutoCreateCount() < SECURITY.DAILY_AUTOCREATE_CAP;
}

function incrementAutoCreateCount() {
  PropertiesService.getScriptProperties()
    .setProperty(autoCreateCountKey(), String(getAutoCreateCount() + 1));
}

/**
 * 自動生成が1日の上限に達したときオーナーへ通知（1日1回だけ）。
 * 通知自体が洪水にならないよう、当日フラグで重複送信を防ぐ。
 */
function notifyOwnerOfCapReached(schoolCode, schoolName) {
  if (!CONFIG.OWNER_EMAIL) return;
  const flagKey = 'capnotified_' +
    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd');
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty(flagKey)) return; // 今日はもう通知済み
  props.setProperty(flagKey, '1');
  const subject = '[学部診断] 自動生成が1日の上限に達しました';
  const body = [
    '本日の学校別Sheets自動生成が上限（' + SECURITY.DAILY_AUTOCREATE_CAP + '校）に達しました。',
    '以降の未登録校はマスタ（集計・個人特定なし）にのみ記録され、',
    '学校別Sheetsは作成されていません。',
    '',
    '・正当な急増（複数校で同時導入など）の場合：',
    '  SECURITY.DAILY_AUTOCREATE_CAP の値を一時的に引き上げてください。',
    '・不審な急増の場合：スパムの可能性があります。SHARED_TOKEN のローテーションを検討。',
    '',
    '最後に上限を超えた学校: ' + (schoolName || schoolCode),
    '',
    '— 学部診断 集計システム',
  ].join('\n');
  try {
    MailApp.sendEmail(CONFIG.OWNER_EMAIL, subject, body);
  } catch (e) {
    // メール送信失敗しても処理は続行
  }
}

/**
 * 診断結果を受信したとき
 *   - マスタの "diagnoses" シートには個人特定情報を含めずに追記
 *   - 学校モードかつ妥当な学校コードなら、学校別Sheetsへも追記
 *   - 学校別Sheetsが未作成なら自動生成
 */
function handleDiagnosis(p) {
  const now = new Date();

  // 1. マスタSheets（個人特定情報を含まない：クラス・出席番号は捨てる）
  const master = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
  const diagnosesSheet = master.getSheetByName('diagnoses');
  if (diagnosesSheet) {
    const axisValues = parseAxisScores(p.axis_scores);
    diagnosesSheet.appendRow([
      now,
      p.session_id || '',
      p.version || '',
      p.top1_name || '',
      p.top2_name || '',
      p.top3_name || '',
      p.top1_score || '',
      p.top2_score || '',
      p.top3_score || '',
      p.categories || '',
      // 19軸を展開
      axisValues[0], axisValues[1], axisValues[2], axisValues[3], axisValues[4],
      axisValues[5], axisValues[6], axisValues[7], axisValues[8], axisValues[9],
      axisValues[10], axisValues[11], axisValues[12], axisValues[13], axisValues[14],
      axisValues[15], axisValues[16], axisValues[17], axisValues[18],
      p.change_log || '',
      p.school_mode || '',
      p.school_code || '',
      p.school_name || '',
      p.school_pref || '',
      p.school_type || '',
      p.grade || '',
      p.student_age || '',
      p.start_time || '',
      p.end_time || '',
      p.duration_sec || '',
    ]);
  }

  // 2. 学校別Sheets（学校モード + 妥当な文科省コードのみ）
  if (p.school_mode !== 'true') return;
  if (!isValidSchoolCode(p.school_code)) return;

  let sheetId = getSchoolSheetId(p.school_code);
  if (!sheetId) {
    // E: 1日の自動生成上限を超えたら生成しない（スパム爆発の被害を頭打ちにする）。
    // マスタへの記録（上の diagnoses 追記）は済んでいるので集計データは失わない。
    if (!canAutoCreateToday()) {
      notifyOwnerOfCapReached(p.school_code, p.school_name);
      return;
    }
    // 未登録の学校 → 自動生成
    sheetId = createSchoolSpreadsheet(p.school_code, p.school_name);
    saveSchoolSheetId(p.school_code, sheetId);
    incrementAutoCreateCount();
    notifyOwnerOfNewSchool(p.school_code, p.school_name, sheetId);
  }

  const schoolBook = SpreadsheetApp.openById(sheetId);
  const studentsSheet = ensureSheet(
    schoolBook,
    'students',
    CONFIG.SCHOOL_STUDENTS_HEADER,
  );
  const axisValues = parseAxisScores(p.axis_scores);
  studentsSheet.appendRow([
    now,
    p.session_id || '',
    p.grade || '',
    toNumberOrKeep(p.klass),
    toNumberOrKeep(p.student_number),
    p.top1_name || '',
    p.top2_name || '',
    p.top3_name || '',
    p.top1_score || '',
    p.top2_score || '',
    p.top3_score || '',
    // 19軸を展開
    axisValues[0], axisValues[1], axisValues[2], axisValues[3], axisValues[4],
    axisValues[5], axisValues[6], axisValues[7], axisValues[8], axisValues[9],
    axisValues[10], axisValues[11], axisValues[12], axisValues[13], axisValues[14],
    axisValues[15], axisValues[16], axisValues[17], axisValues[18],
    p.version || '',
    p.duration_sec || '',
  ]);
  sortSchoolSheet(studentsSheet);
}

/**
 * 納得感スコアを受信したとき
 *   - マスタの "satisfactions" シートに追記
 *   - session_id で後から "diagnoses" と結合できる
 */
function handleSatisfaction(p) {
  const now = new Date();

  // 1. マスタ satisfactions に記録（全校横断・個人特定なし）
  const master = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
  const sheet = ensureSheet(master, 'satisfactions', CONFIG.SATISFACTIONS_HEADER);
  sheet.appendRow([
    now,
    p.session_id || '',
    p.satisfaction || '',
    p.reason || '',
    p.desired_field1 || '',
    p.desired_field2 || '',
    p.desired_field3 || '',
    p.desired_reason || '',
  ]);

  // 2. 学校モード時、学校別 feedback シートにも記録（クラス・出席番号あり）。
  //    先生が「診断結果（students）」と「生徒の回答（feedback）」を session_id で結合できる。
  if (p.school_mode !== 'true') return;
  if (!isValidSchoolCode(p.school_code)) return;

  const sheetId = getSchoolSheetId(p.school_code);
  if (!sheetId) return; // 未登録の学校（自動生成はサティスファクション側ではしない）

  const schoolBook = SpreadsheetApp.openById(sheetId);
  const feedback = ensureSheet(
    schoolBook,
    'feedback',
    CONFIG.SCHOOL_FEEDBACK_HEADER,
  );
  feedback.appendRow([
    now,
    p.session_id || '',
    p.grade || '',
    toNumberOrKeep(p.klass),
    toNumberOrKeep(p.student_number),
    p.satisfaction || '',
    p.reason || '',
    p.desired_field1 || '',
    p.desired_field2 || '',
    p.desired_field3 || '',
    p.desired_reason || '',
  ]);
  sortSchoolSheet(feedback);
}

/**
 * 初回セットアップ用：マスタSpreadsheetにシートとヘッダーを作成する
 */
function setupMasterSpreadsheet() {
  const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
  ensureSheet(ss, 'diagnoses', CONFIG.DIAGNOSES_HEADER);
  ensureSheet(ss, 'satisfactions', CONFIG.SATISFACTIONS_HEADER);
}

/**
 * 初回セットアップ用：SCHOOL_SHEET_MAPに事前登録した学校別Sheetsにヘッダーを作成
 */
function setupSchoolSpreadsheets() {
  const codes = Object.keys(CONFIG.SCHOOL_SHEET_MAP);
  // 中高一貫校など複数の学校コードが同じSpreadsheetを指す場合、重複ensureを避ける
  const done = {};
  for (let i = 0; i < codes.length; i++) {
    const id = CONFIG.SCHOOL_SHEET_MAP[codes[i]];
    if (done[id]) continue;
    done[id] = true;
    const ss = SpreadsheetApp.openById(id);
    ensureSheet(ss, 'students', CONFIG.SCHOOL_STUDENTS_HEADER);
    ensureSheet(ss, 'feedback', CONFIG.SCHOOL_FEEDBACK_HEADER);
  }
}

/**
 * 開発用：自動生成された学校マッピング一覧をログに出力する
 */
function listAutoGeneratedSchools() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const entries = [];
  for (const key in props) {
    if (key.indexOf('school_sheet_') === 0) {
      entries.push(key.replace('school_sheet_', '') + ' → ' + props[key]);
    }
  }
  Logger.log(entries.join('\n') || '(自動生成されたSheetsはまだありません)');
}

/**
 * 配布資料のスクリーンショット用：母校Sheets にリアルな見栄えのデモデータを投入する。
 * - session_id を 'DEMO_' プレフィックスで統一 → 後で一括削除しやすい
 * - 学年/クラス/出席番号 が ばらつき、ソート効果が見える状態にする
 * - 19軸の値は Top1学科 と整合（生徒っぽさを担保）
 * 使い方:
 *   1. Apps Script エディタで populateDemoData を選択 → 実行
 *   2. 母校Sheets の students シートを開いてスクショ撮影
 *   3. 撮影後、clearDemoData() で一括削除（DEMO_ プレフィックスを検索して行削除）
 */
function populateDemoData() {
  const sheetId = CONFIG.SCHOOL_SHEET_MAP['D114310000160'];  // 母校（高校）
  if (!sheetId) {
    Logger.log('母校 Sheets ID が SCHOOL_SHEET_MAP に未登録です。');
    return;
  }
  const ss = SpreadsheetApp.openById(sheetId);
  const students = ensureSheet(ss, 'students', CONFIG.SCHOOL_STUDENTS_HEADER);
  const feedback = ensureSheet(ss, 'feedback', CONFIG.SCHOOL_FEEDBACK_HEADER);

  // [学年, クラス, 出席番号, Top1, Top2, Top3, top1score, top2score, top3score,
  //  axis(19), version, duration_sec,
  //  feedback: satisfaction, reason, desired1, desired2, desired3, desired_reason]
  const rows = [
    // ── 高2 A ──
    ['高2', 1,  3, '心理学科',     '社会学科',     '教育学科',      82, 79, 76,
     [25, 78, 22, 35, 18, 45, 68, 88, 42, 30, 72, 75, 55, 52, 28, 35, 80, 70, 38],
     'humanities', 712,
     'ピッタリ', '対人援助に興味があるので合っている気がする', '心理学科', '教育学科', '社会学科', '誰かの話を聞く仕事に就きたい'],
    ['高2', 1, 12, '建築学科',     'デザイン学科', '機械工学科',    85, 80, 73,
     [72, 65, 88, 75, 60, 92, 45, 35, 55, 82, 70, 65, 38, 42, 50, 30, 35, 40, 58],
     'mixed', 798,
     'ピッタリ', '昔から模型作りが好きだった', '建築学科', '都市工学科', 'デザイン学科', '街をデザインしてみたい'],
    ['高2', 1, 18, '経済学科',     '経営学科',     '国際関係学科',  80, 77, 72,
     [85, 60, 25, 30, 38, 28, 55, 50, 90, 25, 78, 72, 60, 55, 22, 18, 45, 75, 35],
     'humanities', 612,
     '微妙',   '理系科目も嫌いじゃないので迷う', '経済学科', 'データサイエンス学科', '経営学科', '統計を使って社会を分析したい'],
    ['高2', 1, 22, '機械工学科',   '電気電子工学科', 'データサイエンス学科', 88, 82, 75,
     [92, 48, 80, 62, 70, 88, 32, 25, 45, 78, 75, 70, 55, 42, 35, 28, 22, 30, 65],
     'sciences', 685,
     'ピッタリ', 'ロボットが好きだから納得', '機械工学科', '情報科学科', '航空宇宙工学科', '将来はロボット開発をしたい'],
    ['高2', 1, 27, '情報科学科',   'データサイエンス学科', '電気電子工学科', 84, 81, 76,
     [82, 88, 55, 45, 95, 65, 50, 40, 60, 50, 78, 68, 70, 60, 32, 25, 38, 35, 42],
     'sciences', 745,
     'ピッタリ', '昔からプログラミングが好き', '情報科学科', 'データサイエンス学科', 'AI学科', 'AIを作る側になりたい'],
    // ── 高2 B ──
    ['高2', 2,  5, '薬学科',       '生物学科',     '化学科',        86, 80, 74,
     [70, 90, 92, 55, 35, 50, 45, 60, 38, 30, 82, 70, 78, 65, 88, 50, 28, 32, 40],
     'sciences', 820,
     'ピッタリ', '化学が一番好き', '薬学科', '看護学科', '医学科', '医療に関わる仕事をしたい'],
    ['高2', 2, 14, '文学科',       '言語学科',     '心理学科',      78, 75, 70,
     [22, 85, 18, 28, 15, 38, 88, 72, 35, 65, 60, 55, 45, 70, 32, 28, 90, 65, 35],
     'humanities', 695,
     '微妙',   '結果は文系だけど経営にも興味', '心理学科', '経営学科', '文学科', '本を書く仕事もしてみたい'],
    ['高2', 2, 21, 'スポーツ科学科', '健康科学科', '医学科',         81, 76, 72,
     [55, 68, 60, 75, 40, 52, 48, 72, 42, 30, 65, 80, 50, 55, 42, 38, 35, 30, 92],
     'mixed', 712,
     'ピッタリ', '部活で運動科学に興味', 'スポーツ科学科', '健康科学科', '医学科', '理学療法士になりたい'],
    // ── 高2 C ──
    ['高2', 3,  8, 'デザイン学科', '建築学科',     '芸術学科',      83, 78, 75,
     [42, 55, 65, 58, 40, 95, 50, 38, 48, 92, 60, 55, 32, 38, 28, 22, 65, 35, 45],
     'mixed', 768,
     '微妙',   '芸大も検討中', 'デザイン学科', '建築学科', '芸術学科', 'デザインで何かを変えたい'],
    ['高2', 3, 16, '農学科',       '生物学科',     '獣医学科',      79, 74, 70,
     [58, 75, 88, 90, 30, 45, 35, 50, 32, 28, 70, 65, 60, 55, 85, 92, 25, 28, 50],
     'sciences', 752,
     'ピッタリ', '動物が好きだから', '獣医学科', '農学科', '生物学科', '動物の命を救う仕事'],
    // ── 高3 A ──
    ['高3', 1,  4, '医学科',       '薬学科',       '看護学科',      89, 84, 78,
     [78, 88, 85, 50, 38, 42, 55, 92, 35, 25, 88, 80, 82, 70, 88, 55, 32, 35, 60],
     'sciences', 858,
     'ピッタリ', '医療人になりたい一心', '医学科', '薬学科', '看護学科', '誰かの命を守りたい'],
    ['高3', 1, 11, '法学科',       '政治学科',     '国際関係学科',  82, 79, 73,
     [50, 80, 22, 35, 28, 32, 75, 65, 70, 25, 85, 78, 80, 90, 28, 22, 75, 92, 30],
     'humanities', 728,
     'ピッタリ', '正義感が強いと言われる', '法学科', '政治学科', '国際関係学科', '司法の世界に進みたい'],
    ['高3', 1, 19, 'データサイエンス学科', '情報科学科', '経済学科', 87, 82, 76,
     [95, 78, 70, 50, 88, 60, 45, 35, 75, 42, 82, 72, 65, 55, 38, 32, 30, 28, 48],
     'sciences', 705,
     'ピッタリ', '数字で世の中を見たい', 'データサイエンス学科', '経済学科', '統計学科', 'データで社会を変える'],
    // ── 高3 B ──
    ['高3', 2,  7, '教育学科',     '心理学科',     '社会学科',      80, 76, 72,
     [42, 82, 35, 45, 32, 55, 78, 92, 50, 38, 75, 88, 60, 65, 38, 35, 70, 60, 55],
     'humanities', 690,
     'ピッタリ', '先生になりたい', '教育学科', '心理学科', '体育学科', '子どもに関わる仕事'],
    ['高3', 2, 13, '工業化学科',   '化学科',       '機械工学科',    83, 79, 74,
     [82, 65, 88, 55, 60, 78, 38, 32, 45, 55, 80, 70, 60, 50, 78, 45, 28, 32, 55],
     'sciences', 738,
     '微妙',   '化学と工学のどちらに進むか迷い', '工業化学科', '化学科', '材料工学科', '新素材の研究に興味'],
  ];

  const now = new Date();
  rows.forEach(function (row, i) {
    const sessionId = 'DEMO_' + Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMMdd') + '_' + ('00' + (i + 1)).slice(-2);
    const [grade, klass, sid, t1, t2, t3, s1, s2, s3, axes, ver, dur,
           sat, reason, d1, d2, d3, dreason] = row;
    // 投入時刻を少しずつ散らす（同時刻だと並び順が不安定）
    const ts = new Date(now.getTime() - (rows.length - i) * 60000);
    students.appendRow([
      ts, sessionId, grade, klass, sid,
      t1, t2, t3, s1, s2, s3,
      axes[0], axes[1], axes[2], axes[3], axes[4], axes[5], axes[6],
      axes[7], axes[8], axes[9], axes[10], axes[11], axes[12], axes[13],
      axes[14], axes[15], axes[16], axes[17], axes[18],
      ver, dur,
    ]);
    feedback.appendRow([
      ts, sessionId, grade, klass, sid,
      sat, reason, d1, d2, d3, dreason,
    ]);
  });
  sortSchoolSheet(students);
  sortSchoolSheet(feedback);
  Logger.log('デモデータ ' + rows.length + '行 を投入しました。session_id プレフィックス: DEMO_');
}

/**
 * populateDemoData() で投入したデモ行を一括削除する。
 * session_id 列が "DEMO_" で始まる行を、students / feedback の両方から消す。
 */
function clearDemoData() {
  const sheetId = CONFIG.SCHOOL_SHEET_MAP['D114310000160'];
  if (!sheetId) return;
  const ss = SpreadsheetApp.openById(sheetId);
  ['students', 'feedback'].forEach(function (sheetName) {
    const sh = ss.getSheetByName(sheetName);
    if (!sh) return;
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return;
    const sessionIds = sh.getRange(2, 2, lastRow - 1, 1).getValues();
    // 下から削除（インデックスがずれないように）
    for (let r = sessionIds.length - 1; r >= 0; r--) {
      const v = String(sessionIds[r][0] || '');
      if (v.indexOf('DEMO_') === 0) {
        sh.deleteRow(r + 2);
      }
    }
  });
  Logger.log('DEMO_ プレフィックス付きの行を削除しました。');
}

function ensureSheet(spreadsheet, sheetName, header) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.appendRow(header);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
