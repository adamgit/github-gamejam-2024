import React, { Component } from "react";

import { OperatingSystemMutableState, OSState } from './OperatingSystemMutableState';
import { FileSystem } from './FileSystem';
import { HostResolver } from "./HostResolver";
import { WalletService } from "../backgroundservices/desktopservices/service-wallet";
import { ChatService } from "../backgroundservices/desktopservices/service-whassup";
import { PasswordsService } from '../backgroundservices/desktopservices/service-passwords'
import { AdditionalAvailableApps, DebugApps, GameStartApps } from "./operatingSystemConfigurations";
import { ReputationService } from "../backgroundservices/desktopservices/service-reputation";
import { IntrusionService } from "../backgroundservices/desktopservices/service-intrusion";
import { ServiceScanner } from '../backgroundservices/desktopservices/service-scanner';

export type ApplicationSpec =
{
  id: number;
  name: string;
  icon: string;
  iconColor?: string;
  component: any;
  singleInstance?: boolean;
  supportedMimeTypes?: string[];
  unreadMessages?: number;
  additionalProps: Record<string,any>;
  handlesEventsFrom?: {
    service: string;
    eventName: string;
  }[];
}

/**
 * Enables the Desktop to keep track of how many 'unread messages' exist for each app/icon
 */
interface MessageHandlingState {
  appId: number;
  isMounted: boolean;
  unmountedCount: number;
}

export interface VirtualFile {
  filename: string;
  mimetype: string;
  size: number;
  created: Date;
  modified: Date;
  // Reference to actual file on disk (optional)
  backingFile?: string;
  // In-memory binary data (optional)
  binaryData?: ArrayBuffer;
}

export class VirtualFolder {
  private files: Map<string, VirtualFile> = new Map();

  addFile(file: VirtualFile) {
    this.files.set(file.filename, file);
  }

  removeFile(filename: string) {
    this.files.delete(filename);
  }

  getFile(filename: string): VirtualFile | undefined {
    return this.files.get(filename);
  }

  getAllFiles(): VirtualFile[] {
    return Array.from(this.files.values());
  }

  moveFile(filename: string, newFilename: string) {
    const file = this.files.get(filename);
    if (file) {
      file.filename = newFilename;
      this.files.delete(filename);
      this.files.set(newFilename, file);
    }
  }
}

export class OperatingSystem {
  private static instance: OperatingSystem | null = null;
  private mutableState: OperatingSystemMutableState;

// Core services that are part of OS
public readonly walletService: WalletService;
public readonly repService: ReputationService;
public readonly intrusionService: IntrusionService;
public readonly scanService: ServiceScanner;
public readonly chatService: ChatService;
public readonly fileSystem: FileSystem;
public readonly passwordsService: PasswordsService;
  
// debugging / gameplay-testing
  public readonly ADMIN_MODE = false; // enables the 'debug tools' virtual-apps

  // integrate with the Desktop.tsx - which has embedded window-handling
  private createWindowCallback?: (app: ApplicationSpec) => void;

  // provide backing-store for the 'unread messages' counts for each app
  private messageHandlingState: Map<number, MessageHandlingState> = new Map();
  private serviceSubscriptions: Map<number, Array<() => void>> = new Map();

  constructor()
  {
    if (OperatingSystem.instance) {
      throw new Error('OperatingSystem can only be instantiated once');
    }
    OperatingSystem.instance = this;

    this.mutableState = new OperatingSystemMutableState();
    
    this.walletService = new WalletService();
    this.repService = new ReputationService();
    this.intrusionService = new IntrusionService();
    this.scanService = new ServiceScanner();
    this.chatService = new ChatService();
    this.fileSystem = new FileSystem();
    this.passwordsService = new PasswordsService();

    /** Initial file-system (preconfigured for the tutorial mission - TODO: make this auto-configured later) */
    console.log("** Setting an initial desktop_filesystem embedded in OS even though ideally this should be softcoded somewhere");
    this.fileSystem.addFileToFolder('/desktop/documents', {
      filename: 'wifi-password.png',
      mimetype: 'image/png',
      size: 1024000,
      created: new Date(),
      modified: new Date()
    }, 'wifi.png');
    this.fileSystem.addFileToFolder('/desktop/documents', {
      filename: 'wifi-manual.txt',
      mimetype: 'text/md',
      size: 1846,
      created: new Date(),
      modified: new Date()
    }, 'wifitech-manual-WR-series.md');

    // Initialize apps with runtime state (especially: unread-message-count as a feature)
    const initApps = (apps: ApplicationSpec[]) => 
      apps.map(app => ({ ...app, unreadMessages: 0 }));

    /** Install game-start apps */
    this.mutableState.updateInstalledApps( initApps( GameStartApps( this.fileSystem ) ) );
    if( this.ADMIN_MODE ) this.mutableState.updateDebugTools( initApps(DebugApps() ) );

    /** Mark as 'available' other apps that the game can install later */
    this.mutableState.updateAvailableApps( initApps(AdditionalAvailableApps() ) );

    /** Prep for managing unread-messages counts per-app */
    this.initializeMessageTracking();
  }

