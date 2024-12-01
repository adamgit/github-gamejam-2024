import React, { useEffect, useState } from 'react';
import TimelineManager from '../data/timelineManager'; // Assuming the timelineManager is exported from this path
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';


const TimelineDebugger = () => {
    const [timelines, setTimelines] = useState([]);
  
    // Function to update the timelines from the TimelineManager
    const updateTimelines = () => {
        
      const timelineData = Object.entries(TimelineManager.timelines).map(([id, timeline]) => {
        const currentEvent = timeline.events[timeline.currentIndex] || null;
        const isRunning = timeline.currentIndex < timeline.events.length;
        const nextKeyframe = currentEvent ? currentEvent.keyframe : null;
  
        let remainingTime = null;
        if (typeof nextKeyframe === 'number' && currentEvent.expectedEndTime) {
          const now = Date.now();
          remainingTime = Math.max(0, currentEvent.expectedEndTime - now); // Calculate remaining time in ms
        }

        return {
          id,
          isRunning,
          nextKeyframe,
          remainingTime: remainingTime ? Math.floor(remainingTime / 1000) : null, // Convert ms to seconds
        };
      });
      setTimelines(timelineData);
    };
  
    // Use useEffect to update timelines every second
    useEffect(() => {
      const interval = setInterval(updateTimelines, 1000);
      return () => clearInterval(interval);
    }, []);
  
    return (
        <div style={{ padding: '10px', backgroundColor: 'white', height: '100%' }}>
          <Table size="small" style={{ borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow>
                <TableCell style={{ borderBottom: '1px solid #ccc', padding: '5px' }}>
                  <Typography variant="h6">Timeline ID</Typography>
                </TableCell>
                <TableCell style={{ borderBottom: '1px solid #ccc', padding: '5px' }}>
                  <Typography variant="h6">Status</Typography>
                </TableCell>
                <TableCell style={{ borderBottom: '1px solid #ccc', padding: '5px' }}>
                  <Typography variant="h6">Next Keyframe</Typography>
                </TableCell>
                <TableCell style={{ borderBottom: '1px solid #ccc', padding: '5px' }}>
                  <Typography variant="h6">Time Remaining (s)</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {timelines.map((timeline) => (
                <TableRow key={timeline.id}>
                  <TableCell
                    style={{
                      borderBottom: '1px solid #eee',
                      padding: '5px',
                      color: timeline.isRunning ? 'inherit' : 'grey'
                    }}
                  >
                    <Typography variant="body2">
                      {timeline.id}
                    </Typography>
                  </TableCell>
                  <TableCell
                    style={{
                      borderBottom: '1px solid #eee',
                      padding: '5px',
                      color: timeline.isRunning ? 'inherit' : 'grey'
                    }}
                  >
                    <Typography variant="body2">
                      {timeline.isRunning ? 'Running' : 'Ended'}
                    </Typography>
                  </TableCell>
                  <TableCell
                    style={{
                      borderBottom: '1px solid #eee',
                      padding: '5px',
                      color: timeline.isRunning ? 'inherit' : 'grey'
                    }}
                  >
                    <Typography variant="body2">
                      {timeline.nextKeyframe ? timeline.nextKeyframe.toString() : 'None'}
                    </Typography>
                  </TableCell>
                  <TableCell
                    style={{
                      borderBottom: '1px solid #eee',
                      padding: '5px',
                      color: timeline.isRunning ? 'inherit' : 'grey'
                    }}
                  >
                    <Typography variant="body2">
                      {timeline.remainingTime !== null ? timeline.remainingTime : 'N/A'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    };
  
  export default TimelineDebugger;
  