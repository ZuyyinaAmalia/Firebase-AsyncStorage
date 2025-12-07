import { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert,
    FlatList,
    Image,
    KeyboardAvoidingView, Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet, Text,
    TextInput, TouchableOpacity,
    View
} from 'react-native';

// Import konfigurasi Firebase
import { auth, db } from './firebaseConfig';

import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';

import { addDoc, collection, getDocs } from 'firebase/firestore';

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
            setUser(authenticatedUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#004085" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            {user ? <MahasiswaScreen user={user} /> : <LoginScreen />}
        </SafeAreaView>
    );
}

// LAYAR LOGIN & REGISTER ---
function LoginScreen() {
    // State Login Dasar
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // State Tambahan untuk Register (Biodata)
    const [nama, setNama] = useState('');
    const [nim, setNim] = useState('');
    const [jurusan, setJurusan] = useState('');

    const [isSigningIn, setIsSigningIn] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    const handleAuth = async () => {
        // Validasi Input
        if (isRegistering) {
            // harus mengisi semua kolom input
            if (!email || !password || !nama || !nim || !jurusan) {
                Alert.alert("Mohon Lengkapi Data", "Nama, NIM, Jurusan, Email, dan Password wajib diisi.");
                return;
            }
        } else {
            // harus mengisi semua kolom input
            if (!email || !password) {
                Alert.alert("Peringatan", "Mohon isi email dan password");
                return;
            }
        }

        setIsSigningIn(true);
        try {
            if (isRegistering) {
                // Buat Akun di Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Simpan Biodata ke Firestore 
                await addDoc(collection(db, "mahasiswa"), {
                    nama: nama,
                    nim: nim,
                    jurusan: jurusan,
                    email: email,
                    uid: user.uid,
                    createdAt: new Date()
                });

                Alert.alert("Sukses", "Akun dan Data Mahasiswa berhasil disimpan!");

            } else {
                // --- PROSES LOGIN BIASA ---
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error) {
            let errorMessage = error.message;
            if (error.code === 'auth/weak-password') errorMessage = "Password terlalu lemah (min. 6 karakter).";
            else if (error.code === 'auth/email-already-in-use') errorMessage = "Email sudah terdaftar.";
            else if (error.code === 'auth/invalid-credential') errorMessage = "Email atau password salah.";

            Alert.alert("Gagal", errorMessage);
        } finally {
            setIsSigningIn(false);
        }
    };

    return (
        // KeyboardAvoidingView berfungsi untuk mencegah keyboard tidak menutupi input saat register
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.loginContainer}>
                    {/* LOGO UNDIP */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('./assets/undip_logo.png')}
                            style={styles.logo}
                        />
                        <Text style={styles.appTitle}>UNDIP MOBILE</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.headerTitle}>
                            {isRegistering ? "Registrasi Mahasiswa" : "Selamat Datang"}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {isRegistering ? "Isi biodata lengkap di bawah ini" : "Silakan login dengan akun Anda"}
                        </Text>

                        {/* jika isRegistering true maka akan menampilkna input register*/}
                        {isRegistering && (
                            <>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nama Lengkap"
                                    placeholderTextColor="#aaa"
                                    value={nama}
                                    onChangeText={setNama}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="NIM"
                                    placeholderTextColor="#aaa"
                                    value={nim}
                                    onChangeText={setNim}
                                    keyboardType="numeric"
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Jurusan"
                                    placeholderTextColor="#aaa"
                                    value={jurusan}
                                    onChangeText={setJurusan}
                                />
                            </>
                        )}

                        {/* input login */}
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#aaa"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#aaa"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={isSigningIn}>
                            {isSigningIn ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    {isRegistering ? "SIMPAN & DAFTAR" : "MASUK"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsRegistering(!isRegistering)}
                            style={styles.toggleButton}
                        >
                            <Text style={styles.toggleText}>
                                {isRegistering
                                    ? "Sudah punya akun? Login"
                                    : "Belum punya akun? Daftar Mahasiswa Baru"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// LIST DATA MAHASISWA 
function MahasiswaScreen({ user }) {
    const [mahasiswaList, setMahasiswaList] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    const fetchDataMahasiswa = async () => {
        setLoadingData(true);
        try {
            // Ambil data dari koleksi 'mahasiswa'
            const querySnapshot = await getDocs(collection(db, "mahasiswa"));
            const data = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            setMahasiswaList(data);
        } catch (error) {
            Alert.alert("Error", "Gagal mengambil data: " + error.message);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchDataMahasiswa();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.nama}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.jurusan}</Text>
                </View>
            </View>
            <Text style={styles.cardText}>NIM: {item.nim}</Text>
            {/* Opsional: Tampilkan Email */}
            {item.email && <Text style={[styles.cardText, { fontSize: 12, color: '#888', marginTop: 5 }]}>{item.email}</Text>}
        </View>
    );

    return (
        <View style={styles.contentContainer}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Data Mahasiswa</Text>
                    <Text style={styles.userInfo}>{user.email}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Keluar</Text>
                </TouchableOpacity>
            </View>

            {loadingData ? (
                <ActivityIndicator size="large" color="#004085" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={mahasiswaList}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    refreshing={loadingData}
                    onRefresh={fetchDataMahasiswa}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>Tidak ada data.</Text>}
                />
            )}
        </View>
    );
}

// --- STYLES (Tetap Putih Biru UNDIP) ---
const styles = StyleSheet.create({
    // Global
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Login Screen Styles
    loginContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        padding: 30,
        minHeight: 600, // Agar scrollview bekerja baik
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    logo: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    appTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#004085',
        letterSpacing: 1,
    },
    formContainer: {
        width: '100%',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 25,
    },
    input: {
        backgroundColor: '#F8F9FA',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        fontSize: 16,
        color: '#333',
    },
    primaryButton: {
        backgroundColor: '#004085',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#004085',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    toggleButton: {
        marginTop: 20,
        alignItems: 'center',
        paddingBottom: 20,
    },
    toggleText: {
        color: '#004085',
        fontWeight: '600',
        fontSize: 14,
    },

    // Dashboard Styles
    contentContainer: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    userInfo: {
        fontSize: 12,
        color: '#666',
    },
    logoutButton: {
        backgroundColor: '#FFEBEE',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    logoutText: {
        color: '#D32F2F',
        fontWeight: '600',
        fontSize: 12,
    },

    // Card Styles
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        borderLeftWidth: 5,
        borderLeftColor: '#004085',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    badge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        color: '#1976D2',
        fontWeight: 'bold',
    },
    cardText: {
        fontSize: 14,
        color: '#555',
    },
});