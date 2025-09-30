/********************************************
 * app.js
 ********************************************/

// Gerekli kütüphaneler
const axios = require('axios');
const XLSX = require('xlsx');
const fs = require('fs');

/*********************************************************
 * TOKEN YÖNETİMİ İÇİN GEREKLİ DEĞİŞKENLER VE FONKSİYONLAR
 *********************************************************/

// Uygulama boyunca token bilgisini tutan değişkenler
let accessToken = null;
let refreshToken = null;
let expiresAt = 0; // access token'ın geçerlilik bitiş zamanı (timestamp)

// 1) Password flow ile token alma
async function loginWithPassword() {
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  // Bu değerleri Postman'den aldığınız / sunucunun istediği şekilde ayarlayın
  params.append('client_id', 'HA286TFZ2VY8TRHK_PRD~jVqIxgO0vQbUjppuaNrbaQq6vhsxRYiRMZeKKKKu6Ng');
  params.append('client_secret', 'fBFip3OjD6Z3RMyuNQYqhTQIv3_UmoYDtdWS-_yIaBTiDlnSqClZyTJVcqvhHeR_-j8MH4ZAAZRru-f5fFOlJA');
  params.append('username', 'HA286TFZ2VY8TRHK_PRD#cHMnkbYAUV7OpjA5HypO21I7dAS5H4wlS_TYzvpsw7Ftk75Ucy1uqVm6mgTinSfuh51OJl-NlAyE0_jlaZxxag');
  params.append('password', 'THJoUh_JfB5yGOosp4HshQpAzIUodF_RBp8_DjiJyga6FQD1eKQzqEk4OyHIhDmBtMKWjsWA5IuCW0pZFVgWLA');
  // params.append('scope', '...'); // Gerekirse
  
  const response = await axios.post(
    'https://mingle-sso.eu1.inforcloudsuite.com:443/HA286TFZ2VY8TRHK_PRD/as/token.oauth2',
    params.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );
  return response.data; // { access_token, refresh_token, expires_in, ... }
}

// 2) Refresh token ile yeni access token alma
async function refreshAccessToken(currentRefreshToken) {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', currentRefreshToken);

  // Çoğu sunucu client_id / client_secret da ister
  params.append('client_id', 'HA286TFZ2VY8TRHK_TRN~FRN8FPbEt-JZ95-TfszusAWLc8S7VMONJMWqQnyhFRI');
  params.append('client_secret', 'P-NDk8yrL_gZvYvCLORChGaYqiLGeiGexWI-ojvwGhqYuXikJrwS0hxuuf0RngreYEKfSmBVsu9rNtBC4CpsZA');
  // params.append('scope', '...'); // Gerekirse
  
  const response = await axios.post(
    'https://mingle-sso.eu1.inforcloudsuite.com:443/HA286TFZ2VY8TRHK_TRN/as/token.oauth2',
    params.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );
  return response.data; // { access_token, refresh_token, expires_in, ... }
}

// 3) Token verilerini saklamaya yarayan fonksiyon
function storeTokenData(tokenResponse) {
  accessToken = tokenResponse.access_token;
  // Bazı sunucular refresh_token döndürmez
  refreshToken = tokenResponse.refresh_token || null;

  const expiresIn = tokenResponse.expires_in || 3600; // Varsayılan 1 saat
  expiresAt = Date.now() + (expiresIn * 1000); 
}

// 4) Her API çağrısı öncesi token kontrolü
async function getAccessToken() {
  const now = Date.now();

  // Access token geçerli mi?
  if (accessToken && now < expiresAt) {
    // Hâlâ geçerliyse direkt dön
    return accessToken;
  }

  // Süresi dolmuş veya hiç yok, yenilemeyi deneyelim:
  if (refreshToken) {
    try {
      console.log('Token süresi doldu, refresh token ile yenileniyor...');
      const tokenResponse = await refreshAccessToken(refreshToken);
      storeTokenData(tokenResponse);
      console.log('Token başarıyla refresh edildi!');
      return accessToken;
    } catch (err) {
      console.error('Refresh başarısız oldu, password flow denenecek...', err.response?.data || err.message);
      // Refresh başarısızsa password flow
    }
  }

  // Buraya düşüyorsak refreshToken yok veya refresh hata verdi
  console.log('Password flow ile token alınıyor...');
  const tokenResponse = await loginWithPassword();
  storeTokenData(tokenResponse);
  console.log('Token başarıyla password flow ile alındı!');
  return accessToken;
}

/*********************************************************
 * EXCEL OKUMA, GRUPLAMA, REQUEST BODY OLUŞTURMA ve API POST
 *********************************************************/

