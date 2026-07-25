'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { Question, QuestionType } from '@/types/database';
import {
  Plus, Trash2, Edit2, UploadCloud, ArrowLeft, X, ImagePlus, Image as ImageIcon
} from 'lucide-react';
import Papa from 'papaparse';
import { formatImageUrl } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QuestionsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const roundId = resolvedParams.id;

  const [roundTitle, setRoundTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDownloadCSVTemplate = () => {
    const templateData = [
      {
        'Question Text': 'Identify the active microcontroller on the Arduino Uno development board shown in the diagram.',
        'Question Type': 'mcq',
        'option 1': 'ATmega328P',
        'option 2': 'ATmega2560',
        'option 3': 'ESP32',
        'option 4': 'STM32F103',
        'Correct Option (1-4)': 1,
        'Marks': 2,
        'Negative Marks': 0.5,
        'Image Link / Drive URL': 'https://drive.google.com/file/d/1ABC123EXAMPLE/view?usp=sharing',
        'Category': 'Arduino & Microcontrollers',
        'Difficulty': 'medium',
        'Explanation': 'ATmega328P is the standard 8-bit AVR microcontroller on Arduino Uno.',
      },
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Question_Bank_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Question CSV Template Downloaded! 📊');
  };

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form State
  const [qType, setQType] = useState<QuestionType>('mcq');
  const [qText, setQText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [marks, setMarks] = useState(1);
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Image Upload State
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchQuestions = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const roundRes = await supabase.from('rounds').select('title').eq('id', roundId).single();
    if (roundRes.data) setRoundTitle(roundRes.data.title);

    const res = await fetch(`/api/admin/rounds/${roundId}/questions`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setQuestions(data.questions || []);
    setLoading(false);
  }, [roundId]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const openAddModal = () => {
    setEditingQuestion(null);
    setQType('mcq');
    setQText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
    setMarks(1);
    setExplanation('');
    setImageUrl(null);
    setImageAlt('');
    setShowModal(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setQType(q.question_type);
    setQText(q.question_text);
    setOptions(q.options || ['', '', '', '']);
    setCorrectAnswer(typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer) : String(q.correct_answer ?? ''));
    setMarks(q.marks);
    setExplanation(q.explanation || '');
    setImageUrl(q.image_url || null);
    setImageAlt(q.image_alt || '');
    setShowModal(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `rounds/${roundId}/questions/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage bucket 'question-images'
      const { error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Fallback: Convert to data URL if bucket doesn't exist
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageUrl(event.target?.result as string);
          toast.success('Image attached');
        };
        reader.readAsDataURL(file);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('question-images')
          .getPublicUrl(filePath);

        setImageUrl(publicUrlData.publicUrl);
        toast.success('Image uploaded successfully! 🖼️');
      }
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !correctAnswer.trim()) {
      toast.error('Please enter question text and correct answer');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload = {
        question_text: qText,
        question_type: qType,
        options: qType === 'mcq' ? options : null,
        correct_answer: correctAnswer,
        marks,
        explanation,
        image_url: imageUrl,
        image_alt: imageAlt,
      };

      let res;
      if (editingQuestion) {
        res = await fetch(`/api/admin/rounds/${roundId}/questions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ questionId: editingQuestion.id, ...payload }),
        });
      } else {
        res = await fetch(`/api/admin/rounds/${roundId}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(editingQuestion ? 'Question updated' : 'Question added');
        setShowModal(false);
        fetchQuestions();
      } else {
        toast.error('Failed to save question');
      }
    } catch {
      toast.error('Error saving question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/rounds/${roundId}/questions`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ questionId: qId }),
    });

    if (res.ok) {
      toast.success('Question deleted');
      fetchQuestions();
    } else {
      toast.error('Failed to delete question');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(`/api/admin/rounds/${roundId}/upload-questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ questions: results.data }),
        });

        if (res.ok) {
          toast.success('CSV Questions imported successfully');
          fetchQuestions();
        } else {
          toast.error('Failed to import CSV');
        }
      },
    });
  };

  const skeuomorphicShadow = '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.45), 0 1px 60px rgba(168,85,247,0.04), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.25), inset 1px 0 0 rgba(255,255,255,0.03), inset -1px 0 0 rgba(0,0,0,0.08)';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto relative z-10">

      {/* HEADER */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/admin/rounds/${roundId}`}>
              <button className="w-10 h-10 rounded-xl bg-[var(--glass-white)] hover:bg-[var(--glass-purple)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer">
                <ArrowLeft size={18} />
              </button>
            </Link>
            <div>
              <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl gradient-text">
                Question Bank
              </h1>
              <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light">
                {roundTitle || 'Round Questions'} · {questions.length} questions configured
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <GalaxyButton variant="secondary" size="sm" type="button" onClick={handleDownloadCSVTemplate}>
              <UploadCloud size={14} /> Download Template
            </GalaxyButton>
            <label className="cursor-pointer">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              <GalaxyButton variant="secondary" size="sm" type="button">
                <UploadCloud size={14} /> Import CSV
              </GalaxyButton>
            </label>
            <GalaxyButton variant="primary" size="sm" onClick={openAddModal}>
              <Plus size={14} /> Add Question
            </GalaxyButton>
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(168,85,247,0.4)] to-transparent" />
      </FadeIn>

      {/* QUESTIONS TABLE */}
      <FadeIn delay={0.06}>
        <GlassCard variant="solid" radius={24} hover={false} noHover className="!p-0 border border-[rgba(255,255,255,0.07)]" style={{ boxShadow: skeuomorphicShadow }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[rgba(168,85,247,0.16)] bg-[rgba(124,58,237,0.1)] font-[family-name:var(--font-heading)] text-xs text-[var(--aurora-purple)] uppercase tracking-wider">
                  <th className="px-5 py-3.5 text-center w-12">#</th>
                  <th className="px-5 py-3.5 text-left">Question Text</th>
                  <th className="px-5 py-3.5 text-center">Type</th>
                  <th className="px-5 py-3.5 text-left">Correct Answer</th>
                  <th className="px-5 py-3.5 text-center">Image</th>
                  <th className="px-5 py-3.5 text-center">Marks</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-16 text-center text-xs text-[var(--text-muted)]">Loading questions...</td></tr>
                ) : questions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <ImagePlus size={48} className="mx-auto text-[var(--aurora-purple)] opacity-20 mb-3" />
                      <p className="font-[family-name:var(--font-display)] font-semibold text-base text-[var(--text-muted)]">
                        No questions added to this round yet
                      </p>
                      <GalaxyButton variant="primary" size="sm" className="mt-4" onClick={openAddModal}>
                        + Add First Question
                      </GalaxyButton>
                    </td>
                  </tr>
                ) : (
                  questions.map((q, idx) => (
                    <tr key={q.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(168,85,247,0.04)] transition-colors">
                      <td className="px-5 py-4 font-[family-name:var(--font-mono)] font-semibold text-xs text-[var(--text-dim)] text-center">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-4 font-[family-name:var(--font-body)] text-xs text-[var(--text-primary)] max-w-md">
                        <p className="line-clamp-2">{q.question_text}</p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full font-[family-name:var(--font-heading)] font-semibold text-[10px] uppercase bg-[rgba(168,85,247,0.15)] text-[var(--aurora-purple)] border border-[rgba(168,85,247,0.3)]">
                          {q.question_type}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-[family-name:var(--font-mono)] text-xs text-[var(--aurora-green)] font-semibold">
                        {typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer) : String(q.correct_answer ?? '')}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {q.image_url ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[rgba(6,182,212,0.15)] text-[var(--aurora-cyan)] border border-[rgba(6,182,212,0.3)] inline-flex items-center gap-1 font-[family-name:var(--font-mono)]">
                            <ImageIcon size={10} /> Image Attached
                          </span>
                        ) : (
                          <span className="text-[var(--text-dim)] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-[family-name:var(--font-mono)] text-xs text-[var(--aurora-gold)] font-bold text-center">
                        +{q.marks}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button onClick={() => openEditModal(q)} className="w-8 h-8 rounded-lg bg-[var(--glass-white)] hover:bg-[var(--glass-purple)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--aurora-purple)] cursor-pointer">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDeleteQuestion(q.id)} className="w-8 h-8 rounded-lg bg-[rgba(244,63,94,0.12)] border border-[rgba(244,63,94,0.25)] flex items-center justify-center text-[var(--aurora-rose)] cursor-pointer">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </FadeIn>

      {/* ADD / EDIT MODAL WITH IMAGE UPLOAD */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-[#03010A]/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar">
              <GlassCard variant="elevated" radius={24} hover={false} noHover className="!p-7 border border-[rgba(168,85,247,0.3)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-xl gradient-text">
                    {editingQuestion ? 'Edit Question' : 'Add New Question'}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-white cursor-pointer"><X size={18} /></button>
                </div>

                <form onSubmit={handleSaveQuestion} className="space-y-4 pt-2">
                  <div>
                    <label className="form-label text-xs">Question Type</label>
                    <select value={qType} onChange={(e) => setQType(e.target.value as QuestionType)} className="form-input bg-[var(--space-surface)] text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
                      <option value="mcq">MCQ (Multiple Choice)</option>
                      <option value="true_false">True / False</option>
                      <option value="fill_blank">Fill in the Blank</option>
                      <option value="numerical">Numerical Answer</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label text-xs">Question Statement</label>
                    <textarea rows={3} value={qText} onChange={(e) => setQText(e.target.value)} required placeholder="Enter the complete question text..." className="form-input resize-none" />
                  </div>

                  {/* QUESTION IMAGE UPLOAD SECTION */}
                  <div className="p-4 rounded-xl bg-black/60 border border-[rgba(168,85,247,0.3)] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="form-label text-xs font-bold text-white flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-[var(--aurora-cyan)]" /> Question Image / Diagram (Optional)
                      </label>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">Supports Drive Links & Uploads</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={imageUrl || ''}
                        onChange={(e) => setImageUrl(formatImageUrl(e.target.value))}
                        placeholder="Paste Google Drive share link or direct Image URL..."
                        className="form-input text-xs flex-1 bg-black text-white border border-white/15"
                      />
                      <label className="px-3.5 py-2 rounded-xl bg-[var(--aurora-purple)]/20 hover:bg-[var(--aurora-purple)]/30 border border-[var(--aurora-purple)]/40 text-white text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 flex-shrink-0">
                        <ImagePlus size={14} />
                        <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Live Circuit Diagram Image Preview */}
                    {imageUrl && (
                      <div className="relative rounded-xl border border-[rgba(0,229,255,0.3)] bg-black/80 p-3 text-center space-y-2">
                        <img
                          src={formatImageUrl(imageUrl)}
                          alt="Question Preview"
                          className="max-h-40 mx-auto object-contain rounded-lg border border-white/10"
                        />
                        <div className="flex items-center justify-between px-2 text-xs font-[family-name:var(--font-mono)] text-[var(--text-muted)]">
                          <span className="truncate max-w-[240px] text-[var(--aurora-cyan)]">{imageUrl}</span>
                          <button
                            type="button"
                            onClick={() => setImageUrl(null)}
                            className="text-[var(--aurora-rose)] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <X size={14} /> Remove Image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {qType === 'mcq' && (
                    <div className="space-y-2">
                      <label className="form-label text-xs">Options (4)</label>
                      {options.map((opt, i) => (
                        <input
                          key={i}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...options];
                            newOpts[i] = e.target.value;
                            setOptions(newOpts);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          className="form-input text-xs"
                        />
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="form-label text-xs">Correct Answer</label>
                    {qType === 'mcq' ? (
                      <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} className="form-input bg-[var(--space-surface)] text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
                        <option value="">Select Correct Option</option>
                        {options.map((opt, i) => opt.trim() ? <option key={i} value={opt}>{opt}</option> : null)}
                      </select>
                    ) : qType === 'true_false' ? (
                      <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} className="form-input bg-[var(--space-surface)] text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
                        <option value="">Select Answer</option>
                        <option value="True">True</option>
                        <option value="False">False</option>
                      </select>
                    ) : (
                      <input type="text" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Exact correct answer string or value" className="form-input" />
                    )}
                  </div>

                  <div>
                    <label className="form-label text-xs">Marks Awarded</label>
                    <input type="number" value={marks} onChange={(e) => setMarks(Number(e.target.value))} min={1} className="form-input font-[family-name:var(--font-mono)]" />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <GalaxyButton variant="secondary" size="sm" type="button" onClick={() => setShowModal(false)}>Cancel</GalaxyButton>
                    <GalaxyButton variant="primary" size="sm" type="submit" loading={submitting}>Save Question</GalaxyButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
