import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Progress,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text,
  VStack,
  useToast,
  Badge,
  Divider,
  Code,
  Collapse,
  IconButton,
} from '@chakra-ui/react';
import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { If, Then, Else } from 'react-if';
import { DynamicIcon } from '~/elements';

interface IperfServer {
  id: string;
  name: string;
  host: string;
  port: number;
  location: string;
  bandwidth: string;
  provider: string;
}

interface IperfResult {
  success: boolean;
  server: IperfServer;
  test_config: {
    duration: number;
    direction: string;
    timestamp: string;
  };
  results: {
    speed_bps: number;
    speed_mbps: number;
    speed_gbps: number;
    bytes_transferred: number;
    retransmits: number;
    runtime: number;
  };
}

interface IperfCommand {
  server_ip: string;
  target_server: IperfServer;
  commands: {
    to_your_server: {
      download: string;
      upload: string;
      description: string;
    };
    from_your_server: {
      download: string;
      upload: string;
      description: string;
    };
  };
  instructions: {
    install: string;
    usage: string;
    note: string;
  };
}

export const Iperf3Test = (): JSX.Element => {
  const [selectedServer, setSelectedServer] = useState<string>('iperf_he_fremont');
  const [direction, setDirection] = useState<'download' | 'upload'>('download');
  const [duration, setDuration] = useState<number>(10);
  const [showCommands, setShowCommands] = useState<boolean>(false);
  const toast = useToast();

  // Fetch available servers
  const { data: servers = [], isLoading: serversLoading } = useQuery<IperfServer[]>({
    queryKey: ['iperf3-servers'],
    queryFn: async () => {
      const response = await fetch('/api/speedtest/iperf3/servers');
      if (!response.ok) throw new Error('Failed to fetch servers');
      return response.json();
    },
  });

  // Fetch command examples
  const { data: commandData } = useQuery<IperfCommand>({
    queryKey: ['iperf3-command', selectedServer],
    queryFn: async () => {
      const response = await fetch(`/api/speedtest/iperf3/command?server_id=${selectedServer}`);
      if (!response.ok) throw new Error('Failed to fetch commands');
      return response.json();
    },
    enabled: showCommands,
  });

  // Run iperf3 test mutation
  const iperfMutation = useMutation<IperfResult, Error, { server_id: string; direction: string; duration: number }>({
    mutationFn: async (data) => {
      const response = await fetch('/api/speedtest/iperf3/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'iperf3 test failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'iperf3 Test Completed',
        description: `Speed: ${data.results.speed_mbps} Mbps`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'iperf3 Test Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleRunTest = useCallback(() => {
    iperfMutation.mutate({
      server_id: selectedServer,
      direction,
      duration,
    });
  }, [selectedServer, direction, duration, iperfMutation]);

  const formatSpeed = (mbps: number): string => {
    if (mbps >= 1000) {
      return `${(mbps / 1000).toFixed(2)} Gbps`;
    }
    return `${mbps.toFixed(2)} Mbps`;
  };

  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <Box
      bg="blackAlpha.400"
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="lg"
      p={4}
      _hover={{ borderColor: "blue.400" }}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="sm" fontWeight="600" color="blue.300" textTransform="uppercase" letterSpacing="wider">
          <DynamicIcon icon={{ fa: 'FaNetworkWired' }} mr={2} />
          Network Performance
        </Text>
        <Badge colorScheme="blue" size="sm" variant="outline">
          iperf3
        </Badge>
      </Flex>
      <VStack spacing={3} align="stretch">
          {/* Compact Configuration */}
          <HStack spacing={3}>
            <Box flex={2}>
              <Text fontSize="xs" mb={1} color="gray.400">Server</Text>
              <Select
                size="sm"
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                isDisabled={iperfMutation.isPending}
                bg="blackAlpha.300"
                border="1px solid"
                borderColor="whiteAlpha.200"
                borderRadius="md"
                fontSize="xs"
                _hover={{ borderColor: "blue.400" }}
                _focus={{ borderColor: "blue.400" }}
              >
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name.split(' ')[0]} - {server.location.split(',')[0]}
                  </option>
                ))}
              </Select>
            </Box>

            <Box flex={1}>
              <Text fontSize="xs" mb={1} color="gray.400">Direction</Text>
              <Select
                size="sm"
                value={direction}
                onChange={(e) => setDirection(e.target.value as 'download' | 'upload')}
                isDisabled={iperfMutation.isPending}
                bg="blackAlpha.300"
                border="1px solid"
                borderColor="whiteAlpha.200"
                borderRadius="md"
                fontSize="xs"
                _hover={{ borderColor: "blue.400" }}
                _focus={{ borderColor: "blue.400" }}
              >
                <option value="download">Download</option>
                <option value="upload">Upload</option>
              </Select>
            </Box>
          </HStack>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="sm" mb={2} color="gray.400" fontWeight="medium">Target Server</Text>
                <Select
                  value={selectedServer}
                  onChange={(e) => setSelectedServer(e.target.value)}
                  isDisabled={iperfMutation.isPending}
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  borderRadius="md"
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
                  _dark={{
                    bg: "whiteAlpha.100",
                    borderColor: "whiteAlpha.200",
                  }}
                >
                  {servers.map((server) => (
                    <option key={server.id} value={server.id}>
                      {server.name} - {server.location} ({server.bandwidth})
                    </option>
                  ))}
                </Select>
              </Box>
              
              <HStack>
                <Box flex={1}>
                  <Text fontSize="sm" mb={1}>Direction</Text>
                  <Select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as 'download' | 'upload')}
                    isDisabled={iperfMutation.isPending}
                  >
                    <option value="download">Download (Server → You)</option>
                    <option value="upload">Upload (You → Server)</option>
                  </Select>
                </Box>
                
                <Box flex={1}>
                  <Text fontSize="sm" mb={1}>Duration (seconds)</Text>
                  <Select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    isDisabled={iperfMutation.isPending}
                  >
                    <option value={5}>5 seconds</option>
                    <option value={10}>10 seconds</option>
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                  </Select>
                </Box>
              </HStack>
            </VStack>
          </Box>

          <Divider />

          {/* Test Controls */}
          <HStack spacing={2}>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={handleRunTest}
              isLoading={iperfMutation.isPending}
              loadingText="Testing..."
              leftIcon={<DynamicIcon icon={{ fa: 'FaPlay' }} />}
              isDisabled={serversLoading}
              flex={1}
            >
              Run Test
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCommands(!showCommands)}
              leftIcon={<DynamicIcon icon={{ fa: 'FaTerminal' }} />}
              color="gray.400"
              _hover={{ color: "white" }}
            >
              CLI
            </Button>
          </HStack>

          {/* Progress Bar */}
          <If condition={iperfMutation.isPending}>
            <Then>
              <Box>
                <Text fontSize="sm" mb={2}>Running iperf3 test...</Text>
                <Progress isIndeterminate colorScheme="blue" />
              </Box>
            </Then>
          </If>

          {/* Test Results */}
          <If condition={iperfMutation.data !== undefined}>
            <Then>
              {iperfMutation.data && (
                <Box>
                  <Text fontWeight="semibold" mb={3}>Test Results</Text>
                  <HStack spacing={4} wrap="wrap">
                    <Stat>
                      <StatLabel>Speed</StatLabel>
                      <StatNumber color="blue.500">
                        {formatSpeed(iperfMutation.data.results.speed_mbps)}
                      </StatNumber>
                      <StatHelpText>
                        {iperfMutation.data.test_config.direction === 'download' ? 'Download' : 'Upload'}
                      </StatHelpText>
                    </Stat>
                    
                    <Stat>
                      <StatLabel>Data Transferred</StatLabel>
                      <StatNumber>
                        {formatBytes(iperfMutation.data.results.bytes_transferred)}
                      </StatNumber>
                      <StatHelpText>
                        in {iperfMutation.data.results.runtime}s
                      </StatHelpText>
                    </Stat>
                    
                    <Stat>
                      <StatLabel>Retransmits</StatLabel>
                      <StatNumber color={iperfMutation.data.results.retransmits > 0 ? 'orange.500' : 'green.500'}>
                        {iperfMutation.data.results.retransmits}
                      </StatNumber>
                      <StatHelpText>
                        {iperfMutation.data.results.retransmits === 0 ? 'Perfect!' : 'Some packet loss'}
                      </StatHelpText>
                    </Stat>
                  </HStack>
                  
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    Tested against: {iperfMutation.data.server.name} ({iperfMutation.data.server.location})
                  </Text>
                </Box>
              )}
            </Then>
          </If>

          {/* Command Examples */}
          <Collapse in={showCommands}>
            <If condition={commandData !== undefined}>
              <Then>
                {commandData && (
                  <Box>
                    <Text fontWeight="semibold" mb={3}>Command Examples</Text>
                    <VStack spacing={3} align="stretch">
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={1}>Test TO your server:</Text>
                        <Code p={2} display="block" fontSize="xs">
                          {commandData.commands.to_your_server.download}
                        </Code>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {commandData.commands.to_your_server.description}
                        </Text>
                      </Box>
                      
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={1}>Test FROM your server:</Text>
                        <Code p={2} display="block" fontSize="xs">
                          {commandData.commands.from_your_server.download}
                        </Code>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {commandData.commands.from_your_server.description}
                        </Text>
                      </Box>
                      
                      <Box bg="gray.50" p={3} borderRadius="md">
                        <Text fontSize="xs" fontWeight="medium" mb={1}>Installation:</Text>
                        <Code fontSize="xs">{commandData.instructions.install}</Code>
                      </Box>
                    </VStack>
                  </Box>
                )}
              </Then>
            </If>
          </Collapse>
        </VStack>
      </CardBody>
    </Card>
  );
};
