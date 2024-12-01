const friendTimeline = [
    {
        keyframe: "waitFor('GAME_START')", // Wait for the game to start
        action: () => {
            console.log("Friend: 'Hey, can you help me out?'");
        },
    },
    {
        keyframe: "waitFor('RECORD_EDITED_OK')", // Wait for the player to edit the record successfully
        action: () => {
            console.log("(after RECORD_EDITED_OK) Friend: 'Thanks, I really appreciate it!'");
        },
    },
    {
        keyframe: 300000, // 5 minutes delay (300,000 ms)
        action: () => {
            console.log("(after 30 secs): Friend: 'Have you finished it yet? We're running out of time!'");
        },
    },
    {
        keyframe: "waitFor('MISSION_COMPLETE')", // Mission complete
        action: () => {
            console.log("Friend: 'You did it! Great work.'");
        },
    },
];

export default friendTimeline;