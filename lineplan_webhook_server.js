const express = require('express');
const axios = require('axios');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Swagger UI endpoint
app.get('/api-docs', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>LinePlan Webhook Server API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
        <script>
            SwaggerUIBundle({
                url: '/swagger.yaml',
                dom_id: '#swagger-ui',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.presets.standalone
                ],
                layout: "StandaloneLayout"
            });
        </script>
    </body>
    </html>
    `);
});

// Swagger YAML endpoint
app.get('/swagger.yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.sendFile(path.join(__dirname, 'swagger.yaml'));
});

// Token alma fonksiyonu
async function getToken() {
    try {
        const tokenResponse = await axios.post(
            'https://mingle-sso.eu1.inforcloudsuite.com:443/HA286TFZ2VY8TRHK_PRD/as/token.oauth2',
            {
                grant_type: 'password',
                client_id: 'HA286TFZ2VY8TRHK_PRD~jVqIxgO0vQbUjppuaNrbaQq6vhsxRYiRMZeKKKKu6Ng',
                client_secret: 'fBFip3OjD6Z3RMyuNQYqhTQIv3_UmoYDtdWS-_yIaBTiDlnSqClZyTJVcqvhHeR_-j8MH4ZAAZRru-f5fFOlJA',
                username: 'HA286TFZ2VY8TRHK_PRD#cHMnkbYAUV7OpjA5HypO21I7dAS5H4wlS_TYzvpsw7Ftk75Ucy1uqVm6mgTinSfuh51OJl-NlAyE0_jlaZxxag',
                password: 'THJoUh_JfB5yGOosp4HshQpAzIUodF_RBp8_DjiJyga6FQD1eKQzqEk4OyHIhDmBtMKWjsWA5IuCW0pZFVgWLA'
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            }
        );
        return tokenResponse.data.access_token;
    } catch (error) {
        console.error('❌ Token alma hatası:', error.message);
        throw error;
    }
}

// Sezon kodundan LinePlanId'yi bulan fonksiyon
async function getLinePlanIdFromSeason(seasonCode) {
    try {
        const token = await getToken();
        
        const apiResponse = await axios.post(
            'https://prd-euc1.fplm.eu1.inforcloudsuite.com/api/view/entity/data/get',
            {
                "roleId": 1003,
                "userId": "3",
                "mainEntity": "LinePlanHeader",
                "entities": [{
                    "ignoreMetadata": false,
                    "searchable": ["LinePlanNumber", "TopLevelGlValId", "SeasonId", "Status", "Notes", "Operational"],
                    "dataFilter": {
                        "Conditions": [
                            {"fieldName": "OrgLevelFilterIds", "operator": "IN", "value": ""},
                            {"fieldName": "IsDeleted", "operator": "=", "value": 0}
                        ]
                    },
                    "parent": null,
                    "name": "LinePlanHeader",
                    "sortInfo": {"FieldName": "LinePlanNumber", "Direction": "ASC"},
                    "extendedFields": [],
                    "lookupRef": ["SeasonId", "Status"],
                    "columns": ["LinePlanNumber", "TopLevelGlValId", "SeasonId", "Status", "Notes", "Operational", "Id", "TotalOptions", "TotalCarryOver", "TotalNewStyles", "ActualOptions", "ActualCarryOver", "ActualNewStyles", "Dropped", "InProgress", "TopLevelGlRefId", "CreateId", "RowVersion", "RowVersionText"],
                    "pageInfo": {"page": 1, "pageSize": 20}
                }],
                "pageType": "list",
                "Schema": "FSH2"
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'x-fplm-schema': 'FSH2',
                    'x-fplm-timezone-offset': '-180',
                    'x-infor-tenantid': 'HA286TFZ2VY8TRHK_PRD'
                }
            }
        );

        const validEntities = apiResponse.data.entities.filter(entity => entity.column && entity.column.Id);
        const seasons = validEntities.map(entity => ({
            SeasonCode: entity.column.SeasonId_Lookup?.Code,
            SeasonId: entity.column.SeasonId,
            LinePlanId: entity.column.Id,
            SeasonName: entity.column.SeasonId_Lookup?.Name,
            LinePlanNumber: entity.column.LinePlanNumber
        }));

        const matchingSeason = seasons.find(s => s.SeasonCode === seasonCode);
        if (matchingSeason) {
            return { success: true, linePlanId: matchingSeason.LinePlanId, token };
        } else {
            return { success: false, error: `Sezon kodu bulunamadı: ${seasonCode}` };
        }
        
    } catch (error) {
        console.error('❌ LinePlanId bulma hatası:', error.message);
        return { success: false, error: error.message };
    }
}

// LinePlanLine API'ye istek atma fonksiyonu
async function getLinePlanLineData(token, linePlanHeaderId) {
    try {
        const payload = {
            "roleId": 1008,
            "userId": "15",
            "mainEntity": "LinePlanLine",
            "entities": [
                {
                    "ignoreMetadata": false,
                    "searchable": [
                        "SeasonId", "LinePlanLevels", "Notes", "NumberOptions", "ActualOptions",
                        "ActualOptionsRejected", "ActualOptionsApproved", "NumberStyles", "TotalStyles",
                        "Deviation", "NumberCarryOvers", "ActualCarryOvers", "StylesInProgress",
                        "PurchaseValue", "Qty", "RetailValue",
                        "c96c89c2-ce84-4afe-88c3-44e50e5c719f", "47ce2e77-8b95-4a6f-b9f3-41723f13d77f",
                        "5fa506a1-83e4-482c-ab01-e79283cbff34", "b423d999-b2eb-48ce-8fbd-423e3bf537ab",
                        "f3639d95-50d7-471a-8aab-b9a1ac29aedf"
                    ],
                    "dataFilter": {
                        "Conditions": [
                            {"fieldName": "OrgLevelFilterIds", "operator": "IN", "value": null},
                            {"fieldName": "IsDeleted", "operator": "=", "value": 0},
                            {"fieldName": "LinePlanHeaderId", "operator": "=", "value": linePlanHeaderId.toString()}
                        ]
                    },
                    "parent": null,
                    "name": "LinePlanLine",
                    "sortInfo": {"FieldName": "SeasonId", "Direction": "ASC"},
                    "extendedFields": [],
                    "lookupRef": [
                        "SeasonId", "Brand", "Collection", "Division", "Product Category", "Product Subcategory"
                    ],
                    "columns": [
                        "SeasonId", "LinePlanLevels", "Notes", "NumberOptions", "ActualOptions",
                        "ActualOptionsRejected", "ActualOptionsApproved", "NumberStyles", "TotalStyles",
                        "Deviation", "NumberCarryOvers", "ActualCarryOvers", "StylesInProgress",
                        "PurchaseValue", "Qty", "RetailValue",
                        "c96c89c2-ce84-4afe-88c3-44e50e5c719f", "47ce2e77-8b95-4a6f-b9f3-41723f13d77f",
                        "5fa506a1-83e4-482c-ab01-e79283cbff34", "b423d999-b2eb-48ce-8fbd-423e3bf537ab",
                        "f3639d95-50d7-471a-8aab-b9a1ac29aedf",
                        "Id", "LinePlanHeaderId", "Status", "LevelColumns"
                    ],
                    "pageInfo": {"page": 1, "pageSize": 200}
                }
            ],
            "pageType": "list",
            "Schema": "FSH2"
        };

        const response = await axios.post(
            'https://prd-euc1.fplm.eu1.inforcloudsuite.com/api/view/entity/data/get',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'x-fplm-schema': 'FSH2',
                    'x-fplm-timezone-offset': '-180',
                    'x-infor-tenantid': 'HA286TFZ2VY8TRHK_PRD'
                }
            }
        );

        const validEntities = response.data.entities.filter(entity => 
            entity.name === "LinePlanLine" && entity.column && entity.column.Id
        );

        return { success: true, data: response.data, validEntities };
        
    } catch (error) {
        console.error('❌ LinePlanLine API hatası:', error.message);
        return { success: false, error: error.message };
    }
}

// PLM'e POST etme fonksiyonu
async function postLinePlanData(token, linePlanHeaderId, filteredData) {
    try {
        console.log(`📤 PLM'e POST ediliyor - LinePlanHeaderId: ${linePlanHeaderId}`);
        
        const dataWithAdet = filteredData.filter(item => item.adet !== null);
        console.log(`📊 POST edilecek kayıt sayısı: ${dataWithAdet.length}`);
        
        if (dataWithAdet.length === 0) {
            console.log('⚠️ POST edilecek kayıt yok (adet bilgisi olmayan)');
            return { success: true, message: 'POST edilecek kayıt yok' };
        }
        
        const payload = {
            "ModifyId": 3,
            "userId": 3,
            "LinePlanHeaderId": linePlanHeaderId,
            "LinePlanLines": dataWithAdet.map(item => ({
                "Key": item.lineplanlineId,
                "FieldValues": [
                    {
                        "FieldName": "Qty",
                        "Value": item.adet
                    },
                    {
                        "FieldName": "Status",
                        "Value": 2
                    }
                ]
            })),
            "Schema": "FSH2"
        };
        
        console.log('📋 POST payload hazırlandı');
        console.log(`📊 Gönderilecek LinePlanLine sayısı: ${payload.LinePlanLines.length}`);
        
        const response = await axios.post(
            'https://prd-euc1.fplm.eu1.inforcloudsuite.com/api/lineplan/lineplanline/save',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'x-fplm-schema': 'FSH2',
                    'x-fplm-timezone-offset': '-180',
                    'x-infor-tenantid': 'HA286TFZ2VY8TRHK_PRD'
                }
            }
        );
        
        console.log('✅ PLM POST başarılı');
        
        return { 
            success: true, 
            data: response.data,
            postedCount: dataWithAdet.length
        };
        
    } catch (error) {
        console.error('❌ PLM POST hatası:', error.message);
        return { 
            success: false, 
            error: error.message,
            details: error.response?.data
        };
    }
}