// Excel’den satırları okur
function readExcelRows() {
  // Excel dosyasının tam path'ini ve sayfa adını kontrol edin
  const workbook = XLSX.readFile('C:\\Users\\kaank\\Downloads\\SAS_TASIMA\\SASEXCEL.xlsx');
  const worksheet = workbook.Sheets['sayfa1']; // Sayfa adı tam olarak "sayfa1"
  
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  return rows;
}

// ReqNo alanına göre grupla
function groupByReqNo(rows) {
  const groups = {};
  for (const row of rows) {
    const key = row.ReqNo;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(row);
  }
  return groups;
}

// Bir ReqNo grubundaki satırlardan tek request body oluşturma
function buildRequestBodyForGroup(rows) {
  const firstRow = rows[0];

  return {
    key: "0",
    modifyId: 5,
    userId: 5,
    idGenContextVal: null,
    idGenContextVal2: "[]",
    notificationMessageKey: "CREATED_REQUEST_OVERVIEW",
    rowVersionText: "",
    fieldValues: [
      { fieldName: "ObjSupplierId",  value: firstRow.ObjSupplierId },
      { fieldName: "CreateId",       value: 5 },
      { fieldName: "MainContact",    value: "" },
      { fieldName: "RequestFor",     value: 1 },
      { fieldName: "ModuleId",       value: 1 },
      { fieldName: "ObjId",          value: firstRow.ObjId },
      { fieldName: "Status",         value: firstRow.Status },
      { fieldName: "GlReqTypeId",    value: 1000 },
      { fieldName: "GlReqSubTypeId", value: 2000 },
      { fieldName: "DueDate",        value: firstRow.DueDate },
      { fieldName: "SizeRangeId",    value: firstRow.SizeRangeId }
    ],
    subEntities: rows.map(row => ({
      Key: row.RequestValId,
      SubEntity: "RequestVal",
      FieldValues: [
        { FieldName: "RequestValId",         Value: row.RequestValId },
        { FieldName: "ItemCode",             Value: row.ItemCode },
        { FieldName: "ModuleColorway",       Value: row.ModuleColorway },
        { FieldName: "Quantity",             Value: row.Quantity },
        { FieldName: "UOMId" },
        { FieldName: "SizeId",               Value: row.SizeId },
        { FieldName: "SizeRangeId",          Value: row.SizeRangeId },
        { FieldName: "Notes",                Value: "" },
        { FieldName: "UDF2",                 Value: row.UDF2 },
        { FieldName: "UDF3",                 Value: "" },
        { FieldName: "ShipTo",               Value: row.Shipto },
        { FieldName: "SupplierPurchasePrice",Value: row.SupplierPurchasePrice },
        { FieldName: "UDF1",                 Value: row.UDF1 }
      ],
      SubEntities: []
    })),
    Schema: "FSH2"
  };
}

// Save endpoint'ine POST isteği
async function callSaveEndpoint(requestBody) {
  try {
    // Her çağrıda geçerli bir token almalıyız
    const token = await getAccessToken();
    
    const response = await axios.post(
      'https://mingle-ionapi.eu1.inforcloudsuite.com/HA286TFZ2VY8TRHK_PRD/FASHIONPLM/pdm/api/pdm/request/v2/save',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('API yanıtı:', response.data);
    return true; // Başarılı
  } catch (error) {
    console.error('API isteği hata aldı:', error.response?.data || error.message);
    return false; // Başarısız
  }
}

/*********************************************************
 * ANA FONKSİYON
 *********************************************************/
async function main() {
  try {
    // 1) Excel'den satırları oku
    const rows = readExcelRows();
    console.log('Okunan Excel satırları:', rows);

    // 2) ReqNo bazında grupla
    const grouped = groupByReqNo(rows);
    console.log('Gruplanan veriler:', grouped);

    // 3) Başarılı olan ReqNo'ları tutacağımız dizi
    const successReqNos = [];

    // 4) Her grup için request body hazırla ve istek at
    for (const reqNo in grouped) {
      const groupRows = grouped[reqNo];
      const requestBody = buildRequestBodyForGroup(groupRows);

      console.log(`\nReqNo=${reqNo} için oluşturulan JSON:\n`, JSON.stringify(requestBody, null, 2));

      // Endpoint'e gönder
      const isSuccess = await callSaveEndpoint(requestBody);
      if (isSuccess) {
        // Başarılıysa kaydedelim
        successReqNos.push(reqNo);
      }
    }

    // 5) Başarılı ReqNo listesi "successReqs.json" dosyasına yazılsın
    fs.writeFileSync(
      'C:\\Users\\kaank\\Downloads\\SAS_TASIMA\\successReqs.json',
      JSON.stringify(successReqNos, null, 2),
      'utf-8'
    );
    console.log('Başarılı olan ReqNo listesi successReqs.json dosyasına yazıldı.');

  } catch (err) {
    console.error('main fonksiyonunda hata:', err);
  }
}

// Uygulamayı başlat
main();
