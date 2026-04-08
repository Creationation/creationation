import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const TEAL = '#2A9D8F';

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.6, color: '#1A2332' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: `2 solid ${TEAL}`, paddingBottom: 14, marginBottom: 24 },
  headerLeft: {},
  headerRight: { textAlign: 'right' },
  companyName: { fontSize: 18, fontWeight: 'bold', color: '#1A2332', marginBottom: 4 },
  companyDetail: { fontSize: 8, color: '#666', lineHeight: 1.5 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1A2332', marginBottom: 4 },
  subtitle: { fontSize: 9, color: '#666' },
  recipient: { marginBottom: 20, fontSize: 10, lineHeight: 1.6, color: '#333' },
  recipientName: { fontWeight: 'bold', fontSize: 11 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, color: '#1A2332', marginBottom: 8, marginTop: 16 },
  tableHeader: { flexDirection: 'row', borderBottom: `2 solid ${TEAL}`, paddingBottom: 6, marginBottom: 4 },
  tableHeaderCell: { fontSize: 9, fontWeight: 'bold', color: '#666' },
  tableRow: { flexDirection: 'row', borderBottom: '1 solid #eee', paddingVertical: 6 },
  tableCell: { fontSize: 10, color: '#333' },
  totalRow: { flexDirection: 'row', borderTop: `2 solid ${TEAL}`, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 12, fontWeight: 'bold', color: '#1A2332' },
  totalValue: { fontSize: 12, fontWeight: 'bold', color: TEAL, textAlign: 'right' },
  noteBox: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 4, marginVertical: 12 },
  noteText: { fontSize: 9, color: '#666', lineHeight: 1.5 },
  bankSection: { marginVertical: 12, fontSize: 10, color: '#333', lineHeight: 1.8 },
  bankLabel: { fontWeight: 'bold', fontSize: 10 },
  signature: { marginTop: 32, fontSize: 10, color: '#333', lineHeight: 1.8 },
  signatureName: { fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 50, right: 50, textAlign: 'center', fontSize: 7, color: '#999', borderTop: '1 solid #eee', paddingTop: 8 },
});

type LineItem = { leistung: string; zeitraum: string; betrag: number };

interface ContractPDFDocumentProps {
  companySettings: {
    company_name: string; legal_name: string; address: string; zip_code: string; city: string; country: string;
    email: string; phone: string | null; website: string;
    has_tax_number: boolean; tax_number: string | null; has_vat_number: boolean; vat_number: string | null;
    has_company_registration: boolean; company_registration: string | null; tax_note: string;
    bank_name: string | null; iban: string | null; bic: string | null; account_holder: string;
  };
  client: { business_name: string; contact_name: string | null; company_address: string | null; email: string | null };
  lineItems: LineItem[];
  rechnungsnummer: string;
  datum: string;
  bemerkungen: string;
  // Legacy compat
  content?: string;
  clientName?: string;
}

const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ContractPDFDocument = (props: ContractPDFDocumentProps) => {
  const { companySettings: s, client, lineItems, rechnungsnummer, datum, bemerkungen } = props;

  // Legacy fallback for old contracts
  if (!s && props.content) {
    const lines = (props.content || '').split('\n');
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.companyName}>Creationation</Text>
              <Text style={styles.companyDetail}>hello@creationation.app</Text>
            </View>
          </View>
          {lines.map((line, i) => <Text key={i} style={styles.tableCell}>{line}</Text>)}
          <View style={styles.footer}>
            <Text>Creationation — Wien, Österreich — hello@creationation.app — creationation.app</Text>
          </View>
        </Page>
      </Document>
    );
  }

  const gesamtbetrag = lineItems.reduce((sum, l) => sum + (l.betrag || 0), 0);
  const isHonorarnote = !s?.has_tax_number;
  const hasBankInfo = s?.bank_name && s?.iban;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{s?.company_name || 'Creationation'}</Text>
            <Text style={styles.companyDetail}>
              {s?.legal_name}{'\n'}{s?.address}{'\n'}{s?.zip_code} {s?.city}, {s?.country}{'\n'}{s?.email}
              {s?.phone ? `\n${s.phone}` : ''}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>{isHonorarnote ? 'Privat-Honorarnote' : 'Rechnung'}</Text>
            <Text style={styles.subtitle}>Nr. {rechnungsnummer}</Text>
            <Text style={styles.subtitle}>Datum: {datum ? new Date(datum).toLocaleDateString('de-AT') : '—'}</Text>
          </View>
        </View>

        {/* Recipient */}
        <View style={styles.recipient}>
          <Text style={styles.recipientName}>{client?.business_name || '—'}</Text>
          {client?.contact_name && <Text>{client.contact_name}</Text>}
          {client?.company_address && <Text>{client.company_address}</Text>}
          {client?.email && <Text>{client.email}</Text>}
        </View>

        {/* Table */}
        <Text style={styles.sectionTitle}>Leistungsbeschreibung</Text>
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.tableHeaderCell, width: '55%' }}>Leistung</Text>
          <Text style={{ ...styles.tableHeaderCell, width: '25%' }}>Zeitraum</Text>
          <Text style={{ ...styles.tableHeaderCell, width: '20%', textAlign: 'right' }}>Betrag</Text>
        </View>
        {lineItems.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, width: '55%' }}>{item.leistung}</Text>
            <Text style={{ ...styles.tableCell, width: '25%', color: '#666' }}>{item.zeitraum}</Text>
            <Text style={{ ...styles.tableCell, width: '20%', textAlign: 'right' }}>{fmt(item.betrag)} €</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={{ ...styles.totalLabel, width: '80%' }}>Gesamtbetrag</Text>
          <Text style={{ ...styles.totalValue, width: '20%' }}>{fmt(gesamtbetrag)} €</Text>
        </View>

        {/* Tax note */}
        <View style={styles.noteBox}>
          {s?.has_tax_number ? (
            <Text style={styles.noteText}>
              Steuernummer: {s.tax_number}
              {s.has_vat_number ? ` · UID-Nr: ${s.vat_number}` : ''}
              {s.has_company_registration ? ` · Firmenbuchnummer: ${s.company_registration}` : ''}
            </Text>
          ) : (
            <Text style={styles.noteText}>{s?.tax_note || ''}</Text>
          )}
        </View>

        {/* Payment */}
        {hasBankInfo && (
          <View style={styles.bankSection}>
            <Text style={styles.bankLabel}>Zahlungsbedingungen</Text>
            <Text>Bitte überweisen Sie den Betrag innerhalb von 14 Tagen auf folgendes Konto:</Text>
            <Text>{s!.bank_name}</Text>
            <Text>IBAN: {s!.iban}</Text>
            <Text>BIC: {s!.bic}</Text>
            <Text>Kontoinhaber: {s!.account_holder}</Text>
          </View>
        )}

        {/* Bemerkungen */}
        {bemerkungen ? (
          <View style={{ marginVertical: 8 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#666', marginBottom: 4 }}>Bemerkungen</Text>
            <Text style={{ fontSize: 9, color: '#666' }}>{bemerkungen}</Text>
          </View>
        ) : null}

        {/* Signature */}
        <View style={styles.signature}>
          <Text>Mit freundlichen Grüßen,</Text>
          <Text> </Text>
          <Text style={styles.signatureName}>{s?.legal_name || 'Diego Renard'}</Text>
          <Text>{s?.company_name || 'Creationation'}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{s?.company_name || 'Creationation'} — {s?.city || 'Wien'}, {s?.country || 'Österreich'} — {s?.email || 'hello@creationation.app'} — {s?.website || 'creationation.app'}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ContractPDFDocument;