// Ana işlem fonksiyonu
async function processLinePlanData(seasonCode, excelUrl) {
    try {
        console.log('🚀 LinePlan işlemi başlatılıyor...');
        console.log(`🔍 Sezon: ${seasonCode}`);
        console.log(`📄 Excel URL: ${excelUrl}`);
        
        // 1. Sezon kodundan LinePlanId'yi bul
        console.log(`🔍 ${seasonCode} sezonu için LinePlanId aranıyor...`);
        const seasonResult = await getLinePlanIdFromSeason(seasonCode);
        if (!seasonResult.success) {
            throw new Error(`Sezon bulunamadı: ${seasonResult.error}`);
        }
        const linePlanId = seasonResult.linePlanId;
        console.log(`✅ ${seasonCode} sezonu için LinePlanId bulundu: ${linePlanId}`);

        // 2. Excel dosyasını indir ve oku
        console.log('📄 Excel dosyası indiriliyor...');
        const excelResponse = await axios.get(excelUrl, { responseType: 'arraybuffer' });
        const workbook = XLSX.read(excelResponse.data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelData = XLSX.utils.sheet_to_json(worksheet);
        console.log('✅ Excel okundu:', excelData.length, 'satır');

        // 3. LinePlanLine API çağrısı yap
        console.log(`🔍 LinePlanLine API çağrısı yapılıyor - LinePlanId: ${linePlanId}`);
        const linePlanResult = await getLinePlanLineData(seasonResult.token, linePlanId);
        if (!linePlanResult.success) {
            throw new Error(`LinePlanLine API başarısız: ${linePlanResult.error}`);
        }

        // 4. Level bilgilerini çıkar ve Excel ile eşleştir
        console.log('📊 Filtrelenmiş LinePlanLine Verileri:');
        const filteredData = linePlanResult.validEntities.map(entity => {
            const col = entity.column;
            const lineplanlineId = col.Id;
            
            let brandCode = null;
            let divisionCode = null;
            let categoryCode = null;
            let subCategoryCode = null;
            
            if (col.LevelColumns && Array.isArray(col.LevelColumns)) {
                col.LevelColumns.forEach(levelCol => {
                    const level = levelCol.Level;
                    const code = levelCol.Level_Lookup?.Code;
                    
                    switch(level) {
                        case 1: brandCode = code; break;
                        case 2: divisionCode = code; break;
                        case 3: categoryCode = code; break;
                        case 4: subCategoryCode = code; break;
                    }
                });
            }
            
            let adet = null;
            if (excelData.length > 0) {
                const matchingExcelRow = excelData.find(excelRow => {
                    return excelRow.brandCode === brandCode &&
                           excelRow.divisionCode === divisionCode &&
                           excelRow.categoryCode === categoryCode &&
                           excelRow.subCategoryCode === subCategoryCode;
                });
                adet = matchingExcelRow ? (matchingExcelRow.Adet || null) : null;
            }
            
            return {
                lineplanlineId: lineplanlineId,
                brandCode: brandCode,
                divisionCode: divisionCode,
                categoryCode: categoryCode,
                subCategoryCode: subCategoryCode,
                adet: adet
            };
        });

        console.log(`📊 Toplam ${filteredData.length} kayıt filtrelendi`);
        const matchedCount = filteredData.filter(item => item.adet !== null).length;
        console.log(`📊 Excel ile eşleşen kayıt: ${matchedCount}/${filteredData.length} (%${((matchedCount/filteredData.length)*100).toFixed(1)})`);
        
        // 5. PLM'e POST et
        console.log('📤 PLM\'e POST ediliyor...');
        const postResult = await postLinePlanData(seasonResult.token, linePlanId, filteredData);
        
        if (postResult.success) {
            console.log('✅ PLM POST başarılı!');
            console.log(`📊 ${postResult.postedCount} kayıt başarıyla gönderildi`);
            return {
                success: true,
                message: 'İşlem başarılı',
                processedCount: filteredData.length,
                matchedCount: matchedCount,
                postedCount: postResult.postedCount
            };
        } else {
            throw new Error(`PLM POST başarısız: ${postResult.error}`);
        }
        
    } catch (error) {
        console.error('❌ İşlem hatası:', error.message);
        return { success: false, error: error.message };
    }
}

// Webhook endpoint - ION proxy context ile uyumluluk için ekstra route
app.post('/lineplan-webhook/webhook', async (req, res) => {
    try {
        console.log('📨 Webhook alındı (proxy route):', req.body);
        
        const { season, excelUrl } = req.body;
        
        if (!season || !excelUrl) {
            return res.status(400).json({
                success: false,
                error: 'season ve excelUrl parametreleri gerekli'
            });
        }
        
        const result = await processLinePlanData(season, excelUrl);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'İşlem başarılı',
                data: result
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        console.error('❌ Webhook hatası:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Root endpoint - ION proxy context uyumluluğu için
app.post('/', async (req, res) => {
    try {
        console.log('📨 Webhook alındı (root route):', req.body);
        
        const { season, excelUrl } = req.body;
        
        if (!season || !excelUrl) {
            return res.status(400).json({
                success: false,
                error: 'season ve excelUrl parametreleri gerekli'
            });
        }
        
        const result = await processLinePlanData(season, excelUrl);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'İşlem başarılı',
                data: result
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        console.error('❌ Webhook hatası:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Webhook endpoint
app.post('/webhook', async (req, res) => {
    try {
        console.log('📨 Webhook alındı:', req.body);
        
        const { season, excelUrl } = req.body;
        
        if (!season || !excelUrl) {
            return res.status(400).json({
                success: false,
                error: 'season ve excelUrl parametreleri gerekli'
            });
        }
        
        const result = await processLinePlanData(season, excelUrl);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'İşlem başarılı',
                data: result
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        console.error('❌ Webhook hatası:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test endpoint
app.get('/test', async (req, res) => {
    try {
        console.log('🧪 Test endpoint çağrıldı');
        
        // Test için sabit değerler
        const seasonCode = '25Y';
        const excelUrl = 'https://example.com/test.xlsx'; // Test için dummy URL
        
        const result = await processLinePlanData(seasonCode, excelUrl);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Test başarılı',
                data: result
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        console.error('❌ Test hatası:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'LinePlan Webhook Server'
    });
});

// Server başlat
app.listen(PORT, () => {
    console.log(`🚀 LinePlan Webhook Server ${PORT} portunda çalışıyor`);
    console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`🧪 Test URL: http://localhost:${PORT}/test`);
    console.log(`💚 Health URL: http://localhost:${PORT}/health`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
});
