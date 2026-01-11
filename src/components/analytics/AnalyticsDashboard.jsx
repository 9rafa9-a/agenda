
import React, { useMemo } from 'react';
import statsData from '../../data/amrigs_stats.json';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    Treemap, LineChart, Line, Cell
} from 'recharts';
import ReactWordcloud from 'react-wordcloud';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const AnalyticsDashboard = () => {

    // 1. Bar Chart: Distribution by "Grande Área"
    const areaDistribution = useMemo(() => {
        const counts = {};
        statsData.forEach(q => {
            counts[q.area] = (counts[q.area] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, []);

    // 2. Heatmap Data (Matrix: Area vs Focus)
    const heatmapData = useMemo(() => {
        const matrix = {}; // { Cirurgia: { Diagnóstico: 10, Tratamento: 5 } }
        const foci = new Set();

        statsData.forEach(q => {
            if (!matrix[q.area]) matrix[q.area] = {};
            // Group similar foci
            let f = q.focus;
            if (f.includes('Diagnóstico')) f = 'Diagnóstico';
            if (f.includes('Tratamento') || f.includes('Conduta')) f = 'Tratamento/Conduta';
            if (f.includes('Clínica') || f.includes('Quadro')) f = 'Quadro Clínico';

            foci.add(f);
            matrix[q.area][f] = (matrix[q.area][f] || 0) + 1;
        });

        return { matrix, foci: Array.from(foci).sort() };
    }, []);

    // 3. Top 10 Topics
    const topTopics = useMemo(() => {
        const counts = {};
        statsData.forEach(q => {
            if (q.topic && q.topic !== 'Outros') {
                counts[q.topic] = (counts[q.topic] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, []);

    // 4. Line Chart: Trend per Year (Area evolution)
    const trendData = useMemo(() => {
        // { 2017: { Cirurgia: 10, Clinica: 12 }, 2018: ... }
        const years = {};
        const areas = new Set();

        statsData.forEach(q => {
            if (!years[q.year]) years[q.year] = { name: q.year };
            years[q.year][q.area] = (years[q.year][q.area] || 0) + 1;
            areas.add(q.area);
        });

        return {
            data: Object.values(years).sort((a, b) => a.name - b.name),
            areas: Array.from(areas)
        };
    }, []);

    // 5. Word Cloud Data
    const wordCloudData = useMemo(() => {
        const text = statsData.map(q => q.summary).join(' ');
        const words = text.split(/\s+/);
        const counts = {};
        const stopWords = ['de', 'a', 'o', 'e', 'do', 'da', 'em', 'um', 'uma', 'com', 'para', 'é', 'não', 'os', 'as', 'se', 'na', 'no', 'por', 'mais', 'pode', 'ser'];

        words.forEach(w => {
            const clean = w.toLowerCase().replace(/[.,:;()]/g, '');
            if (clean.length > 3 && !stopWords.includes(clean)) {
                counts[clean] = (counts[clean] || 0) + 1;
            }
        });

        return Object.entries(counts)
            .map(([text, value]) => ({ text, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 50); // Top 50 words
    }, []);

    // 6. Treemap Data
    const treemapData = useMemo(() => {
        // Hierarchy: Root -> Area -> Specialty
        const areas = {};
        statsData.forEach(q => {
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

    // Custom Treemap Content
    const CustomTreemapContent = (props) => {
        const { root, depth, x, y, width, height, index, payload, colors, rank, name } = props;
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
                    <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={14}>
                        {name}
                    </text>
                ) : null}
                {depth === 2 ? (
                    <text x={x + 4} y={y + 14} fill="#000" fontSize={10} fillOpacity={0.7}>
                        {name} ({Math.round(props.value)})
                    </text>
                ) : null}
            </g>
        );
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-main)' }}>
            <h1 style={{ fontFamily: 'var(--font-hand)', color: 'var(--color-primary)', textAlign: 'center', marginBottom: '40px' }}>
                Raio-X da Prova 📊
            </h1>

            {/* Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' }}>

                {/* 1. Bar Chart */}
                <div style={cardStyle}>
                    <h3 style={titleStyle}>1. Distribuição por Grande Área</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={areaDistribution}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Bar dataKey="value" fill="#8884d8" name="Questões" radius={[4, 4, 0, 0]}>
                                {areaDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 4. Line Chart: Trends */}
                <div style={cardStyle}>
                    <h3 style={titleStyle}>2. Tendência Anual (Linha do Tempo)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            {trendData.areas.map((area, index) => (
                                <Line
                                    key={area}
                                    type="monotone"
                                    dataKey={area}
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Heatmap (Table) */}
                <div style={cardStyle}>
                    <h3 style={titleStyle}>3. O que a banca cobra? (Heatmap)</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #eee' }}>Área</th>
                                    {heatmapData.foci.map(f => (
                                        <th key={f} style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #eee' }}>{f}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(heatmapData.matrix).map(([area, counts], idx) => (
                                    <tr key={area} style={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: COLORS[idx % COLORS.length] }}>{area}</td>
                                        {heatmapData.foci.map(f => {
                                            const val = counts[f] || 0;
                                            // Heatmap color logic (simple opacity)
                                            const opacity = Math.min(val / 20, 1);
                                            return (
                                                <td key={f} style={{ textAlign: 'center', padding: '8px' }}>
                                                    <div style={{
                                                        background: `rgba(136, 132, 216, ${opacity})`,
                                                        color: opacity > 0.5 ? '#fff' : '#000',
                                                        borderRadius: '4px', padding: '4px'
                                                    }}>
                                                        {val}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. Top 10 Table */}
                <div style={cardStyle}>
                    <h3 style={titleStyle}>4. "Mapa da Mina" (Top 10 Temas)</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5' }}>
                                <th style={{ padding: '12px', textAlign: 'left', borderRadius: '8px 0 0 8px' }}>Rank</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Tema</th>
                                <th style={{ padding: '12px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Questões</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topTopics.map((item, idx) => (
                                <tr key={item.name} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#888' }}>#{idx + 1}</td>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{item.name}</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <span style={{
                                            background: idx < 3 ? '#ffecb3' : '#e0e0e0',
                                            padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem'
                                        }}>
                                            {item.value}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 6. Treemap (Full Width) */}
                <div style={{ ...cardStyle, gridColumn: '1 / -1', height: '500px' }}>
                    <h3 style={titleStyle}>5. Hierarquia das Especialidades</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <Treemap
                            data={treemapData}
                            dataKey="size"
                            ratio={4 / 3}
                            stroke="#fff"
                            fill="#8884d8"
                            content={<CustomTreemapContent />}
                        />
                    </ResponsiveContainer>
                </div>

                {/* 5. Word Cloud (Full Width) */}
                <div style={{ ...cardStyle, gridColumn: '1 / -1', height: '400px' }}>
                    <h3 style={titleStyle}>6. Nuvem de Palavras-Chave</h3>
                    <div style={{ height: '350px' }}>
                        <ReactWordcloud
                            words={wordCloudData}
                            options={{
                                rotations: 0,
                                rotationAngles: [0, 0],
                                fontSizes: [20, 60],
                            }}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

const cardStyle = {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid #eee'
};

const titleStyle = {
    marginTop: 0,
    marginBottom: '24px',
    fontSize: '1.2rem',
    color: '#444',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '12px'
};

export default AnalyticsDashboard;
