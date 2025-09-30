import importlib.util

spec = importlib.util.spec_from_file_location('ion_token','IONScript/ion_token.py')
m = importlib.util.module_from_spec(spec)
m.jsoninput = '{"Process": 1}'
spec.loader.exec_module(m)
print(m.jsonoutput)
