const fs = require('fs');

// Birleştirilmiş veriyi oku
const mergedData = JSON.parse(fs.readFileSync('merged_lineplan_data.json', 'utf8'));

console.log('📊 Toplam kayıt:', mergedData.length);

// Eşleşen kayıtları göster
const matchedRecords = mergedData.filter(item => item.adet !== null);
console.log('✅ Eşleşen kayıt sayısı:', matchedRecords.length);

if (matchedRecords.length > 0) {
    console.log('\n📋 Eşleşen kayıtlar:');
    matchedRecords.forEach(item => {
        console.log(`LinePlanLineId: ${item.lineplanlineId}`);
        console.log(`  Brand: ${item.brandCode}`);
        console.log(`  Division: ${item.divisionCode}`);
        console.log(`  Category: ${item.categoryCode}`);
        console.log(`  SubCategory: ${item.subCategoryCode}`);
        console.log(`  Adet: ${item.adet}`);
        console.log('---');
    });
}

// Eşleşmeyen kayıtları da göster (ilk 10)
const unmatchedRecords = mergedData.filter(item => item.adet === null);
console.log('\n❌ Eşleşmeyen kayıtlar (ilk 10):');
unmatchedRecords.slice(0, 10).forEach(item => {
    console.log(`${item.lineplanlineId}: ${item.brandCode}-${item.divisionCode}-${item.categoryCode}-${item.subCategoryCode}`);
});
