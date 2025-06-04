# Speed Test Features Integration Guide

This guide covers the new speed test features added to your hyperglass looking glass, including iperf3 testing and download speed tests.

## 🚀 New Features Overview

### 1. **iperf3 Speed Testing**
- **Interactive Testing**: Real-time iperf3 tests against global high-bandwidth servers
- **Command Generation**: Display commands for users to test against your server
- **Multiple Servers**: Pre-configured 100Gbps+ servers worldwide
- **Dual Direction**: Both download and upload testing
- **Real-time Results**: Live speed measurements with detailed metrics

### 2. **Download Speed Tests**
- **On-demand File Generation**: 100MB, 1GB, and 10GB test files
- **Real-time Progress**: Live download progress with speed measurements
- **Browser-based**: No additional software required
- **Command Examples**: wget/curl examples for CLI users

### 3. **BGP Network Visualization**
- **Real-time Topology**: Live BGP routing visualization from bgp.tools
- **AS Path Visualization**: Shows your AS (211747) routing paths
- **Interactive**: Click-through to detailed BGP information

## 🛠️ Backend Implementation

### New API Endpoints

#### iperf3 Testing
- `GET /api/speedtest/iperf3/servers` - List available iperf3 servers
- `POST /api/speedtest/iperf3/test` - Run iperf3 test
- `GET /api/speedtest/iperf3/command` - Get command examples

#### Speed Test Downloads
- `GET /api/speedtest/files` - List available test files
- `GET /speedtest/{filename}` - Download test files (100MB.bin, 1GB.bin, 10GB.bin)

### Files Added/Modified

**Backend:**
- `hyperglass/api/routes_speedtest.py` - Speed test API endpoints
- `hyperglass/api/speedtest_files.py` - File generation and serving
- `hyperglass/api/__init__.py` - Updated to include new routes

**Frontend:**
- `hyperglass/ui/components/iperf3-test.tsx` - iperf3 testing component
- `hyperglass/ui/components/speedtest-download.tsx` - Download testing component
- `hyperglass/ui/components/bgp-visualization.tsx` - BGP topology visualization
- `hyperglass/ui/components/looking-glass-form.tsx` - Updated main form
- `hyperglass/ui/components/index.ts` - Updated exports

## 🎯 Features in Detail

### iperf3 Speed Testing

**Available Servers:**
- Hurricane Electric (Fremont & Chicago) - 100 Gbps
- Bouygues Telecom (Paris) - 100 Gbps
- Scaleway (Paris) - 100 Gbps
- Online.net (Paris) - 100 Gbps
- Vultr (Amsterdam) - 100 Gbps

**Test Options:**
- **Direction**: Download (server → you) or Upload (you → server)
- **Duration**: 5, 10, 15, or 30 seconds
- **Real-time Results**: Speed, data transferred, retransmits

**Command Examples:**
```bash
# Test TO your server
iperf3 -c 194.46.58.111 -p 5201 -t 10

# Test FROM your server (upload)
iperf3 -c 194.46.58.111 -p 5201 -t 10 -R
```

### Download Speed Tests

**Available Files:**
- **100MB.bin** - Quick speed test
- **1GB.bin** - Standard speed test
- **10GB.bin** - Extended speed test for high-bandwidth connections

**Features:**
- **Real-time Progress**: Live download progress bars
- **Speed Measurement**: Continuous speed calculations
- **Cancellation**: Ability to cancel downloads
- **Command Examples**: wget/curl commands for CLI testing

### BGP Visualization

**Features:**
- **Live Topology**: Real-time BGP routing visualization
- **AS 211747 Focus**: Specifically shows your network's routing
- **Interactive**: Links to detailed BGP information on bgp.tools
- **Refresh**: Manual refresh for updated topology

## 🔧 Setup Requirements

### Backend Requirements

1. **iperf3 Installation** (for iperf3 testing):
```bash
# Ubuntu/Debian
sudo apt-get install iperf3

# CentOS/RHEL
sudo yum install iperf3

# macOS
brew install iperf3
```

