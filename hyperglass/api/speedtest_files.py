"""Speed test file generation and serving."""

# Standard Library
import os
import typing as t
from pathlib import Path

# Third Party
from litestar import Response, get
from litestar.exceptions import HTTPException

__all__ = ("serve_speedtest_file",)

# Speed test file configurations
SPEEDTEST_CONFIGS = {
    "100MB.bin": 100 * 1024 * 1024,      # 100 MB
    "1GB.bin": 1024 * 1024 * 1024,       # 1 GB  
    "10GB.bin": 10 * 1024 * 1024 * 1024, # 10 GB
}


def generate_speedtest_file(size_bytes: int) -> t.Iterator[bytes]:
    """Generate a binary file of specified size for speed testing."""
    chunk_size = 1024 * 1024  # 1MB chunks
    pattern = b'0' * chunk_size
    
    remaining = size_bytes
    while remaining > 0:
        if remaining >= chunk_size:
            yield pattern
            remaining -= chunk_size
        else:
            yield b'0' * remaining
            remaining = 0


@get("/speedtest/{filename:str}")
async def serve_speedtest_file(filename: str) -> Response:
    """Serve speed test files for download testing."""
    
    if filename not in SPEEDTEST_CONFIGS:
        raise HTTPException(status_code=404, detail="Speed test file not found")
    
    file_size = SPEEDTEST_CONFIGS[filename]
    
    # Set appropriate headers for speed testing
    headers = {
        "Content-Type": "application/octet-stream",
        "Content-Length": str(file_size),
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        # Add CORS headers for browser compatibility
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
    }
    
    # Generate file content on-the-fly to avoid storing large files
    def file_generator():
        return generate_speedtest_file(file_size)
    
    return Response(
        content=file_generator(),
        status_code=200,
        headers=headers,
        media_type="application/octet-stream"
    )
