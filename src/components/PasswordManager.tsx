import React, { useEffect, useState } from 'react';
import {
    Paper,
    Typography,
    Card,
    CardContent,
    CardHeader,
    Grid,
    Chip,
    Button,
    Divider,
    IconButton,
    Collapse,
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import TerminalIcon from '@mui/icons-material/Terminal';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import { useOS } from '../hooks/useOperatingSystem';
import { PasswordEntry } from '../backgroundservices/desktopservices/service-passwords';

const PasswordManager = () => {
    const os = useOS();
    const passwordsService = os.passwordsService;
    const [passwordsData, setPasswordsData] = useState<Record<string, PasswordEntry[]>>({});
    const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

    const handleOpenTerminal = (hostname: string, username: string, password: string | null | undefined) => {
        os.openTerminal(hostname, username, password);
    };

    useEffect(() => {
        // Initialize with existing data
        setPasswordsData(passwordsService.getPasswords());

        // Subscribe to additions and updates
        const handleAdd = (hostname: string, entry: PasswordEntry) =>
        {
           
            setPasswordsData((prevData) => {
                const existingEntries = prevData[hostname] || [];
                const isDuplicate = existingEntries.some(
                    (e) => e.username === entry.username && e.password === entry.password && e.status === entry.status
                );
        
                if (isDuplicate) {
                    // Even if the entry is a duplicate, return a new object reference
                    return { ...prevData };
                }
        
                return {
                    ...prevData,
                    [hostname]: [...existingEntries, entry],
                };
            });
        };

        const handleUpdate = (hostname: string, entry: PasswordEntry) => {
            setPasswordsData((prevData) => {
                const updatedEntries = prevData[hostname].map((e) =>
                    e.username === entry.username ? entry : e
                );
                return {
                    ...prevData,
                    [hostname]: updatedEntries,
                };
            });
        };

        passwordsService.onPasswordEntryAdded.addListener(handleAdd);
        passwordsService.onPasswordEntryUpdated.addListener(handleUpdate);

        return () => {
            passwordsService.onPasswordEntryAdded.removeListener(handleAdd);
            passwordsService.onPasswordEntryUpdated.removeListener(handleUpdate);
        };
    }, [passwordsService]);

    const statusColors = {
        confirmed: 'green',
        unconfirmed: 'gray',
        invalid: 'red',
    };
    

    return (
    <>
        <Paper style={{ padding: 16, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h4" gutterBottom align="center" style={{ fontWeight: 'bold' }}>
                🔐 Hacked/Discovered Passwords
            </Typography>
            {Object.keys(passwordsData).length === 0 && (
                <Typography variant="body1" align="center" style={{ color: '#757575', marginTop: 16 }}>
                    No breaches detected yet. Stay sharp, operator.
                </Typography>
            )}
            </Paper>
            <Grid container spacing={2}>
                {Object.entries(passwordsData).map(([hostname, entries]) => (
                    <Grid item xs={12} md={6} key={hostname}>
                        <Card variant="outlined">
                            <CardHeader
                                title={hostname}
                                titleTypographyProps={{
                                    variant: 'h6',
                                    style: { fontWeight: 'bold', flex: 1 },
                                }}
                                action={
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            setCollapsedCards((prev) => ({
                                                ...prev,
                                                [hostname]: !prev[hostname],
                                            }))
                                        }
                                    >
                                        {collapsedCards[hostname] ? (
                                            <ExpandMore />
                                        ) : (
                                            <ExpandLess />
                                        )}
                                    </IconButton>
                                }
                                style={{
                                    backgroundColor: '#e0e0e0',
                                    padding: '8px 16px',
                                }}
                            />
                            <Divider />
                            <Collapse in={!collapsedCards[hostname]}>
                            <CardContent style={{ padding: '8px 16px' }}>
                                {entries.map((entry) => (
                                    <Grid
                                        container
                                        alignItems="center"
                                        spacing={1}
                                        key={entry.username}
                                        style={{ marginBottom: 4 }}
                                    >
                                        <Grid item style={{paddingTop:12 }}>
                                            <VpnKeyIcon fontSize="small" />
                                        </Grid>
                                        <Grid item xs>
                                            <Typography
                                                variant="body2"
                                                style={{ fontWeight: 500, display: 'inline-block' }}
                                            >
                                                {entry.username}
                                            </Typography>
                                            :
                                            <Typography
                                                variant="body2"
                                                style={{
                                                    color: '#757575',
                                                    display: 'inline-block',
                                                    marginLeft: 8,
                                                    //fontSize: '0.8rem',
                                                }}
                                            >
                                                {entry.password ?? '(null/undefined)'}
                                            </Typography>
                                        </Grid>
                                        <Grid item>
                                            <Chip
                                                size="small"
                                                style={{
                                                    backgroundColor: statusColors[entry.status],
                                                    color: 'white',
                                                    height: '12px',
                                                    width: '12px',
                                                    marginRight: 8,
                                                }}
                                            />
                                        </Grid>
                                        <Grid item>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                style={{
                                                                                                        padding: '0px 8px',
                                                                                                        fontSize: '0.7rem',
                                                                                                        minWidth: 'unset',
                                                                                                    }}
                                                startIcon={<TerminalIcon />}
                                                onClick={() =>
                                                    handleOpenTerminal(hostname, entry.username, entry.password)
                                                }
                                            >
                                                Terminal
                                            </Button>
                                        </Grid>
                                    </Grid>
                                ))}
                                
                            </CardContent>
                            </Collapse>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            </>
    );
};

export default PasswordManager;
