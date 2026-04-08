import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  FlatList, Modal, Image, Alert, Linking, Share,
  SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, Dimensions, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const SW = Dimensions.get('window').width;

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const S = {
  get: async (k, def) => { try { const v = await AsyncStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: async (k, v) => { try { await AsyncStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────
const DEFAULT_CATS = [
  { id:'cat_1', name:'Grocery',      emoji:'🛒', accent:'#2e7d32', dark:'#134e1b', light:'#e8f5e9', tag:'#81c784' },
  { id:'cat_2', name:'Electronics',  emoji:'⚡', accent:'#1565c0', dark:'#0d2a6b', light:'#e3f2fd', tag:'#64b5f6' },
  { id:'cat_3', name:'Mechanical',   emoji:'⚙️', accent:'#e65100', dark:'#7a2800', light:'#fff3e0', tag:'#ffb74d' },
  { id:'cat_4', name:'Bike & Cycle', emoji:'🚲', accent:'#880e4f', dark:'#4a0030', light:'#fce4ec', tag:'#f48fb1' },
];
const DEFAULT_PRODUCTS = [
  { id:1,  name:'Basmati Rice (5kg)',    price:12.5, stock:40, unit:'bag',    categoryId:'cat_1', image:null, originalPrice:null, reviews:[] },
  { id:2,  name:'Sunflower Oil (1L)',    price:3.2,  stock:60, unit:'bottle', categoryId:'cat_1', image:null, originalPrice:null, reviews:[] },
  { id:3,  name:'USB-C Cable 2m',        price:8.99, stock:25, unit:'pcs',    categoryId:'cat_2', image:null, originalPrice:null, reviews:[] },
  { id:4,  name:'LED Bulb 12W',          price:4.5,  stock:50, unit:'pcs',    categoryId:'cat_2', image:null, originalPrice:null, reviews:[] },
  { id:5,  name:'WD-40 Spray 400ml',     price:7.5,  stock:20, unit:'can',    categoryId:'cat_3', image:null, originalPrice:null, reviews:[] },
  { id:6,  name:'Wrench Set (10pc)',      price:22.0, stock:8,  unit:'set',    categoryId:'cat_3', image:null, originalPrice:null, reviews:[] },
  { id:7,  name:'Inner Tube 26"',        price:5.5,  stock:18, unit:'pcs',    categoryId:'cat_4', image:null, originalPrice:null, reviews:[] },
  { id:8,  name:'Bike Chain',            price:11.0, stock:12, unit:'pcs',    categoryId:'cat_4', image:null, originalPrice:null, reviews:[] },
];
const DEFAULT_BIZ = { name:'My Shop', tagline:'Quality products at great prices', whatsapp:'', logo:null, pin:'1234' };

const ACCENT_PRESETS = [
  { accent:'#2e7d32', dark:'#134e1b', light:'#e8f5e9', tag:'#81c784' },
  { accent:'#1565c0', dark:'#0d2a6b', light:'#e3f2fd', tag:'#64b5f6' },
  { accent:'#e65100', dark:'#7a2800', light:'#fff3e0', tag:'#ffb74d' },
  { accent:'#880e4f', dark:'#4a0030', light:'#fce4ec', tag:'#f48fb1' },
  { accent:'#6a1b9a', dark:'#38006b', light:'#f3e5f5', tag:'#ce93d8' },
  { accent:'#00695c', dark:'#003d33', light:'#e0f2f1', tag:'#80cbc4' },
  { accent:'#c62828', dark:'#7f0000', light:'#ffebee', tag:'#ef9a9a' },
  { accent:'#f57f17', dark:'#7c4700', light:'#fff8e1', tag:'#ffe082' },
];
const EMOJI_PRESETS = ['🛒','⚡','⚙️','🚲','👕','👟','📱','💊','🍕','🧴','🔑','🏠','🎮','📚','🌿','🧹','🔧','🛠️','🧲','💡','🎁','🐾','🚗','✏️','🍎','🥦','🐟','🧺'];
const UNITS = ['pcs','kg','g','L','ml','pack','box','bag','set','pair','can','bottle','roll'];

const THEME = {
  dark:  { bg:'#0f0f14', card:'#1a1a2e', card2:'#16213e', border:'#ffffff20', text:'#f0f0f0', sub:'#888', input:'#ffffff0d', ib:'#ffffff30' },
  light: { bg:'#f4f6fb', card:'#ffffff',  card2:'#f0f4ff', border:'#e0e0e0',   text:'#1a1a2e', sub:'#666', input:'#ffffff',   ib:'#ddd' },
};

let nextId = 50;
let nextCatId = 20;

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
function useToast() {
  const [t, setT] = useState(null);
  const show = (msg, type = 'success') => { setT({ msg, type }); setTimeout(() => setT(null), 2500); };
  return [t, show];
}

function ToastBanner({ toast }) {
  if (!toast) return null;
  const bg = toast.type === 'error' ? '#c62828' : toast.type === 'remove' ? '#444' : '#2e7d32';
  return (
    <View style={{ position:'absolute', top:70, left:20, right:20, zIndex:999, backgroundColor:bg, padding:12, borderRadius:30, alignItems:'center', elevation:10 }}>
      <Text style={{ color:'#fff', fontWeight:'700', fontSize:13 }}>{toast.msg}</Text>
    </View>
  );
}

function Lbl({ children, T }) {
  return <Text style={{ fontWeight:'700', fontSize:13, color:T.sub, marginBottom:6 }}>{children}</Text>;
}

function Inp({ value, onChange, placeholder, numeric, phone, secure, multi, style, T }) {
  return (
    <TextInput value={String(value ?? '')} onChangeText={onChange} placeholder={placeholder}
      placeholderTextColor={T.sub} keyboardType={numeric ? 'decimal-pad' : phone ? 'phone-pad' : 'default'}
      secureTextEntry={secure} multiline={multi} textAlignVertical={multi ? 'top' : 'auto'}
      style={[{ backgroundColor:T.input, color:T.text, borderWidth:1.5, borderColor:T.ib, borderRadius:10, padding:12, fontSize:14, marginBottom:12 }, style]} />
  );
}

function Card({ children, style, T }) {
  return (
    <View style={[{ backgroundColor:T.card, borderRadius:16, padding:16, marginBottom:14, elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.08, shadowRadius:6 }, style]}>
      {children}
    </View>
  );
}

function Stars({ value, onChange, size = 20 }) {
  return (
    <View style={{ flexDirection:'row', gap:4 }}>
      {[1,2,3,4,5].map(s => (
        <TouchableOpacity key={s} onPress={() => onChange && onChange(s)}>
          <Text style={{ fontSize:size, color: s <= value ? '#f4c430' : '#555' }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

async function pickImg() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access in settings.'); return null; }
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true });
  if (!res.canceled && res.assets[0]) return 'data:image/jpeg;base64,' + res.assets[0].base64;
  return null;
}

// ─── PIN LOCK ─────────────────────────────────────────────────────────────────
function PinLock({ biz, onUnlock, onGuest, T }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);

  const tap = d => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === biz.pin) { setTimeout(() => onUnlock(), 200); }
      else { setErr(true); setTimeout(() => { setPin(''); setErr(false); }, 700); }
    }
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:T.bg, alignItems:'center', justifyContent:'center' }}>
      <Text style={{ fontSize:52, marginBottom:12 }}>🔐</Text>
      <Text style={{ fontSize:20, fontWeight:'900', color:T.text, marginBottom:4 }}>Owner Panel</Text>
      <Text style={{ fontSize:13, color:T.sub, marginBottom:32 }}>Enter your 4-digit PIN</Text>
      <View style={{ flexDirection:'row', gap:14, marginBottom:32 }}>
        {[0,1,2,3].map(i => <View key={i} style={{ width:16, height:16, borderRadius:8, backgroundColor: i < pin.length ? (err ? '#c62828' : '#f4c430') : T.border }} />)}
      </View>
      <View style={{ width:240, flexDirection:'row', flexWrap:'wrap', gap:12, justifyContent:'center', marginBottom:28 }}>
        {[1,2,3,4,5,6,7,8,9,null,0,'⌫'].map((d, i) => (
          <TouchableOpacity key={i} activeOpacity={d === null ? 1 : 0.7}
            onPress={() => { if (d === '⌫') setPin(p => p.slice(0,-1)); else if (d !== null) tap(String(d)); }}
            style={{ width:64, height:64, borderRadius:14, backgroundColor: d === null ? 'transparent' : T.card, alignItems:'center', justifyContent:'center', elevation: d === null ? 0 : 3 }}>
            <Text style={{ fontSize:22, fontWeight:'700', color:T.text }}>{d === null ? '' : d}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={onGuest}>
        <Text style={{ color:T.sub, fontSize:13, textDecorationLine:'underline' }}>Browse as Customer →</Text>
      </TouchableOpacity>
      <Text style={{ color:T.sub, fontSize:11, marginTop:8 }}>Default PIN: 1234</Text>
    </SafeAreaView>
  );
}

// ─── CATEGORY MANAGER ─────────────────────────────────────────────────────────
function CatManager({ cats, setCats, products, T }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', emoji:'🛍️', ...ACCENT_PRESETS[0] });
  const [toast, show] = useToast();

  const save = async () => {
    if (!form.name.trim()) return show('⚠️ Enter a name', 'error');
    const updated = editing
      ? cats.map(c => c.id === editing.id ? { ...c, ...form } : c)
      : [...cats, { id:'cat_'+nextCatId++, ...form }];
    setCats(updated); await S.set('shop_cats', updated);
    show(editing ? '✅ Updated!' : '✅ Category added!'); setAdding(false);
  };

  const del = cat => {
    if (products.some(p => p.categoryId === cat.id)) return show(`⚠️ Move products out first`, 'error');
    Alert.alert('Delete', `Delete "${cat.name}"?`, [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        const u = cats.filter(c => c.id !== cat.id); setCats(u); await S.set('shop_cats', u); show('🗑 Deleted', 'error');
      }},
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding:16 }}>
      <ToastBanner toast={toast} />
      {adding ? (
        <Card T={T}>
          <Text style={{ fontWeight:'800', fontSize:15, color:T.text, marginBottom:14 }}>{editing ? 'Edit Category' : 'New Category'}</Text>
          <Lbl T={T}>Category Name *</Lbl>
          <Inp value={form.name} onChange={v => setForm(f => ({ ...f, name:v }))} placeholder="e.g. Clothing" T={T} />
          <Lbl T={T}>Icon</Lbl>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:12 }}>
            {EMOJI_PRESETS.map(e => (
              <TouchableOpacity key={e} onPress={() => setForm(f => ({ ...f, emoji:e }))}
                style={{ padding:6, borderRadius:8, borderWidth:2, borderColor: form.emoji===e ? '#f4c430' : 'transparent', backgroundColor: form.emoji===e ? '#f4c43022' : 'transparent' }}>
                <Text style={{ fontSize:22 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Lbl T={T}>Colour</Lbl>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:14 }}>
            {ACCENT_PRESETS.map((p, i) => (
              <TouchableOpacity key={i} onPress={() => setForm(f => ({ ...f, ...p }))}
                style={{ width:36, height:36, borderRadius:18, backgroundColor:p.accent, borderWidth:3, borderColor: form.accent===p.accent ? '#f4c430' : 'transparent' }} />
            ))}
          </View>
          {/* Preview */}
          <View style={{ backgroundColor:form.accent+'aa', borderRadius:12, padding:14, marginBottom:14, flexDirection:'row', alignItems:'center', gap:10 }}>
            <Text style={{ fontSize:28 }}>{form.emoji}</Text>
            <Text style={{ fontWeight:'700', color:'#fff', fontSize:15 }}>{form.name || 'Category Name'}</Text>
          </View>
          <View style={{ flexDirection:'row', gap:8 }}>
            <TouchableOpacity onPress={() => setAdding(false)} style={{ flex:1, backgroundColor:T.card2, borderRadius:10, padding:12, alignItems:'center', borderWidth:1, borderColor:T.border }}>
              <Text style={{ fontWeight:'700', color:T.text }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} style={{ flex:2, backgroundColor:'#f4c430', borderRadius:10, padding:12, alignItems:'center' }}>
              <Text style={{ fontWeight:'800', fontSize:15, color:'#1a1a1a' }}>{editing ? '💾 Save' : '✅ Add'}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : (
        <TouchableOpacity onPress={() => { setForm({ name:'', emoji:'🛍️', ...ACCENT_PRESETS[0] }); setEditing(null); setAdding(true); }}
          style={{ backgroundColor:'#f4c430', borderRadius:12, padding:14, alignItems:'center', marginBottom:14 }}>
          <Text style={{ fontWeight:'800', fontSize:15, color:'#1a1a1a' }}>+ Add New Category</Text>
        </TouchableOpacity>
      )}

      {cats.map(cat => (
        <View key={cat.id} style={{ backgroundColor:T.card, borderRadius:12, padding:14, marginBottom:8, flexDirection:'row', alignItems:'center', gap:12, elevation:2 }}>
          <View style={{ width:44, height:44, borderRadius:10, backgroundColor:cat.accent, alignItems:'center', justifyContent:'center' }}>
            <Text style={{ fontSize:22 }}>{cat.emoji}</Text>
          </View>
          <View style={{ flex:1 }}>
            <Text style={{ fontWeight:'700', fontSize:14, color:T.text }}>{cat.name}</Text>
            <Text style={{ fontSize:11, color:T.sub }}>{products.filter(p => p.categoryId===cat.id).length} products</Text>
          </View>
          <TouchableOpacity onPress={() => { setForm({ name:cat.name, emoji:cat.emoji, accent:cat.accent, dark:cat.dark, light:cat.light, tag:cat.tag }); setEditing(cat); setAdding(true); }}
            style={{ backgroundColor:cat.light||'#eee', borderRadius:8, padding:8 }}>
            <Text style={{ color:cat.accent, fontWeight:'700' }}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => del(cat)} style={{ backgroundColor:'#ffebee', borderRadius:8, padding:8 }}>
            <Text style={{ color:'#c62828', fontWeight:'700' }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── OWNER SETTINGS ───────────────────────────────────────────────────────────
function OwnerSettings({ biz, setBiz, cats, setCats, products, onBack, T, theme, setTheme }) {
  const [tab, setTab] = useState('biz');
  const [form, setForm] = useState({ ...biz });
  const [toast, show] = useToast();

  const save = async () => { setBiz(form); await S.set('shop_biz', form); show('✅ Saved!'); };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:T.bg }}>
      <ToastBanner toast={toast} />
      <View style={{ backgroundColor:'#1a1a2e', padding:14, flexDirection:'row', alignItems:'center', gap:12 }}>
        <TouchableOpacity onPress={onBack} style={{ backgroundColor:'#ffffff15', borderRadius:8, paddingHorizontal:14, paddingVertical:8 }}>
          <Text style={{ color:'#fff', fontWeight:'700' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontWeight:'900', fontSize:17, color:'#fff' }}>⚙️ Settings</Text>
      </View>
      <View style={{ flexDirection:'row', backgroundColor:T.card, borderBottomWidth:1, borderBottomColor:T.border }}>
        {[{id:'biz',l:'🏪 Shop Info'},{id:'cats',l:'🗂 Categories'}].map(t => (
          <TouchableOpacity key={t.id} onPress={() => setTab(t.id)}
            style={{ flex:1, padding:14, alignItems:'center', borderBottomWidth:3, borderBottomColor: tab===t.id ? '#f4c430' : 'transparent' }}>
            <Text style={{ fontWeight:'700', fontSize:14, color: tab===t.id ? '#f4c430' : T.sub }}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'biz' && (
        <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ padding:16 }}>
            <Card T={T}>
              <Text style={{ fontWeight:'700', fontSize:12, color:T.sub, marginBottom:12, letterSpacing:1 }}>LOGO</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                {form.logo
                  ? <Image source={{ uri:form.logo }} style={{ width:72, height:72, borderRadius:16 }} />
                  : <View style={{ width:72, height:72, borderRadius:16, backgroundColor:'#f4c43022', borderWidth:2, borderColor:'#f4c430', borderStyle:'dashed', alignItems:'center', justifyContent:'center' }}>
                      <Text style={{ fontSize:30 }}>🏪</Text>
                    </View>
                }
                <View style={{ gap:8 }}>
                  <TouchableOpacity onPress={async () => { const img = await pickImg(); if (img) setForm(f => ({ ...f, logo:img })); }}
                    style={{ backgroundColor:'#1a1a2e', borderRadius:8, paddingHorizontal:16, paddingVertical:9 }}>
                    <Text style={{ color:'#fff', fontWeight:'700', fontSize:13 }}>📷 {form.logo ? 'Change' : 'Upload'} Logo</Text>
                  </TouchableOpacity>
                  {form.logo && <TouchableOpacity onPress={() => setForm(f => ({ ...f, logo:null }))} style={{ backgroundColor:'#ffebee', borderRadius:8, paddingHorizontal:16, paddingVertical:7 }}>
                    <Text style={{ color:'#c62828', fontWeight:'700', fontSize:12 }}>🗑 Remove</Text>
                  </TouchableOpacity>}
                </View>
              </View>
            </Card>
            <Card T={T}>
              <Text style={{ fontWeight:'700', fontSize:12, color:T.sub, marginBottom:12, letterSpacing:1 }}>SHOP DETAILS</Text>
              <Lbl T={T}>Shop Name</Lbl>
              <Inp value={form.name} onChange={v => setForm(f => ({ ...f, name:v }))} placeholder="e.g. Ahmed's Stores" T={T} />
              <Lbl T={T}>Tagline</Lbl>
              <Inp value={form.tagline} onChange={v => setForm(f => ({ ...f, tagline:v }))} placeholder="Quality products at great prices" T={T} />
              <Lbl T={T}>WhatsApp Number (with country code)</Lbl>
              <Inp value={form.whatsapp} onChange={v => setForm(f => ({ ...f, whatsapp:v }))} placeholder="+1234567890" phone T={T} />
            </Card>
            <Card T={T}>
              <Text style={{ fontWeight:'700', fontSize:12, color:T.sub, marginBottom:12, letterSpacing:1 }}>🔐 OWNER PIN</Text>
              <Inp value={form.pin} onChange={v => setForm(f => ({ ...f, pin:v.replace(/\D/g,'').slice(0,4) }))} placeholder="4-digit PIN" secure numeric T={T} style={{ letterSpacing:12, fontSize:22 }} />
              <Text style={{ fontSize:11, color:T.sub }}>Customers must enter this PIN to access the owner panel</Text>
            </Card>
            <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
              <Text style={{ color:T.text, fontSize:14, fontWeight:'700', flex:1, alignSelf:'center' }}>🌙 Dark Mode</Text>
              <TouchableOpacity onPress={() => setTheme(t => t==='dark' ? 'light' : 'dark')}
                style={{ backgroundColor: theme==='dark' ? '#f4c430' : T.card2, borderRadius:20, paddingHorizontal:20, paddingVertical:8, borderWidth:1, borderColor:T.border }}>
                <Text style={{ fontWeight:'700', color: theme==='dark' ? '#1a1a1a' : T.sub }}>{theme==='dark' ? '☀️ Light' : '🌙 Dark'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={save} style={{ backgroundColor:'#f4c430', borderRadius:12, padding:15, alignItems:'center' }}>
              <Text style={{ fontWeight:'800', fontSize:16, color:'#1a1a1a' }}>💾 Save Settings</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
      {tab === 'cats' && <CatManager cats={cats} setCats={setCats} products={products} T={T} />}
    </SafeAreaView>
  );
}

// ─── OWNER APP ────────────────────────────────────────────────────────────────
function OwnerApp({ products, setProducts, sales, setSales, biz, setBiz, cats, setCats, onSwitch, theme, setTheme }) {
  const T = THEME[theme];
  const [screen, setScreen] = useState('products');
  const [activeCatId, setActiveCatId] = useState(cats[0]?.id || '');
  const [editProd, setEditProd] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, show] = useToast();
  const [form, setForm] = useState({ name:'', price:'', stock:'', unit:'pcs', image:null, originalPrice:'' });
  const [saleForm, setSaleForm] = useState({ productId:'', qty:'1' });

  const activeCat = cats.find(c => c.id === activeCatId) || cats[0];
  const filtered  = products.filter(p => p.categoryId === activeCatId && p.name.toLowerCase().includes(search.toLowerCase()));
  const allLow    = products.filter(p => p.stock <= 8);
  const totalVal  = products.reduce((s, p) => s + p.price * p.stock, 0);
  const totalRev  = sales.reduce((s, sa) => s + sa.total, 0);

  const saveP = async u => { setProducts(u); await S.set('shop_products', u); };

  const handleAdd = async () => {
    if (!form.name || !form.price || !form.stock) return show('⚠️ Fill required fields', 'error');
    const p = { id:nextId++, name:form.name, price:parseFloat(form.price), stock:parseInt(form.stock), unit:form.unit, image:form.image, categoryId:activeCatId, originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null, reviews:[] };
    await saveP([...products, p]);
    setForm({ name:'', price:'', stock:'', unit:'pcs', image:null, originalPrice:'' });
    setScreen('products'); show(`✅ "${p.name}" added!`);
  };

  const handleEdit = async () => {
    if (!form.name || !form.price || !form.stock) return show('⚠️ Fill required fields', 'error');
    await saveP(products.map(p => p.id === editProd.id ? { ...p, name:form.name, price:parseFloat(form.price), stock:parseInt(form.stock), unit:form.unit, image:form.image, originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null } : p));
    setScreen('products'); show('✅ Updated!');
  };

  const handleDelete = (id, name) => Alert.alert('Delete', `Remove "${name}"?`, [
    { text:'Cancel', style:'cancel' },
    { text:'Delete', style:'destructive', onPress: async () => { await saveP(products.filter(p => p.id !== id)); show('🗑 Removed', 'error'); } },
  ]);

  const openEdit = p => { setEditProd(p); setForm({ name:p.name, price:String(p.price), stock:String(p.stock), unit:p.unit, image:p.image, originalPrice: p.originalPrice ? String(p.originalPrice) : '' }); setScreen('edit'); };

  const recordSale = async () => {
    const prod = products.find(p => p.id === parseInt(saleForm.productId));
    if (!prod) return show('⚠️ Select a product', 'error');
    const qty = parseInt(saleForm.qty || 0);
    if (qty < 1 || qty > prod.stock) return show(`⚠️ Max available: ${prod.stock}`, 'error');
    const sale = { id:Date.now(), productName:prod.name, qty, price:prod.price, total:prod.price*qty, date:new Date().toLocaleDateString() };
    const u = [sale, ...sales]; setSales(u); await S.set('shop_sales', u);
    await saveP(products.map(p => p.id === prod.id ? { ...p, stock:p.stock-qty } : p));
    setSaleForm({ productId:'', qty:'1' }); show('✅ Sale recorded!');
  };

  if (screen === 'settings') return <OwnerSettings biz={biz} setBiz={setBiz} cats={cats} setCats={setCats} products={products} onBack={() => setScreen('products')} T={T} theme={theme} setTheme={setTheme} />;

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:T.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ToastBanner toast={toast} />

      {/* Header */}
      <View style={{ backgroundColor:'#1a1a2e', padding:13 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
            {biz.logo ? <Image source={{ uri:biz.logo }} style={{ width:34, height:34, borderRadius:8 }} /> : <Text style={{ fontSize:26 }}>🏪</Text>}
            <View>
              <Text style={{ fontWeight:'900', fontSize:16, color:'#fff' }}>{biz.name}</Text>
              <Text style={{ fontSize:10, color:'#aaa' }}>Owner Panel</Text>
            </View>
          </View>
          <View style={{ flexDirection:'row', gap:6 }}>
            <TouchableOpacity onPress={() => setScreen('settings')} style={{ backgroundColor:'#ffffff15', borderRadius:8, padding:8 }}><Text style={{ fontSize:15 }}>⚙️</Text></TouchableOpacity>
            <TouchableOpacity onPress={onSwitch} style={{ backgroundColor:'#f4c430', borderRadius:8, paddingHorizontal:12, paddingVertical:8 }}>
              <Text style={{ fontWeight:'700', fontSize:12, color:'#1a1a1a' }}>👁 Customer</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection:'row', gap:6 }}>
          {[{id:'products',l:'📦 Products'},{id:'dashboard',l:'📊 Stats'},{id:'sales',l:'💰 Sales'}].map(tab => (
            <TouchableOpacity key={tab.id} onPress={() => setScreen(tab.id)}
              style={{ backgroundColor: screen===tab.id ? '#f4c430' : '#ffffff15', borderRadius:8, paddingHorizontal:12, paddingVertical:6 }}>
              <Text style={{ fontWeight:'700', fontSize:12, color: screen===tab.id ? '#1a1a1a' : '#fff' }}>{tab.l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* DASHBOARD */}
      {screen === 'dashboard' && (
        <ScrollView contentContainerStyle={{ padding:16 }}>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:16 }}>
            {[{l:'Products',v:products.length,i:'📦',c:'#1565c0'},{l:'Inventory Value',v:`$${totalVal.toFixed(2)}`,i:'💰',c:'#2e7d32'},{l:'Revenue',v:`$${totalRev.toFixed(2)}`,i:'🧾',c:'#880e4f'},{l:'Low Stock',v:allLow.length,i:'⚠️',c:'#e65100'}].map(s => (
              <View key={s.l} style={{ width:(SW-44)/2, backgroundColor:T.card, borderRadius:14, padding:14, borderLeftWidth:4, borderLeftColor:s.c, elevation:3 }}>
                <Text style={{ fontSize:22 }}>{s.i}</Text>
                <Text style={{ fontSize:20, fontWeight:'800', color:s.c, marginTop:4 }}>{s.v}</Text>
                <Text style={{ fontSize:11, color:T.sub, marginTop:2 }}>{s.l}</Text>
              </View>
            ))}
          </View>
          {cats.map(cat => {
            const items = products.filter(p => p.categoryId === cat.id);
            const val = items.reduce((s, p) => s + p.price * p.stock, 0);
            return (
              <View key={cat.id} style={{ backgroundColor:T.card, borderRadius:12, padding:14, marginBottom:8, flexDirection:'row', alignItems:'center', justifyContent:'space-between', elevation:2 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                  <View style={{ width:36, height:36, borderRadius:8, backgroundColor:cat.accent, alignItems:'center', justifyContent:'center' }}><Text style={{ fontSize:18 }}>{cat.emoji}</Text></View>
                  <View><Text style={{ fontWeight:'700', fontSize:13, color:T.text }}>{cat.name}</Text><Text style={{ fontSize:11, color:T.sub }}>{items.length} products</Text></View>
                </View>
                <Text style={{ fontWeight:'800', color:cat.accent }}>${val.toFixed(2)}</Text>
              </View>
            );
          })}
          {allLow.length > 0 && <>
            <Text style={{ fontWeight:'700', fontSize:14, marginTop:16, marginBottom:10, color:'#c62828' }}>⚠️ Low Stock</Text>
            {allLow.map(p => { const cat = cats.find(c => c.id===p.categoryId)||{emoji:'📦',name:'?'}; return (
              <View key={p.id} style={{ backgroundColor:'#fff3e0', borderRadius:10, padding:12, marginBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                <View><Text style={{ fontWeight:'600', fontSize:13, color:'#1a1a1a' }}>{p.name}</Text><Text style={{ fontSize:11, color:'#888' }}>{cat.name}</Text></View>
                <View style={{ backgroundColor:'#e65100', borderRadius:8, paddingHorizontal:10, paddingVertical:4 }}><Text style={{ color:'#fff', fontSize:12, fontWeight:'700' }}>{p.stock} left</Text></View>
              </View>
            );})}
          </>}
        </ScrollView>
      )}

      {/* SALES */}
      {screen === 'sales' && (
        <ScrollView contentContainerStyle={{ padding:16 }}>
          <Card T={T}>
            <Text style={{ fontWeight:'800', fontSize:15, color:T.text, marginBottom:14 }}>📝 Record a Sale</Text>
            <Lbl T={T}>Select Product</Lbl>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:12 }}>
              {products.filter(p => p.stock > 0).map(p => (
                <TouchableOpacity key={p.id} onPress={() => setSaleForm(f => ({ ...f, productId:String(p.id) }))}
                  style={{ marginRight:8, paddingHorizontal:14, paddingVertical:10, borderRadius:10, backgroundColor: saleForm.productId===String(p.id) ? '#f4c430' : T.card2, borderWidth:1, borderColor: saleForm.productId===String(p.id) ? '#f4c430' : T.border }}>
                  <Text style={{ fontWeight:'700', fontSize:12, color: saleForm.productId===String(p.id) ? '#1a1a1a' : T.text }}>{p.name}</Text>
                  <Text style={{ fontSize:10, color: saleForm.productId===String(p.id) ? '#333' : T.sub }}>Stock: {p.stock} · ${p.price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Lbl T={T}>Quantity Sold</Lbl>
            <Inp value={saleForm.qty} onChange={v => setSaleForm(f => ({ ...f, qty:v }))} numeric T={T} />
            {saleForm.productId && (
              <View style={{ backgroundColor:'#f4c43022', borderRadius:10, padding:10, marginBottom:12 }}>
                <Text style={{ fontSize:13, color:T.text }}>💰 Total: <Text style={{ fontWeight:'800' }}>${(parseFloat(products.find(p => p.id===parseInt(saleForm.productId))?.price||0)*parseInt(saleForm.qty||0)).toFixed(2)}</Text></Text>
              </View>
            )}
            <TouchableOpacity onPress={recordSale} style={{ backgroundColor:'#2e7d32', borderRadius:12, padding:14, alignItems:'center' }}>
              <Text style={{ color:'#fff', fontWeight:'800', fontSize:15 }}>✅ Record Sale</Text>
            </TouchableOpacity>
          </Card>
          <View style={{ backgroundColor:'#f4c43022', borderRadius:12, padding:14, marginBottom:14, flexDirection:'row', justifyContent:'space-between' }}>
            <Text style={{ color:T.sub, fontSize:13 }}>Total Revenue</Text>
            <Text style={{ fontWeight:'900', color:'#f4c430', fontSize:18 }}>${totalRev.toFixed(2)}</Text>
          </View>
          {sales.length === 0
            ? <View style={{ alignItems:'center', padding:40 }}><Text style={{ fontSize:40 }}>📭</Text><Text style={{ marginTop:10, color:T.sub }}>No sales yet</Text></View>
            : sales.map(sale => (
              <View key={sale.id} style={{ backgroundColor:T.card, borderRadius:12, padding:14, marginBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center', elevation:2 }}>
                <View><Text style={{ fontWeight:'700', fontSize:13, color:T.text }}>{sale.productName}</Text><Text style={{ fontSize:11, color:T.sub, marginTop:2 }}>{sale.date} · {sale.qty} unit{sale.qty>1?'s':''} × ${sale.price}</Text></View>
                <Text style={{ fontWeight:'800', color:'#2e7d32', fontSize:16 }}>${sale.total.toFixed(2)}</Text>
              </View>
            ))
          }
        </ScrollView>
      )}

      {/* PRODUCTS */}
      {(screen==='products'||screen==='add'||screen==='edit') && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor:T.card, borderBottomWidth:1, borderBottomColor:T.border, flexGrow:0 }}
            contentContainerStyle={{ paddingHorizontal:12, paddingTop:10, paddingBottom:10, gap:6 }}>
            {cats.map(cat => {
              const active = activeCatId === cat.id;
              const lc = products.filter(p => p.categoryId===cat.id && p.stock<=8).length;
              return (
                <TouchableOpacity key={cat.id} onPress={() => { setActiveCatId(cat.id); if (screen!=='add'&&screen!=='edit') setScreen('products'); setSearch(''); }}
                  style={{ paddingHorizontal:13, paddingVertical:7, borderRadius:8, backgroundColor: active ? cat.accent : 'transparent', marginRight:4 }}>
                  <Text style={{ fontWeight:'700', fontSize:12, color: active ? '#fff' : T.sub }}>{cat.emoji} {cat.name}{lc>0 ? ` ⚠️${lc}` : ''}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {screen === 'products' && (
            <View style={{ flex:1 }}>
              <View style={{ flexDirection:'row', gap:10, padding:14, paddingBottom:8 }}>
                <TextInput value={search} onChangeText={setSearch} placeholder="🔍 Search..." placeholderTextColor={T.sub}
                  style={{ flex:1, backgroundColor:T.input, color:T.text, borderWidth:1.5, borderColor:T.ib, borderRadius:10, padding:10, fontSize:14 }} />
                <TouchableOpacity onPress={() => { setForm({ name:'',price:'',stock:'',unit:'pcs',image:null,originalPrice:'' }); setScreen('add'); }}
                  style={{ backgroundColor:activeCat?.accent||'#f4c430', borderRadius:10, paddingHorizontal:18, alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ color:'#fff', fontWeight:'700', fontSize:16 }}>+ Add</Text>
                </TouchableOpacity>
              </View>
              {filtered.length === 0
                ? <View style={{ alignItems:'center', padding:60 }}><Text style={{ fontSize:40 }}>📭</Text><Text style={{ marginTop:10, color:T.sub }}>No products — tap + Add</Text></View>
                : <FlatList data={filtered} keyExtractor={p => String(p.id)} contentContainerStyle={{ padding:14, paddingTop:4 }}
                    renderItem={({ item: p }) => {
                      const avgR = p.reviews?.length ? (p.reviews.reduce((s,r)=>s+r.rating,0)/p.reviews.length) : 0;
                      return (
                        <View style={{ backgroundColor:T.card, borderRadius:14, padding:14, marginBottom:10, borderLeftWidth:4, borderLeftColor:activeCat?.accent||'#888', flexDirection:'row', alignItems:'center', gap:12, elevation:3 }}>
                          {p.image ? <Image source={{ uri:p.image }} style={{ width:54, height:54, borderRadius:10 }} />
                            : <View style={{ width:54, height:54, borderRadius:10, backgroundColor:'#ffffff15', alignItems:'center', justifyContent:'center' }}><Text style={{ fontSize:24 }}>{activeCat?.emoji||'📦'}</Text></View>}
                          <View style={{ flex:1 }}>
                            <Text style={{ fontWeight:'700', fontSize:14, color:T.text }} numberOfLines={1}>{p.name}</Text>
                            {p.originalPrice && <Text style={{ fontSize:11, color:T.sub, textDecorationLine:'line-through' }}>${p.originalPrice.toFixed(2)}</Text>}
                            <View style={{ flexDirection:'row', gap:6, marginTop:5, flexWrap:'wrap' }}>
                              <View style={{ backgroundColor:'#e8f5e9', borderRadius:6, paddingHorizontal:9, paddingVertical:3 }}><Text style={{ color:'#2e7d32', fontSize:12, fontWeight:'700' }}>💲{p.price.toFixed(2)}</Text></View>
                              <View style={{ backgroundColor: p.stock<=8?'#ffebee':'#e3f2fd', borderRadius:6, paddingHorizontal:9, paddingVertical:3 }}><Text style={{ color: p.stock<=8?'#c62828':'#1565c0', fontSize:12, fontWeight:'700' }}>📦 {p.stock} {p.unit}{p.stock<=8?' ⚠️':''}</Text></View>
                            </View>
                            {avgR > 0 && <Text style={{ marginTop:4, fontSize:11, color:'#f4c430' }}>{'★'.repeat(Math.round(avgR))}{'☆'.repeat(5-Math.round(avgR))} ({p.reviews.length})</Text>}
                          </View>
                          <View style={{ gap:6 }}>
                            <TouchableOpacity onPress={() => openEdit(p)} style={{ backgroundColor:activeCat?.light||'#eee', borderRadius:8, padding:8 }}><Text style={{ color:activeCat?.accent||'#333', fontWeight:'700' }}>✏️</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(p.id, p.name)} style={{ backgroundColor:'#ffebee', borderRadius:8, padding:8 }}><Text style={{ color:'#c62828', fontWeight:'700' }}>🗑️</Text></TouchableOpacity>
                          </View>
                        </View>
                      );
                    }}
                  />
              }
            </View>
          )}

          {(screen==='add'||screen==='edit') && (
            <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios' ? 'padding' : 'height'}>
              <ScrollView contentContainerStyle={{ padding:16 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:18 }}>
                  <TouchableOpacity onPress={() => setScreen('products')} style={{ backgroundColor:T.card2, borderRadius:8, paddingHorizontal:14, paddingVertical:8 }}>
                    <Text style={{ fontWeight:'700', color:T.text }}>← Back</Text>
                  </TouchableOpacity>
                  <Text style={{ fontWeight:'800', fontSize:17, color:T.text }}>{screen==='add' ? `Add to ${activeCat?.name}` : 'Edit Product'}</Text>
                </View>
                <Card T={T}>
                  <Lbl T={T}>Product Photo (optional)</Lbl>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                    {form.image ? <Image source={{ uri:form.image }} style={{ width:72, height:72, borderRadius:12 }} />
                      : <View style={{ width:72, height:72, borderRadius:12, backgroundColor:T.card2, borderWidth:2, borderColor:T.border, borderStyle:'dashed', alignItems:'center', justifyContent:'center' }}>
                          <Text style={{ fontSize:24 }}>📷</Text><Text style={{ fontSize:10, color:T.sub }}>No photo</Text>
                        </View>}
                    <View style={{ gap:8 }}>
                      <TouchableOpacity onPress={async () => { const img = await pickImg(); if (img) setForm(f => ({ ...f, image:img })); }}
                        style={{ backgroundColor:'#1a1a2e', borderRadius:8, paddingHorizontal:16, paddingVertical:9 }}>
                        <Text style={{ color:'#fff', fontWeight:'700', fontSize:13 }}>📷 {form.image ? 'Change' : 'Upload'}</Text>
                      </TouchableOpacity>
                      {form.image && <TouchableOpacity onPress={() => setForm(f => ({ ...f, image:null }))} style={{ backgroundColor:'#ffebee', borderRadius:8, paddingHorizontal:16, paddingVertical:7 }}>
                        <Text style={{ color:'#c62828', fontWeight:'700', fontSize:12 }}>🗑 Remove</Text>
                      </TouchableOpacity>}
                    </View>
                  </View>
                </Card>
                <Card T={T}>
                  <Lbl T={T}>Product Name *</Lbl>
                  <Inp value={form.name} onChange={v => setForm(f => ({ ...f, name:v }))} placeholder="e.g. Basmati Rice 5kg" T={T} />
                  <Lbl T={T}>Original Price (for discount display)</Lbl>
                  <Inp value={form.originalPrice} onChange={v => setForm(f => ({ ...f, originalPrice:v }))} placeholder="0.00" numeric T={T} />
                  <Lbl T={T}>Selling Price ($) *</Lbl>
                  <Inp value={form.price} onChange={v => setForm(f => ({ ...f, price:v }))} placeholder="0.00" numeric T={T} />
                  <Lbl T={T}>Stock Quantity *</Lbl>
                  <Inp value={form.stock} onChange={v => setForm(f => ({ ...f, stock:v }))} placeholder="0" numeric T={T} />
                  <Lbl T={T}>Unit</Lbl>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:12 }}>
                    {UNITS.map(u => (
                      <TouchableOpacity key={u} onPress={() => setForm(f => ({ ...f, unit:u }))}
                        style={{ marginRight:8, paddingHorizontal:14, paddingVertical:8, borderRadius:8, backgroundColor: form.unit===u ? activeCat?.accent||'#f4c430' : T.card2, borderWidth:1, borderColor:T.border }}>
                        <Text style={{ color: form.unit===u ? '#fff' : T.text, fontWeight:'600', fontSize:13 }}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Card>
                <TouchableOpacity onPress={screen==='add' ? handleAdd : handleEdit}
                  style={{ backgroundColor:activeCat?.accent||'#f4c430', borderRadius:12, padding:15, alignItems:'center', marginTop:4 }}>
                  <Text style={{ color:'#fff', fontWeight:'800', fontSize:16 }}>{screen==='add' ? '✅ Add Product' : '💾 Save Changes'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

// ─── CUSTOMER APP ─────────────────────────────────────────────────────────────
function CustomerApp({ products, setProducts, cats, biz, onSwitch, theme, setTheme }) {
  const T = THEME[theme];
  const [activeCatId, setActiveCatId] = useState('all');
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState([]);
  const [view, setView] = useState('shop');
  const [toast, show] = useToast();
  const [selected, setSelected] = useState(null);
  const [revForm, setRevForm] = useState({ rating:0, text:'', name:'' });

  const toggleSave = p => {
    if (saved.some(s => s.id===p.id)) { setSaved(prev => prev.filter(s => s.id!==p.id)); show('🗑 Removed','remove'); }
    else { setSaved(prev => [...prev,p]); show(`❤️ "${p.name}" saved!`); }
  };
  const isSaved = id => saved.some(s => s.id===id);

  const filtered = products.filter(p => {
    const mc = activeCatId==='all' || p.categoryId===activeCatId;
    const ms = p.name.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  const totalSaved = saved.reduce((s, p) => s + p.price, 0);
  const avgR = p => p.reviews?.length ? (p.reviews.reduce((s,r) => s+r.rating,0)/p.reviews.length).toFixed(1) : null;

  const sendWA = () => {
    if (!biz.whatsapp) return show('⚠️ WhatsApp not configured','error');
    const lines = saved.map(p => `• ${p.name} — $${p.price.toFixed(2)}`).join('\n');
    const msg = encodeURIComponent(`Hi! I'm interested in these items from ${biz.name}:\n\n${lines}\n\nEstimated Total: $${totalSaved.toFixed(2)}`);
    Linking.openURL(`https://wa.me/${biz.whatsapp.replace(/\D/g,'')}?text=${msg}`);
  };

  const shareP = async p => {
    const cat = cats.find(c => c.id===p.categoryId);
    try { await Share.share({ message:`${p.name} — $${p.price.toFixed(2)}\nCategory: ${cat?.name||''}\nIn stock: ${p.stock} ${p.unit}\nFrom: ${biz.name}` }); } catch {}
  };

  const submitReview = async () => {
    if (!revForm.rating) return show('⚠️ Select a star rating','error');
    if (!revForm.name.trim()) return show('⚠️ Enter your name','error');
    const review = { id:Date.now(), rating:revForm.rating, text:revForm.text, name:revForm.name, date:new Date().toLocaleDateString() };
    const updated = products.map(p => p.id===selected.id ? { ...p, reviews:[review,...(p.reviews||[])] } : p);
    setProducts(updated); await S.set('shop_products', updated);
    setSelected(updated.find(p => p.id===selected.id));
    setRevForm({ rating:0, text:'', name:'' }); show('⭐ Review submitted!');
  };

  const iw = (SW-36)/2;

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:T.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ToastBanner toast={toast} />

      {/* Detail modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={{ flex:1, backgroundColor:'#000000cc', justifyContent:'flex-end' }}>
          <TouchableOpacity style={{ flex:1 }} onPress={() => setSelected(null)} />
          <View style={{ backgroundColor:T.card, borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'88%', borderTopWidth:3, borderTopColor: selected ? (cats.find(c=>c.id===selected.categoryId)?.accent||'#f4c430') : '#f4c430' }}>
            <ScrollView contentContainerStyle={{ padding:20 }} keyboardShouldPersistTaps="handled">
              <View style={{ width:40, height:4, backgroundColor:T.border, borderRadius:2, alignSelf:'center', marginBottom:18 }} />
              {selected && (() => {
                const cat = cats.find(c => c.id===selected.categoryId)||{emoji:'📦',accent:'#888',name:'?',light:'#eee'};
                const rating = avgR(selected);
                return (
                  <>
                    <View style={{ flexDirection:'row', gap:14, marginBottom:16 }}>
                      {selected.image ? <Image source={{ uri:selected.image }} style={{ width:88, height:88, borderRadius:16 }} />
                        : <View style={{ width:88, height:88, borderRadius:16, backgroundColor:cat.accent+'22', alignItems:'center', justifyContent:'center' }}><Text style={{ fontSize:40 }}>{cat.emoji}</Text></View>}
                      <View style={{ flex:1 }}>
                        <Text style={{ fontSize:16, fontWeight:'800', color:T.text, marginBottom:4 }}>{selected.name}</Text>
                        <View style={{ backgroundColor:cat.accent+'22', borderRadius:6, paddingHorizontal:9, paddingVertical:2, alignSelf:'flex-start', marginBottom:6 }}>
                          <Text style={{ color:cat.accent, fontSize:11, fontWeight:'700' }}>{cat.name}</Text>
                        </View>
                        {selected.originalPrice && <Text style={{ fontSize:12, color:T.sub, textDecorationLine:'line-through' }}>${selected.originalPrice.toFixed(2)}</Text>}
                        <Text style={{ fontSize:24, fontWeight:'900', color:'#f4c430' }}>${selected.price.toFixed(2)}</Text>
                        {rating && <Stars value={Math.round(parseFloat(rating))} size={16} />}
                      </View>
                    </View>
                    <View style={{ backgroundColor:T.card2, borderRadius:12, padding:14, marginBottom:14 }}>
                      <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                        <Text style={{ color:T.sub, fontSize:13 }}>Status</Text>
                        <Text style={{ fontWeight:'700', fontSize:13, color: selected.stock===0?'#ef5350':selected.stock<=8?'#ffb74d':'#81c784' }}>
                          {selected.stock===0?'❌ Out of Stock':selected.stock<=8?`⚠️ Only ${selected.stock} left`:'✅ In Stock'}
                        </Text>
                      </View>
                      <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                        <Text style={{ color:T.sub, fontSize:13 }}>Available</Text>
                        <Text style={{ fontWeight:'700', fontSize:13, color:T.text }}>{selected.stock} {selected.unit}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection:'row', gap:8, marginBottom:20 }}>
                      <TouchableOpacity onPress={() => toggleSave(selected)} style={{ flex:1, backgroundColor: isSaved(selected.id)?'#333':'#f4c430', borderRadius:12, padding:14, alignItems:'center' }}>
                        <Text style={{ fontWeight:'800', fontSize:14, color: isSaved(selected.id)?'#fff':'#1a1a1a' }}>{isSaved(selected.id)?'🗑 Unsave':'❤️ Save'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => shareP(selected)} style={{ backgroundColor:T.card2, borderRadius:12, padding:14, alignItems:'center', borderWidth:1, borderColor:T.border }}>
                        <Text style={{ fontWeight:'700', fontSize:14, color:T.text }}>🔗 Share</Text>
                      </TouchableOpacity>
                    </View>
                    {/* Reviews */}
                    <Text style={{ fontWeight:'800', fontSize:15, color:T.text, marginBottom:12 }}>⭐ Reviews {selected.reviews?.length>0&&`(${selected.reviews.length})`}</Text>
                    <View style={{ backgroundColor:T.card2, borderRadius:14, padding:14, marginBottom:14 }}>
                      <Text style={{ fontWeight:'700', fontSize:13, color:T.sub, marginBottom:10 }}>Leave a Review</Text>
                      <Stars value={revForm.rating} onChange={r => setRevForm(f => ({ ...f, rating:r }))} size={28} />
                      <TextInput value={revForm.name} onChangeText={v => setRevForm(f => ({ ...f, name:v }))} placeholder="Your name *" placeholderTextColor={T.sub}
                        style={{ backgroundColor:T.input, color:T.text, borderWidth:1.5, borderColor:T.ib, borderRadius:9, padding:10, fontSize:13, marginTop:10 }} />
                      <TextInput value={revForm.text} onChangeText={v => setRevForm(f => ({ ...f, text:v }))} placeholder="Comment (optional)" placeholderTextColor={T.sub} multiline numberOfLines={2} textAlignVertical="top"
                        style={{ backgroundColor:T.input, color:T.text, borderWidth:1.5, borderColor:T.ib, borderRadius:9, padding:10, fontSize:13, marginTop:8 }} />
                      <TouchableOpacity onPress={submitReview} style={{ backgroundColor:cat.accent, borderRadius:10, padding:11, alignItems:'center', marginTop:8 }}>
                        <Text style={{ color:'#fff', fontWeight:'700', fontSize:14 }}>Submit Review</Text>
                      </TouchableOpacity>
                    </View>
                    {selected.reviews?.length===0 && <Text style={{ textAlign:'center', color:T.sub, fontSize:13, paddingVertical:10 }}>No reviews yet — be the first!</Text>}
                    {selected.reviews?.map(r => (
                      <View key={r.id} style={{ backgroundColor:T.card2, borderRadius:12, padding:14, marginBottom:8 }}>
                        <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                          <Text style={{ fontWeight:'700', fontSize:13, color:T.text }}>{r.name}</Text>
                          <Text style={{ fontSize:11, color:T.sub }}>{r.date}</Text>
                        </View>
                        <Stars value={r.rating} size={14} />
                        {r.text ? <Text style={{ fontSize:13, color:T.sub, marginTop:6 }}>{r.text}</Text> : null}
                      </View>
                    ))}
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={{ backgroundColor:'#1a1a2e', padding:16, paddingBottom:12 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
            {biz.logo ? <Image source={{ uri:biz.logo }} style={{ width:34, height:34, borderRadius:8 }} /> : <Text style={{ fontSize:26 }}>🏪</Text>}
            <View><Text style={{ fontSize:18, fontWeight:'900', color:'#fff' }}>{biz.name}</Text><Text style={{ fontSize:10, color:'#aaa' }}>{biz.tagline}</Text></View>
          </View>
          <View style={{ flexDirection:'row', gap:6 }}>
            <TouchableOpacity onPress={() => setTheme(t => t==='dark'?'light':'dark')} style={{ backgroundColor:'#ffffff15', borderRadius:8, padding:8 }}>
              <Text style={{ fontSize:15 }}>{theme==='dark'?'☀️':'🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSwitch} style={{ backgroundColor:'#ffffff15', borderRadius:8, paddingHorizontal:12, paddingVertical:8 }}>
              <Text style={{ color:'#fff', fontWeight:'700', fontSize:12 }}>🔧 Owner</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection:'row', backgroundColor:'#ffffff10', borderRadius:12, alignItems:'center', paddingHorizontal:12 }}>
          <Text style={{ fontSize:16, marginRight:4 }}>🔍</Text>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search products..." placeholderTextColor="#888"
            style={{ flex:1, color:'#fff', fontSize:14, paddingVertical:10 }} />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color:'#aaa', fontSize:20 }}>×</Text></TouchableOpacity> : null}
        </View>
      </View>

      {view === 'shop' && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow:0, backgroundColor:T.bg }}
            contentContainerStyle={{ paddingHorizontal:14, paddingVertical:10, gap:8 }}>
            {[{id:'all',name:'All',emoji:'🏪'}, ...cats].map(cat => (
              <TouchableOpacity key={cat.id} onPress={() => setActiveCatId(cat.id)}
                style={{ paddingHorizontal:15, paddingVertical:7, borderRadius:30, backgroundColor: activeCatId===cat.id?'#f4c430':'#ffffff10', borderWidth: activeCatId!==cat.id?1:0, borderColor:'#ffffff20', marginRight:4 }}>
                <Text style={{ color: activeCatId===cat.id?'#1a1a1a':'#ccc', fontWeight: activeCatId===cat.id?'800':'500', fontSize:13 }}>{cat.emoji} {cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={{ paddingHorizontal:14, paddingBottom:4, fontSize:12, color:T.sub }}>{filtered.length} product{filtered.length!==1?'s':''}</Text>
          <FlatList data={filtered} numColumns={2} keyExtractor={p => String(p.id)}
            contentContainerStyle={{ paddingHorizontal:12, paddingBottom:80 }}
            columnWrapperStyle={{ gap:12, marginBottom:12 }}
            ListEmptyComponent={() => <View style={{ alignItems:'center', padding:60 }}><Text style={{ fontSize:40 }}>🔎</Text><Text style={{ marginTop:10, color:T.sub }}>No products found</Text></View>}
            renderItem={({ item: p }) => {
              const cat = cats.find(c => c.id===p.categoryId)||{emoji:'📦',dark:'#333',accent:'#666'};
              const oos = p.stock===0; const low = p.stock>0&&p.stock<=8;
              const ps = isSaved(p.id); const rating = avgR(p);
              return (
                <TouchableOpacity onPress={() => { setSelected(p); setRevForm({rating:0,text:'',name:''}); }} activeOpacity={0.9}
                  style={{ width:iw, borderRadius:18, overflow:'hidden', borderWidth:1.5, borderColor: ps?'#f4c430':'transparent', opacity:oos?0.6:1, backgroundColor:cat.dark||'#1a1a2e' }}>
                  <View style={{ width:'100%', height:100, backgroundColor:'#ffffff10', alignItems:'center', justifyContent:'center' }}>
                    {p.image ? <Image source={{ uri:p.image }} style={{ width:'100%', height:100 }} resizeMode="cover" />
                      : <Text style={{ fontSize:44, opacity:0.35 }}>{cat.emoji}</Text>}
                    <TouchableOpacity onPress={() => !oos&&toggleSave(p)} style={{ position:'absolute', top:7, right:7, backgroundColor: ps?'#f4c430':'#00000066', borderRadius:15, width:30, height:30, alignItems:'center', justifyContent:'center' }}>
                      <Text style={{ fontSize:14 }}>{ps?'❤️':'🤍'}</Text>
                    </TouchableOpacity>
                    {p.originalPrice && <View style={{ position:'absolute', top:7, left:7, backgroundColor:'#c62828', borderRadius:6, paddingHorizontal:7, paddingVertical:2 }}><Text style={{ color:'#fff', fontSize:10, fontWeight:'800' }}>SALE</Text></View>}
                    {oos && <View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#00000077', alignItems:'center', justifyContent:'center' }}><Text style={{ color:'#ef5350', fontWeight:'700', fontSize:11 }}>OUT OF STOCK</Text></View>}
                  </View>
                  <View style={{ padding:11, paddingBottom:14 }}>
                    <Text style={{ fontSize:12, fontWeight:'700', color:'#fff', marginBottom:4, lineHeight:16 }} numberOfLines={2}>{p.name}</Text>
                    {p.originalPrice && <Text style={{ fontSize:10, color:'#ffaaaa', textDecorationLine:'line-through' }}>${p.originalPrice.toFixed(2)}</Text>}
                    <Text style={{ fontSize:18, fontWeight:'900', color:'#f4c430', marginBottom:3 }}>${p.price.toFixed(2)}</Text>
                    {rating && <Text style={{ fontSize:10, color:'#f4c430', marginBottom:2 }}>{'★'.repeat(Math.round(parseFloat(rating)))} {rating}</Text>}
                    <Text style={{ fontSize:10, fontWeight:'600', color: oos?'#ef5350':low?'#ffb74d':'#81c784' }}>
                      {oos?'❌ Out':low?`⚠️ ${p.stock} left`:`✅ ${p.stock} ${p.unit}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}

      {view === 'saved' && (
        <ScrollView contentContainerStyle={{ padding:16, paddingBottom:80 }}>
          <Text style={{ fontWeight:'800', fontSize:18, color:T.text, marginBottom:4 }}>❤️ Saved List</Text>
          <Text style={{ fontSize:13, color:T.sub, marginBottom:16 }}>{saved.length===0?'Nothing saved yet':`${saved.length} item${saved.length>1?'s':''} · Est. $${totalSaved.toFixed(2)}`}</Text>
          {saved.length===0
            ? <View style={{ alignItems:'center', paddingVertical:60 }}>
                <Text style={{ fontSize:48 }}>🤍</Text>
                <Text style={{ marginTop:12, fontSize:15, color:T.sub }}>Nothing saved yet</Text>
                <TouchableOpacity onPress={() => setView('shop')} style={{ marginTop:16, backgroundColor:'#f4c430', borderRadius:30, paddingHorizontal:28, paddingVertical:12 }}>
                  <Text style={{ fontWeight:'800', fontSize:14, color:'#1a1a1a' }}>Browse →</Text>
                </TouchableOpacity>
              </View>
            : <>
                {saved.map(p => {
                  const cat = cats.find(c => c.id===p.categoryId)||{emoji:'📦',name:'?'};
                  return (
                    <View key={p.id} style={{ backgroundColor:T.card, borderRadius:16, padding:14, marginBottom:10, flexDirection:'row', alignItems:'center', gap:12, elevation:2 }}>
                      {p.image ? <Image source={{ uri:p.image }} style={{ width:52, height:52, borderRadius:10 }} />
                        : <View style={{ width:52, height:52, borderRadius:10, backgroundColor:'#ffffff15', alignItems:'center', justifyContent:'center' }}><Text style={{ fontSize:24 }}>{cat.emoji}</Text></View>}
                      <View style={{ flex:1 }}>
                        <Text style={{ fontWeight:'700', fontSize:13, color:T.text }} numberOfLines={1}>{p.name}</Text>
                        <Text style={{ fontSize:11, color:T.sub, marginTop:2 }}>{cat.name}</Text>
                        <Text style={{ fontSize:18, fontWeight:'900', color:'#f4c430', marginTop:4 }}>${p.price.toFixed(2)}</Text>
                      </View>
                      <View style={{ gap:6 }}>
                        <TouchableOpacity onPress={() => shareP(p)} style={{ backgroundColor:T.card2, borderRadius:8, padding:8, borderWidth:1, borderColor:T.border }}><Text style={{ fontSize:12, color:T.text }}>🔗</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => toggleSave(p)} style={{ backgroundColor:'#ff525222', borderRadius:8, padding:8 }}><Text style={{ fontSize:12, color:'#ff5252', fontWeight:'700' }}>✕</Text></TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
                <View style={{ backgroundColor:T.card, borderRadius:16, padding:18, marginTop:8, elevation:2 }}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <Text style={{ color:T.sub, fontSize:14 }}>Estimated Total</Text>
                    <Text style={{ fontSize:26, fontWeight:'900', color:'#f4c430' }}>${totalSaved.toFixed(2)}</Text>
                  </View>
                  {biz.whatsapp
                    ? <TouchableOpacity onPress={sendWA} style={{ backgroundColor:'#25D366', borderRadius:12, padding:14, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8, marginBottom:10 }}>
                        <Text style={{ fontSize:20 }}>💬</Text><Text style={{ color:'#fff', fontWeight:'800', fontSize:15 }}>Order via WhatsApp</Text>
                      </TouchableOpacity>
                    : <View style={{ backgroundColor:T.card2, borderRadius:10, padding:12, marginBottom:10, alignItems:'center' }}><Text style={{ fontSize:12, color:T.sub }}>WhatsApp not set up yet</Text></View>
                  }
                  <TouchableOpacity onPress={() => { setSaved([]); show('🗑 List cleared','remove'); }} style={{ borderRadius:10, padding:10, alignItems:'center', borderWidth:1, borderColor:T.border }}>
                    <Text style={{ color:T.sub, fontSize:13, fontWeight:'600' }}>🗑 Clear All</Text>
                  </TouchableOpacity>
                </View>
              </>
          }
        </ScrollView>
      )}

      {/* Bottom nav */}
      <View style={{ position:'absolute', bottom:0, left:0, right:0, backgroundColor:T.bg, borderTopWidth:1, borderTopColor:T.border, flexDirection:'row' }}>
        {[{id:'shop',icon:'🏪',label:'Shop'},{id:'saved',icon:'❤️',label:saved.length>0?`Saved (${saved.length})`:'Saved'}].map(tab => (
          <TouchableOpacity key={tab.id} onPress={() => setView(tab.id)}
            style={{ flex:1, alignItems:'center', paddingVertical:12, borderTopWidth:2, borderTopColor: view===tab.id?'#f4c430':'transparent' }}>
            <Text style={{ fontSize:20 }}>{tab.icon}</Text>
            <Text style={{ fontSize:11, fontWeight:'700', color: view===tab.id?'#f4c430':T.sub, marginTop:2 }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode]       = useState('loading');
  const [cats, setCats]       = useState(DEFAULT_CATS);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [sales, setSales]     = useState([]);
  const [biz, setBiz]         = useState(DEFAULT_BIZ);
  const [theme, setTheme]     = useState('dark');

  useEffect(() => {
    (async () => {
      const [c,p,sa,b,th] = await Promise.all([
        S.get('shop_cats', DEFAULT_CATS),
        S.get('shop_products', DEFAULT_PRODUCTS),
        S.get('shop_sales', []),
        S.get('shop_biz', DEFAULT_BIZ),
        S.get('shop_theme', 'dark'),
      ]);
      setCats(c); setProducts(p); setSales(sa); setBiz(b); setTheme(th);
      setTimeout(() => setMode('pin'), 1400);
    })();
  }, []);

  useEffect(() => { S.set('shop_theme', theme); }, [theme]);

  const T = THEME[theme];

  if (mode === 'loading') return (
    <SafeAreaView style={{ flex:1, backgroundColor:T.bg, alignItems:'center', justifyContent:'center' }}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      {biz.logo ? <Image source={{ uri:biz.logo }} style={{ width:80, height:80, borderRadius:20, marginBottom:16 }} /> : <Text style={{ fontSize:64, marginBottom:8 }}>🏪</Text>}
      <Text style={{ color:'#f4c430', fontSize:24, fontWeight:'900' }}>{biz.name}</Text>
      <Text style={{ color:T.sub, fontSize:13, marginTop:6 }}>{biz.tagline}</Text>
      <ActivityIndicator color="#f4c430" style={{ marginTop:24 }} size="large" />
    </SafeAreaView>
  );

  if (mode === 'pin') return <PinLock biz={biz} onUnlock={() => setMode('owner')} onGuest={() => setMode('customer')} T={T} />;

  if (mode === 'owner') return (
    <OwnerApp products={products} setProducts={setProducts} sales={sales} setSales={setSales}
      biz={biz} setBiz={setBiz} cats={cats} setCats={setCats}
      theme={theme} setTheme={setTheme} onSwitch={() => setMode('customer')} />
  );

  return (
    <CustomerApp products={products} setProducts={setProducts} cats={cats}
      biz={biz} theme={theme} setTheme={setTheme} onSwitch={() => setMode('pin')} />
  );
}
