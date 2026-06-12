import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    updateDoc,
    doc,
    setDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import {
    getAuth,
    signInAnonymously,
    signInWithCustomToken,
    onAuthStateChanged
} from 'firebase/auth';
import {
    Coffee,
    ShoppingBag,
    CheckCircle,
    Clock,
    ChefHat,
    User,
    Plus,
    Minus,
    QrCode,
    Phone,
    UtensilsCrossed,
    Database,
    Trash2,
    CheckSquare,
    Square,
    ThermometerSun,
    ThermometerSnowflake,
    Check,
    Lock,
    Settings
} from 'lucide-react';

const MENU = [
    // Hot Drinks
    { id: 1, name: 'Americano (Hot)', price: 150, category: 'drink', subType: 'hot' },
    { id: 2, name: 'Cappuccino (Hot)', price: 150, category: 'drink', subType: 'hot' },
    { id: 3, name: 'Latte (Hot)', price: 150, category: 'drink', subType: 'hot' },
    { id: 7, name: 'Belgian Chocolate (Hot)', price: 300, category: 'drink', subType: 'hot' },

    // Cold Drinks
    { id: 4, name: 'Cold Coffee', price: 200, category: 'drink', subType: 'cold' },
    { id: 5, name: 'Iced Latte', price: 180, category: 'drink', subType: 'cold' },
    { id: 6, name: 'Cold Brew', price: 150, category: 'drink', subType: 'cold' },
    { id: 77, name: 'Belgian Chocolate (Cold)', price: 300, category: 'drink', subType: 'cold' },
    { id: 8, name: 'Kombucha - Blueberry', price: 180, category: 'drink', subType: 'cold' },
    { id: 9, name: 'Kombucha - Rose', price: 180, category: 'drink', subType: 'cold' },
    { id: 10, name: 'Kombucha - Lemon Ginger', price: 180, category: 'drink', subType: 'cold' },
    { id: 11, name: 'Lemon Mint Pineapple Juice', price: 150, category: 'drink', subType: 'cold' },

    // Food
    { id: 12, name: 'Butter Croissant', price: 130, category: 'food' },
    { id: 13, name: 'Cinnamon Roll', price: 130, category: 'food' },
    { id: 14, name: 'Korean Bun', price: 200, category: 'food' },
    { id: 15, name: 'Brownie', price: 130, category: 'food' },
    { id: 16, name: 'Oat Cookie', price: 100, category: 'food' },
    { id: 17, name: 'Chocolate Cookie', price: 100, category: 'food' },
    { id: 18, name: 'Garden Fresh Sandwich', price: 250, category: 'food' },
    { id: 19, name: 'Cottage Cheese Sandwich', price: 250, category: 'food' },
    { id: 20, name: 'Mushroom Sandwich', price: 250, category: 'food' },
];

// --- EDIT THESE CONSTANTS ---
const CAFE_UPI_ID = "Aekas Foodworks";
const CAFE_NAME = "Aekas's Coffee";
const BARISTA_PIN = "1234"; // Change this to your preferred PIN

const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'cafe-event-orders';

