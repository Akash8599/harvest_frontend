import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import DatePicker from 'react-native-date-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { GlassCard } from '../../components/glassmorphism/GlassCard';
import { GlassButton } from '../../components/glassmorphism/GlassButton';
import { GlassInput } from '../../components/glassmorphism/GlassInput';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { salesApi, farmApi } from '../../services/api';
import { Batch, SaleType, SaleRequest } from '../../types';


export const SalesScreen: React.FC = () => {
  const queryClient = useQueryClient();

  // Form state
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [saleType, setSaleType] = useState<SaleType>(SaleType.DOMESTIC);
  const [totalBoxes, setTotalBoxes] = useState('');
  const [pricePerBox, setPricePerBox] = useState('');
  const [taxPercentage, setTaxPercentage] = useState('18'); // Default 18% GST
  const [saleDate, setSaleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Sharing state
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [sharePhone, setSharePhone] = useState('');
  const [shareEmail, setShareEmail] = useState('');

  // Fetch completed batches
  const { data: batchesData, isLoading: batchesLoading } = useQuery({
    queryKey: ['completedBatches'],
    queryFn: async () => {
      const response = await farmApi.getAllBatches();
      return response.data.data?.filter((b: Batch) => b.status === 'COMPLETED');
    },
  });

  // Fetch all sales
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['allSales'],
    queryFn: async () => {
      const response = await salesApi.getAllSales();
      return response.data.data;
    },
  });

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: (data: SaleRequest) => salesApi.createSale(data),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Sale Created',
        text2: 'Invoice has been generated successfully.',
      });
      // Reset form
      setSelectedBatch(null);
      setBuyerName('');
      setBuyerContact('');
      setBuyerAddress('');
      setTotalBoxes('');
      setPricePerBox('');
      setTaxPercentage('18');
      // Refresh sales
      queryClient.invalidateQueries({ queryKey: ['allSales'] });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Creation Failed',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    },
  });

  // Download PDF mutation
  const downloadPdfMutation = useMutation({
    mutationFn: (saleId: string) => salesApi.downloadInvoicePdf(saleId),
    onSuccess: async (response, saleId) => {
      try {
        // Save PDF to device
        const fileName = `invoice_${saleId}.pdf`;
        const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;

        // Convert blob to base64 and save
        const reader = new FileReader();
        reader.readAsDataURL(response.data);
        reader.onloadend = async () => {
          const base64data = reader.result?.toString().split(',')[1];
          if (base64data) {
            await RNFS.writeFile(path, base64data, 'base64');
            Toast.show({
              type: 'success',
              text1: 'PDF Downloaded',
              text2: `Saved to ${path}`,
            });
          }
        };
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Download Failed',
          text2: 'Could not save PDF file',
        });
      }
    },
  });

  // Share via WhatsApp
  const shareViaWhatsApp = async (sale: any) => {
    if (!sharePhone) {
      Toast.show({ type: 'error', text1: 'Please enter phone number' });
      return;
    }

    try {
      // Get WhatsApp share link
      const response = await salesApi.getWhatsAppShareLink(sale.id, sharePhone);
      const link = response.data.data;

      // Open WhatsApp
      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      } else {
        Toast.show({ type: 'error', text1: 'WhatsApp not installed' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to generate share link' });
    }
  };

  // Share via Email
  const shareViaEmail = async (sale: any) => {
    if (!shareEmail) {
      Toast.show({ type: 'error', text1: 'Please enter email address' });
      return;
    }

    try {
      await salesApi.shareInvoiceViaEmail(sale.id, shareEmail);
      Toast.show({
        type: 'success',
        text1: 'Email Sent',
        text2: `Invoice sent to ${shareEmail}`,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to send email',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    }
  };

  // Share PDF
  const sharePdf = async (sale: any) => {
    try {
      const response = await salesApi.downloadInvoicePdf(sale.id);

      // Create temp file
      const fileName = `invoice_${sale.invoiceNumber}.pdf`;
      const path = `${RNFS.CachesDirectoryPath}/${fileName}`;

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(response.data);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (base64data) {
          await RNFS.writeFile(path, base64data, 'base64');

          // Share file
          await Share.open({
            url: `file://${path}`,
            type: 'application/pdf',
            filename: fileName,
            message: `Invoice ${sale.invoiceNumber} from Banana Harvest Export`,
          });
        }
      };
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to share PDF' });
    }
  };

  // Create sale
  const createSale = () => {
    if (!selectedBatch) {
      Toast.show({ type: 'error', text1: 'Please select a batch' });
      return;
    }
    if (!buyerName) {
      Toast.show({ type: 'error', text1: 'Please enter buyer name' });
      return;
    }
    if (!totalBoxes || parseInt(totalBoxes) <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter total boxes' });
      return;
    }
    if (!pricePerBox || parseFloat(pricePerBox) <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter price per box' });
      return;
    }

    const request: SaleRequest = {
      batchId: selectedBatch.id,
      buyerName,
      buyerContact: buyerContact || undefined,
      buyerAddress: buyerAddress || undefined,
      saleType,
      totalBoxes: parseInt(totalBoxes),
      pricePerBox: parseFloat(pricePerBox),
      currency: saleType === SaleType.DOMESTIC ? 'INR' : 'USD',
      exchangeRate: saleType === SaleType.EXPORT ? 83.5 : 1, // Example rate
      taxPercentage: saleType === SaleType.DOMESTIC ? parseFloat(taxPercentage) : 0,
      saleDate: saleDate.toISOString().split('T')[0],
    };

    createSaleMutation.mutate(request);
  };

  // Calculate totals
  const calculateTotals = () => {
    const boxes = parseInt(totalBoxes) || 0;
    const price = parseFloat(pricePerBox) || 0;
    const tax = parseFloat(taxPercentage) || 0;

    const subtotal = boxes * price;
    const taxAmount = subtotal * (tax / 100);
    const grandTotal = subtotal + taxAmount;

    return { subtotal, taxAmount, grandTotal };
  };

  const { subtotal, taxAmount, grandTotal } = calculateTotals();

  return (
    <LinearGradient colors={COLORS.background.gradient as string[]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Sales & Invoicing</Text>

          {/* Create Sale Form */}
          <GlassCard style={styles.formCard}>
            <Text style={styles.sectionTitle}>Create New Sale</Text>

            {/* Batch Selection */}
            <Text style={styles.label}>Select Batch</Text>
            {batchesLoading ? (
              <ActivityIndicator color={COLORS.primary.main} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.batchList}>
                {batchesData?.map((batch: Batch) => (
                  <TouchableOpacity
                    key={batch.id}
                    style={[
                      styles.batchItem,
                      selectedBatch?.id === batch.id && styles.batchItemSelected,
                    ]}
                    onPress={() => setSelectedBatch(batch)}
                  >
                    <Icon
                      name="package-variant"
                      size={24}
                      color={selectedBatch?.id === batch.id ? COLORS.primary.main : COLORS.text.secondary}
                    />
                    <Text style={[
                      styles.batchId,
                      selectedBatch?.id === batch.id && styles.batchIdSelected,
                    ]}>
                      {batch.batchId}
                    </Text>
                    <Text style={styles.batchInfo}>{batch.actualBoxes} boxes</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Sale Type */}
            <Text style={styles.label}>Sale Type</Text>
            <View style={styles.saleTypeRow}>
              <TouchableOpacity
                style={[
                  styles.saleTypeButton,
                  saleType === SaleType.DOMESTIC && styles.saleTypeActive,
                ]}
                onPress={() => setSaleType(SaleType.DOMESTIC)}
              >
                <Icon
                  name="map-marker"
                  size={20}
                  color={saleType === SaleType.DOMESTIC ? COLORS.primary.main : COLORS.text.secondary}
                />
                <Text style={[
                  styles.saleTypeText,
                  saleType === SaleType.DOMESTIC && styles.saleTypeTextActive,
                ]}>Domestic</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saleTypeButton,
                  saleType === SaleType.EXPORT && styles.saleTypeActive,
                ]}
                onPress={() => setSaleType(SaleType.EXPORT)}
              >
                <Icon
                  name="airplane"
                  size={20}
                  color={saleType === SaleType.EXPORT ? COLORS.accent.main : COLORS.text.secondary}
                />
                <Text style={[
                  styles.saleTypeText,
                  saleType === SaleType.EXPORT && styles.saleTypeTextActive,
                ]}>Export</Text>
              </TouchableOpacity>
            </View>

            {/* Buyer Details */}
            <GlassInput
              label="Buyer Name"
              placeholder="Enter buyer name"
              value={buyerName}
              onChangeText={setBuyerName}
              icon={<Icon name="account" size={20} color={COLORS.text.muted} />}
            />

            <GlassInput
              label="Buyer Contact"
              placeholder="Phone or email"
              value={buyerContact}
              onChangeText={setBuyerContact}
              icon={<Icon name="phone" size={20} color={COLORS.text.muted} />}
            />

            <GlassInput
              label="Buyer Address"
              placeholder="Enter address"
              value={buyerAddress}
              onChangeText={setBuyerAddress}
              multiline
              numberOfLines={2}
              icon={<Icon name="map-marker" size={20} color={COLORS.text.muted} />}
            />

            {/* Sale Details */}
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <GlassInput
                  label="Total Boxes"
                  placeholder="e.g., 625"
                  value={totalBoxes}
                  onChangeText={setTotalBoxes}
                  keyboardType="numeric"
                  icon={<Icon name="package-variant" size={20} color={COLORS.text.muted} />}
                />
              </View>
              <View style={styles.halfInput}>
                <GlassInput
                  label={`Price/Box (${saleType === SaleType.DOMESTIC ? '₹' : '$'})`}
                  placeholder="e.g., 150"
                  value={pricePerBox}
                  onChangeText={setPricePerBox}
                  keyboardType="numeric"
                  icon={<Icon name="cash" size={20} color={COLORS.text.muted} />}
                />
              </View>
            </View>

            {saleType === SaleType.DOMESTIC && (
              <GlassInput
                label="GST (%)"
                placeholder="e.g., 18"
                value={taxPercentage}
                onChangeText={setTaxPercentage}
                keyboardType="numeric"
                icon={<Icon name="percent" size={20} color={COLORS.text.muted} />}
              />
            )}

            {/* Date Selection */}
            <View style={styles.dateSection}>
              <Text style={styles.label}>Sale Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar" size={20} color={COLORS.primary.main} />
                <Text style={styles.dateText}>
                  {saleDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <DatePicker
                modal
                open={showDatePicker}
                date={saleDate}
                mode="date"
                maximumDate={new Date()}
                onConfirm={(date) => {
                  setShowDatePicker(false);
                  setSaleDate(date);
                }}
                onCancel={() => setShowDatePicker(false)}
              />
            </View>

            {/* Totals */}
            <GlassCard style={styles.totalsCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>
                  {saleType === SaleType.DOMESTIC ? '₹' : '$'}{subtotal.toFixed(2)}
                </Text>
              </View>
              {saleType === SaleType.DOMESTIC && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>GST ({taxPercentage}%):</Text>
                  <Text style={styles.totalValue}>₹{taxAmount.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                <Text style={styles.grandTotalValue}>
                  {saleType === SaleType.DOMESTIC ? '₹' : '$'}{grandTotal.toFixed(2)}
                </Text>
              </View>
            </GlassCard>

            {/* Create Button */}
            <GlassButton
              title="Create Invoice"
              onPress={createSale}
              loading={createSaleMutation.isPending}
              variant="primary"
              size="lg"
              style={styles.submitButton}
            />
          </GlassCard>

          {/* Sales List */}
          <Text style={styles.sectionTitle}>Recent Sales</Text>
          {salesLoading ? (
            <ActivityIndicator color={COLORS.primary.main} />
          ) : salesData?.length === 0 ? (
            <GlassCard>
              <Text style={styles.emptyText}>No sales created yet</Text>
            </GlassCard>
          ) : (
            salesData?.map((sale: any) => (
              <GlassCard key={sale.id} style={styles.saleCard}>
                <View style={styles.saleHeader}>
                  <View>
                    <Text style={styles.saleInvoice}>{sale.invoiceNumber}</Text>
                    <Text style={styles.saleBuyer}>{sale.buyerName}</Text>
                  </View>
                  <View style={[
                    styles.saleTypeBadge,
                    sale.saleType === 'EXPORT' && styles.saleTypeExport,
                  ]}>
                    <Text style={styles.saleTypeBadgeText}>{sale.saleType}</Text>
                  </View>
                </View>

                <View style={styles.saleDetails}>
                  <Text style={styles.saleDetail}>
                    <Icon name="package-variant" size={14} color={COLORS.text.muted} /> {sale.totalBoxes} boxes
                  </Text>
                  <Text style={styles.saleDetail}>
                    <Icon name="cash" size={14} color={COLORS.primary.main} />
                    {sale.currency === 'INR' ? '₹' : '$'}{sale.grandTotal}
                  </Text>
                </View>

                {/* Sharing Section */}
                {selectedSale?.id === sale.id && (
                  <View style={styles.sharingSection}>
                    <Text style={styles.sharingTitle}>Share Invoice</Text>

                    {/* WhatsApp */}
                    <View style={styles.shareRow}>
                      <GlassInput
                        label=""
                        placeholder="WhatsApp number"
                        value={sharePhone}
                        onChangeText={setSharePhone}
                        style={styles.shareInput}
                        icon={<Icon name="whatsapp" size={20} color="#25D366" />}
                      />
                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={() => shareViaWhatsApp(sale)}
                      >
                        <Icon name="send" size={20} color={COLORS.text.primary} />
                      </TouchableOpacity>
                    </View>

                    {/* Email */}
                    <View style={styles.shareRow}>
                      <GlassInput
                        label=""
                        placeholder="Email address"
                        value={shareEmail}
                        onChangeText={setShareEmail}
                        style={styles.shareInput}
                        icon={<Icon name="email" size={20} color={COLORS.accent.main} />}
                      />
                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={() => shareViaEmail(sale)}
                      >
                        <Icon name="send" size={20} color={COLORS.text.primary} />
                      </TouchableOpacity>
                    </View>

                    {/* PDF Actions */}
                    <View style={styles.pdfActions}>
                      <TouchableOpacity
                        style={styles.pdfButton}
                        onPress={() => downloadPdfMutation.mutate(sale.id)}
                      >
                        <Icon name="download" size={18} color={COLORS.primary.main} />
                        <Text style={styles.pdfButtonText}>Download PDF</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.pdfButton}
                        onPress={() => sharePdf(sale)}
                      >
                        <Icon name="share-variant" size={18} color={COLORS.accent.main} />
                        <Text style={styles.pdfButtonText}>Share PDF</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Toggle Share */}
                <TouchableOpacity
                  style={styles.toggleShareButton}
                  onPress={() => setSelectedSale(selectedSale?.id === sale.id ? null : sale)}
                >
                  <Icon
                    name={selectedSale?.id === sale.id ? "chevron-up" : "share-variant"}
                    size={18}
                    color={COLORS.text.secondary}
                  />
                  <Text style={styles.toggleShareText}>
                    {selectedSale?.id === sale.id ? 'Hide Sharing' : 'Share Invoice'}
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },
  title: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
  formCard: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  batchList: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  batchItem: {
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  batchItemSelected: {
    borderColor: COLORS.primary.main,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
  },
  batchId: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  batchIdSelected: {
    color: COLORS.primary.main,
  },
  batchInfo: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  saleTypeRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  saleTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    gap: SPACING.sm,
  },
  saleTypeActive: {
    borderColor: COLORS.primary.main,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
  },
  saleTypeText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  saleTypeTextActive: {
    color: COLORS.primary.main,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  dateSection: {
    marginBottom: SPACING.md,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  dateText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  totalsCard: {
    marginVertical: SPACING.md,
    backgroundColor: 'rgba(57, 255, 20, 0.05)',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.primary,
  },
  grandTotalRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
  grandTotalLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  grandTotalValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: 'bold',
    color: COLORS.primary.main,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.muted,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  saleCard: {
    marginBottom: SPACING.md,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  saleInvoice: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: 'bold',
    color: COLORS.primary.main,
  },
  saleBuyer: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  saleTypeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.status.success,
  },
  saleTypeExport: {
    backgroundColor: COLORS.accent.main,
  },
  saleTypeBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  saleDetails: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  saleDetail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
  sharingSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
  },
  sharingTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  shareInput: {
    flex: 1,
  },
  shareButton: {
    backgroundColor: COLORS.primary.main,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  pdfActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  pdfButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  pdfButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
  toggleShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glass.border,
    gap: SPACING.xs,
  },
  toggleShareText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
});
