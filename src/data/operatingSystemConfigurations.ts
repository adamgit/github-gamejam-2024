import AppInstaller from "../components/AppInstaller";
import ByteWallet from "../components/ByteWallet";
import MissionEventDebugger from "../components/MissionEventDebugger";
import MissionsDebugger from "../components/MissionsDebugger";
import Terminal from "../components/Terminal";
import Whassup from "../components/Whassup";
import ImageViewer from "../components/ImageViewer";
import MarkdownViewer from "../components/MarkdownViewer";
import PasswordManager from '../components/PasswordManager';
import GameSupportHub from '../components/GameSupportHub';
import ReputationCard from '../components/ReputationCard';
import NICIntrusionMonitor from '../components/NICIntrusionMonitor';
import { HostResolver } from "./HostResolver";
import { ApplicationSpec, OperatingSystem, VirtualFolder } from "./OperatingSystem";
import { FileSystem } from "./FileSystem";
import FolderViewer from "../components/FolderViewer";

import {DataViewer} from '../servergensystem/DataViewer';
import NetworkMonitor from "../components/NetworkMonitor";

export function DebugApps() : ApplicationSpec[]
{
    return [{
        id: 4,
        name: 'Missions',
        icon: '🚀', // Placeholder icon
        component: MissionsDebugger,
        additionalProps: {
          initialSize: {w:600, h:200}
        },
      },
      {
        id: 3,
        name: 'Timelines',
        icon: '🕜', // Placeholder icon
        //component: TimelineDebugger,
        component: MissionEventDebugger,
        additionalProps: {
          initialSize: {w:800, h:250}
        },
      },
      {
        id: 6, // Make sure this doesn't conflict
        name: 'App Installer',
        icon: '📦',
        component: AppInstaller,
        singleInstance: true,
        additionalProps: {
          initialSize: { w: 400, h: 500 }
        }
      },
        {
          id: 100, // Make sure this doesn't conflict
          name: 'DataViewer',
          icon: '📦',
          component: DataViewer,
          singleInstance: true,
          additionalProps: {},
        },
        
      ];
}

export function GameStartApps( desktopFileSystem : FileSystem ) : ApplicationSpec[]
{
    return [
      {
        id: 8,
        name: 'Documents',
        icon: '📁',
        component: FolderViewer,
        singleInstance: true,
        additionalProps: {
          folder: desktopFileSystem.getFolder('/desktop/documents')
        }
      },
      
        {
          id: 2,
          name: 'Whassup',
          icon: '💬', // Placeholder icon
          singleInstance: true, // Ensure only one instance can be opened
          component: Whassup,
          additionalProps: {},
          handlesEventsFrom: [{
            service: 'chatService',
            eventName: 'onMessageReceivedFrom'
          }],
        },
        {
          id: 1,
          name: 'Terminal',
          icon: '🖥️', // Placeholder for the terminal icon
          //iconFilename: '/assets/terminal-icon.png',
          component: Terminal,
          additionalProps: {
            initialHostConnection: HostResolver.getInstance().resolve('localhost'),
            initialCommand: "ls -al",
            terminalMode: "dark",
          },
        },
        {
          id: 7,
          name: 'Image Viewer',
          icon: '🖼️',
          component: ImageViewer,
          supportedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
          singleInstance: false,
          additionalProps: {}
        },
        {
          id: 10,
          name: 'Text Viewer',
          icon: '📄',
          component: MarkdownViewer,
          supportedMimeTypes: ['text/txt', 'text/md'],
          singleInstance: false,
          additionalProps: {}
        },
        {
          id: 11,
          name: 'Support',
          icon: '❓',
          component: GameSupportHub,
          singleInstance: true,
          additionalProps: {}
        },

        /* UNUSED NOW
        {
          id: 11,
          name: 'Photos',
          icon: '📸',
          component: FolderViewer,
          singleInstance: true,
          additionalProps: {
            folder: desktopFileSystem.getFolder('/desktop/photos')
          }
        },
        */
        // Other INSTALLED ON STARTUP application here:
      ];
}

export function AdditionalAvailableApps() : ApplicationSpec[]
{
    return [
    {
      id: 5,
      name: 'ByteWallet',
      icon: '₿',
      iconColor: 'gold',
      component: ByteWallet,
      singleInstance: true,
      additionalProps: {
        initialSize: { w: 300, h: 200 },
        position: { x: 10, y: 10 }
      }
    },
    {
      id: 9,
      name: 'Secrets',
      icon: '🔐',
      component: PasswordManager,
      singleInstance: true,
      additionalProps: {
        initialSize: { w: 300, h: 200 },
        position: { x: 10, y: 10 }
      }
    },
    {
      id: 12,
      name: 'Rep',
      icon: '🕶️',
      component: ReputationCard,
      additionalProps: {},
    },
    {
      id: 13,
      name: 'HackerMon',
      icon: '888',
      component: NICIntrusionMonitor,
      additionalProps: {},
    },
    {
      id: 101, // Make sure this doesn't conflict
      name: 'Scan',
      icon: '📦',
      component: NetworkMonitor,
      singleInstance: true,
      additionalProps: {},
    },
    ];
}