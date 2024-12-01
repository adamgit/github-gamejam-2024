import React, { useContext, useEffect, useState } from 'react';
import { useOS, useOSState } from '../hooks/useOperatingSystem';
import { WalletService, Transaction } from '../backgroundservices/desktopservices/service-wallet';
import { Card, CardContent, Typography, Box, Divider, List, ListItem, ListItemText } from '@mui/material';
import { TrendingUp, TrendingDown } from 'lucide-react';

const formatAmount = (amount: number) => amount.toLocaleString('en-US', { 
  minimumFractionDigits: 2,
  maximumFractionDigits: 2 
});

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function ByteWallet() {
  const os = useOS();
  const state = useOSState();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pulseBalance, setPulseBalance] = useState(false);

  useEffect(() => {
    const walletService = os.walletService;
    
    // Initial state
    setBalance(walletService.getBalance());
    setTransactions(walletService.getRecentTransactions(3));

    // Subscribe to updates
    const handleBalanceChange = (newBalance: number) => {
      setBalance(newBalance);
      setPulseBalance(true);
      setTimeout(() => setPulseBalance(false), 1000);
    };

    const handleNewTransaction = (transaction: Transaction) => {
      setTransactions(prev => [...prev.slice(-2), transaction]);
    };

    walletService.onBalanceChanged.addListener(handleBalanceChange);
    walletService.onTransactionAdded.addListener(handleNewTransaction);

    return () => {
      walletService.onBalanceChanged.removeListener(handleBalanceChange);
      walletService.onTransactionAdded.removeListener(handleNewTransaction);
    };
  }, [os]);

  return (
    <Card className="w-full h-full byte-wallet-window">
      <CardContent className="h-full flex flex-col">
        <Box className="flex items-center justify-between mb-4">
          <Typography variant="h6" className="text-blue-400">
            ByteWallet
          </Typography>
          <Box className={`transition-all duration-500 ${pulseBalance ? 'scale-110' : 'scale-100'}`}>
          <Typography variant="h4" className={`font-mono text-green-400 wallet-text ${pulseBalance ? 'balance-pulse' : ''}`}>
              ₿ {formatAmount(balance)}
            </Typography>
          </Box>
        </Box>
        
        <Divider className="bg-gray-700 mb-2" />
        
        <List className="flex-grow overflow-auto transaction-list">
          {transactions.map((tx, index) => (
            <ListItem key={tx.timestamp + index} className={`py-1 transaction-item ${index === transactions.length - 1 ? 'new-transaction' : ''}`}>
              <Box className="mr-2 transaction-icon">
                {tx.type === 'credit' ? (
                  <TrendingUp className="text-green-500" size={16} />
                ) : (
                  <TrendingDown className="text-red-500" size={16} />
                )}
              </Box>
              <ListItemText
                primary={
                  <Box className="flex justify-between">
                    <Typography variant="body2" className="text-gray-300">
                      {tx.description}
                    </Typography>
                    <Typography variant="body2" className={tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}>
                      {tx.type === 'credit' ? '+' : '-'}₿ {formatAmount(tx.amount)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography variant="caption" className="text-gray-500">
                    {formatTimestamp(tx.timestamp)}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}