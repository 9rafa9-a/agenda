import React from 'react';
import { ArrowLeft, Book, Brain, ShieldAlert, FileText, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'var(--font-main)', color: '#444' }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '30px', background: 'none', border: 'none',
                    cursor: 'pointer', color: '#666', fontSize: '1rem'
                }}
            >
                <ArrowLeft size={20} /> Voltar
            </button>

            <header style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '3.5rem', color: 'var(--color-primary)', marginBottom: '10px' }}>
                    Como funciona o App?
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#666' }}>Guia rápido e direto das funcionalidades.</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', marginBottom: '80px' }}>

                {/* Feature 1: Raio-X */}
                <section style={sectionStyle}>
                    <div style={{ flex: 1 }}>
                        <div style={{ ...iconStyle, background: '#e3f2fd', color: '#1565c0', marginBottom: '20px' }}><Activity size={32} /></div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>Raio-X Interativo</h2>
                        <p style={{ lineHeight: '1.6', fontSize: '1.1rem', color: '#555' }}>
                            Mergulhe em 10 anos de provas da AMRIGS. Nosso painel analytics permite dissecar a prova em 4 níveis de profundidade:
                        </p>
                        <ul style={{ marginTop: '15px', paddingLeft: '20px', lineHeight: '1.8', color: '#555' }}>
                            <li><strong>Visão Macro:</strong> Tendências anuais das grandes áreas.</li>
                            <li><strong>Visão Estratégica:</strong> Quais especialidades estão em alta ou em baixa.</li>
                            <li><strong>Visão Tática:</strong> Os temas (doenças) mais cobrados dentro de cada especialidade.</li>
                            <li><strong>Laboratório:</strong> Cruze dados livremente para encontrar padrões ocultos.</li>
                        </ul>
                    </div>
                    <div style={imageWrapperStyle}>
                        <img src="/assets/raiox_demo.png" alt="Demonstração do Raio-X" style={imageStyle} />
                    </div>
                </section>

                {/* Feature 2: Editor */}
                <section style={{ ...sectionStyle, flexDirection: 'row-reverse' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ ...iconStyle, background: '#fce4ec', color: '#c2185b', marginBottom: '20px' }}><Book size={32} /></div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>Editor Estruturado</h2>
                        <p style={{ lineHeight: '1.6', fontSize: '1.1rem', color: '#555' }}>
                            Adeus cadernos desorganizados. Nosso editor guia você pelas 9 seções essenciais de qualquer doença:
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                            <span style={pillStyle}>Definição</span>
                            <span style={pillStyle}>Epidemiologia</span>
                            <span style={pillStyle}>Quadro Clínico</span>
                            <span style={pillStyle}>Diagnóstico</span>
                            <span style={pillStyle}>Tratamento</span>
                            <span style={pillStyle}>Prognóstico</span>
                        </div>
                        <p style={{ marginTop: '15px', color: '#666', fontSize: '0.9rem' }}>
                            * Tudo salvo automaticamente no seu banco de dados pessoal (ou na Sandbox).
                        </p>
                    </div>
                    <div style={imageWrapperStyle}>
                        <img src="/assets/editor_demo.png" alt="Demonstração do Editor" style={imageStyle} />
                    </div>
                </section>

                {/* Feature 3: Flashcards */}
                <section style={sectionStyle}>
                    <div style={{ flex: 1 }}>
                        <div style={{ ...iconStyle, background: '#f3e5f5', color: '#7b1fa2', marginBottom: '20px' }}><Brain size={32} /></div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>Flashcards com IA</h2>
                        <p style={{ lineHeight: '1.6', fontSize: '1.1rem', color: '#555' }}>
                            Não perca tempo criando cartões. Nossa Inteligência Artificial lê seus resumos e gera perguntas de revisão ativa instantaneamente.
                        </p>
                        <p style={{ marginTop: '10px', lineHeight: '1.6', fontSize: '1.1rem', color: '#555' }}>
                            Pratique com repetição espaçada e acompanhe seu desempenho.
                        </p>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={imageWrapperStyle}>
                            <img src="/assets/flashcard1.png" alt="Flashcard Frente" style={imageStyle} />
                        </div>
                        <div style={imageWrapperStyle}>
                            <img src="/assets/flashcard2.png" alt="Flashcard Verso" style={imageStyle} />
                        </div>
                    </div>
                </section>

                {/* Feature 4: Guest Mode */}
                <section style={{ ...sectionStyle, background: '#e8f5e9', padding: '30px', borderRadius: '20px' }}>
                    <div style={{ ...iconStyle, background: '#c8e6c9', color: '#2e7d32' }}><ShieldAlert size={32} /></div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Modo Convidado (Sandbox)</h3>
                        <p>
                            Sinta-se livre para testar! No modo convidado, seus dados são isolados. Você pode criar, deletar e bagunçar à vontade sem medo de estragar o banco de dados oficial.
                        </p>
                    </div>
                </section>

            </div>

            <section style={{ background: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: '2.5rem', marginBottom: '20px', color: '#333' }}>
                    A "Mágica" por trás dos dados
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    <div>
                        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '20px' }}>
                            Todos os gráficos e estatísticas que você vê no Raio-X não nasceram prontos. Eles são fruto de um trabalho meticuloso de <strong>Engenharia de Dados</strong>.
                        </p>
                        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '20px' }}>
                            Utilizamos o modelo <strong>Gemini 3.0 Pro</strong> para ler, interpretar e estruturar milhares de questões de provas antigas (2017-2026), transformando PDFs brutos em planilhas de dados precisas.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                            <span style={tagStyle}>Gemini 3.0 Pro</span>
                            <span style={tagStyle}>Extração de Dados</span>
                            <span style={tagStyle}>Estruturação</span>
                        </div>
                    </div>

                    <div style={{
                        width: '100%',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '5px solid #eee',
                        lineHeight: 0,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}>
                        <img
                            src="/assets/capturar.png"
                            alt="Planilha de Dados sendo processada"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.parentElement.style.background = '#f5f5f5';
                                e.target.parentElement.style.height = '200px';
                                e.target.parentElement.style.display = 'flex';
                                e.target.parentElement.style.alignItems = 'center';
                                e.target.parentElement.style.justifyContent = 'center';
                                e.target.parentElement.innerHTML = '<span style="color:#aaa">Imagem não encontrada em /assets/capturar.png</span>';
                            }}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};



const sectionStyle = {
    display: 'flex', gap: '40px', alignItems: 'center',
    background: 'transparent', padding: '0', borderRadius: '0', boxShadow: 'none'
};

const imageWrapperStyle = {
    flex: 1,
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    border: '1px solid #eee'
};

const imageStyle = {
    width: '100%', height: 'auto', display: 'block'
};

const iconStyle = {
    width: '60px', height: '60px', borderRadius: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const tagStyle = {
    background: '#f0f0f0', padding: '6px 14px', borderRadius: '20px',
    fontSize: '0.85rem', fontWeight: 'bold', color: '#555'
};

const pillStyle = {
    background: '#fce4ec', color: '#c2185b', padding: '5px 10px',
    borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold'
};

export default HelpPage;
