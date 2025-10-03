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
console.log('📋 Beklenen sütunlar: brandCode, divisionCode, categoryCode, subCategoryCode, PlanAdet, PlanButce, Oca, Sub, Mar, Nis, May, Haz, Tem, Agu, Eyl, Ekm, Kas, Ara, ToplamAdet, KalanAdet');

// Excel'den adet bilgilerini eşleştir
const mergedData = jsonData.map(linePlanItem => {
    // Excel'de eşleşen kaydı bul
    const matchingExcelRow = excelData.find(excelRow => {
        return excelRow.brandCode === linePlanItem.brandCode &&
               excelRow.divisionCode === linePlanItem.divisionCode &&
               excelRow.categoryCode === linePlanItem.categoryCode &&
               excelRow.subCategoryCode === linePlanItem.subCategoryCode;
    });
    
    // Yeni alanları ekle (eşleşme yoksa null)
    const excelFields = matchingExcelRow ? {
        PlanAdet: matchingExcelRow.PlanAdet || null,
        PlanButce: matchingExcelRow.PlanButce || null,
        Oca: matchingExcelRow.Oca || null,
        Sub: matchingExcelRow.Sub || null,
        Mar: matchingExcelRow.Mar || null,
        Nis: matchingExcelRow.Nis || null,
        May: matchingExcelRow.May || null,
        Haz: matchingExcelRow.Haz || null,
        Tem: matchingExcelRow.Tem || null,
        Agu: matchingExcelRow.Agu || null,
        Eyl: matchingExcelRow.Eyl || null,
        Ekm: matchingExcelRow.Ekm || null,
        Kas: matchingExcelRow.Kas || null,
        Ara: matchingExcelRow.Ara || null,
        ToplamAdet: matchingExcelRow.ToplamAdet || null,
        KalanAdet: matchingExcelRow.KalanAdet || null
    } : {
        PlanAdet: null,
        PlanButce: null,
        Oca: null,
        Sub: null,
        Mar: null,
        Nis: null,
        May: null,
        Haz: null,
        Tem: null,
        Agu: null,
        Eyl: null,
        Ekm: null,
        Kas: null,
        Ara: null,
        ToplamAdet: null,
        KalanAdet: null
    };
    
    return {
        ...linePlanItem,
        ...excelFields
    };
});

// Sonuçları göster
console.log('\n📋 İlk 5 eşleşme sonucu:');
mergedData.slice(0, 5).forEach(item => {
    console.log(`${item.lineplanlineId}: ${item.brandCode}-${item.divisionCode}-${item.categoryCode}-${item.subCategoryCode} → PlanAdet: ${item.PlanAdet}, PlanButce: ${item.PlanButce}`);
});

// Eşleşen kayıt sayısını hesapla
const matchedCount = mergedData.filter(item => item.PlanAdet !== null || item.PlanButce !== null).length;
console.log(`\n📊 Eşleşen kayıt sayısı: ${matchedCount}/${mergedData.length}`);

// Dosyaya kaydet
const outputFile = 'merged_lineplan_data.json';
fs.writeFileSync(outputFile, JSON.stringify(mergedData, null, 2), 'utf8');
console.log(`\n💾 Birleştirilmiş veriler ${outputFile} dosyasına kaydedildi`);
