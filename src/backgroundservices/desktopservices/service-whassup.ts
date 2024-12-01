import { SubscribableEvent } from '../subscribable-event';

export interface Message {
  timestamp: number;
  content: string;
  sender: "self" | "contact";
}

interface Messages {
  [userId: string]: Message[];
}

export class User {
  id: string;

  avatar: string;
  tags: string[]; /** Used internally by missions to randomly choose 'any friend' etc */
  online: boolean;
  
  firstname: string;
  surname: string;

  /** Typescript is surprisingly more verbose than classic system languages, for no reason other than 'not as complete' */
  constructor(public data:{id:string,avatar:string,online:boolean,first:string,last:string, tags?: string[]})
  {
    this.id = data.id;
    this.avatar = data.avatar;
    this.online = data.online;
    this.firstname = data.first;
    this.surname = data.last;
    this.tags = data.tags || [];
  }

  fullname() : string { return this.firstname +" "+ this.surname;}

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }
}

export class ChatService {
  private messages: Messages = {};
  private users: Map<string, User> = new Map();

  constructor()
  {
    this.onMessageSentTo = new SubscribableEvent("onMessageSentTo");
    this.onMessageReceivedFrom = new SubscribableEvent("onMessageReceivedFrom");
    this.onContactAdded = new SubscribableEvent('onContactAdded');

    // Initialize with default contacts
    this.addContact(new User({
      id: 'players.sister',
      first: 'Alice',
      last: 'Archer',
      avatar: '/assets/alice.png',
      online: false,
      tags: ['family', 'friend']
    }));

    this.addContact(new User({
      id: 'friends.bob',
      first: 'Bob',
      last: 'Butcher',
      avatar: '/assets/bob.png',
      online: false,
      tags: ['friend']
    }));

    this.addContact(new User({
      id: 'friends.charlie',
      first: 'Charlie',
      last: 'Caterham',
      avatar: '/assets/charlie.png',
      online: false,
      tags: ['friend']
    }));
  }

  public onMessageSentTo: SubscribableEvent<[string, Message]>;
  public onMessageReceivedFrom: SubscribableEvent<[string, Message]>;
  public onContactAdded: SubscribableEvent<[User]>;

  public addContact(user: User): void {
    if (!this.users.has(user.id)) {
      this.users.set(user.id, user);
      this.onContactAdded?.invoke(user);
    }
  }
  
  public getAvailableNPCs(): User[] {
    return Array.from(this.users.values());
  }

  public findContactsByTag(tag: string): User[] {
    return Array.from(this.users.values()).filter(user => user.hasTag(tag));
  }

  public infoForUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  public addMessageFrom(userId: string, text: string): void {
    const timestamp = Date.now();
    if (!this.messages[userId]) {
      this.messages[userId] = [];
    }
    const newMessage = { timestamp, content: text, sender: "contact" as const };

    //console.log(`DEBUG: [will send message] .. from userID: ${userId}, message: ${text}`)
    this.messages[userId].push(newMessage);
    this.onMessageReceivedFrom.invoke(userId, newMessage);
  }

  public addMessageTo(userId: string, text: string): void {
    const timestamp = Date.now();
    if (!this.messages[userId]) {
      this.messages[userId] = [];
    }
    const newMessage = { timestamp, content: text, sender: "self" as const };
    this.messages[userId].push(newMessage);
    console.log(`DEBUG: [will send message] .. to userID: ${userId}, message: ${text}`)
    this.onMessageSentTo.invoke(userId, newMessage);
  }

  public fetchMessagesSince(userId: string, lastCheckedTime: number): Message[] {
    //console.log("fetching messages for userId: "+userId);
    //console.log(` ... found: ${this.messages[userId]?.length} messages; found ${this.messages[userId]?.filter(msg => msg.timestamp > lastCheckedTime)?.length} that match timestamp filter: timestamp > ${lastCheckedTime}`);

    if( this.messages[userId] && ! this.messages[userId]?.filter(msg => msg.timestamp > lastCheckedTime) )
    {
      console.log("None found matching timestamp; will output all their timestamps...")
      this.messages[userId].map( (m) =>
      {
        console.log( `${m.timestamp} = timestamp, ${m.content}`)
      })
    }
    if (!this.messages[userId]) return [];
    return this.messages[userId].filter(msg => msg.timestamp > lastCheckedTime);
  }

  public countMessagesSince(userId: string, lastCheckedTime: number): number {
    if (!this.messages[userId]) return 0;
    return this.messages[userId].filter(msg => msg.timestamp > lastCheckedTime).length;
  }

  public countAllMessagesSince(lastCheckedTime: number): number {
    return Object.values(this.messages).reduce((count, userMessages) => {
      return count + userMessages.filter(msg => msg.timestamp > lastCheckedTime).length;
    }, 0);
  }
}