import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { BRAND } from '@/lib/branding';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1f2937',
  },
  header: {
    marginBottom: 30,
    borderBottom: '3px solid #10b981',
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 5,
  },
  voucherTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
  },
  voucherNumber: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0fdf4',
    borderRadius: 5,
    border: '1px solid #86efac',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 10,
  },
  bookingDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 100,
    color: '#374151',
  },
  detailValue: {
    fontSize: 10,
    color: '#1f2937',
    flex: 1,
  },
  operatorSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    border: '1px solid #e5e7eb',
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
  importantNotes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 5,
    border: '1px solid #fcd34d',
  },
});

interface VoucherPDFProps {
  voucher: {
    voucher_number: string;
    booking_reference: string;
    created_at: string;
  };
  itinerary: {
    id: string;
    name: string;
    customer_id?: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  lead: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  };
  operator: {
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
  };
  packageDetails: {
    title: string;
    description?: string;
    date: string;
    time: string;
    location?: string;
  };
}

export const VoucherPDF = ({ voucher, itinerary, lead, operator, packageDetails }: VoucherPDFProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{BRAND.name}</Text>
          <Text style={styles.voucherTitle}>BOOKING VOUCHER</Text>
          <Text style={styles.voucherNumber}>Voucher #: {voucher.voucher_number}</Text>
          <Text style={styles.voucherNumber}>Booking Reference: {voucher.booking_reference}</Text>
          <Text style={styles.voucherNumber}>Date: {formatDate(voucher.created_at)}</Text>
        </View>

        {/* Booking Confirmation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Confirmed</Text>
          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer:</Text>
              <Text style={styles.detailValue}>{lead.customerName || 'N/A'}</Text>
            </View>
            {lead.customerEmail && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{lead.customerEmail}</Text>
              </View>
            )}
            {itinerary.customer_id && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference ID:</Text>
                <Text style={styles.detailValue}>{itinerary.customer_id}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Itinerary:</Text>
              <Text style={styles.detailValue}>{itinerary.name}</Text>
            </View>
          </View>
        </View>

        {/* Package Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Details</Text>
          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Package:</Text>
              <Text style={styles.detailValue}>{packageDetails.title}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatDate(packageDetails.date)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>{packageDetails.time}</Text>
            </View>
            {packageDetails.location && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{packageDetails.location}</Text>
              </View>
            )}
            {packageDetails.description && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>{packageDetails.description}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Operator Information */}
        <View style={styles.operatorSection}>
          <Text style={styles.sectionTitle}>Operator Contact</Text>
          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Operator:</Text>
              <Text style={styles.detailValue}>{operator.name}</Text>
            </View>
            {operator.email && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{operator.email}</Text>
              </View>
            )}
            {operator.phone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{operator.phone}</Text>
              </View>
            )}
            {operator.website && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Website:</Text>
                <Text style={styles.detailValue}>{operator.website}</Text>
              </View>
            )}
            {operator.address && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{operator.address}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.importantNotes}>
          <Text style={styles.sectionTitle}>Important Information</Text>
          <Text style={{ fontSize: 9, marginBottom: 5 }}>
            • Please present this voucher to the operator at the time of service
          </Text>
          <Text style={{ fontSize: 9, marginBottom: 5 }}>
            • Keep this voucher safe for your records
          </Text>
          <Text style={{ fontSize: 9, marginBottom: 5 }}>
            • Contact the operator directly for any changes or cancellations
          </Text>
          <Text style={{ fontSize: 9 }}>
            • For assistance, contact your travel agent
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{BRAND.legal.copyright}</Text>
          <Text>{BRAND.contact.email} | {BRAND.contact.phone}</Text>
        </View>
      </Page>
    </Document>
  );
};

