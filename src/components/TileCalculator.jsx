import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Calculator,
    Ruler,
    Maximize,
    Info,
    Briefcase,
    LayoutGrid,
    AlertCircle
} from "lucide-react";

const TileCalculator = ({ className = "" }) => {
    const [roomLength, setRoomLength] = useState("");
    const [roomWidth, setRoomWidth] = useState("");
    const [tileLength, setTileLength] = useState("");
    const [tileWidth, setTileWidth] = useState("");
    const [pricePerUnit, setPricePerUnit] = useState("");
    const [result, setResult] = useState(null);
    const [totalCost, setTotalCost] = useState(null);
    const [wastageResult, setWastageResult] = useState(null);

    const calculateTiles = () => {
        if (!roomLength || !roomWidth || !tileLength || !tileWidth) {
            return;
        }

        const rl = parseFloat(roomLength);
        const rw = parseFloat(roomWidth);
        const tl = parseFloat(tileLength);
        const tw = parseFloat(tileWidth);
        const price = parseFloat(pricePerUnit) || 0;

        if (isNaN(rl) || isNaN(rw) || isNaN(tl) || isNaN(tw)) {
            return;
        }

        const floorArea = rl * rw;
        const tileArea = tl * tw;

        if (tileArea === 0) return;

        // Optimization logic: 10% is the standard for straight laying, 15% for diagonal.
        // We use 10% as the "Smart Optimized Waste"
        const smartWastePercent = 10;
        const tilesNeeded = floorArea / tileArea;
        const extraTiles = tilesNeeded * (smartWastePercent / 100);
        const totalTiles = Math.ceil(tilesNeeded + extraTiles);
        const wastageAmount = totalTiles - Math.floor(tilesNeeded);

        setResult(totalTiles);
        setWastageResult(wastageAmount);

        if (price > 0) {
            setTotalCost(totalTiles * price);
        } else {
            setTotalCost(null);
        }
    };

    // Auto-calculate logic
    React.useEffect(() => {
        if (roomLength && roomWidth && tileLength && tileWidth) {
            calculateTiles();
        } else {
            setResult(null);
            setTotalCost(null);
            setWastageResult(null);
        }
    }, [roomLength, roomWidth, tileLength, tileWidth, pricePerUnit]);

    const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-semibold";
    const labelClasses = "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`studio-card shadow-2xl overflow-hidden ${className}`}
            style={{ padding: 0 }}
        >
            <div className="bg-slate-900 p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-500/30">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-black uppercase tracking-widest text-sm italic">Tile Estimator</h3>
                        <p className="text-blue-400 text-[10px] font-bold uppercase tracking-tighter">Smart Calculation Protocol</p>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Room Dimensions */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <Maximize size={16} className="text-blue-500" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Room Dimensions</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}><Ruler size={12} /> Length</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 20"
                                    value={roomLength}
                                    onChange={(e) => setRoomLength(e.target.value)}
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}><Ruler size={12} /> Width</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 15"
                                    value={roomWidth}
                                    onChange={(e) => setRoomWidth(e.target.value)}
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tile Dimensions */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <LayoutGrid size={16} className="text-blue-500" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Tile & Cost Details</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}><Briefcase size={12} /> Length</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 2"
                                    value={tileLength}
                                    onChange={(e) => setTileLength(e.target.value)}
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}><Briefcase size={12} /> Width</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 2"
                                    value={tileWidth}
                                    onChange={(e) => setTileWidth(e.target.value)}
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Price Per Tile (Optional)</label>
                            <input
                                type="number"
                                placeholder="e.g. 250"
                                value={pricePerUnit}
                                onChange={(e) => setPricePerUnit(e.target.value)}
                                className={inputClasses}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                    {result !== null && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] text-center relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                <AlertCircle size={80} className="text-blue-500" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-blue-100">
                                <div className="space-y-1">
                                    <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3 leading-none">Total Tiles</h5>
                                    <div className="text-4xl font-black text-blue-900 tracking-tighter italic">
                                        {result} <span className="text-lg uppercase text-blue-600 not-italic font-bold">Units</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest italic pt-2">Includes optimized waste</p>
                                </div>
                                <div className="space-y-1 pt-8 md:pt-0">
                                    <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3 leading-none">Waste Amount</h5>
                                    <div className="text-4xl font-black text-orange-600 tracking-tighter italic">
                                        {wastageResult} <span className="text-lg uppercase text-orange-400 not-italic font-bold">Units</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest italic pt-2">Estimated Cutting Allowance</p>
                                </div>
                                {totalCost !== null && (
                                    <div className="space-y-1 pt-8 md:pt-0">
                                        <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3 leading-none">Total Amount</h5>
                                        <div className="text-4xl font-black text-blue-900 tracking-tighter italic">
                                            ₹{totalCost.toLocaleString()}
                                        </div>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest italic pt-2">Full project budget</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

        </motion.div>
    );
};

export default TileCalculator;
