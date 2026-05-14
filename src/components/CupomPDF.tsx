// src/components/CupomPDF.tsx
// Componente responsável por gerar o PDF do cupom fiscal (contingência ou autorizado)
// Usa @react-pdf/renderer para layout simples e legível
// Última atualização: 15/01/2026 - Adicionado tipo Item de caixaTypes.ts

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Item } from '@/types/caixaTypes'; // Import corrigido - agora o módulo existe!

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 16, marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  totalRow: { marginTop: 15, borderTop: '1pt solid black', paddingTop: 5 },
});

interface CupomPDFProps {
  itens: Item[];
  total: number;
  data: string;
  operador: string;
}

export default function CupomPDF({ itens, total, data, operador }: CupomPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>PDV Brasil TOP #1™ - Cupom Fiscal</Text>
          <Text>Data: {data}</Text>
          <Text>Operador: {operador}</Text>
        </View>

        {itens.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text>{item.quantidade} × {item.nome}</Text>
            <Text>R$ {(item.quantidade * item.precoVenda).toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={{ textAlign: 'right', fontWeight: 'bold' }}>
            TOTAL: R$ {total.toFixed(2)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
