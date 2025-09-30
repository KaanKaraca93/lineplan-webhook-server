const axios = require('axios');
const fs = require('fs'); // Dosyaya yazmak için
const XLSX = require('xlsx'); // Excel işleme için

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

// PLM'e POST etme fonksiyonu
async function postLinePlanData(token, linePlanHeaderId, filteredData) {
    try {
        console.log(`📤 PLM'e POST ediliyor - LinePlanHeaderId: ${linePlanHeaderId}`);
        
        // Sadece adet bilgisi olan kayıtları filtrele
        const dataWithAdet = filteredData.filter(item => item.adet !== null);
        console.log(`📊 POST edilecek kayıt sayısı: ${dataWithAdet.length}`);
        
        if (dataWithAdet.length === 0) {
            console.log('⚠️ POST edilecek kayıt yok (adet bilgisi olmayan)');
            return { success: true, message: 'POST edilecek kayıt yok' };
        }
        
        // POST payload'ını hazırla
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
        console.log('📊 Response:', response.data);
        
        return { 
            success: true, 
            data: response.data,
            postedCount: dataWithAdet.length
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
            'https://prd-euc1.fplm.eu1.inforcloudsuite.com/api/view/entity/data/get',
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
async function main() {
    try {
        console.log('🚀 LinePlanLine Test Başlatılıyor...');
        
        // 1. Sezon kodundan LinePlanId'yi bul
        const seasonCode = '25Y'; // Test için 25Y sezonu
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

        // 4. Excel dosyasını oku ve adet bilgilerini al
        console.log('\n📄 Excel dosyası okunuyor...');
        let excelData = [];
        try {
            const workbook = XLSX.readFile('LinePlan.xlsx');
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
            
            // Excel'den adet bilgisini eşleştir
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
        
        // Eşleşme istatistikleri
        const matchedCount = filteredData.filter(item => item.adet !== null).length;
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
        } else {
            console.error('❌ PLM POST başarısız:', postResult.error);
        }
        
    } catch (error) {
        console.error('❌ Genel hata:', error.message);
    }
}

main();
