import React, { useState, useEffect } from "react";
import {
    ChevronRight,
    Package,
    Heart,
    User,
    MapPin,
    CreditCard,
    Sliders,
    LogOut,
    Check,
    Edit2,
    Plus,
    Trash2,
    ShoppingBag,
    Clock,
    Sparkles,
    ShieldCheck,
    ExternalLink,
    Bell,
    CheckCircle2,
    AlertCircle
} from "lucide-react";

export default function UserAccount({
    cartCount = 0,
    onOpenCart,
    onNavigate,
    onGoToLanding,
    currentPage = 'account',
    user = null,
    userProfile = null,
    orders = [],
    favorites = [],
    addresses = [],
    paymentMethods = [],
    userPreferences = null,
    onAddToCart,
    onRemoveFavorite,
    onSaveProfile,
    onAddAddress,
    onAddPaymentMethod,
    onSavePreferences,
    onLogout
}) {
    const [activeTab, setActiveTab] = useState("details");
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Profile Form State (Initialized from props or empty values)
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        birthday: "",
        gender: "",
    });

    // Sync profile when user or userProfile prop changes
    useEffect(() => {
        setProfile({
            firstName: userProfile?.firstName || user?.firstName || (user?.name ? user.name.split(' ')[0] : ""),
            lastName: userProfile?.lastName || user?.lastName || (user?.name ? user.name.split(' ').slice(1).join(' ') : ""),
            email: userProfile?.email || user?.email || "",
            phone: userProfile?.phone || "",
            birthday: userProfile?.birthday || "",
            gender: userProfile?.gender || "",
        });
    }, [user, userProfile]);

    // Preferences Toggles State
    const [preferences, setPreferences] = useState({
        vipAlerts: userPreferences?.vipAlerts ?? true,
        orderUpdates: userPreferences?.orderUpdates ?? true,
        newsletter: userPreferences?.newsletter ?? false,
        smsAlerts: userPreferences?.smsAlerts ?? false
    });

    const menuItems = [
        { id: "products", label: "YOUR PRODUCTS", icon: Package },
        { id: "favorites", label: "FAVORITES", icon: Heart },
        { id: "details", label: "PERSONAL DETAILS", icon: User },
        { id: "address", label: "ADDRESS", icon: MapPin },
        { id: "payment", label: "PAYMENT METHODS", icon: CreditCard },
        { id: "preferences", label: "PREFERENCES", icon: Sliders },
        { id: "logout", label: "LOG OUT", icon: LogOut, isDanger: true }
    ];

    const handleTabClick = (tabId) => {
        if (tabId === "logout") {
            setShowLogoutConfirm(true);
        } else {
            setActiveTab(tabId);
            setShowLogoutConfirm(false);
        }
    };

    const handleProfileSave = (e) => {
        e.preventDefault();
        if (onSaveProfile) {
            onSaveProfile(profile);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handlePreferenceToggle = (key) => {
        const nextPrefs = { ...preferences, [key]: !preferences[key] };
        setPreferences(nextPrefs);
        if (onSavePreferences) {
            onSavePreferences(nextPrefs);
        }
    };

    return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D231E] flex flex-col font-sans selection:bg-[#2D5A27] selection:text-white">

    {/* 1. Global Navigation Bar */}
        <Navbar
            cartCount={cartCount}
            onOpenCart={onOpenCart}
            onNavigate={onNavigate}
            onGoToLanding={onGoToLanding}
            currentPage={currentPage}
        />

    {/* 2. Main User Account Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-10 sm:py-16">

        {/* Top Page Heading */}
            <h1 className="text-xs sm:text-sm font-extrabold tracking-widest text-[#737B5D] uppercase mb-8 sm:mb-12 font-mono">
                ACCOUNT DETAILS
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

        {/* LEFT SIDEBAR */}
            <div className="lg:col-span-4 w-full max-w-xs space-y-5 sm:space-y-6">
            {menuItems.map((item) => {
                const isActive = activeTab === item.id && !showLogoutConfirm;
            return (
                <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between py-1 text-left transition-colors cursor-pointer group ${item.isDanger ? 'hover:text-[#BC5A36]' : ''
                    }`}
                >
                <span className={`text-xs sm:text-sm font-bold tracking-wider uppercase font-mono transition-colors ${isActive
                    ? 'text-[#2D5A27]'
                    : item.isDanger
                    ? 'text-[#737B5D] group-hover:text-[#BC5A36]'
                    : 'text-[#737B5D] group-hover:text-[#2D231E]'
                }`}>
                    {item.label}
                </span>

                <ChevronRight
                    size={16}
                    className={`transition-all duration-200 ${isActive
                        ? 'text-[#2D5A27] translate-x-1'
                        : item.isDanger
                            ? 'text-[#737B5D] group-hover:text-[#BC5A36] group-hover:translate-x-1'
                            : 'text-[#737B5D] group-hover:text-[#2D231E] group-hover:translate-x-1'
                        }`}
                />
                </button>
                );
                })}
            </div>

        {/* RIGHT CONTENT PANEL: Active Tab Details Display */}
            <div className="lg:col-span-8 w-full">

            {/* LOG OUT CONFIRMATION STATE */}
            {showLogoutConfirm ? (
                <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-10 shadow-xs animate-fade-in text-center max-w-lg">
                    <div className="w-14 h-14 rounded-2xl bg-[#BC5A36]/10 text-[#BC5A36] flex items-center justify-center mx-auto mb-4">
                        <LogOut size={28} />
                    </div>
                <h2 className="text-xl font-extrabold uppercase tracking-tight text-[#2D231E]">
                    Log Out of MatchA?
                </h2>
                <p className="text-xs text-[#6B5E55] mt-2 font-mono">
                    You will need to log back in to access your saved favorites, drop updates, and order history.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={() => {
                            if (onLogout) onLogout();
                            else if (onGoToLanding) onGoToLanding();
                        }}
                        className="w-full sm:w-auto px-6 py-3 bg-[#BC5A36] hover:bg-[#9E4423] text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-md"
                        >
                            Confirm Log Out
                    </button>
                    <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="w-full sm:w-auto px-6 py-3 bg-[#FAF8F5] hover:bg-[#EAE5DC] border border-[#D9D3C7] text-[#2D231E] text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"
                        >
                            Cancel / Stay Logged In
                    </button>
                </div>
                </div>
                ) : (
                <>
        {/* TAB 1: YOUR PRODUCTS (Order History) */}
        {activeTab === "products" && (
            <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-xs animate-fade-in">
                <div className="flex items-center justify-between pb-6 border-b border-[#D9D3C7]">
                    <div>
                        <h2 className="text-lg sm:text-xl font-extrabold uppercase text-[#2D231E] tracking-tight">
                            Your Purchased Products & Orders
                        </h2>
                        <p className="text-xs text-[#6B5E55] font-mono mt-0.5">
                            View your order history, delivery status, and invoice items.
                        </p>
                    </div>
                    {orders.length > 0 && (
                        <span className="hidden sm:inline-flex px-3 py-1 bg-[#D0DEC6]/50 text-[#2D5A27] text-[11px] font-mono font-bold rounded-lg border border-[#B8CBAE]">
                            {orders.length} Active Orders
                        </span>
                    )}
                </div>

                    {orders.length === 0 ? (
                        <div className="text-center py-12 px-4 border border-dashed border-[#D9D3C7] rounded-2xl bg-[#FAF8F5] mt-6">
                            <div className="w-12 h-12 rounded-2xl bg-[#D0DEC6]/50 text-[#2D5A27] flex items-center justify-center mx-auto mb-3">
                                <Package size={24} />
                            </div>
                        <h3 className="text-sm font-bold text-[#2D231E] uppercase font-mono">No Orders Found</h3>
                            <p className="text-xs font-mono text-[#6B5E55] mt-1 max-w-sm mx-auto">
                                You haven't placed any orders yet. Explore our artisanal collections and find your fit!
                            </p>
                        <button
                            onClick={() => onNavigate ? onNavigate('#catalog') : (onGoToLanding && onGoToLanding())}
                            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                            <ShoppingBag size={14} />
                                <span>Explore Catalog</span>
                        </button>
                        </div>
                        ) : (
                        <div className="mt-6 space-y-6">
                            {orders.map((order) => (
                                <div key={order.id} className="border border-[#D9D3C7] rounded-2xl p-5 bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] transition-all">
                                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#D9D3C7]/60">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm font-bold text-[#2D231E]">{order.id}</span>
                                            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${order.statusColor || 'bg-[#2D5A27]/10 text-[#2D5A27] border-[#2D5A27]/20'}`}>
                                                {order.status || 'PROCESSING'}
                                            </span>
                                        </div>
                                        <div className="text-xs font-mono text-[#6B5E55]">
                                            Ordered on: <span className="text-[#2D231E] font-semibold">{order.date}</span>
                                        </div>
                                    </div>

                        <div className="py-4 space-y-3">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        {item.image && (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-14 h-14 object-cover rounded-xl border border-[#D9D3C7]"
                                            />
                                        )}
                                    <div>
                                <h4 className="text-xs sm:text-sm font-bold text-[#2D231E]">{item.name}</h4>
                                    <p className="text-[11px] font-mono text-[#6B5E55] mt-0.5">
                                        {item.color ? `Color: ${item.color} | ` : ''}
                                        {item.size ? `Size: ${item.size} | ` : ''}
                                        Qty: {item.qty || 1}
                                    </p>
                                </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#2D5A27]">
                            ${Number(item.price || 0).toFixed(2)}
                        </span>
                        </div>
                        ))}
                        </div>

                        <div className="pt-3 border-t border-[#D9D3C7]/60 flex items-center justify-between text-xs font-mono">
                            <span className="text-[#6B5E55]">Total Amount: <strong className="text-[#2D231E]">${Number(order.total || 0).toFixed(2)}</strong></span>
                                <button className="text-[#2D5A27] font-bold hover:underline flex items-center gap-1 cursor-pointer">
                                    <span>Track Package</span>
                                    <ExternalLink size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                )}
            </div>
            )}

        {/* TAB 2: FAVORITES (Saved Items) */}
        {activeTab === "favorites" && (
            <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-xs animate-fade-in">
                <div className="flex items-center justify-between pb-6 border-b border-[#D9D3C7]">
                    <div>
                        <h2 className="text-lg sm:text-xl font-extrabold uppercase text-[#2D231E] tracking-tight">
                            Saved Favorites ({favorites.length})
                        </h2>
                        <p className="text-xs text-[#6B5E55] font-mono mt-0.5">
                            Your curated wishlist for future drops and seasonal lookbooks.
                        </p>
                    </div>
                </div>

                {favorites.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-[#D9D3C7] rounded-2xl bg-[#FAF8F5] mt-6">
                        <div className="w-12 h-12 rounded-2xl bg-[#BC5A36]/10 text-[#BC5A36] flex items-center justify-center mx-auto mb-3">
                            <Heart size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-[#2D231E] uppercase font-mono">Your Wishlist is Empty</h3>
                            <p className="text-xs font-mono text-[#6B5E55] mt-1 max-w-sm mx-auto">
                                Save your favorite pieces from our lookbooks and catalog to view them here anytime.
                            </p>
                            <button
                                onClick={() => onNavigate ? onNavigate('#catalog') : (onGoToLanding && onGoToLanding())}
                                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-xs"
                            >
                                <span>Browse Catalog</span>
                            </button>
                    </div>
                    ) : (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {favorites.map((fav) => (
                            <div key={fav.id} className="border border-[#D9D3C7] rounded-2xl p-3 bg-[#FAF8F5] flex flex-col justify-between group">
                                <div className="relative overflow-hidden rounded-xl bg-white">
                                    {fav.image && (
                                        <img
                                            src={fav.image}
                                            alt={fav.name}
                                            className="w-full h-40 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                                        />
                                    )}
                                    {onRemoveFavorite && (
                                        <button
                                            onClick={() => onRemoveFavorite(fav.id)}
                                            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-[#BC5A36] hover:bg-[#BC5A36] hover:text-white transition-colors shadow-xs cursor-pointer"
                                            title="Remove from favorites"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                                <div className="mt-3">
                                    {fav.category && <span className="text-[10px] font-mono text-[#6B5E55] uppercase tracking-wider">{fav.category}</span>}
                                        <h4 className="text-xs font-bold text-[#2D231E] line-clamp-1">{fav.name}</h4>
                                        <p className="text-xs font-mono font-bold text-[#2D5A27] mt-1">${Number(fav.price || 0).toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (onAddToCart) onAddToCart(fav);
                                    }}
                                        className="mt-3 w-full py-2 bg-[#2D5A27] hover:bg-[#23471E] text-white text-[11px] font-mono font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <ShoppingBag size={12} />
                                            <span>Add To Bag</span>
                                </button>
                                </div>
                                ))}
                            </div>
                            )}
                    </div>
                )}

        {/* TAB 3: PERSONAL DETAILS (User Info) */}
        {activeTab === "details" && (
            <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-xs animate-fade-in">
                <div className="flex items-center justify-between pb-6 border-b border-[#D9D3C7]">
                    <div>
                        <h2 className="text-lg sm:text-xl font-extrabold uppercase text-[#2D231E] tracking-tight">
                            Personal Details
                        </h2>
                        <p className="text-xs text-[#6B5E55] font-mono mt-0.5">
                            Manage your identity, email, and profile preferences.
                        </p>
                    </div>
                    {user && (
                        <span className="px-3 py-1 bg-[#2D231E] text-[#D0DEC6] text-[10px] font-mono font-bold rounded-lg uppercase tracking-wider">
                            MatchA Member
                        </span>
                    )}
                </div>

                {saveSuccess && (
                    <div className="mt-4 p-3 bg-[#2D5A27]/10 border border-[#2D5A27]/30 text-[#2D5A27] text-xs font-mono font-bold rounded-xl flex items-center gap-2 animate-fade-in">
                        <CheckCircle2 size={16} />
                        <span>Personal details saved successfully!</span>
                    </div>
                )}

                <form onSubmit={handleProfileSave} className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-mono font-bold text-[#6B5E55] uppercase mb-1">
                                First Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter first name"
                                value={profile.firstName}
                                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D9D3C7] rounded-xl text-xs font-mono focus:outline-none focus:border-[#2D5A27] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono font-bold text-[#6B5E55] uppercase mb-1">
                                Last Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter last name"
                                value={profile.lastName}
                                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D9D3C7] rounded-xl text-xs font-mono focus:outline-none focus:border-[#2D5A27] transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-mono font-bold text-[#6B5E55] uppercase mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="example@matcha.com"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D9D3C7] rounded-xl text-xs font-mono focus:outline-none focus:border-[#2D5A27] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono font-bold text-[#6B5E55] uppercase mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                placeholder="+1 (555) 000-000-0000"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D9D3C7] rounded-xl text-xs font-mono focus:outline-none focus:border-[#2D5A27] transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-mono font-bold text-[#6B5E55] uppercase mb-1">
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                value={profile.birthday}
                                onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D9D3C7] rounded-xl text-xs font-mono focus:outline-none focus:border-[#2D5A27] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono font-bold text-[#6B5E55] uppercase mb-1">
                                Gender
                            </label>
                            <select
                                value={profile.fitPreference}
                                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D9D3C7] rounded-xl text-xs font-mono focus:outline-none focus:border-[#2D5A27] transition-colors"
                            >
                                <option>Men</option>
                                <option>Women</option>
                                <option>Not Prefer</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[#D9D3C7] flex justify-end">
                        <button
                            type="submit"
                            className="px-6 py-3 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-md"
                        >
                            Save Personal Details
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* TAB 4: ADDRESS (Saved Addresses) */}
        {activeTab === "address" && (
            <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-xs animate-fade-in">
                <div className="flex items-center justify-between pb-6 border-b border-[#D9D3C7]">
                    <div>
                        <h2 className="text-lg sm:text-xl font-extrabold uppercase text-[#2D231E] tracking-tight">
                            Saved Shipping Addresses
                        </h2>
                        <p className="text-xs text-[#6B5E55] font-mono mt-0.5">
                            Manage your delivery addresses
                        </p>
                    </div>
                    <button
                        onClick={() => { if (onAddAddress) onAddAddress(); }}
                        className="px-3 py-2 bg-[#2D5A27] hover:bg-[#23471E] text-white text-[11px] font-mono font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <Plus size={13} />
                            <span>Add New Address</span>
                    </button>
                </div>

                {addresses.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-[#D9D3C7] rounded-2xl bg-[#FAF8F5] mt-6">
                        <div className="w-12 h-12 rounded-2xl bg-[#D0DEC6]/50 text-[#2D5A27] flex items-center justify-center mx-auto mb-3">
                            <MapPin size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-[#2D231E] uppercase font-mono">No Saved Addresses</h3>
                        <p className="text-xs font-mono text-[#6B5E55] mt-1 max-w-sm mx-auto">
                            Add your primary shipping address for faster 1-click express checkout.
                        </p>
                    </div>
                ) : (
                <div className="mt-6 space-y-4">
                    {addresses.map((addr) => (
                        <div key={addr.id} className="border border-[#2D5A27] rounded-2xl p-5 bg-[#D0DEC6]/20 relative">
                            {addr.type && (
                            <span className="px-2.5 py-0.5 bg-[#2D5A27] text-white text-[9px] font-mono font-bold uppercase rounded-md tracking-wider">
                                {addr.type}
                            </span>
                            )}
                            <h4 className="text-sm font-bold text-[#2D231E] mt-3">{addr.name}</h4>
                                <p className="text-xs font-mono text-[#6B5E55] mt-1">{addr.street}</p>
                                    <p className="text-xs font-mono text-[#6B5E55]">{addr.cityStateZip}, {addr.country}</p>
                                        {addr.phone && <p className="text-xs font-mono text-[#6B5E55] mt-2">Phone: {addr.phone}</p>}

                            <div className="mt-4 pt-3 border-t border-[#D9D3C7] flex items-center gap-3">
                                <button className="text-xs font-mono font-bold text-[#2D5A27] hover:underline flex items-center gap-1 cursor-pointer">
                                    <Edit2 size={12} />
                                    <span>Edit Address</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                )}
            </div>
        )}

        {/* TAB 5: PAYMENT METHODS */}
        {activeTab === "payment" && (
            <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-xs animate-fade-in">
                <div className="flex items-center justify-between pb-6 border-b border-[#D9D3C7]">
                    <div>
                        <h2 className="text-lg sm:text-xl font-extrabold uppercase text-[#2D231E] tracking-tight">
                            Saved Payment Methods
                        </h2>
                        <p className="text-xs text-[#6B5E55] font-mono mt-0.5">
                            Encrypted & secure saved payment options.
                        </p>
                    </div>
                    <button
                        onClick={() => { if (onAddPaymentMethod) onAddPaymentMethod(); }}
                        className="px-3 py-2 bg-[#2D5A27] hover:bg-[#23471E] text-white text-[11px] font-mono font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                        <Plus size={13} />
                        <span>Add Payment Method</span>
                    </button>
                </div>

                {paymentMethods.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-[#D9D3C7] rounded-2xl bg-[#FAF8F5] mt-6">
                        <div className="w-12 h-12 rounded-2xl bg-[#D0DEC6]/50 text-[#2D5A27] flex items-center justify-center mx-auto mb-3">
                            <CreditCard size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-[#2D231E] uppercase font-mono">No Saved Payment Methods</h3>
                        <p className="text-xs font-mono text-[#6B5E55] mt-1 max-w-sm mx-auto">
                            Your payment methods will be encrypted and saved securely after your first checkout.
                        </p>
                    </div>
                ) : (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentMethods.map((pm) => (
                        <div
                            key={pm.id}
                            className={`border rounded-2xl p-5 relative flex flex-col justify-between ${pm.isDefault ? 'border-[#2D5A27] bg-[#D0DEC6]/15' : 'border-[#D9D3C7] bg-[#FAF8F5]'
                                }`}
                            >
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-bold uppercase text-[#2D231E]">{pm.type}</span>
                                    {pm.isDefault && (
                                        <span className="text-[9px] font-mono font-bold bg-[#2D5A27] text-white px-2 py-0.5 rounded-full">
                                            DEFAULT
                                        </span>
                                    )}
                                </div>
                                <p className="text-base font-mono font-extrabold text-[#2D231E] mt-4 tracking-wider">
                                    •••• •••• •••• {pm.last4}
                                </p>
                            </div>
                            <div className="mt-6 flex items-center justify-between text-[11px] font-mono text-[#6B5E55]">
                                <span>Expires: {pm.expiry}</span>
                                <span>{pm.holder}</span>
                            </div>
                        </div>
                    ))}
                </div>
                )}

                <div className="mt-6 p-4 bg-[#FAF8F5] border border-[#D9D3C7] rounded-2xl flex items-center gap-3 text-xs font-mono text-[#6B5E55]">
                    <ShieldCheck size={20} className="text-[#2D5A27] shrink-0" />
                    <span>MatchA uses bank-grade 256-bit SSL encryption to keep your billing information safe.</span>
                </div>
            </div>
        )}

        {/* TAB 6: PREFERENCES */}
        {activeTab === "preferences" && (
            <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-xs animate-fade-in">
                <div className="pb-6 border-b border-[#D9D3C7]">
                    <h2 className="text-lg sm:text-xl font-extrabold uppercase text-[#2D231E] tracking-tight">
                        Account Preferences
                    </h2>
                    <p className="text-xs text-[#6B5E55] font-mono mt-0.5">
                        Customize your notifications and drop communications.
                    </p>
                </div>

                <div className="mt-6 space-y-4">
                    {[
                        { key: "vipAlerts", title: "VIP Early Drop Alerts", desc: "Get notified 30 minutes before limited seasonal collections drop." },
                        { key: "orderUpdates", title: "Order & Shipping Notifications", desc: "Receive real-time tracking updates via SMS & Email." },
                        { key: "newsletter", title: "MatchA Editorial Newsletter", desc: "Weekly stories, streetwear lookbooks, and exclusive discounts." },
                        { key: "smsAlerts", title: "SMS Priority Access", desc: "Direct text alerts for surprise restocks and warehouse drops." }
                    ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 border border-[#D9D3C7] rounded-2xl bg-[#FAF8F5]/50">
                        <div>
                            <h4 className="text-xs font-bold text-[#2D231E] uppercase font-mono">{item.title}</h4>
                            <p className="text-[11px] font-mono text-[#6B5E55] mt-0.5">{item.desc}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handlePreferenceToggle(item.key)}
                            className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${preferences[item.key] ? 'bg-[#2D5A27] justify-end' : 'bg-[#D9D3C7] justify-start'
                            }`}
                            >
                                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                        </button>
                    </div>
                    ))}
                </div>
            </div>
        )}
    </>
    )}

    </div>

    </div>

    </main>

    {/* 3. Global Footer */}
        <Footer />

    </div>
    );
}