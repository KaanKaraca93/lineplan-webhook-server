const express = require('express');
const axios = require('axios');
const fs = require('fs'); // Dosyaya yazmak için
const XLSX = require('xlsx'); // Excel işleme için

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Token alma fonksiyonu
async function getToken() {
    try {
        const tokenResponse = await axios.post(
            `https://mingle-sso.eu1.inforcloudsuite.com:443/${process.env.PLM_TENANT}/as/token.oauth2`,
            {
                grant_type: 'password',
                client_id: process.env.PLM_CLIENT_ID,
                client_secret: process.env.PLM_CLIENT_SECRET,
                username: process.env.PLM_USERNAME,
                password: process.env.PLM_PASSWORD
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

// PLM'e POST etme fonksiyonu
async function postLinePlanData(token, linePlanHeaderId, filteredData) {
    try {
        console.log(`📤 PLM'e POST ediliyor - LinePlanHeaderId: ${linePlanHeaderId}`);
        
        // Sadece veri olan kayıtları filtrele
        const dataWithFields = filteredData.filter(item => 
            item.PlanOption !== null || item.PlanButce !== null
        );
        console.log(`📊 POST edilecek kayıt sayısı: ${dataWithFields.length}`);
        
        if (dataWithFields.length === 0) {
            console.log('⚠️ POST edilecek kayıt yok (veri olmayan)');
            return { success: true, message: 'POST edilecek kayıt yok' };
        }
        
        // POST payload'ını hazırla
        const payload = {
            "ModifyId": 3,
            "userId": 3,
            "LinePlanHeaderId": linePlanHeaderId,
            "LinePlanLines": dataWithFields.map(item => {
                const fieldValues = [];
                
                // Sadece 3 alan: Status, PlanOption, PlanButce
                // Status alanı
                fieldValues.push({
                    "FieldName": "Status",
                    "Value": 2
                });
                
                if (item.PlanOption !== null && item.PlanOption !== undefined) {
                    fieldValues.push({
                        "FieldName": "NumberOptions",
                        "Value": item.PlanOption
                    });
                }
                
                if (item.PlanButce !== null && item.PlanButce !== undefined) {
                    fieldValues.push({
                        "FieldName": "NumberCarryOvers",
                        "Value": item.PlanButce
                    });
                }
                
                /*
                // Diğer alanları geçici olarak devre dışı bırak
                
                if (item.PlanButce !== null && item.PlanButce !== undefined) {
                    fieldValues.push({
                        "FieldName": "NumberCarryOvers",
                        "Value": item.PlanButce
                    });
                }
                
                if (item.Oca !== null && item.Oca !== undefined) {
                    fieldValues.push({
                        "FieldName": "279a0732-7ac8-4af2-8520-71e5131d6daf",
                        "Value": item.Oca
                    });
                }
                
                if (item.Sub !== null && item.Sub !== undefined) {
                    fieldValues.push({
                        "FieldName": "5f607772-c2fa-46e0-ac0c-3290bc22ec37",
                        "Value": item.Sub
                    });
                }
                
                if (item.Mar !== null && item.Mar !== undefined) {
                    fieldValues.push({
                        "FieldName": "c0c79aa2-0a09-42da-b181-58797df4ace3",
                        "Value": item.Mar
                    });
                }
                
                if (item.Nis !== null && item.Nis !== undefined) {
                    fieldValues.push({
                        "FieldName": "4c6303f2-da5a-4ee1-94d2-8069dc00d02e",
                        "Value": item.Nis
                    });
                }
                
                if (item.May !== null && item.May !== undefined) {
                    fieldValues.push({
                        "FieldName": "723aa220-e8ac-4084-84eb-968257096a48",
                        "Value": item.May
                    });
                }
                
                if (item.Haz !== null && item.Haz !== undefined) {
                    fieldValues.push({
                        "FieldName": "ee8d4bbb-280c-4701-9ca0-c33df4b9b0ae",
                        "Value": item.Haz
                    });
                }
                
                if (item.Tem !== null && item.Tem !== undefined) {
                    fieldValues.push({
                        "FieldName": "65e4f987-7e4a-48a7-a96a-ae3a2a0822d3",
                        "Value": item.Tem
                    });
                }
                
                if (item.Agu !== null && item.Agu !== undefined) {
                    fieldValues.push({
                        "FieldName": "fecbf14a-6aa2-4461-a382-25cced5fab9a",
                        "Value": item.Agu
                    });
                }
                
                if (item.Eyl !== null && item.Eyl !== undefined) {
                    fieldValues.push({
                        "FieldName": "b34869a6-77e8-4f22-b2ea-2e6e1af11d0f",
                        "Value": item.Eyl
                    });
                }
                
                if (item.Ekm !== null && item.Ekm !== undefined) {
                    fieldValues.push({
                        "FieldName": "1c3a31cf-c105-48f2-8948-3754f97b77fd",
                        "Value": item.Ekm
                    });
                }
                
                if (item.Kas !== null && item.Kas !== undefined) {
                    fieldValues.push({
                        "FieldName": "7328fe28-a7f8-478d-b525-e4db400caaf4",
                        "Value": item.Kas
                    });
                }
                
                if (item.Ara !== null && item.Ara !== undefined) {
                    fieldValues.push({
                        "FieldName": "52cbe386-ec36-43a9-8bd2-dff14d4714d5",
                        "Value": item.Ara
                    });
                }
                
                if (item.ToplamAdet !== null && item.ToplamAdet !== undefined) {
                    fieldValues.push({
                        "FieldName": "ActualOptionsRejected",
                        "Value": item.ToplamAdet
                    });
                }
                
                if (item.KalanAdet !== null && item.KalanAdet !== undefined) {
                    fieldValues.push({
                        "FieldName": "ActualCarryOvers",
                        "Value": item.KalanAdet
                    });
                }
                */
                
                return {
                    "Key": item.lineplanlineId,
                    "FieldValues": fieldValues
                };
            }),
            "Schema": "FSH2"
        };
        
        console.log('📋 POST payload hazırlandı');
        console.log(`📊 Gönderilecek LinePlanLine sayısı: ${payload.LinePlanLines.length}`);
        console.log('\n📋 POST Payload Detayı:');
        console.log('LinePlanHeaderId:', payload.LinePlanHeaderId);
        console.log('ModifyId:', payload.ModifyId);
        console.log('userId:', payload.userId);
        console.log('Schema:', payload.Schema);
        console.log('\n📋 İlk 3 LinePlanLine:');
        payload.LinePlanLines.slice(0, 3).forEach((item, index) => {
            console.log(`${index + 1}. Key: ${item.Key}, FieldName: ${item.FieldValues[0].FieldName}, Value: ${item.FieldValues[0].Value}`);
        });
        console.log('\n📋 Full Payload:');
        console.log(JSON.stringify(payload, null, 2));
        
        // API'ye POST et
        const response = await axios.post(
            'https://mingle-ionapi.eu1.inforcloudsuite.com/HA286TFZ2VY8TRHK_PRD/FASHIONPLM/odata2/api/lineplan/lineplanline/save',
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
        console.log('📊 Response:', response.data);
        
                return {
                    success: true,
                    data: response.data,
                    postedCount: dataWithFields.length
                };
        
    } catch (error) {
        console.error('❌ PLM POST hatası:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Error Message:', error.message);
        return { 
            success: false, 
            error: error.message,
            details: error.response?.data
        };
    }
}

// Sezon kodundan LinePlanId'yi bulan fonksiyon
async function getLinePlanIdFromSeason(seasonCode) {
    try {
        // Token al
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
        
        const token = tokenResponse.data.access_token;
        console.log('✅ Token alındı');

        // LinePlanHeader API çağrısı
        const apiResponse = await axios.post(
            'https://mingle-ionapi.eu1.inforcloudsuite.com/HA286TFZ2VY8TRHK_PRD/FASHIONPLM/odata2/api/view/entity/data/get',
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

        // Sezon koduna göre LinePlanId'yi bul
        const validEntities = apiResponse.data.entities.filter(entity => entity.column && entity.column.Id);
        
        const matchingEntity = validEntities.find(entity => 
            entity.column.SeasonId_Lookup?.Code === seasonCode
        );

        if (matchingEntity) {
            const linePlanId = matchingEntity.column.Id;
            console.log(`✅ ${seasonCode} sezonu için LinePlanId bulundu: ${linePlanId}`);
            return { success: true, linePlanId, token };
        } else {
            console.log(`❌ ${seasonCode} sezonu bulunamadı`);
            return { success: false, error: 'Season not found' };
        }
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
        return { success: false, error: error.message };
    }
}

// LinePlanLine API çağrısı
async function getLinePlanLineData(token, linePlanId) {
    try {
        console.log(`🔍 LinePlanLine API çağrısı yapılıyor - LinePlanId: ${linePlanId}`);
        
        const response = await axios.post(
            'https://mingle-ionapi.eu1.inforcloudsuite.com/HA286TFZ2VY8TRHK_PRD/FASHIONPLM/odata2/api/view/entity/data/get',
            {
                "roleId": 1008,
                "userId": "15",
                "mainEntity": "LinePlanLine",
                "entities": [
                    {
                        "ignoreMetadata": false,
                        "searchable": [
                            "SeasonId",
                            "LinePlanLevels",
                            "Notes",
                            "NumberOptions",
                            "ActualOptions",
                            "ActualOptionsRejected",
                            "ActualOptionsApproved",
                            "NumberStyles",
                            "TotalStyles",
                            "Deviation",
                            "NumberCarryOvers",
                            "ActualCarryOvers",
                            "StylesInProgress",
                            "PurchaseValue",
                            "Qty",
                            "RetailValue",
                            "c96c89c2-ce84-4afe-88c3-44e50e5c719f",
                            "47ce2e77-8b95-4a6f-b9f3-41723f13d77f",
                            "5fa506a1-83e4-482c-ab01-e79283cbff34",
                            "b423d999-b2eb-48ce-8fbd-423e3bf537ab",
                            "f3639d95-50d7-471a-8aab-b9a1ac29aedf"
                        ],
                        "dataFilter": {
                            "Conditions": [
                                {
                                    "fieldName": "OrgLevelFilterIds",
                                    "operator": "IN",
                                    "value": null
                                },
                                {
                                    "fieldName": "IsDeleted",
                                    "operator": "=",
                                    "value": 0
                                },
                                {
                                    "fieldName": "LinePlanHeaderId",
                                    "operator": "=",
                                    "value": linePlanId.toString()
                                }
                            ]
                        },
                        "parent": null,
                        "name": "LinePlanLine",
                        "sortInfo": {
                            "FieldName": "SeasonId",
                            "Direction": "ASC"
                        },
                        "extendedFields": [
                            "c96c89c2-ce84-4afe-88c3-44e50e5c719f",
                            "47ce2e77-8b95-4a6f-b9f3-41723f13d77f",
                            "5fa506a1-83e4-482c-ab01-e79283cbff34",
                            "b423d999-b2eb-48ce-8fbd-423e3bf537ab",
                            "f3639d95-50d7-471a-8aab-b9a1ac29aedf"
                        ],
                        "lookupRef": [
                            "SeasonId",
                            "Brand",
                            "Collection",
                            "Division",
                            "Product Category",
                            "Product Subcategory"
                        ],
                    "columns": [
                        "SeasonId",
                        "LinePlanLevels",
                        "Notes",
                        "NumberOptions",
                        "ActualOptions",
                        "ActualOptionsRejected",
                        "ActualOptionsApproved",
                        "NumberStyles",
                        "TotalStyles",
                        "Deviation",
                        "NumberCarryOvers",
                        "ActualCarryOvers",
                        "StylesInProgress",
                        "PurchaseValue",
                        "Qty",
                        "RetailValue",
                        "c96c89c2-ce84-4afe-88c3-44e50e5c719f",
                        "47ce2e77-8b95-4a6f-b9f3-41723f13d77f",
                        "5fa506a1-83e4-482c-ab01-e79283cbff34",
                        "b423d999-b2eb-48ce-8fbd-423e3bf537ab",
                        "f3639d95-50d7-471a-8aab-b9a1ac29aedf",
                        "Id",
                        "LinePlanHeaderId",
                        "Status"
                    ],
                        "pageInfo": {
                            "page": 1,
                            "pageSize": 200
                        }
                    }
                ],
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

        console.log('✅ LinePlanLine API başarılı');
        console.log('📊 Total count:', response.data.metadata?.entities?.[0]?.pageInfo?.totalCount);
        console.log('📊 Entities sayısı:', response.data.entities?.length);

        // Sadece dolu olanları filtrele
        const validEntities = response.data.entities.filter(entity => entity.column && entity.column.Id);
        
        console.log('📊 Geçerli LinePlanLine sayısı:', validEntities.length);

        return { success: true, data: response.data, validEntities };
        
    } catch (error) {
        console.error('❌ LinePlanLine API hatası:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        return { success: false, error: error.message };
    }
}

// Ana test fonksiyonu
async function processLinePlanData(season, excelUrl) {
    try {
        console.log('🚀 LinePlanLine Test Başlatılıyor...');
        
        // 1. Sezon kodundan LinePlanId'yi bul
        const seasonCode = season;
        console.log(`🔍 ${seasonCode} sezonu için LinePlanId aranıyor...`);
        
        const seasonResult = await getLinePlanIdFromSeason(seasonCode);
        if (!seasonResult.success) {
            console.error('❌ Sezon bulunamadı');
            return;
        }

        // 2. LinePlanLine API çağrısı yap
        const linePlanResult = await getLinePlanLineData(seasonResult.token, seasonResult.linePlanId);
        if (!linePlanResult.success) {
            console.error('❌ LinePlanLine API başarısız');
            return;
        }

        // 3. İlk entity'yi inceleyelim - lookup alanlarının adlarını görelim
        console.log('\n🔍 İlk entity yapısını inceleyelim:');
        if (linePlanResult.validEntities.length > 0) {
            const firstEntity = linePlanResult.validEntities[0];
            console.log('Entity column keys:', Object.keys(firstEntity.column));
            console.log('Lookup alanları:', Object.keys(firstEntity.column).filter(key => key.includes('_Lookup')));
            console.log('LinePlanLevels var mı?', firstEntity.column.LinePlanLevels ? 'EVET' : 'HAYIR');
            if (firstEntity.column.LinePlanLevels) {
                console.log('LinePlanLevels tipi:', typeof firstEntity.column.LinePlanLevels);
                console.log('LinePlanLevels array mi?', Array.isArray(firstEntity.column.LinePlanLevels));
                console.log('LinePlanLevels içeriği:', JSON.stringify(firstEntity.column.LinePlanLevels, null, 2));
            }
        }

        // 4. Excel dosyasını URL'den indir ve oku
        console.log('\n📄 Excel dosyası indiriliyor...');
        console.log('📄 Excel URL:', excelUrl);
        let excelData = [];
        try {
            const excelResponse = await axios.get(excelUrl, { responseType: 'arraybuffer' });
            console.log('✅ Excel dosyası indirildi');
            console.log('📄 Excel response status:', excelResponse.status);
            console.log('📄 Excel response size:', excelResponse.data.length);
            
            const workbook = XLSX.read(excelResponse.data, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            excelData = XLSX.utils.sheet_to_json(worksheet);
            console.log('✅ Excel okundu:', excelData.length, 'satır');
        } catch (excelError) {
            console.log('⚠️ Excel okuma hatası:', excelError.message);
            console.log('📄 Excel olmadan devam ediliyor...');
        }

        // 5. LevelColumns'dan level bilgilerini çıkar ve Excel ile eşleştir
        console.log('\n📊 Filtrelenmiş LinePlanLine Verileri:');
        
        const filteredData = linePlanResult.validEntities.map(entity => {
            const col = entity.column;
            const lineplanlineId = col.Id;
            
            // Level bilgilerini LevelColumns'dan çıkar
            let brandCode = null;
            let divisionCode = null;
            let categoryCode = null;
            let subCategoryCode = null;
            
            if (col.LevelColumns && Array.isArray(col.LevelColumns)) {
                col.LevelColumns.forEach(levelCol => {
                    const level = levelCol.Level;
                    const code = levelCol.Level_Lookup?.Code;
                    
                    switch(level) {
                        case 1: // Brand
                            brandCode = code;
                            break;
                        case 2: // Division
                            divisionCode = code;
                            break;
                        case 3: // Category
                            categoryCode = code;
                            break;
                        case 4: // SubCategory
                            subCategoryCode = code;
                            break;
                    }
                });
            }
            
            // Excel'den yeni alanları eşleştir
            let excelFields = {};
            if (excelData.length > 0) {
                const matchingExcelRow = excelData.find(excelRow => {
                    return excelRow.brandCode === brandCode &&
                           excelRow.divisionCode === divisionCode &&
                           excelRow.categoryCode === categoryCode &&
                           excelRow.subCategoryCode === subCategoryCode;
                });
                
                if (matchingExcelRow) {
                    excelFields = {
                        PlanOption: matchingExcelRow.PlanOption || null,
                        PlanButce: matchingExcelRow.PlanButce || null
                    };
                }
            }
            
            return {
                lineplanlineId: lineplanlineId,
                brandCode: brandCode,
                divisionCode: divisionCode,
                categoryCode: categoryCode,
                subCategoryCode: subCategoryCode,
                ...excelFields
            };
        });

        console.log(`📊 Toplam ${filteredData.length} kayıt filtrelendi`);
        
        // Eşleşme istatistikleri
        const matchedCount = filteredData.filter(item => item.PlanOption !== null || item.PlanButce !== null).length;
        console.log(`📊 Excel ile eşleşen kayıt: ${matchedCount}/${filteredData.length} (%${((matchedCount/filteredData.length)*100).toFixed(1)})`);
        
        console.log('\n📋 İlk 3 kayıt (debug ile):');
        console.log(JSON.stringify(filteredData.slice(0, 3), null, 2));
        
        // Dosyaya kaydet
        const fs = require('fs');
        const jsonOutput = JSON.stringify(filteredData, null, 2);
        fs.writeFileSync('lineplanline_filtered.json', jsonOutput, 'utf8');
        console.log('\n💾 Filtrelenmiş veriler lineplanline_filtered.json dosyasına kaydedildi');
        
        // PLM'e POST et
        console.log('\n📤 PLM\'e POST ediliyor...');
        const token = await getToken(); // Token'ı tekrar al
        const postResult = await postLinePlanData(token, seasonResult.linePlanId, filteredData);
        
        if (postResult.success) {
            console.log('✅ PLM POST başarılı!');
            console.log(`📊 ${postResult.postedCount} kayıt başarıyla gönderildi`);
            return { success: true, postedCount: postResult.postedCount };
        } else {
            console.error('❌ PLM POST başarısız:', postResult.error);
            return { success: false, error: postResult.error };
        }
        
    } catch (error) {
        console.error('❌ Genel hata:', error.message);
        return { success: false, error: error.message };
    }
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
    try {
        console.log('📨 Webhook alındı:', req.body);
        
        const { season, excelUrl } = req.body;
        
        if (!season || !excelUrl) {
            return res.status(400).json({
                success: false,
                error: 'season ve excelUrl gerekli'
            });
        }
        
        console.log('🚀 LinePlan işlemi başlatılıyor...');
        console.log(`🔍 Sezon: ${season}`);
        console.log(`📄 Excel URL: ${excelUrl}`);
        
        const result = await processLinePlanData(season, excelUrl);
        
        if (result.success) {
            res.json({
                status: 'success',
                message: 'İşlem tamamlandı',
                data: {
                    success: result.success,
                    postedCount: result.postedCount
                }
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'İşlem başarısız',
                error: result.error
            });
        }
        
    } catch (error) {
        console.error('❌ Webhook hatası:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Webhook hatası',
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

// Test endpoint
app.get('/test', async (req, res) => {
    try {
        console.log('🧪 Test endpoint çağrıldı');
        const result = await processLinePlanData('25Y', 'https://idm.eu1.inforcloudsuite.com/ca/api/resources/FPLM_Document-83723-2-LATEST?$token=AWn4uvIcTf5%2BRpQW3xZCCcAJEf5%2Fz02gg7eR3DRIWiENolEgEbeQpaogIltoF%2BrLM%2BPuk8kSh0aK3RSykivgvv8rVMsKg1DEiVkBJsRDqVzjkyj5JUgT3b6UhsEZ626nIvAKPB%2FLLTzxLM70mkzV7kQVJO3Sk3c0WLLuWqGfn3OoFhthmubBiCqXQVZn7BLqOYkQYvxsKZCopzH7d0LTPSn%2Bzp5IRDFML0nYx4mYZsqQOALQI2qjLVALyrFYNgD97Q4MTcXRdWpweHxsxnNR%2BOlHe80jiyH1MQpWGHYhr61FXcbuYAZWR5N%2FYWSqFvmdj4hLNfadURRwplqBsBPrxV1Nk9qqiQx5dK2SRbKavNc0OxWpRpBfHUw2qifCH6AMNxsZlnLGckCc00Ga6Jhsj6SsvicwlPiWpymHluyPoBdkD%2FFkFHPh4R%2B8VJ39Ts493xVTxPbQ3SfHt2OHzpLc&$tenant=JKARFH4LCGZA78A5_PRD');
        
        res.json(result);
    } catch (error) {
        console.error('❌ Test hatası:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Server başlat
app.listen(PORT, () => {
    console.log(`🚀 LinePlan Webhook Server ${PORT} portunda çalışıyor`);
    console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`🧪 Test URL: http://localhost:${PORT}/test`);
    console.log(`💚 Health URL: http://localhost:${PORT}/health`);
});
