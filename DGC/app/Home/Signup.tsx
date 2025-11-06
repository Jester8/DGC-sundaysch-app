'react-native';import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import BottomTabNavigation from "./BottomTabNavigation";
import { useNavigation } from "./_navigationContext";

type SignupNavigationProp = NativeStackNavigationProp<any>;

const lightColors = {
  background: '#fff',
  text: '#000',
  subtitle: '#666',
  placeholder: '#bbb',
  input: '#ffffffff',
  border: '#000000ff',
  button: '#8b209ef1',
  divider: '#ddd',
  socialBg: '#1a1a1a',
  link: '#9c27b0',
  error: '#dc3545',
};

const darkColors = {
  background: '#000000',
  text: '#fff',
  subtitle: '#aaa',
  placeholder: '#666',
  input: '#1a1a1a',
  border: '#333',
  button: '#a855f7',
  divider: '#333',
  socialBg: '#333',
  link: '#c084fc',
  error: '#ff6b6b',
};

export default function Signup(): React.ReactElement {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const { isDarkMode, setIsDarkMode } = useNavigation() as { isDarkMode: boolean; setIsDarkMode: (mode: boolean) => void };
  const navigation = useNavigation() as SignupNavigationProp;
  const colors = isDarkMode ? darkColors : lightColors;

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      console.log('Sign up with:', { fullName, email, password });
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigation?.navigate('SignIn');
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = (provider: string) => {
    console.log(`Sign up with ${provider}`);
    setLoading(true);
    try {
      setTimeout(() => {
        navigation?.navigate('Home');
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error(`Sign up with ${provider} error:`, error);
      setLoading(false);
    }
  };

  const handleSignInPress = () => {
    navigation?.navigate('SignIn');
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: 100,
    },
    bannerContainer: {
      width: '100%',
      height: isMobile ? 120 : isTablet ? 180 : 240,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    signUpTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
      fontFamily: 'Poppins_700Bold',
    },
    signUpSubtitle: {
      fontSize: 12,
      color: colors.subtitle,
      marginBottom: 16,
      fontFamily: 'Poppins_400Regular',
    },
    inputContainer: {
      marginBottom: 12,
    },
    textInput: {
      borderWidth: 0.6,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.input,
      fontFamily: 'Poppins_400Regular',
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
      fontWeight: '500',
      fontFamily: 'Poppins_500Medium',
    },
    signUpButton: {
      backgroundColor: colors.button,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 16,
      minHeight: 48,
    },
    signUpButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Poppins_600SemiBold',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.divider,
    },
    dividerText: {
      marginHorizontal: 12,
      color: colors.subtitle,
      fontSize: 13,
      fontWeight: '500',
      fontFamily: 'Poppins_500Medium',
    },
    socialContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginBottom: 16,
    },
    socialButton: {
      width: 50,
      height: 50,
      borderRadius: 12,
      backgroundColor: colors.socialBg,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    socialIcon: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
    },
    signInContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
      paddingBottom: 20,
    },
    signInText: {
      fontSize: 14,
      color: colors.subtitle,
      fontFamily: 'Poppins_400Regular',
    },
    signInLink: {
      fontSize: 14,
      color: colors.link,
      fontWeight: '600',
      fontFamily: 'Poppins_600SemiBold',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.bannerContainer}>
          <Image
            source={require('../../assets/images/sign.png')}
            style={styles.bannerImage}
          />
        </View>

        <Text style={styles.signUpTitle}>Sign Up</Text>
        <Text style={styles.signUpSubtitle}>Create your account</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Full Name"
            placeholderTextColor={colors.placeholder}
            value={fullName}
            onChangeText={setFullName}
            editable={!loading}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Email"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Confirm Password"
            placeholderTextColor={colors.placeholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        </View>

        <TouchableOpacity
          style={styles.signUpButton}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialSignUp('Google')}
            disabled={loading}
          >
            <Image
              source={require('../../assets/images/Google.png')}
              style={styles.socialIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialSignUp('Apple')}
            disabled={loading}
          >
            <Image
              source={require('../../assets/images/apple.png')}
              style={styles.socialIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialSignUp('X')}
            disabled={loading}
          >
            <Image
              source={require('../../assets/images/x.png')}
              style={styles.socialIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Have account?</Text>
          <TouchableOpacity disabled={loading} onPress={handleSignInPress}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomTabNavigation />
    </SafeAreaView>
  );
}