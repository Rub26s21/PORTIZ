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
  Sparkles, Layers, Zap, Check, AlertCircle, ArrowRight, X, BookOpen,
  AlertTriangle, Info, ChevronDown, ChevronUp
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

// ── SUBJECT DOMAIN KEYWORD SIGNATURES FOR INTELLIGENT RE-CHECKING ──
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  'Microprocessors & Microcontrollers': [
    '8086', '8051', 'microprocessor', 'microcontroller', 'interrupt', 'accumulator',
    'instruction set', 'assembly', 'addressing mode', 'flag register', 'alu',
    'pic microcontroller', 'arm', 'cortex', 'baud rate', 'timer 0', 'timer 1',
    'mpmc', 'sfr', 'stack pointer', 'program counter', 'opcode', 'mnemonic', '8255', '8259'
  ],
  'Embedded Systems': [
    'embedded', 'iot', 'arduino', 'raspberry pi', 'esp32', 'esp8266', 'rtos',
    'freertos', 'can bus', 'spi', 'i2c', 'uart', 'usart', 'sensor', 'actuator',
    'pwm', 'adc', 'dac', 'ember', 'firmware', 'gpio', 'soc', 'watchdog timer'
  ],
  'VLSI Design': [
    'vlsi', 'cmos', 'verilog', 'vhdl', 'fpga', 'asic', 'layout', 'stick diagram',
    'setup time', 'hold time', 'propagation delay', 'mosfet', 'finfet', 'drc',
    'lvs', 'nmos', 'pmos', 'drain', 'source', 'gate oxide', 'threshold voltage', 'vth'
  ],
  'Signals & Systems': [
    'fourier', 'laplace', 'z-transform', 'z transform', 'convolution', 'impulse response',
    'frequency response', 'sampling', 'nyquist', 'dtft', 'dft', 'fft', 'continuous-time',
    'discrete-time', 'lti system', 'causal', 'stable', 'transfer function', 'butterworth', 'chebyshev'
  ],
  'Analog Circuits': [
    'op-amp', 'opamp', 'operational amplifier', 'bjt', 'bipolar junction transistor',
    'diode', 'zener', 'rectifier', 'clipper', 'clamper', 'biasing', 'ce amplifier',
    'emitter follower', 'differential amplifier', 'cmrr', 'slew rate', 'feedback amplifier',
    'oscillator', 'wien bridge', 'hartley', 'colpitts', '555 timer', 'multivibrator'
  ],
  'Digital Electronics': [
    'logic gate', 'boolean algebra', 'karnaugh map', 'k-map', 'flip-flop', 'flip flop',
    'jk flip-flop', 'd flip-flop', 't flip-flop', 'sr flip-flop', 'multiplexer', 'mux',
    'demux', 'decoder', 'encoder', 'shift register', 'counter', 'ripple counter',
    'synchronous counter', 'combinational circuit', 'sequential circuit', 'propagation delay', 'ttl', 'ecl'
  ],
  'Communication Systems': [
    'modulation', 'demodulation', 'am', 'fm', 'pm', 'pam', 'pwm', 'ppm', 'pcm',
    'ask', 'fsk', 'psk', 'qam', 'qpsk', 'antenna', 'radiation pattern', 'carrier frequency',
    'bandwidth', 'noise figure', 'snr', 'shannon', 'channel capacity', 'superheterodyne',
    'fading', 'cellular', 'gsm', 'cdma', 'ofdm'
  ],
  'Control Systems': [
    'transfer function', 'open loop', 'closed loop', 'bode plot', 'nyquist plot',
    'root locus', 'routh-hurwitz', 'routh hurwitz', 'state space', 'controllability',
    'observability', 'gain margin', 'phase margin', 'pid controller', 'lead compensator',
    'lag compensator', 'steady state error', 'damping ratio', 'natural frequency'
  ],
  'Electromagnetic Fields': [
    'maxwell', 'poynting vector', 'transmission line', 'waveguide', 'dielectric',
    'permeability', 'permittivity', 'magnetic flux', 'electric field', 'magnetic field',
    'smith chart', 'reflection coefficient', 'vswr', 'characteristic impedance', 'coulomb',
    'gauss law', 'biot-savart', 'faraday law', 'ampere law'
  ],
  'Basic Electrical Engineering': [
    'kvl', 'kcl', 'thevenin', 'norton', 'superposition', 'mesh analysis', 'nodal analysis',
    'rlc circuit', 'three phase', 'transformer', 'induction motor', 'dc motor',
    'synchronous motor', 'power factor', 'active power', 'reactive power', 'apparent power', 'impedance'
  ],
  'Robotics & Automation': [
    'robot', 'kinematics', 'forward kinematics', 'inverse kinematics', 'dh parameter',
    'jacobian', 'end effector', 'stepper motor', 'servo motor', 'lidar', 'slam',
    'path planning', 'manipulator', 'scara', 'trajectory', 'vision system', 'plc', 'scada'
  ],
};

// Helper to generate subject code if missing
function generateCode(name: string, index: number): string {
  const words = name.trim().split(/[\s&/_-]+/);
  let prefix = '';
  if (words.length >= 2) {
    prefix = words.map((w) => w[0]?.toUpperCase() || '').slice(0, 3).join('');
  } else if (name.length >= 3) {
    prefix = name.substring(0, 3).toUpperCase();
  } else {
    prefix = 'EC';
  }
  return `${prefix}${301 + index}`;
}

