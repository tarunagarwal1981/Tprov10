import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { BRAND } from '@/lib/branding';

// Register fonts if needed (optional)
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1f2937',
  },
  coverPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 40,
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#004E89',
    marginBottom: 20,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 40,
    textAlign: 'center',
  },
  coverInfo: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 10,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004E89',
    marginBottom: 15,
    borderBottom: '2px solid #00B4D8',
    paddingBottom: 5,
  },
  daySection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  timeSlot: {
    marginBottom: 15,
    paddingLeft: 10,
    borderLeft: '3px solid #00B4D8',
  },
  timeSlotTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  activityItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  activityTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  activityDetails: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 3,
  },
  operatorBadge: {
    fontSize: 9,
    color: '#004E89',
    fontWeight: 'bold',
    marginTop: 5,
  },
  priceBadge: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: 'bold',
    marginTop: 5,
  },
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    paddingHorizontal: 5,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'right',
    marginTop: 15,
    paddingTop: 15,
    borderTop: '2px solid #e5e7eb',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
});

interface ItineraryPDFProps {
  itinerary: {
    id: string;
    name: string;
    customer_id?: string | null;
    start_date: string | null;
    end_date: string | null;
    adults_count: number;
    children_count: number;
    infants_count: number;
    total_price: number;
    currency: string;
  };
  lead: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    destination: string;
  };
  days: Array<{
    id: string;
    day_number: number;
    date: string | null;
    city_name: string;
    time_slots?: {
      morning: { time: string; activities: string[]; transfers: string[] };
      afternoon: { time: string; activities: string[]; transfers: string[] };
      evening: { time: string; activities: string[]; transfers: string[] };
    };
  }>;
  items: Array<{
    id: string;
    package_title: string;
    package_type: string;
    operator_id: string;
    total_price: number;
    unit_price: number;
  }>;
  operatorDetails: Record<string, {
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
  }>;
}

