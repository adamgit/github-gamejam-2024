 export interface Transaction {
       id: string;
       timestamp: number;
       amount: number;
       type: 'credit' | 'debit';
       description: string;
       confirmations: number;
       status: 'pending' | 'completed' | 'failed';
       metadata?: Record<string, any>;
     }
    
     export interface WalletState {
       balance: number;
       address: string;
       transactions: Transaction[];
       lastUpdated: number;
     }