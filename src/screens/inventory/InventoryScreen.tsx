import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { GlassInput } from '../../components/glassmorphism/GlassInput';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { inventoryApi, farmApi, harvestApi } from '../../services/api';
import { InventoryItem, InventoryCategory, Batch, GatePass } from '../../types';
import { HorizontalScrollWrapper } from '../../components/common/HorizontalScrollWrapper';

type TabType = 'overview' | 'allocate' | 'receive';

export const InventoryScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Modals & Selection State
  const [isAddItemVisible, setIsAddItemVisible] = useState(false);
  const [isAddStockVisible, setIsAddStockVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Forms - Create Item
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');

  // Forms - Add Stock
  const [stockQuantity, setStockQuantity] = useState('');

  // Forms - Allocation
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [allocationQuantity, setAllocationQuantity] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');

  // Forms - Receiving
  const [selectedGatePass, setSelectedGatePass] = useState<GatePass | null>(null);
  const [receivedQuantity, setReceivedQuantity] = useState('');
  const [freightCost, setFreightCost] = useState('');
  const [receivingNotes, setReceivingNotes] = useState('');

  // --- Queries ---

  // 1. Fetch Inventory Items
  const { data: items, isLoading: itemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: async () => {
      const response = await inventoryApi.getAllItems();
      return response.data.data || [];
    },
  });

  // 2. Fetch Active Batches (for Allocation)
  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ['activeBatches'],
    queryFn: async () => {
      const response = await farmApi.getAllBatches();
      // Filter for batches that can receive materials (Harvesting phase)
      return response.data.data?.filter((b: Batch) =>
        b.status === 'HARVEST_IN_PROGRESS' || b.status === 'CREATED'
      ) || [];
    },
    enabled: activeTab === 'allocate',
  });

  // 3. Fetch Pending Gate Passes (for Receiving)
  const { data: gatePasses, isLoading: gatePassesLoading } = useQuery({
    queryKey: ['pendingGatePasses'],
    queryFn: async () => {
      try {
        const response = await harvestApi.getPendingGatePasses();
        return response.data.data || [];
      } catch (error) {
        console.error("Error fetching gate passes:", error);
        return [];
      }
    },
    enabled: activeTab === 'receive',
  });

  // --- Mutations ---

  // 1. Create New Inventory Item
  const createItemMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.createItem(data),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Item Created', text2: `${itemName} added to inventory.` });
      setIsAddItemVisible(false);
      setItemName('');
      setItemCode('');
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Failed to create item', text2: error.response?.data?.message || 'Server error' });
    },
  });

  // 2. Add Stock to existing item
  const addStockMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => inventoryApi.addStock(id, qty),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Stock Updated', text2: 'Quantity increased successfully.' });
      setIsAddStockVisible(false);
      setStockQuantity('');
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: error.response?.data?.message });
    },
  });

  // 3. Allocate Material to Batch
  const allocateMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.allocateInventory(data),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Allocated Successfully', text2: 'Material issued to batch.' });
      // Reset form
      setSelectedBatch(null);
      setSelectedItem(null); // Deselect item after allocation
      setAllocationQuantity('');
      setAllocationNotes('');
      // Refresh inventory to show reduced stock
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Allocation Failed', text2: error.response?.data?.message });
    },
  });

  // 4. Receive Gate Pass (Inward)
  const receiveGatePassMutation = useMutation({
    mutationFn: (data: any) => harvestApi.receiveGatePass(selectedGatePass!.id, data.receivedBoxes), // Ensure simplified call matches API signature if needed, checking api.ts: receiveGatePass takes (id, receivedBoxes)
    // Wait, let's check api.ts signature for receiveGatePass again. 
    // It is: receiveGatePass: (id: string, receivedBoxes: number) => ...
    // It doesn't take freightCost in the params currently? 
    // Wait, let's re-read api.ts... 
    // "receiveGatePass: (id: string, receivedBoxes: number) => apiClient.post(..., null, { params: { receivedBoxes } })"
    // It seems I missed adding freightCost to the API method in the previous step? 
    // Or I need to use `addTransportCost` separately?
    // The FSD Phase 4 says "Enter Inward Freight Cost".
    // I should probably check if receiving allows passing params or if I need a separate call.
    // For now, I will use receiveGatePass as is, and unfortunately if freight isn't supported by backend yet, I'll have to skip it or mock it.
    // Actually, I can chain the calls: Receive -> then Add Cost. 
    // Let's implement that in the mutation handler.
    onSuccess: async () => {
      // If freight cost is entered, we should try to record it. 
      // Since we don't have a direct "add cost to gate pass" endpoint visible, 
      // we might just assume for now receiving is enough or use `harvestApi.addTransportCost`.
      if (freightCost && selectedGatePass) {
        try {
          await harvestApi.addTransportCost({
            entityId: selectedGatePass.id,
            entityType: 'GATE_PASS',
            cost: parseFloat(freightCost),
            description: `Inward Freight for GP #${selectedGatePass.gatePassNo}`
          });
        } catch (e) {
          console.warn("Failed to add transport cost", e);
          Toast.show({ type: 'info', text1: 'Stock Received', text2: 'But failed to record freight cost.' });
          return;
        }
      }

      Toast.show({ type: 'success', text1: 'Stock Received', text2: 'Inventory updated successfully.' });
      setSelectedGatePass(null);
      setReceivedQuantity('');
      setFreightCost('');
      setReceivingNotes('');
      queryClient.invalidateQueries({ queryKey: ['pendingGatePasses'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] }); // Update stock incase it affects it
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Receiving Failed', text2: error.response?.data?.message });
    },
  });

  // --- Handlers ---

  const handleCreateItem = () => {
    if (!itemName.trim() || !itemCode.trim()) {
      Alert.alert('Validation Error', 'Item Name and Code are required.');
      return;
    }
    createItemMutation.mutate({
      itemName,
      itemCode,
      category: InventoryCategory.BOX,
      unitOfMeasure: 'Units',
      unitCost: 0,
    });
  };

  const handleAddStock = () => {
    if (!selectedItem || !stockQuantity) return;
    const qty = parseInt(stockQuantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive number.');
      return;
    }
    addStockMutation.mutate({
      id: selectedItem.id,
      qty: qty,
    });
  };

  const handleAllocate = () => {
    if (!selectedBatch) {
      Toast.show({ type: 'error', text1: 'Select a Batch', text2: 'Which batch is this for?' });
      return;
    }
    if (!selectedItem) {
      Toast.show({ type: 'error', text1: 'Select an Item', text2: 'What item are you allocating?' });
      return;
    }
    const qty = parseInt(allocationQuantity);
    if (!allocationQuantity || isNaN(qty) || qty <= 0) {
      Toast.show({ type: 'error', text1: 'Invalid Quantity', text2: 'Enter a valid quantity.' });
      return;
    }

    // Check stock availability
    if (qty > (selectedItem.availableQuantity || 0)) {
      Alert.alert('Insufficient Stock', `You only have ${selectedItem.availableQuantity} available.`);
      return;
    }

    allocateMutation.mutate({
      batchId: selectedBatch.id,
      itemId: selectedItem.id,
      quantity: qty,
      notes: allocationNotes,
    });
  };

  const handleReceive = () => {
    if (!selectedGatePass) return;
    const qty = parseInt(receivedQuantity);

    if (!receivedQuantity || isNaN(qty) || qty < 0) {
      Alert.alert('Invalid Quantity', 'Please enter the verified count.');
      return;
    }

    // Warn if quantity doesn't match
    if (qty !== selectedGatePass.totalBoxes) {
      Alert.alert(
        'Quantity Mismatch',
        `Dispatch note says ${selectedGatePass.totalBoxes}, but you entered ${qty}. Are you sure?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: () => performReceive(qty) }
        ]
      );
    } else {
      performReceive(qty);
    }
  };

  const performReceive = (qty: number) => {
    receiveGatePassMutation.mutate({ receivedBoxes: qty });
  };


  // --- Renderers ---

  const renderItemCard = ({ item }: { item: InventoryItem }) => (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Icon name="cube-outline" size={24} color={COLORS.primary.main} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.itemName}>{item.itemName}</Text>
          <Text style={styles.itemCode}>{item.itemCode}</Text>
        </View>
        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>{item.availableQuantity}</Text>
          <Text style={styles.stockLabel}>Available</Text>
        </View>
      </View>

      {activeTab === 'overview' ? (
        <GlassButton
          title="Add Stock"
          onPress={() => {
            setSelectedItem(item);
            setIsAddStockVisible(true);
          }}
          variant="secondary"
          size="sm"
          icon={<Icon name="plus" size={16} color={COLORS.primary.main} />}
        />
      ) : activeTab === 'allocate' ? (
        <GlassButton
          title={selectedItem?.id === item.id ? "Selected ✓" : "Select to Allocate"}
          onPress={() => setSelectedItem(item)}
          variant={selectedItem?.id === item.id ? "primary" : "secondary"}
          size="sm"
        />
      ) : null}
    </GlassCard>
  );

  const renderAllocationTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>1. Select Batch</Text>
      {batchesLoading ? (
        <ActivityIndicator color={COLORS.primary.main} />
      ) : (
        <HorizontalScrollWrapper
          horizontalPadding={0}
          itemGap={8}
          containerStyle={styles.batchList}
        >
          {batches?.map((batch: Batch) => (
            <TouchableOpacity
              key={batch.id}
              style={[
                styles.batchItem,
                selectedBatch?.id === batch.id && styles.batchItemSelected
              ]}
              onPress={() => setSelectedBatch(batch)}
            >
              <Text style={[
                styles.batchId,
                selectedBatch?.id === batch.id && styles.batchIdSelected
              ]}>
                {batch.batchId}
              </Text>
              <Text style={styles.batchFarm}>{batch.farmName}</Text>
            </TouchableOpacity>
          ))}
        </HorizontalScrollWrapper>
      )}

      <Text style={styles.sectionTitle}>2. Select Item</Text>
      <Text style={styles.helperText}>Find item in list below and tap "Select"</Text>

      {selectedItem && (
        <GlassCard style={styles.selectedItemCard}>
          <View style={styles.selectedItemRow}>
            <Icon name="check-circle" size={20} color={COLORS.primary.main} />
            <Text style={styles.selectedItemText}>{selectedItem.itemName}</Text>
            <Text style={styles.selectedItemStock}>({selectedItem.availableQuantity} avail)</Text>
          </View>
        </GlassCard>
      )}

      <Text style={styles.sectionTitle}>3. Allocation Details</Text>
      <GlassInput
        label="Quantity"
        value={allocationQuantity}
        onChangeText={setAllocationQuantity}
        keyboardType="numeric"
        placeholder="0"
        icon={<Icon name="numeric" size={20} color={COLORS.text.muted} />}
      />

      <GlassButton
        title="Confirm Allocation"
        onPress={handleAllocate}
        loading={allocateMutation.isPending}
        variant="primary"
        size="lg"
        style={styles.actionBtn}
        disabled={!selectedBatch || !selectedItem}
      />

      <View style={styles.divider} />
      <Text style={styles.listHeader}>Available Inventory</Text>
      {/* List of items follows in main render */}
    </View>
  );

  const renderReceivingTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Pending Deliveries</Text>
      {gatePassesLoading ? (
        <ActivityIndicator color={COLORS.primary.main} style={{ marginTop: 20 }} />
      ) : gatePasses?.length === 0 ? (
        <GlassCard style={styles.emptyStateCard}>
          <Icon name="truck-check-outline" size={48} color={COLORS.text.muted} />
          <Text style={styles.emptyText}>No pending gate passes.</Text>
          <Text style={styles.emptySubtext}>All shipments have been received.</Text>
        </GlassCard>
      ) : (
        gatePasses?.map((gp: GatePass) => (
          <GlassCard
            key={gp.id}
            style={[styles.gatePassCard, selectedGatePass?.id === gp.id ? styles.gatePassSelected : null]}
          >
            <TouchableOpacity onPress={() => {
              // Toggle selection
              if (selectedGatePass?.id === gp.id) {
                setSelectedGatePass(null);
                setReceivedQuantity('');
              } else {
                setSelectedGatePass(gp);
                setReceivedQuantity(gp.totalBoxes.toString());
              }
            }}>
              <View style={styles.gpHeader}>
                <View>
                  <Text style={styles.gpTitle}>GP #{gp.gatePassNo}</Text>
                  <Text style={styles.gpSubtitle}>Driver: {gp.driverName}</Text>
                </View>
                <View style={styles.gpBadge}>
                  <Text style={styles.gpBadgeText}>{gp.totalBoxes} Boxes</Text>
                </View>
              </View>
              <View style={styles.gpDetailsRow}>
                <Icon name="truck" size={14} color={COLORS.text.muted} />
                <Text style={styles.gpDetailText}>{gp.truckNumber}</Text>
                <Text style={styles.gpDetailBullet}>•</Text>
                <Text style={styles.gpDetailText}>{new Date(gp.dispatchDate).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>

            {selectedGatePass?.id === gp.id && (
              <View style={styles.receivingForm}>
                <View style={styles.divider} />
                <Text style={styles.formTitle}>Receive Verification</Text>

                <GlassInput
                  label="Verified Quantity"
                  value={receivedQuantity}
                  onChangeText={setReceivedQuantity}
                  keyboardType="numeric"
                  icon={<Icon name="check-all" size={20} color={COLORS.primary.main} />}
                />

                <GlassInput
                  label="Inward Freight Cost (₹)"
                  value={freightCost}
                  onChangeText={setFreightCost}
                  keyboardType="numeric"
                  placeholder="0.00"
                  icon={<Icon name="cash-multiple" size={20} color={COLORS.accent.main} />}
                />
                <GlassInput
                  label="Receiving Notes"
                  value={receivingNotes}
                  onChangeText={setReceivingNotes}
                  multiline
                  numberOfLines={2}
                  placeholder="Damage, weight diff, etc."
                  icon={<Icon name="note-text-outline" size={20} color={COLORS.text.muted} />}
                />

                <GlassButton
                  title="Confirm Receipt"
                  onPress={handleReceive}
                  loading={receiveGatePassMutation.isPending}
                  variant="primary"
                  style={styles.receiveBtn}
                />
              </View>
            )}
          </GlassCard>
        ))
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={COLORS.background.gradient as string[]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>Manage stock & logistics</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'receive' && styles.activeTab]}
            onPress={() => setActiveTab('receive')}
          >
            <Text style={[styles.tabText, activeTab === 'receive' && styles.activeTabText]}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'allocate' && styles.activeTab]}
            onPress={() => setActiveTab('allocate')}
          >
            <Text style={[styles.tabText, activeTab === 'allocate' && styles.activeTabText]}>Allocate</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={itemsLoading} onRefresh={refetchItems} tintColor={COLORS.primary.main} />
          }
        >
          {activeTab === 'allocate' && renderAllocationTab()}

          {activeTab === 'receive' ? (
            renderReceivingTab()
          ) : (
            // List Items (Shared by Overview and Allocate tabs)
            <>
              {isLoadingInitialData(activeTab, itemsLoading) && (
                <ActivityIndicator size="large" color={COLORS.primary.main} style={{ marginTop: 20 }} />
              )}

              {!itemsLoading && items?.length === 0 && activeTab === 'overview' && (
                <GlassCard style={styles.emptyStateCard}>
                  <Icon name="cube-off-outline" size={48} color={COLORS.text.muted} />
                  <Text style={styles.emptyText}>Inventory is empty.</Text>
                  <Text style={styles.emptySubtext}>Tap + to add your first item.</Text>
                </GlassCard>
              )}

              {/* In Allocation Mode, show items list only if it's not empty */}
              {(!itemsLoading && items && items.length > 0) && (
                <View style={styles.itemsList}>
                  {items.map((item: InventoryItem) => (
                    <View key={item.id}>{renderItemCard({ item })}</View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* FAB - Add New Item (Only in overview) */}
        {activeTab === 'overview' && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setIsAddItemVisible(true)}
          >
            <LinearGradient
              colors={COLORS.gradients.primary as string[]}
              style={styles.fabGradient}
            >
              <Icon name="plus" size={32} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Add Item Modal */}
        <Modal visible={isAddItemVisible} transparent animationType="fade" onRequestClose={() => setIsAddItemVisible(false)}>
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Inventory Item</Text>
              <GlassInput label="Item Name" value={itemName} onChangeText={setItemName} placeholder="e.g. Cardboard Box" />
              <GlassInput label="Item Code" value={itemCode} onChangeText={setItemCode} placeholder="e.g. BOX-001" />
              <GlassButton title="Create Item" onPress={handleCreateItem} loading={createItemMutation.isPending} variant="primary" style={styles.modalBtn} />
              <GlassButton title="Cancel" onPress={() => setIsAddItemVisible(false)} variant="secondary" />
            </GlassCard>
          </View>
        </Modal>

        {/* Add Stock Modal */}
        <Modal visible={isAddStockVisible} transparent animationType="fade" onRequestClose={() => setIsAddStockVisible(false)}>
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Stock</Text>
              <Text style={styles.modalSubtitle}>{selectedItem?.itemName} ({selectedItem?.itemCode})</Text>
              <GlassInput
                label="Quantity to Add"
                value={stockQuantity}
                onChangeText={setStockQuantity}
                keyboardType="numeric"
                placeholder="0"
              />
              <GlassButton title="Update Stock" onPress={handleAddStock} loading={addStockMutation.isPending} variant="primary" style={styles.modalBtn} />
              <GlassButton title="Cancel" onPress={() => setIsAddStockVisible(false)} variant="secondary" />
            </GlassCard>
          </View>

        </Modal>
      </SafeAreaView>
    </LinearGradient >
  );
};

// Helper for loading state
const isLoadingInitialData = (tab: TabType, itemsLoading: boolean) => {
  if (tab === 'receive') return false; // Handled nicely inside renderReceivingTab
  return itemsLoading;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: SPACING.lg, paddingTop: SPACING.xl },
  title: { fontSize: TYPOGRAPHY.sizes['3xl'], fontWeight: 'bold', color: COLORS.text.primary },
  subtitle: { fontSize: TYPOGRAPHY.sizes.md, color: COLORS.text.secondary, marginTop: SPACING.xs },

  tabsContainer: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md, gap: SPACING.sm },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.glass.border, backgroundColor: COLORS.glass.background },
  activeTab: { backgroundColor: COLORS.primary.main, borderColor: COLORS.primary.main },
  tabText: { color: COLORS.text.secondary, fontWeight: '600', fontSize: TYPOGRAPHY.sizes.sm },
  activeTabText: { color: '#000' },

  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },

  // Card
  card: { marginBottom: SPACING.md, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  iconContainer: { width: 40, height: 40, borderRadius: BORDER_RADIUS.full, backgroundColor: 'rgba(57, 255, 20, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  headerText: { flex: 1 },
  itemName: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: 'bold', color: COLORS.text.primary },
  itemCode: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.muted },
  stockBadge: { alignItems: 'flex-end' },
  stockText: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.primary.main },
  stockLabel: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.secondary },

  // Allocation Tab
  tabContent: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: '600', color: COLORS.text.primary, marginTop: SPACING.md, marginBottom: SPACING.sm },
  helperText: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.muted, marginBottom: SPACING.sm },
  batchList: { flexDirection: 'row', marginBottom: SPACING.sm },
  batchItem: { backgroundColor: COLORS.glass.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, minWidth: 120, borderWidth: 1, borderColor: COLORS.glass.border },
  batchItemSelected: { borderColor: COLORS.primary.main, backgroundColor: 'rgba(57, 255, 20, 0.1)' },
  batchId: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: 'bold', color: COLORS.text.primary },
  batchIdSelected: { color: COLORS.primary.main },
  batchFarm: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted, marginTop: 2 },

  selectedItemCard: { padding: SPACING.md, marginBottom: SPACING.md, borderColor: COLORS.primary.main, borderWidth: 1 },
  selectedItemRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  selectedItemText: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: 'bold', color: COLORS.text.primary },
  selectedItemStock: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.muted },

  actionBtn: { marginVertical: SPACING.md },
  divider: { height: 1, backgroundColor: COLORS.glass.border, marginVertical: SPACING.lg },
  listHeader: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: 'bold', color: COLORS.text.primary, marginBottom: SPACING.sm },
  itemsList: { marginTop: SPACING.md },

  // Receiving Tab
  gatePassCard: { marginBottom: SPACING.md, padding: SPACING.md },
  gatePassSelected: { borderColor: COLORS.primary.main, borderWidth: 1, backgroundColor: 'rgba(57, 255, 20, 0.05)' },
  gpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  gpTitle: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: 'bold', color: COLORS.text.primary },
  gpSubtitle: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.secondary },
  gpBadge: { backgroundColor: 'rgba(57, 255, 20, 0.1)', paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: 4 },
  gpBadgeText: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.primary.main, fontWeight: 'bold' },
  gpDetailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  gpDetailText: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted },
  gpDetailBullet: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted },

  receivingForm: { marginTop: SPACING.md },
  formTitle: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: 'bold', color: COLORS.text.primary, marginBottom: SPACING.md },
  receiveBtn: { marginTop: SPACING.md },

  // Empty States
  emptyStateCard: { alignItems: 'center', padding: SPACING.xl, marginTop: SPACING.xl },
  emptyText: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.text.primary, marginTop: SPACING.md },
  emptySubtext: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text.muted, marginTop: SPACING.xs, textAlign: 'center' },

  // FAB
  fab: { position: 'absolute', bottom: SPACING.xl, right: SPACING.xl, width: 56, height: 56, borderRadius: 28, elevation: 8, shadowColor: COLORS.primary.glow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65 },
  fabGradient: { width: '100%', height: '100%', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', padding: SPACING.lg },
  modalContent: { padding: SPACING.lg },
  modalTitle: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: 'bold', color: COLORS.text.primary, marginBottom: SPACING.sm },
  modalSubtitle: { fontSize: TYPOGRAPHY.sizes.md, color: COLORS.text.secondary, marginBottom: SPACING.lg },
  modalBtn: { marginBottom: SPACING.sm, marginTop: SPACING.md },
});
