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
  const [subjects, setSubjects] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for Adding Question
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQ, setEditingQ] = useState<QuestionItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  // Form State
  const [formRoundId, setFormRoundId] = useState('');
  const [formSubjectName, setFormSubjectName] = useState('Digital Electronics');
  const [formType, setFormType] = useState('mcq');
  const [formText, setFormText] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectIndex, setFormCorrectIndex] = useState(0);
  const [formMarks, setFormMarks] = useState(1);
  const [formNegativeMarks, setFormNegativeMarks] = useState(0);
  const [formExplanation, setFormExplanation] = useState('');
  const [formCategory, setCategory] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Fetch Rounds, Subjects & Questions
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

      // 2. Fetch Subjects
      try {
        const subRes = await fetch('/api/admin/subjects');
        const subJson = await subRes.json();
        if (subJson.subjects && subJson.subjects.length > 0) {
          setSubjects(subJson.subjects);
          setFormSubjectName(subJson.subjects[0].name);
        }
      } catch (e) {
        console.error('Error fetching subjects:', e);
      }

      // 3. Fetch Questions
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

  // ── 1. DOWNLOAD MULTI-SUBJECT EXCEL QUESTION TEMPLATE (.xlsx) ──

  const handleDownloadExcelTemplate = () => {
    const templateRows = [
      {
        'Subject Name': 'Digital Electronics',
        'Questions': 'Of the four biasing circuits shown in figure, for a BJT, indicate the one which can have maximum bias stability',
        'Question Type': 'mcq',
        'Image Link / Drive URL': 'https://drive.google.com/file/d/1ABC123EXAMPLE/view?usp=sharing',
        'Option A': 'Fig A',
        'Option B': 'Fig B',
        'Option C': 'Fig C',
        'Option D': 'Fig D',
        'Correct Option (1-4)': 2,
        'Marks': 2,
        'Negative Marks': 0.5,
      },
      {
        'Subject Name': 'Microprocessors & Microcontrollers',
        'Questions': 'What is the maximum addressable memory capacity of 8086 microprocessor?',
        'Question Type': 'mcq',
        'Image Link / Drive URL': '',
        'Option A': '64 KB',
        'Option B': '1 MB',
        'Option C': '4 GB',
        'Option D': '16 MB',
        'Correct Option (1-4)': 2,
        'Marks': 2,
        'Negative Marks': 0.5,
      },
      {
        'Subject Name': 'Signals & Systems',
        'Questions': 'The Fourier Transform of a unit impulse delta function delta(t) is _____',
        'Question Type': 'fill_blank',
        'Image Link / Drive URL': '',
        'Option A': '',
        'Option B': '',
        'Option C': '',
        'Option D': '',
        'Correct Option (1-4)': '1',
        'Marks': 2,
        'Negative Marks': 0,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    worksheet['!cols'] = [
      { wch: 30 },
      { wch: 55 },
      { wch: 15 },
      { wch: 40 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MultiSubject_Question_Template');
    XLSX.writeFile(workbook, 'ECE_MultiSubject_Question_Template.xlsx');
    toast.success('Multi-Subject Excel Question Template Downloaded! 📊');
  };

  const handleDownloadCSVTemplate = () => {
    const templateRows = [
      {
        'Subject Name': 'Digital Electronics',
        'Questions': 'Of the four biasing circuits shown in figure, for a BJT, indicate the one which can have maximum bias stability',
        'Question Type': 'mcq',
        'Image Link / Drive URL': 'https://drive.google.com/file/d/1ABC123EXAMPLE/view?usp=sharing',
        'Option A': 'Fig A',
        'Option B': 'Fig B',
        'Option C': 'Fig C',
        'Option D': 'Fig D',
        'Correct Option (1-4)': 2,
        'Marks': 2,
        'Negative Marks': 0.5,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ECE_MultiSubject_Question_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Multi-Subject CSV Question Template Downloaded! 📄');
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
      const token = session?.access_token || 'admin';

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
        const rowSubject = row['Subject Name'] || row['Subject'] || formSubjectName;
        const optA = String(row['option 1'] || row['Option A'] || '');
        const optB = String(row['option 2'] || row['Option B'] || '');
        const optC = String(row['option 3'] || row['Option C'] || '');
        const optD = String(row['option 4'] || row['Option D'] || '');
        const correctVal = row['Correct Option (1-4)'] !== undefined ? row['Correct Option (1-4)'] : row['Correct Answer'];
        const correctIndex = typeof correctVal === 'number' ? correctVal - 1 : (Number(correctVal) ? Number(correctVal) - 1 : 0);
        const marks = Number(row['Marks']) || 2;
        const negMarks = Number(row['Negative Marks']) || 0.5;
        const difficulty = row['Difficulty'] || 'medium';
        const category = row['Category'] || rowSubject || 'Electronics';
        const explanation = row['Explanation'] || '';

        // Auto-assign image link from Excel/CSV column or figure
        let rawImageUrl = row['Image Link / Drive URL'] || row['Image Link'] || row['Drive Link'] || row['Figure'] || row['image_url'] || null;
        let imageUrl = rawImageUrl ? formatImageUrl(String(rawImageUrl)) : null;

        const optionsArray = [optA, optB, optC, optD].filter(Boolean);

        const newQuestionPayload = {
          round_id: matchedRound.id,
          subject_name: rowSubject,
          question_type: qType,
          question_text: qText,
          options: optionsArray,
          image_url: imageUrl,
          image_alt: imageUrl ? `Question Diagram ${rowIndex}` : null,
          correct_answer: { type: qType, value: qType === 'mcq' ? correctIndex : String(correctVal || '') },
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
            Authorization: `Bearer ${token}`,
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
      const token = session?.access_token || 'admin';

      const payload = {
        round_id: formRoundId,
        subject_name: formSubjectName,
        question_type: formType,
        question_text: formText,
        options: formType === 'mcq' ? formOptions.filter(Boolean) : null,
        image_url: formImageUrl.trim() || null,
        image_alt: formImageUrl.trim() ? 'Question Diagram' : null,
        correct_answer: { type: formType, value: formCorrectIndex },
        marks: formMarks,
        negative_marks: formNegativeMarks,
        category: formCategory || formSubjectName || 'Electronics',
        explanation: formExplanation,
      };

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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
  const filteredQuestions = questions.filter((q: any) => {
    const matchRound = selectedRoundFilter === 'all' || q.round_id === selectedRoundFilter;
    const matchSubject = subjectFilter === 'all' || q.subject_name === subjectFilter || q.category === subjectFilter;
    const matchType = typeFilter === 'all' || q.question_type === typeFilter;
    const matchSearch =
      q.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.subject_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRound && matchSubject && matchType && matchSearch;
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
              <Download size={14} /> Download Excel Template (.xlsx)
            </GalaxyButton>

            <button
              onClick={handleDownloadCSVTemplate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)] text-white text-xs font-[family-name:var(--font-heading)] font-semibold transition-all cursor-pointer"
            >
              <FileSpreadsheet size={14} className="text-[#00E5FF]" />
              <span>Download CSV Template (.csv)</span>
            </button>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-[family-name:var(--font-heading)] font-bold transition-all shadow-md">
              <UploadCloud size={14} />
              <span>{uploadingExcel ? 'Uploading Excel...' : 'Bulk Excel / CSV Upload'}</span>
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

          {/* Subject Filter Selector */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
            <span className="text-xs text-[#94A3B8] font-[family-name:var(--font-heading)] uppercase mr-1">Subject:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs px-3 py-1.5 rounded-xl font-[family-name:var(--font-heading)] outline-none"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2 bg-[#000000] p-2 px-3 rounded-xl border border-[rgba(255,255,255,0.12)] w-full md:w-[240px]">
            <Search size={14} className="text-[#94A3B8] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search question text or subject..."
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
              Create a question manually or upload using the Multi-Subject Excel Question Template.
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
            {filteredQuestions.map((q: any, index: number) => {
              const optList = q.options || [];
              const correctIdx = typeof q.correct_answer === 'object' ? q.correct_answer?.value : Number(q.correct_answer);
              const subjectTag = q.subject_name || q.category || 'General';

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

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold bg-[rgba(0,229,255,0.14)] border border-[rgba(0,229,255,0.3)] text-[#00E5FF] uppercase">
                          📚 {subjectTag}
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
                            src={formatImageUrl(q.image_url)}
                            alt={q.image_alt || 'Circuit Schematic'}
                            className="max-h-48 object-contain rounded-lg border border-white/10 bg-black/80"
                          />
                        </div>
                      )}

                      {optList.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                          {optList.map((opt: string, i: number) => {
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
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/90 backdrop-blur-md p-3 sm:p-6 flex items-start justify-center pt-6 pb-28">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowAddModal(false)} />
          
          <div className="relative z-10 w-full max-w-2xl bg-[#08080C] border border-white/20 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col">
            {/* STICKY HEADER */}
            <div className="flex items-center justify-between p-5 px-6 bg-[#0B0B10] border-b border-white/12 flex-shrink-0">
              <h3 className="font-[family-name:var(--font-display)] font-extrabold text-xl text-white flex items-center gap-2">
                <span className="text-[#00E5FF]">⚡</span> {editingQ ? 'Edit Question' : 'Create New Question'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto max-h-[70vh] p-6 space-y-5">
              {/* 1. ROUND SELECT, SUBJECT & MARKS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label text-xs text-[#E2E8F0] font-bold">Target Round</label>
                  <select
                    value={formRoundId}
                    onChange={(e) => setFormRoundId(e.target.value)}
                    className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs font-medium"
                  >
                    {rounds.map((r) => (
                      <option key={r.id} value={r.id}>Round #{r.round_number}: {r.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label text-xs text-[#E2E8F0] font-bold">Subject Name</label>
                  <select
                    value={formSubjectName}
                    onChange={(e) => setFormSubjectName(e.target.value)}
                    className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs font-medium"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label text-xs text-[#E2E8F0] font-bold">Marks & Negative Penalty</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Marks (+)"
                      value={formMarks}
                      onChange={(e) => setFormMarks(Number(e.target.value))}
                      className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Negative (-)"
                      value={formNegativeMarks}
                      onChange={(e) => setFormNegativeMarks(Number(e.target.value))}
                      className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 2. QUESTION STATEMENT */}
              <div>
                <label className="form-label text-xs text-[#E2E8F0] font-bold">Question Statement / Problem Text</label>
                <textarea
                  rows={3}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Enter complete question text or problem statement..."
                  className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-sm"
                  required
                />
              </div>

              {/* 3. PROMINENT QUESTION DIAGRAM / GOOGLE DRIVE LINK / IMAGE UPLOAD */}
              <div 
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      if (evt.target?.result) {
                        setFormImageUrl(evt.target.result as string);
                        toast.success('Image dropped & attached successfully! 🖼️');
                      }
                    };
                    reader.readAsDataURL(file);
                  } else {
                    toast.error('Only image files are supported');
                  }
                }}
                className={`p-4 rounded-2xl transition-all duration-200 space-y-3 shadow-xl ${
                  dragActive 
                    ? 'bg-[rgba(0,229,255,0.15)] border-2 border-dashed border-[#00E5FF] scale-[1.01]' 
                    : 'bg-[rgba(0,229,255,0.06)] border border-[rgba(0,229,255,0.4)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="form-label text-xs text-white font-bold flex items-center gap-2">
                    <span className="p-1 rounded bg-[#00E5FF]/20 text-[#00E5FF]">⚡</span>
                    <span>Question Image / Circuit Diagram / Google Drive Link (Optional)</span>
                  </label>
                  <span className="text-[10px] text-[#00E5FF] font-mono font-bold px-2 py-0.5 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/30">
                    Drag & Drop Active
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(formatImageUrl(e.target.value))}
                    placeholder="Paste Google Drive share link (e.g. https://drive.google.com/...) or drag image file here..."
                    className="form-input bg-black text-white border border-white/20 text-xs flex-1"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 flex-shrink-0 shadow-md">
                    <UploadCloud size={14} />
                    <span>Upload Local Image</span>
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
                              toast.success('Image attached successfully! 🖼️');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Thumbnail Preview Area */}
                {formImageUrl && (
                  <div className="relative mt-2 p-2 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20 bg-black flex items-center justify-center">
                        <img src={formImageUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="text-[10px] text-[#94A3B8] font-mono truncate max-w-[200px]">
                        {formImageUrl.startsWith('data:') ? 'Local file uploaded' : formImageUrl}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="px-2.5 py-1.5 rounded-lg bg-[rgba(255,0,51,0.15)] hover:bg-[rgba(255,0,51,0.25)] border border-[rgba(255,0,51,0.3)] text-[#FF4569] text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Clear Image
                    </button>
                  </div>
                )}

                {/* Quick Select Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1 items-center">
                  <span className="text-[10px] text-[#94A3B8] font-mono mr-1">Preset Schematics:</span>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormImageUrl(`/uploads/questions/image${num}.png`)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                        formImageUrl === `/uploads/questions/image${num}.png`
                          ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-white font-bold'
                          : 'bg-white/5 border-white/10 text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      Img #{num}
                    </button>
                  ))}
                </div>

                {/* Live Diagram Image Preview */}
                {formImageUrl && (
                  <div className="mt-2 p-3 rounded-xl bg-black border border-[rgba(0,229,255,0.5)] text-center space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] text-[#00E5FF] font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Image Attached & Ready Preview:
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="text-xs text-[#FF0033] hover:underline font-bold cursor-pointer"
                      >
                        ✕ Clear Image
                      </button>
                    </div>
                    <img
                      src={formatImageUrl(formImageUrl)}
                      alt="Circuit Diagram Preview"
                      className="max-h-44 mx-auto object-contain rounded-lg border border-white/10 bg-black/80 p-1"
                    />
                  </div>
                )}
              </div>

              {/* 4. MULTIPLE CHOICE OPTIONS */}
              <div className="space-y-2">
                <label className="form-label text-xs text-[#E2E8F0] font-bold">Multiple Choice Options (Select Correct Answer Radio)</label>
                {formOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOpt"
                      checked={formCorrectIndex === idx}
                      onChange={() => setFormCorrectIndex(idx)}
                      className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
                    />
                    <span className="font-[family-name:var(--font-mono)] text-xs text-white w-6 font-bold">{String.fromCharCode(65 + idx)}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const updated = [...formOptions];
                        updated[idx] = e.target.value;
                        setFormOptions(updated);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs flex-1"
                    />
                  </div>
                ))}
              </div>

              {/* 5. EXPLANATION */}
              <div>
                <label className="form-label text-xs text-[#E2E8F0] font-bold">Explanation / Solution Reference (Optional)</label>
                <input
                  type="text"
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Provide solution breakdown or reference..."
                  className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs"
                />
              </div>

              {/* STICKY FOOTER INSIDE FORM */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/12 flex-shrink-0">
                <GalaxyButton variant="secondary" size="sm" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </GalaxyButton>
                <GalaxyButton variant="primary" size="sm" type="submit" loading={submitting}>
                  {editingQ ? 'Save Changes' : 'Create Question'}
                </GalaxyButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
