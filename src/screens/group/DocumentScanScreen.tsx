import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import type { HomeStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<HomeStackParamList, 'DocumentScan'>;
type RouteP = RouteProp<HomeStackParamList, 'DocumentScan'>;

export function DocumentScanScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const { groupId } = route.params;

  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Kamera için izin vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      navigation.replace('OCRConfirm', {
        imagePath: result.assets[0].uri,
        groupId,
      });
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      navigation.replace('OCRConfirm', {
        imagePath: result.assets[0].uri,
        groupId,
      });
    }
  };

  const handleDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        Alert.alert('PDF Tarama', 'PDF tarama özelliği yakında eklenecek.');
      }
    } catch {
      Alert.alert('Hata', 'Belge seçilemedi.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.illustration}>
          <Feather name="file-text" size={52} color={colors.primary[500]} />
        </View>

        <Text style={styles.title}>Belge Tara</Text>
        <Text style={styles.subtitle}>
          Fatura veya makbuzu tarayarak harcama bilgilerini otomatik doldur.
          Görüntüler cihazınızı terk etmez.
        </Text>

        <View style={styles.options}>
          <TouchableOpacity style={styles.optionCard} onPress={handleCamera}>
            <View style={styles.optionIcon}>
              <Feather name="camera" size={28} color={colors.primary[500]} />
            </View>
            <Text style={styles.optionTitle}>Kamera</Text>
            <Text style={styles.optionDesc}>Faturayı fotoğrafla</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleGallery}>
            <View style={styles.optionIcon}>
              <Feather name="image" size={28} color={colors.primary[500]} />
            </View>
            <Text style={styles.optionTitle}>Galeri</Text>
            <Text style={styles.optionDesc}>Foto seç</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleDocument}>
            <View style={styles.optionIcon}>
              <Feather name="file" size={28} color={colors.neutral[400]} />
            </View>
            <Text style={styles.optionTitle}>PDF</Text>
            <Text style={styles.optionDesc}>Yakında</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>Belge olmadan devam et</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: {
    flex: 1, padding: spacing[6],
    alignItems: 'center', justifyContent: 'center',
  },
  illustration: {
    width: 96, height: 96, borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[5],
  },
  title: {
    fontSize: fontSize.xl, fontWeight: fontWeight.bold,
    color: colors.neutral[900], marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: fontSize.base, color: colors.neutral[500],
    textAlign: 'center', lineHeight: 22,
    marginBottom: spacing[8],
  },
  options: {
    flexDirection: 'row', gap: spacing[3],
    width: '100%', marginBottom: spacing[6],
  },
  optionCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing[4], borderWidth: 1, borderColor: colors.neutral[200],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  optionIcon: {
    width: 56, height: 56, borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[2],
  },
  optionTitle: {
    fontSize: fontSize.md, fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  optionDesc: { fontSize: fontSize.xs, color: colors.neutral[500], marginTop: 2 },

  skipBtn: { padding: spacing[3] },
  skipText: {
    fontSize: fontSize.md, color: colors.neutral[400],
    textDecorationLine: 'underline',
  },
});
