#!/usr/bin/env python3
# ---------------------------------------------------------------
#  ION Token Retrieval – v1.0 (jsoninput/jsonoutput wiring)
# ---------------------------------------------------------------
import json
import os
import requests  # type: ignore


def get_access_token_password_flow():
	"""Obtain an access token using OAuth2 password flow.
	Returns (success: bool, status: int|None, error: str|None).
	In a real flow you might store and return the token; here we only report status.
	"""
	# Values copied from app.js (password flow section)
	client_id = 'HA286TFZ2VY8TRHK_PRD~jVqIxgO0vQbUjppuaNrbaQq6vhsxRYiRMZeKKKKu6Ng'
	client_secret = 'fBFip3OjD6Z3RMyuNQYqhTQIv3_UmoYDtdWS-_yIaBTiDlnSqClZyTJVcqvhHeR_-j8MH4ZAAZRru-f5fFOlJA'
	username = 'HA286TFZ2VY8TRHK_PRD#cHMnkbYAUV7OpjA5HypO21I7dAS5H4wlS_TYzvpsw7Ftk75Ucy1uqVm6mgTinSfuh51OJl-NlAyE0_jlaZxxag'
	password = 'THJoUh_JfB5yGOosp4HshQpAzIUodF_RBp8_DjiJyga6FQD1eKQzqEk4OyHIhDmBtMKWjsWA5IuCW0pZFVgWLA'
	auth_url = 'https://mingle-sso.eu1.inforcloudsuite.com:443/HA286TFZ2VY8TRHK_PRD/as/token.oauth2'

	try:
		r = requests.post(
			auth_url,
			data={
				'grant_type': 'password',
				'client_id': client_id,
				'client_secret': client_secret,
				'username': username,
				'password': password,
			},
			headers={
				'Content-Type': 'application/x-www-form-urlencoded',
				'Accept': 'application/json',
				'User-Agent': 'IONScript/1.0',
			},
			timeout=5,
		)
		if r.status_code == 200:
			return (True, 200, None)
		return (False, r.status_code, f'Non-200 response: {r.text[:300]}')
	except requests.exceptions.RequestException as e:  # type: ignore
		return (False, None, f'requests error: {e}')


# ION entrypoint: read jsoninput and write jsonoutput
try:
	# Expect jsoninput like: {"Process": 1}
	# Check both globals() and locals() for jsoninput
	jsoninput_value = None
	if 'jsoninput' in globals():
		jsoninput_value = globals()['jsoninput']
	elif 'jsoninput' in locals():
		jsoninput_value = locals()['jsoninput']
	
	if jsoninput_value:
		parsed = json.loads(jsoninput_value)
		process_flag = int(parsed.get('Process', 0)) if isinstance(parsed, dict) else 0
		if process_flag == 1:
			success, status_code, err = get_access_token_password_flow()
			jsonoutput = {
				'Success': 1 if success else 0,
				'Status': status_code,
				'Error': err
			}
		else:
			jsonoutput = {'Success': 0, 'Error': 'Process flag not 1'}
	else:
		jsonoutput = {'Success': 0, 'Error': 'jsoninput not found'}
except Exception as e:
    jsonoutput = {'Success': 0, 'Error': str(e)}
