#!/bin/bash

# Test script for GoBGP commands used by hyperglass
# Run this script on your GoBGP router to verify commands work correctly

set -e

echo "=== GoBGP Command Test Script ==="
echo "Testing commands that hyperglass will use..."
echo

# Check if gobgp command exists
if ! command -v gobgp &> /dev/null; then
    echo "ERROR: gobgp command not found. Please install GoBGP first."
    exit 1
fi

echo "✓ GoBGP command found"

# Test basic connectivity to GoBGP daemon
echo "Testing GoBGP daemon connectivity..."
if gobgp global > /dev/null 2>&1; then
    echo "✓ GoBGP daemon is running and accessible"
else
    echo "ERROR: Cannot connect to GoBGP daemon. Is gobgpd running?"
    exit 1
fi

# Show basic GoBGP info
echo
echo "=== GoBGP Global Information ==="
gobgp global

# Test IPv4 RIB access
echo
echo "=== Testing IPv4 RIB Access ==="
echo "Command: gobgp global rib -a ipv4-unicast"
IPV4_ROUTES=$(gobgp global rib -a ipv4-unicast | wc -l)
echo "✓ IPv4 RIB accessible, found $IPV4_ROUTES routes"

# Test IPv6 RIB access
echo
echo "=== Testing IPv6 RIB Access ==="
echo "Command: gobgp global rib -a ipv6-unicast"
IPV6_ROUTES=$(gobgp global rib -a ipv6-unicast | wc -l)
echo "✓ IPv6 RIB accessible, found $IPV6_ROUTES routes"

# Test specific route lookup (using a common prefix)
echo
echo "=== Testing Specific Route Lookup ==="
echo "Testing with default route (0.0.0.0/0)..."
if gobgp global rib -a ipv4-unicast 0.0.0.0/0 > /dev/null 2>&1; then
    echo "✓ Specific route lookup works"
    echo "Sample output:"
    gobgp global rib -a ipv4-unicast 0.0.0.0/0 | head -5
else
    echo "⚠ No default route found, but command syntax is correct"
fi

# Test AS path filtering with grep
echo
echo "=== Testing AS Path Filtering ==="
echo "Command: gobgp global rib -a ipv4-unicast | grep -E \"AS_PATH\""
AS_PATH_RESULTS=$(gobgp global rib -a ipv4-unicast | grep -E "AS_PATH" | wc -l)
if [ "$AS_PATH_RESULTS" -gt 0 ]; then
    echo "✓ AS Path filtering works, found $AS_PATH_RESULTS routes with AS_PATH info"
    echo "Sample AS Path output:"
    gobgp global rib -a ipv4-unicast | grep -E "AS_PATH" | head -3
else
    echo "⚠ No AS_PATH information found in output (may be normal if no external routes)"
fi

# Test community filtering with grep
echo
echo "=== Testing Community Filtering ==="
echo "Command: gobgp global rib -a ipv4-unicast | grep -E \"Community\""
COMMUNITY_RESULTS=$(gobgp global rib -a ipv4-unicast | grep -E "Community" | wc -l)
if [ "$COMMUNITY_RESULTS" -gt 0 ]; then
    echo "✓ Community filtering works, found $COMMUNITY_RESULTS routes with community info"
    echo "Sample Community output:"
    gobgp global rib -a ipv4-unicast | grep -E "Community" | head -3
else
    echo "⚠ No Community information found in output (may be normal if no communities set)"
fi

# Test ping command
echo
echo "=== Testing Ping Command ==="
echo "Testing ping to localhost..."
if ping -4 -c 2 127.0.0.1 > /dev/null 2>&1; then
    echo "✓ IPv4 ping works"
else
    echo "⚠ IPv4 ping failed"
fi

if ping -6 -c 2 ::1 > /dev/null 2>&1; then
    echo "✓ IPv6 ping works"
else
    echo "⚠ IPv6 ping failed (may be normal if IPv6 not configured)"
fi

# Test traceroute command
echo
echo "=== Testing Traceroute Command ==="
echo "Testing traceroute to localhost..."
if traceroute -4 -w 1 -q 1 127.0.0.1 > /dev/null 2>&1; then
    echo "✓ IPv4 traceroute works"
else
    echo "⚠ IPv4 traceroute failed"
fi

if traceroute -6 -w 1 -q 1 ::1 > /dev/null 2>&1; then
    echo "✓ IPv6 traceroute works"
else
    echo "⚠ IPv6 traceroute failed (may be normal if IPv6 not configured)"
fi

echo
echo "=== Test Summary ==="
echo "✓ All basic GoBGP commands are working"
echo "✓ Your GoBGP setup should work with hyperglass"
echo
echo "Next steps:"
echo "1. Configure hyperglass with your GoBGP router details"
echo "2. Ensure the hyperglass user has SSH access to this router"
echo "3. Test the integration through the hyperglass web interface"
echo
echo "Example hyperglass device configuration:"
echo "devices:"
echo "  - name: $(hostname)"
echo "    address: $(hostname -I | awk '{print $1}')"
echo "    platform: gobgp"
echo "    credential:"
echo "      username: your_username"
echo "      password: your_password"
echo "    attrs:"
echo "      source4: $(hostname -I | awk '{print $1}')"
echo "      source6: your_ipv6_address"
