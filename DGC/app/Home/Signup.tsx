import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomTabNavigation from "./BottomTabNavigation";
import { useNavigation } from "./_navigationContext";

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
  modalBg: '#fff',
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
  modalBg: '#111',
};

export default function Signup(): React.ReactElement {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { isDarkMode } = useNavigation() as {
    isDarkMode: boolean;
  };

  const colors = isDarkMode ? darkColors : lightColors;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);

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

  const handleSignUp = () => {
    if (!validateForm()) return;

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setShowModal(true);
    }, 800);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      paddingHorizontal: 16,
      paddingBottom: 120,
    },
    bannerContainer: {
      width: '100%',
      height: isMobile ? 120 : 200,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: colors.subtitle,
      marginBottom: 20,
    },
    inputContainer: {
      marginBottom: 12,
    },
    input: {
      borderWidth: 0.6,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.input,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
    },
    button: {
      backgroundColor: colors.button,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginVertical: 16,
      minHeight: 48,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },

    /* Modal styles */
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.modalBg,
      borderRadius: 16,
      padding: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalMessage: {
      fontSize: 14,
      color: colors.subtitle,
      textAlign: 'center',
      marginBottom: 20,
    },
    modalButton: {
      backgroundColor: colors.button,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.bannerContainer}>
          <Image source={require('../../assets/images/sign.png')} style={styles.bannerImage} />
        </View>

        <Text style={styles.title}>Register</Text>
        <Text style={styles.subtitle}>
          Your details will be saved in the church’s database
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={colors.placeholder}
            value={fullName}
            onChangeText={setFullName}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={colors.placeholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Details Saved</Text>
            <Text style={styles.modalMessage}>
              Your details have been saved in the church’s database.
            </Text>

            <Pressable style={styles.modalButton} onPress={handleModalClose}>
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <BottomTabNavigation />
    </SafeAreaView>
  );
}
