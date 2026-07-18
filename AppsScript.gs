// ============================================================
// BACKEND CHO TRANG KHẢO SÁT "Ăn gì cho sinh nhật"
// Dán toàn bộ file này vào Google Apps Script (Extensions > Apps Script)
// của 1 Google Sheet. Xem hướng dẫn deploy ở cuối chat.
// ============================================================

const SHEET_NAME = 'Submissions';

// Được gọi khi trang khảo sát (script.js) POST dữ liệu lên.
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (!Array.isArray(data.selectedFoods) || data.selectedFoods.length === 0) {
      return jsonResponse_({ ok: false, message: 'Thiếu món ăn được chọn.' });
    }

    const sheet = getSheet_();
    sheet.appendRow([
      new Date(),                          // thời điểm server ghi nhận
      String(data.sender || ''),
      data.selectedFoods.join(', '),
      String(data.timestamp || ''),
      String(data.source || '')
    ]);

    return jsonResponse_({
      ok: true,
      message: `Đã ghi nhận lựa chọn của ${data.sender || 'bạn'}!`
    });
  } catch (err) {
    return jsonResponse_({ ok: false, message: 'Không thể lưu dữ liệu: ' + err.message });
  }
}

// ĐỔI chuỗi này thành mật khẩu bí mật CỦA RIÊNG BẠN trước khi deploy.
// Chỉ ai biết đúng mã này mới xem được kết quả — không liên quan gì tới
// việc gửi khảo sát (doPost vẫn mở cho tất cả mọi người như cũ).
const SECRET_KEY = '123456789';

// Được gọi khi trang kết quả (results.html) GET dữ liệu về.
function doGet(e) {
  const providedKey = e.parameter.key || '';
  if (providedKey !== SECRET_KEY) {
    return jsonResponse_({ ok: false, message: 'Sai mật khẩu hoặc không có quyền truy cập.' });
  }

  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  // Bỏ dòng header (dòng đầu tiên), map các dòng còn lại thành JSON
  const rows = values.slice(1).map(function (row) {
    return {
      sender: row[1],
      selectedFoods: row[2] ? String(row[2]).split(', ') : [],
      timestamp: row[3],
      source: row[4]
    };
  });

  return jsonResponse_({ ok: true, rows: rows });
}

// Lấy sheet "Submissions", tự tạo mới kèm header nếu chưa có.
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Ghi nhận lúc', 'Người gửi', 'Món đã chọn', 'Timestamp từ trình duyệt', 'Nguồn']);
  }
  return sheet;
}

// Apps Script Web App luôn trả HTTP 200, nên mọi thành công/thất bại
// được thể hiện qua trường "ok" trong JSON, chứ không qua status code.
function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
