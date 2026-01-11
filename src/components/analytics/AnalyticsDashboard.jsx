
import React, { useState, useMemo } from 'react';
import statsData from '../../data/amrigs_stats.json';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    Treemap, PieChart, Pie, Cell, Sector
} from 'recharts';
import { LayoutGrid, PieChart as PieIcon, BarChart2, Layers } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff6b6b'];

const AnalyticsDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    // --- DATA PROCESSING (Columns B, C, G ONLY) ---

    // 1. Column B: Grande Área
    const areaData = useMemo(() => {
        const counts = {};
        statsData.forEach(q => {
            if (q.area) counts[q.area] = (counts[q.area] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, []);

    // 2. Column C: Especialidade
    const specialtyData = useMemo(() => {
        const counts = {};
        statsData.forEach(q => {
            if (q.specialty) counts[q.specialty] = (counts[q.specialty] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 20); // Top 20 strictly
    }, []);

    // 3. Column G: Foco (Tratamento, Diagnóstico...)
    const focusData = useMemo(() => {
        const counts = {};
        statsData.forEach(q => {
            // Clean specific focus values if needed, purely strictly from Col G
            let f = q.focus || 'Indefinido';
            // Remove brackets if still passing through
            f = f.replace(/[\[\]]/g, '').trim();
            if (f) counts[f] = (counts[f] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, []);

    // 4. Cross: Area (B) vs Specialty (C) - For Treemap
    const areaSpecialtyHierarchy = useMemo(() => {
        const areas = {};
        statsData.forEach(q => {
            if (!q.area || !q.specialty) return;
            if (!areas[q.area]) areas[q.area] = {};
            areas[q.area][q.specialty] = (areas[q.area][q.specialty] || 0) + 1;
        });
        return Object.entries(areas).map(([areaName, specs]) => ({
            name: areaName,
            children: Object.entries(specs).map(([specName, val]) => ({
                name: specName,
                size: val
            }))
        }));
    }, []);

    // 5. Cross: Area (B) vs Focus (G) - Heatmap Matrix
    const areaFocusMatrix = useMemo(() => {
        const matrix = {};
        const allFocuses = new Set();

        statsData.forEach(q => {
            if (!q.area || !q.focus) return;
            let f = q.focus.replace(/[\[\]]/g, '').trim();
            allFocuses.add(f);

            if (!matrix[q.area]) matrix[q.area] = {};
            matrix[q.area][f] = (matrix[q.area][f] || 0) + 1;
        });

        return {
            matrix,
            focuses: Array.from(allFocuses).sort()
        };
    }, []);

    // --- RENDER HELPERS ---

    // Custom Active Shape for Pie Chart
    const renderActiveShape = (props) => {
        const RADIAN = Math.PI / 180;
        const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);
        const sx = cx + (outerRadius + 10) * cos;
        const sy = cy + (outerRadius + 10) * sin;
        const mx = cx + (outerRadius + 30) * cos;
        const my = cy + (outerRadius + 30) * sin;
        const ex = mx + (cos >= 0 ? 1 : -1) * 22;
        const ey = my;
        const textAnchor = cos >= 0 ? 'start' : 'end';

        return (
            <g>
                <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={16} fontWeight="bold">
                    {payload.name}
                </text>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
                <Sector
                    cx={cx}
                    cy={cy}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    innerRadius={outerRadius + 6}
                    outerRadius={outerRadius + 10}
                    fill={fill}
                />
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
                <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
                <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value} Questões`}</text>
                <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                    {`(${(percent * 100).toFixed(1)}%)`}
                </text>
            </g>
        );
    };

    const [activeIndex, setActiveIndex] = useState(0);
    const onPieEnter = (_, index) => setActiveIndex(index);

    return (
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-main)' }}>
            <h1 style={{ fontFamily: 'var(--font-hand)', color: 'var(--color-primary)', textAlign: 'center', marginBottom: '20px' }}>
                Raio-X: Análise Estratégica 📊
            </h1>

            {/* TAB NAVIGATION */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
                {[
                    { id: 'overview', icon: <LayoutGrid size={18} />, label: 'Visão Geral (B)' },
                    { id: 'specialty', icon: <Layers size={18} />, label: 'Especialidades (C)' },
                    { id: 'focus', icon: <PieIcon size={18} />, label: 'Foco da Banca (G)' },
                    { id: 'matrix', icon: <BarChart2 size={18} />, label: 'Cruzamento (B x G)' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '24px',
                            border: 'none', cursor: 'pointer',
                            background: activeTab === tab.id ? 'var(--color-primary)' : '#f0f0f0',
                            color: activeTab === tab.id ? '#fff' : '#666',
                            fontWeight: '600', transition: 'all 0.2s',
                            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(156, 39, 176, 0.3)' : 'none'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            <div style={{ minHeight: '500px' }}>

                {/* TAB 1: OVERVIEW (COLUMN B) */}
                {activeTab === 'overview' && (
                    <div style={cardStyle}>
                        <h3 style={titleStyle}>Peso das Grandes Áreas (Coluna B)</h3>
                        <p style={subtitleStyle}>Qual a proporção de cada grande área no total da prova?</p>
                        <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                                <Pie
                                    activeIndex={activeIndex}
                                    activeShape={renderActiveShape}
                                    data={areaData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={100}
                                    outerRadius={140}
                                    fill="#8884d8"
                                    dataKey="value"
                                    onMouseEnter={onPieEnter}
                                >
                                    {areaData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* TAB 2: SPECIALTIES (COLUMN C) */}
                {activeTab === 'specialty' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                        <div style={cardStyle}>
                            <h3 style={titleStyle}>Top 20 Especialidades (Coluna C)</h3>
                            <p style={subtitleStyle}>As especialidades mais cobradas independente da grande área.</p>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={specialtyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Bar dataKey="value" fill="#00C49F" radius={[4, 4, 0, 0]}>
                                        {specialtyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={cardStyle}>
                            <h3 style={titleStyle}>Hierarquia: Área (B) &gt; Especialidade (C)</h3>
                            <p style={subtitleStyle}>Como as especialidades se distribuem dentro das grandes áreas.</p>
                            <ResponsiveContainer width="100%" height={500}>
                                <Treemap
                                    data={areaSpecialtyHierarchy}
                                    dataKey="size"
                                    ratio={4 / 3}
                                    stroke="#fff"
                                    fill="#8884d8"
                                    content={<CustomTreemapContent />}
                                />
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* TAB 3: FOCUS (COLUMN G) */}
                {activeTab === 'focus' && (
                    <div style={cardStyle}>
                        <h3 style={titleStyle}>Perfil da Banca (Coluna G)</h3>
                        <p style={subtitleStyle}>O que a prova pede? Diagnóstico, Tratamento, Conduta ou Quadro Clínico?</p>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={focusData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={120} />
                                <RechartsTooltip />
                                <Bar dataKey="value" fill="#FFBB28" radius={[0, 4, 4, 0]}>
                                    {focusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* TAB 4: MATRIX (B x G) */}
                {activeTab === 'matrix' && (
                    <div style={cardStyle}>
                        <h3 style={titleStyle}>Matriz: Área vs. Foco</h3>
                        <p style={subtitleStyle}>Em Cirurgia cai mais "Conduta"? Em Clínica cai mais "Diagnóstico"?</p>
                        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '0.95rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', color: '#888' }}>Área</th>
                                        {areaFocusMatrix.focuses.map(f => (
                                            <th key={f} style={{ padding: '12px', textAlign: 'center', color: '#555' }}>{f}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(areaFocusMatrix.matrix).map(([area, counts], idx) => (
                                        <tr key={area} style={{ background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                            <td style={{ padding: '16px', fontWeight: 'bold', color: COLORS[idx % COLORS.length], borderLeft: `4px solid ${COLORS[idx % COLORS.length]}`, borderRadius: '8px 0 0 8px' }}>
                                                {area}
                                            </td>
                                            {areaFocusMatrix.focuses.map(f => {
                                                const val = counts[f] || 0;
                                                const maxVal = 50; // Normalize-ish
                                                const opacity = Math.min((val / maxVal) * 0.8 + 0.1, 1);
                                                return (
                                                    <td key={f} style={{ textAlign: 'center', padding: '12px', background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                                                        {val > 0 ? (
                                                            <div style={{
                                                                display: 'inline-block',
                                                                padding: '6px 12px',
                                                                borderRadius: '12px',
                                                                background: `rgba(33, 150, 243, ${opacity})`,
                                                                color: opacity > 0.5 ? '#fff' : '#333',
                                                                fontWeight: '600',
                                                                minWidth: '40px'
                                                            }}>
                                                                {val}
                                                            </div>
                                                        ) : <span style={{ color: '#eee' }}>-</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// --- STYLES & SUBCOMPONENTS ---

const cardStyle = {
    background: '#fff',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    border: '1px solid #f0f0f0'
};

const titleStyle = {
    marginTop: 0,
    marginBottom: '8px',
    fontSize: '1.4rem',
    color: '#333',
    fontWeight: '700'
};

const subtitleStyle = {
    color: '#888',
    marginBottom: '24px',
    fontSize: '0.95rem'
};

const CustomTreemapContent = (props) => {
    const { depth, x, y, width, height, index, name, value, colors } = props;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: depth < 2 ? COLORS[index % COLORS.length] : '#ffffff00',
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {depth === 1 ? (
                <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={16} fontWeight="bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                    {name}
                </text>
            ) : null}
            {depth === 2 && width > 40 && height > 20 ? ( // Only show if enough space
                <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#333" fontSize={11} fillOpacity={0.9}>
                    {name.substring(0, width / 6)}...
                </text>
            ) : null}
        </g>
    );
};

export default AnalyticsDashboard;
