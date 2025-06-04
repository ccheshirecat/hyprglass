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
  Text,
  VStack,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Divider,
  Code,
  Collapse,
} from '@chakra-ui/react';
import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { If, Then, Else } from 'react-if';
import { DynamicIcon } from '~/elements';

interface SpeedTestFile {
  size: string;
  filename: string;
  bytes: number;
  url: string;
  description: string;
}

interface SpeedTestData {
  files: SpeedTestFile[];
  instructions: {
    usage: string;
    examples: {
      wget: string;
      curl: string;
    };
  };
}

interface DownloadProgress {
  filename: string;
  loaded: number;
  total: number;
  speed: number;
  startTime: number;
  isComplete: boolean;
}

export const SpeedTestDownload = (): JSX.Element => {
  const [activeDownloads, setActiveDownloads] = useState<Map<string, DownloadProgress>>(new Map());
  const [showCommands, setShowCommands] = useState<boolean>(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const toast = useToast();

  // Fetch speed test files
  const { data: speedTestData, isLoading } = useQuery<SpeedTestData>({
    queryKey: ['speedtest-files'],
    queryFn: async () => {
      const response = await fetch('/api/speedtest/files');
      if (!response.ok) throw new Error('Failed to fetch speed test files');
      return response.json();
    },
  });

  const formatSpeed = (bytesPerSecond: number): string => {
    const mbps = (bytesPerSecond * 8) / (1024 * 1024);
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

  const startDownload = useCallback(async (file: SpeedTestFile) => {
    const controller = new AbortController();
    abortControllersRef.current.set(file.filename, controller);

    const startTime = Date.now();
    setActiveDownloads(prev => new Map(prev.set(file.filename, {
      filename: file.filename,
      loaded: 0,
      total: file.bytes,
      speed: 0,
      startTime,
      isComplete: false,
    })));

    try {
      const response = await fetch(file.url, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let loaded = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - startTime) / 1000;
        const speed = elapsedSeconds > 0 ? loaded / elapsedSeconds : 0;

        setActiveDownloads(prev => new Map(prev.set(file.filename, {
          filename: file.filename,
          loaded,
          total: file.bytes,
          speed,
          startTime,
          isComplete: false,
        })));
      }

      // Mark as complete
      const finalTime = Date.now();
      const totalSeconds = (finalTime - startTime) / 1000;
      const finalSpeed = totalSeconds > 0 ? loaded / totalSeconds : 0;

      setActiveDownloads(prev => new Map(prev.set(file.filename, {
        filename: file.filename,
        loaded,
        total: file.bytes,
        speed: finalSpeed,
        startTime,
        isComplete: true,
      })));

      toast({
        title: 'Download Complete',
        description: `${file.size} downloaded at ${formatSpeed(finalSpeed)}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Clean up after 10 seconds
      setTimeout(() => {
        setActiveDownloads(prev => {
          const newMap = new Map(prev);
          newMap.delete(file.filename);
          return newMap;
        });
        abortControllersRef.current.delete(file.filename);
      }, 10000);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: 'Download Cancelled',
          description: `${file.size} download was cancelled`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Download Failed',
          description: error.message || 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }

      setActiveDownloads(prev => {
        const newMap = new Map(prev);
        newMap.delete(file.filename);
        return newMap;
      });
      abortControllersRef.current.delete(file.filename);
    }
  }, [toast]);

  const cancelDownload = useCallback((filename: string) => {
    const controller = abortControllersRef.current.get(filename);
    if (controller) {
      controller.abort();
    }
  }, []);

  const isDownloading = (filename: string): boolean => {
    const download = activeDownloads.get(filename);
    return download !== undefined && !download.isComplete;
  };

  const getProgress = (filename: string): number => {
    const download = activeDownloads.get(filename);
    if (!download || download.total === 0) return 0;
    return (download.loaded / download.total) * 100;
  };

  return (
    <Box
      bg="blackAlpha.400"
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="lg"
      p={4}
      _hover={{ borderColor: "green.400" }}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="sm" fontWeight="600" color="green.300" textTransform="uppercase" letterSpacing="wider">
          <DynamicIcon icon={{ fa: 'FaDownload' }} mr={2} />
          Bandwidth Testing
        </Text>
        <Badge colorScheme="green" size="sm" variant="outline">
          Download
        </Badge>
      </Flex>
      <VStack spacing={3} align="stretch">
        {/* Compact Download Buttons */}
        <If condition={!isLoading && speedTestData}>
          <Then>
            {speedTestData && (
              <HStack spacing={2} wrap="wrap">
                {speedTestData.files.map((file) => {
                    const downloading = isDownloading(file.filename);
                    const progress = getProgress(file.filename);
                    const downloadData = activeDownloads.get(file.filename);

                    return (
                      <VStack key={file.filename} spacing={1}>
                        <If condition={downloading}>
                          <Then>
                            <Button
                              size="xs"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => cancelDownload(file.filename)}
                              leftIcon={<DynamicIcon icon={{ fa: 'FaStop' }} />}
                            >
                              Cancel {file.size}
                            </Button>
                          </Then>
                          <Else>
                            <Button
                              size="xs"
                              colorScheme="green"
                              variant="outline"
                              onClick={() => startDownload(file)}
                              leftIcon={<DynamicIcon icon={{ fa: 'FaDownload' }} />}
                              isDisabled={activeDownloads.has(file.filename)}
                              _hover={{ bg: "green.500", color: "white" }}
                            >
                              {file.size}
                            </Button>
                          </Else>
                        </If>

                        <If condition={downloading || downloadData?.isComplete}>
                          <Then>
                            <VStack spacing={2} align="stretch">
                              <Progress
                                value={progress}
                                colorScheme={downloadData?.isComplete ? 'green' : 'blue'}
                                size="sm"
                              />
                              
                              <HStack justify="space-between" fontSize="xs">
                                <Text>
                                  {formatBytes(downloadData?.loaded || 0)} / {formatBytes(file.bytes)}
                                </Text>
                                <Text fontWeight="medium" color="blue.500">
                                  {formatSpeed(downloadData?.speed || 0)}
                                </Text>
                              </HStack>
                            </VStack>
                          </Then>
                        </If>
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Then>
          </If>

          <Divider />

          {/* Command Examples */}
          <HStack justify="space-between">
            <Text fontSize="sm" fontWeight="medium">
              Command Line Testing
            </Text>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCommands(!showCommands)}
              leftIcon={<DynamicIcon icon={{ fa: 'FaTerminal' }} />}
            >
              {showCommands ? 'Hide' : 'Show'} Commands
            </Button>
          </HStack>

          <Collapse in={showCommands}>
            <If condition={speedTestData}>
              <Then>
                {speedTestData && (
                  <VStack spacing={3} align="stretch">
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>wget Examples:</Text>
                      <Code p={2} display="block" fontSize="xs">
                        {speedTestData.instructions.examples.wget}
                      </Code>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>curl Examples:</Text>
                      <Code p={2} display="block" fontSize="xs">
                        {speedTestData.instructions.examples.curl}
                      </Code>
                    </Box>
                    
                    <Box bg="gray.50" p={3} borderRadius="md">
                      <Text fontSize="xs" fontWeight="medium" mb={1}>Usage:</Text>
                      <Text fontSize="xs">{speedTestData.instructions.usage}</Text>
                    </Box>
                  </VStack>
                )}
              </Then>
            </If>
          </Collapse>

          {/* Active Downloads Summary */}
          <If condition={activeDownloads.size > 0}>
            <Then>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Active Downloads</Text>
                <HStack spacing={4} wrap="wrap">
                  {Array.from(activeDownloads.values()).map((download) => (
                    <Stat key={download.filename} size="sm">
                      <StatLabel>{download.filename}</StatLabel>
                      <StatNumber fontSize="md" color={download.isComplete ? 'green.500' : 'blue.500'}>
                        {formatSpeed(download.speed)}
                      </StatNumber>
                      <StatHelpText>
                        {download.isComplete ? 'Complete' : `${Math.round((download.loaded / download.total) * 100)}%`}
                      </StatHelpText>
                    </Stat>
                  ))}
                </HStack>
              </Box>
            </Then>
          </If>
        </VStack>
      </CardBody>
    </Card>
  );
};