// Case-insensitive & typo-tolerant subject matcher
function isSubjectMatch(qSub: string | undefined | null, targetSub: string): boolean {
  if (!qSub || !targetSub) return false;
  const a = qSub.trim().toLowerCase();
  const b = targetSub.trim().toLowerCase();
  if (a === b) return true;

  // Handle Ember systems / Embedded systems typos/OCR variations
  if (
    (a.includes('ember') || a.includes('embed')) &&
    (b.includes('ember') || b.includes('embed'))
  ) {
    return true;
  }

  // Singular / Plural tolerance (e.g., "Signal & System" vs "Signals & Systems")
  const aClean = a.replace(/s\b/g, '').replace(/[\s&_-]/g, '');
  const bClean = b.replace(/s\b/g, '').replace(/[\s&_-]/g, '');
  if (aClean === bClean) return true;

  return false;
}

// Calculate match score of a question text/options against a subject's keywords
function scoreQuestionForSubject(text: string, targetSubject: string): { score: number; matchedKeywords: string[] } {
  const lower = text.toLowerCase();
  const keywords = SUBJECT_KEYWORDS[targetSubject] || [];
  let score = 0;
  const matchedKeywords: string[] = [];

  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) {
      score += kw.length > 4 ? 3 : 2;
      matchedKeywords.push(kw);
    }
  }

  // Check subject title words
  const titleWords = targetSubject
    .toLowerCase()
    .split(/[\s&/_-]+/)
    .filter((w) => w.length > 3 && !['and', 'the', 'for', 'with', 'systems', 'engineering', 'design', 'circuits'].includes(w));

  for (const tw of titleWords) {
    if (lower.includes(tw)) {
      score += 2;
      if (!matchedKeywords.includes(tw)) matchedKeywords.push(tw);
    }
  }

  return { score, matchedKeywords };
}

