import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Text,
  Badge,
  Button,
  HStack,
  VStack,
  Image,
  useColorModeValue,
  Skeleton,
} from '@chakra-ui/react';
import { useState, useCallback } from 'react';
import { DynamicIcon } from '~/elements';
import { useConfig } from '~/context';

interface BGPVisualizationProps {
  asn?: string;
  compact?: boolean;
}

export const BGPVisualization = ({ asn = '211747', compact = false }: BGPVisualizationProps): JSX.Element => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const config = useConfig();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // BGP.tools visualization URL
  const visualizationUrl = `https://bgp.tools/pathimg/${asn}-default?&wiggly&t=${refreshKey}`;
  
  const handleRefresh = useCallback(() => {
    setImageLoaded(false);
    setImageError(false);
    setRefreshKey(Date.now());
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoaded(false);
    setImageError(true);
  }, []);

  const openBGPTools = useCallback(() => {
    window.open(`https://bgp.tools/as/${asn}`, '_blank', 'noopener,noreferrer');
  }, [asn]);

  if (compact) {
    return (
      <Box
        bg="blackAlpha.400"
        backdropFilter="blur(10px)"
        border="1px solid"
        borderColor="whiteAlpha.100"
        borderRadius="lg"
        p={4}
        _hover={{ borderColor: "purple.400" }}
        transition="all 0.2s"
        h="fit-content"
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="sm" fontWeight="600" color="purple.300" textTransform="uppercase" letterSpacing="wider">
            <DynamicIcon icon={{ fa: 'FaProjectDiagram' }} mr={2} />
            Network Topology
          </Text>
          <Badge colorScheme="purple" size="sm" variant="outline">
            AS{asn}
          </Badge>
        </Flex>

        <Box position="relative" minH="200px">
          {!imageLoaded && !imageError && (
            <Skeleton height="200px" borderRadius="md" />
          )}

          {imageError && (
            <Flex
              height="200px"
              align="center"
              justify="center"
              bg="blackAlpha.300"
              borderRadius="md"
              flexDir="column"
            >
              <DynamicIcon icon={{ fa: 'FaExclamationTriangle' }} color="orange.400" mb={2} />
              <Text fontSize="xs" color="gray.400">
                Visualization unavailable
              </Text>
            </Flex>
          )}

          <Image
            src={visualizationUrl}
            alt={`BGP topology for AS${asn}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            display={imageLoaded ? 'block' : 'none'}
            w="100%"
            h="200px"
            objectFit="contain"
            borderRadius="md"
          />
        </Box>

        <HStack justify="space-between" mt={3}>
          <Button size="xs" variant="ghost" onClick={handleRefresh} color="gray.400">
            <DynamicIcon icon={{ fa: 'FaSync' }} />
          </Button>
          <Button size="xs" variant="ghost" onClick={openBGPTools} color="gray.400">
            <DynamicIcon icon={{ fa: 'FaExternalLinkAlt' }} />
          </Button>
        </HStack>
      </Box>
    );
  }

  return (
    <Box
      bg="whiteAlpha.50"
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="xl"
      p={6}
      _dark={{
        bg: "blackAlpha.300",
        borderColor: "whiteAlpha.100",
      }}
    >
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" fontWeight="300" letterSpacing="wide">
          <DynamicIcon icon={{ fa: 'FaProjectDiagram' }} mr={3} color="purple.400" />
          Network Topology
        </Heading>
        <Badge
          colorScheme="purple"
          variant="subtle"
          px={3}
          py={1}
          borderRadius="full"
          fontSize="xs"
          fontWeight="medium"
        >
          AS{asn}
        </Badge>
      </Flex>
        <VStack spacing={4} align="stretch">
          <Text fontSize="sm" color="gray.600">
            Real-time visualization of BGP routing paths and network topology for AS{asn}.
            Data provided by bgp.tools.
          </Text>

          {/* Controls */}
          <HStack justify="space-between">
            <Button
              size="sm"
              onClick={handleRefresh}
              leftIcon={<DynamicIcon icon={{ fa: 'FaSync' }} />}
              isLoading={!imageLoaded && !imageError}
              loadingText="Loading..."
            >
              Refresh
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={openBGPTools}
              leftIcon={<DynamicIcon icon={{ fa: 'FaExternalLinkAlt' }} />}
            >
              View on BGP.tools
            </Button>
          </HStack>

          {/* Visualization */}
          <Box
            position="relative"
            minH="300px"
            border="1px"
            borderColor={borderColor}
            borderRadius="md"
            overflow="hidden"
          >
            {!imageLoaded && !imageError && (
              <Skeleton height="300px" />
            )}
            
            {imageError && (
              <Flex
                height="300px"
                align="center"
                justify="center"
                bg="gray.50"
                flexDir="column"
                gap={2}
              >
                <DynamicIcon icon={{ fa: 'FaExclamationTriangle' }} color="orange.500" size="2xl" />
                <Text fontWeight="medium">Visualization Unavailable</Text>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  The BGP topology visualization could not be loaded.
                  This may be due to network connectivity or bgp.tools availability.
                </Text>
                <Button size="sm" onClick={handleRefresh} mt={2}>
                  Try Again
                </Button>
              </Flex>
            )}
            
            <Image
              src={visualizationUrl}
              alt={`BGP topology visualization for AS${asn}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              display={imageLoaded ? 'block' : 'none'}
              w="100%"
              h="300px"
              objectFit="contain"
            />
          </Box>

          {/* Info */}
          <Box bg="blue.50" p={3} borderRadius="md">
            <Text fontSize="xs" fontWeight="medium" mb={1}>
              About this visualization:
            </Text>
            <Text fontSize="xs" color="gray.600">
              This diagram shows the BGP routing topology and paths for AS{asn}. 
              The visualization is generated in real-time by bgp.tools and shows 
              how your network connects to the global internet routing table.
            </Text>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};
