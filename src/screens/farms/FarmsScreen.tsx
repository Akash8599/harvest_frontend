import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { GlassInput } from '../../components/glassmorphism/GlassInput';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { farmApi, authApi } from '../../services/api';
import { Farm, UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';

// New Produce Type Options
const PRODUCE_TYPES = [
  'Banana',
  'Mango',
  'Apple',
  'Orange',
  'Grapes',
  'Pomegranate',
  'Other'
];

export const FarmsScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Inspection Request State
  const [isRequestModalVisible, setIsRequestModalVisible] = useState(false);
  const [selectedFarmForRequest, setSelectedFarmForRequest] = useState<Farm | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [requestNotes, setRequestNotes] = useState('');

  // Form State
  const [farmerName, setFarmerName] = useState('');
  const [location, setLocation] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [produceType, setProduceType] = useState('Banana'); // Default
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Fetch Farms
  const { data: farms, isLoading, refetch } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const response = await farmApi.getAllFarms();
      return response.data.data;
    },
  });

  // Fetch Vendors
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await authApi.getUsersByRole('VENDOR');
      return response.data.data;
    },
    enabled: isRequestModalVisible,
  });

  // Fetch Batches
  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const response = await farmApi.getAllBatches();
      return response.data.data;
    },
  });

  // Fetch All Pending Requests
  const { data: allRequests } = useQuery({
    queryKey: ['allInspectionRequests'],
    queryFn: async () => {
      const response = await farmApi.getAllInspectionRequests('PENDING');
      return response.data.data;
    },
    enabled: user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.MANAGER,
  });

  // Filter Farms
  const filteredFarms = React.useMemo(() => {
    if (!farms) return [];
    const isAdminOrManager = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.MANAGER;
    let result = [...farms];

    if (isAdminOrManager) {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(farm =>
          farm.farmerName.toLowerCase().includes(query) ||
          farm.location.toLowerCase().includes(query)
        );
      }
      result.sort((a: Farm, b: Farm) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return result;
    }

    let availableFarms = result.filter((farm: Farm) => {
      const hasActiveBatch = batches?.some((batch: any) =>
        batch.farmId === farm.id &&
        batch.status !== 'COMPLETED' &&
        batch.status !== 'CANCELLED'
      );
      return !hasActiveBatch;
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      availableFarms = availableFarms.filter(farm =>
        farm.farmerName.toLowerCase().includes(query) ||
        farm.location.toLowerCase().includes(query)
      );
    }
    return availableFarms;
  }, [farms, batches, user, searchQuery]);

  // Create Farm Mutation
  const createFarmMutation = useMutation({
    mutationFn: (newFarm: any) => farmApi.createFarm(newFarm),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Farm Created' });
      setIsModalVisible(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['farms'] });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Creation Failed', text2: error.response?.data?.message });
    },
  });

  // Create Request Mutation
  const createRequestMutation = useMutation({
    mutationFn: (data: any) => farmApi.createInspectionRequest(data),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Request Sent' });
      setIsRequestModalVisible(false);
      setSelectedFarmForRequest(null);
      setSelectedVendorId('');
      setRequestNotes('');
      queryClient.invalidateQueries({ queryKey: ['myInspectionRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allInspectionRequests'] });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Request Failed', text2: error.response?.data?.message });
    },
  });

  const resetForm = () => {
    setFarmerName('');
    setLocation('');
    setTotalArea('');
    setContactNumber('');
    setProduceType('Banana');
    setLatitude('');
    setLongitude('');
  };

  const handleCreateFarm = () => {
    if (!farmerName || !location || !totalArea) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Name, Location and Area are required.' });
      return;
    }
    createFarmMutation.mutate({
      farmerName,
      location,
      totalArea: parseFloat(totalArea),
      areaUnit: 'Acres',
      contactNumber,
      produceType,
      latitude: latitude ? parseFloat(latitude) : 0,
      longitude: longitude ? parseFloat(longitude) : 0,
    });
  };

  const handleRequestInspection = () => {
    if (!selectedVendorId) {
      Toast.show({ type: 'error', text1: 'Select Vendor', text2: 'Please assign a vendor.' });
      return;
    }
    createRequestMutation.mutate({
      farmId: selectedFarmForRequest?.id,
      vendorId: selectedVendorId,
      notes: requestNotes,
      status: 'PENDING'
    });
  };

  const openRequestModal = (farm: Farm) => {
    setSelectedFarmForRequest(farm);
    setIsRequestModalVisible(true);
  };

  const renderFarmItem = ({ item }: { item: Farm }) => (
    <GlassCard style={styles.farmCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Icon name="sprout" size={24} color={COLORS.primary.main} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.farmName}>{item.farmerName}</Text>
          <Text style={styles.farmLocation}>
            <Icon name="map-marker" size={14} color={COLORS.text.muted} /> {item.location}
          </Text>
        </View>
        {item.produceType && (
          <View style={styles.produceBadge}>
            <Text style={styles.produceText}>{item.produceType}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Size</Text>
          <Text style={styles.detailValue}>{item.totalArea} {item.areaUnit}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Contact</Text>
          <Text style={styles.detailValue}>{item.contactNumber || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        {/* Buttons logic same as before... */}
        {(() => {
          const activeBatch = batches?.find((b: any) =>
            b.farmId === item.id && b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
          );
          const pendingRequest = allRequests?.find((r: any) =>
            r.farmId === item.id && r.status === 'PENDING'
          );

          if (activeBatch) {
            return (
              <GlassButton
                title="Harvesting"
                onPress={() => { }}
                variant="secondary"
                size="sm"
                style={[styles.actionButton, { opacity: 0.6 }]}
                disabled={true}
                icon={<Icon name="sprout" size={16} color={COLORS.primary.main} />}
              />
            );
          }
          if (pendingRequest) {
            return (
              <GlassButton
                title="Request Sent"
                onPress={() => { }}
                variant="secondary"
                size="sm"
                style={[styles.actionButton, { opacity: 0.6 }]}
                disabled={true}
                icon={<Icon name="clock-outline" size={16} color={COLORS.status.warning} />}
              />
            );
          }
          return (
            <GlassButton
              title="Request Inspection"
              onPress={() => openRequestModal(item)}
              variant="secondary"
              size="sm"
              style={styles.actionButton}
              icon={<Icon name="clipboard-check-outline" size={16} color={COLORS.primary.main} />}
            />
          );
        })()}
      </View>
    </GlassCard>
  );

  return (
    <LinearGradient
      colors={COLORS.background.gradient as string[]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Farm Management</Text>
          <Text style={styles.subtitle}>Manage plots and locations</Text>
        </View>

        <View style={styles.searchContainer}>
          <GlassInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search farms..."
            icon={<Icon name="magnify" size={20} color={COLORS.text.muted} />}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary.main} />
          </View>
        ) : (
          <FlatList
            data={filteredFarms}
            renderItem={renderFarmItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary.main} />
            }
            ListEmptyComponent={
              <GlassCard style={styles.emptyCard}>
                <Icon name="tractor" size={48} color={COLORS.text.muted} />
                <Text style={styles.emptyText}>No available farms</Text>
                <Text style={styles.emptySubtext}>All farms are currently being processed or none were found.</Text>
              </GlassCard>
            }
          />
        )}

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsModalVisible(true)}
        >
          <LinearGradient
            colors={COLORS.gradients.primary as string[]}
            style={styles.fabGradient}
          >
            <Icon name="plus" size={32} color="#000" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Add Farm Modal - REDESIGNED */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.premiumModalContainer}>
            <LinearGradient
              colors={['#0D1117', '#1A3A2F']}
              style={styles.premiumGradient}
            >
              <View style={styles.premiumHeader}>
                <Text style={styles.premiumTitle}>Add New Farm</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeBtn}>
                  <Icon name="close" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.premiumFormScroll} contentContainerStyle={styles.premiumFormContent} keyboardShouldPersistTaps="handled">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

                  {/* Farmer Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Farm Name / Owner</Text>
                    <GlassInput
                      value={farmerName}
                      onChangeText={setFarmerName}
                      placeholder="e.g. Green Valley Farm"
                      icon={<Icon name="account" size={20} color={COLORS.primary.main} />}
                    />
                  </View>

                  {/* Location */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Farm Location</Text>
                    <GlassInput
                      value={location}
                      onChangeText={setLocation}
                      placeholder="Village/Area"
                      icon={<Icon name="map-marker" size={20} color={COLORS.primary.main} />}
                    />
                  </View>

                  {/* Produce Type - DROPDOWN */}
                  <View style={[styles.inputGroup, { zIndex: 100 }]}>
                    <Text style={styles.inputLabel}>Produce Type</Text>
                    <TouchableOpacity
                      style={styles.dropdownTrigger}
                      onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Icon name="fruit-cherries" size={20} color={COLORS.primary.main} />
                        <Text style={styles.dropdownText}>{produceType}</Text>
                      </View>
                      <Icon name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color={COLORS.text.secondary} />
                    </TouchableOpacity>

                    {isDropdownOpen && (
                      <View style={styles.dropdownList}>
                        {PRODUCE_TYPES.map((type, index) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.dropdownItem,
                              index === PRODUCE_TYPES.length - 1 && { borderBottomWidth: 0 }
                            ]}
                            onPress={() => {
                              setProduceType(type);
                              setIsDropdownOpen(false);
                            }}
                          >
                            <Text style={[
                              styles.dropdownItemText,
                              produceType === type && styles.dropdownItemTextSelected
                            ]}>{type}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.row}>
                    {/* Total Area */}
                    <View style={[styles.halfInput, { marginRight: SPACING.sm }]}>
                      <Text style={styles.inputLabel}>Total Area (Acres)</Text>
                      <GlassInput
                        value={totalArea}
                        onChangeText={setTotalArea}
                        placeholder="0.0"
                        keyboardType="numeric"
                        icon={<Icon name="ruler-square" size={20} color={COLORS.primary.main} />}
                      />
                    </View>
                    {/* Contact */}
                    <View style={[styles.halfInput, { marginLeft: SPACING.sm }]}>
                      <Text style={styles.inputLabel}>Contact Number</Text>
                      <GlassInput
                        value={contactNumber}
                        onChangeText={setContactNumber}
                        placeholder="Phone"
                        keyboardType="phone-pad"
                        icon={<Icon name="phone" size={20} color={COLORS.primary.main} />}
                      />
                    </View>
                  </View>

                  {/* Optional Coordinates */}
                  <View style={styles.row}>
                    <View style={[styles.halfInput, { marginRight: SPACING.sm }]}>
                      <Text style={styles.inputLabel}>Latitude (Optional)</Text>
                      <GlassInput
                        value={latitude}
                        onChangeText={setLatitude}
                        placeholder="0.0000"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={[styles.halfInput, { marginLeft: SPACING.sm }]}>
                      <Text style={styles.inputLabel}>Longitude (Optional)</Text>
                      <GlassInput
                        value={longitude}
                        onChangeText={setLongitude}
                        placeholder="0.0000"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.footerSpacer} />

                </KeyboardAvoidingView>
              </ScrollView>

              <View style={styles.premiumFooter}>
                <GlassButton
                  title="Create Farm"
                  onPress={handleCreateFarm}
                  loading={createFarmMutation.isPending}
                  variant="primary"
                  size="lg"
                  style={styles.submitButton}
                />
              </View>
            </LinearGradient>
          </View>
        </Modal>

        {/* Request Inspection Modal - CENTERED POPUP */}
        <Modal
          visible={isRequestModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsRequestModalVisible(false)}
        >
          <View style={styles.premiumModalOverlay}>
            <View style={styles.premiumModalContent}>
              <LinearGradient
                colors={['#0D1117', '#1A3A2F']}
                style={styles.premiumGradient}
              >
                <View style={styles.premiumHeader}>
                  <Text style={styles.premiumTitle}>Request Inspection</Text>
                  <TouchableOpacity onPress={() => setIsRequestModalVisible(false)} style={styles.closeBtn}>
                    <Icon name="close" size={24} color={COLORS.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.premiumFormScroll} contentContainerStyle={styles.premiumFormContent} keyboardShouldPersistTaps="handled">
                  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                      <Text style={[styles.modalSubtitle, { marginBottom: 0, marginRight: 8 }]}>For: <Text style={{ fontWeight: 'bold', color: COLORS.primary.main }}>{selectedFarmForRequest?.farmerName}</Text></Text>
                      {selectedFarmForRequest?.produceType && (
                        <View style={styles.produceBadge}>
                          <Text style={styles.produceText}>{selectedFarmForRequest.produceType}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.sectionTitle}>Select Vendor</Text>
                    {vendorsLoading ? (
                      <ActivityIndicator color={COLORS.primary.main} />
                    ) : (
                      <ScrollView style={styles.vendorList} horizontal showsHorizontalScrollIndicator={false}>
                        {vendors?.map((vendor: any) => (
                          <TouchableOpacity
                            key={vendor.id}
                            style={[
                              styles.vendorItem,
                              selectedVendorId === vendor.id && styles.vendorItemSelected
                            ]}
                            onPress={() => setSelectedVendorId(vendor.id)}
                          >
                            <View style={styles.vendorIcon}>
                              <Icon name="account" size={20} color={COLORS.text.primary} />
                            </View>
                            <Text style={styles.vendorName}>{vendor.fullName || vendor.username}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Instructions / Notes</Text>
                      <GlassInput
                        value={requestNotes}
                        onChangeText={setRequestNotes}
                        multiline
                        numberOfLines={3}
                        placeholder="e.g. Check for pest infestation..."
                        icon={<Icon name="note-text" size={20} color={COLORS.primary.main} />}
                      />
                    </View>

                    <View style={styles.footerSpacer} />
                  </KeyboardAvoidingView>
                </ScrollView>

                <View style={styles.premiumFooter}>
                  <GlassButton
                    title="Send Request"
                    onPress={handleRequestInspection}
                    loading={createRequestMutation.isPending}
                    variant="primary"
                    size="lg"
                    style={styles.submitButton}
                  />
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient >
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md },
  title: { fontSize: TYPOGRAPHY.sizes['3xl'], fontWeight: 'bold', color: COLORS.text.primary },
  subtitle: { fontSize: TYPOGRAPHY.sizes.md, color: COLORS.text.secondary, marginTop: SPACING.xs },
  searchContainer: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: SPACING.lg, paddingBottom: 100 },

  farmCard: { marginBottom: SPACING.md, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  iconContainer: { width: 40, height: 40, borderRadius: BORDER_RADIUS.full, backgroundColor: 'rgba(57, 255, 20, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  headerText: { flex: 1 },
  farmName: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: 'bold', color: COLORS.text.primary },
  farmLocation: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.muted, marginTop: 2 },

  produceBadge: { backgroundColor: 'rgba(57, 255, 20, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(57, 255, 20, 0.3)' },
  produceText: { fontSize: 10, color: COLORS.primary.main, fontWeight: 'bold', textTransform: 'uppercase' },

  cardDetails: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.glass.border },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted, marginBottom: 2 },
  detailValue: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: '600', color: COLORS.text.primary },

  actionRow: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.glass.border, alignItems: 'flex-end' },
  actionButton: { width: '100%' },

  emptyCard: { alignItems: 'center', padding: SPACING.xl, marginTop: SPACING.xl },
  emptyText: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.text.primary, marginTop: SPACING.md },
  emptySubtext: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.muted, marginTop: SPACING.xs },

  fab: { position: 'absolute', bottom: SPACING.xl, right: SPACING.xl, width: 56, height: 56, borderRadius: 28, elevation: 8, shadowColor: COLORS.primary.glow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65 },
  fabGradient: { width: '100%', height: '100%', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },

  // Updated Modal Styles for Dark Premium Look (App Theme)
  // Centered Modal Styles (Popup)
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', // Dimmed dark overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  premiumModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    backgroundColor: '#1A3A2F', // Fallback background
  },
  premiumGradient: {
    width: '100%',
    height: '100%', // Fill the content container
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  premiumTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text.primary },
  closeBtn: { padding: 4 },

  premiumFormScroll: { flexGrow: 0 },
  premiumFormContent: { padding: SPACING.lg },

  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text.secondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Using default Glass styles instead of solid white
  premiumInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Slight background for visibility
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: COLORS.text.primary
  },

  // Dropdown Styles
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.primary,
  },
  dropdownList: {
    marginTop: SPACING.xs,
    backgroundColor: '#1E293B', // Solid dark for menu to cover content
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
      android: { elevation: 8 },
    }),
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  dropdownItemTextSelected: {
    color: COLORS.primary.main,
    fontWeight: 'bold',
  },

  premiumFooter: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  footerSpacer: { height: 40 },

  // Existing Modal styles (for request modal which wasn't redesigned yet)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', padding: SPACING.lg },
  modalContent: { maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.text.primary },
  modalSubtitle: { fontSize: TYPOGRAPHY.sizes.md, color: COLORS.text.secondary, marginBottom: SPACING.md },
  formContainer: { gap: SPACING.sm },
  row: { flexDirection: 'row' },
  halfInput: { flex: 1 },
  submitButton: { marginTop: 0 },

  sectionTitle: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: '600', color: COLORS.text.primary, marginBottom: SPACING.sm },
  vendorList: { flexDirection: 'row', marginBottom: SPACING.md, maxHeight: 100 },
  vendorItem: { alignItems: 'center', marginRight: SPACING.md, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.glass.border, backgroundColor: COLORS.glass.background, minWidth: 80 },
  vendorItemSelected: { borderColor: COLORS.primary.main, backgroundColor: 'rgba(57, 255, 20, 0.1)' },
  vendorIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glass.border, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs },
  vendorName: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.primary, textAlign: 'center' },
});
