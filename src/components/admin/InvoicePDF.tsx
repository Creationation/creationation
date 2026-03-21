import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const teal = '#0d8a6f';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#333' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  brand: { fontSize: 20, fontWeight: 'bold', color: teal },
  brandSub: { fontSize: 9, color: '#888', marginTop: 2 },
  invoiceLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'right' },
  invoiceNumber: { fontSize: 11, color: '#666', textAlign: 'right', marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  infoBlock: { width: '48%' },
  infoTitle: { fontSize: 9, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  infoText: { fontSize: 10, color: '#555', marginBottom: 2 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#ddd', paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#eee', paddingVertical: 6 },
  colDesc: { width: '50%' },
  colQty: { width: '12%', textAlign: 'right' },
  colPrice: { width: '19%', textAlign: 'right' },
  colTotal: { width: '19%', textAlign: 'right' },
  thText: { fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase' },
  tdText: { fontSize: 10, color: '#333' },
  tdTextLight: { fontSize: 10, color: '#666' },
  tdTextBold: { fontSize: 10, color: '#333', fontWeight: 'bold' },
  totalsBlock: { marginTop: 16, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  totalLabel: { fontSize: 10, color: '#888', width: 100, textAlign: 'right', marginRight: 16 },
  totalValue: { fontSize: 10, width: 80, textAlign: 'right' },
  grandTotal: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTopWidth: 1.5, borderTopColor: '#ddd' },
  grandTotalLabel: { fontSize: 13, fontWeight: 'bold', color: '#333', width: 100, textAlign: 'right', marginRight: 16 },
  grandTotalValue: { fontSize: 13, fontWeight: 'bold', color: teal, width: 80, textAlign: 'right' },
  notes: { marginTop: 24, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 4, fontSize: 9, color: '#666' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#bbb' },
});

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

type Props = {
  invoice: any;
  items: any[];
};

const InvoicePDF = ({ invoice, items }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brand}>CreationNation</Text>
          <Text style={styles.brandSub}>Agence web créative</Text>
        </View>
        <View>
          <Text style={styles.invoiceLabel}>FACTURE</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>Facturé à :</Text>
          <Text style={styles.infoText}>{invoice.client_name || 'Client'}</Text>
        </View>
        <View style={{ ...styles.infoBlock, alignItems: 'flex-end' }}>
          <Text style={styles.infoText}>Émise le : {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.infoText}>Échéance : {new Date(invoice.due_date).toLocaleDateString('fr-FR')}</Text>
          {invoice.payment_method && <Text style={styles.infoText}>Paiement : {invoice.payment_method}</Text>}
        </View>
      </View>

      {/* Table */}
      <View style={styles.tableHeader}>
        <View style={styles.colDesc}><Text style={styles.thText}>Description</Text></View>
        <View style={styles.colQty}><Text style={styles.thText}>Qté</Text></View>
        <View style={styles.colPrice}><Text style={styles.thText}>Prix unit.</Text></View>
        <View style={styles.colTotal}><Text style={styles.thText}>Total</Text></View>
      </View>
      {items.map((it, i) => (
        <View key={i} style={styles.tableRow}>
          <View style={styles.colDesc}><Text style={styles.tdText}>{it.description}</Text></View>
          <View style={styles.colQty}><Text style={styles.tdTextLight}>{it.quantity}</Text></View>
          <View style={styles.colPrice}><Text style={styles.tdTextLight}>{fmt(Number(it.unit_price))}</Text></View>
          <View style={styles.colTotal}><Text style={styles.tdTextBold}>{fmt(Number(it.total))}</Text></View>
        </View>
      ))}

      {/* Totals */}
      <View style={styles.totalsBlock}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Sous-total</Text>
          <Text style={styles.totalValue}>{fmt(Number(invoice.subtotal))}</Text>
        </View>
        {Number(invoice.tax_rate) > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA ({invoice.tax_rate}%)</Text>
            <Text style={styles.totalValue}>{fmt(Number(invoice.tax_amount))}</Text>
          </View>
        )}
        <View style={styles.grandTotal}>
          <Text style={styles.grandTotalLabel}>Total TTC</Text>
          <Text style={styles.grandTotalValue}>{fmt(Number(invoice.total))}</Text>
        </View>
      </View>

      {invoice.notes && (
        <View style={styles.notes}>
          <Text>{invoice.notes}</Text>
        </View>
      )}

      <Text style={styles.footer}>Merci pour votre confiance — CreationNation</Text>
    </Page>
  </Document>
);

export default InvoicePDF;
