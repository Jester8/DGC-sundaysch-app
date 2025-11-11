import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface NavigationContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (mode: boolean) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  isLoading: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState('Home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
        if (onboardingCompleted === 'true') {
          setHasCompletedOnboarding(true);
          router.replace('/Home/home');
        } else {
          setHasCompletedOnboarding(false);
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setHasCompletedOnboarding(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [router]);

  const handleSetOnboardingCompleted = async (completed: boolean) => {
    try {
      if (completed) {
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        router.replace('/Home/home');
      } else {
        await AsyncStorage.removeItem('onboardingCompleted');
        router.replace('/onboarding');
      }
      setHasCompletedOnboarding(completed);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isDarkMode,
        setIsDarkMode,
        hasCompletedOnboarding,
        setHasCompletedOnboarding: handleSetOnboardingCompleted,
        isLoading,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}