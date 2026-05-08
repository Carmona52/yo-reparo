import React, {useState} from 'react';
import {
    Modal,
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
import {G, COLORS} from "@/styles/global-styles";

const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        mutedText: COLORS.muted,
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        borderColor: COLORS.border,
        placeholderColor: COLORS.placeholder,
    };
};

interface Props {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateContactModal({visible, onClose, onSuccess}: Props) {
    const {textColor, inputBg, borderColor, placeholderColor} = useAppTheme();
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
        <View style={{marginBottom: 15}}>
            <ThemedText style={{fontSize: 14, marginBottom: 8, fontWeight: '500', color: textColor}}>
                {label}
            </ThemedText>
            <View style={[G.inputWithIcon, {backgroundColor: inputBg, borderWidth: 1, borderColor}]}>
                <Ionicons name={icon} size={18} color={placeholderColor} style={{marginRight: 10}}/>
                <TextInput
                    style={[G.inputText, {color: textColor}]}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={placeholderColor}
                    keyboardType={keyboard}
                />
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={G.modalOverlay}>
                <ThemedView style={G.modalSheet}>
                    {/* Header */}
                    <View style={G.modalHeaderInner}>
                        <ThemedText type="title">Nuevo Contacto</ThemedText>
                        <TouchableOpacity onPress={onClose} style={G.modalCloseBtn}>
                            <Ionicons name="close" size={24} color={textColor}/>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
                        <ThemedText style={G.sectionLabel}>Datos Principales</ThemedText>
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

                        <ThemedText style={G.sectionLabel}>Dirección</ThemedText>
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
                        style={[G.btnModal, loading && G.btnDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color={COLORS.onPrimary}/> : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color={COLORS.onPrimary}/>
                                <ThemedText style={G.btnText}>Guardar Contacto</ThemedText>
                            </>
                        )}
                    </TouchableOpacity>
                </ThemedView>
            </View>
        </Modal>
    );
}