"""Speed Test API Routes."""

# Standard Library
import asyncio
import json
import time
import typing as t
from datetime import UTC, datetime

# Third Party
from litestar import Request, Response, get, post, Router
from litestar.di import Provide
from litestar.background_tasks import BackgroundTask
from litestar.exceptions import HTTPException

# Project
from hyperglass.log import log
from hyperglass.state import HyperglassState

# Local
from .state import get_state

__all__ = (
    "speedtest_router",
)

# Global iperf3 servers with high bandwidth capacity
IPERF3_SERVERS = [
    {
        "id": "iperf_bouygues",
        "name": "Bouygues Telecom (France)",
        "host": "iperf.par2.as20766.net",
        "port": 5201,
        "location": "Paris, France",
        "bandwidth": "100 Gbps",
        "provider": "Bouygues Telecom"
    },
    {
        "id": "iperf_he_fremont",
        "name": "Hurricane Electric (Fremont)",
        "host": "iperf.he.net",
        "port": 5201,
        "location": "Fremont, CA, USA",
        "bandwidth": "100 Gbps",
        "provider": "Hurricane Electric"
    },
    {
        "id": "iperf_he_chicago",
        "name": "Hurricane Electric (Chicago)",
        "host": "iperf-chi.he.net",
        "port": 5201,
        "location": "Chicago, IL, USA",
        "bandwidth": "100 Gbps",
        "provider": "Hurricane Electric"
    },
    {
        "id": "iperf_scaleway",
        "name": "Scaleway (Paris)",
        "host": "iperf3.scaleway.com",
        "port": 5201,
        "location": "Paris, France",
        "bandwidth": "100 Gbps",
        "provider": "Scaleway"
    },
    {
        "id": "iperf_online_net",
        "name": "Online.net (Paris)",
        "host": "ping.online.net",
        "port": 5201,
        "location": "Paris, France",
        "bandwidth": "100 Gbps",
        "provider": "Online.net"
    },
    {
        "id": "iperf_vultr_amsterdam",
        "name": "Vultr (Amsterdam)",
        "host": "ams-nl-ping.vultr.com",
        "port": 5201,
        "location": "Amsterdam, Netherlands",
        "bandwidth": "100 Gbps",
        "provider": "Vultr"
    }
]

# Speed test file sizes
SPEEDTEST_FILES = [
    {"size": "100MB", "filename": "100MB.bin", "bytes": 104857600},
    {"size": "1GB", "filename": "1GB.bin", "bytes": 1073741824},
    {"size": "10GB", "filename": "10GB.bin", "bytes": 10737418240},
]


@get("/iperf3/servers")
async def iperf3_servers() -> t.List[t.Dict[str, t.Any]]:
    """Get list of available iperf3 servers."""
    return IPERF3_SERVERS


