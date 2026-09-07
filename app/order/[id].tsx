import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import AppButton from '../../components/ui/AppButton';
import EmptyState from '../../components/ui/EmptyState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { mockDetailedOrders, TrackStatus } from '../../data/mockOrders';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Retrieve order details by ID
  const order = mockDetailedOrders.find((o) => o.id === id || o.id === `CB${id}`);

  // Safe fallback if order ID is invalid
  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenContainer scrollable={false} hasPadding={false}>
          <View style={styles.headerPadding}>
            <Header title="Order Tracking" subtitle="Order not found" showBack />
          </View>
          <EmptyState
            iconName="search-outline"
            title="Order Not Found"
            description="We couldn't find the requested order. Please check your order history."
            buttonTitle="Back to Orders"
            onButtonPress={() => router.replace('/(customer)/orders')}
          />
        </ScreenContainer>
      </SafeAreaView>
    );
  }

  // 4-step vertical timeline definitions
  const timelineSteps: {
    key: TrackStatus;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      key: 'confirmed',
      title: 'Order Confirmed',
      description: 'Your order has been received by restaurant',
      icon: 'receipt-outline',
    },
    {
      key: 'preparing',
      title: 'Preparing',
      description: 'Our kitchen is preparing your meal',
      icon: 'restaurant-outline',
    },
    {
      key: 'ready',
      title: 'Ready for Delivery',
      description: 'Your order is packed and ready to leave',
      icon: 'bicycle-outline',
    },
    {
      key: 'delivered',
      title: 'Delivered',
      description: 'Enjoy your CeylonBite meal!',
      icon: 'home-outline',
    },
  ];

  const getStepIndex = (st: TrackStatus) => {
    switch (st) {
      case 'confirmed': return 0;
      case 'preparing': return 1;
      case 'ready': return 2;
      case 'delivered': return 3;
      case 'cancelled': return -1;
    }
  };

  const currentStepIndex = getStepIndex(order.status);

  const handleCallRestaurant = () => {
    Alert.alert('Call Restaurant', 'Calling CeylonBite Flagship Branch (+94 11 234 5678)...');
  };

  const handleContactSupport = () => {
    Alert.alert('Customer Support', 'Connecting to 24/7 CeylonBite Live Chat Support...');
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <Header
        title="Order Tracking"
        subtitle={`Order #${order.id} • ${order.placedTime}`}
        showBack
      />

      {/* Top Status & Estimated Delivery Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <View style={styles.orderIdGroup}>
            <Text style={styles.orderIdText}>Order #{order.id}</Text>
            <Text style={styles.placedText}>{order.placedTime}</Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{order.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.estTimeRow}>
          <Ionicons name="time" size={22} color={Colors.primary} />
          <View style={styles.estTimeGroup}>
            <Text style={styles.estLabel}>Estimated Delivery Time</Text>
            <Text style={styles.estValText}>⚡ {order.estimatedDelivery}</Text>
          </View>
        </View>
      </View>

      {/* Vertical Status Timeline Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live Status</Text>

        <View style={styles.timelineContainer}>
          {timelineSteps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isUpcoming = idx > currentStepIndex;

            return (
              <View key={step.key} style={styles.timelineRow}>
                {/* Connector Line */}
                {idx < timelineSteps.length - 1 && (
                  <View
                    style={[
                      styles.timelineConnector,
                      isCompleted ? styles.connectorCompleted : styles.connectorUpcoming,
                    ]}
                  />
                )}

                {/* Node Dot */}
                <View
                  style={[
                    styles.nodeCircle,
                    isCompleted && styles.nodeCompleted,
                    isCurrent && styles.nodeCurrent,
                    isUpcoming && styles.nodeUpcoming,
                  ]}
                >
                  <Ionicons
                    name={isCompleted ? 'checkmark' : step.icon}
                    size={14}
                    color={
                      isCompleted
                        ? Colors.white
                        : isCurrent
                        ? Colors.white
                        : Colors.secondaryText
                    }
                  />
                </View>

                {/* Step Details */}
                <View style={styles.stepContent}>
                  <Text
                    style={[
                      styles.stepTitle,
                      isCurrent && styles.stepTitleCurrent,
                      isCompleted && styles.stepTitleCompleted,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text style={styles.stepSub}>{step.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Delivery Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location-outline" size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>Delivery Details</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Address</Text>
          <Text style={styles.detailVal}>{order.deliveryAddress}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Delivery Type</Text>
          <Text style={styles.detailVal}>{order.deliveryType}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Method</Text>
          <Text style={styles.detailVal}>{order.paymentMethod}</Text>
        </View>
      </View>

      {/* Your Order Items Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Order ({order.items.length} items)</Text>
        {order.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Image source={{ uri: item.image }} style={styles.itemThumbnail} contentFit="cover" />
            <View style={styles.itemMeta}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>Quantity: x{item.quantity}</Text>
              {item.customization && (
                <Text style={styles.customizationText}>{item.customization}</Text>
              )}
            </View>
            <Text style={styles.itemLineTotal}>
              LKR {(item.unitPrice * item.quantity).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {/* Payment Breakdown Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Breakdown</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryVal}>LKR {order.subtotal.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryVal}>LKR {order.deliveryFee.toLocaleString()}</Text>
        </View>
        {order.discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.discountLabel}>Promo Discount</Text>
            <Text style={styles.discountVal}>- LKR {order.discount.toLocaleString()}</Text>
          </View>
        )}
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalVal}>LKR {order.total.toLocaleString()}</Text>
        </View>
      </View>

      {/* Need Help? Support Actions */}
      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>Need Help With Your Order?</Text>
        <Text style={styles.supportSub}>
          Our CeylonBite support team is available 24/7 to assist you.
        </Text>
        <View style={styles.supportBtnRow}>
          <AppButton
            title="Call Restaurant"
            onPress={handleCallRestaurant}
            size="small"
            variant="outline"
            style={styles.supportBtn}
          />
          <AppButton
            title="Contact Support"
            onPress={handleContactSupport}
            size="small"
            variant="secondary"
            style={styles.supportBtn}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerPadding: {
    paddingHorizontal: Spacing.md,
  },
  container: {
    paddingBottom: Spacing.xxl,
  },

  // Overview Card
  overviewCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.xl,
    padding: Spacing.md + 2,
    marginBottom: Spacing.md,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdGroup: {
    flex: 1,
  },
  orderIdText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
  },
  placedText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: Spacing.md,
  },
  estTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  estTimeGroup: {
    flex: 1,
  },
  estLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  estValText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 1,
  },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: Spacing.xs + 2,
  },

  // Timeline
  timelineContainer: {
    paddingLeft: Spacing.xs,
    marginTop: Spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    left: 13,
    top: 26,
    width: 2,
    bottom: -Spacing.lg + 2,
  },
  connectorCompleted: {
    backgroundColor: Colors.success,
  },
  connectorUpcoming: {
    backgroundColor: Colors.border,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    zIndex: 2,
  },
  nodeCompleted: {
    backgroundColor: Colors.success,
  },
  nodeCurrent: {
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.lightOrange,
  },
  nodeUpcoming: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  stepTitleCurrent: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
  },
  stepTitleCompleted: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  stepSub: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },

  // Details Card
  detailRow: {
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 1,
  },

  // Item Rows
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemThumbnail: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
  },
  itemMeta: {
    flex: 1,
    marginLeft: Spacing.md - 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 1,
  },
  customizationText: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  itemLineTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },

  // Summary Breakdown
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.secondaryText,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  discountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
  },
  discountVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },

  // Support
  supportCard: {
    backgroundColor: Colors.lightOrange,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  supportSub: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginVertical: 4,
  },
  supportBtnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  supportBtn: {
    flex: 1,
  },
});
