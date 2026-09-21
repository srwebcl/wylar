import { Document, Page, StyleSheet, Text, View, Image } from '@react-pdf/renderer';
import path from 'path';

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 11, color: '#000000', fontFamily: 'Helvetica' },
    headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1 solid #000', paddingBottom: 10, marginBottom: 40 },
    logo: { width: 100 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    headerCode: { fontSize: 14, fontWeight: 'bold' },
    
    contentBlock: { marginBottom: 12 },
    row: { flexDirection: 'row', marginBottom: 16 },
    label: { fontSize: 12, fontFamily: 'Helvetica' },
    value: { fontSize: 12, fontFamily: 'Helvetica', textTransform: 'uppercase' },

    stampContainer: { marginTop: 60, alignItems: 'center' },
    stampCircle: { width: 140, height: 140, borderRadius: 70, border: '1 solid #0B1E40', alignItems: 'center', justifyContent: 'center', position: 'relative' },
    stampLogo: { width: 80 },
    stampTextTop: { position: 'absolute', top: 10, fontSize: 6, color: '#0B1E40', textAlign: 'center', width: '100%' },
    stampTextBottom: { position: 'absolute', bottom: 10, fontSize: 6, color: '#0B1E40', textAlign: 'center', width: '100%' },
    
    signatureName: { fontSize: 12, marginTop: 16, fontStyle: 'italic' },
    signatureRole: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
    
    qrContainer: { position: 'absolute', bottom: 80, right: 40 },
    qrCode: { width: 80, height: 80 },

    footer: { position: 'absolute', bottom: 40, left: 40, right: 40, borderTop: '1 solid #000', paddingTop: 10 },
    footerText: { fontSize: 9, textAlign: 'center' },
    tcpdfText: { fontSize: 8, textAlign: 'right', marginTop: 4 },
});

function formatDate(date: Date | null): string {
    if (!date) return 'Indefinida';
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD to match screenshot
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

export function CertificatePdf({ code, holderName, holderRut, certificationTitle, categoryLabel: _categoryLabel, issueDate, expiryDate, statusLabel: _statusLabel }: CertificatePdfProps) {
    // Resolve local path for the logo to avoid network issues during SSR
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    // Generate QR using a reliable public API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://wylar.cl/validador?code=${code}`;
    
    const today = new Date().toLocaleDateString('es-CL');

    return (
        <Document title={`Certificado ${code}`}>
            <Page size="A4" style={styles.page}>
                <View style={styles.headerContainer}>
                    <Image src={logoPath} style={styles.logo} />
                    <Text style={styles.headerTitle}>Certificado</Text>
                    <Text style={styles.headerCode}>Código: {code}</Text>
                </View>

                <View style={styles.contentBlock}>
                    <Text style={styles.label}>Nombre Completo: <Text style={styles.value}>{holderName}</Text></Text>
                </View>
                <View style={styles.contentBlock}>
                    <Text style={styles.label}>RUT: <Text style={styles.value}>{holderRut}</Text></Text>
                </View>
                <View style={styles.contentBlock}>
                    <Text style={styles.label}>Certificación: <Text style={styles.value}>{certificationTitle}</Text></Text>
                </View>
                <View style={styles.contentBlock}>
                    <Text style={styles.label}>Fecha Aprobación: <Text style={styles.value}>{formatDate(issueDate)}</Text></Text>
                </View>
                <View style={styles.contentBlock}>
                    <Text style={styles.label}>Vigencia: <Text style={styles.value}>{formatDate(expiryDate)}</Text></Text>
                </View>
                <View style={styles.contentBlock}>
                    <Text style={styles.label}>Código Certificado: <Text style={styles.value}>{code}</Text></Text>
                </View>

                <View style={styles.stampContainer}>
                    <View style={styles.stampCircle}>
                        <Text style={styles.stampTextTop}>CERTIFICADORA Y EVALUADORA DE</Text>
                        <Image src={logoPath} style={styles.stampLogo} />
                        <Text style={styles.stampTextBottom}>COMPETENCIAS LABORALES</Text>
                    </View>
                    <Text style={styles.signatureName}>Wylar</Text>
                    <Text style={styles.signatureRole}>Certificadora de Competencias Laborales</Text>
                </View>

                <View style={styles.qrContainer}>
                    <Image src={qrUrl} style={styles.qrCode} />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        contacto@wylar.cl ~ www.wylar.cl ~ Fecha de descarga del certificado: {today}
                    </Text>
                    <Text style={styles.tcpdfText}>Powered by TCPDF (www.tcpdf.org)</Text>
                </View>
            </Page>
        </Document>
    );
}
