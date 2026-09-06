import sys
sys.path.append('backend')
import asyncio
from app.github.github_client import GitHubClient

async def main():
    client = GitHubClient()
    repos = await client.get_user_repos('ch1llysauce')
    for r in repos:
        print(f"{r['name']}: {r.get('detected_skills')}")

if __name__ == '__main__':
    asyncio.run(main())

