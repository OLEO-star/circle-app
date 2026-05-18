/**
 * 学部診断 集計エンドポイント（Google Apps Script）
 *
 * 役割:
 *   - フロントエンドから POST される診断結果と納得感スコアを受け取る
 *   - マスタSheets（オーナー用、個人特定情報なし）と学校別Sheets（先生用、
 *     クラス・出席番号あり）に振り分けて追記する
 *   - session_id を共通キーに、診断結果と納得感スコアを後で結合できる
 *
 * デプロイ:
 *   1. Apps Script のスクリプトエディタにこのファイル全体を貼り付ける
 *   2. 下の CONFIG にマスタSheetsとSchool別SheetsのIDを設定する
 *   3. デプロイ → 新しいデプロイ → 種類:ウェブアプリ → アクセスは「全員」
 *   4. 発行された URL を frontend の ANALYTICS_ENDPOINT に設定
 *
 * シート構成:
 *   マスタ Spreadsheet:
 *     - "diagnoses" シート（A〜O列、ヘッダー必須）
 *     - "satisfactions" シート（A〜E列、ヘッダー必須）
 *
 *   学校別 Spreadsheet（学校ごとに1つ）:
 *     - "students" シート（A〜J列、ヘッダー必須）
 */

const CONFIG = {
  // ⚠️ オーナーが Sheets 作成後に置き換える
  MASTER_SPREADSHEET_ID: 'PLACEHOLDER_MASTER_SHEET_ID',

  // 学校コード → 学校別Spreadsheet ID のマッピング
  // 学校が増えるたびにここに追加する。学校コードは13桁の文部科学省コード
  // (D1始まり=高校, C1始まり=中学) or "OTHER_<名前>"
  SCHOOL_SHEET_MAP: {
    // 'D113311700073': 'PLACEHOLDER_SCHOOL_SHEET_ID_FOR_SCHOOL_A',
    // 'D127XXXXXXXXX': 'PLACEHOLDER_SCHOOL_SHEET_ID_FOR_SCHOOL_B',
  },

  // diagnoses シートのヘッダー（Spreadsheet 作成時の参考）
  DIAGNOSES_HEADER: [
    'timestamp', 'session_id', 'version',
    'top1_name', 'top2_name', 'top3_name',
    'top1_score', 'top2_score', 'top3_score',
    'categories', 'axis_scores', 'change_log',
    'school_mode', 'school_code', 'school_name', 'school_pref', 'school_type',
    'grade', 'student_age',
  ],

  // satisfactions シートのヘッダー
  SATISFACTIONS_HEADER: [
    'timestamp', 'session_id', 'satisfaction', 'reason',
  ],

  // 学校別 students シートのヘッダー
  SCHOOL_STUDENTS_HEADER: [
    'timestamp', 'session_id', 'grade', 'class', 'number',
    'top1_name', 'top2_name', 'top3_name',
    'axis_scores', 'version',
  ],
};

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
 * 診断結果を受信したとき
 *   - マスタの "diagnoses" シートには個人特定情報を含めずに追記
 *   - 学校モードかつ学校別Sheetsの登録があれば、そちらにも追記（生徒識別情報あり）
 */
function handleDiagnosis(p) {
  const now = new Date();

  // 1. マスタSheets（個人特定情報を含まない：クラス・出席番号は捨てる）
  const master = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
  const diagnosesSheet = master.getSheetByName('diagnoses');
  if (diagnosesSheet) {
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
      p.axis_scores || '',
      p.change_log || '',
      p.school_mode || '',
      p.school_code || '',
      p.school_name || '',
      p.school_pref || '',
      p.school_type || '',
      p.grade || '',
      p.student_age || '',
    ]);
  }

  // 2. 学校別Sheets（学校モード時のみ、クラス・出席番号あり）
  if (p.school_mode === 'true' && p.school_code) {
    const schoolSheetId = CONFIG.SCHOOL_SHEET_MAP[p.school_code];
    if (schoolSheetId) {
      const schoolBook = SpreadsheetApp.openById(schoolSheetId);
      const studentsSheet = schoolBook.getSheetByName('students');
      if (studentsSheet) {
        studentsSheet.appendRow([
          now,
          p.session_id || '',
          p.grade || '',
          p.klass || '',
          p.student_number || '',
          p.top1_name || '',
          p.top2_name || '',
          p.top3_name || '',
          p.axis_scores || '',
          p.version || '',
        ]);
      }
    }
  }
}

/**
 * 納得感スコアを受信したとき
 *   - マスタの "satisfactions" シートに追記
 *   - session_id で後から "diagnoses" と結合できる
 */
function handleSatisfaction(p) {
  const now = new Date();
  const master = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
  const sheet = master.getSheetByName('satisfactions');
  if (sheet) {
    sheet.appendRow([
      now,
      p.session_id || '',
      p.satisfaction || '',
      p.reason || '',
    ]);
  }
}

/**
 * 初回セットアップ用：マスタSpreadsheetにシートとヘッダーを作成する
 *   - スクリプトエディタから手動で実行する
 *   - 既にシートがあれば作らない
 */
function setupMasterSpreadsheet() {
  const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
  ensureSheet(ss, 'diagnoses', CONFIG.DIAGNOSES_HEADER);
  ensureSheet(ss, 'satisfactions', CONFIG.SATISFACTIONS_HEADER);
}

/**
 * 初回セットアップ用：学校別Spreadsheetにシートとヘッダーを作成する
 *   - 引数なしで実行すると、SCHOOL_SHEET_MAP に登録されている全Spreadsheetを処理
 */
function setupSchoolSpreadsheets() {
  const codes = Object.keys(CONFIG.SCHOOL_SHEET_MAP);
  for (let i = 0; i < codes.length; i++) {
    const ss = SpreadsheetApp.openById(CONFIG.SCHOOL_SHEET_MAP[codes[i]]);
    ensureSheet(ss, 'students', CONFIG.SCHOOL_STUDENTS_HEADER);
  }
}

function ensureSheet(spreadsheet, sheetName, header) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.appendRow(header);
    sheet.setFrozenRows(1);
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