@post("/iperf3/test", dependencies={"_state": Provide(get_state)})
async def iperf3_test(_state: HyperglassState, request: Request, data: t.Dict[str, t.Any]) -> t.Dict[str, t.Any]:
    """Run iperf3 test against specified server."""
    
    server_id = data.get("server_id")
    duration = data.get("duration", 10)  # Default 10 seconds
    direction = data.get("direction", "download")  # download or upload
    
    # Find the server
    server = None
    for s in IPERF3_SERVERS:
        if s["id"] == server_id:
            server = s
            break
    
    if not server:
        raise HTTPException(status_code=400, detail="Invalid server ID")
    
    # Validate duration (1-30 seconds)
    if not isinstance(duration, int) or duration < 1 or duration > 30:
        duration = 10
    
    _log = log.bind(server=server["name"], duration=duration, direction=direction)
    _log.info("Starting iperf3 test")
    
    try:
        # Build iperf3 command
        cmd_args = [
            "iperf3",
            "-c", server["host"],
            "-p", str(server["port"]),
            "-t", str(duration),
            "-J"  # JSON output
        ]
        
        if direction == "upload":
            cmd_args.append("-R")
        
        # Run iperf3 command
        start_time = time.time()
        process = await asyncio.create_subprocess_exec(
            *cmd_args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        end_time = time.time()
        
        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "iperf3 command failed"
            _log.error("iperf3 failed: {}", error_msg)
            raise HTTPException(status_code=500, detail=f"iperf3 test failed: {error_msg}")
        
        # Parse JSON output
        try:
            result = json.loads(stdout.decode())
        except json.JSONDecodeError:
            _log.error("Failed to parse iperf3 JSON output")
            raise HTTPException(status_code=500, detail="Failed to parse iperf3 output")
        
        # Extract key metrics
        end_data = result.get("end", {})
        sum_received = end_data.get("sum_received", {})
        sum_sent = end_data.get("sum_sent", {})
        
        # Determine which direction we tested
        if direction == "download":
            main_result = sum_received
            speed_bps = main_result.get("bits_per_second", 0)
        else:
            main_result = sum_sent
            speed_bps = main_result.get("bits_per_second", 0)
        
        # Convert to human readable
        speed_mbps = speed_bps / 1_000_000
        speed_gbps = speed_bps / 1_000_000_000
        
        response = {
            "success": True,
            "server": server,
            "test_config": {
                "duration": duration,
                "direction": direction,
                "timestamp": datetime.now(UTC).isoformat()
            },
            "results": {
                "speed_bps": speed_bps,
                "speed_mbps": round(speed_mbps, 2),
                "speed_gbps": round(speed_gbps, 3),
                "bytes_transferred": main_result.get("bytes", 0),
                "retransmits": sum_sent.get("retransmits", 0),
                "runtime": round(end_time - start_time, 2)
            },
            "raw_output": result
        }
        
        _log.info("iperf3 test completed: {} Mbps", round(speed_mbps, 2))
        return response
        
    except Exception as e:
        _log.error("iperf3 test error: {}", str(e))
        raise HTTPException(status_code=500, detail=f"iperf3 test failed: {str(e)}")


@get("/iperf3/command")
async def iperf3_command(request: Request, server_id: str = "iperf_he_fremont") -> t.Dict[str, t.Any]:
    """Get iperf3 command for user to run against our server."""
    
    # Get server info from state or config
    state = await get_state()
    
    # Use the first device's address as our server IP
    # In a real implementation, you'd configure this properly
    devices = state.devices
    if devices:
        server_ip = list(devices.values())[0].address
    else:
        server_ip = "your-server-ip"
    
    # Find the target server for comparison
    target_server = None
    for s in IPERF3_SERVERS:
        if s["id"] == server_id:
            target_server = s
            break
    
    commands = {
        "to_your_server": {
            "download": f"iperf3 -c {server_ip} -p 5201 -t 10",
            "upload": f"iperf3 -c {server_ip} -p 5201 -t 10 -R",
            "description": f"Test speed to your server ({server_ip})"
        },
        "from_your_server": {
            "download": f"iperf3 -c {target_server['host'] if target_server else 'iperf.he.net'} -p 5201 -t 10",
            "upload": f"iperf3 -c {target_server['host'] if target_server else 'iperf.he.net'} -p 5201 -t 10 -R",
            "description": f"Test speed from your location to {target_server['name'] if target_server else 'Hurricane Electric'}"
        }
    }
    
    return {
        "server_ip": server_ip,
        "target_server": target_server,
        "commands": commands,
        "instructions": {
            "install": "Install iperf3: apt-get install iperf3 (Ubuntu/Debian) or yum install iperf3 (CentOS/RHEL)",
            "usage": "Run the commands above to test your connection speed",
            "note": "Download tests your download speed, upload tests your upload speed"
        }
    }


@get("/files")
async def speedtest_files(request: Request) -> t.Dict[str, t.Any]:
    """Get speed test file download links."""
    
    # Get base URL from request
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    
    files = []
    for file_info in SPEEDTEST_FILES:
        files.append({
            **file_info,
            "url": f"{base_url}/speedtest/{file_info['filename']}",
            "description": f"Download {file_info['size']} test file"
        })
    
    return {
        "files": files,
        "instructions": {
            "usage": "Right-click and 'Save As' or use wget/curl to download",
            "examples": {
                "wget": f"wget {base_url}/speedtest/100MB.bin",
                "curl": f"curl -O {base_url}/speedtest/100MB.bin"
            }
        }
    }


# Create router with all speedtest endpoints
speedtest_router = Router(
    path="/api/speedtest",
    route_handlers=[
        iperf3_servers,
        iperf3_test,
        iperf3_command,
        speedtest_files,
    ],
)
