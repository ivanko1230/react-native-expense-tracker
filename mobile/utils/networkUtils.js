import NetInfo from '@react-native-community/netinfo';

// Check if device is online
export const isOnline = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
};

// Subscribe to network state changes
export const subscribeToNetworkStatus = (callback) => {
  return NetInfo.addEventListener((state) => {
    callback(state.isConnected && state.isInternetReachable);
  });
};