export default function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('customer');
    const [activeTab, setActiveTab] = useState('drinks');
    const [adminTab, setAdminTab] = useState('orders'); // 'orders' | 'settings'
    const [cart, setCart] = useState({});
    const [customerName, setCustomerName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [txnId, setTxnId] = useState('');
    const [orders, setOrders] = useState([]);
    const [customQrUrl, setCustomQrUrl] = useState('');
    const [filterDate, setFilterDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdminAuthed, setIsAdminAuthed] = useState(() => localStorage.getItem('baristaAuthed') === 'true');
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        };
        initAuth().catch(console.error);
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;
        const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
        const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => {
                const aDelivered = a.status === 'delivered' ? 1 : 0;
                const bDelivered = b.status === 'delivered' ? 1 : 0;
                if (aDelivered !== bDelivered) return aDelivered - bDelivered;
                return (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0);
            });
            setOrders(docs);
        }, (err) => console.error("Firestore access error:", err));

        const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config');
        const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().qrCodeBase64) {
                setCustomQrUrl(docSnap.data().qrCodeBase64);
            }
        }, (err) => console.error("Settings fetch error:", err));

        return () => {
            unsubscribeOrders();
            unsubscribeSettings();
        };
    }, [user]);

    const addToCart = (item) => setCart(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    const removeFromCart = (item) => setCart(prev => {
        const newQty = (prev[item.id] || 0) - 1;
        if (newQty <= 0) {
            const { [item.id]: _, ...rest } = prev;
            return rest;
        }
        return { ...prev, [item.id]: newQty };
    });

    const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);
    const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
        const item = MENU.find(m => m.id === parseInt(id));
        return sum + (item.price * qty);
    }, 0);

    const upiLink = `upi://pay?pa=${CAFE_UPI_ID}&pn=${encodeURIComponent(CAFE_NAME)}&am=${totalAmount}&cu=INR`;
    const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
    const displayQrUrl = customQrUrl || dynamicQrUrl;

    const placeOrder = async () => {
        if (!user || !customerName || !mobileNumber || !txnId || totalAmount === 0) return;
        setIsSubmitting(true);
        const orderItems = Object.entries(cart).map(([id, qty]) => {
            const item = MENU.find(m => m.id === parseInt(id));
            return { name: item.name, qty, price: item.price, isDelivered: false };
        });
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), {
                customerName,
                mobileNumber,
                txnId,
                items: orderItems,
                total: totalAmount,
                status: 'pending',
                paymentVerified: false,
                timestamp: serverTimestamp(),
                userId: user.uid
            });
            setCart({});
            setCustomerName('');
            setMobileNumber('');
            setTxnId('');
            setActiveTab('status');
        } catch (err) {
            console.error("Error writing order:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdminLogin = (e) => {
        e.preventDefault();
        if (pinInput === BARISTA_PIN) {
            setIsAdminAuthed(true);
            localStorage.setItem('baristaAuthed', 'true');
            setPinError(false);
            setPinInput('');
        } else {
            setPinError(true);
        }
    };

    const handleAdminLogout = () => {
        setIsAdminAuthed(false);
        localStorage.removeItem('baristaAuthed');
        setView('customer');
        setAdminTab('orders');
    };

    const seedSampleData = async () => {
        if (!user) return;
        const samples = [
            { customerName: "Aditya", mobileNumber: "9988776655", txnId: "9821", items: [{ name: "Cold Brew", qty: 2, price: 150, isDelivered: false }], total: 300, status: 'pending', paymentVerified: false },
            { customerName: "Mansi", mobileNumber: "9876543210", txnId: "4412", items: [{ name: "Iced Latte", qty: 1, price: 180, isDelivered: true }, { name: "Mushroom Sandwich", qty: 1, price: 250, isDelivered: true }], total: 430, status: 'delivered', paymentVerified: true },
        ];
        for (const s of samples) {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), {
                ...s,
                timestamp: serverTimestamp(),
                userId: user.uid
            });
        }
    };

    const togglePaymentVerified = async (orderId, currentStatus) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId), { paymentVerified: !currentStatus });
        } catch (err) {
            console.error("Update failed", err);
        }
    };

    const toggleItemDelivery = async (orderId, itemIndex) => {
        if (!user) return;
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        const newItems = [...order.items];
        newItems[itemIndex] = { ...newItems[itemIndex], isDelivered: !newItems[itemIndex].isDelivered };
        const allDelivered = newItems.every(i => i.isDelivered);
        const newStatus = allDelivered ? 'delivered' : 'preparing';
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId), {
                items: newItems,
                status: newStatus
            });
        } catch (err) {
            console.error("Item update failed", err);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId));
            setDeletingId(null);
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const todayStr = new Date().toLocaleDateString('en-CA');
    const availableDates = [...new Set([
        todayStr,
        ...orders.map(o => {
            if (!o.timestamp) return null;
            return new Date(o.timestamp.seconds * 1000).toLocaleDateString('en-CA');
        })
    ].filter(Boolean))].sort((a, b) => b.localeCompare(a));

    const filteredOrders = orders.filter(o => {
        if (filterDate === 'all') return true;
        if (!o.timestamp) return filterDate === new Date().toLocaleDateString('en-CA');
        return new Date(o.timestamp.seconds * 1000).toLocaleDateString('en-CA') === filterDate;
    });

    const totalAmountReceived = filteredOrders
        .filter(o => o.paymentVerified)
        .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

    const totalOrdersCount = filteredOrders.length;

    const renderItem = (item) => (
        <div key={item.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100">
            <div>
                <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                <p className="text-slate-500 text-xs font-medium">₹{item.price}</p>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1">
                {cart[item.id] ? (
                    <>
                        <button onClick={() => removeFromCart(item)} className="p-1 hover:bg-white rounded-lg transition-colors"><Minus size={18} className="text-slate-600" /></button>
                        <span className="w-4 text-center font-bold text-sm">{cart[item.id]}</span>
                        <button onClick={() => addToCart(item)} className="p-1 hover:bg-white rounded-lg transition-colors"><Plus size={18} className="text-slate-600" /></button>
                    </>
                ) : (
                    <button onClick={() => addToCart(item)} className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg">Add</button>
                )}
            </div>
        </div>
    );

    const myOrders = orders.filter(o => o.userId === user?.uid);

    if (!user) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-400 font-medium text-sm tracking-tight">Connecting...</div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
            <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">AI Study Group</h1>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">{view === 'admin' ? 'Barista Dashboard' : CAFE_NAME}</p>
                </div>
                <button onClick={() => setView(view === 'customer' ? 'admin' : 'customer')} className="p-2 rounded-lg bg-slate-100 text-slate-600">
                    {view === 'customer' ? <ChefHat size={20} /> : <User size={20} />}
                </button>
            </header>

            {view === 'customer' ? (
                <main className="p-4 max-w-lg mx-auto space-y-4">
                    <div className="flex bg-slate-200 p-1 rounded-2xl gap-1">
                        <button onClick={() => setActiveTab('drinks')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'drinks' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}><Coffee size={16} />Drinks</button>
                        <button onClick={() => setActiveTab('food')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'food' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}><UtensilsCrossed size={16} />Food</button>
                        <button onClick={() => setActiveTab('order')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all relative ${activeTab === 'order' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}><ShoppingBag size={16} />Cart {cartItemCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-slate-200">{cartItemCount}</span>}</button>
                        {myOrders.length > 0 && (
                            <button onClick={() => setActiveTab('status')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'status' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}><Clock size={16} />Status</button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {activeTab === 'drinks' && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-1">
                                        <ThermometerSun size={14} className="text-orange-500" />
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hot Selection</h3>
                                    </div>
                                    <div className="grid gap-3">
                                        {MENU.filter(item => item.category === 'drink' && item.subType === 'hot').map(renderItem)}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-1">
                                        <ThermometerSnowflake size={14} className="text-blue-500" />
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cold & Iced</h3>
                                    </div>
                                    <div className="grid gap-3">
                                        {MENU.filter(item => item.category === 'drink' && item.subType === 'cold').map(renderItem)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'food' && (
                            <div className="grid gap-3">{MENU.filter(item => item.category === 'food').map(renderItem)}</div>
                        )}

                        {activeTab === 'order' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {totalAmount === 0 ? (
                                    <div className="bg-white p-12 rounded-3xl text-center border border-slate-100">
                                        <ShoppingBag className="mx-auto mb-4 text-slate-200" size={48} />
                                        <p className="text-slate-500 font-bold">Your cart is empty.</p>
                                        <button onClick={() => setActiveTab('drinks')} className="mt-4 text-blue-600 text-sm font-bold">Browse Menu</button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">Order Summary</h3>
                                            {Object.entries(cart).map(([id, qty]) => {
                                                const item = MENU.find(m => m.id === parseInt(id));
                                                return (
                                                    <div key={id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                                        <div className="flex-1">
                                                            <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                                            <p className="text-slate-400 text-xs">₹{item.price} × {qty}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1">
                                                            <button onClick={() => removeFromCart(item)} className="p-1 hover:bg-white rounded-lg transition-colors">
                                                                {qty === 1 ? <Trash2 size={16} className="text-red-400" /> : <Minus size={16} className="text-slate-600" />}
                                                            </button>
                                                            <span className="w-4 text-center font-bold text-xs">{qty}</span>
                                                            <button onClick={() => addToCart(item)} className="p-1 hover:bg-white rounded-lg transition-colors">
                                                                <Plus size={16} className="text-slate-600" />
                                                            </button>
                                                        </div>
                                                        <div className="w-16 text-right font-bold text-sm">₹{item.price * qty}</div>
                                                    </div>
                                                );
                                            })}
                                            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
                                                <span className="font-bold text-slate-900">Total</span>
                                                <span className="text-xl font-bold text-slate-900">₹{totalAmount}</span>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-6">
                                            <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center justify-center border border-slate-100">
                                                <div className="flex items-center gap-2 mb-4 text-slate-600">
                                                    <QrCode size={18} />
                                                    <span className="text-xs font-bold uppercase tracking-wide text-[10px]">Scan and Pay - UPI App</span>
                                                </div>
                                                <div className="bg-white p-2 rounded-xl shadow-sm mb-3">
                                                    <img src={displayQrUrl} alt="UPI QR Code" className="w-48 h-48" />
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-bold text-center leading-relaxed uppercase tracking-tighter">
                                                    <br /><span className="text-slate-900">{CAFE_UPI_ID}</span>
                                                </p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">Your Name</label>
                                                    <input type="text" placeholder="Aditya" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-sm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">Mobile Number</label>
                                                    <div className="relative">
                                                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input type="tel" placeholder="9876543210" className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-sm" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">Txn ID (Last 4 Digits)</label>
                                                    <input type="text" placeholder="From UPI receipt" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-sm" value={txnId} onChange={(e) => setTxnId(e.target.value)} />
                                                </div>
                                                <button disabled={!customerName || !mobileNumber || !txnId || isSubmitting} onClick={placeOrder} className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 transition-all shadow-md">
                                                    {isSubmitting ? 'Processing...' : 'Place Order'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'status' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">My Orders</h3>
                                {myOrders.length === 0 ? (
                                    <div className="bg-white p-8 rounded-3xl text-center border border-slate-100">
                                        <p className="text-slate-500 font-bold text-sm">No recent orders found.</p>
                                    </div>
                                ) : myOrders.map(order => (
                                    <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">#{order.txnId}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'preparing' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="space-y-2 mt-4">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 text-sm">
                                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.isDelivered ? 'bg-green-400' : 'bg-slate-300'}`} />
                                                    <span className={item.isDelivered ? 'text-slate-400 line-through' : 'text-slate-700 font-bold'}>{item.name}</span>
                                                    <span className="text-slate-400 font-medium ml-auto">x{item.qty}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Paid</span>
                                            <span className="font-black text-slate-900 text-lg">₹{order.total}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            ) : !isAdminAuthed ? (
                <main className="p-4 max-w-sm mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4">
                    <form onSubmit={handleAdminLogin} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-6">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-400">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-slate-900">Barista Access</h2>
                            <p className="text-xs text-slate-500 mt-1">Enter PIN to view dashboard</p>
                        </div>
                        <div className="space-y-2">
                            <input
                                type="password"
                                value={pinInput}
                                onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                                placeholder="****"
                                maxLength={4}
                                autoFocus
                                className={`w-full text-center text-2xl tracking-[0.5em] font-bold p-4 bg-slate-50 border rounded-2xl focus:outline-none transition-colors ${pinError ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200'}`}
                            />
                            {pinError && <p className="text-xs text-red-500 font-bold">Incorrect PIN</p>}
                        </div>
                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors">
                            Unlock
                        </button>
                    </form>
                </main>
            ) : (
                <main className="p-4 w-full mx-auto">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-slate-900 text-lg">
                                    {adminTab === 'orders' ? 'Order Management' : 'Admin Settings'}
                                </h3>
                                {adminTab === 'orders' && (
                                    <select
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1.5 font-bold focus:outline-none cursor-pointer"
                                    >
                                        <option value="all">All Dates</option>
                                        {availableDates.map(date => (
                                            <option key={date} value={date}>{date}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">
                                {adminTab === 'orders' ? 'Real-time Batch View' : 'Configuration'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setAdminTab(adminTab === 'orders' ? 'settings' : 'orders')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-200 transition-colors"
                            >
                                {adminTab === 'orders' ? <><Settings size={12} /> QR Settings</> : <><Database size={12} /> Orders</>}
                            </button>
                            <button onClick={handleAdminLogout} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-200 transition-colors">
                                <Lock size={12} /> Lock
                            </button>
                            {adminTab === 'orders' && (
                                <button onClick={seedSampleData} className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase hidden sm:flex">
                                    <Database size={12} /> Seed Test Data
                                </button>
                            )}
                        </div>
                    </div>

                    {adminTab === 'orders' ? (
                        <>
                            <div className="flex gap-4 mb-4 px-2">
                                <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-200 flex-1 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Received</p>
                                        <p className="text-2xl font-black text-green-600">₹{totalAmountReceived}</p>
                                    </div>
                                    <div className="w-px h-10 bg-slate-100 mx-4"></div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Orders</p>
                                        <p className="text-2xl font-black text-slate-700">{totalOrdersCount}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200">
                                <table className="w-full text-left border-collapse min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="p-4 text-[10px] font-black uppercase text-slate-400">Items (Tap to Deliver)</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-slate-400">Name</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-center">Paid</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-center">Total</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-slate-400">TXN Id</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-slate-400">Time</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-slate-400">Phone</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-center">Del</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredOrders.length === 0 ? (
                                            <tr><td colSpan="8" className="p-12 text-center text-slate-300 font-medium italic">No active orders for selected date</td></tr>
                                        ) : filteredOrders.map(order => (
                                            <tr key={order.id} className={`transition-colors ${order.status === 'delivered' ? 'bg-slate-50 opacity-60' : 'hover:bg-blue-50/30'}`}>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1.5 max-w-[350px]">
                                                        {order.items.map((item, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => toggleItemDelivery(order.id, idx)}
                                                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-bold border transition-all text-left ${item.isDelivered
                                                                        ? 'bg-green-50 border-green-200 text-green-700'
                                                                        : 'bg-slate-50 border-slate-200 text-slate-600'
                                                                    }`}
                                                            >
                                                                {item.isDelivered ? <Check size={12} strokeWidth={3} /> : <div className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0" />}
                                                                <span>{item.name} x{item.qty}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-bold text-slate-900 text-sm leading-tight">{order.customerName}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => togglePaymentVerified(order.id, order.paymentVerified)} className={`inline-flex transition-all ${order.paymentVerified ? 'text-green-600 scale-110' : 'text-slate-200'}`}>
                                                        {order.paymentVerified ? <CheckSquare size={22} /> : <Square size={22} />}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="font-black text-slate-900 text-sm whitespace-nowrap">₹{order.total}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">#{order.txnId}</span>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-slate-700">{order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Recent'}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase">{order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleDateString([], { day: 'numeric', month: 'short' }) : ''}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                                                        <Phone size={10} /> {order.mobileNumber}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => setDeletingId(order.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {deletingId && (
                                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Order?</h3>
                                        <p className="text-sm text-slate-500 mb-6">This action cannot be undone. Are you sure you want to remove this order permanently?</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => setDeletingId(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                                            <button onClick={() => handleDeleteOrder(deletingId)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="px-2">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 max-w-2xl">
                                <div className="mb-6">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2"><QrCode size={18} /> Custom QR Code</h4>
                                    <p className="text-sm text-slate-500 mt-1">Paste a Base64 image string to override the dynamic UPI QR code shown to customers during checkout.</p>
                                </div>

                                <div className="space-y-4">
                                    <textarea
                                        placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
                                        value={customQrUrl}
                                        onChange={(e) => setCustomQrUrl(e.target.value)}
                                        className="w-full h-32 bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-3 focus:outline-none font-mono resize-y"
                                    />

                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                                                {customQrUrl ? (
                                                    <img src={customQrUrl} alt="QR Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <QrCode className="text-slate-300" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">Preview</p>
                                                <p className="text-[10px] text-slate-500">{customQrUrl ? 'Custom Image Active' : 'Defaulting to dynamic generator'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {saveStatus && <span className="text-xs font-bold text-green-600 animate-in fade-in">{saveStatus}</span>}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        setSaveStatus('Saving...');
                                                        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), { qrCodeBase64: customQrUrl }, { merge: true });
                                                        setSaveStatus('Saved!');
                                                        setTimeout(() => setSaveStatus(''), 2000);
                                                    } catch (err) {
                                                        console.error("Settings save error:", err);
                                                        setSaveStatus('Error saving');
                                                    }
                                                }}
                                                className="bg-slate-900 text-white text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                                            >
                                                Save Configuration
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            )}

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center p-3 sm:hidden shadow-lg z-20">
                <button onClick={() => setView('customer')} className={`flex flex-col items-center gap-1 ${view === 'customer' ? 'text-slate-900' : 'text-slate-400'}`}>
                    <User size={22} /><span className="text-[9px] font-black uppercase">Customer</span>
                </button>
                <button onClick={() => setView('admin')} className={`flex flex-col items-center gap-1 ${view === 'admin' ? 'text-slate-900' : 'text-slate-400'}`}>
                    <ChefHat size={22} /><span className="text-[9px] font-black uppercase">Barista</span>
                </button>
            </nav>
        </div>
    );
}