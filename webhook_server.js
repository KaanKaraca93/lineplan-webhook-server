const express = require('express');
const axios = require('axios');
const XLSX = require('xlsx');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// API URLs
const DOCUMENT_API_URL = 'https://mingle-ionapi.eu1.inforcloudsuite.com/HA286TFZ2VY8TRHK_PRD/FASHIONPLM/documents/api/document/doclib/items';

// Excel indirme ve okuma fonksiyonu
async function downloadAndReadExcel(token, filename) {
    try {
        console.log('📄 Excel dosyası aranıyor:', filename);
        
        // 1. Document API'den Excel URL'sini al
        const docResponse = await axios.post(DOCUMENT_API_URL, {
            files: [filename]
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!docResponse.data.documents || docResponse.data.documents.length === 0) {
            throw new Error('Excel dosyası bulunamadı');
        }

        const excelUrl = docResponse.data.documents[0].url;
        console.log('✅ Excel URL alındı:', excelUrl);

        // 2. Excel dosyasını indir
        const excelResponse = await axios.get(excelUrl, {
            responseType: 'arraybuffer'
        });

        console.log('✅ Excel dosyası indirildi');

        // 3. Excel'i oku
        const workbook = XLSX.read(excelResponse.data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('✅ Excel okundu, satır sayısı:', jsonData.length);
        console.log('📊 İlk satır:', jsonData[0]);

        return {
            success: true,
            data: jsonData,
            filename: filename
        };

    } catch (error) {
        console.error('❌ Excel işlemi hatası:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Token alma fonksiyonu
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
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 10000
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Token alma hatası:', error.message);
        throw error;
    }
}

// Style verisi çekme
async function getStyleData(token, styleId = 67) {
    try {
        const response = await axios.get(
            `https://mingle-ionapi.eu1.inforcloudsuite.com/HA286TFZ2VY8TRHK_PRD/FASHIONPLM/odata2/api/odata2/Style?$filter=StyleId eq ${styleId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        return response.data;
    } catch (error) {
        console.error('Style veri çekme hatası:', error.message);
        throw error;
    }
}

// Style patch etme
async function patchStyle(token, styleId, payload) {
    try {
        const response = await axios.patch(
            `https://mingle-ionapi.eu1.inforcloudsuite.com/HA286TFZ2VY8TRHK_PRD/FASHIONPLM/odata2/api/odata2/Style(${styleId})`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        return response.data;
    } catch (error) {
        console.error('Style patch hatası:', error.message);
        throw error;
    }
}

// Ana işlem fonksiyonu
async function processStyleData(styleId = 67) {
    try {
        console.log('🚀 İşlem başlatılıyor...');
        
        // 1. Token al
        console.log('🔑 Token alınıyor...');
        const token = await getToken();
        console.log('✅ Token alındı');
        
        // 2. Excel indir ve oku
        console.log('📄 Excel indiriliyor...');
        const excelResult = await downloadAndReadExcel(token, 'hiyersi son.xlsx');
        if (!excelResult.success) {
            throw new Error('Excel işlemi başarısız: ' + excelResult.error);
        }
        console.log('✅ Excel işlemi tamamlandı');
        
        // 3. Style verisini çek
        console.log('📥 Style verisi çekiliyor...');
        const styleData = await getStyleData(token, styleId);
        console.log('✅ Style verisi alındı');
        
        // 4. Excel'den A2 hücresini oku
        const excelData = excelResult.data;
        const a2Value = excelData[1] ? Object.values(excelData[1])[0] : 'A2 bulunamadı';
        console.log(`📊 Excel A2 hücresi: ${a2Value}`);
        
        // 5. Style verisini al
        const style = styleData.value[0];
        const originalPrice = style.SupplierPurchasePrice;
        const newPrice = originalPrice + 10;
        const newFreeField1 = `Excel A2: ${a2Value} | Price: ${newPrice}`;
        
        console.log(`💰 Orijinal fiyat: ${originalPrice}`);
        console.log(`💰 Yeni fiyat: ${newPrice}`);
        console.log(`📄 FreeField1'e yazılacak: ${newFreeField1}`);
        
        // 6. Patch isteği gönder
        console.log('📤 Style güncelleniyor...');
        const patchPayload = {
            "FreeField1": newFreeField1
        };
        
        const patchResult = await patchStyle(token, styleId, patchPayload);
        console.log('✅ Style güncellendi');
        
        return {
            success: true,
            excelData: {
                filename: excelResult.filename,
                rowCount: excelResult.data.length,
                firstRow: excelResult.data[0],
                a2Value: a2Value
            },
            originalPrice,
            newPrice,
            newFreeField1,
            patchResult
        };
        
    } catch (error) {
        console.error('❌ İşlem hatası:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
    console.log('📨 Webhook alındı:', req.body);
    
    try {
        const result = await processStyleData();
        res.json({
            status: 'success',
            message: 'İşlem tamamlandı',
            data: result
        });
    } catch (error) {
        console.error('Webhook hatası:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Test endpoint
app.get('/test', async (req, res) => {
    console.log('🧪 Test endpoint çağrıldı');
    const result = await processStyleData();
    res.json(result);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Server başlat
app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda çalışıyor`);
    console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`🧪 Test URL: http://localhost:${PORT}/test`);
    console.log(`💚 Health URL: http://localhost:${PORT}/health`);
});

module.exports = app;