export const ItineraryPDF = ({ itinerary, lead, days, items, operatorDetails }: ItineraryPDFProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: itinerary.currency || 'USD',
    }).format(amount);
  };

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverTitle}>Travel Itinerary</Text>
        <Text style={styles.coverSubtitle}>{itinerary.name}</Text>
        <View style={{ marginTop: 40 }}>
          <Text style={styles.coverInfo}>Destination: {lead.destination}</Text>
          {itinerary.start_date && itinerary.end_date && (
            <Text style={styles.coverInfo}>
              {formatDate(itinerary.start_date)} - {formatDate(itinerary.end_date)}
            </Text>
          )}
          <Text style={styles.coverInfo}>
            {itinerary.adults_count} Adult{itinerary.adults_count !== 1 ? 's' : ''}
            {itinerary.children_count > 0 && `, ${itinerary.children_count} Child${itinerary.children_count !== 1 ? 'ren' : ''}`}
            {itinerary.infants_count > 0 && `, ${itinerary.infants_count} Infant${itinerary.infants_count !== 1 ? 's' : ''}`}
          </Text>
          {itinerary.customer_id && (
            <Text style={styles.coverInfo}>Reference ID: {itinerary.customer_id}</Text>
          )}
        </View>
      </Page>

      {/* Customer Details Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          {lead.customerName && (
            <Text style={styles.activityDetails}>Name: {lead.customerName}</Text>
          )}
          {lead.customerEmail && (
            <Text style={styles.activityDetails}>Email: {lead.customerEmail}</Text>
          )}
          {lead.customerPhone && (
            <Text style={styles.activityDetails}>Phone: {lead.customerPhone}</Text>
          )}
          {itinerary.customer_id && (
            <Text style={styles.activityDetails}>Reference ID: {itinerary.customer_id}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Overview</Text>
          <Text style={styles.activityDetails}>Destination: {lead.destination}</Text>
          {itinerary.start_date && itinerary.end_date && (
            <>
              <Text style={styles.activityDetails}>Start Date: {formatDate(itinerary.start_date)}</Text>
              <Text style={styles.activityDetails}>End Date: {formatDate(itinerary.end_date)}</Text>
            </>
          )}
          <Text style={styles.activityDetails}>
            Travelers: {itinerary.adults_count} Adult{itinerary.adults_count !== 1 ? 's' : ''}
            {itinerary.children_count > 0 && `, ${itinerary.children_count} Child${itinerary.children_count !== 1 ? 'ren' : ''}`}
            {itinerary.infants_count > 0 && `, ${itinerary.infants_count} Infant${itinerary.infants_count !== 1 ? 's' : ''}`}
          </Text>
        </View>
      </Page>

      {/* Day-by-Day Itinerary */}
      {days.map((day) => {
        const timeSlots = day.time_slots || {
          morning: { time: '', activities: [], transfers: [] },
          afternoon: { time: '', activities: [], transfers: [] },
          evening: { time: '', activities: [], transfers: [] },
        };

        const allItems = [
          ...timeSlots.morning.activities.map(id => ({ id, type: 'activity', slot: 'Morning' })),
          ...timeSlots.morning.transfers.map(id => ({ id, type: 'transfer', slot: 'Morning' })),
          ...timeSlots.afternoon.activities.map(id => ({ id, type: 'activity', slot: 'Afternoon' })),
          ...timeSlots.afternoon.transfers.map(id => ({ id, type: 'transfer', slot: 'Afternoon' })),
          ...timeSlots.evening.activities.map(id => ({ id, type: 'activity', slot: 'Evening' })),
          ...timeSlots.evening.transfers.map(id => ({ id, type: 'transfer', slot: 'Evening' })),
        ];

        if (allItems.length === 0) return null;

        return (
          <Page key={day.id} size="A4" style={styles.page}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Day {day.day_number}: {day.city_name}
              </Text>
              {day.date && (
                <Text style={styles.activityDetails}>Date: {formatDate(day.date)}</Text>
              )}
            </View>

            {allItems.map(({ id, type, slot }) => {
              const item = items.find(i => i.id === id);
              if (!item) return null;

              const operator = operatorDetails[item.operator_id];
              const slotTime = timeSlots[slot.toLowerCase() as 'morning' | 'afternoon' | 'evening']?.time || '';

              return (
                <View key={id} style={styles.timeSlot}>
                  <Text style={styles.timeSlotTitle}>
                    {slot} {slotTime && `(${slotTime})`}
                  </Text>
                  <View style={styles.activityItem}>
                    <Text style={styles.activityTitle}>
                      {item.package_title} ({type === 'activity' ? 'Activity' : 'Transfer'})
                    </Text>
                    {operator && (
                      <Text style={styles.operatorBadge}>
                        Operator: {operator.name}
                        {operator.email && ` | ${operator.email}`}
                        {operator.phone && ` | ${operator.phone}`}
                      </Text>
                    )}
                    <Text style={styles.priceBadge}>
                      Price: {formatCurrency(item.total_price || item.unit_price || 0)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Page>
        );
      })}

      {/* Pricing Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Summary</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Item</Text>
              <Text style={styles.tableCell}>Type</Text>
              <Text style={styles.tableCell}>Operator</Text>
              <Text style={[styles.tableCell, { textAlign: 'right' }]}>Price</Text>
            </View>
            {items.map((item) => {
              const operator = operatorDetails[item.operator_id];
              return (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{item.package_title}</Text>
                  <Text style={styles.tableCell}>
                    {item.package_type === 'activity' ? 'Activity' : 
                     item.package_type === 'transfer' ? 'Transfer' : 
                     item.package_type}
                  </Text>
                  <Text style={styles.tableCell}>{operator?.name || 'Unknown'}</Text>
                  <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                    {formatCurrency(item.total_price || item.unit_price || 0)}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.totalPrice}>
            Total: {formatCurrency(itinerary.total_price || 0)}
          </Text>
        </View>

        {/* Operator Contact Information */}
        {Object.keys(operatorDetails).length > 0 && (
          <View style={[styles.section, { marginTop: 30 }]}>
            <Text style={styles.sectionTitle}>Operator Contact Information</Text>
            {Object.entries(operatorDetails).map(([operatorId, operator]) => (
              <View key={operatorId} style={{ marginBottom: 15, padding: 10, backgroundColor: '#f9fafb' }}>
                <Text style={styles.activityTitle}>{operator.name}</Text>
                {operator.email && (
                  <Text style={styles.activityDetails}>Email: {operator.email}</Text>
                )}
                {operator.phone && (
                  <Text style={styles.activityDetails}>Phone: {operator.phone}</Text>
                )}
                {operator.website && (
                  <Text style={styles.activityDetails}>Website: {operator.website}</Text>
                )}
                {operator.address && (
                  <Text style={styles.activityDetails}>Address: {operator.address}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

