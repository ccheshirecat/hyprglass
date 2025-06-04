# GoBGP Integration Setup Guide for Hyperglass

This guide will help you set up hyperglass to work with your GoBGP router. Based on your configuration (AS 211747 with IPv4 and IPv6 prefixes), this should provide a seamless looking glass experience.

## 🎯 What This Integration Provides

✅ **BGP Route Lookup** - Query specific prefixes in your GoBGP RIB  
✅ **AS Path Search** - Find routes containing specific AS numbers  
✅ **BGP Community Search** - Search for routes with specific communities  
✅ **IPv4 and IPv6 Support** - Full dual-stack support  
✅ **Ping & Traceroute** - Network diagnostics from your router  

## 🚀 Quick Setup

### 1. Update Your Device Configuration

Replace your existing `etc/hyperglass/devices.yaml` with:

```yaml
devices:
  - name: Aurora GoBGP Router
    address: 194.46.58.111  # Your GoBGP router IP
    credential:
      username: root  # Change to your SSH username
      password: your_password  # Change to your SSH password
    platform: gobgp  # Use the new GoBGP platform
    attrs:
      source4: 194.46.58.111  # Your IPv4 source for ping/traceroute
      source6: 2a06:7e00:0:E00::2  # Your IPv6 source for ping/traceroute
    directives:
      - __hyperglass_gobgp_bgp_route__
      - __hyperglass_gobgp_bgp_aspath__
      - __hyperglass_gobgp_bgp_community__
      - __hyperglass_gobgp_ping__
      - __hyperglass_gobgp_traceroute__
```

### 2. Test GoBGP Commands

Run this on your GoBGP router to verify everything works:

```bash
# Test basic GoBGP connectivity
gobgp global

# Test route lookup
gobgp global rib -a ipv4-unicast 194.31.143.0/24
gobgp global rib -a ipv6-unicast 2a11:29c0:3f::/48

# Test AS path search
gobgp global rib -a ipv4-unicast | grep "211747"

# Test community search (if you have communities)
gobgp global rib -a ipv4-unicast | grep "65001:100"
```

### 3. Restart Hyperglass

After updating the configuration:

```bash
# Restart hyperglass service
sudo systemctl restart hyperglass

# Or if running manually
hyperglass start
```

## 🔧 Advanced Configuration

### SSH Key Authentication

For better security, use SSH keys instead of passwords:

```yaml
devices:
  - name: Aurora GoBGP Router
    address: 194.46.58.111
    credential:
      username: hyperglass
      key: /path/to/private/key
    platform: gobgp
    # ... rest of configuration
```

### Multiple Routers

If you have multiple GoBGP instances:

```yaml
devices:
  - name: GoBGP Primary
    address: 194.46.58.111
    platform: gobgp
    # ... configuration ...

  - name: GoBGP Secondary
    address: 194.46.58.112
    platform: gobgp
    # ... configuration ...
```

### Custom Directives

Add custom GoBGP commands in `directives.yaml`:

```yaml
gobgp-neighbors:
  name: BGP Neighbors
  rules:
    - condition: null
      command: gobgp neighbor
  field: null

gobgp-summary:
  name: BGP Summary
  rules:
    - condition: null
      command: gobgp global rib summary
  field: null
```

## 🧪 Testing Your Setup

### 1. Test SSH Access

```bash
ssh root@194.46.58.111 "gobgp global"
```

### 2. Test Route Queries

Try these queries in your hyperglass web interface:

- **BGP Route**: `194.31.143.0/24` (your announced prefix)
- **BGP Route**: `2a11:29c0:3f::/48` (your IPv6 prefix)
- **AS Path**: `211747` (your AS number)
- **AS Path**: `204044` (OnlyServers AS)
- **Ping**: `8.8.8.8`
- **Traceroute**: `1.1.1.1`

### 3. Verify Output

Expected output formats:

**BGP Route Query:**
```
Network              Next Hop             AS_PATH              Age        Attrs
*> 194.31.143.0/24   194.46.58.110        204044               00:05:23   [{Origin: i}]
```

**AS Path Search:**
```
*> 8.8.8.0/24        194.46.58.110        204044 15169         00:10:15   [{Origin: i}]
```

## 🐛 Troubleshooting

### Common Issues

**1. "Command not found: gobgp"**
- Ensure GoBGP is installed and in PATH
- Try: `which gobgp` on your router

**2. "Permission denied"**
- Verify SSH user has permission to run `gobgp` commands
- Try: `sudo -u hyperglass gobgp global`

**3. "No routes found"**
- Check if GoBGP has routes: `gobgp global rib`
- Verify your prefixes are announced: `gobgp global rib -a ipv4-unicast 194.31.143.0/24`

**4. "Connection timeout"**
- Verify SSH connectivity: `ssh user@194.46.58.111`
- Check firewall rules

### Debug Commands

```bash
# Check GoBGP status
gobgp global

# Check neighbors
gobgp neighbor

# Check IPv4 routes
gobgp global rib -a ipv4-unicast

# Check IPv6 routes  
gobgp global rib -a ipv6-unicast

# Test specific prefix
gobgp global rib -a ipv4-unicast 194.31.143.0/24
```

## 📊 Expected Performance

- **Route Lookups**: ~100-500ms (depending on RIB size)
- **AS Path Searches**: ~200-1000ms (uses grep filtering)
- **Community Searches**: ~200-1000ms (uses grep filtering)
- **Ping/Traceroute**: Standard network latency

## 🔄 Migration from BIRD

If you're migrating from BIRD:

1. **Backup** your existing hyperglass configuration
2. **Update** the platform from `bird` to `gobgp`
3. **Test** all query types work correctly
4. **Monitor** performance and adjust if needed

The user interface remains exactly the same - users won't notice any difference!

## 🎉 Success Indicators

You'll know the integration is working when:

✅ Hyperglass web interface loads without errors  
✅ All query types (BGP Route, AS Path, Community, Ping, Traceroute) are available  
✅ Queries return results in reasonable time  
✅ Your announced prefixes show up in route lookups  
✅ AS path searches find routes containing your AS number  

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Run the test script: `./scripts/test-gobgp-commands.sh`
3. Review hyperglass logs for error messages
4. Join the hyperglass community on Slack or Telegram

## 🚀 Next Steps

Once your GoBGP integration is working:

- Consider adding more GoBGP routers for redundancy
- Explore custom directives for advanced GoBGP features
- Set up monitoring for your looking glass service
- Share your success with the hyperglass community!

---

**Congratulations!** You now have a modern, API-driven looking glass powered by GoBGP and hyperglass. Your network visibility just got a major upgrade! 🎊
