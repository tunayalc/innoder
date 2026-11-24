import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Image,
  ImageStyle,
  StatusBar,
  Alert,
  AppState,
  Linking,
} from 'react-native';
import {
  useIsFocused,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles, type AppColors } from '../../theme';
import { RootStackParamList, RootStackNavigationProp } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type BelgeCameraRouteProp = RouteProp<RootStackParamList, 'BelgeCamera'>;

export const BelgeCameraScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<BelgeCameraRouteProp>();
  const insets = useSafeAreaInsets();

  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(
    AppState.currentState === 'active',
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state =>
      setForeground(state === 'active'),
    );
    return () => subscription.remove();
  }, []);

  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  useEffect(() => {
    if (focused&&foreground&&!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission,focused,foreground]);

  const takePhoto = useCallback(async () => {
    if (isTakingPhoto || !cameraRef.current) return;

    try {
      setIsTakingPhoto(true);
      const photo = await cameraRef.current.takePhoto({
        flash: flashMode,
      });
      setCapturedPhoto(`file://${photo.path}`);
    } catch {
      Alert.alert('Hata', 'Fotoğraf çekilemedi. Tekrar deneyin.');
    } finally {
      setIsTakingPhoto(false);
    }
  }, [isTakingPhoto, flashMode]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
  }, []);

  const confirmPhoto = useCallback(() => {
    if (!capturedPhoto) return;
    navigation.popTo('AdayBelge', {
      applicationId: route.params.applicationId,
      capturedPhotoUri: capturedPhoto,
    });
  }, [capturedPhoto, navigation, route.params.applicationId]);

  const toggleFlash = useCallback(() => {
    setFlashMode(prev => (prev === 'off' ? 'on' : 'off'));
  }, []);

  if (!hasPermission) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.permissionText}>
          Kamera izni gerekli. Lütfen ayarlardan kamera erişimini açın.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.permissionButtonText}>Ayarları Aç</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.permissionText}>
          Kamera bulunamadı. Bu cihazda kamera mevcut değil.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Image source={{ uri: capturedPhoto }} style={styles.preview} />

        <View
          style={[
            styles.previewControls,
            { paddingBottom: insets.bottom + 20 },
          ]}
        >
          <TouchableOpacity style={styles.previewBtn} onPress={retakePhoto}>
            <Text style={styles.previewBtnText}>Tekrar Çek</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.previewBtn, styles.previewBtnConfirm]}
            onPress={confirmPhoto}
          >
            <Text style={[styles.previewBtnText, styles.previewBtnConfirmText]}>
              Kullan
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={22} color="#fff"/>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={focused && foreground && !capturedPhoto}
        photo={true}
        enableZoomGesture
        torch={flashMode}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.topBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={22} color="#fff"/>
        </TouchableOpacity>

        <Text style={styles.topTitle}>Belge Tara</Text>

        <TouchableOpacity style={styles.topBtn} accessibilityRole="button" accessibilityLabel="Flaş" accessibilityState={{disabled:!device.hasTorch,selected:flashMode==='on'}} disabled={!device.hasTorch} onPress={toggleFlash}>
          <Icon name={flashMode==='on'?'flash':'flash-off'} size={22} color="#fff"/>
          <Text style={styles.flashLabel}>
            {flashMode === 'on' ? 'Acik' : 'Kapali'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.guideOverlay} pointerEvents="none">
        <View style={styles.guideBox}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <Text style={styles.guideText}>Belgeyi cerceveye hizalayin</Text>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.controlsRow}>
          <View style={styles.sideBtn} />
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={takePhoto}
            disabled={isTakingPhoto}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Belgenin fotoğrafını çek"
          >
            <View
              style={[
                styles.captureBtnInner,
                isTakingPhoto && styles.captureBtnDisabled,
              ]}
            />
          </TouchableOpacity>
          <View style={styles.sideBtn} />
        </View>
      </View>
    </View>
  );
};

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    } as ViewStyle,
    center: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      gap: 20,
    } as ViewStyle,
    permissionText: {
      fontSize: 16,
      color: colors.textPrimary,
      textAlign: 'center',
      lineHeight: 24,
    } as TextStyle,
    permissionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 6,
    } as ViewStyle,
    permissionButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '700',
    } as TextStyle,
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 12,
      zIndex: 10,
    } as ViewStyle,
    topBtn: {
      minWidth: 56,
      minHeight:48,
      alignItems: 'center',
    } as ViewStyle,
    topBtnText: {
      fontSize: 16,
      color: '#fff',
      fontWeight: '700',
    } as TextStyle,
    topTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: '#fff',
    } as TextStyle,
    flashLabel: {
      fontSize: 10,
      color: '#fff',
      marginTop: 2,
    } as TextStyle,
    guideOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 5,
    } as ViewStyle,
    guideBox: {
      width: '80%',
      aspectRatio: 0.7,
      position: 'relative',
    } as ViewStyle,
    corner: {
      position: 'absolute',
      width: CORNER_SIZE,
      height: CORNER_SIZE,
    } as ViewStyle,
    cornerTL: {
      top: 0,
      left: 0,
      borderTopWidth: CORNER_THICKNESS,
      borderLeftWidth: CORNER_THICKNESS,
      borderColor: '#fff',
      borderTopLeftRadius: 4,
    } as ViewStyle,
    cornerTR: {
      top: 0,
      right: 0,
      borderTopWidth: CORNER_THICKNESS,
      borderRightWidth: CORNER_THICKNESS,
      borderColor: '#fff',
      borderTopRightRadius: 4,
    } as ViewStyle,
    cornerBL: {
      bottom: 0,
      left: 0,
      borderBottomWidth: CORNER_THICKNESS,
      borderLeftWidth: CORNER_THICKNESS,
      borderColor: '#fff',
      borderBottomLeftRadius: 4,
    } as ViewStyle,
    cornerBR: {
      bottom: 0,
      right: 0,
      borderBottomWidth: CORNER_THICKNESS,
      borderRightWidth: CORNER_THICKNESS,
      borderColor: '#fff',
      borderBottomRightRadius: 4,
    } as ViewStyle,
    guideText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      fontWeight: '600',
      marginTop: 14,
    } as TextStyle,
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingTop: 20,
      zIndex: 10,
    } as ViewStyle,
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 50,
    } as ViewStyle,
    sideBtn: {
      width: 50,
    } as ViewStyle,
    captureBtn: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    } as ViewStyle,
    captureBtnInner: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#fff',
    } as ViewStyle,
    captureBtnDisabled: {
      opacity: 0.4,
    } as ViewStyle,
    preview: {
      flex: 1,
    } as ImageStyle,
    previewControls: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      paddingTop: 20,
      paddingHorizontal: 30,
      backgroundColor: 'rgba(0,0,0,0.5)',
    } as ViewStyle,
    previewBtn: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#fff',
      alignItems: 'center',
    } as ViewStyle,
    previewBtnConfirm: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    } as ViewStyle,
    previewBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    } as TextStyle,
    previewBtnConfirmText: {
      color: '#fff',
    } as TextStyle,
    backBtn: {
      position: 'absolute',
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20,
    } as ViewStyle,
    backBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    } as TextStyle,
  });
