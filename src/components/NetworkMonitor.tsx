import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton, Slider, TableSortLabel, Fade, LinearProgress, styled, CircularProgress, } from '@mui/material';
import { Lan as ServerIcon, Search as SearchIcon, Speed as SpeedIcon, } from '@mui/icons-material';
import { RemoteHost } from '../data/HostConnection';
import { useOS, useOSState } from '../hooks/useOperatingSystem';
import { ScannedServerInfo } from './NetworkMonitorTypes';
import { convertToScannedInfo } from './ScannedServerUtilities';
import { ServerStatusCell } from './ServerStatusCell';
import { UnknownValue } from './UnknownValue';

// Styled Components
const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '& .MuiTableCell-root': {
        color: 'rgba(255, 255, 255, 0.87)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    transition: 'background-color 0.3s ease, transform 0.5s ease',
}));

const statusColorMap: Record<ScannedServerInfo['status'], string> = {
    hackable: '#4caf50', // Green
    potential: '#ff9800', // Orange
    secure: '#f44336', // Red
    unknown: '#757575', // Gray
};


const ScannerAnimation = styled(Box)({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
});

const GENERATED_SERVERS_LIMIT = 30; // Maximum number of servers in the generated pool
const SERVERS_POOL_LIMIT = 8; // Limit for servers pool
const minMillisecondsBetweenScans = 2000;
const maxMillisecondsBetweenScans = 8000;