2. **Network Access**: Ensure your server can reach external iperf3 servers
3. **Firewall**: Allow outbound connections on port 5201 for iperf3

### Optional: iperf3 Server Setup

To allow users to test TO your server, set up an iperf3 server:

```bash
# Run iperf3 server (daemon mode)
iperf3 -s -D -p 5201

# Or as a systemd service
sudo systemctl enable iperf3-server
sudo systemctl start iperf3-server
```

**Firewall Configuration:**
```bash
# Allow iperf3 server port
sudo ufw allow 5201/tcp
# or
sudo firewall-cmd --permanent --add-port=5201/tcp
sudo firewall-cmd --reload
```

## 🎨 UI Integration

The new components are seamlessly integrated into the existing hyperglass UI:

### Design Consistency
- **Chakra UI Components**: Uses the same design system as the rest of hyperglass
- **Responsive Design**: Works on desktop and mobile devices
- **Theme Integration**: Respects light/dark mode settings
- **Animation**: Smooth transitions and loading states

### Layout
- **Below Main Form**: Speed test components appear below the traditional looking glass form
- **Card-based Design**: Each feature is in its own card for clear separation
- **Progressive Enhancement**: Doesn't interfere with existing functionality

## 🚀 Usage Examples

### For Network Operators

1. **Showcase Network Performance**: Demonstrate your 25Gbps dedicated bandwidth
2. **Customer Testing**: Provide easy speed testing for customers
3. **Troubleshooting**: Help customers diagnose connectivity issues
4. **Marketing**: Visual proof of network performance and topology

### For Users

1. **Quick Speed Test**: Download test files to measure connection speed
2. **iperf3 Testing**: Professional-grade network performance testing
3. **Network Topology**: Understand how your traffic routes through AS 211747
4. **Command Examples**: Learn how to perform tests from command line

## 📊 Performance Considerations

### Server Resources
- **CPU**: iperf3 tests are CPU-intensive during execution
- **Bandwidth**: Download tests will consume your server's bandwidth
- **Memory**: File generation is done on-the-fly to minimize storage

### Optimization Tips
1. **Rate Limiting**: Consider implementing rate limiting for speed tests
2. **Concurrent Limits**: Limit simultaneous iperf3 tests
3. **Monitoring**: Monitor server resources during peak usage
4. **Caching**: BGP visualizations are cached by bgp.tools

## 🔍 Troubleshooting

### Common Issues

**iperf3 Tests Failing:**
- Check iperf3 installation: `which iperf3`
- Verify network connectivity to test servers
- Check firewall rules for outbound connections

**Download Tests Slow:**
- Verify server bandwidth capacity
- Check for network congestion
- Monitor server CPU/memory usage

**BGP Visualization Not Loading:**
- Check connectivity to bgp.tools
- Verify AS number (211747) is correct
- Try refreshing the visualization

### Debug Commands

```bash
# Test iperf3 manually
iperf3 -c iperf.he.net -p 5201 -t 5

# Check server connectivity
curl -I https://bgp.tools/as/211747

# Monitor server resources
htop
iftop
```

## 🎉 Success Metrics

You'll know the integration is working when:

✅ **iperf3 Tests**: Successfully run against external servers  
✅ **Download Tests**: Files download with accurate speed measurements  
✅ **BGP Visualization**: Shows your AS 211747 topology  
✅ **UI Integration**: Components load seamlessly with existing design  
✅ **Performance**: Tests complete without impacting looking glass functionality  

## 🔮 Future Enhancements

Potential improvements:
1. **Upload Speed Tests**: File upload testing capability
2. **Historical Data**: Store and display speed test history
3. **Geolocation**: Show test server locations on a map
4. **Custom Servers**: Allow configuration of additional iperf3 servers
5. **API Integration**: Expose speed test results via API
6. **Alerts**: Notify when network performance degrades

---

**Congratulations!** Your hyperglass looking glass now includes comprehensive speed testing capabilities, making it a complete network diagnostic tool! 🎊