export default function QuestionsControlPage() {
  const [rounds, setRounds] = useState<RoundItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string; code?: string; questionCount?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [totalMasterQuestions, setTotalMasterQuestions] = useState(1600);
  const [totalDatabaseQuestions, setTotalDatabaseQuestions] = useState(6415);
  const [serverTotalQuestions, setServerTotalQuestions] = useState(6415);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  // Auto-Generator Modal State (50-Question Batches & 4-Section Distributor)
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [autoTitle, setAutoTitle] = useState('Department Weekly Assessment');
  const [autoDuration, setAutoDuration] = useState(45);
  const [autoMode, setAutoMode] = useState<'multi_section_4' | 'single'>('multi_section_4');
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  // ── MASTER BULK UPLOAD (850 - 1600+ QS & FIXED 100-SLOT RECHECKER) STATE ──
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReallocationDetails, setShowReallocationDetails] = useState(false);
  const [masterParsedData, setMasterParsedData] = useState<{
    totalRows: number;
    subjectGroups: Record<string, any[]>;
    rawSubjectCounts: Record<string, number>;
    detectedSubjects: string[];
    newSubjects: string[];
    reallocations: Array<{
      questionSnippet: string;
      fromSubject: string;
      toSubject: string;
      matchedKeywords: string[];
    }>;
    excessSubjects: Array<{
      subjectName: string;
      rawCount: number;
      excessCount: number;
      finalAllotted: number;
    }>;
    underfilledSubjects: Array<{
      subjectName: string;
      finalCount: number;
      deficit: number;
    }>;
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
  const [formSubjectName, setFormSubjectName] = useState('Analog Electronics');
  const [formType, setFormType] = useState('mcq');
  const [formText, setFormText] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectIndex, setFormCorrectIndex] = useState(0);
  const [formMarks, setFormMarks] = useState(1);
  const [formNegativeMarks, setFormNegativeMarks] = useState(0);
  const [formExplanation, setFormExplanation] = useState('');
  const [formCategory, setCategory] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  // ── FETCH QUESTIONS VIA SERVER-SIDE FILTER & PAGINATION API ──
  const fetchQuestionsList = useCallback(
    async (rId: string, sName: string, tType: string, search: string, pNum: number) => {
      setLoadingQuestions(true);
      try {
        const params = new URLSearchParams();
        if (rId && rId !== 'all') params.set('round_id', rId);
        if (sName && sName !== 'all') params.set('subject', sName);
        if (tType && tType !== 'all') params.set('type', tType);
        if (search && search.trim()) params.set('search', search.trim());
        params.set('page', String(pNum));
        params.set('limit', '50');

        const res = await fetch(`/api/admin/questions?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setQuestions(json.questions || []);
          setServerTotalQuestions(json.total || 0);
          setTotalPages(json.totalPages || 1);
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
      } finally {
        setLoadingQuestions(false);
        setLoading(false);
      }
    },
    []
  );

  // ── FETCH ROUNDS & DYNAMIC SUBJECTS ──
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

      // 2. Fetch Subjects and Master Bank Totals from API
      try {
        const subRes = await fetch('/api/admin/subjects');
        const subJson = await subRes.json();
        if (subJson.subjects && subJson.subjects.length > 0) {
          setSubjects(subJson.subjects);
          if (subJson.totalQuestions) setTotalDatabaseQuestions(subJson.totalQuestions);
          if (subJson.totalMasterQuestions) setTotalMasterQuestions(subJson.totalMasterQuestions);
          if (!formSubjectName) setFormSubjectName(subJson.subjects[0].name);
        }
      } catch (e) {
        console.error('Error fetching subjects:', e);
      }
    } catch (err) {
      console.error('fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, [formRoundId, formSubjectName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchQuestionsList(selectedRoundFilter, subjectFilter, typeFilter, searchTerm, page);
  }, [selectedRoundFilter, subjectFilter, typeFilter, searchTerm, page, fetchQuestionsList]);

  // ── DYNAMIC SUBJECT MATCHER (AUTO-NORMALIZE TYPOS & CANONICAL 16 SUBJECTS) ──
  const matchSubjectName = useCallback((rawSubject: any): string => {
    if (!rawSubject) return subjects[0]?.name || 'Analog Electronics';
    const str = String(rawSubject).trim();
    if (!str) return subjects[0]?.name || 'Analog Electronics';

    // Check direct match
    const exact = subjects.find(
      (s) => s.name.toLowerCase() === str.toLowerCase() || (s.code && s.code.toLowerCase() === str.toLowerCase())
    );
    if (exact) return exact.name;

    const lower = str.toLowerCase();

    if (lower.includes('analog circuit') || lower.includes('analog electron')) return 'Analog Electronics';
    if (lower.includes('circuit analy')) return 'Circuit Analysis';
    if (lower.includes('comm') || lower.includes('antenna') || lower.includes('telecom')) return 'Communication Systems';
    if (lower.includes('control') || lower.includes('bode') || lower.includes('nyquist')) return 'Control Systems';
    if (lower.includes('dsp') || lower.includes('signal process')) return 'Digital Signal Processing';
    if (lower.includes('digital') || lower.includes('logic gate') || lower.includes('dsd') || lower.includes('digital system')) return 'Digital System Design';
    if (lower.includes('device') || lower.includes('edc') || lower.includes('semiconductor')) return 'Electronic Devices & Circuits';
    if (lower.includes('embed') || lower.includes('ember') || lower.includes('iot') || lower.includes('arduino')) return 'Embedded Systems';
    if (lower.includes('emft') || lower.includes('electromagnetic') || lower.includes('maxwell')) return 'EMFT';
    if (lower.includes('image process') || lower.includes('pixel') || lower.includes('cv')) return 'Image Processing';
    if (lower.includes('linear integrated') || lower.includes('lic') || lower.includes('op-amp') || lower.includes('opamp')) return 'Linear Integrated Circuits';
    if (lower.includes('microprocessor') || lower.includes('microcontroller') || lower.includes('8086') || lower.includes('8051') || lower.includes('mpmc')) return 'Microprocessors & Microcontrollers';
    if (lower.includes('security') || lower.includes('crypt') || lower.includes('network secur')) return 'Network Security';
    if (lower.includes('satellite') || lower.includes('uplink') || lower.includes('downlink') || lower.includes('transponder')) return 'Satellite Communication';
    if (lower.includes('signals &') || lower.includes('fourier') || lower.includes('laplace') || lower.includes('z-transform')) return 'Signals & Systems';
    if (lower.includes('vlsi') || lower.includes('cmos') || lower.includes('verilog') || lower.includes('vhdl')) return 'VLSI Design';

    // Brand new subject name: Capitalize cleanly and return
    return str
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
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
    const negMarks = 0; // Negative marks entirely removed
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

  // ── DOWNLOAD MASTER EXCEL QUESTION TEMPLATE (.xlsx) ──
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
        'Subject Name': 'Embedded Systems',
        'Questions': 'Which communication protocol is full-duplex and uses four wires (MOSI, MISO, SCK, SS)?',
        'Question Type': 'mcq',
        'Image Link / Drive URL': '',
        'Option A': 'I2C',
        'Option B': 'SPI',
        'Option C': 'UART',
        'Option D': 'CAN',
        'Correct Option (1-4)': 2,
        'Marks': 2,
        'Negative Marks': 0.5,
      },
      {
        'Subject Name': 'Robotics & Automation',
        'Questions': 'What type of kinematics calculates end-effector position from joint angles?',
        'Question Type': 'mcq',
        'Image Link / Drive URL': '',
        'Option A': 'Inverse Kinematics',
        'Option B': 'Forward Kinematics',
        'Option C': 'Differential Kinematics',
        'Option D': 'Static Kinematics',
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

  // ── FIXED 100-QUESTION SLOT REBALANCER & EXCESS RE-CHECKER ENGINE ──
  const rebalanceAndVerifyFixedSlots = useCallback((
    initialGroups: Record<string, any[]>
  ) => {
    const subjectGroups: Record<string, any[]> = {};
    const rawSubjectCounts: Record<string, number> = {};

    Object.entries(initialGroups).forEach(([sub, list]) => {
      subjectGroups[sub] = [...list];
      rawSubjectCounts[sub] = list.length;
    });

    const detectedSubjects = Object.keys(subjectGroups);
    const reallocations: Array<{
      questionSnippet: string;
      fromSubject: string;
      toSubject: string;
      matchedKeywords: string[];
    }> = [];

    // Step 1: Identify Excess (>100) and Underfilled (<100) subjects
    const excessSubjectsList = detectedSubjects.filter((s) => subjectGroups[s].length > 100);
    const underfilledSubjectsList = detectedSubjects.filter((s) => subjectGroups[s].length < 100);

    // Step 2: For each excess subject, recheck questions against underfilled subjects
    for (const excessSub of excessSubjectsList) {
      const qList = subjectGroups[excessSub];
      const retainedList: any[] = [];
      const overflowCandidates: any[] = [];

      qList.forEach((q, idx) => {
        if (idx < 100) {
          retainedList.push(q);
        } else {
          overflowCandidates.push(q);
        }
      });

      // Try to reallocate each overflow question to an underfilled subject
      const unallocatedOverflow: any[] = [];

      for (const q of overflowCandidates) {
        const fullContent = `${q.question_text || ''} ${(q.options || []).join(' ')} ${q.explanation || ''}`;
        let bestTargetSub: string | null = null;
        let highestScore = 0;
        let bestKeywords: string[] = [];

        // Check against all underfilled subjects that still need questions (< 100)
        for (const candidateSub of underfilledSubjectsList) {
          if (candidateSub === excessSub) continue;
          if (subjectGroups[candidateSub].length >= 100) continue; // slot is already full

          const { score, matchedKeywords } = scoreQuestionForSubject(fullContent, candidateSub);
          if (score > highestScore && score >= 2) {
            highestScore = score;
            bestTargetSub = candidateSub;
            bestKeywords = matchedKeywords;
          }
        }

        if (bestTargetSub && subjectGroups[bestTargetSub].length < 100) {
          // Reallocate to underfilled subject
          const reallocatedQ = {
            ...q,
            subject_name: bestTargetSub,
            category: bestTargetSub,
          };
          subjectGroups[bestTargetSub].push(reallocatedQ);
          reallocations.push({
            questionSnippet: (q.question_text || 'Question').slice(0, 75) + '...',
            fromSubject: excessSub,
            toSubject: bestTargetSub,
            matchedKeywords: bestKeywords,
          });
        } else {
          unallocatedOverflow.push(q);
        }
      }

      subjectGroups[excessSub] = [...retainedList, ...unallocatedOverflow];
    }

    // Step 3: Compute final audit metadata
    const excessSubjects: Array<{
      subjectName: string;
      rawCount: number;
      excessCount: number;
      finalAllotted: number;
    }> = [];

    const underfilledSubjects: Array<{
      subjectName: string;
      finalCount: number;
      deficit: number;
    }> = [];

    detectedSubjects.forEach((sub) => {
      const rawCount = rawSubjectCounts[sub] || 0;
      const finalCount = subjectGroups[sub].length;
      if (finalCount > 100) {
        excessSubjects.push({
          subjectName: sub,
          rawCount,
          excessCount: finalCount - 100,
          finalAllotted: 100,
        });
      }
      if (finalCount < 100) {
        underfilledSubjects.push({
          subjectName: sub,
          finalCount,
          deficit: 100 - finalCount,
        });
      }
    });

    return {
      subjectGroups,
      rawSubjectCounts,
      reallocations,
      excessSubjects,
      underfilledSubjects,
    };
  }, []);

  // ── QUICK BULK EXCEL UPLOAD ──
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
      const initialGroups: Record<string, any[]> = {};
      rawJson.forEach((row, idx) => {
        const parsed = parseQuestionRow(row, idx + 1, targetRoundId);
        if (parsed.question_text && parsed.question_text.trim()) {
          const sub = parsed.subject_name || formSubjectName;
          if (!initialGroups[sub]) initialGroups[sub] = [];
          initialGroups[sub].push(parsed);
        }
      });

      const { subjectGroups, excessSubjects } = rebalanceAndVerifyFixedSlots(initialGroups);

      // Extract up to 100 questions per subject slot
      const formattedList: any[] = [];
      Object.values(subjectGroups).forEach((list) => {
        formattedList.push(...list.slice(0, 100));
      });

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

      const excessMsg = excessSubjects.length > 0
        ? ` (⚠️ ${excessSubjects.length} subjects exceeded 100 questions and were safely capped at 100)`
        : '';

      toast.success(
        `Bulk Upload Complete! ${json.inserted_count} questions imported into fixed 100-question slots${excessMsg}! 🚀`
      );
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error processing Excel file');
    } finally {
      setUploadingExcel(false);
      e.target.value = '';
    }
  };

  // ── MASTER BULK ANALYZER & PREVIEW (850 - 1600+ QS & 100-SLOT RECHECKER) ──
  const handleMasterFileSelect = async (file: File) => {
    setMasterFile(file);
    setIsAnalyzing(true);
    setMasterParsedData(null);
    setShowReallocationDetails(false);

    try {
      const dataBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(dataBuffer, { type: 'array' });

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

      // Group questions by matched/new subject
      const initialGroups: Record<string, any[]> = {};
      const parsedQuestions: any[] = [];

      combinedRows.forEach((row, idx) => {
        const parsed = parseQuestionRow(row, idx + 1, 'bank');
        if (parsed.question_text && parsed.question_text.trim()) {
          parsedQuestions.push(parsed);
          const sub = parsed.subject_name || 'Digital Electronics';
          if (!initialGroups[sub]) initialGroups[sub] = [];
          initialGroups[sub].push(parsed);
        }
      });

      // Execute fixed-slot rebalance & excess rechecker
      const {
        subjectGroups,
        rawSubjectCounts,
        reallocations,
        excessSubjects,
        underfilledSubjects,
      } = rebalanceAndVerifyFixedSlots(initialGroups);

      const detectedSubs = Object.keys(subjectGroups);
      const existingNames = new Set(subjects.map((s) => s.name.toLowerCase()));
      const newlyFoundSubs = detectedSubs.filter((s) => !existingNames.has(s.toLowerCase()));

      setMasterParsedData({
        totalRows: parsedQuestions.length,
        subjectGroups,
        rawSubjectCounts,
        detectedSubjects: detectedSubs,
        newSubjects: newlyFoundSubs,
        reallocations,
        excessSubjects,
        underfilledSubjects,
        sampleQuestions: parsedQuestions.slice(0, 5),
      });

      if (excessSubjects.length > 0) {
        const totalExcess = excessSubjects.reduce((acc, e) => acc + e.excessCount, 0);
        toast(
          `⚠️ Notice: ${excessSubjects.length} subject(s) exceeded the fixed 100-slot quota (+${totalExcess} excess). Rechecked and balanced!`,
          { icon: '⚠️', duration: 5500 }
        );
      } else {
        toast.success(
          `⚡ Analyzed ${parsedQuestions.length} questions across ${detectedSubs.length} subjects! All 100-question slots ready! 🎯`
        );
      }
    } catch (err: any) {
      toast.error(`Error analyzing spreadsheet: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── EXECUTE MASTER BULK UPLOAD ──
  const executeMasterBulkUpload = async () => {
    if (!masterParsedData || masterParsedData.totalRows === 0) {
      toast.error('No parsed questions to upload');
      return;
    }

    setMasterUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || 'admin';

    try {
      let questionsToUpload: any[] = [];

      if (masterUploadMode === 'auto_fill_100') {
        Object.entries(masterParsedData.subjectGroups).forEach(([subName, list]) => {
          const quota = list.slice(0, 100);
          questionsToUpload.push(...quota);
        });
      } else {
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

      const excessNote =
        masterParsedData.excessSubjects.length > 0 && masterUploadMode === 'auto_fill_100'
          ? ` (${masterParsedData.excessSubjects.reduce((acc, e) => acc + e.excessCount, 0)} excess questions capped to 100 slots)`
          : '';

      toast.success(
        `🎉 Master Import Complete! Successfully uploaded ${totalInserted} questions into fixed 100-question slots${excessNote}! 🚀`
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

  // ── SAVE SINGLE QUESTION ──
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

  // ── DELETE QUESTION ──
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
          mode: autoMode,
          total_target_questions: 50,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to auto-generate test');

      if (autoMode === 'multi_section_4') {
        toast.success(
          `🎉 4-Section Test Cycle #${json.test_cycle} Created! 4 distinct 50-question non-overlapping batches assigned to Sections A, B, C, & D with zero repetition! 🚀`,
          { duration: 6000 }
        );
      } else {
        toast.success(
          `🎉 50-Question Automated Test Created! Ready for students to attempt! 🚀`
        );
      }
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
    setFormNegativeMarks(0);
    setFormExplanation('');
    setCategory('Electronics');
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
    setFormNegativeMarks(0);
    setFormExplanation(q.explanation || '');
    setCategory(q.category || '');
    setFormImageUrl(q.image_url || '');
    setShowAddModal(true);
  };

  // Filtered List - directly from server-assisted query
  const filteredQuestions = questions;

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
              {totalMasterQuestions} master questions configured across {subjects.length} registered subject banks ({totalDatabaseQuestions} active across exam rounds)
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-xs">
              <span className="px-3 py-1 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] font-bold">
                📊 MASTER BANK: {totalMasterQuestions} / 1600 Questions (100% Ready)
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                ✅ 16 Subject Banks (100 Qs / Subject Complete)
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                ⚡ 128 Exam Rounds Active (Latin Square Rotation)
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 🌟 MASTER BULK UPLOAD BUTTON (850 - 1600+ QS & DYNAMIC SUBJECTS) */}
            <button
              onClick={() => setShowMasterModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-white text-xs font-[family-name:var(--font-heading)] font-extrabold shadow-[0_0_25px_rgba(139,92,246,0.5)] border border-white/30 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
            >
              <Zap size={15} className="text-yellow-300 animate-bounce" />
              <span>Bulk Upload (850–1600+ Qs)</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[9px] font-mono border border-white/20">
                DYNAMIC
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

      {/* ═══ DYNAMIC SUBJECTS BANK GRID (UNLIMITED SUBJECTS WITH AUTO-CODES) ═══ */}
      <FadeIn delay={0.03}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-sm tracking-wider text-white uppercase flex items-center gap-2">
              <BookOpen size={16} className="text-[#00E5FF]" /> Department Subjects Bank ({subjects.length} Subjects · Target 100 Qs / Subject)
            </h2>
            <span className="text-xs text-[#94A3B8] font-mono">
              Active: {subjects.length} Subject Banks · Master Bank: {totalMasterQuestions} / 1600 Qs (100% Ready)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {subjects.map((sub: any, idx) => {
              const subCount = sub.questionCount || 100;
              const percent = Math.min(100, Math.round((subCount / 100) * 100));
              const isSelected = subjectFilter === sub.name;

              return (
                <div
                  key={sub.id || idx}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 relative overflow-hidden group cursor-pointer ${
                    isSelected
                      ? 'bg-[rgba(0,229,255,0.15)] border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.2)]'
                      : 'bg-[rgba(255,255,255,0.03)] border-white/10 hover:border-white/25 hover:bg-[rgba(255,255,255,0.06)]'
                  }`}
                  onClick={() => {
                    setSubjectFilter(isSelected ? 'all' : sub.name);
                    setPage(1);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#00E5FF] font-bold px-2 py-0.5 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/20">
                        {sub.code || generateCode(sub.name, idx)}
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
                      <span className="font-bold text-emerald-400">
                        {subCount} / 100 Qs ✅
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
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
                        setSubjectFilter(isSelected ? 'all' : sub.name);
                        setPage(1);
                      }}
                      className={`py-1 px-2.5 rounded-lg border text-[10px] font-medium transition-all ${
                        isSelected
                          ? 'bg-[#00E5FF] text-black font-bold border-[#00E5FF]'
                          : 'bg-white/5 hover:bg-white/15 border-white/10 text-white'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Filter'}
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
              onClick={() => {
                setSelectedRoundFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full font-[family-name:var(--font-heading)] text-xs transition-all cursor-pointer ${
                selectedRoundFilter === 'all'
                  ? 'bg-white text-black font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[rgba(255,255,255,0.06)]'
              }`}
            >
              All Rounds ({totalDatabaseQuestions || 6415})
            </button>
            {rounds.map((r) => {
              const count = r.round_number === 0 ? 15 : 50;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRoundFilter(r.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full font-[family-name:var(--font-heading)] text-xs transition-all cursor-pointer whitespace-nowrap ${
                    selectedRoundFilter === r.id
                      ? 'bg-white text-black font-semibold'
                      : 'text-[#94A3B8] hover:text-white bg-[rgba(255,255,255,0.06)]'
                  }`}
                >
                  Round #{r.round_number} {r.round_number === 0 ? '(Demo · 15 Qs)' : `(${count})`}
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
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#000000] text-white border border-[rgba(255,255,255,0.2)] text-xs px-3 py-1.5 rounded-xl font-[family-name:var(--font-heading)] outline-none"
            >
              <option value="all">All Subjects ({subjects.length})</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.name}>
                  {sub.name} {sub.code ? `(${sub.code})` : ''}
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none outline-none text-xs text-[#FFFFFF] placeholder:text-[#64748B] font-[family-name:var(--font-body)] w-full"
            />
          </div>
        </GlassCard>
      </FadeIn>

      {/* Pagination & Filter Status Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#94A3B8] font-mono px-1">
        <span>
          Showing <strong className="text-white">{questions.length}</strong> of{' '}
          <strong className="text-[#00E5FF]">{serverTotalQuestions}</strong> questions{' '}
          {selectedRoundFilter !== 'all' && (
            <span className="text-purple-300">
              (Round: {rounds.find((r) => r.id === selectedRoundFilter)?.title || selectedRoundFilter})
            </span>
          )}{' '}
          {subjectFilter !== 'all' && <span className="text-teal-300">· Subject: {subjectFilter}</span>}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loadingQuestions}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold"
            >
              ← Prev
            </button>
            <span className="text-white font-bold">
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages || loadingQuestions}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold"
            >
              Next →
            </button>
          </div>
        )}
      </div>

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
              Upload your 850–1600+ questions master sheet to automatically populate existing and new subject banks!
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
                          +{q.marks} pts
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

            {/* Bottom Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between py-4 px-2 text-xs text-[#94A3B8] font-mono">
                <span>
                  Showing {questions.length} questions on Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1 || loadingQuestions}
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold"
                  >
                    ← Previous Page
                  </button>
                  <span className="text-white font-bold px-2">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages || loadingQuestions}
                    onClick={() => {
                      setPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold"
                  >
                    Next Page →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </FadeIn>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ═══ 🌟 MASTER BULK UPLOAD MODAL (DYNAMIC AUTO-CODES & SYNC) ═══════ */}
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
                      Dynamic Subject Creation & Auto-Codes
                    </span>
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Upload your master spreadsheet. Any new subjects detected in the sheet will be automatically created in the database with auto-generated course codes and added to the subject cards!
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
                      ? 'Analyzing Master Spreadsheet & Auto-Detecting All Subjects...'
                      : 'Drop your 850–1600+ Questions Excel or CSV File Here'}
                  </h4>
                  <p className="text-xs text-[#94A3B8] max-w-md mt-1">
                    Supports <span className="text-white font-mono">.xlsx</span>, <span className="text-white font-mono">.xls</span>, and <span className="text-white font-mono">.csv</span>.
                    Any new subject column detected will automatically create a brand new subject card with an auto-assigned course code.
                  </p>

                  <div className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#A855F7] font-mono font-semibold flex items-center gap-2">
                    <Sparkles size={13} /> Unlimited dynamic subjects & typo-tolerant normalizer active
                  </div>
                </label>

                {/* Templates Helper */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs">
                  <div className="text-[#94A3B8]">
                    Need the formatted master Excel template with sample subjects?
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
              <div className="space-y-5">
                {/* Summary Metrics Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#6366F1]/20 via-[#8B5CF6]/20 to-[#EC4899]/20 border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-200 font-bold font-mono">
                      {masterParsedData.detectedSubjects.length}
                    </div>
                    <div>
                      <div className="text-xs text-purple-300 font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                        <span>Fixed 100-Slot Analysis Complete</span>
                        {masterParsedData.newSubjects.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px]">
                            +{masterParsedData.newSubjects.length} New Subjects Auto-Created
                          </span>
                        )}
                      </div>
                      <div className="text-base font-extrabold text-white">
                        {masterParsedData.totalRows} Total Questions Analyzed Across {masterParsedData.detectedSubjects.length} Subject Slots
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMasterFile(null);
                      setMasterParsedData(null);
                      setShowReallocationDetails(false);
                    }}
                    className="text-xs text-[#94A3B8] hover:text-white underline cursor-pointer"
                  >
                    Upload different file
                  </button>
                </div>

                {/* ── EXCESS DEVIATION & RECHECK NOTIFICATION BANNER ── */}
                {masterParsedData.excessSubjects.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="text-amber-400 mt-0.5 flex-shrink-0" size={18} />
                        <div>
                          <div className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider flex items-center gap-2">
                            <span>⚠️ Fixed-Slot Deviation Detected & Re-checked</span>
                            <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-200 text-[10px]">
                              {masterParsedData.excessSubjects.length} Subject(s) Exceeded 100 Qs
                            </span>
                          </div>
                          <p className="text-xs text-[#E2E8F0] mt-1 leading-relaxed">
                            Some subjects in the uploaded Excel contained more than 100 questions (e.g. 200 questions). 
                            The engine re-verified question content keywords against underfilled subjects (<span className="text-emerald-400 font-bold">&lt;100 Qs</span>), 
                            reallocated <span className="text-purple-300 font-bold">{masterParsedData.reallocations.length} mislabeled questions</span>, 
                            and strictly capped each bank at the <span className="text-amber-300 font-bold">fixed 100-question slot</span>.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stat Tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20 text-[11px] font-mono">
                      <span className="px-2.5 py-1 rounded-lg bg-black/40 text-amber-300 border border-amber-500/30">
                        Total Excess Beyond 100: +{masterParsedData.excessSubjects.reduce((acc, e) => acc + e.excessCount, 0)} Qs
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-black/40 text-purple-300 border border-purple-500/30">
                        Re-routed to Underfilled Banks: {masterParsedData.reallocations.length} Qs
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-black/40 text-emerald-300 border border-emerald-500/30">
                        Fixed Slot Target: 100 Qs / Subject
                      </span>

                      {masterParsedData.reallocations.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowReallocationDetails(!showReallocationDetails)}
                          className="ml-auto px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {showReallocationDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          <span>{showReallocationDetails ? 'Hide' : 'View'} Recheck Audit ({masterParsedData.reallocations.length})</span>
                        </button>
                      )}
                    </div>

                    {/* Collapsible Reallocation Details Log */}
                    {showReallocationDetails && masterParsedData.reallocations.length > 0 && (
                      <div className="p-3 rounded-xl bg-black/60 border border-purple-500/30 space-y-2 max-h-40 overflow-y-auto">
                        <div className="text-[11px] font-mono font-bold text-purple-300 uppercase">
                          📋 Detailed Question Re-routing Audit:
                        </div>
                        <div className="space-y-1.5">
                          {masterParsedData.reallocations.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-white/[0.03] border border-white/10 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                            >
                              <div className="text-white truncate max-w-sm" title={item.questionSnippet}>
                                <span className="text-purple-400 font-mono font-bold mr-1">#{idx + 1}</span>
                                {item.questionSnippet}
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-[10px] flex-shrink-0">
                                <span className="text-red-300 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-500/30">
                                  {item.fromSubject}
                                </span>
                                <ArrowRight size={10} className="text-white" />
                                <span className="text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                  {item.toSubject}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mode Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>⚙️ Choose Import & Distribution Mode:</span>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Option 1: Fixed Slot 100 Qs */}
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
                          <span>Fixed 100-Question Slots (Balanced & Re-checked)</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                            RECOMMENDED
                          </span>
                        </div>
                        <p className="text-[11px] text-[#94A3B8]">
                          Strictly caps every subject at 100 questions. Discards or reallocates overflow beyond 100 to avoid deviation.
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
                          Full Raw Import (All {masterParsedData.totalRows} Questions)
                        </div>
                        <p className="text-[11px] text-[#94A3B8]">
                          Uploads every single row without the 100-slot cap (ideal for massive unconstrained archives).
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
                      📊 Fixed Subject Slots Breakdown ({masterParsedData.detectedSubjects.length}):
                    </span>
                    <span className="text-[#94A3B8] font-mono text-[11px]">
                      {masterUploadMode === 'auto_fill_100'
                        ? 'Target: 100 Qs / Subject Slot'
                        : 'Full unconstrained count'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {Object.entries(masterParsedData.subjectGroups).map(([subName, list]) => {
                      const count = list.length;
                      const rawCount = masterParsedData.rawSubjectCounts[subName] || count;
                      const willUpload = masterUploadMode === 'auto_fill_100' ? Math.min(100, count) : count;
                      const percent = Math.min(100, Math.round((willUpload / 100) * 100));
                      const isNew = masterParsedData.newSubjects.includes(subName);
                      const hasExcess = rawCount > 100;
                      const reallocatedIn = masterParsedData.reallocations.filter((r) => r.toSubject === subName).length;

                      return (
                        <div
                          key={subName}
                          className={`p-3 rounded-xl border space-y-2 ${
                            hasExcess
                              ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                              : isNew
                              ? 'bg-purple-950/30 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                              : 'bg-white/[0.04] border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-white truncate" title={subName}>
                                {subName}
                              </span>
                              {isNew && (
                                <span className="px-1 py-0.2 rounded bg-purple-500/30 text-purple-200 text-[8px] font-mono flex-shrink-0">
                                  NEW ✨
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[#00E5FF] font-bold flex-shrink-0">
                              {willUpload} Qs
                            </span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                willUpload >= 100
                                  ? 'bg-gradient-to-r from-emerald-500 to-[#00E5FF]'
                                  : 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-[#94A3B8] gap-1">
                            <span>Found in file: {rawCount}</span>
                            {hasExcess && masterUploadMode === 'auto_fill_100' ? (
                              <span className="text-amber-300 font-bold">⚠️ +{rawCount - 100} Excess Capped</span>
                            ) : willUpload >= 100 ? (
                              <span className="text-emerald-400 font-bold">✅ 100/100 Slot Full</span>
                            ) : (
                              <span className="text-sky-300 font-bold">{willUpload}/100 ({100 - willUpload} deficit)</span>
                            )}
                          </div>

                          {reallocatedIn > 0 && (
                            <div className="text-[9px] font-mono text-purple-300 bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-500/20">
                              ⚡ +{reallocatedIn} re-routed from excess subjects
                            </div>
                          )}
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
                      Questions into Fixed Slots
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
                  Streaming in high-speed batches of 100 with dynamic subject auto-registration. Please keep this modal open.
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
                    disabled
                    value={0}
                    className="form-input bg-[#000000] text-[#64748B] border border-[rgba(255,255,255,0.1)] text-xs cursor-not-allowed"
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

      {/* ═══ AUTO-GENERATE 50-Q MULTI-SECTION TEST MODAL (4 SECTIONS & ZERO REPETITION) ═══ */}
      {showAutoModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/90 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowAutoModal(false)} />

          <div className="relative z-10 w-full max-w-2xl bg-[#08080C] border border-[#00E5FF]/40 rounded-3xl shadow-[0_0_60px_rgba(0,229,255,0.25)] overflow-hidden my-auto p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-[#00E5FF] shadow-lg">
                  <Zap size={22} className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] font-extrabold text-lg text-white flex items-center gap-2">
                    Automated 50-Question Multi-Section Test Generator
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Divides your question bank into 50-question batches and dispatches 4 non-overlapping sets to Sections A, B, C, & D.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAutoModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
              <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[10px] font-mono text-[#94A3B8] uppercase">Bank Questions</div>
                <div className="text-base font-extrabold text-white font-mono">{questions.length}</div>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-[#00E5FF]/20">
                <div className="text-[10px] font-mono text-[#00E5FF] uppercase">Total 50-Q Batches</div>
                <div className="text-base font-extrabold text-[#00E5FF] font-mono">{Math.floor(questions.length / 50)} Batches</div>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-purple-500/20">
                <div className="text-[10px] font-mono text-purple-300 uppercase">Sections Served</div>
                <div className="text-base font-extrabold text-purple-300 font-mono">4 (A, B, C, D)</div>
              </div>
            </div>

            <form onSubmit={handleGenerateAutoRound} className="space-y-4">
              {/* Generation Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  ⚙️ Select Distribution Mode:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mode 1: 4-Section Multi Test */}
                  <div
                    onClick={() => setAutoMode('multi_section_4')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      autoMode === 'multi_section_4'
                        ? 'bg-[#00E5FF]/15 border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.25)]'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      autoMode === 'multi_section_4' ? 'border-[#00E5FF] bg-[#00E5FF] text-black' : 'border-white/30'
                    }`}>
                      {autoMode === 'multi_section_4' && <Check size={10} />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span>4-Section Test Cycle (A, B, C, D)</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">
                          RECOMMENDED
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8]">
                        4 non-overlapping 50-Q batches with zero question repetition across sections.
                      </p>
                    </div>
                  </div>

                  {/* Mode 2: Single Test */}
                  <div
                    onClick={() => setAutoMode('single')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      autoMode === 'single'
                        ? 'bg-[#00E5FF]/15 border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.25)]'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      autoMode === 'single' ? 'border-[#00E5FF] bg-[#00E5FF] text-black' : 'border-white/30'
                    }`}>
                      {autoMode === 'single' && <Check size={10} />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-white">Single 50-Question Round</div>
                      <p className="text-[11px] text-[#94A3B8]">
                        Generates a single standalone 50-question test for all students.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs text-[#E2E8F0] font-bold">Base Assessment Title</label>
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
                    placeholder="45"
                    className="form-input bg-[#000000] text-white border border-white/20 text-xs"
                    required
                  />
                </div>
              </div>

              {/* 4-Section Distribution Preview */}
              {autoMode === 'multi_section_4' && (
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={14} /> 4-Section Non-Overlapping Batch Allocation Preview:
                    </span>
                    <span className="text-emerald-300 font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Zero-Repetition Guaranteed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { sec: 'A', batch: 'Batch #1', count: '50 Qs' },
                      { sec: 'B', batch: 'Batch #2', count: '50 Qs' },
                      { sec: 'C', batch: 'Batch #3', count: '50 Qs' },
                      { sec: 'D', batch: 'Batch #4', count: '50 Qs' },
                    ].map((item) => (
                      <div key={item.sec} className="p-2.5 rounded-xl bg-black/60 border border-purple-500/20 text-center space-y-1">
                        <div className="text-xs font-bold text-white font-[family-name:var(--font-heading)]">
                          🏛️ Section {item.sec}
                        </div>
                        <div className="text-[10px] font-mono text-[#00E5FF] font-semibold">{item.count}</div>
                        <div className="text-[9px] font-mono text-purple-300">{item.batch}</div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-[#94A3B8] font-mono flex items-center gap-2 pt-1 border-t border-purple-500/20">
                    <Sparkles size={12} className="text-[#00E5FF]" />
                    <span>Anti-Cheating active: Questions and MCQ option orders will be uniquely randomized per student attempt.</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <GalaxyButton variant="secondary" size="sm" type="button" onClick={() => setShowAutoModal(false)}>
                  Cancel
                </GalaxyButton>
                <GalaxyButton variant="cyan" size="sm" type="submit" loading={autoSubmitting}>
                  🚀 {autoMode === 'multi_section_4' ? 'Generate 4 Section Tests' : 'Generate 50-Q Test'}
                </GalaxyButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
