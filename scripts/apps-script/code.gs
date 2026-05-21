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

/**
 * POST エントリポイント
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
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
    // 未登録の学校 → 自動生成
    sheetId = createSchoolSpreadsheet(p.school_code, p.school_name);
    saveSchoolSheetId(p.school_code, sheetId);
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
    p.klass || '',
    p.student_number || '',
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
    p.klass || '',
    p.student_number || '',
    p.satisfaction || '',
    p.reason || '',
    p.desired_field1 || '',
    p.desired_field2 || '',
    p.desired_field3 || '',
    p.desired_reason || '',
  ]);
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
