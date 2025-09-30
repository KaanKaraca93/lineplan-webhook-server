#!/usr/bin/env python3
# Test script for ion_token.py

# Import and run the module
import importlib.util
spec = importlib.util.spec_from_file_location('ion_token', 'IONScript/ion_token.py')
m = importlib.util.module_from_spec(spec)

# Set the input in the module's namespace BEFORE executing
m.jsoninput = '{"Process": 1}'

# Now execute the module
spec.loader.exec_module(m)

# Print results
print("=== ION TOKEN TEST ===")
print(f"Input: {m.jsoninput}")
print(f"Output: {m.jsonoutput}")
print(f"Success: {m.jsonoutput.get('Success')}")
print(f"Status: {m.jsonoutput.get('Status')}")
print(f"Error: {m.jsonoutput.get('Error')}")

if m.jsonoutput.get('Success') == 1:
    print("✅ TOKEN ALMA BAŞARILI!")
else:
    print("❌ TOKEN ALMA BAŞARISIZ!")
