import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import { AppButton } from '@presentation/components/common/AppButton';
import { useTheme } from '@presentation/hooks/useTheme';

interface ProfilePhotoModalProps {
  visible: boolean;
  imageUri: string | null;
  userName?: string;
  profileInitial: string;
  onDismiss: () => void;
  onChangePhoto: () => void;
  onRemovePhoto: () => void;
}

export function ProfilePhotoModal({
  visible,
  imageUri,
  userName,
  profileInitial,
  onDismiss,
  onChangePhoto,
  onRemovePhoto,
}: ProfilePhotoModalProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [fullPreviewVisible, setFullPreviewVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      setFullPreviewVisible(false);
    }
  }, [visible]);

  const subtitle = useMemo(
    () =>
      imageUri
        ? t('profilePhoto.activePhoto')
        : t('profilePhoto.emptyPhoto'),
    [imageUri, t],
  );

  const resolvedUserName = userName?.trim() || t('profilePhoto.defaultName');

  const previewContent = imageUri ? (
    <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
  ) : (
    <View
      style={[
        styles.fallbackAvatar,
        { backgroundColor: isDark ? colors.surfaceVariant : colors.surface },
      ]}
    >
      <Text variant="headlineLarge" style={styles.fallbackInitial}>
        {profileInitial}
      </Text>
    </View>
  );

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onDismiss}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={onDismiss} />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
                borderColor: colors.outline,
              },
            ]}
          >
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.outline }]} />
            </View>

            <View style={styles.previewWrap}>
              <View
                style={[
                  styles.previewFrame,
                  {
                    backgroundColor: isDark ? colors.surfaceVariant : Colors.light.hero,
                    borderColor: colors.outline,
                  },
                ]}
              >
                {previewContent}
              </View>

              <Text variant="titleLarge" style={[styles.previewTitle, { color: colors.onSurface }]}>
                {resolvedUserName}
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.previewSubtitle, { color: colors.onSurfaceVariant }]}
              >
                {subtitle}
              </Text>
            </View>

            <View style={styles.actionGroup}>
              <AppButton
                label={t('common.viewPhoto')}
                onPress={() => setFullPreviewVisible(true)}
                variant="outlined"
                icon="image-outline"
              />
              <AppButton
                label={t('common.change')}
                onPress={onChangePhoto}
                icon="image-edit-outline"
              />
              <AppButton
                label={t('common.remove')}
                onPress={onRemovePhoto}
                variant="text"
                icon="trash-can-outline"
                disabled={!imageUri}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={fullPreviewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullPreviewVisible(false)}
      >
        <View style={styles.viewerRoot}>
          <Pressable style={styles.viewerBackdrop} onPress={() => setFullPreviewVisible(false)} />

          <View style={styles.viewerBody}>
            <Pressable
              onPress={() => setFullPreviewVisible(false)}
              style={[styles.viewerClose, { backgroundColor: 'rgba(255,255,255,0.14)' }]}
            >
              <MaterialCommunityIcons name="close" size={22} color={Colors.white} />
            </Pressable>

            <View style={styles.viewerCard}>
              <View style={styles.viewerImageWrap}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.viewerImage} resizeMode="contain" />
                ) : (
                  <View style={styles.viewerFallback}>
                    <Text variant="displaySmall" style={styles.viewerFallbackInitial}>
                      {profileInitial}
                    </Text>
                  </View>
                )}
              </View>

              <Text variant="titleLarge" style={styles.viewerTitle}>
                {resolvedUserName}
              </Text>
              <Text variant="bodyMedium" style={styles.viewerSubtitle}>
                {imageUri ? t('profilePhoto.largePreview') : t('profilePhoto.noPhotoPreview')}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 10, 16, 0.42)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  sheetHandle: {
    width: 56,
    height: 5,
    borderRadius: BorderRadius.full,
  },
  previewWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  previewFrame: {
    width: 164,
    height: 164,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  fallbackAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitial: {
    fontFamily: 'Poppins_700Bold',
    color: Colors.primary,
  },
  previewTitle: {
    fontFamily: 'Poppins_700Bold',
  },
  previewSubtitle: {
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  actionGroup: {
    gap: Spacing.sm,
  },
  viewerRoot: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 12, 0.96)',
  },
  viewerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  viewerBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  viewerClose: {
    position: 'absolute',
    top: Spacing.xxxl,
    right: Spacing.xl,
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  viewerCard: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
  },
  viewerImageWrap: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 360,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  viewerFallbackInitial: {
    fontFamily: 'Poppins_700Bold',
    color: Colors.white,
  },
  viewerTitle: {
    fontFamily: 'Poppins_700Bold',
    color: Colors.white,
  },
  viewerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
});
