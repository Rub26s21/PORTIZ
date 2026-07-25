'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { formatImageUrl } from '@/lib/utils';
import {
  HelpCircle, Plus, UploadCloud, Download, FileSpreadsheet,
  Search, Trash2, Edit3, CheckCircle2, RefreshCw, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface RoundItem {
  id: string;
  round_number: number;
  title: string;
}

interface QuestionItem {
  id: string;
  round_id: string;
  question_type: string;
  question_text: string;
  options: string[] | null;
  image_url?: string | null;
  image_alt?: string | null;
  correct_answer: any;
  marks: number;
  negative_marks?: number;
  category?: string | null;
  difficulty?: string | null;
  explanation?: string | null;
  rounds?: { title: string; round_number: number };
}

export default function QuestionsControlPage() {
  const [rounds, setRounds] = useState<RoundItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for Adding Question
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQ, setEditingQ] = useState<QuestionItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  // Form State
  const [formRoundId, setFormRoundId] = useState('');
  const [formType, setFormType] = useState('mcq');
  const [formText, setFormText] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectIndex, setFormCorrectIndex] = useState(0);
  const [formMarks, setFormMarks] = useState(1);
  const [formNegativeMarks, setFormNegativeMarks] = useState(0);
  const [formExplanation, setFormExplanation] = useState('');
  const [formCategory, setCategory] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  // Fetch Rounds & Questions
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Rounds
      const { data: rData } = await supabase
        .from('rounds')
        .select('id, round_number, title')
        .order('round_number', { ascending: true });

      if (rData && rData.length > 0) {
        setRounds(rData);
        if (!formRoundId) setFormRoundId(rData[0].id);
      }

      // 2. Fetch Questions
      const { data: qData } = await supabase
        .from('questions')
        .select('*, rounds(title, round_number)')
        .order('created_at', { ascending: false });

      if (qData) {
        setQuestions(qData);
      }
    } catch (err) {
      console.error('fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, [formRoundId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── 1. DOWNLOAD ARDUFUSION EXCEL QUESTION TEMPLATE (.xlsx) ──

  const handleDownloadExcelTemplate = () => {
    const templateRows = [
      {
        'Questions': 'Of the four biasing circuits shown in figure, for a BJT, indicate the one which can have maximum bias stability',
        'Image Link / Drive URL': 'https://drive.google.com/file/d/1ABC123EXAMPLE/view?usp=sharing',
        'Figure': 'image1.png',
        'option 1': 'Fig A',
        'option 2': 'Fig B',
        'option 3': 'Fig C',
        'option 4': 'Fig D',
        'Correct Option (1-4)': 2,
        'Marks': 2,
        'Negative Marks': 0.5,
      },
      {
        'Questions': 'Determine Vo in the circuit below.',
        'Image Link / Drive URL': 'https://drive.google.com/file/d/1XYZ456EXAMPLE/view?usp=sharing',
        'Figure': 'image2.png',
        'option 1': '24V',
        'option 2': '1V',
        'option 3': '12V',
        'option 4': '2V',
        'Correct Option (1-4)': 3,
        'Marks': 2,
        'Negative Marks': 0.5,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    worksheet['!cols'] = [
      { wch: 55 },
      { wch: 40 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ARDUFUSION_Template');
    XLSX.writeFile(workbook, 'ARDUFUSION_question_template.xlsx');
    toast.success('ARDUFUSION Excel Question Template Downloaded! 📊');
  };

  // ── 2. BULK EXCEL QUESTION UPLOAD (.xlsx / .csv) ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingExcel(true);
    try {
      const dataBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(dataBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawJson: any[] = XLSX.utils.sheet_to_json(sheet);

      if (rawJson.length === 0) {
        toast.error('The uploaded Excel file contains no data rows');
        setUploadingExcel(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Authentication session expired. Please log in again.');
        setUploadingExcel(false);
        return;
      }

      let insertedCount = 0;
      let rowIndex = 0;
      for (const row of rawJson) {
        rowIndex++;
        const roundNum = Number(row['Round Number'] || 1);
        const matchedRound = rounds.find((r) => r.round_number === roundNum) || rounds[0];

        if (!matchedRound) continue;

        // Support ARDUFUSION.xlsx format OR standard template format
        const qType = (row['Question Type'] || 'mcq').toLowerCase();
        const qText = row['Questions'] || row['Question Text'] || '';
        const optA = String(row['option 1'] || row['Option A'] || '');
        const optB = String(row['option 2'] || row['Option B'] || '');
        const optC = String(row['option 3'] || row['Option C'] || '');
        const optD = String(row['option 4'] || row['Option D'] || '');
        const correctIndex = (Number(row['Correct Option (1-4)']) || 1) - 1;
        const marks = Number(row['Marks']) || 2;
        const negMarks = Number(row['Negative Marks']) || 0.5;
        const difficulty = row['Difficulty'] || 'medium';
        const category = row['Category'] || 'Arduino / Electronics';
        const explanation = row['Explanation'] || '';

        // Auto-assign image link from Excel/CSV column or figure
        let rawImageUrl = row['Image Link / Drive URL'] || row['Image Link'] || row['Drive Link'] || row['Figure'] || row['image_url'] || null;
        let imageUrl = rawImageUrl ? formatImageUrl(String(rawImageUrl)) : null;
        if (!imageUrl && rowIndex <= 14) {
          imageUrl = `/uploads/questions/image${rowIndex}.png`;
        }

        const optionsArray = [optA, optB, optC, optD].filter(Boolean);

        const newQuestionPayload = {
          round_id: matchedRound.id,
          question_type: qType,
          question_text: qText,
          options: optionsArray,
          image_url: imageUrl,
          image_alt: `Circuit Schematic ${rowIndex}`,
          correct_answer: { type: 'mcq', value: correctIndex },
          marks: marks,
          negative_marks: negMarks,
          difficulty: difficulty,
          category: category,
          explanation: explanation,
        };

        const res = await fetch(`/api/admin/rounds/${matchedRound.id}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(newQuestionPayload),
        });

        if (res.ok) insertedCount++;
      }

      toast.success(`Bulk Upload Complete! ${insertedCount} ARDUFUSION questions imported successfully! 🚀`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error processing Excel file');
    } finally {
      setUploadingExcel(false);
      e.target.value = '';
    }
  };

  // ── 3. SAVE / ADD SINGLE QUESTION ──
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) {
      toast.error('Please enter question text');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const payload = {
        round_id: formRoundId,
        question_type: formType,
        question_text: formText,
        options: formType === 'mcq' ? formOptions.filter(Boolean) : null,
        image_url: formImageUrl.trim() || null,
        image_alt: formImageUrl.trim() ? 'Circuit Schematic Diagram' : null,
        correct_answer: { type: formType, value: formCorrectIndex },
        marks: formMarks,
        negative_marks: formNegativeMarks,
        category: formCategory || 'Arduino / Electronics',
        explanation: formExplanation,
      };

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      };

      if (editingQ) {
        const res = await fetch(`/api/admin/rounds/${formRoundId}/questions`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ questionId: editingQ.id, ...payload }),
        });

        if (!res.ok) throw new Error('Failed to update question');
        toast.success('Question updated successfully! ✏️');
      } else {
        const res = await fetch(`/api/admin/rounds/${formRoundId}/questions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to create question');
        toast.success('New Question created! ➕');
      }

      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save question');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 4. DELETE QUESTION ──
  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/rounds/${formRoundId || 'all'}/questions?questionId=${qId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete question');
      toast.success('Question deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete question');
    }
  };

  // Open Modal Helpers
  const openCreateModal = () => {
    setEditingQ(null);
    setFormText('');
    setFormOptions(['', '', '', '']);
    setFormCorrectIndex(0);
    setFormMarks(2);
    setFormNegativeMarks(0.5);
    setFormExplanation('');
    setCategory('Arduino / Electronics');
    setFormImageUrl('');
    setShowAddModal(true);
  };

  const openEditModal = (q: QuestionItem) => {
    setEditingQ(q);
    setFormRoundId(q.round_id);
    setFormType(q.question_type || 'mcq');
    setFormText(q.question_text || '');
    setFormOptions(q.options && q.options.length > 0 ? q.options : ['', '', '', '']);
    setFormCorrectIndex(typeof q.correct_answer === 'object' ? q.correct_answer?.value ?? 0 : Number(q.correct_answer) || 0);
    setFormMarks(q.marks || 2);
    setFormNegativeMarks(q.negative_marks || 0.5);
    setFormExplanation(q.explanation || '');
    setCategory(q.category || '');
    setFormImageUrl(q.image_url || '');
    setShowAddModal(true);
  };

  // Filtered List
  const filteredQuestions = questions.filter((q) => {
    const matchRound = selectedRoundFilter === 'all' || q.round_id === selectedRoundFilter;
    const matchType = typeFilter === 'all' || q.question_type === typeFilter;
    const matchSearch =
      q.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRound && matchType && matchSearch;
  });

  const cleanShadow = '0 4px 20px rgba(0,0,0,0.8)';

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto relative z-10" style={{ background: '#000000', minHeight: '100vh', color: '#FFFFFF' }}>

      {/* ═══ HEADER ═══ */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] w-fit mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF] animate-pulse" />
              <span className="font-[family-name:var(--font-heading)] text-[10px] font-semibold tracking-widest text-[#FFFFFF] uppercase">
                QUESTION CONTROL CENTER ✦
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#FFFFFF]">
              Question Bank & Excel Manager
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] font-light mt-0.5">
              {questions.length} total questions configured across {rounds.length} competition rounds
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <GalaxyButton variant="secondary" size="sm" onClick={handleDownloadExcelTemplate}>
              <Download size={14} /> Download Excel Format (.xlsx)
            </GalaxyButton>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.25)] text-white text-xs font-[family-name:var(--font-heading)] font-semibold transition-all">
              <UploadCloud size={14} />
              {uploadingExcel ? 'Uploading Excel...' : 'Bulk Excel Upload (.xlsx)'}
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" disabled={uploadingExcel} />
            </label>

            <GalaxyButton variant="primary" size="sm" onClick={openCreateModal}>
              <Plus size={14} /> Create Question
            </GalaxyButton>
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />
      </FadeIn>

      {/* ═══ FILTER & SEARCH TOOLBAR ═══ */}
      <FadeIn delay={0.06}>
        <GlassCard variant="solid" radius={20} hover={false} noHover className="!p-4 border border-[rgba(255,255,255,0.12)] flex flex-col md:flex-row items-center justify-between gap-4" style={{ background: '#000000', boxShadow: cleanShadow }}>
          {/* Round Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
            <span className="text-xs text-[#94A3B8] font-[family-name:var(--font-heading)] uppercase mr-1">Round:</span>
            <button
              onClick={() => setSelectedRoundFilter('all')}
              className={`px-3 py-1.5 rounded-full font-[family-name:var(--font-heading)] text-xs transition-all cursor-pointer ${
                selectedRoundFilter === 'all'
                  ? 'bg-white text-black font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[rgba(255,255,255,0.06)]'
              }`}
            >
              All Rounds ({questions.length})
            </button>
            {rounds.map((r) => {
              const count = questions.filter((q) => q.round_id === r.id).length;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoundFilter(r.id)}
                  className={`px-3 py-1.5 rounded-full font-[family-name:var(--font-heading)] text-xs transition-all cursor-pointer whitespace-nowrap ${
                    selectedRoundFilter === r.id
                      ? 'bg-white text-black font-semibold'
                      : 'text-[#94A3B8] hover:text-white bg-[rgba(255,255,255,0.06)]'
                  }`}
                >
                  Round #{r.round_number} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2 bg-[#000000] p-2 px-3 rounded-xl border border-[rgba(255,255,255,0.12)] w-full md:w-[280px]">
            <Search size={14} className="text-[#94A3B8] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search question text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-[#FFFFFF] placeholder:text-[#64748B] font-[family-name:var(--font-body)] w-full"
            />
          </div>
        </GlassCard>
      </FadeIn>

      {/* ═══ QUESTIONS LIST / TABLE ═══ */}
      <FadeIn delay={0.12}>
        {loading ? (
          <div className="py-20 text-center text-xs text-[#94A3B8]">Loading question bank...</div>
        ) : filteredQuestions.length === 0 ? (
          <GlassCard variant="solid" radius={24} hover={false} noHover className="!p-16 text-center border border-[rgba(255,255,255,0.12)]" style={{ background: '#000000' }}>
            <HelpCircle size={48} className="mx-auto text-[#64748B] opacity-40 mb-3" />
            <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-[#FFFFFF]">
              No questions found
            </h3>
            <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] mt-1">
              Create a question manually or upload using the Excel Question Format template.
            </p>
            <div className="flex justify-center gap-3 mt-5">
              <GalaxyButton variant="secondary" size="sm" onClick={handleDownloadExcelTemplate}>
                <Download size={14} /> Download Excel Format
              </GalaxyButton>
              <GalaxyButton variant="primary" size="sm" onClick={openCreateModal}>
                <Plus size={14} /> Create Question
              </GalaxyButton>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q, index) => {
              const optList = q.options || [];
              const correctIdx = typeof q.correct_answer === 'object' ? q.correct_answer?.value : Number(q.correct_answer);

              return (
                <GlassCard
                  key={q.id}
                  variant="elevated"
                  radius={20}
                  hover={false}
                  noHover
                  className="!p-6 border border-[rgba(255,255,255,0.12)] transition-all"
                  style={{ background: '#000000', boxShadow: cleanShadow }}
                >
                  <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-[family-name:var(--font-mono)] font-bold text-xs px-2.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] text-white">
                          Q{index + 1}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-medium bg-[rgba(0,102,255,0.15)] border border-[rgba(0,102,255,0.3)] text-[#0066FF] uppercase">
                          Round #{q.rounds?.round_number || 1} · {q.rounds?.title || 'Round'}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] uppercase bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[#94A3B8]">
                          {q.question_type || 'MCQ'}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-mono)] font-bold text-white bg-[rgba(255,255,255,0.08)]">
                          +{q.marks} pts {q.negative_marks ? `(-${q.negative_marks})` : ''}
                        </span>
                      </div>

                      <h3 className="font-[family-name:var(--font-display)] font-semibold text-base text-[#FFFFFF] leading-snug">
                        {q.question_text}
                      </h3>

                      {/* Circuit Diagram Image Preview in Admin List */}
                      {q.image_url && (
                        <div className="mt-2.5 p-2 rounded-xl bg-black/60 border border-white/12 inline-block max-w-md">
                          <span className="text-[10px] text-[#94A3B8] font-mono block mb-1">⚡ Circuit Schematic / Figure:</span>
                          <img
                            src={q.image_url}
                            alt={q.image_alt || 'Circuit Schematic'}
                            className="max-h-48 object-contain rounded-lg border border-white/10 bg-black/80"
                          />
                        </div>
                      )}

                      {optList.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                          {optList.map((opt, i) => {
                            const isCorrect = i === correctIdx;
                            return (
                              <div
                                key={i}
                                className={`p-2.5 px-3 rounded-xl border text-xs font-[family-name:var(--font-body)] flex items-center justify-between gap-2 ${
                                  isCorrect
                                    ? 'border-[rgba(0,229,255,0.5)] bg-[rgba(0,229,255,0.08)] text-white font-medium'
                                    : 'border-[rgba(255,255,255,0.08)] bg-[#000000] text-[#94A3B8]'
                                }`}
                              >
                                <span>
                                  <strong className="font-[family-name:var(--font-mono)] text-white mr-1.5">
                                    {String.fromCharCode(65 + i)}.
                                  </strong>
                                  {opt}
                                </span>
                                {isCorrect && (
                                  <span className="text-[10px] font-[family-name:var(--font-heading)] font-bold text-[#00E5FF] uppercase flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.explanation && (
                        <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light pt-1">
                          💡 <strong>Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(q)}
                        className="p-2 rounded-xl bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.18)] border border-[rgba(255,255,255,0.2)] text-white transition-colors cursor-pointer"
                        title="Edit question"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 rounded-xl bg-[rgba(255,0,51,0.14)] hover:bg-[rgba(255,0,51,0.25)] border border-[rgba(255,0,51,0.3)] text-[#FF4569] transition-colors cursor-pointer"
                        title="Delete question"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </FadeIn>

      {/* ═══ CREATE / EDIT QUESTION MODAL ═══ */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pb-28 overflow-y-auto">
          <div className="fixed inset-0 bg-[#000000]/85 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 w-full max-w-xl max-h-[85vh] overflow-y-auto">
            <GlassCard variant="elevated" radius={28} hover={false} noHover className="!p-7 border border-[rgba(255,255,255,0.2)] space-y-5" style={{ background: '#000000' }}>
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
                <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-[#FFFFFF]">
                  {editingQ ? 'Edit Question' : 'Create Question'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-[#94A3B8] hover:text-white cursor-pointer font-bold text-lg">✕</button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label text-xs text-[#E2E8F0]">Select Target Round</label>
                    <select
                      value={formRoundId}
                      onChange={(e) => setFormRoundId(e.target.value)}
                      className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.15)]"
                    >
                      {rounds.map((r) => (
                        <option key={r.id} value={r.id}>Round #{r.round_number}: {r.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label text-xs text-[#E2E8F0]">Marks & Negative</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Marks"
                        value={formMarks}
                        onChange={(e) => setFormMarks(Number(e.target.value))}
                        className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.15)]"
                      />
                      <input
                        type="number"
                        placeholder="Negative"
                        value={formNegativeMarks}
                        onChange={(e) => setFormNegativeMarks(Number(e.target.value))}
                        className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.15)]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label text-xs text-[#E2E8F0]">Question Text</label>
                  <textarea
                    rows={3}
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="Enter full question statement..."
                    className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.15)] text-sm"
                  />
                </div>

                {/* CIRCUIT DIAGRAM / IMAGE ATTACHMENT */}
                <div className="p-3 rounded-xl bg-black/60 border border-white/12 space-y-2">
                  <label className="form-label text-xs text-[#E2E8F0] font-bold block flex items-center justify-between">
                    <span>⚡ Circuit Schematic / Diagram Image</span>
                    <span className="text-[10px] text-[#94A3B8] font-normal">Supports URL, local path, or File Upload</span>
                  </label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(formatImageUrl(e.target.value))}
                      placeholder="Paste Google Drive share link or Image URL..."
                      className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.15)] text-xs flex-1"
                    />
                    <label className="px-3 py-2 rounded-xl bg-[#0066FF]/20 hover:bg-[#0066FF]/30 border border-[#0066FF]/40 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 flex-shrink-0">
                      <span>📁 Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) {
                                setFormImageUrl(evt.target.result as string);
                                toast.success('Circuit diagram attached! 🖼️');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Preset ARDUFUSION circuit schematic images */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-[#94A3B8] mr-1 self-center">Quick Select:</span>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormImageUrl(`/uploads/questions/image${num}.png`)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                          formImageUrl === `/uploads/questions/image${num}.png`
                            ? 'bg-[#FF0033]/30 border-[#FF0033] text-white font-bold'
                            : 'bg-white/5 border-white/10 text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        Img #{num}
                      </button>
                    ))}
                  </div>

                  {/* Live Circuit Diagram Image Preview */}
                  {formImageUrl && (
                    <div className="mt-2 p-2 rounded-lg bg-black border border-white/15 text-center">
                      <div className="flex items-center justify-between px-1 mb-1">
                        <span className="text-[10px] text-[#00E5FF] font-mono block">Live Image Preview:</span>
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="text-xs text-[#FF0033] hover:underline cursor-pointer"
                        >
                          Clear Image
                        </button>
                      </div>
                      <img
                        src={formatImageUrl(formImageUrl)}
                        alt="Circuit Diagram Preview"
                        className="max-h-40 mx-auto object-contain rounded border border-white/10"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="form-label text-xs text-[#E2E8F0]">Multiple Choice Options (Select Correct Index)</label>
                  {formOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={formCorrectIndex === idx}
                        onChange={() => setFormCorrectIndex(idx)}
                        className="w-4 h-4 accent-white cursor-pointer"
                      />
                      <span className="font-[family-name:var(--font-mono)] text-xs text-white w-6">{String.fromCharCode(65 + idx)}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...formOptions];
                          updated[idx] = e.target.value;
                          setFormOptions(updated);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.15)] text-xs flex-1"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="form-label text-xs text-[#E2E8F0]">Explanation (Optional)</label>
                  <input
                    type="text"
                    value={formExplanation}
                    onChange={(e) => setFormExplanation(e.target.value)}
                    placeholder="Provide solution breakdown or reference..."
                    className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.15)] text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <GalaxyButton variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </GalaxyButton>
                  <GalaxyButton variant="primary" size="sm" type="submit" loading={submitting}>
                    {editingQ ? 'Save Changes' : 'Create Question'}
                  </GalaxyButton>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}

    </div>
  );
}
