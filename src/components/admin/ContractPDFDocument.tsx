import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.6, color: '#1A2332' },
  header: { flexDirection: 'row', alignItems: 'center', borderBottom: '2px solid #2A9D8F', paddingBottom: 12, marginBottom: 20 },
  logo: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A9D8F', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  companyName: { fontSize: 18, fontWeight: 'bold', color: '#1A2332' },
  companyEmail: { fontSize: 8, color: '#999' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, color: '#1A2332' },
  body: { fontSize: 10, lineHeight: 1.6, color: '#333' },
  listItem: { marginLeft: 16, marginBottom: 2 },
  footer: { position: 'absolute', bottom: 30, left: 50, right: 50, textAlign: 'center', fontSize: 8, color: '#999', borderTop: '1px solid #eee', paddingTop: 8 },
});

interface ContractPDFDocumentProps {
  content: string;
  clientName: string;
}

const ContractPDFDocument = ({ content, clientName }: ContractPDFDocumentProps) => {
  const lines = content.split('\n');

  const renderLine = (line: string, index: number) => {
    const trimmed = line.trim();
    if (trimmed === '') return <View key={index} style={{ height: 6 }} />;
    
    // Headers (all caps lines or ## lines)
    if (trimmed.startsWith('## ')) {
      return <Text key={index} style={styles.sectionTitle}>{trimmed.replace('## ', '')}</Text>;
    }
    if (trimmed.match(/^[A-ZÉÈÊÀÂÔÎÛÇ]{2,}/) && trimmed.length < 80) {
      return <Text key={index} style={styles.sectionTitle}>{trimmed}</Text>;
    }
    if (trimmed.startsWith('ARTICLE ')) {
      return <Text key={index} style={{ ...styles.sectionTitle, color: '#2A9D8F' }}>{trimmed}</Text>;
    }
    // List items
    if (trimmed.startsWith('- ')) {
      return <Text key={index} style={{ ...styles.body, ...styles.listItem }}>• {trimmed.substring(2)}</Text>;
    }
    // Bold markers: **text**
    const hasBold = trimmed.includes('**');
    if (hasBold) {
      return <Text key={index} style={styles.body}>{trimmed.replace(/\*\*/g, '')}</Text>;
    }
    // Regular text
    return <Text key={index} style={styles.body}>{trimmed}</Text>;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <View>
            <Text style={styles.companyName}>Creationation</Text>
            <Text style={styles.companyEmail}>hello@creationation.app</Text>
          </View>
        </View>

        {/* Content */}
        {lines.map((line, i) => renderLine(line, i))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Creationation — Vienne, Autriche — hello@creationation.app — creationation.app</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ContractPDFDocument;