  /**
   * Register callback for window creation
   * Called by Desktop during initialization
   */
  public registerWindowCreator(callback: (app: ApplicationSpec) => void): void {
    this.createWindowCallback = callback;
  }

  /**
   * Stable implementation for react-components to use, but we can change the underlying implenmentation later.
   * @returns 
   */
  getInstalledApps(): ApplicationSpec[] {
    return this.mutableState.getState().installedApps;
  }
 
  /**
   * Stable implementation for react-components to use, but we can change the underlying implenmentation later.
   * @returns 
   */
  getAvailableApps(): ApplicationSpec[] {
    return this.mutableState.getState().availableApps;
  }
 
  /**
   * Stable implementation for react-components to use, but we can change the underlying implenmentation later.
   * @returns 
   */
  getDebugTools(): ApplicationSpec[] {
    return this.mutableState.getState().debugTools;
  }

  // Public methods delegate to stateManager
  getState(): OSState {
    return this.mutableState.getState(); // Returns immutable copy
  }

  subscribe(callback: () => void): () => void {
    return this.mutableState.subscribe(callback);
  }

  /* original
  installApp(app: ApplicationSpec): void {
    const state = this.mutableState.getState();
    this.mutableState.updateAvailableApps(
      state.availableApps.filter(a => a.id !== app.id)
    );
    this.mutableState.updateInstalledApps([
      ...state.installedApps,
      { ...app, unreadMessages: 0 }
    ]);
  }*/
    installApp(app: ApplicationSpec): void {
    const state = this.mutableState.getState();

        // Remove the app from availableApps
        this.mutableState.updateAvailableApps(
            state.availableApps.filter(a => a.id !== app.id)
        );
            // Add the app to activeInstallations
        this.mutableState.addInstallation(app);
            // Simulate progress and complete installation
        setTimeout(() => this.completeInstallation(app.id), 2000);
      }

  installAppNamed(appName: string): void {
    const state = this.mutableState.getState();
    const appToInstall = state.availableApps.find( (spec) => spec.name == appName );

    if( appToInstall )
      this.installApp(appToInstall);
    else
    console.log(`--- Couldn't install non-available app (might be already installed): ${appName}`);
  }
  // ... callback to finish the (NEW) asynchronous app-installation
  completeInstallation(appId: number): void {
    // Delegates core state changes
    this.mutableState.completeInstallation(appId);

    // Add additional logic here, if needed
    console.log(`Installation of app ${appId} completed.`);
}

  uninstallApp(appId: number): void {
    const state = this.mutableState.getState();
    const app = state.installedApps.find(a => a.id === appId);
    if (app) {
      this.mutableState.updateInstalledApps(
        state.installedApps.filter(a => a.id !== appId)
      );
      this.mutableState.updateAvailableApps([
        ...state.availableApps,
        app
      ]);
    }
  }

  /******************** debug mode ************************* */
  /**
   * Dynamically enable debug tools while the app is running.
   * Adds the debug tools to the installed apps.
   */
  public enableDebugTools(): void {
    // Fetch existing debug tools
    const currentDebugTools = this.getState().debugTools;

    // Initialize debug tools from DebugApps
    const newDebugTools = DebugApps().map(tool => ({
      ...tool,
      unreadMessages: 0, // Default value
    }));

    // Avoid re-adding tools already in the state
    const toolsToAdd = newDebugTools.filter(
      tool => !currentDebugTools.some(existingTool => existingTool.id === tool.id)
    );

    if (toolsToAdd.length > 0) {
      // Update debugTools state
      this.mutableState.updateDebugTools([...currentDebugTools, ...toolsToAdd]);
      console.log("Debug tools have been enabled.");
    } else {
      console.log("Debug tools are already enabled.");
    }
  }

