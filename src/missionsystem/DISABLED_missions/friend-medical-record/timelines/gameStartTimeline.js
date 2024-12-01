import TimelineManager from "../../../data/timelineManager.js";
import { addMessageFrom } from "../../../backgroundservices/service-whassup";

const gameStartTimeline = [
    {
        keyframe: 0, // Start of the game
        action: () => {
            console.log("Game started");
            TimelineManager.notifyThreads('GAME_START'); // Notify that the game has started
            addMessageFrom(1,'Yo.');
        },
    },
    {
        keyframe: 10000, // 10 seconds after game start
        action: () => {
            addMessageFrom(1,'Hey, can you help me?');
            console.log("(after 10 secs): System: 'Make sure to act quickly.'");
        },
    },
];

export default gameStartTimeline;
//was: TimelineManager.registerTimeline("gameStart", gameStartTimeline);
