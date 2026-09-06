import urllib.request, json
req = urllib.request.Request('https://rigtwkuypixwwontbckr.supabase.co/rest/v1/projects?select=id', headers={'apikey':'sb_publishable_QIey49CoZgkEXn_yg8RhbQ_SXjTwSmh','Authorization':'Bearer sb_publishable_QIey49CoZgkEXn_yg8RhbQ_SXjTwSmh'})
projects = json.loads(urllib.request.urlopen(req).read().decode())
print('Projects:', projects)

