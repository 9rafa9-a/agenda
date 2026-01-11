
import React, { useState, useMemo } from 'react';
import statsData from '../../data/amrigs_stats.json';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    Treemap, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { LayoutGrid, Layers, PieChart as PieIcon, Crosshair, Search, Filter, Sparkles } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore
import { db } from '../../lib/firebase'; // Import DB instance

const COLORS = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#219ebc', '#023047', '#8ecae6'];

const AnalyticsDashboard = () => {
    // === GLOBAL STATE ===
    const [selectedExam, setSelectedExam] = useState(null); // 'amrigs' | null
    const [yearRange, setYearRange] = useState([2017, 2030]); // Min/Max
    const [selectedArea, setSelectedArea] = useState(null); // Drill-down Root
    const [selectedSpecialty, setSelectedSpecialty] = useState(null); // Drill-down Level 2
    const [activeTab, setActiveTab] = useState('macro'); // 'macro' | 'strategic' | 'tactical' | 'custom'

    // === DATA FILTERS ===
    const filteredData = useMemo(() => {
        return statsData.filter(d =>
            d.year >= yearRange[0] && d.year <= yearRange[1]
        );
    }, [yearRange]);

    // === 1. MACRO VISION (B x A) ===
    // Filter to only Top 5-6 Areas to avoid clutter
    const MAIN_AREAS = ['Clínica Médica', 'Cirurgia Geral', 'Pediatria', 'Ginecologia e Obstetrícia', 'Medicina Preventiva', 'Psiquiatria'];

    // Line Chart: Area Growth over Years
    const macroTemporalData = useMemo(() => {
        const years = {};
        const areas = new Set();

        filteredData.forEach(d => {
            if (!MAIN_AREAS.includes(d.area)) return; // Filter clutter
            if (!years[d.year]) years[d.year] = { name: d.year };
            years[d.year][d.area] = (years[d.year][d.area] || 0) + 1;
            areas.add(d.area);
        });
        return { data: Object.values(years).sort((a, b) => a.name - b.name), areas: Array.from(areas) };
    }, [filteredData]);

    // Area Distribution (Pie)
    const macroDistribution = useMemo(() => {
        const counts = {};
        filteredData.forEach(d => {
            if (!MAIN_AREAS.includes(d.area)) return;
            counts[d.area] = (counts[d.area] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filteredData]);

    // === 2. STRATEGIC VISION (C & G) with Drill-down ===
    // If Area Selected -> Show Specialty Tree
    const strategicTreeData = useMemo(() => {
        if (!selectedArea) return [];
        // Let's make it Area-Specific
        const specs = {};
        filteredData.filter(d => d.area === selectedArea).forEach(d => {
            specs[d.specialty] = (specs[d.specialty] || 0) + 1;
        });
        return Object.entries(specs).map(([name, size]) => ({ name, size })).sort((a, b) => b.size - a.size);
    }, [filteredData, selectedArea]);

    // Focus Breakdown (G) for Selected Specialty (Deep Dive)
    const tacticalFocusData = useMemo(() => {
        if (!selectedSpecialty) return [];
        const focus = {};
        filteredData.filter(d => d.specialty === selectedSpecialty).forEach(d => {
            if (d.focus && d.focus !== 'Indefinido') focus[d.focus] = (focus[d.focus] || 0) + 1;
        });
        return Object.entries(focus).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filteredData, selectedSpecialty]);

    // === 3. TACTICAL VISION (D x H) ===
    // "Mapa da Mina" - Top Topics
    const topTopics = useMemo(() => {
        const counts = {};
        const subset = selectedArea ? filteredData.filter(d => d.area === selectedArea) : filteredData;
        subset.forEach(d => {
            if (d.topic && d.topic !== 'Outros') counts[d.topic] = (counts[d.topic] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 15);
    }, [filteredData, selectedArea]);

    // Heatmap Data (Top Specialties x Years) - User requested Col C (Specialty)
    const heatmapData = useMemo(() => {
        const subset = selectedArea ? filteredData.filter(d => d.area === selectedArea) : filteredData;

        // 1. Aggregate Counts by Specialty & Year
        const counts = {};
        const allYears = new Set();

        subset.forEach(d => {
            if (!d.specialty || d.specialty === 'Geral' || d.specialty === 'undefined') return;
            const t = d.specialty.trim();
            if (!counts[t]) counts[t] = { total: 0, years: {} };
            counts[t].total++;
            counts[t].years[d.year] = (counts[t].years[d.year] || 0) + 1;
            allYears.add(d.year);
        });

        // 2. Get Top 20 Specialties by Volume
        const topItems = Object.entries(counts)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 20)
            .map(([name, data]) => ({ name, ...data }));

        // 3. Sorted Years Array for Columns
        const sortedYears = Array.from(allYears).sort((a, b) => a - b);

        return { items: topItems, years: sortedYears };

    }, [filteredData, selectedArea]);

    // Frequência x Recorrência (Scatter)
    // X: Years appeared, Y: Total Questions
    const scatterData = useMemo(() => {
        const topics = {};
        const subset = selectedArea ? filteredData.filter(d => d.area === selectedArea) : filteredData;

        subset.forEach(d => {
            if (!d.topic || d.topic === 'Outros' || d.topic === 'undefined') return;
            // Key by Topic Name
            const key = d.topic.trim();
            if (!topics[key]) topics[key] = { name: key, total: 0, years: new Set() };
            topics[key].total++;
            topics[key].years.add(d.year);
        });

        return Object.values(topics)
            .filter(t => t.total >= 2) // Filter noise (items that appeared only once)
            .map(t => ({
                name: t.name,
                x: t.years.size, // Recurrence
                y: t.total,      // Volume
                z: t.total * 50  // Bubble size
            }));
    }, [filteredData, selectedArea]);

    // === USER DATA (For Gap Analysis) ===
    const [userDiseases, setUserDiseases] = useState([]);

    React.useEffect(() => {
        const fetchDiseases = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "diseases"));
                const topics = querySnapshot.docs.map(doc => doc.data().name.toLowerCase().trim());
                setUserDiseases(topics);
            } catch (error) {
                console.error("Error fetching diseases:", error);
            }
        };
        fetchDiseases();
    }, []);

    // Gap Analysis: Topics with high volume in exams but NO summary in userDiseases
    const gapAnalysis = useMemo(() => {
        // 1. Get All Topics with Count
        const topicCounts = {};
        filteredData.forEach(d => {
            if (d.topic && d.topic !== 'Outros') {
                const t = d.topic.trim();
                topicCounts[t] = (topicCounts[t] || 0) + 1;
            }
        });

        // 2. Filter High Yield (> 2 appearances) AND Missing
        return Object.entries(topicCounts)
            .filter(([topic, count]) => {
                const isHighYield = count >= 2;
                // Fuzzy check against user diseases
                const isCovered = userDiseases.some(ud => ud.includes(topic.toLowerCase()) || topic.toLowerCase().includes(ud));
                return isHighYield && !isCovered;
            })
            .sort((a, b) => b[1] - a[1]) // Most critical first
            .slice(0, 5) // Top 5 Gaps
            .map(([topic, count]) => ({ topic, count }));
    }, [filteredData, userDiseases]);

    // === RENDER HELPERS ===
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', zIndex: 1000 }}>
                    <p style={{ fontWeight: 'bold' }}>{label || payload[0].name}</p>
                    {payload.map((p, i) => (
                        <p key={i} style={{ color: p.color || COLORS[0] }}>
                            {p.name}: {p.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Custom Treemap Content that explicitly handles click
    const renderTreemapContent = (props) => {
        const { x, y, width, height, index, name } = props;
        return (
            <g onClick={() => setSelectedSpecialty(name)} style={{ cursor: 'pointer' }}>
                <rect
                    x={x} y={y} width={width} height={height}
                    style={{
                        fill: COLORS[index % COLORS.length],
                        stroke: '#fff', strokeWidth: 2,
                    }}
                />
                {width > 50 && height > 30 && (
                    <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={14} fontWeight="bold" style={{ pointerEvents: 'none' }}>
                        {name ? name.substring(0, width / 8) : ''}
                    </text>
                )}
            </g>
        );
    };

    // Helper for Heatmap Color
    const getHeatColor = (count) => {
        if (!count) return '#f0f0f0'; // Empty
        if (count === 1) return '#e9c46a'; // Low
        if (count === 2) return '#f4a261'; // Med
        return '#e76f51'; // High
    };

    // === EXAM SELECTOR SCREEN (Moved here to fix Hook Order) ===
    if (!selectedExam) {
        return (
            <div style={{
                fontFamily: 'var(--font-main)',
                minHeight: '100vh',
                background: '#FAFAFA',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '3rem', color: '#264653', marginBottom: '10px' }}>
                        Harmonic Voyager 🧭
                    </h1>
                    <p style={{ color: '#666', fontSize: '1.2rem' }}>Escolha o Raio-X que deseja explorar:</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', maxWidth: '1000px', width: '100%', padding: '20px' }}>

                    {/* AMRIGS CARD */}
                    <button
                        onClick={() => setSelectedExam('amrigs')}
                        style={{
                            background: '#fff',
                            border: 'none',
                            borderRadius: '24px',
                            padding: '40px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            textAlign: 'center'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-10px)';
                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                        }}
                    >
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: '#e9c46a', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '20px', fontSize: '2rem'
                        }}>
                            🩺
                        </div>
                        <h2 style={{ color: '#264653', fontSize: '1.5rem', marginBottom: '10px' }}>AMRIGS</h2>
                        <span style={{
                            background: '#2a9d8f', color: '#fff', padding: '4px 12px', borderRadius: '12px',
                            fontSize: '0.9rem', fontWeight: 'bold'
                        }}>
                            2017 - 2026
                        </span>
                        <p style={{ color: '#888', marginTop: '20px', lineHeight: '1.5' }}>
                            Análise completa de 10 anos da prova da AMRIGS. Distribuição por áreas, especialidades e temas recorrentes.
                        </p>
                    </button>

                    {/* COMING SOON CARD */}
                    <div style={{
                        background: '#f5f5f5',
                        borderRadius: '24px',
                        padding: '40px',
                        border: '2px dashed #ddd',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.7,
                        cursor: 'not-allowed',
                        color: '#999'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🚧</div>
                        <h3>Em Breve</h3>
                        <p>Outras provas saindo do forno...</p>
                    </div>

                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'var(--font-main)', background: '#FAFAFA', minHeight: '100vh' }} >

            {/* HEADER & GLOBAL FILTERS */}
            <div style={{ marginBottom: '30px', textAlign: 'center', position: 'relative' }}>
                <button
                    onClick={() => setSelectedExam(null)}
                    style={{
                        position: 'absolute', left: 0, top: 0,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#999', display: 'flex', alignItems: 'center', gap: '5px',
                        fontWeight: 'bold', fontSize: '0.9rem'
                    }}
                >
                    ⬅ Voltar para Seleção
                </button>

                <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '2.5rem', color: '#264653', marginBottom: '10px' }}>
                    Raio-X Interativo 🩺
                </h1>
                <p style={{ color: '#666' }}>Explore os dados da prova em 4 níveis de profundidade.</p>

                {/* Year Filter (Simple Buttons for Era) */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                    <button onClick={() => setYearRange([2017, 2030])} style={activeBtn(yearRange[0] === 2017, '#2a9d8f')}>Tudo (2017+)</button>
                    <button onClick={() => setYearRange([2017, 2020])} style={activeBtn(yearRange[1] === 2020, '#e76f51')}>Era Antiga (17-20)</button>
                    <button onClick={() => setYearRange([2021, 2026])} style={activeBtn(yearRange[0] === 2021, '#264653')}>Era Moderna (21+)</button>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="analytics-tabs" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '30px', borderBottom: '1px solid #ddd', paddingBottom: '15px', flexWrap: 'wrap' }}>
                <TabBtn id="macro" icon={<LayoutGrid size={18} />} label="1. Macro" desc="Anual" active={activeTab} set={setActiveTab} />
                <TabBtn id="strategic" icon={<Layers size={18} />} label="2. Estratégia" desc="Especialidade" active={activeTab} set={setActiveTab} />
                <TabBtn id="tactical" icon={<Crosshair size={18} />} label="3. Tática" desc="Temas" active={activeTab} set={setActiveTab} />
                <TabBtn id="custom" icon={<Search size={18} />} label="4. Lab" desc="Personalizado" active={activeTab} set={setActiveTab} />
            </div>

            {/* === VIEW 1: MACRO === */}
            {activeTab === 'macro' && (
                <div className="analytics-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
                    {/* SELECTOR CARD - User requested "Selector" */}
                    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={titleStyle}>Resumo da Ópera</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>Selecione uma área para focar:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {macroDistribution.map((entry, idx) => (
                                <button key={entry.name}
                                    onClick={() => { setSelectedArea(entry.name); setActiveTab('strategic'); }}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '12px', border: '1px solid #eee', borderRadius: '12px',
                                        background: '#fff', cursor: 'pointer', transition: 'all 0.2s',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateX(5px)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: COLORS[idx % COLORS.length] }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                                        {entry.name}
                                    </span>
                                    <span style={{ color: '#999', fontSize: '0.9rem' }}>{entry.value}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ ...cardStyle }}>
                        <h3 style={titleStyle}>Evolução Histórica (Linha do Tempo)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={macroTemporalData.data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Legend />
                                {macroTemporalData.areas.map((area, idx) => (
                                    <Line key={area} type="monotone" dataKey={area} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* === VIEW 2: STRATEGIC === */}
            {activeTab === 'strategic' && (
                <div>
                    {/* BREADCRUMB */}
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 'bold', color: '#888' }}>Filtro Atual:</span>
                        {selectedArea ? (
                            <span
                                onClick={() => setSelectedArea(null)}
                                style={{ background: '#264653', color: '#fff', padding: '4px 12px', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                {selectedArea} <span style={{ opacity: 0.7 }}>✕ (Voltar)</span>
                            </span>
                        ) : (
                            <span style={{ color: '#aaa', fontStyle: 'italic' }}>Todas as Áreas (Clique na Visão Macro para Filtrar)</span>
                        )}
                        {selectedSpecialty && (
                            <span style={{ background: '#e9c46a', color: '#333', padding: '4px 12px', borderRadius: '16px' }}>
                                ↳ {selectedSpecialty}
                            </span>
                        )}
                    </div>

                    <div className="analytics-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div style={cardStyle}>
                            <h3 style={titleStyle}>
                                {selectedArea ? `Especialidades de ${selectedArea}` : 'Todas as Especialidades'}
                            </h3>

                            {!selectedArea ? (
                                <div style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#aaa', border: '2px dashed #eee', borderRadius: '12px' }}>
                                    <Filter size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                    <p>Selecione uma Grande Área na <strong>Visão Macro</strong> (Aba 1)</p>
                                    <p style={{ fontSize: '0.8rem' }}>para ver a distribuição de especialidades.</p>
                                    <button
                                        onClick={() => setActiveTab('macro')}
                                        style={{ marginTop: '20px', padding: '8px 16px', background: '#264653', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer' }}
                                    >
                                        Ir para Visão Macro
                                    </button>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={500}>
                                    <Treemap
                                        data={strategicTreeData}
                                        dataKey="size"
                                        nameKey="name"
                                        ratio={4 / 3}
                                        stroke="#fff"
                                        fill="#264653"
                                        content={<CustomTreemapContent onClick={(name) => { console.log('Clicked:', name); setSelectedSpecialty(name); }} />}
                                    />
                                </ResponsiveContainer>
                            )}
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '10px' }}>
                                👉 Clique num bloco para ver o Foco (Deep Dive)
                            </p>
                        </div>

                        {selectedSpecialty ? (
                            <div style={cardStyle}>
                                <h3 style={titleStyle}>Deep Dive: Como cai {selectedSpecialty}?</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={tacticalFocusData} layout="vertical" margin={{ left: 40 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                        <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" fill="#e76f51" radius={[0, 4, 4, 0]} barSize={40}>
                                            {tacticalFocusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', flexDirection: 'column' }}>
                                <Crosshair size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                Selecione uma especialidade ao lado para ver o detalhamento do Foco.
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {/* === VIEW 3: TACTICAL === */}
            {
                activeTab === 'tactical' && (
                    <div className="analytics-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
                        <div style={{ gridColumn: '1 / -1', marginBottom: '10px' }}>
                            {selectedArea && <span style={{ background: '#264653', color: '#fff', padding: '4px 12px', borderRadius: '16px' }}>Filtro: {selectedArea}</span>}
                        </div>

                        {/* CONTENT GAP WIDGET */}
                        <div style={cardStyle}>
                            <h3 style={titleStyle}>🚨 Buracos no Estudo</h3>
                            <p style={subtitleStyle}>Temas que caem MUITO e você ainda não tem resumo!</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                {gapAnalysis.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#2a9d8f' }}>
                                        <Sparkles size={32} style={{ marginBottom: '10px' }} />
                                        <p>Parabéns! Você tem resumos cobrindo todos os top temas!</p>
                                    </div>
                                ) : (
                                    gapAnalysis.map((gap, i) => (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '10px', border: '1px solid #ffeba1', background: '#fff9db', borderRadius: '8px'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#d97706' }}>{gap.topic}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#b45309' }}>{gap.count} questões encontradas</div>
                                            </div>
                                            <a href={`/new?title=${encodeURIComponent(gap.topic)}`} style={{
                                                background: '#d97706', color: '#fff', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold'
                                            }}>
                                                Criar Resumo
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* HEATMAP REPLACEMENT */}
                        <div style={cardStyle}>
                            <h3 style={titleStyle}>Mapa de Calor (Heatmap) - Top Especialidades</h3>
                            <p style={subtitleStyle}>Recorrência anual das especialidades (Col C).</p>

                            <div style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Especialidade</th>
                                            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Total</th>
                                            {heatmapData.years.map(y => (
                                                <th key={y} style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #ddd', minWidth: '40px' }}>{y}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {heatmapData.items.map((item, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                <td style={{ padding: '8px', fontWeight: '500' }}>{item.name}</td>
                                                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{item.total}</td>
                                                {heatmapData.years.map(y => {
                                                    const count = item.years[y] || 0;
                                                    return (
                                                        <td key={y} style={{ padding: '4px', textAlign: 'center' }}>
                                                            <div style={{
                                                                width: '100%', height: '24px', borderRadius: '4px',
                                                                background: getHeatColor(count),
                                                                color: count > 0 ? '#fff' : 'transparent',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '0.8rem', fontWeight: 'bold'
                                                            }}>
                                                                {count > 0 ? count : ''}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '15px', color: '#666' }}>
                                🟨 Amarelo (1 un) | 🟧 Laranja (2 un) | 🟥 Vermelho (3+ un)
                            </p>
                        </div>
                    </div>
                )
            }

            {/* === VIEW 4: CUSTOM === */}
            {activeTab === 'custom' && (
                <CustomAnalyticsView data={statsData} />
            )}

            <style>{`
                 @media (max-width: 900px) {
                    .analytics-layout { grid-template-columns: 1fr !important; }
                    .analytics-tabs { overflow-x: auto; justify-content: flex-start !important; padding-bottom: 5px; }
                    .analytics-tabs > div { flex-shrink: 0; }
                 }
            `}</style>
        </div >
    );
};

// === HELPERS ===

const TabBtn = ({ id, icon, label, desc, active, set }) => (
    <button
        onClick={() => set(id)}
        style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            padding: '10px 16px', border: 'none', background: active === id ? '#e0f2f1' : '#fff',
            fontSize: '0.9rem', fontWeight: active === id ? '700' : '500',
            color: active === id ? '#264653' : '#666',
            borderRadius: '12px',
            border: active === id ? '2px solid #264653' : '1px solid #eee',
            cursor: 'pointer', transition: 'all 0.2s', flex: '1 1 80px', minWidth: '80px'
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{icon} <span>{label}</span></div>
        {desc && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{desc}</span>}
    </button>
);

const activeBtn = (isActive, color) => ({
    padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
    background: isActive ? color : '#e0e0e0',
    color: isActive ? '#fff' : '#666',
    fontWeight: '600'
});

const CustomTreemapContent = (props) => {
    const { x, y, width, height, index, name, onClick, depth } = props;

    // Ignore Root Node (usually depth 0) to prevent it from covering children
    if (depth < 1) return null;

    // Dynamic Font Size
    const fontSize = width > 100 ? 14 : width > 60 ? 12 : 10;

    return (
        <g
            onClick={(e) => {
                e.stopPropagation(); // Stop event bubbling
                if (onClick) onClick(name || (props.payload && props.payload.name));
            }}
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.8; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}
        >
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: COLORS[index % COLORS.length],
                    stroke: '#fff',
                    strokeWidth: 2,
                    pointerEvents: 'all', // Force pointer events
                    transition: 'opacity 0.2s'
                }}
            />
            {/* Show label if width > 30 OR height > 20 */}
            {(width > 30 && height > 20) && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={fontSize}
                    fontWeight="bold"
                    dominantBaseline="middle"
                    style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                    {name && name.length * (fontSize * 0.6) > width
                        ? name.substring(0, Math.floor(width / (fontSize * 0.6))) + '..'
                        : name}
                </text>
            )}
            <title>{name}</title>
        </g>
    );
};

const cardStyle = {
    background: '#fff', borderRadius: '16px', padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eee'
};

const titleStyle = { marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', color: '#333' };
const subtitleStyle = { color: '#888', marginBottom: '20px', fontSize: '0.9rem' };

const CustomAnalyticsView = ({ data }) => {
    // Custom Filter State
    const [cYear, setCYear] = useState('all');
    const [cArea, setCArea] = useState('all');
    const [cSpecialty, setCSpecialty] = useState('all');
    const [groupBy, setGroupBy] = useState('topic'); // 'area', 'specialty', 'topic', 'focus'
    const [limit, setLimit] = useState(10); // User requested limit control

    // Get Unique Options
    const options = useMemo(() => {
        const years = new Set();
        const areas = new Set();
        const specialties = new Set();

        data.forEach(d => {
            if (d.year) years.add(d.year);
            if (d.area) areas.add(d.area);
            if (d.specialty) specialties.add(d.specialty);
        });

        return {
            years: Array.from(years).sort((a, b) => b - a),
            areas: Array.from(areas).sort(),
            specialties: Array.from(specialties).sort()
        };
    }, [data]);

    // Filter Data
    const filtered = useMemo(() => {
        return data.filter(d => {
            const matchYear = cYear === 'all' || d.year.toString() === cYear.toString();
            const matchArea = cArea === 'all' || d.area === cArea;
            const matchSpec = cSpecialty === 'all' || d.specialty === cSpecialty;
            return matchYear && matchArea && matchSpec;
        });
    }, [data, cYear, cArea, cSpecialty]);

    // Aggregate for Chart
    const chartData = useMemo(() => {
        const counts = {};
        filtered.forEach(d => {
            let key = d[groupBy];
            if (!key || key === 'undefined' || key === 'Indefinido') key = 'Outros';
            counts[key] = (counts[key] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, limit); // Dynamic Limit
    }, [filtered, groupBy, limit]);

    return (
        <div className="analytics-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
            {/* Filters Sidebar */}
            <div style={cardStyle}>
                <h3 style={titleStyle}>Filtros e Configuração</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>📅 Ano da Prova</label>
                        <select value={cYear} onChange={e => setCYear(e.target.value)} style={selectStyle}>
                            <option value="all">Todos os Anos</option>
                            {options.years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>🏥 Grande Área</label>
                        <select value={cArea} onChange={e => { setCArea(e.target.value); setCSpecialty('all'); }} style={selectStyle}>
                            <option value="all">Todas as Áreas</option>
                            {options.areas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>🩺 Especialidade</label>
                        <select value={cSpecialty} onChange={e => setCSpecialty(e.target.value)} style={selectStyle} disabled={cArea === 'all'}>
                            <option value="all">Todas as Especialidades</option>
                            {options.specialties
                                .filter(s => cArea === 'all' || data.find(d => d.specialty === s && d.area === cArea)) // Filter options strictly
                                .map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <hr style={{ border: 'none', borderBottom: '1px solid #eee' }} />

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem', color: '#e76f51' }}>📊 Agrupar Por (Eixo X)</label>
                        <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={{ ...selectStyle, borderColor: '#e76f51' }}>
                            <option value="topic">Tópicos (Assuntos)</option>
                            <option value="focus">Foco da Questão (Diag/Trat)</option>
                            <option value="specialty">Especialidade</option>
                            <option value="area">Grande Área</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem', color: '#2a9d8f' }}>✂ Limite de Itens</label>
                        <select value={limit} onChange={e => setLimit(Number(e.target.value))} style={{ ...selectStyle, borderColor: '#2a9d8f' }}>
                            <option value={5}>Top 5 (Resumido)</option>
                            <option value={10}>Top 10 (Padrão)</option>
                            <option value={20}>Top 20 (Detalhado)</option>
                            <option value={50}>Top 50 (Completo)</option>
                        </select>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#264653' }}>{filtered.length}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Questões Encontradas</div>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div style={cardStyle}>
                <h3 style={titleStyle}>Visualização Personalizada</h3>
                {filtered.length === 0 ? (
                    <div style={{ padding: '50px', textAlign: 'center', color: '#aaa' }}>
                        <Search size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
                        <p>Nenhuma questão encontrada com esses filtros.</p>
                    </div>
                ) : (
                    <div style={{ width: '100%', height: '500px', minHeight: '400px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={({ name, percent }) => percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                                    outerRadius={120} // Reduced from 150 to prevent clipping
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

const selectStyle = {
    width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd',
    fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none'
};

export default AnalyticsDashboard;
