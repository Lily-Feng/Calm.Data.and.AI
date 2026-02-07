import asyncio
import aiohttp
from dataclasses import dataclass
from typing import Optional

@dataclass
class Response:
    url: str
    status: int
    content_length: int
    error: Optional[str] = None

async def fetch_url(session: aiohttp.ClientSession, url: str) -> Response:
    """Fetch a single URL with timeout handling."""
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
            content = await response.read()
            return Response(
                url=url,
                status=response.status,
                content_length=len(content)
            )
    except asyncio.TimeoutError:
        return Response(url=url, status=-1, content_length=0, error="Timeout")
    except Exception as e:
        return Response(url=url, status=-1, content_length=0, error=str(e))

async def fetch_all(urls: list[str]) -> list[Response]:
    """Fetch all URLs concurrently."""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        return await asyncio.gather(*tasks)

async def main():
    urls = [
        "https://api.github.com",
        "https://httpbin.org/get",
        "https://jsonplaceholder.typicode.com/posts/1",
        "https://httpbin.org/delay/10",  # This will timeout
    ]
    
    print("🚀 Fetching URLs concurrently...")
    results = await fetch_all(urls)
    
    for r in results:
        if r.error:
            print(f"❌ {r.url}: {r.error}")
        else:
            print(f"✅ {r.url}: Status={r.status}, Size={r.content_length}")

if __name__ == "__main__":
    asyncio.run(main())