  /**
   * Dynamically disable debug tools while the app is running.
   * Removes the debug tools from the installed apps.
   */
  public disableDebugTools(): void {
    // Fetch existing debug tools
    const currentDebugTools = this.getState().debugTools;

    if (currentDebugTools.length > 0) {
      // Clear debug tools
      this.mutableState.updateDebugTools([]);
      console.log("Debug tools have been disabled.");
    } else {
      console.log("No debug tools are currently enabled.");
    }
  }

  /** Manage the unread-messages counts */
  private initializeMessageTracking() {
    // Initialize handling state for all apps that handle events
    this.getState().installedApps
      .filter(app => app.handlesEventsFrom?.length > 0)
      .forEach(app => {
        this.messageHandlingState.set(app.id, {
          appId: app.id,
          isMounted: false,
          unmountedCount: 0
        });

        // Set up listeners for each service this app handles
        const cleanupFns = app.handlesEventsFrom.map(eventConfig => {
          const service = this.getServiceByName(eventConfig.service);
          if (!service || !service[eventConfig.eventName]) {
            console.error(`Service ${eventConfig.service} or event ${eventConfig.eventName} not found`);
            return () => {};
          }

          const handler = (...args: any[]) => {
            const appState = this.messageHandlingState.get(app.id);
            if (appState && !appState.isMounted) {
              appState.unmountedCount++;
              
              const state = this.getState();
              const targetApp = state.installedApps.find(a => a.id === app.id);
              if (targetApp) {
                const updatedApps = state.installedApps.map(a => 
                  a.id === app.id 
                    ? { ...a, unreadMessages: (targetApp.unreadMessages || 0) + 1 }
                    : a
                );
                this.mutableState.updateInstalledApps(updatedApps);
              }
            }
          };

          service[eventConfig.eventName].addListener(handler);
          return () => service[eventConfig.eventName].removeListener(handler);
        });

        this.serviceSubscriptions.set(app.id, cleanupFns);
      });
  }
/** Manage the unread-messages counts */
  private getServiceByName(serviceName: string): any {
    switch (serviceName) {
      case 'chatService':
        return this.chatService;
      case 'walletService':
        return this.walletService;
      // Add other services as needed
      default:
        return null;
    }
  }

  /** Manage the unread-messages counts */
  public setAppMounted(appId: number, mounted: boolean): void {
    const state = this.messageHandlingState.get(appId);
    if (state) {
      state.isMounted = mounted;
    }
  }
/** Manage the unread-messages counts */
  public getAndClearUnmountedCount(appId: number): number {
    const state = this.messageHandlingState.get(appId);
    if (state) {
      const count = state.unmountedCount;
      state.unmountedCount = 0;
      return count;
    }
    return 0;
  }
/** Manage the unread-messages counts */
  public setUnreadCount(appId: number, count: number): void {
    const state = this.getState();
    const app = state.installedApps.find(a => a.id === appId);
    if (app) {
      //console.log(`Updating unread count to ${count} for app: ${appId}`)
      this.mutableState.updateUnreadCount(appId, count);
    }
    else
    console.error(`Can't update unread count for unknown appId: ${appId}`)
  }

  /**
   * Returns a list of installed applications that can handle the given mimetype
   */
  public getApplicationsForMimeType(mimetype: string): ApplicationSpec[] {
    return this.getState().installedApps.filter(app => 
      app.supportedMimeTypes?.includes(mimetype)
    );
  }

  /**
   * Opens a file with the appropriate application
   * Returns true if successful, false if no suitable application found
   */
  public openFile(file: VirtualFile): boolean {
    const apps = this.getApplicationsForMimeType(file.mimetype);
    if (apps.length > 0 && this.createWindowCallback) {
      const appWithFile = {
        ...apps[0],
        additionalProps: {
          ...apps[0].additionalProps,
          fileToOpen: file
        }
      };
      
      this.createWindowCallback(appWithFile);
      return true;
    }
    return false;
  }

  /**
   * Opens a Terminal programmatically = allows other apps to open Terminals and auto-login
   */
  public openTerminal(hostname: string, username?: string, password?: string | null | undefined) : boolean
  {
    const TerminalApp = this.getState().installedApps.find(app => 
      app.name === 'Terminal'
    ) || null;

    if( TerminalApp && this.createWindowCallback) {
      const appWithLoginDetails = {
        ...TerminalApp,
        additionalProps: {
          ...TerminalApp.additionalProps,
          autoConnectHostname: hostname,
          autoConnectUsername: username,
          autoConnectPassword: password,
        }
      };
      
      this.createWindowCallback(appWithLoginDetails);
      return true;
    }
    return false;
  }
}