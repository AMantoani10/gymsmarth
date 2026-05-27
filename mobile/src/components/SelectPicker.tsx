import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';

const ORANGE = '#FF8C00';

interface Option { id: string; label: string; }

interface SelectPickerProps {
  label: string;
  options: Option[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
}

export default function SelectPicker({ label, options, selectedId, onSelect, placeholder = 'Selecionar...' }: SelectPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === selectedId);

  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity style={s.trigger} onPress={() => setOpen(true)}>
        <Text style={[s.triggerText, !selected && { color: '#555' }]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={s.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={s.list}>
            <Text style={s.listTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.option, item.id === selectedId && s.optionActive]}
                  onPress={() => { onSelect(item.id); setOpen(false); }}
                >
                  <Text style={[s.optionText, item.id === selectedId && { color: ORANGE }]}>{item.label}</Text>
                  {item.id === selectedId && <Text style={{ color: ORANGE }}>✓</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={s.empty}>Nenhuma opção disponível</Text>}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { color: '#AAA', fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  trigger: { backgroundColor: '#222', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#333', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  triggerText: { color: '#FFF', fontSize: 15 },
  arrow: { color: '#555', fontSize: 10 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 30 },
  list: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: 20, maxHeight: 400, borderWidth: 1, borderColor: '#333' },
  listTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', marginBottom: 14 },
  option: { padding: 14, borderRadius: 10, marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionActive: { backgroundColor: 'rgba(255,140,0,0.1)' },
  optionText: { color: '#CCC', fontSize: 15 },
  empty: { color: '#555', textAlign: 'center', padding: 20 },
});
