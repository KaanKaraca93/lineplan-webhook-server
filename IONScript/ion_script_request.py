#!/usr/bin/env python3
# ---------------------------------------------------------------
#  Request Onay Kontrolü – v1.0 (ION uyumlu)
# ---------------------------------------------------------------
import json

def process_requests(inputapi):
    data = json.loads(inputapi)
    requests_list = [data] if isinstance(data, dict) else data

    checkresult = []

    for request in requests_list:
        # RequestId artık int
        try:
            request_id = int(request.get("RequestId", 0))
        except (ValueError, TypeError):
            request_id = 0

        supplier_price = request.get("SupplierPurchasePrice", 0)
        onayli_saf = str(request.get("OnaylıSAF", "")).strip()
        saf_onay = str(request.get("SAFOnay", "")).strip()
        psf_onay = str(request.get("PSFOnay", "")).strip()

        try:
            supplier_price_val = float(supplier_price)
            onayli_saf_val = float(onayli_saf) if onayli_saf else None
        except ValueError:
            supplier_price_val = supplier_price
            onayli_saf_val = onayli_saf

        if saf_onay == "1" and psf_onay == "1" and onayli_saf_val is not None and supplier_price_val == onayli_saf_val:
            reason = "Onaylı"
        else:
            reason = "Onaysız"

        checkresult.append({
            "RequestId": request_id,  # artık int
            "Reason": reason
        })

    # Tek obje dönsün
    return checkresult[0] if checkresult else {}

# ION için ana işlem
try:
    # inputapi değişkenini ION'dan al
    if "inputapi" in globals():
        checkresult = process_requests(globals()["inputapi"])
        # ION'a formatlanmış string olarak ver
        jsonoutput = json.dumps(checkresult, indent=2, ensure_ascii=False)
    else:
        # inputapi yoksa varsayılan
        jsonoutput = json.dumps({
            "RequestId": 0,
            "Reason": "Onaysız"
        }, indent=2, ensure_ascii=False)

except Exception as e:
    # Hata durumunda
    jsonoutput = json.dumps({
        "RequestId": 0,
        "Reason": "Onaysız"
    }, indent=2, ensure_ascii=False)
