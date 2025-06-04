# GoBGP Integration for Hyperglass

This document describes how to configure hyperglass to work with GoBGP, a modern BGP implementation written in Go.

## Overview

GoBGP is an open-source BGP implementation designed for modern networking environments. It provides a clean CLI interface and API-first design, making it ideal for integration with looking glass applications like hyperglass.

## Features

The GoBGP integration provides the following looking glass functions:

- **BGP Route Lookup**: Query specific prefixes in the BGP RIB
- **BGP AS Path Search**: Search for routes containing specific AS numbers or AS path patterns
- **BGP Community Search**: Find routes with specific BGP communities
- **Ping**: Standard ICMP ping functionality
- **Traceroute**: Network path tracing

## Configuration

### Device Configuration

Add your GoBGP router to the `devices.yaml` configuration:

```yaml
devices:
  - name: Aurora GoBGP Router
    address: 194.46.58.111  # Your GoBGP router's IP
    credential:
      username: your_username
      password: your_password
    platform: gobgp  # Use the GoBGP platform
    attrs:
      source4: 194.46.58.111  # IPv4 source address for ping/traceroute
      source6: 2a06:7e00:0:E00::2  # IPv6 source address for ping/traceroute
    directives:
      - __hyperglass_gobgp_bgp_route__
      - __hyperglass_gobgp_bgp_aspath__
      - __hyperglass_gobgp_bgp_community__
      - __hyperglass_gobgp_ping__
      - __hyperglass_gobgp_traceroute__
```

### GoBGP Commands

The integration uses the following GoBGP CLI commands:

#### BGP Route Lookup
```bash
gobgp global rib -a ipv4-unicast <prefix>
gobgp global rib -a ipv6-unicast <prefix>
```

#### AS Path Search
```bash
gobgp global rib -a ipv4-unicast | grep -E "<as_pattern>"
gobgp global rib -a ipv6-unicast | grep -E "<as_pattern>"
```

#### Community Search
```bash
gobgp global rib -a ipv4-unicast | grep "<community>"
gobgp global rib -a ipv6-unicast | grep "<community>"
```

## Requirements

1. **GoBGP Installation**: Ensure GoBGP is installed and running on your router
2. **SSH Access**: The hyperglass server needs SSH access to the GoBGP router
3. **User Permissions**: The SSH user must have permission to run `gobgp` commands
4. **Network Connectivity**: Ensure the hyperglass server can reach the GoBGP router

## Example Queries

### BGP Route Lookup
- Query: `194.31.143.0/24`
- Command: `gobgp global rib -a ipv4-unicast 194.31.143.0/24`

### AS Path Search
- Query: `211747` (search for routes containing AS 211747)
- Command: `gobgp global rib -a ipv4-unicast | grep -E "211747"`

### Community Search
- Query: `65001:100`
- Command: `gobgp global rib -a ipv4-unicast | grep "65001:100"`

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the SSH user has permission to run `gobgp` commands
2. **Command Not Found**: Verify GoBGP is installed and in the system PATH
3. **No Routes Found**: Check that GoBGP has routes in its RIB using `gobgp global rib`

### Testing GoBGP Commands

You can test the commands manually via SSH:

```bash
# Test basic connectivity
ssh user@your-gobgp-router "gobgp global"

# Test route lookup
ssh user@your-gobgp-router "gobgp global rib -a ipv4-unicast"

# Test specific prefix lookup
ssh user@your-gobgp-router "gobgp global rib -a ipv4-unicast 194.31.143.0/24"
```

## Advanced Configuration

### Custom Directives

You can create custom directives for specific GoBGP commands by adding them to your `directives.yaml`:

```yaml
gobgp-neighbor-status:
  name: BGP Neighbor Status
  rules:
    - condition: null
      command: gobgp neighbor
  field: null
```

### Multiple GoBGP Instances

If you have multiple GoBGP routers, add each as a separate device:

```yaml
devices:
  - name: GoBGP Router 1
    address: 192.168.1.10
    platform: gobgp
    # ... configuration ...
  
  - name: GoBGP Router 2
    address: 192.168.1.11
    platform: gobgp
    # ... configuration ...
```

## Migration from BIRD

If you're migrating from BIRD to GoBGP, the hyperglass interface remains the same. Users will see the same query options, but the backend will use GoBGP commands instead of BIRD commands.

Key differences:
- GoBGP uses `-a ipv4-unicast`/`-a ipv6-unicast` flags for address families
- GoBGP output format is more structured and JSON-friendly
- GoBGP supports more advanced filtering options through its CLI

## Performance Considerations

- GoBGP's CLI is generally faster than BIRD's `birdc` for large routing tables
- Consider using GoBGP's JSON output format for better parsing (future enhancement)
- The grep-based filtering is efficient for most use cases but may be slower on very large RIBs

## Future Enhancements

Potential improvements for the GoBGP integration:

1. **JSON Output**: Use GoBGP's JSON output format for better parsing
2. **API Integration**: Use GoBGP's gRPC API instead of CLI commands
3. **Advanced Filtering**: Implement more sophisticated filtering options
4. **Real-time Updates**: Support for real-time route monitoring
