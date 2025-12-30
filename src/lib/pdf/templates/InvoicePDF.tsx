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
    borderBottom: '3px solid #004E89',
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004E89',
    marginBottom: 5,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#004E89',
    marginBottom: 10,
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
  tableCellDescription: {
    flex: 2,
    fontSize: 9,
    paddingHorizontal: 5,
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTop: '2px solid #e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    fontSize: 10,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'right',
    marginTop: 10,
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
  paymentTerms: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
  },
  customerInfo: {
    fontSize: 10,
    marginBottom: 3,
  },
  paymentTermText: {
    fontSize: 9,
    marginBottom: 5,
  },
  textRight: {
    textAlign: 'right',
  },
  billingAddress: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  notesSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  notesText: {
    fontSize: 9,
    lineHeight: 1.4,
  },
});

interface InvoicePDFProps {
  invoice: {
    invoice_number: string;
    total_amount: number;
    subtotal?: number | null;
    tax_rate?: number | null;
    tax_amount?: number | null;
    due_date: string | null;
    status: string;
    created_at: string;
    billing_address?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    } | null;
    payment_terms?: string | null;
    notes?: string | null;
    currency?: string | null;
  };
  itinerary: {
    id: string;
    name: string;
    customer_id?: string | null;
  };
  lead: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  };
  items: Array<{
    id: string;
    package_title: string;
    package_type: string;
    total_price: number;
    unit_price: number;
    quantity: number;
  }>;
}

export const InvoicePDF = ({ invoice, itinerary, lead, items }: InvoicePDFProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const currency = invoice.currency || 'USD';
  const subtotal = invoice.subtotal ?? invoice.total_amount;
  const taxRate = invoice.tax_rate ?? 0;
  const taxAmount = invoice.tax_amount ?? 0;
  const totalAmount = invoice.total_amount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{BRAND.name}</Text>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>Invoice #: {invoice.invoice_number}</Text>
          <Text style={styles.invoiceNumber}>Date: {formatDate(invoice.created_at)}</Text>
          {invoice.due_date && (
            <Text style={styles.invoiceNumber}>Due Date: {formatDate(invoice.due_date)}</Text>
          )}
        </View>

        {/* Bill To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          {lead.customerName && (
            <Text style={styles.customerInfo}>{lead.customerName}</Text>
          )}
          {invoice.billing_address?.street && (
            <Text style={styles.billingAddress}>{invoice.billing_address.street}</Text>
          )}
          {invoice.billing_address?.city && invoice.billing_address?.state && (
            <Text style={styles.billingAddress}>
              {invoice.billing_address.city}, {invoice.billing_address.state} {invoice.billing_address.zip || ''}
            </Text>
          )}
          {invoice.billing_address?.country && (
            <Text style={styles.billingAddress}>{invoice.billing_address.country}</Text>
          )}
          {!invoice.billing_address?.street && lead.customerEmail && (
            <Text style={styles.customerInfo}>{lead.customerEmail}</Text>
          )}
          {!invoice.billing_address?.street && lead.customerPhone && (
            <Text style={styles.customerInfo}>{lead.customerPhone}</Text>
          )}
          {itinerary.customer_id && (
            <Text style={styles.customerInfo}>
              Reference ID: {itinerary.customer_id}
            </Text>
          )}
        </View>

        {/* Itinerary Reference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itinerary:</Text>
          <Text style={styles.customerInfo}>{itinerary.name}</Text>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items:</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCellDescription}>Description</Text>
              <Text style={styles.tableCell}>Type</Text>
              <Text style={styles.tableCell}>Qty</Text>
              <Text style={[styles.tableCell, styles.textRight]}>Unit Price</Text>
              <Text style={[styles.tableCell, styles.textRight]}>Total</Text>
            </View>
            {items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.tableCellDescription}>{item.package_title}</Text>
                <Text style={styles.tableCell}>
                  {item.package_type === 'activity' ? 'Activity' : 
                   item.package_type === 'transfer' ? 'Transfer' : 
                   item.package_type}
                </Text>
                <Text style={styles.tableCell}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.textRight]}>
                  {formatCurrency(item.unit_price || 0, currency)}
                </Text>
                <Text style={[styles.tableCell, styles.textRight]}>
                  {formatCurrency(item.total_price || item.unit_price || 0, currency)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(subtotal, currency)}</Text>
          </View>
          {taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax ({taxRate}%):</Text>
              <Text>{formatCurrency(taxAmount, currency)}</Text>
            </View>
          )}
          <Text style={styles.totalAmount}>
            Total: {formatCurrency(totalAmount, currency)}
          </Text>
        </View>

        {/* Payment Terms */}
        {invoice.payment_terms && (
          <View style={styles.paymentTerms}>
            <Text style={styles.sectionTitle}>Payment Terms:</Text>
            <Text style={styles.paymentTermText}>{invoice.payment_terms}</Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Default Payment Terms if not provided */}
        {!invoice.payment_terms && (
          <View style={styles.paymentTerms}>
            <Text style={styles.sectionTitle}>Payment Terms:</Text>
            <Text style={styles.paymentTermText}>
              • Payment is due within 30 days of invoice date
            </Text>
            <Text style={styles.paymentTermText}>
              • Please include invoice number with your payment
            </Text>
            <Text style={styles.paymentTermText}>
              • For payment inquiries, please contact your travel agent
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{BRAND.legal.copyright}</Text>
          <Text>{BRAND.contact.email} | {BRAND.contact.phone}</Text>
        </View>
      </Page>
    </Document>
  );
};
