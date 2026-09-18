'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { formatImageUrl } from '@/lib/utils';
import {
  HelpCircle, Plus, UploadCloud, Download, FileSpreadsheet,
  Search, Trash2, Edit3, CheckCircle2, RefreshCw, FileText,
  Sparkles, Layers, Zap, Check, AlertCircle, ArrowRight, X
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
  subject_name?: string | null;
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

  // Auto-Generator Modal State
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [autoTitle, setAutoTitle] = useState('Automated 50-Q ECE Weekly Test');
  const [autoDuration, setAutoDuration] = useState(45);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  // ── MASTER BULK UPLOAD (850 - 1600+ QS) STATE ──
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [masterParsedData, setMasterParsedData] = useState<{
    totalRows: number;
    subjectGroups: Record<string, any[]>;
    detectedSubjects: string[];
    sampleQuestions: any[];
  } | null>(null);
  const [masterUploadMode, setMasterUploadMode] = useState<'auto_fill_100' | 'full_import'>('auto_fill_100');
  const [masterTargetRound, setMasterTargetRound] = useState<string>('bank');
  const [masterUploading, setMasterUploading] = useState(false);
  const [masterProgress, setMasterProgress] = useState<{
    currentChunk: number;
    totalChunks: number;
    uploadedCount: number;
    totalToUpload: number;
    percentage: number;
    currentSubject: string;
  } | null>(null);

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

  // ── SMART SUBJECT MATCHER (MATCHES EXCEL TEXT TO 10 ECE SUBJECTS) ──
  const matchSubjectName = useCallback((rawSubject: any): string => {
    if (!rawSubject) return 'Digital Electronics';
    const str = String(rawSubject).trim();

    // Direct exact or case-insensitive match
    const exact = subjects.find(
      (s) => s.name.toLowerCase() === str.toLowerCase() || (s.code && s.code.toLowerCase() === str.toLowerCase())
    );
    if (exact) return exact.name;

    // Fuzzy Keyword Matching
    const lower = str.toLowerCase();
    if (
      lower.includes('microprocessor') ||
      lower.includes('microcontroller') ||
      lower.includes('8086') ||
      lower.includes('8051') ||
      lower.includes('mpmc') ||
      lower.includes('arm')
    ) {
      return 'Microprocessors & Microcontrollers';
    }
    if (
      lower.includes('vlsi') ||
      lower.includes('cmos') ||
      lower.includes('verilog') ||
      lower.includes('vhdl') ||
      lower.includes('layout') ||
      lower.includes('mosfet')
    ) {
      return 'VLSI Design';
    }
    if (
      lower.includes('signal') ||
      lower.includes('dsp') ||
      lower.includes('fourier') ||
      lower.includes('laplace') ||
      lower.includes('z-transform')
    ) {
      return 'Signals & Systems';
    }
    if (
      lower.includes('analog') ||
      lower.includes('op-amp') ||
      lower.includes('opamp') ||
      lower.includes('bjt') ||
      lower.includes('diode') ||
      lower.includes('amplifier')
    ) {
      return 'Analog Circuits';
    }
    if (
      lower.includes('comm') ||
      lower.includes('antenna') ||
      lower.includes('modulation') ||
      lower.includes('wireless') ||
      lower.includes('telecom') ||
      lower.includes('radar')
    ) {
      return 'Communication Systems';
    }
    if (
      lower.includes('control') ||
      lower.includes('bode') ||
      lower.includes('nyquist') ||
      lower.includes('root locus') ||
      lower.includes('transfer function')
    ) {
      return 'Control Systems';
    }
    if (
      lower.includes('electromagnetic') ||
      lower.includes('emft') ||
      lower.includes('maxwell') ||
      lower.includes('waveguide') ||
      lower.includes('transmission line')
    ) {
      return 'Electromagnetic Fields';
    }
    if (
      lower.includes('embedded') ||
      lower.includes('iot') ||
      lower.includes('arduino') ||
      lower.includes('raspberry') ||
      lower.includes('sensor') ||
      lower.includes('interfacing')
    ) {
      return 'Embedded Systems';
    }
    if (
      lower.includes('basic electrical') ||
      lower.includes('bee') ||
      lower.includes('kvl') ||
      lower.includes('kcl') ||
      lower.includes('transformer') ||
      lower.includes('electrical')
    ) {
      return 'Basic Electrical Engineering';
    }
    if (
      lower.includes('digital') ||
      lower.includes('logic') ||
      lower.includes('boolean') ||
      lower.includes('k-map') ||
      lower.includes('flip flop') ||
      lower.includes('counter')
    ) {
      return 'Digital Electronics';
    }

    return str.length > 0 ? str : 'Digital Electronics';
  }, [subjects]);

  // ── ROW PARSER HELPER ──
  const parseQuestionRow = useCallback((row: any, rowIndex: number, targetRoundId: string) => {
    const rawSub =
      row['Subject Name'] ||
      row['Subject'] ||
      row['Department Subject'] ||
      row['Subject / Topic'] ||
      row['Category'] ||
      row['Course'] ||
      row['Topic'] ||
      formSubjectName;

    const matchedSubject = matchSubjectName(rawSub);
    const qType = (row['Question Type'] || row['Type'] || 'mcq').toLowerCase();
    const qText = row['Questions'] || row['Question Text'] || row['Question'] || row['QuestionDescription'] || '';

    const optA = String(row['option 1'] || row['Option A'] || row['option A'] || row['Option 1'] || row['A'] || '');
    const optB = String(row['option 2'] || row['Option B'] || row['option B'] || row['Option 2'] || row['B'] || '');
    const optC = String(row['option 3'] || row['Option C'] || row['option C'] || row['Option 3'] || row['C'] || '');
    const optD = String(row['option 4'] || row['Option D'] || row['option D'] || row['Option 4'] || row['D'] || '');

    const correctVal =
      row['Correct Option (1-4)'] !== undefined
        ? row['Correct Option (1-4)']
        : row['Correct Answer'] !== undefined
        ? row['Correct Answer']
        : row['correct_answer'] !== undefined
        ? row['correct_answer']
        : row['Answer'];

    let correctIndex = 0;
    if (typeof correctVal === 'number') {
      correctIndex = correctVal >= 1 && correctVal <= 4 ? correctVal - 1 : correctVal;
    } else if (typeof correctVal === 'string') {
      const parsedNum = parseInt(correctVal.trim(), 10);
      if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 4) {
        correctIndex = parsedNum - 1;
      } else {
        const letter = correctVal.trim().toUpperCase();
        if (letter === 'A' || letter === 'OPTION A' || letter === 'OPTION 1') correctIndex = 0;
        else if (letter === 'B' || letter === 'OPTION B' || letter === 'OPTION 2') correctIndex = 1;
        else if (letter === 'C' || letter === 'OPTION C' || letter === 'OPTION 3') correctIndex = 2;
        else if (letter === 'D' || letter === 'OPTION D' || letter === 'OPTION 4') correctIndex = 3;
      }
    }

    const marks = Number(row['Marks'] || row['Mark'] || row['Points']) || 2;
    const negMarks = Number(row['Negative Marks'] || row['Negative Mark'] || row['Negative']) || 0.5;
    const difficulty = row['Difficulty'] || 'medium';
    const category = row['Category'] || matchedSubject;
    const explanation = row['Explanation'] || row['Solution'] || '';

    let rawImageUrl =
      row['Image Link / Drive URL'] ||
      row['Image Link'] ||
      row['Drive Link'] ||
      row['image_url'] ||
      row['Figure'] ||
      row['Image'] ||
      null;
    let imageUrl: string | null = null;
    if (rawImageUrl && String(rawImageUrl).trim() !== '' && String(rawImageUrl).trim() !== 'null') {
      const formatted = formatImageUrl(String(rawImageUrl).trim());
      if (formatted && formatted.trim()) {
        imageUrl = formatted;
      }
    }

    const optionsArray = [optA, optB, optC, optD].filter(Boolean);

    return {
      round_id: targetRoundId,
      subject_name: matchedSubject,
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
      order_index: rowIndex,
    };
  }, [formSubjectName, matchSubjectName]);

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
        'Subject Name': 'VLSI Design',
        'Questions': 'In CMOS inverter, the ratio of (W/L)p to (W/L)n is chosen around 2 to 3 primarily to equalize:',
        'Question Type': 'mcq',
        'Image Link / Drive URL': '',
        'Option A': 'Power dissipation',
        'Option B': 'Rise and fall propagation delays',
        'Option C': 'Threshold voltages',
        'Option D': 'Leakage currents',
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
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master_Question_Template');
    XLSX.writeFile(workbook, 'ECE_Master_Question_Template.xlsx');
    toast.success('Master Question Template Downloaded! 📊');
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

  // ── 2. QUICK BULK EXCEL UPLOAD (STANDARD) ──
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

      const targetRoundId = formRoundId || (rounds.length > 0 ? rounds[0].id : 'bank');
      const formattedList = rawJson.map((row, idx) => parseQuestionRow(row, idx + 1, targetRoundId));

      const res = await fetch('/api/admin/questions/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questions: formattedList,
          round_id: targetRoundId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upload questions');

      toast.success(`Bulk Upload Complete! ${json.inserted_count} questions imported successfully! 🚀`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error processing Excel file');
    } finally {
      setUploadingExcel(false);
      e.target.value = '';
    }
  };

  // ── 3. MASTER BULK ANALYZER & PREVIEW (FOR 850 - 1600+ QUESTIONS) ──
  const handleMasterFileSelect = async (file: File) => {
    setMasterFile(file);
    setIsAnalyzing(true);
    setMasterParsedData(null);

    try {
      const dataBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(dataBuffer, { type: 'array' });

      // Aggregate all rows across all sheets or primary sheet
      let combinedRows: any[] = [];
      workbook.SheetNames.forEach((name) => {
        const sheet = workbook.Sheets[name];
        const sheetJson: any[] = XLSX.utils.sheet_to_json(sheet);
        if (sheetJson && sheetJson.length > 0) {
          combinedRows = combinedRows.concat(sheetJson);
        }
      });

      if (combinedRows.length === 0) {
        toast.error('The uploaded Excel spreadsheet contains no question rows.');
        setIsAnalyzing(false);
        return;
      }

      // Group questions by matched subject
      const subjectGroups: Record<string, any[]> = {};
      const parsedQuestions: any[] = [];

      combinedRows.forEach((row, idx) => {
        const parsed = parseQuestionRow(row, idx + 1, 'bank');
        if (parsed.question_text && parsed.question_text.trim()) {
          parsedQuestions.push(parsed);
          const sub = parsed.subject_name || 'Digital Electronics';
          if (!subjectGroups[sub]) subjectGroups[sub] = [];
          subjectGroups[sub].push(parsed);
        }
      });

      const detectedSubs = Object.keys(subjectGroups);

      setMasterParsedData({
        totalRows: parsedQuestions.length,
        subjectGroups,
        detectedSubjects: detectedSubs,
        sampleQuestions: parsedQuestions.slice(0, 5),
      });

      toast.success(
        `⚡ Analyzed ${parsedQuestions.length} questions across ${detectedSubs.length} department subjects!`
      );
    } catch (err: any) {
      toast.error(`Error analyzing spreadsheet: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── 4. EXECUTE MASTER BULK UPLOAD (CHUNKS OF 100 QS WITH REAL-TIME PROGRESS) ──
  const executeMasterBulkUpload = async () => {
    if (!masterParsedData || masterParsedData.totalRows === 0) {
      toast.error('No parsed questions to upload');
      return;
    }

    setMasterUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || 'admin';

    try {
      // Build final list based on selected mode
      let questionsToUpload: any[] = [];

      if (masterUploadMode === 'auto_fill_100') {
        // Take up to 100 questions per identified subject
        Object.entries(masterParsedData.subjectGroups).forEach(([subName, list]) => {
          const quota = list.slice(0, 100);
          questionsToUpload.push(...quota);
        });
      } else {
        // Full Import: all questions
        Object.values(masterParsedData.subjectGroups).forEach((list) => {
          questionsToUpload.push(...list);
        });
      }

      const totalToUpload = questionsToUpload.length;
      const CHUNK_SIZE = 100;
      const totalChunks = Math.ceil(totalToUpload / CHUNK_SIZE);
      let totalInserted = 0;

      for (let c = 0; c < totalChunks; c++) {
        const chunk = questionsToUpload.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
        const currentSub = chunk[0]?.subject_name || 'Multiple Subjects';

        setMasterProgress({
          currentChunk: c + 1,
          totalChunks,
          uploadedCount: totalInserted,
          totalToUpload,
          percentage: Math.round((totalInserted / totalToUpload) * 100),
          currentSubject: currentSub,
        });

        const res = await fetch('/api/admin/questions/bulk-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questions: chunk,
            round_id: masterTargetRound,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || `Batch ${c + 1} failed to upload`);
        }

        totalInserted += chunk.length;
      }

      setMasterProgress({
        currentChunk: totalChunks,
        totalChunks,
        uploadedCount: totalInserted,
        totalToUpload,
        percentage: 100,
        currentSubject: 'Complete',
      });

      toast.success(
        `🎉 Master Import Complete! Successfully uploaded ${totalInserted} questions into department banks! 🚀`
      );

      setTimeout(() => {
        setShowMasterModal(false);
        setMasterFile(null);
        setMasterParsedData(null);
        setMasterProgress(null);
        fetchData();
      }, 1200);
    } catch (err: any) {
      toast.error(err.message || 'Error executing master upload');
    } finally {
      setMasterUploading(false);
    }
  };

  // ── 5. SAVE / ADD SINGLE QUESTION ──
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

      const targetRoundId = formRoundId || (rounds.length > 0 ? rounds[0].id : 'default');

      const payload = {
        round_id: targetRoundId,
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
        const res = await fetch(`/api/admin/rounds/${targetRoundId}/questions`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ questionId: editingQ.id, ...payload }),
        });

        if (!res.ok) throw new Error('Failed to update question');
        toast.success('Question updated successfully! ✏️');
      } else {
        const res = await fetch(`/api/admin/rounds/${targetRoundId}/questions`, {
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

  // ── 6. DELETE QUESTION ──
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

  const handleGenerateAutoRound = async (e: React.FormEvent) => {
    e.preventDefault();
    setAutoSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      const res = await fetch('/api/admin/rounds/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: autoTitle,
          duration_minutes: autoDuration,
          total_target_questions: 50,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to auto-generate test');

      toast.success(
        `🎉 50-Question Automated Test Created! Combined across ${json.active_subjects_count} subjects! 🚀`
      );
      setShowAutoModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error generating automated test');
    } finally {
      setAutoSubmitting(false);
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
    setFormCorrectIndex(
      typeof q.correct_answer === 'object' ? q.correct_answer?.value ?? 0 : Number(q.correct_answer) || 0
    );
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
    const matchSubject =
      subjectFilter === 'all' || q.subject_name === subjectFilter || q.category === subjectFilter;
    const matchType = typeFilter === 'all' || q.question_type === typeFilter;
    const matchSearch =
      q.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.subject_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRound && matchSubject && matchType && matchSearch;
  });

  const cleanShadow = '0 4px 20px rgba(0,0,0,0.8)';

  return (
    <div
      className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto relative z-10"
      style={{ background: '#000000', minHeight: '100vh', color: '#FFFFFF' }}
    >
      {/* ═══ HEADER ═══ */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] w-fit mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
              <span className="font-[family-name:var(--font-heading)] text-[10px] font-semibold tracking-widest text-[#00E5FF] uppercase">
                QUESTION CONTROL CENTER ✦
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#FFFFFF]">
              Question Bank & Master Excel Manager
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] font-light mt-0.5">
              {questions.length} total questions configured across department subject banks
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-xs">
              <span className="px-3 py-1 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] font-bold">
                📊 TOTAL BANK: {questions.length} Questions Uploaded
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                ⚡ High-Capacity 850–1600+ Qs Auto-Distributor Ready
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                🎲 Equal Ratio 50-Q Shuffled Exam Generator Active
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 🌟 NEW MASTER BULK UPLOAD BUTTON (850 - 1600+ QS) */}
            <button
              onClick={() => setShowMasterModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-white text-xs font-[family-name:var(--font-heading)] font-extrabold shadow-[0_0_25px_rgba(139,92,246,0.5)] border border-white/30 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
            >
              <Zap size={15} className="text-yellow-300 animate-bounce" />
              <span>Bulk Upload (850–1600+ Qs)</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[9px] font-mono border border-white/20">
                AUTO-FILL
              </span>
            </button>

            <GalaxyButton
              variant="cyan"
              size="sm"
              onClick={() => setShowAutoModal(true)}
              className="!border-[#00E5FF] !text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.3)]"
            >
              🚀 Auto-Generate 50-Q Test
            </GalaxyButton>

            <GalaxyButton variant="secondary" size="sm" onClick={handleDownloadExcelTemplate}>
              <Download size={14} /> Excel Template (.xlsx)
            </GalaxyButton>

            <button
              onClick={handleDownloadCSVTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)] text-white text-xs font-[family-name:var(--font-heading)] font-semibold transition-all cursor-pointer"
            >
              <FileSpreadsheet size={14} className="text-[#00E5FF]" />
              <span>CSV Template</span>
            </button>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-[family-name:var(--font-heading)] font-bold transition-all shadow-md">
              <UploadCloud size={14} />
              <span>{uploadingExcel ? 'Uploading...' : 'Quick Excel'}</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingExcel}
              />
            </label>

            <GalaxyButton variant="primary" size="sm" onClick={openCreateModal}>
              <Plus size={14} /> Create Question
            </GalaxyButton>
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />
      </FadeIn>

      {/* ═══ 10-SUBJECT QUESTION BANK GRID ═══ */}
      <FadeIn delay={0.03}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-sm tracking-wider text-white uppercase flex items-center gap-2">
              <span className="text-[#00E5FF]">📚</span> Department Subjects Bank (10 Subjects · Target 100 Qs / Subject)
            </h2>
            <span className="text-xs text-[#94A3B8] font-mono">
              Active: {subjects.length} Subjects · Total Qs: {questions.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {subjects.slice(0, 10).map((sub, idx) => {
              const subCount = questions.filter(
                (q: any) => q.subject_name === sub.name || q.category === sub.name
              ).length;
              const percent = Math.min(100, Math.round((subCount / 100) * 100));
              const isSelected = subjectFilter === sub.name;

              return (
                <div
                  key={sub.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 relative overflow-hidden group cursor-pointer ${
                    isSelected
                      ? 'bg-[rgba(0,229,255,0.15)] border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.2)]'
                      : 'bg-[rgba(255,255,255,0.03)] border-white/10 hover:border-white/25 hover:bg-[rgba(255,255,255,0.06)]'
                  }`}
                  onClick={() => setSubjectFilter(isSelected ? 'all' : sub.name)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#00E5FF] font-bold px-2 py-0.5 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/20">
                        {sub.code || `SUB #${idx + 1}`}
                      </span>
                      <h3
                        className="font-[family-name:var(--font-display)] font-bold text-xs text-white mt-1.5 line-clamp-1"
                        title={sub.name}
                      >
                        {sub.name}
                      </h3>
                    </div>
                  </div>

                  {/* Progress Meter (Target 100 Qs) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-[#94A3B8]">Target Bank</span>
                      <span className={`font-bold ${subCount >= 100 ? 'text-emerald-400' : 'text-white'}`}>
                        {subCount} / 100 Qs {subCount >= 100 && '✅'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          subCount >= 100
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-[#0066FF] to-[#00E5FF]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <label
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormSubjectName(sub.name);
                      }}
                      className="flex-1 py-1 px-2 rounded-lg bg-[#0066FF]/20 hover:bg-[#0066FF]/40 border border-[#0066FF]/40 text-white text-[10px] font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <UploadCloud size={10} /> Upload
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={(e) => {
                          setFormSubjectName(sub.name);
                          handleFileUpload(e);
                        }}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSubjectFilter(sub.name);
                      }}
                      className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white text-[10px] font-medium transition-all"
                    >
                      Filter
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>

      {/* ═══ FILTER & SEARCH TOOLBAR ═══ */}
      <FadeIn delay={0.06}>
        <GlassCard
          variant="solid"
          radius={20}
          hover={false}
          noHover
          className="!p-4 border border-[rgba(255,255,255,0.12)] flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ background: '#000000', boxShadow: cleanShadow }}
        >
          {/* Round Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
            <span className="text-xs text-[#94A3B8] font-[family-name:var(--font-heading)] uppercase mr-1">
              Round:
            </span>
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
            <span className="text-xs text-[#94A3B8] font-[family-name:var(--font-heading)] uppercase mr-1">
              Subject:
            </span>
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
          <GlassCard
            variant="solid"
            radius={24}
            hover={false}
            noHover
            className="!p-16 text-center border border-[rgba(255,255,255,0.12)]"
            style={{ background: '#000000' }}
          >
            <HelpCircle size={48} className="mx-auto text-[#64748B] opacity-40 mb-3" />
            <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-[#FFFFFF]">
              No questions found
            </h3>
            <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] mt-1">
              Upload your 850–1600+ questions master sheet to automatically populate all subject banks!
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-5">
              <button
                onClick={() => setShowMasterModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-xs font-bold shadow-lg cursor-pointer"
              >
                <Zap size={14} className="text-yellow-300" />
                <span>Upload Master Bulk Sheet (850–1600+ Qs)</span>
              </button>
              <GalaxyButton variant="secondary" size="sm" onClick={handleDownloadExcelTemplate}>
                <Download size={14} /> Download Format Template
              </GalaxyButton>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q: any, index: number) => {
              const optList = q.options || [];
              const correctIdx =
                typeof q.correct_answer === 'object' ? q.correct_answer?.value : Number(q.correct_answer);
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
                          <span className="text-[10px] text-[#94A3B8] font-mono block mb-1">
                            ⚡ Circuit Schematic / Figure:
                          </span>
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
                                    ? 'bg-[rgba(18,255,128,0.1)] border-[rgba(18,255,128,0.4)] text-[#12FF80]'
                                    : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[#94A3B8]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-[family-name:var(--font-mono)] font-bold text-xs opacity-60">
                                    {String.fromCharCode(65 + i)}.
                                  </span>
                                  <span className="truncate">{opt}</span>
                                </div>
                                {isCorrect && (
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#12FF80]/20 text-[#12FF80] flex-shrink-0">
                                    ✓ Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-start">
                      <button
                        onClick={() => openEditModal(q)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all cursor-pointer"
                        title="Edit Question"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all cursor-pointer"
                        title="Delete Question"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </FadeIn>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ═══ 🌟 MASTER BULK UPLOAD MODAL (850 - 1600+ QUESTIONS) ═══════════ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showMasterModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/95 backdrop-blur-xl p-3 sm:p-6 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => !masterUploading && setShowMasterModal(false)} />

          <div className="relative z-10 w-full max-w-4xl bg-[#090A10] border border-[#8B5CF6]/50 rounded-3xl shadow-[0_0_60px_rgba(139,92,246,0.25)] overflow-hidden my-auto p-6 md:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#EC4899] text-white shadow-lg">
                  <Zap size={22} className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] font-extrabold text-xl text-white flex items-center gap-2">
                    Master Question Bank Bulk Uploader
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-normal">
                      850–1600+ Qs Optimized
                    </span>
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Upload your master spreadsheet. The system will auto-detect subjects from columns and evenly distribute questions across all department banks.
                  </p>
                </div>
              </div>

              {!masterUploading && (
                <button
                  onClick={() => setShowMasterModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Step 1: File Drop Zone */}
            {!masterParsedData && (
              <div className="space-y-4">
                <label
                  className={`p-8 md:p-12 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden group ${
                    isAnalyzing
                      ? 'border-[#00E5FF] bg-[#00E5FF]/5'
                      : 'border-white/20 hover:border-purple-400 bg-white/[0.02] hover:bg-purple-900/10'
                  }`}
                >
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    disabled={isAnalyzing}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMasterFileSelect(file);
                    }}
                  />

                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366F1]/20 to-[#A855F7]/30 border border-purple-400/30 flex items-center justify-center text-purple-300 mb-4 group-hover:scale-110 transition-transform">
                    {isAnalyzing ? (
                      <RefreshCw size={28} className="animate-spin text-[#00E5FF]" />
                    ) : (
                      <UploadCloud size={28} />
                    )}
                  </div>

                  <h4 className="font-[family-name:var(--font-display)] font-bold text-base text-white">
                    {isAnalyzing
                      ? 'Analyzing Master Spreadsheet & Subject Mapping...'
                      : 'Drop your 850–1600+ Questions Excel or CSV File Here'}
                  </h4>
                  <p className="text-xs text-[#94A3B8] max-w-md mt-1">
                    Supports <span className="text-white font-mono">.xlsx</span>, <span className="text-white font-mono">.xls</span>, and <span className="text-white font-mono">.csv</span> files.
                    Detects subject columns (<span className="text-[#00E5FF]">Subject Name</span>, <span className="text-[#00E5FF]">Subject</span>, <span className="text-[#00E5FF]">Category</span>, etc.) automatically.
                  </p>

                  <div className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#A855F7] font-mono font-semibold flex items-center gap-2">
                    <Sparkles size={13} /> High-speed batch streaming engine activated
                  </div>
                </label>

                {/* Templates Helper */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs">
                  <div className="text-[#94A3B8]">
                    Need the formatted master Excel template with all 10 ECE subjects pre-configured?
                  </div>
                  <button
                    onClick={handleDownloadExcelTemplate}
                    className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={13} /> Download Master Template (.xlsx)
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Analysis Results & Auto-Distribution Config */}
            {masterParsedData && !masterUploading && (
              <div className="space-y-6">
                {/* Summary Metrics Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#6366F1]/20 via-[#8B5CF6]/20 to-[#EC4899]/20 border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-200 font-bold font-mono">
                      {masterParsedData.detectedSubjects.length}
                    </div>
                    <div>
                      <div className="text-xs text-purple-300 font-mono font-bold uppercase tracking-wider">
                        Spreadsheet Analysis Complete
                      </div>
                      <div className="text-base font-extrabold text-white">
                        {masterParsedData.totalRows} Total Questions Found in {masterFile?.name}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMasterFile(null);
                      setMasterParsedData(null);
                    }}
                    className="text-xs text-[#94A3B8] hover:text-white underline cursor-pointer"
                  >
                    Upload different file
                  </button>
                </div>

                {/* Mode Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>⚙️ Choose Import & Distribution Mode:</span>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Option 1: Auto-Fill 100 Qs */}
                    <div
                      onClick={() => setMasterUploadMode('auto_fill_100')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        masterUploadMode === 'auto_fill_100'
                          ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        masterUploadMode === 'auto_fill_100' ? 'border-[#8B5CF6] bg-[#8B5CF6] text-white' : 'border-white/30'
                      }`}>
                        {masterUploadMode === 'auto_fill_100' && <Check size={12} />}
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>Auto-Fill Subject Banks (Up to 100 Qs / Subject)</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                            RECOMMENDED
                          </span>
                        </div>
                        <p className="text-[11px] text-[#94A3B8]">
                          Takes up to 100 questions from each detected subject to balance all 10 department banks perfectly.
                        </p>
                      </div>
                    </div>

                    {/* Option 2: Full Bank Import */}
                    <div
                      onClick={() => setMasterUploadMode('full_import')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        masterUploadMode === 'full_import'
                          ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        masterUploadMode === 'full_import' ? 'border-[#8B5CF6] bg-[#8B5CF6] text-white' : 'border-white/30'
                      }`}>
                        {masterUploadMode === 'full_import' && <Check size={12} />}
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-white">
                          Full Bulk Import (All {masterParsedData.totalRows} Questions)
                        </div>
                        <p className="text-[11px] text-[#94A3B8]">
                          Uploads every single row without capping, ideal for massive archives (850–1,600+ questions).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Target Destination Round Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    🎯 Target Destination:
                  </label>
                  <select
                    value={masterTargetRound}
                    onChange={(e) => setMasterTargetRound(e.target.value)}
                    className="w-full bg-[#000000] text-white border border-white/20 text-xs px-3.5 py-2.5 rounded-xl font-[family-name:var(--font-heading)] outline-none"
                  >
                    <option value="bank">Central Master Question Bank (Available for Auto-Test Generator)</option>
                    {rounds.map((r) => (
                      <option key={r.id} value={r.id}>
                        Round #{r.round_number}: {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Distribution Breakdown Grid */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white uppercase tracking-wider">
                      📊 Auto-Detected Subjects ({masterParsedData.detectedSubjects.length}):
                    </span>
                    <span className="text-[#94A3B8] font-mono text-[11px]">
                      {masterUploadMode === 'auto_fill_100'
                        ? 'Capped at 100 Qs / Subject'
                        : 'Full counts importing'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {Object.entries(masterParsedData.subjectGroups).map(([subName, list]) => {
                      const count = list.length;
                      const willUpload = masterUploadMode === 'auto_fill_100' ? Math.min(100, count) : count;
                      const percent = Math.min(100, Math.round((willUpload / 100) * 100));

                      return (
                        <div
                          key={subName}
                          className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white truncate max-w-[170px]" title={subName}>
                              {subName}
                            </span>
                            <span className="font-mono text-[#00E5FF] font-bold">
                              {willUpload} Qs
                            </span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#6366F1] to-[#00E5FF] rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[10px] font-mono text-[#94A3B8]">
                            <span>Found in file: {count}</span>
                            <span>{count >= 100 ? '100% capacity' : `${percent}% bank fill`}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <GalaxyButton
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => setShowMasterModal(false)}
                  >
                    Cancel
                  </GalaxyButton>

                  <button
                    onClick={executeMasterBulkUpload}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-white text-xs font-bold shadow-[0_0_30px_rgba(139,92,246,0.6)] cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                  >
                    <Zap size={14} className="text-yellow-300" />
                    <span>
                      Import{' '}
                      {masterUploadMode === 'auto_fill_100'
                        ? Object.values(masterParsedData.subjectGroups).reduce(
                            (acc, list) => acc + Math.min(100, list.length),
                            0
                          )
                        : masterParsedData.totalRows}{' '}
                      Questions Now
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Real-Time Animated Batch Upload Progress */}
            {masterUploading && masterProgress && (
              <div className="py-8 space-y-6 text-center">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#00E5FF] border-r-[#8B5CF6] animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center font-mono font-extrabold text-xl text-white">
                    {masterProgress.percentage}%
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-[family-name:var(--font-display)] font-bold text-lg text-white">
                    Uploading Batch {masterProgress.currentChunk} of {masterProgress.totalChunks}...
                  </h4>
                  <p className="text-xs text-[#94A3B8] font-mono">
                    {masterProgress.uploadedCount} / {masterProgress.totalToUpload} questions saved to Supabase · Current: <span className="text-[#00E5FF]">{masterProgress.currentSubject}</span>
                  </p>
                </div>

                <div className="max-w-md mx-auto w-full h-3 rounded-full bg-white/10 overflow-hidden border border-white/10 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#00E5FF] rounded-full transition-all duration-300"
                    style={{ width: `${masterProgress.percentage}%` }}
                  />
                </div>

                <p className="text-[11px] text-[#64748B] font-mono">
                  Streaming in high-speed batches of 100 to ensure zero server timeouts. Please keep this modal open.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CREATE / EDIT SINGLE QUESTION MODAL ═══ */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/90 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowAddModal(false)} />

          <div className="relative z-10 w-full max-w-3xl bg-[#08080C] border border-[rgba(255,255,255,0.2)] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden my-auto p-6 md:p-8 space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-shrink-0">
              <h3 className="font-[family-name:var(--font-display)] font-extrabold text-xl text-white flex items-center gap-2">
                <span className="text-[#00E5FF]">{editingQ ? '✏️' : '➕'}</span>
                {editingQ ? 'Edit Question' : 'Create New Question'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Target Round & Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs text-[#E2E8F0] font-bold">Round Destination</label>
                  <select
                    value={formRoundId}
                    onChange={(e) => setFormRoundId(e.target.value)}
                    className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs"
                  >
                    {rounds.map((r) => (
                      <option key={r.id} value={r.id}>
                        Round #{r.round_number}: {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label text-xs text-[#E2E8F0] font-bold">Department Subject</label>
                  <select
                    value={formSubjectName}
                    onChange={(e) => setFormSubjectName(e.target.value)}
                    className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs font-semibold text-[#00E5FF]"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name} {sub.code ? `(${sub.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="form-label text-xs text-[#E2E8F0] font-bold">Question Description / Problem</label>
                <textarea
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Enter detailed question statement..."
                  className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs h-24"
                  required
                />
              </div>

              {/* Marks & Neg Marks */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="form-label text-xs text-[#E2E8F0] font-bold">Question Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs"
                  >
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="true_false">True / False</option>
                    <option value="fill_blank">Fill in the Blank</option>
                  </select>
                </div>

                <div>
                  <label className="form-label text-xs text-[#E2E8F0] font-bold">Marks (+)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formMarks}
                    onChange={(e) => setFormMarks(Number(e.target.value))}
                    className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs"
                  />
                </div>

                <div>
                  <label className="form-label text-xs text-[#E2E8F0] font-bold">Negative Marks (-)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formNegativeMarks}
                    onChange={(e) => setFormNegativeMarks(Number(e.target.value))}
                    className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs"
                  />
                </div>
              </div>

              {/* Question Diagram / Image URL */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="form-label text-xs text-white font-bold flex items-center gap-1.5">
                  <span className="text-[#00E5FF]">⚡</span> Image / Circuit Diagram URL (Optional)
                </label>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(formatImageUrl(e.target.value))}
                  placeholder="Paste Google Drive share link (e.g. https://drive.google.com/...) or image URL..."
                  className="form-input bg-[#000000] text-white border border-white/20 text-xs"
                />

                {formImageUrl && (
                  <div className="mt-2 p-2 rounded-xl bg-black border border-[#00E5FF]/40 text-center">
                    <img
                      src={formatImageUrl(formImageUrl)}
                      alt="Preview"
                      className="max-h-36 mx-auto object-contain rounded-lg border border-white/10"
                    />
                  </div>
                )}
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-2">
                <label className="form-label text-xs text-[#E2E8F0] font-bold">
                  Multiple Choice Options (Select Correct Option Radio)
                </label>
                {formOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOpt"
                      checked={formCorrectIndex === idx}
                      onChange={() => setFormCorrectIndex(idx)}
                      className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
                    />
                    <span className="font-[family-name:var(--font-mono)] text-xs text-white w-6 font-bold">
                      {String.fromCharCode(65 + idx)}.
                    </span>
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

              {/* Explanation */}
              <div>
                <label className="form-label text-xs text-[#E2E8F0] font-bold">Explanation / Solution (Optional)</label>
                <input
                  type="text"
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Provide reference explanation..."
                  className="form-input bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 flex-shrink-0">
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

      {/* ═══ AUTO-GENERATE 50-Q TEST MODAL ═══ */}
      {showAutoModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/90 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowAutoModal(false)} />

          <div className="relative z-10 w-full max-w-lg bg-[#08080C] border border-[#00E5FF]/40 rounded-3xl shadow-[0_0_50px_rgba(0,229,255,0.2)] overflow-hidden my-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-[family-name:var(--font-display)] font-extrabold text-lg text-white flex items-center gap-2">
                <span className="text-[#00E5FF]">🚀</span> Automated 50-Q Test Generator
              </h3>
              <button
                onClick={() => setShowAutoModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#94A3B8] font-[family-name:var(--font-body)] leading-relaxed">
              This will automatically scan all subjects in your Question Bank, pull a balanced 50-question paper across all subjects containing questions, and generate a new live competition round!
            </p>

            <form onSubmit={handleGenerateAutoRound} className="space-y-4">
              <div>
                <label className="form-label text-xs text-[#E2E8F0] font-bold">Round / Test Title</label>
                <input
                  type="text"
                  value={autoTitle}
                  onChange={(e) => setAutoTitle(e.target.value)}
                  placeholder="e.g. Weekly Department Assessment #1"
                  className="form-input bg-[#000000] text-white border border-white/20 text-xs"
                  required
                />
              </div>

              <div>
                <label className="form-label text-xs text-[#E2E8F0] font-bold">Test Duration (Minutes)</label>
                <input
                  type="number"
                  value={autoDuration}
                  onChange={(e) => setAutoDuration(Number(e.target.value))}
                  placeholder="30"
                  className="form-input bg-[#000000] text-white border border-white/20 text-xs"
                  required
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 space-y-1 text-xs text-white">
                <div className="font-bold flex items-center gap-1.5 text-[#00E5FF]">
                  <span>⚡ Automatic Subject Balancing:</span>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  Pulls an equal quota of random questions from each active subject (e.g. 5 Qs x 10 subjects = 50 total questions).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <GalaxyButton variant="secondary" size="sm" type="button" onClick={() => setShowAutoModal(false)}>
                  Cancel
                </GalaxyButton>
                <GalaxyButton variant="cyan" size="sm" type="submit" loading={autoSubmitting}>
                  🚀 Generate 50-Q Exam
                </GalaxyButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
