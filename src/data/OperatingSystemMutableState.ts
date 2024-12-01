import { ApplicationSpec } from "./OperatingSystem";

export interface OSState {
    installedApps: ApplicationSpec[];
    availableApps: ApplicationSpec[]; 
    debugTools: ApplicationSpec[];
    activeInstallations: InstallationState[];
   }

   /** To allow apps to be installed non-instantly, so we can animate, show install progress bars, etc */
   interface InstallationState {
    app: ApplicationSpec;
    progress: number; // 0–100
    status: 'INSTALLING' | 'COMPLETED' | 'ERROR';
    interactionNeeded?: boolean;
    customComponent?: React.ComponentType<any>;
}
   
export class OperatingSystemMutableState
{
    private state: OSState = {
        installedApps: [],
        availableApps: [],
        debugTools: [],

        activeInstallations: [] as InstallationState[],
      };
      private subscribers = new Set<() => void>();
     
      getState(): OSState {
        return {...this.state};
      }
     
      /*************************** Things related to 'installed/installable apps' */
      updateInstalledApps(apps: ApplicationSpec[]): void {
        this.state.installedApps = [...apps];
        this.notifySubscribers();
      }
     
      updateAvailableApps(apps: ApplicationSpec[]): void {
        this.state.availableApps = [...apps];
        this.notifySubscribers();
      }
     
      updateDebugTools(tools: ApplicationSpec[]): void {
        this.state.debugTools = [...tools];
        this.notifySubscribers();
      }

      /*************************** Things related to '# unread-notification badges on app-icons' */
      updateUnreadCount(appId: number, unreadMessages: number): void {
            const updatedApps = this.state.installedApps.map(app =>
              app.id === appId ? { ...app, unreadMessages } : app
            );
           this.updateInstalledApps(updatedApps);
        }

        /*************************** Things related to 'animating and dialogs while installing an app' */
        addInstallation(app: ApplicationSpec, customComponent?: React.ComponentType<any>)
        {
          console.log(`Adding installation for app: ${app.name}`);
          const newInstallation: InstallationState = {
            app,
            progress: 0,
            status: 'INSTALLING',
            customComponent
        };
          this.state.activeInstallations.push(newInstallation);
          this.notifySubscribers();
      }
  
      updateInstallationProgress(appId: number, progress: number) {
          const installation = this.state.activeInstallations.find(i => i.app.id === appId);
          if (installation) {
              installation.progress = progress;
              if (progress >= 100) installation.status = 'COMPLETED';
              this.notifySubscribers();
          }
      }

      completeInstallation(appId: number): void {
        // Find the installation in the activeInstallations array
        const installationIndex = this.state.activeInstallations.findIndex(
            (i) => i.app.id === appId
        );

        if (installationIndex === -1) {
            console.error(`Installation with appId ${appId} not found.`);
            return;
        }

        const installation = this.state.activeInstallations[installationIndex];

        console.log(`Completing installation for appId: ${appId}`);
        
        // Remove the installation from activeInstallations
        this.state.activeInstallations.splice(installationIndex, 1);

        // Add the app to installedApps
        this.state.installedApps.push({
            ...installation.app,
            unreadMessages: 0, // Initialize unread messages to 0
        });

        // Notify all subscribers about the state change
        this.notifySubscribers();
    }
  
      removeInstallation(appId: number) {
          this.state.activeInstallations = this.state.activeInstallations.filter(i => i.app.id !== appId);
          this.notifySubscribers();
      }
  
      getActiveInstallations(): InstallationState[] {
          return [...this.state.activeInstallations];
      }

        /*************************** General redux-style implementation this class is based on */
     
      subscribe(callback: () => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
      }
     
      private notifySubscribers(): void {
        this.subscribers.forEach(callback => callback());
      }
}