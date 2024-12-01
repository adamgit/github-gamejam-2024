import { Message } from "../backgroundservices/desktopservices/service-whassup";

export interface MessageCounter {
    userId: string;
    unreadCount: number;
  }
  
  export class WhassupMessageCounter {
    private counters: Map<string, MessageCounter> = new Map();
    
    constructor() {
        // Load counters from sessionStorage if available
        const storedCounters = sessionStorage.getItem('messageCounters');
        if (storedCounters) {
            const parsedCounters: Record<string, number> = JSON.parse(storedCounters);

          this.counters = new Map(
            Object.entries(parsedCounters).map(([userId, unreadCount]) => [
              userId,
              { userId, unreadCount },
            ])
          );
        }
      }
    
      public saveCountersIfWhassupIsUnmounting(): void {
        // Save counters to sessionStorage
        const countersObject = Object.fromEntries(
          Array.from(this.counters.entries()).map(([key, value]) => [key, value.unreadCount])
        );
        sessionStorage.setItem('messageCounters', JSON.stringify(countersObject));
      }
    
    public debugCounters(): void {
      return;
        if (this.counters.size === 0)
            console.log("no counters");
        else
        this.counters.forEach((value, key) => {
            console.log(`${key}:`, value);
        });
        
    }

    public incrementForUser(userId: string): void {
      const current = this.counters.get(userId) || { userId, unreadCount: 0 };
      this.counters.set(userId, {
        ...current,
        unreadCount: current.unreadCount + 1
      });
    }
  
    public clearForUser(userId: string): void {
        //console.log(`before clearing count for user: ${userId}, state of unread counters:`);
      this.debugCounters();

      const current = this.counters.get(userId);
      if (current) {
        this.counters.set(userId, {
          ...current,
          unreadCount: 0
        });
      }

      //console.log(`after clearing count for user: ${userId}, state of unread counters:`);
      this.debugCounters();
    
    }
  
    public getTotalUnread(): number {
        var result = Array.from(this.counters.values())
        .reduce((total, counter) => total + counter.unreadCount, 0);
        //console.log(" ... calculated total unread messages now: "+result );
        return result;
    }
  
    public getUnreadForUser(userId: string): number {
      return this.counters.get(userId)?.unreadCount || 0;
    }
  
    // Add messages that arrived while component was unmounted
    public updateByAddingNewUnreadMessages(messages: Array<Message & { userId?: string }>, userIds: string[]): void {
        
        // Initialize counters for all users
        userIds.forEach(userId => {
            const existingCount = this.getUnreadForUser(userId);
            /* DEBUG: messages.map( (msg) => {
                console.log(`.. found msg from : ${msg.sender}, ID: ${msg.userId} == ${msg.content}`);
            });*/
            // Filter messages for this specific user
            const userMessages = messages.filter(msg => 
                msg.userId === userId && msg.sender === "contact"
            );
            
            console.log(`User: ${userId} has ${userMessages.length} messages in the supplied new-messages`)
            this.counters.set(userId, {
                userId,
                unreadCount: existingCount + userMessages.length
            });
        });
    }

    // New method to clear all counters
    public clearAll(): void {
        this.counters.clear();
    }
  }