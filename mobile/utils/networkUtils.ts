import NetInfo from '@react-native-community/netinfo';

// Check if device is online
export const isOnline = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected !== null && state.isConnected && state.isInternetReachable !== null && state.isInternetReachable;
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
};

// Subscribe to network state changes
export const subscribeToNetworkStatus = (callback: (isOnline: boolean) => void) => {
  return NetInfo.addEventListener((state) => {
    callback(state.isConnected !== null && state.isConnected && state.isInternetReachable !== null && state.isInternetReachable);
  });
};
