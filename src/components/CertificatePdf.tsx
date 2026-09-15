import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

// Documento PDF del certificado, generado al vuelo (ver
// app/api/public/certificates/[code]/pdf/route.ts). Se mantiene simple e
// institucional: no es la pieza gráfica final de marketing, es el
// comprobante descargable que respalda lo que ya muestra el validador.

const styles = StyleSheet.create({
    page: { padding: 56, fontSize: 11, color: '#0B1E40', fontFamily: 'Helvetica' },
    header: { borderBottom: '2 solid #0B1E40', paddingBottom: 16, marginBottom: 32 },
    brand: { fontSize: 22, fontWeight: 700, letterSpacing: 2 },
    subtitle: { fontSize: 11, color: '#475569', marginTop: 4 },
    title: { fontSize: 20, fontWeight: 700, marginBottom: 4, textAlign: 'center' },
    category: { fontSize: 11, color: '#1d4ed8', textAlign: 'center', marginBottom: 28, textTransform: 'uppercase', letterSpacing: 1 },
    row: { flexDirection: 'row', marginBottom: 16 },
    col: { flex: 1 },
    label: { fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    value: { fontSize: 13, fontWeight: 700 },
    statusBadge: { fontSize: 11, fontWeight: 700, marginTop: 24, textAlign: 'center' },
    footer: { position: 'absolute', bottom: 40, left: 56, right: 56, borderTop: '1 solid #e2e8f0', paddingTop: 12 },
    footerText: { fontSize: 9, color: '#64748b', textAlign: 'center' },
});

function formatDate(date: Date | null): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

export interface CertificatePdfProps {
    code: string;
    holderName: string;
    holderRut: string;
    certificationTitle: string;
    categoryLabel: string;
    issueDate: Date;
    expiryDate: Date | null;
    statusLabel: string;
}

export function CertificatePdf({ code, holderName, holderRut, certificationTitle, categoryLabel, issueDate, expiryDate, statusLabel }: CertificatePdfProps) {
    return (
        <Document title={`Certificado ${code}`}>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.brand}>WYLAR</Text>
                    <Text style={styles.subtitle}>Certificado de validación en línea — www.wylar.cl/validador</Text>
                </View>

                <Text style={styles.title}>{certificationTitle}</Text>
                <Text style={styles.category}>{categoryLabel}</Text>

                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Titular</Text>
                        <Text style={styles.value}>{holderName}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>RUT</Text>
                        <Text style={styles.value}>{holderRut}</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Fecha de emisión</Text>
                        <Text style={styles.value}>{formatDate(issueDate)}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Vigencia</Text>
                        <Text style={styles.value}>{expiryDate ? `Hasta ${formatDate(expiryDate)}` : 'Sin vencimiento'}</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Código de validación</Text>
                        <Text style={styles.value}>{code}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Estado</Text>
                        <Text style={styles.value}>{statusLabel}</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Verifique la autenticidad de este certificado ingresando el RUT o el código {code} en www.wylar.cl/validador.
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
