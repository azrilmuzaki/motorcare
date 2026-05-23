import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, TextInput, Button, Portal, Modal } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@core/theme/colors';
import { Spacing } from '@core/theme/typography';
import { useTheme } from '@presentation/hooks/useTheme';
import type { RootStackParamList } from '@presentation/navigation/types';
import { useComponentStore } from '@presentation/store/component.store';
import { useVehicleStore } from '@presentation/store/vehicle.store';

const COMPONENT_TEMPLATES = [
  { id: 'oil', name: 'Oli Mesin', icon: 'oil', defaultInterval: 2000 },
  { id: 'air-filter', name: 'Filter Udara', icon: 'air-filter', defaultInterval: 10000 },
  { id: 'brake', name: 'Kampas Rem', icon: 'car-brake-alert', defaultInterval: 10000 },
  { id: 'coolant', name: 'Air Radiator', icon: 'coolant', defaultInterval: 12000 },
  { id: 'gear', name: 'Oli Gardan / Rantai', icon: 'cog', defaultInterval: 15000 },
  { id: 'tire', name: 'Ban', icon: 'car-tire-alert', defaultInterval: 20000 },
  { id: 'custom', name: 'Lainnya...', icon: 'wrench', defaultInterval: 5000 },
];

export function AddComponentScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const { addComponent, isLoading } = useComponentStore();
  const { selectedVehicle } = useVehicleStore();

  const [selectedTemplate, setSelectedTemplate] = useState<typeof COMPONENT_TEMPLATES[0] | null>(null);
  const [customName, setCustomName] = useState('');
  const [intervalStr, setIntervalStr] = useState('');
  const [lastKmStr, setLastKmStr] = useState(selectedVehicle?.currentKm.toString() || '0');
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelectTemplate = (template: typeof COMPONENT_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setCustomName(template.id === 'custom' ? '' : template.name);
    setIntervalStr(template.defaultInterval.toString());
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedVehicle) return;
    if (!selectedTemplate) return;

    const targetInterval = parseInt(intervalStr, 10);
    const lastServiceKm = parseInt(lastKmStr, 10);
    const name = selectedTemplate.id === 'custom' ? customName : selectedTemplate.name;

    if (isNaN(targetInterval) || targetInterval <= 0) return;
    if (isNaN(lastServiceKm) || lastServiceKm < 0) return;
    if (!name.trim()) return;

    try {
      await addComponent({
        vehicleId: selectedVehicle.id,
        name,
        icon: selectedTemplate.icon,
        targetInterval,
        lastServiceKm,
      });
      setModalVisible(false);
      navigation.goBack();
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        'Gagal Menyimpan',
        `Gagal menyimpan komponen baru: ${error?.message || 'Terjadi kesalahan sistem'}`
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="titleLarge" style={[styles.title, { color: colors.onBackground }]}>
          Pilih Jenis Komponen
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Tambahkan komponen untuk dipantau secara otomatis berdasarkan proyeksi odometer {selectedVehicle?.name}.
        </Text>

        <View style={styles.grid}>
          {COMPONENT_TEMPLATES.map((tpl) => (
            <Pressable
              key={tpl.id}
              style={[
                styles.gridItem, 
                { 
                  backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
                  borderColor: isDark ? colors.outline : colors.surfaceVariant,
                }
              ]}
              onPress={() => handleSelectTemplate(tpl)}
              android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
            >
              <View style={[styles.iconBox, { backgroundColor: `${Colors.primary}15` }]}>
                <MaterialCommunityIcons name={tpl.icon as any} size={32} color={Colors.primary} />
              </View>
              <Text variant="labelLarge" style={[styles.itemName, { color: colors.onBackground }]}>
                {tpl.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Portal>
        <Modal 
          visible={modalVisible} 
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: `${Colors.primary}15` }]}>
                <MaterialCommunityIcons name={selectedTemplate?.icon as any} size={24} color={Colors.primary} />
              </View>
              <Text variant="titleMedium" style={[styles.modalTitle, { color: colors.onBackground }]}>
                Atur Interval Servis
              </Text>
            </View>

            {selectedTemplate?.id === 'custom' && (
              <TextInput
                label="Nama Komponen"
                value={customName}
                onChangeText={setCustomName}
                mode="outlined"
                style={styles.input}
              />
            )}

            <TextInput
              label="Target Interval (KM)"
              value={intervalStr}
              onChangeText={setIntervalStr}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.input}
              right={<TextInput.Affix text="km" />}
            />

            <TextInput
              label="Diperbarui Terakhir Pada (KM)"
              value={lastKmStr}
              onChangeText={setLastKmStr}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.input}
              right={<TextInput.Affix text="km" />}
              outlineStyle={parseInt(lastKmStr, 10) > (selectedVehicle?.currentKm ?? 0) ? { borderColor: Colors.error } : undefined}
            />
            {parseInt(lastKmStr, 10) > (selectedVehicle?.currentKm ?? 0) && (
               <Text style={{color: Colors.error, fontSize: 12, marginBottom: Spacing.sm}}>KM terakhir ganti tidak boleh lebih besar dari KM kendaraan saat ini.</Text>
            )}

            <View style={styles.modalActions}>
              <Button mode="text" onPress={() => setModalVisible(false)} style={styles.modalBtn}>Batal</Button>
              <Button 
                mode="contained" 
                onPress={handleSave} 
                loading={isLoading}
                disabled={!intervalStr || !lastKmStr || (selectedTemplate?.id === 'custom' && !customName)}
                style={styles.modalBtn}
              >
                Simpan
              </Button>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    marginBottom: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  gridItem: {
    width: '46%', // Approximate 2 columns with margin
    margin: '2%',
    padding: Spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  modalContent: {
    margin: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: 'Poppins_700Bold',
  },
  input: {
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  modalBtn: {
    minWidth: 100,
  }
});
