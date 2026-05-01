import React, {useState} from 'react';
import {
    Modal,
    StyleSheet,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    useColorScheme
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {createContact} from "@/libs/owner/contacts/create-contact";
import {CreateContact} from "@/libs/types/contact";

interface Props {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateContactModal({visible, onClose, onSuccess}: Props) {
    const isDark = useColorScheme() === 'dark';
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<CreateContact>({
        name: '',
        phone: '',
        address_line_1: '',
        neighborhood: '',
        city: 'Tehuacán',
        state: 'Puebla',
        postal_code: '',
        country: 'México',
    });

    const handleSave = async () => {
        if (!form.name || !form.phone) {
            Alert.alert("Faltan datos", "El nombre y teléfono son obligatorios.");
            return;
        }

        setLoading(true);
        const {error} = await createContact(form);
        setLoading(false);

        if (error) {
            Alert.alert("Error", error);
        } else {
            Alert.alert("Éxito", "Contacto guardado correctamente.");
            setForm({
                name: '',
                phone: '',
                address_line_1: '',
                neighborhood: '',
                city: 'Tehuacán',
                state: 'Puebla',
                postal_code: '',
                country: 'México'
            });
            onSuccess?.();
            onClose();
        }
    };

    const InputField = ({label, value, onChange, placeholder, icon, keyboard = 'default'}: any) => (
        <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{label}</ThemedText>
            <View style={[styles.inputWrapper, {backgroundColor: isDark ? '#2c2c2e' : '#f0f0f0'}]}>
                <Ionicons name={icon} size={18} color="#8e8e93" style={{marginRight: 10}}/>
                <TextInput
                    style={[styles.input, {color: isDark ? '#fff' : '#000'}]}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor="#8e8e93"
                    keyboardType={keyboard}
                />
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <ThemedView style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <ThemedText type="title">Nuevo Contacto</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"}/>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
                        <ThemedText style={styles.sectionTitle}>Datos Principales</ThemedText>
                        <InputField
                            label="Nombre Completo"
                            icon="person-outline"
                            value={form.name}
                            onChange={(t: string) => setForm({...form, name: t})}
                            placeholder="Ej. Juan Pérez"
                        />
                        <InputField
                            label="Teléfono"
                            icon="call-outline"
                            value={form.phone}
                            onChange={(t: string) => setForm({...form, phone: t})}
                            placeholder="238 123 4567"
                            keyboard="phone-pad"
                        />

                        <ThemedText style={styles.sectionTitle}>Dirección</ThemedText>
                        <InputField
                            label="Calle y Número"
                            icon="location-outline"
                            value={form.address_line_1}
                            onChange={(t: string) => setForm({...form, address_line_1: t})}
                            placeholder="Av. Reforma #123"
                        />
                        <View style={{flexDirection: 'row', gap: 10}}>
                            <View style={{flex: 1}}>
                                <InputField
                                    label="Colonia"
                                    icon="business-outline"
                                    value={form.neighborhood}
                                    onChange={(t: string) => setForm({...form, neighborhood: t})}
                                    placeholder="Centro"
                                />
                            </View>
                            <View style={{flex: 1}}>
                                <InputField
                                    label="C.P."
                                    icon="mail-unread-outline"
                                    value={form.postal_code}
                                    onChange={(t: string) => setForm({...form, postal_code: t})}
                                    placeholder="75700"
                                    keyboard="number-pad"
                                />
                            </View>
                        </View>
                        <InputField
                            label="Ciudad"
                            icon="map-outline"
                            value={form.city}
                            onChange={(t: string) => setForm({...form, city: t})}
                        />
                    </ScrollView>

                    {/* Botón Guardar */}
                    <TouchableOpacity
                        style={[styles.saveBtn, {opacity: loading ? 0.7 : 1}]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff"/> : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#fff"/>
                                <ThemedText style={styles.saveBtnText}>Guardar Contacto</ThemedText>
                            </>
                        )}
                    </TouchableOpacity>
                </ThemedView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '85%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    closeBtn: {
        padding: 5,
        backgroundColor: 'rgba(150,150,150,0.1)',
        borderRadius: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        opacity: 0.4,
        textTransform: 'uppercase',
        marginTop: 15,
        marginBottom: 10,
        letterSpacing: 1,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    saveBtn: {
        backgroundColor: '#0a7ea4',
        height: 55,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});