// Main Component
export const NetworkMonitor: React.FC = () => {
    const os = useOS();
    const [isInitializing, setIsInitializing] = useState(true);
    const [showProgressBar, setShowProgressBar] = useState(true);
    const [hoveredServer, setHoveredServer] = useState<string | null>(null);
    const [servers, setServers] = useState<ScannedServerInfo[]>([]);
    const [scanSpeed, setScanSpeed] = useState<number>(50);
    const [generatedServers, setGeneratedServers] = useState<RemoteHost[]>([]);
    const [secondsBeforeRegen] = useState(60);

    const processedServerIds = new Set<string>(); // Tracks IDs of servers already in `servers` (ie migrated from pool1 to pool2)

    const [sortConfig, setSortConfig] = useState<{
        key: keyof ScannedServerInfo;
        direction: 'asc' | 'desc';
    }>({ key: 'discoveryTime', direction: 'desc' });

    useEffect(() => {
        const timer = setTimeout(() => setIsInitializing(false), 5000); // Simulate initialization delay
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isInitializing) {
            setShowProgressBar(true);
            const timer = setTimeout(() => setShowProgressBar(false), 3000); // Animate for 3 seconds
            return () => clearTimeout(timer);
        }
    }, [isInitializing]);


    // Simulated server discovery
    // Phase 1: Generate new servers periodically
    useEffect(() => {
        const generateNewServers = () => {
            const batchSizeIdeal = 10; // Requested batch size for new server generation
            const remainingBudget = GENERATED_SERVERS_LIMIT - generatedServers.length;

   if (remainingBudget <= 0) {
       console.log('No budget available to generate new servers.');
       return; // Skip generation if the budget is exhausted
   }

   const numToGenerate = Math.min(batchSizeIdeal, remainingBudget);

   console.log(`Generating ${numToGenerate} new servers (Remaining budget: ${remainingBudget})`);

            const scanner = os.scanService;
            const newServers = scanner.internalGenerateNewServers(numToGenerate); // Dynamic batch size
            setGeneratedServers(prev => {
                const combined = [...prev, ...newServers];
                return combined;
            });
        };

        const showProgressBarAndGenerate = () => {
            setShowProgressBar(true);
            setTimeout(() => {
                setShowProgressBar(false);
                generateNewServers();
            }, 3000); // 3 seconds
        };

        // Initial generation
        generateNewServers();

        // Set up interval for future generations
        const generationInterval = setInterval(showProgressBarAndGenerate, secondsBeforeRegen * 1000);

        return () => clearInterval(generationInterval);
    }, []);

    // Phase 2: Convert generated servers into ScannedServerInfo objects
    useEffect(() => {
        if (generatedServers.length === 0) return;

        const processInterval = setInterval(() => {
            const randomCount = Math.ceil(Math.random() * 3); // Add 1-3 servers at a time

            // Filter to exclude servers already in `servers`
       const randomServers = generatedServers
           .filter(host => !processedServerIds.has(host.fqdn)) // Exclude already processed
           .slice(0, randomCount); // Take only the first `randomCount` unprocessed servers


            const scannedServers = randomServers.map((host) => convertToScannedInfo(host));

            setServers((prev) => {
                const newServers = [...prev, ...scannedServers];

                // Add processed server IDs to the tracking set
           randomServers.forEach(host => processedServerIds.add(host.fqdn));

                // Evict old ones as needed to make way for new ones
                if (newServers.length > SERVERS_POOL_LIMIT) {
                           // Calculate how many servers to remove
        const numToRemove = newServers.length - SERVERS_POOL_LIMIT;

               // Remove corresponding IDs from `processedServerIds`
               const removedServers = newServers.slice(0, numToRemove);
               removedServers.forEach(server => processedServerIds.delete(server.address));
        
                // Remove the oldest servers to maintain pool size limit
                newServers.splice(0, numToRemove);
                       }
                return newServers;
            });
        }, calculateScanIntervalInMilliseconds());

        return () => clearInterval(processInterval);
    }, [generatedServers, scanSpeed]);

    const calculateScanIntervalInMilliseconds = () =>
    {
        return minMillisecondsBetweenScans + (scanSpeed)*(maxMillisecondsBetweenScans-minMillisecondsBetweenScans)/100;
    }


    // Sorting logic
    const sortedServers = React.useMemo(() => {
        const sorted = [...servers].sort((a, b) => {
            if (a[sortConfig.key] === null) return 1;
            if (b[sortConfig.key] === null) return -1;
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [servers, sortConfig]);

    const handleSort = (key: keyof ScannedServerInfo) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleScannedServerSelected = (serverInfo: ScannedServerInfo) => {
        console.log(`Selected server: ${serverInfo}`);

        handleOpenTerminal(serverInfo);
    };

    const handleOpenTerminal = (serverInfo: ScannedServerInfo) => {
        os.openTerminal( serverInfo.address);
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff33', color: '#fff' }}>
            {/* Header */}
<Box
    sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        bgcolor: '#004351',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'white'
    }}
>
    {/* Left Section */}
    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
        <ServerIcon sx={{ mr: 1, color: 'white' }} />
        <Typography variant="h6" component="div">
            Network Scanner
        </Typography>
    </Box>

    {/* Right Section */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Typography variant="body2" component="span" sx={{ fontSize: 14, opacity: 0.8 }}>
                Scan Interval: {calculateScanIntervalInMilliseconds() / 1000} seconds
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', width: 200 }}>
                <SpeedIcon sx={{ mr: 1, color: 'white', fontSize: 18 }} />
                <Slider
                    value={scanSpeed}
                    onChange={(_, value) => setScanSpeed(value as number)}
                    aria-label="Scan Speed"
                    sx={{
                        color: 'white',
                        '& .MuiSlider-thumb': {
                            bgcolor: 'white',
                            '&:hover, &.Mui-focusVisible': {
                                boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.2)',
                            },
                        },
                        '& .MuiSlider-rail': {
                            bgcolor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '& .MuiSlider-track': {
                            bgcolor: 'white',
                        },
                        width: '100%', // Ensure it stretches to the container width
                    }}
                />
            </Box>
        </Box>
    </Box>
</Box>


            {/* Scanner Animation */}
            <ScannerAnimation>
                {showProgressBar && (
                    <LinearProgress
                        sx={{
                            bgcolor: 'transparent',
                            '& .MuiLinearProgress-bar': { bgcolor: 'rgba(0, 255, 0, 0.82)' }
                        }}
                    />
                )}
            </ScannerAnimation>

            {/* Server Table */}
            <TableContainer component={Paper} sx={{ flexGrow: 1, bgcolor: 'transparent' }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.key === 'status'}
                                    direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'}
                                    onClick={() => handleSort('status')}
                                >
                                    Server
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.key === 'pingLatency'}
                                    direction={sortConfig.key === 'pingLatency' ? sortConfig.direction : 'asc'}
                                    onClick={() => handleSort('pingLatency')}
                                >
                                    Ping (ms)
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Ports</TableCell>
                            <TableCell>OS</TableCell>
                            <TableCell>Encryption</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
    {sortedServers.map((server, index) => (
        <StyledTableRow
            key={server.id}
            onMouseEnter={() => setHoveredServer(server.id)}
            onMouseLeave={() => setHoveredServer(null)}
            onClick={() => handleScannedServerSelected(server)}
            sx={{
                backgroundColor: hoveredServer === server.id
                    ? `${statusColorMap[server.status]}40`
                    : index % 2 === 0
                        ? 'transparent'
                        : 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
            }}
        >
            {['ServerStatusCell', 'pingLatency', 'openPorts', 'osType', 'encryptionLevel'].map((field, cellIndex) => (
                <Fade
                    in
                    timeout={800 + cellIndex * 400} // Staggered fade for each cell
                    key={`${server.id}-${field}`}
                >
                    <TableCell>
                        {field === 'ServerStatusCell' ? (
                            <ServerStatusCell server={server} />
                        ) : field === 'pingLatency' ? (
                            server.pingLatency ?? <UnknownValue />
                        ) : field === 'openPorts' ? (
                            server.openPorts ? server.openPorts.join(', ') : <UnknownValue />
                        ) : field === 'osType' ? (
                            server.osType ?? <UnknownValue />
                        ) : field === 'encryptionLevel' ? (
                            server.encryptionLevel ?? <UnknownValue />
                        ) : null}
                    </TableCell>
                </Fade>
            ))}
        </StyledTableRow>
    ))}
</TableBody>
                </Table>
            </TableContainer>

            {isInitializing && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexGrow: 1,
                        textAlign: 'center',
                        bgcolor: '#ffffff11',
                        p: 3,
                    }}
                >
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography variant="body1" fontStyle="italic">
                        Initializing... Please wait while the scan is prepared.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default NetworkMonitor;