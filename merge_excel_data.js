const fs = require('fs');
const XLSX = require('xlsx');

// JSON verisini oku
const jsonData = JSON.parse(fs.readFileSync('lineplanline_filtered.json', 'utf8'));
console.log('📊 JSON verisi yüklendi:', jsonData.length, 'kayıt');

// Excel dosyasını oku
console.log('📄 Excel dosyası okunuyor...');
const workbook = XLSX.readFile('LinePlan.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const excelData = XLSX.utils.sheet_to_json(worksheet);

console.log('📊 Excel verisi yüklendi:', excelData.length, 'satır');
console.log('📋 Excel sütunları:', Object.keys(excelData[0] || {}));

// Excel'den adet bilgilerini eşleştir
const mergedData = jsonData.map(linePlanItem => {
    // Excel'de eşleşen kaydı bul
    const matchingExcelRow = excelData.find(excelRow => {
        return excelRow.brandCode === linePlanItem.brandCode &&
               excelRow.divisionCode === linePlanItem.divisionCode &&
               excelRow.categoryCode === linePlanItem.categoryCode &&
               excelRow.subCategoryCode === linePlanItem.subCategoryCode;
    });
    
    // Adet bilgisini ekle (eşleşme yoksa null)
    const adet = matchingExcelRow ? (matchingExcelRow.Adet || null) : null;
    
    return {
        ...linePlanItem,
        adet: adet
    };
});

// Sonuçları göster
console.log('\n📋 İlk 5 eşleşme sonucu:');
mergedData.slice(0, 5).forEach(item => {
    console.log(`${item.lineplanlineId}: ${item.brandCode}-${item.divisionCode}-${item.categoryCode}-${item.subCategoryCode} → Adet: ${item.adet}`);
});

// Eşleşen kayıt sayısını hesapla
const matchedCount = mergedData.filter(item => item.adet !== null).length;
console.log(`\n📊 Eşleşen kayıt sayısı: ${matchedCount}/${mergedData.length}`);

// Dosyaya kaydet
const outputFile = 'merged_lineplan_data.json';
fs.writeFileSync(outputFile, JSON.stringify(mergedData, null, 2), 'utf8');
console.log(`\n💾 Birleştirilmiş veriler ${outputFile} dosyasına kaydedildi`);
