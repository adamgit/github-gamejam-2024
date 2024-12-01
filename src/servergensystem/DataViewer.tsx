import React, { useState, useRef } from "react";
import {
    Button,
    Box,
    Typography,
    Paper,
    Stack,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ScenarioServer } from "./ScenarioServer";
import { ServerConfigGenerator } from "./ServerConfigGenerator";
import {
    FirstInitialLastNameUsernameGenerator,
    InitialsAndRandomNumberUsernameGenerator,
} from "./UsernameGenerator";
import { FileContentsGenerator } from "./FileContentsGenerator";
import { AccessLogsFileModule } from "./FileModules/AccessLogsFileModule";
import { AuditReportFileModule } from "./FileModules/AuditReportFileModule";
import { SystemConfigFileModule } from "./FileModules/SystemConfigFileModule";
import { AppCredentialsFileModule } from './FileModules/AppCredentialsFileModule';

export const DataViewer: React.FC = () => {
    const [servers, setServers] = useState<ScenarioServer[]>([]);
    const serverGeneratorRef = useRef<ServerConfigGenerator | null>(null);

    // Function to initialize data
    const initializeData = () => {
        const fileContentsGenerator = new FileContentsGenerator([
            new AppCredentialsFileModule(1,3),
            new AccessLogsFileModule(5,15,0.2),
            new AuditReportFileModule(),
            //new SystemConfigFileModule(),
        ]);
        const usernameGenerator = new FirstInitialLastNameUsernameGenerator();// InitialsAndRandomNumberUsernameGenerator();

        const serverGenerator = new ServerConfigGenerator(fileContentsGenerator, usernameGenerator);
        serverGeneratorRef.current = serverGenerator;

        const initialServers = serverGenerator.initialize(5, () => Math.ceil(Math.random() * 3));
        setServers(initialServers);
    };

    // Function to add a new server
    const addNewServer = () => {
        if (!serverGeneratorRef.current) {
            alert("Please initialize the data first!");
            return;
        }

        const newServer = serverGeneratorRef.current.generateNewServer();
        setServers((prev) => [...prev, newServer]);
    };

    return (
        <Box p={2}>
            <Stack direction="row" spacing={2} mb={2}>
                <Button variant="contained" onClick={initializeData}>
                    Initialize Servers
                </Button>
                <Button variant="contained" onClick={addNewServer}>
                    Add New Server
                </Button>
            </Stack>
            <Box>
                {servers.length === 0 ? (
                    <Typography variant="body1" color="textSecondary">
                        No servers available. Click "Initialize Servers" to begin.
                    </Typography>
                ) : (
                    servers.map((server, index) => (
                        <Paper key={index} elevation={2} sx={{ mb: 2, p: 1 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                {server.name}
                            </Typography>
                            <Box sx={{ mb: 0 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Username</TableCell>
                                            <TableCell>Password</TableCell>
                                            <TableCell>Strategy</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {server.accounts.map((account, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{account.username}</TableCell>
                                                <TableCell>{account.password}</TableCell>
                                                <TableCell>{account.strategy}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                            <Box>
                                {server.files.map((file, idx) => (
                                    <Accordion
                                        key={idx}
                                        defaultExpanded
                                        sx={{
                                            boxShadow: "none",
                                            "&:before": { display: "none" },
                                            backgroundColor: "transparent",
                                            marginBottom: 1, // Reduce spacing between accordions
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            sx={{
                                                backgroundColor: "#f5f5f5",
                                                paddingY: 0.5, // Reduce vertical padding
                                                paddingX: 1,   // Slight horizontal padding for readability
                                                borderRadius: "4px",
                                                minHeight: "unset", // Prevent default large header height
                                                "&.Mui-expanded": {
      minHeight: "unset", // Ensure expanded state doesn't override height
    },
    "& .MuiAccordionSummary-content": {
      margin: 0, // Remove extra margin around content
      "&.Mui-expanded": {
        margin: 0, // Ensure no extra margin when expanded
      },
    },
                                            }}
                                        >
                                            <Typography variant="body2" fontWeight="bold">
                                                {file.name}
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ p: 0 }}>
                                            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "0.5rem" }}>
                                                {file.content}
                                            </pre>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Box>
                        </Paper>
                    ))
                )}
            </Box>
        </Box>
    );
};
