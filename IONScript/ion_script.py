#!/usr/bin/env python3
# ---------------------------------------------------------------
#  MainSupplier'ın Purchase Price'ını bul – v1.0 (ION uyumlu)
# ---------------------------------------------------------------
import json
import xmltodict

try:
    # -----------------------------------------------------------
    # 1) Girdiyi yükle
    # -----------------------------------------------------------
    def load_input():
        # xmlstring değişkeni (JSON veya gerçek XML olabilir)
        if "xmlstring" in globals():
            raw = globals()["xmlstring"].strip()
            if raw.lstrip().startswith(("{", "[")):          # JSON ise
                return json.loads(raw)
            # Gerçek XML'i sözlüğe çevir
            parsed = xmltodict.parse(raw)
            # Burada XML yolunu ihtiyaçlarınıza göre uyarlayın
            raise NotImplementedError("XML yolunu henüz uyarlamadık.")

        # Hiçbiri yoksa hata
        raise FileNotFoundError("JSON/XML girişi bulunamadı.")

    data = load_input()

    # -----------------------------------------------------------
    # 2) Analiz
    # -----------------------------------------------------------
    results = []

    for style in data.get("value", []):
        style_id   = style.get("StyleId")
        main_sup   = style.get("MainSupplierId")

        # API bazen 2 p (Supplier) bazen 3 p (Suppplier) dönebiliyor → ikisini de dene
        price_rows = (
            style.get("StyleSuppplierPriceVal") or    # 3 p
            style.get("StyleSupplierPriceVal")  or    # 2 p
            []
        )

        # MainSupplier & Purchase Price eşleşen ilk kayıt
        rec = next(
            (
                r for r in price_rows
                if r.get("SupplierId") == main_sup
                and r.get("CostMapping") == "Purchase Price"
            ),
            None
        )

        results.append(
            {
                "StyleId":        style_id,
                "MainSupplierId": main_sup,
                "PurchasePrice":  rec.get("Price")         if rec else None
            }
        )

    # -----------------------------------------------------------
    # 3) Çıktı (tek Style → dict, çoklu Style → liste)
    # -----------------------------------------------------------
    payload = results[0] if len(results) == 1 else results
    
    # ION için gerekli format - formatlanmış
    if isinstance(payload, dict):
        jsonoutput = json.dumps({
            "StyleId": f"StyleId eq {payload['StyleId']}" if payload.get('StyleId') else "NoMatch",
            "Price": payload.get("PurchasePrice")
        }, ensure_ascii=False, indent=2)
    else:
        # Çoklu style durumu
        jsonoutput = json.dumps({
            "StyleId": "NoMatch",
            "Price": None
        }, ensure_ascii=False, indent=2)

except Exception as e:
    jsonoutput = json.dumps({
        "StyleId": "NoMatch",
        "Price": None
    }, ensure_ascii=False, indent=2)