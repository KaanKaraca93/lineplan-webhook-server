const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());

// Token alma fonksiyonu (aynı credentials)
async function getToken() {
    try {
        const response = await axios.post(
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
        
        return response.data.access_token;
    } catch (error) {
        console.error('❌ Token alma hatası:', error.response?.data || error.message);
        return null;
    }
}

// LinePlanHeader API test fonksiyonu
async function testLinePlanHeaderAPI(token) {
    try {
        console.log('🔍 LinePlanHeader API test ediliyor...');
        
        const response = await axios.post(
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

        console.log('✅ LinePlanHeader API başarılı');
        console.log('📊 Response metadata:', {
            totalCount: response.data.metadata?.entities?.[0]?.pageInfo?.totalCount,
            pageSize: response.data.metadata?.entities?.[0]?.pageInfo?.pageSize
        });

        // İlk LinePlan verilerini göster
        if (response.data.entities?.[0]?.column) {
            const firstLinePlan = response.data.entities[0].column;
            console.log('📋 İlk LinePlan:', {
                Id: firstLinePlan.Id,
                LinePlanNumber: firstLinePlan.LinePlanNumber,
                SeasonId: firstLinePlan.SeasonId,
                SeasonCode: firstLinePlan.SeasonId_Lookup?.Code,
                SeasonName: firstLinePlan.SeasonId_Lookup?.Name
            });
        }

        return response.data;
        
    } catch (error) {
        console.error('❌ LinePlanHeader API hatası:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Error Message:', error.message);
        return null;
    }
}

// Test endpoint
app.get('/test', async (req, res) => {
    try {
        console.log('🧪 LinePlan API test başlatılıyor...');
        
        // 1. Token al
        console.log('🔑 Token alınıyor...');
        const token = await getToken();
        if (!token) {
            return res.status(500).json({ error: 'Token alınamadı' });
        }
        console.log('✅ Token alındı');

        // 2. LinePlanHeader API test et
        const linePlanData = await testLinePlanHeaderAPI(token);
        if (!linePlanData) {
            return res.status(500).json({ error: 'LinePlanHeader API başarısız' });
        }

        res.json({
            success: true,
            message: 'LinePlanHeader API test başarılı',
            data: linePlanData
        });

    } catch (error) {
        console.error('❌ Test hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Server başlat
app.listen(PORT, () => {
    console.log(`🚀 LinePlan Server ${PORT} portunda çalışıyor`);
    console.log(`🧪 Test URL: http://localhost:${PORT}/test`);
    console.log(`💚 Health URL: http://localhost:${PORT}/health`);
});
