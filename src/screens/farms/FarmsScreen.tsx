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
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import DatePicker from 'react-native-date-picker';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { GlassInput } from '../../components/glassmorphism/GlassInput';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { farmApi, authApi } from '../../services/api';
import { Farm, UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { HorizontalScrollWrapper } from '../../components/common/HorizontalScrollWrapper';

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
  const [visitDate, setVisitDate] = useState(new Date());
  const [showVisitDatePicker, setShowVisitDatePicker] = useState(false);
  const [placeOfVisit, setPlaceOfVisit] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorContact, setVisitorContact] = useState('');
  const [proposedRate, setProposedRate] = useState('');

  // Farm Form State
  const [farmerName, setFarmerName] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [produceType, setProduceType] = useState('Banana'); // Default
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [customItem, setCustomItem] = useState('');

  const itemOptions = ['Banana', 'Plantain', 'Mango', 'Orange', 'Papaya', 'Guava', 'Other'];
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
      // If a farm is COMPLETE, it should probably be visible just to see its history, or maybe hidden if only active farms are wanted.
      // Let's hide HARVEST_IN_PROGRESS from the "available to request" view unless they are looking at all farms.
      const hasActiveBatch = batches?.some((batch: any) =>
        batch.farmId === farm.id &&
        ['CREATED', 'IN_PROGRESS', 'HARVEST_IN_PROGRESS'].includes(batch.status)
      );
      // Backend status is now updated. We can also just rely on farm.status directly.
      return farm.status !== 'HARVEST_IN_PROGRESS' && !hasActiveBatch;
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
    setLatitude('');
    setLongitude('');
    setTotalArea('');
    setContactNumber('');
    setProduceType('Banana');
    setCustomItem('');
  };

  const handleCreateFarm = () => {
    if (!farmerName || !location || !totalArea) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Name, Location and Area are required.' });
      return;
    }
    const finalProduceType = produceType === 'Other' && customItem ? customItem : produceType;
    if (produceType === 'Other' && !customItem) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter the item name.' });
      return;
    }
    createFarmMutation.mutate({
      farmerName,
      location,
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      totalArea: parseFloat(totalArea),
      areaUnit: 'Acres',
      contactNumber,
      produceType: finalProduceType,
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
      visitDate: visitDate.toISOString().split('T')[0],
      placeOfVisit: placeOfVisit.trim() || undefined,
      visitorName: visitorName.trim() || undefined,
      visitorContact: visitorContact.trim() || undefined,
      proposedRate: proposedRate ? parseFloat(proposedRate) : undefined,
      status: 'PENDING',
    });
  };

  const openRequestModal = (farm: Farm) => {
    setSelectedFarmForRequest(farm);
    setVisitorName(farm.farmerName || '');
    setVisitorContact(farm.contactNumber || '');
    setPlaceOfVisit(farm.location || '');
    setIsRequestModalVisible(true);
  };

  const handleCancelRequest = (requestId: string) => {
    // Cancel request API call — invalidate queries on success
    farmApi.cancelInspectionRequest(requestId)
      .then(() => {
        Toast.show({ type: 'success', text1: 'Request Cancelled' });
        queryClient.invalidateQueries({ queryKey: ['allInspectionRequests'] });
        queryClient.invalidateQueries({ queryKey: ['myInspectionRequests'] });
      })
      .catch((err: any) => {
        Toast.show({ type: 'error', text1: 'Cancel Failed', text2: err.response?.data?.message });
      });
  };

  const renderFarmItem = ({ item }: { item: Farm }) => {
    const activeBatch = batches?.find((b: any) =>
      b.farmId === item.id && ['CREATED', 'IN_PROGRESS', 'HARVEST_IN_PROGRESS'].includes(b.status)
    );
    const pendingRequest = allRequests?.find((r: any) =>
      r.farmId === item.id && r.status === 'PENDING'
    );
    const isHarvesting = activeBatch?.status === 'HARVESTING' || item.status === 'HARVEST_IN_PROGRESS';
    const isCompleted = item.status === 'COMPLETED' || batches?.some((b: any) =>
      b.farmId === item.id && ['HARVEST_COMPLETED', 'COMPLETED', 'DISPATCH_IN_PROGRESS', 'DISPATCH_COMPLETED', 'IN_TRANSIT', 'DELIVERED'].includes(b.status)
    );

    // Status badge config
    let statusLabel = 'Available';
    let statusColor = COLORS.primary.main;
    let statusBg = 'rgba(34,197,94,0.12)';
    let statusIcon = 'check-circle-outline';

    if (isCompleted) {
      statusLabel = 'Completed';
      statusColor = '#8B5CF6'; // Purple for completed
      statusBg = 'rgba(139,92,246,0.12)';
      statusIcon = 'check-all';
    } else if (isHarvesting || activeBatch) {
      statusLabel = 'Harvesting';
      statusColor = '#F59E0B';
      statusBg = 'rgba(245,158,11,0.12)';
      statusIcon = 'tractor';
    } else if (pendingRequest) {
      statusLabel = 'Inspection Sent';
      statusColor = '#60A5FA';
      statusBg = 'rgba(96,165,250,0.12)';
      statusIcon = 'clock-outline';
    }

    return (
      <TouchableOpacity activeOpacity={0.92} style={styles.farmCard}>
        {/* Top row: icon + name/location + produce badge */}
        <View style={styles.cardTopRow}>
          <LinearGradient
            colors={['rgba(34,197,94,0.18)', 'rgba(34,197,94,0.06)']}
            style={styles.cardIconPill}
          >
            <Icon name="sprout" size={20} color={COLORS.primary.main} />
          </LinearGradient>

          <View style={styles.cardMainInfo}>
            <Text style={styles.farmName} numberOfLines={1}>{item.farmerName}</Text>
            <View style={styles.farmLocationRow}>
              <Icon name="map-marker-outline" size={12} color={COLORS.text.muted} />
              <Text style={styles.farmLocation} numberOfLines={1}>{item.location}</Text>
            </View>
          </View>

          {item.produceType && (
            <View style={styles.produceBadge}>
              <Text style={styles.produceText}>{item.produceType}</Text>
            </View>
          )}
        </View>

        {/* Details strip */}
        <View style={styles.cardDetailsStrip}>
          <View style={styles.stripItem}>
            <Icon name="ruler-square" size={13} color={COLORS.text.muted} />
            <Text style={styles.stripValue}>{item.totalArea} {item.areaUnit}</Text>
          </View>
          {item.contactNumber ? (
            <View style={styles.stripItem}>
              <Icon name="phone-outline" size={13} color={COLORS.text.muted} />
              <Text style={styles.stripValue}>{item.contactNumber}</Text>
            </View>
          ) : null}
          {item.latestVisitDate ? (
            <View style={styles.stripItem}>
              <Icon name="calendar-check" size={13} color={COLORS.text.muted} />
              <Text style={styles.stripValue}>{new Date(item.latestVisitDate).toLocaleDateString()}</Text>
            </View>
          ) : null}
          {/* Status badge */}
          <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
            <Icon name={statusIcon} size={12} color={statusColor} />
            <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Action row */}
        <View style={styles.cardActionRow}>
          {isCompleted ? (
            <View style={styles.lockedRow}>
              <Icon name="check-all" size={13} color={COLORS.text.muted} />
              <Text style={styles.lockedText}>Harvest cycle finished</Text>
            </View>
          ) : isHarvesting || activeBatch ? (
            // Farm is in a batch — no actions
            <View style={styles.lockedRow}>
              <Icon name="lock-outline" size={13} color={COLORS.text.muted} />
              <Text style={styles.lockedText}>Locked during harvest cycle</Text>
            </View>
          ) : pendingRequest ? (
            // Pending request — show Cancel button
            <View style={styles.pendingRow}>
              <View style={styles.pendingBadge}>
                <Icon name="clock-outline" size={14} color="#60A5FA" />
                <Text style={styles.pendingLabel}>Request pending review</Text>
              </View>
              <TouchableOpacity
                style={[styles.cancelBtn, isHarvesting && styles.cancelBtnDisabled]}
                onPress={() => !isHarvesting && handleCancelRequest(pendingRequest.id)}
                disabled={isHarvesting}
                activeOpacity={0.75}
              >
                <Icon name="close-circle-outline" size={14} color={isHarvesting ? COLORS.text.muted : '#F87171'} />
                <Text style={[styles.cancelBtnText, isHarvesting && { color: COLORS.text.muted }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Available — request inspection
            <TouchableOpacity
              style={styles.requestBtn}
              onPress={() => openRequestModal(item)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['rgba(34,197,94,0.18)', 'rgba(34,197,94,0.06)']}
                style={styles.requestBtnInner}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Icon name="clipboard-check-outline" size={15} color={COLORS.primary.main} />
                <Text style={styles.requestBtnText}>Request Inspection</Text>
                <Icon name="chevron-right" size={15} color={COLORS.primary.main} style={{ marginLeft: 'auto' }} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
          onPress={() => {
            console.log('FAB pressed, opening modal');
            setIsModalVisible(true);
          }}
        >
          <LinearGradient
            colors={COLORS.gradients.primary as string[]}
            style={styles.fabGradient}
          >
            <Icon name="plus" size={32} color="#000" />
          </LinearGradient>
        </TouchableOpacity>

      </SafeAreaView>

      {/* Add Farm Modal - Centered Popup */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => { setIsModalVisible(false); setShowItemDropdown(false); }}
      >
        <View style={styles.centeredOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { setIsModalVisible(false); setShowItemDropdown(false); }} />
          <View style={styles.centeredPopup}>
            {/* Header */}
            <LinearGradient
              colors={['rgba(34,197,94,0.15)', 'transparent']}
              style={styles.popupHeaderGradient}
            >
              <View style={styles.popupHeader}>
                <View style={styles.popupHeaderLeft}>
                  <View style={styles.popupIconBox}>
                    <Icon name="sprout" size={22} color={COLORS.primary.main} />
                  </View>
                  <Text style={styles.popupTitle}>Add New Farm</Text>
                </View>
                <TouchableOpacity
                  onPress={() => { setIsModalVisible(false); setShowItemDropdown(false); }}
                  style={styles.popupCloseBtn}
                >
                  <Icon name="close" size={20} color={COLORS.text.muted} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Form Body */}
            <ScrollView
              style={styles.popupScroll}
              contentContainerStyle={styles.popupScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={() => setShowItemDropdown(false)}
              scrollEventThrottle={16}
            >
              {/* Farmer Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Farmer Name</Text>
                <GlassInput
                  value={farmerName}
                  onChangeText={setFarmerName}
                  placeholder="e.g. Ramesh Kumar"
                  icon={<Icon name="account-outline" size={18} color={COLORS.primary.main} />}
                />
              </View>

              {/* Location */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Location / Village</Text>
                <GlassInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Nashik, Maharashtra"
                  icon={<Icon name="map-marker-outline" size={18} color={COLORS.primary.main} />}
                />
              </View>

              {/* Produce Type Dropdown */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Produce / Crop Type</Text>
                <TouchableOpacity
                  style={[styles.dropdownTrigger, showItemDropdown && styles.dropdownTriggerOpen]}
                  onPress={() => setShowItemDropdown(v => !v)}
                  activeOpacity={0.85}
                >
                  <View style={styles.dropdownTriggerLeft}>
                    <Icon name="leaf" size={18} color={COLORS.primary.main} />
                    <Text style={styles.dropdownTriggerText}>{produceType}</Text>
                  </View>
                  <Icon
                    name={showItemDropdown ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={COLORS.text.muted}
                  />
                </TouchableOpacity>

                {showItemDropdown && (
                  <View style={styles.dropdownMenu}>
                    {itemOptions.map((item, idx) => {
                      const isSelected = produceType === item;
                      const isLast = idx === itemOptions.length - 1;
                      const icons: Record<string, string> = {
                        Banana: 'food-apple-outline',
                        Plantain: 'food-apple-outline',
                        Mango: 'fruit-citrus',
                        Orange: 'fruit-citrus',
                        Papaya: 'leaf',
                        Guava: 'leaf',
                        Other: 'pencil-outline',
                      };
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemSelected,
                            !isLast && styles.dropdownItemBorder,
                          ]}
                          onPress={() => {
                            setProduceType(item);
                            if (item !== 'Other') setCustomItem('');
                            setShowItemDropdown(false);
                          }}
                        >
                          <Icon
                            name={icons[item] || 'leaf'}
                            size={18}
                            color={isSelected ? COLORS.primary.main : COLORS.text.muted}
                          />
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                            {item}
                          </Text>
                          {isSelected && (
                            <Icon name="check-circle" size={18} color={COLORS.primary.main} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Custom input shown when Other is selected */}
                {produceType === 'Other' && !showItemDropdown && (
                  <View style={styles.fieldGroupInner}>
                    <Text style={styles.fieldLabelSmall}>Specify Fruit / Crop</Text>
                    <GlassInput
                      value={customItem}
                      onChangeText={setCustomItem}
                      placeholder="e.g. Pomegranate, Litchi..."
                      icon={<Icon name="pencil-outline" size={18} color={COLORS.primary.main} />}
                    />
                  </View>
                )}
              </View>

              {/* GPS Coordinates */}
              <View style={styles.twoColRow}>
                <View style={[styles.twoColItem, { marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Latitude</Text>
                  <GlassInput
                    value={latitude}
                    onChangeText={setLatitude}
                    placeholder="e.g. 19.9975"
                    keyboardType="numeric"
                    icon={<Icon name="latitude" size={18} color={COLORS.primary.main} />}
                  />
                </View>
                <View style={[styles.twoColItem, { marginLeft: 8 }]}>
                  <Text style={styles.fieldLabel}>Longitude</Text>
                  <GlassInput
                    value={longitude}
                    onChangeText={setLongitude}
                    placeholder="e.g. 73.7898"
                    keyboardType="numeric"
                    icon={<Icon name="longitude" size={18} color={COLORS.primary.main} />}
                  />
                </View>
              </View>

              {/* Area + Contact row */}
              <View style={styles.twoColRow}>
                <View style={[styles.twoColItem, { marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Area (Acres)</Text>
                  <GlassInput
                    value={totalArea}
                    onChangeText={setTotalArea}
                    placeholder="0.0"
                    keyboardType="numeric"
                    icon={<Icon name="ruler-square" size={18} color={COLORS.primary.main} />}
                  />
                </View>
                <View style={[styles.twoColItem, { marginLeft: 8 }]}>
                  <Text style={styles.fieldLabel}>Contact No.</Text>
                  <GlassInput
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    placeholder="Phone"
                    keyboardType="phone-pad"
                    icon={<Icon name="phone-outline" size={18} color={COLORS.primary.main} />}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Footer Button */}
            <View style={styles.popupFooter}>
              <TouchableOpacity
                onPress={handleCreateFarm}
                disabled={createFarmMutation.isPending}
                style={{ width: '100%' }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={COLORS.button.primaryGradient as string[]}
                  style={styles.popupSubmitBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {createFarmMutation.isPending ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Icon name="sprout" size={20} color="#000" style={{ marginRight: 8 }} />
                      <Text style={styles.popupSubmitText}>Create Farm</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Request Inspection Modal */}
      <Modal
        visible={isRequestModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsRequestModalVisible(false)}
      >
        <View style={styles.centeredOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsRequestModalVisible(false)} />
          <View style={styles.centeredPopup}>

            {/* Header */}
            <LinearGradient
              colors={['rgba(34,197,94,0.15)', 'transparent']}
              style={styles.popupHeaderGradient}
            >
              <View style={styles.popupHeader}>
                <View style={styles.popupHeaderLeft}>
                  <View style={styles.popupIconBox}>
                    <Icon name="clipboard-check-outline" size={22} color={COLORS.primary.main} />
                  </View>
                  <View>
                    <Text style={styles.popupTitle}>Request Inspection</Text>
                    {selectedFarmForRequest && (
                      <Text style={{ fontSize: 12, color: COLORS.text.muted, marginTop: 2 }}>
                        {selectedFarmForRequest?.farmerName}
                        {selectedFarmForRequest?.produceType ? `  ·  ${selectedFarmForRequest.produceType}` : ''}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setIsRequestModalVisible(false)}
                  style={styles.popupCloseBtn}
                >
                  <Icon name="close" size={20} color={COLORS.text.muted} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Form Body */}
            <ScrollView
              style={styles.popupScroll}
              contentContainerStyle={styles.popupScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
            >
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Select Vendor</Text>
                {vendorsLoading ? (
                  <ActivityIndicator color={COLORS.primary.main} style={{ marginVertical: 8 }} />
                ) : (
                  <HorizontalScrollWrapper
                    containerStyle={{ marginTop: 4 }}
                    horizontalPadding={0}
                    itemGap={8}
                  >
                    {vendors?.map((vendor: any) => {
                      const isSelected = selectedVendorId === vendor.id;
                      return (
                        <TouchableOpacity
                          key={vendor.id}
                          style={[styles.vendorChip, isSelected && styles.vendorChipSelected]}
                          onPress={() => setSelectedVendorId(vendor.id)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.vendorChipDot, isSelected && styles.vendorChipDotSelected]}>
                            <Icon name="account" size={12} color={isSelected ? '#000' : COLORS.primary.main} />
                          </View>
                          <Text style={[styles.vendorChipText, isSelected && styles.vendorChipTextSelected]}>
                            {vendor.fullName || vendor.username}
                          </Text>
                          {isSelected && <Icon name="check" size={13} color={COLORS.primary.main} style={{ marginLeft: 4 }} />}
                        </TouchableOpacity>
                      );
                    })}
                  </HorizontalScrollWrapper>
                )}
              </View>

              {/* Visit Date */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Visit Date</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowVisitDatePicker(true)}
                >
                  <Icon name="calendar" size={18} color={COLORS.primary.main} />
                  <Text style={styles.dateSelectorText}>{visitDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <DatePicker modal open={showVisitDatePicker} date={visitDate} mode="date"
                  onConfirm={(d) => { setShowVisitDatePicker(false); setVisitDate(d); }}
                  onCancel={() => setShowVisitDatePicker(false)} />
              </View>

              {/* Place of Visit */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Place of Visit</Text>
                <GlassInput value={placeOfVisit} onChangeText={setPlaceOfVisit}
                  placeholder="Village / District" icon={<Icon name="map-marker-outline" size={18} color={COLORS.primary.main} />} />
              </View>

              {/* Visitor Details */}
              <View style={styles.twoColRow}>
                <View style={[styles.twoColItem, { marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Visitor Name</Text>
                  <GlassInput value={visitorName} onChangeText={setVisitorName}
                    placeholder="Name" icon={<Icon name="account-outline" size={18} color={COLORS.primary.main} />} />
                </View>
                <View style={[styles.twoColItem, { marginLeft: 8 }]}>
                  <Text style={styles.fieldLabel}>Visitor Contact</Text>
                  <GlassInput value={visitorContact} onChangeText={setVisitorContact}
                    placeholder="Phone" keyboardType="phone-pad" icon={<Icon name="phone-outline" size={18} color={COLORS.primary.main} />} />
                </View>
              </View>

              {/* Rates */}
              <View style={styles.twoColRow}>
                <View style={[styles.twoColItem, { marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Proposed Rate (₹/box)</Text>
                  <GlassInput value={proposedRate} onChangeText={setProposedRate}
                    keyboardType="numeric" placeholder="0.00" icon={<Icon name="currency-inr" size={18} color={COLORS.primary.main} />} />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Instructions / Notes</Text>
                <GlassInput
                  value={requestNotes}
                  onChangeText={setRequestNotes}
                  multiline
                  numberOfLines={3}
                  placeholder="e.g. Check for pest infestation on north field..."
                  icon={<Icon name="note-text-outline" size={18} color={COLORS.primary.main} />}
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.popupFooter}>
              <TouchableOpacity
                onPress={handleRequestInspection}
                disabled={createRequestMutation.isPending}
                style={{ width: '100%' }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={COLORS.button.primaryGradient as string[]}
                  style={styles.popupSubmitBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {createRequestMutation.isPending ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Icon name="send" size={18} color="#000" style={{ marginRight: 8 }} />
                      <Text style={styles.popupSubmitText}>Send Request</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </LinearGradient>
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
  dateSelector: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.05)', padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: SPACING.sm,
  },
  dateSelectorText: { fontSize: TYPOGRAPHY.sizes.md, color: COLORS.text.primary },

  // ── Farm Card (compact premium) ─────────────────────────────────────
  farmCard: {
    marginBottom: 10,
    backgroundColor: '#0D1B2A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    ...SHADOWS.card,
  },

  // Top row
  cardTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  cardIconPill: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cardMainInfo: { flex: 1, marginRight: 8 },
  farmName: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary, letterSpacing: -0.2 },
  farmLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  farmLocation: { fontSize: 12, color: COLORS.text.muted, flex: 1 },

  produceBadge: { backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)' },
  produceText: { fontSize: 10, color: COLORS.primary.main, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Details strip
  cardDetailsStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 10, flexWrap: 'wrap' },
  stripItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stripValue: { fontSize: 12, color: COLORS.text.secondary, fontWeight: '500' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginLeft: 'auto' },
  statusPillText: { fontSize: 11, fontWeight: '600' },

  // Action row
  cardActionRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 14, paddingVertical: 10 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockedText: { fontSize: 12, color: COLORS.text.muted, fontStyle: 'italic' },
  pendingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pendingLabel: { fontSize: 12, color: '#60A5FA', fontWeight: '500' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)', backgroundColor: 'rgba(248,113,113,0.08)' },
  cancelBtnDisabled: { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', opacity: 0.5 },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: '#F87171' },
  requestBtn: { borderRadius: 10, overflow: 'hidden' },
  requestBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)' },
  requestBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary.main },

  // Legacy (unused now but kept for Request modal)
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  iconContainer: { width: 40, height: 40, borderRadius: BORDER_RADIUS.full, backgroundColor: 'rgba(57, 255, 20, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  headerText: { flex: 1 },
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
  // Premium Modal Styles
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  dismissLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  premiumModalContent: {
    width: '100%',
    minHeight: '50%',
    maxHeight: '90%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    ...SHADOWS.modal,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 0,
    backgroundColor: '#0A0F1C',
  },
  premiumGradient: {
    flex: 1,
    width: '100%',
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  resetBtnText: {
    color: COLORS.status.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
  premiumFormScroll: { flexGrow: 0 },
  modalScroll: {
    flex: 1,
  },
  premiumFormContent: {
    padding: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.muted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  chipsContainer: {
    flexDirection: 'row',
    marginHorizontal: -SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  produceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 10,
  },
  produceChipSelected: {
    backgroundColor: COLORS.primary.main,
    borderColor: COLORS.primary.main,
    ...SHADOWS.glow,
  },
  produceChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  produceChipTextSelected: {
    color: '#000',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.lg,
  },
  statColumn: {
    flex: 1,
  },
  premiumFooter: {
    padding: SPACING.xl,
    paddingTop: 0,
  },
  premiumSubmitButton: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.buttonGlow,
  },
  premiumSubmitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 10,
  },
  footerSpacer: {
    height: 20,
  },

  // Inspection Request Modal Styles (Old)
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

  // Vendor chips (Request Inspection popup — compact horizontal list)
  vendorChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8 },
  vendorChipSelected: { borderColor: COLORS.primary.main, backgroundColor: 'rgba(34,197,94,0.12)' },
  vendorChipDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(34,197,94,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  vendorChipDotSelected: { backgroundColor: COLORS.primary.main },
  vendorChipText: { fontSize: 13, color: COLORS.text.secondary, fontWeight: '500' },
  vendorChipTextSelected: { color: COLORS.primary.main, fontWeight: '700' },

  // ── Centered Popup (Add Farm) ─────────────────────────────────────
  centeredOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  centeredPopup: {
    width: '100%',
    minHeight: '62%',
    maxHeight: '88%',
    backgroundColor: '#0D1B2A',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    ...SHADOWS.modal,
  },
  popupHeaderGradient: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  popupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popupIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: -0.3,
  },
  popupCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupScroll: {
    flex: 1,
  },
  popupScrollContent: {
    padding: SPACING.xl,
    paddingBottom: 8,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldGroupInner: {
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  fieldLabelSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary.main,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  twoColRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  twoColItem: {
    flex: 1,
  },
  popupFooter: {
    padding: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  popupSubmitBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.buttonGlow,
  },
  popupSubmitText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },

  // ── Dropdown ──────────────────────────────────────────────────────
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownTriggerOpen: {
    borderColor: COLORS.primary.main,
    backgroundColor: 'rgba(34,197,94,0.06)',
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownTriggerText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 10,
  },
  dropdownMenu: {
    marginTop: 4,
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginLeft: 12,
  },
  dropdownItemTextSelected: {
    color: COLORS.primary.main,
    fontWeight: '700',
  },
});

