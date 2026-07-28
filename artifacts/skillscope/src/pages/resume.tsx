import { 
  useGetResumes, 
  useCreateResume, 
  useDeleteResume,
  useGenerateResume,
  useUpdateResume,
  getGetResumesQueryKey
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, Plus, Trash2, Wand2, Download, Loader2, CheckCircle2, 
  AlertCircle, ArrowLeft, Save, Sparkles, Check, Copy, ExternalLink, 
  Briefcase, GraduationCap, Trophy, Award, Terminal, Code, Link2, Settings, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { type ResumeInputTemplate } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { exportToPDF, exportToDOCX } from '@/lib/resume-export';

export interface FormState {
  profile: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    portfolio: string;
  };
  career: {
    currentRole: string;
    yearsOfExperience: string;
    targetRole: string;
    summary: string;
    objective: string;
  };
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    gpa: string;
    achievements: string[];
  }>;
  skills: {
    languages: string[];
    frameworks: string[];
    libraries: string[];
    databases: string[];
    cloud: string[];
    devops: string[];
    ai_ml: string[];
    tools: string[];
    other: string[];
  };
  projects: Array<{
    name: string;
    description: string;
    tech: string[];
    link: string;
    liveDemo: string;
    highlights: string[];
  }>;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    points: string[];
    achievements: string[];
    techUsed: string[];
  }>;
  certifications: Array<{
    name: string;
    organization: string;
    date: string;
  }>;
  achievements: string[];
  codingProfiles: {
    github: string;
    leetcode: string;
    codeforces: string;
    codechef: string;
    hackerrank: string;
  };
  analysis?: {
    atsScore: number;
    completenessScore: number;
    keywordMatchScore: number;
    contentQualityScore: number;
    suggestions: Array<{ category: string; message: string }>;
  };
}

const DEFAULT_FORM: FormState = {
  profile: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' },
  career: { currentRole: '', yearsOfExperience: '', targetRole: '', summary: '', objective: '' },
  education: [],
  skills: { languages: [], frameworks: [], libraries: [], databases: [], cloud: [], devops: [], ai_ml: [], tools: [], other: [] },
  projects: [],
  experience: [],
  certifications: [],
  achievements: [],
  codingProfiles: { github: '', leetcode: '', codeforces: '', codechef: '', hackerrank: '' }
};

const STEPS = [
  { id: 'profile', name: 'Personal Details', icon: FileText },
  { id: 'career', name: 'Career Info', icon: Settings },
  { id: 'experience', name: 'Experience', icon: Briefcase },
  { id: 'projects', name: 'Projects', icon: Terminal },
  { id: 'skills', name: 'Skills', icon: Code },
  { id: 'education', name: 'Education', icon: GraduationCap },
  { id: 'certifications', name: 'Certifications', icon: Award },
  { id: 'achievements', name: 'Achievements', icon: Trophy },
  { id: 'coding', name: 'Coding Profiles', icon: Link2 },
  { id: 'review', name: 'Review & AI', icon: Sparkles },
  { id: 'preview', name: 'Template Preview', icon: Copy }
];

export default function ResumePage() {
  const { data: resumes, isLoading } = useGetResumes();
  const createResume = useCreateResume();
  const deleteResume = useDeleteResume();
  const generateResume = useGenerateResume();
  const updateResume = useUpdateResume();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<ResumeInputTemplate>('fresher');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Wizard state
  const [activeResumeId, setActiveResumeId] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<string>('profile');
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Current active resume details
  const activeResume = resumes?.find(r => r.id === activeResumeId);

  // Sync edit form when activeResumeId changes
  useEffect(() => {
    if (activeResumeId && activeResume) {
      if (activeResume.content) {
        setForm(activeResume.content as unknown as FormState);
      } else {
        setForm(DEFAULT_FORM);
      }
    }
  }, [activeResumeId, resumes]);

  // Debounced auto-save function
  const triggerAutoSave = (updatedForm: FormState) => {
    if (!activeResumeId) return;
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      updateResume.mutate({
        id: activeResumeId,
        data: {
          content: updatedForm as any
        }
      }, {
        onSuccess: () => {
          setSaveStatus('saved');
          queryClient.invalidateQueries({ queryKey: getGetResumesQueryKey() });
          setTimeout(() => setSaveStatus('idle'), 1500);
        },
        onError: () => {
          setSaveStatus('idle');
        }
      });
    }, 1500);
  };

  const handleFormChange = (section: keyof FormState, field: string, value: any) => {
    const updated = {
      ...form,
      [section]: {
        ...(form[section] as any),
        [field]: value
      }
    };
    setForm(updated);
    triggerAutoSave(updated);
  };

  const handleArrayFieldChange = (section: 'education' | 'experience' | 'projects' | 'certifications', index: number, field: string, value: any) => {
    const arr = [...form[section]];
    arr[index] = {
      ...arr[index],
      [field]: value
    };
    const updated = {
      ...form,
      [section]: arr
    };
    setForm(updated);
    triggerAutoSave(updated);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !template) return;
    createResume.mutate({ data: { title, template } }, {
      onSuccess: (newResume) => {
        setIsAddOpen(false); 
        setTitle('');
        queryClient.invalidateQueries({ queryKey: getGetResumesQueryKey() });
        setActiveResumeId(newResume.id);
        setActiveStep('profile');
        toast({ title: "Resume created", description: "Use the step-by-step wizard to build your resume." });
      }
    });
  };

  const handleDuplicate = (resume: any) => {
    toast({ title: "Duplicating resume…", description: "Creating a new version." });
    createResume.mutate({
      data: {
        title: `Copy of ${resume.title}`,
        template: resume.template
      }
    }, {
      onSuccess: (newResume) => {
        updateResume.mutate({
          id: newResume.id,
          data: {
            content: (resume.content || {}) as any
          }
        }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetResumesQueryKey() });
            toast({ title: "✓ Duplicate created successfully!" });
          }
        });
      }
    });
  };

  const handleConfirmDelete = () => {
    if (deleteId === null) return;
    deleteResume.mutate({ id: deleteId }, {
      onSuccess: () => {
        if (activeResumeId === deleteId) {
          setActiveResumeId(null);
        }
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: getGetResumesQueryKey() });
        toast({ title: "Resume deleted" });
      }
    });
  };

  const handleOptimizeAI = () => {
    if (!activeResumeId) return;
    toast({ title: "Analyzing & Optimizing with AI…", description: "Polishing bullet points, checking keywords, and calculating scores." });
    
    // Force a save of current form first
    updateResume.mutate({
      id: activeResumeId,
      data: {
        content: form as any
      }
    }, {
      onSuccess: () => {
        generateResume.mutate({ id: activeResumeId }, {
          onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: getGetResumesQueryKey() });
            if (updated.content) {
              setForm(updated.content as unknown as FormState);
            }
            toast({ title: "✓ AI Optimization complete!", description: "Bullet points rewritten and scores calculated." });
          },
          onError: () => {
            toast({ title: "AI Optimization failed", description: "Please complete details and try again.", variant: "destructive" });
          }
        });
      }
    });
  };

  const stepIndex = STEPS.findIndex(s => s.id === activeStep);
  const percentComplete = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  const handlePrev = () => {
    if (stepIndex > 0) {
      setActiveStep(STEPS[stepIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setActiveStep(STEPS[stepIndex + 1].id);
    }
  };

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-rose-500';

  const progressBg = (score: number) =>
    score >= 80 ? 'bg-emerald-500/20' : score >= 60 ? 'bg-amber-500/20' : 'bg-rose-500/20';

  if (activeResumeId && activeResume) {
    return (
      <div className="space-y-6 pb-12">
        {/* Wizard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setActiveResumeId(null)}
              title="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">{activeResume.title}</h1>
                <Badge variant="outline" className="capitalize">{activeResume.template}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Wizard Progress: {percentComplete}%</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            {saveStatus === 'saving' && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin text-primary" /> Saving Draft...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-500 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Auto-saved
              </span>
            )}
            <Button size="sm" onClick={handleOptimizeAI} disabled={generateResume.isPending} className="gap-2">
              {generateResume.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              AI Optimize & Analyze
            </Button>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <Progress value={percentComplete} className="h-1.5" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Steps */}
          <div className="lg:col-span-3 space-y-1 bg-card border rounded-xl p-3">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = activeStep === s.id;
              const isPast = idx < stepIndex;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all text-left ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow' 
                      : isPast 
                      ? 'text-foreground/80 hover:bg-muted/50' 
                      : 'text-muted-foreground hover:bg-muted/30'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{s.name}</span>
                  {isPast && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Form Step Body & Live Preview */}
          <div className="lg:col-span-9 grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-7 bg-card border rounded-xl p-6 space-y-6">
              
              {/* Profile details step */}
              {activeStep === 'profile' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold">Personal Information</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Primary contact info shown on the header of the resume.</p>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-name">Full Name</Label>
                        <Input id="prof-name" value={form.profile.name} onChange={e => handleFormChange('profile', 'name', e.target.value)} placeholder="Arjun Sharma" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-email">Email Address</Label>
                        <Input id="prof-email" type="email" value={form.profile.email} onChange={e => handleFormChange('profile', 'email', e.target.value)} placeholder="arjun@example.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-phone">Phone Number</Label>
                        <Input id="prof-phone" value={form.profile.phone} onChange={e => handleFormChange('profile', 'phone', e.target.value)} placeholder="+91 98765 43210" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-loc">Location</Label>
                        <Input id="prof-loc" value={form.profile.location} onChange={e => handleFormChange('profile', 'location', e.target.value)} placeholder="Bengaluru, Karnataka" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-linkedin">LinkedIn URL (omit https://)</Label>
                      <Input id="prof-linkedin" value={form.profile.linkedin} onChange={e => handleFormChange('profile', 'linkedin', e.target.value)} placeholder="linkedin.com/in/arjunsharma" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-github">GitHub Handle</Label>
                        <Input id="prof-github" value={form.profile.github} onChange={e => handleFormChange('profile', 'github', e.target.value)} placeholder="github.com/arjunsharma" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-port">Portfolio Website</Label>
                        <Input id="prof-port" value={form.profile.portfolio} onChange={e => handleFormChange('profile', 'portfolio', e.target.value)} placeholder="arjunsharma.dev" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Career details step */}
              {activeStep === 'career' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold">Career Information</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Your professional highlights and selected target job role details.</p>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="career-cur">Current Role</Label>
                        <Input id="career-cur" value={form.career.currentRole} onChange={e => handleFormChange('career', 'currentRole', e.target.value)} placeholder="SDE-1" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="career-yoe">Years of Experience</Label>
                        <Input id="career-yoe" type="number" value={form.career.yearsOfExperience} onChange={e => handleFormChange('career', 'yearsOfExperience', e.target.value)} placeholder="2" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="career-tgt">Target Job Role</Label>
                      <Select value={form.career.targetRole || 'Software Engineer'} onValueChange={v => handleFormChange('career', 'targetRole', v)}>
                        <SelectTrigger id="career-tgt"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Software Engineer">Software Engineer (General)</SelectItem>
                          <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                          <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                          <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                          <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                          <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                          <SelectItem value="Machine Learning Engineer">Machine Learning Engineer</SelectItem>
                          <SelectItem value="Product Manager">Product Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="career-sum">Professional Summary (for resume top section)</Label>
                      <Textarea id="career-sum" value={form.career.summary} onChange={e => handleFormChange('career', 'summary', e.target.value)} placeholder="Passionate full-stack developer with 2+ years of experience..." className="min-h-[100px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="career-obj">Career Objective (Optional)</Label>
                      <Textarea id="career-obj" value={form.career.objective} onChange={e => handleFormChange('career', 'objective', e.target.value)} placeholder="To obtain a SDE position where I can leverage my cloud skills..." className="min-h-[80px]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Work experience step */}
              {activeStep === 'experience' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-semibold">Work Experience</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">List professional experience details. Add achievements.</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => {
                      const updated = {
                        ...form,
                        experience: [...form.experience, { company: '', role: '', duration: '', points: [''], achievements: [], techUsed: [] }]
                      };
                      setForm(updated);
                      triggerAutoSave(updated);
                    }} className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> Add Job
                    </Button>
                  </div>

                  <div className="space-y-6 pt-2">
                    {form.experience.map((exp, idx) => (
                      <Card key={idx} className="border border-border/80 p-4 relative bg-background/50">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive absolute top-3 right-3 hover:bg-destructive/10"
                          onClick={() => {
                            const filtered = form.experience.filter((_, i) => i !== idx);
                            const updated = { ...form, experience: filtered };
                            setForm(updated);
                            triggerAutoSave(updated);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <div className="space-y-4 pr-6">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <Label>Company</Label>
                              <Input value={exp.company} onChange={e => handleArrayFieldChange('experience', idx, 'company', e.target.value)} placeholder="Razorpay" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Role</Label>
                              <Input value={exp.role} onChange={e => handleArrayFieldChange('experience', idx, 'role', e.target.value)} placeholder="SDE intern" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Duration</Label>
                              <Input value={exp.duration} onChange={e => handleArrayFieldChange('experience', idx, 'duration', e.target.value)} placeholder="June 2023 - Aug 2023" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label>Technologies Used (comma separated)</Label>
                            <Input value={exp.techUsed?.join(', ') || ''} onChange={e => {
                              const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              handleArrayFieldChange('experience', idx, 'techUsed', list);
                            }} placeholder="React, Node.js, AWS" />
                          </div>

                          {/* Points */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-semibold">Key Responsibilities / Impact points</Label>
                              <Button size="sm" variant="ghost" onClick={() => {
                                const expArr = [...form.experience];
                                expArr[idx] = { ...expArr[idx], points: [...(expArr[idx].points || []), ''] };
                                const updated = { ...form, experience: expArr };
                                setForm(updated);
                                triggerAutoSave(updated);
                              }} className="h-6 px-2 text-[10px] text-primary flex items-center gap-0.5">
                                <Plus className="h-3 w-3" /> Add bullet
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              {(exp.points || []).map((pt, pIdx) => (
                                <div key={pIdx} className="flex gap-2 items-center">
                                  <Textarea 
                                    value={pt} 
                                    onChange={e => {
                                      const pts = [...(exp.points || [])];
                                      pts[pIdx] = e.target.value;
                                      const expArr = [...form.experience];
                                      expArr[idx] = { ...expArr[idx], points: pts };
                                      const updated = { ...form, experience: expArr };
                                      setForm(updated);
                                      triggerAutoSave(updated);
                                    }} 
                                    placeholder="e.g. Worked on APIs."
                                    className="min-h-[50px] text-xs resize-none" 
                                  />
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    disabled={(exp.points || []).length <= 1} 
                                    onClick={() => {
                                      const pts = (exp.points || []).filter((_, i) => i !== pIdx);
                                      const expArr = [...form.experience];
                                      expArr[idx] = { ...expArr[idx], points: pts };
                                      const updated = { ...form, experience: expArr };
                                      setForm(updated);
                                      triggerAutoSave(updated);
                                    }}
                                    className="h-8 w-8 text-destructive shrink-0"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Achievements */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-semibold text-teal-500">Measurable Achievements (Optional)</Label>
                              <Button size="sm" variant="ghost" onClick={() => {
                                const expArr = [...form.experience];
                                expArr[idx] = { ...expArr[idx], achievements: [...(expArr[idx].achievements || []), ''] };
                                const updated = { ...form, experience: expArr };
                                setForm(updated);
                                triggerAutoSave(updated);
                              }} className="h-6 px-2 text-[10px] text-teal-500 flex items-center gap-0.5 hover:text-teal-400">
                                <Plus className="h-3 w-3" /> Add achievement
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              {(exp.achievements || []).map((ac, aIdx) => (
                                <div key={aIdx} className="flex gap-2 items-center">
                                  <Input 
                                    value={ac} 
                                    onChange={e => {
                                      const acs = [...(exp.achievements || [])];
                                      acs[aIdx] = e.target.value;
                                      const expArr = [...form.experience];
                                      expArr[idx] = { ...expArr[idx], achievements: acs };
                                      const updated = { ...form, experience: expArr };
                                      setForm(updated);
                                      triggerAutoSave(updated);
                                    }} 
                                    placeholder="e.g. Optimized response times by 30% via query caching."
                                    className="text-xs" 
                                  />
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                      const acs = (exp.achievements || []).filter((_, i) => i !== aIdx);
                                      const expArr = [...form.experience];
                                      expArr[idx] = { ...expArr[idx], achievements: acs };
                                      const updated = { ...form, experience: expArr };
                                      setForm(updated);
                                      triggerAutoSave(updated);
                                    }}
                                    className="h-8 w-8 text-destructive shrink-0"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {form.experience.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">No experience added. Click Add Job above to add one.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Projects details step */}
              {activeStep === 'projects' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-semibold">Projects</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Add project details, tech stack, and links.</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => {
                      const updated = {
                        ...form,
                        projects: [...form.projects, { name: '', description: '', tech: [], link: '', liveDemo: '', highlights: [''] }]
                      };
                      setForm(updated);
                      triggerAutoSave(updated);
                    }} className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> Add Project
                    </Button>
                  </div>

                  <div className="space-y-6 pt-2">
                    {form.projects.map((proj, idx) => (
                      <Card key={idx} className="border border-border/80 p-4 relative bg-background/50">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive absolute top-3 right-3 hover:bg-destructive/10"
                          onClick={() => {
                            const filtered = form.projects.filter((_, i) => i !== idx);
                            const updated = { ...form, projects: filtered };
                            setForm(updated);
                            triggerAutoSave(updated);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="space-y-4 pr-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label>Project Name</Label>
                              <Input value={proj.name} onChange={e => handleArrayFieldChange('projects', idx, 'name', e.target.value)} placeholder="e.g. Chat application" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Tech Stack (comma separated)</Label>
                              <Input value={proj.tech?.join(', ') || ''} onChange={e => {
                                const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                handleArrayFieldChange('projects', idx, 'tech', list);
                              }} placeholder="Socket.io, React, Redis" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label>GitHub Link</Label>
                              <Input value={proj.link} onChange={e => handleArrayFieldChange('projects', idx, 'link', e.target.value)} placeholder="github.com/user/project" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Live Demo Link</Label>
                              <Input value={proj.liveDemo} onChange={e => handleArrayFieldChange('projects', idx, 'liveDemo', e.target.value)} placeholder="project-live.vercel.app" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea value={proj.description} onChange={e => handleArrayFieldChange('projects', idx, 'description', e.target.value)} placeholder="Summarize what this project does and key features." className="min-h-[70px] text-xs" />
                          </div>

                          {/* Highlights */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-semibold">Key Highlights / Features</Label>
                              <Button size="sm" variant="ghost" onClick={() => {
                                const projArr = [...form.projects];
                                projArr[idx] = { ...projArr[idx], highlights: [...(projArr[idx].highlights || []), ''] };
                                const updated = { ...form, projects: projArr };
                                setForm(updated);
                                triggerAutoSave(updated);
                              }} className="h-6 px-2 text-[10px] text-primary flex items-center gap-0.5">
                                <Plus className="h-3 w-3" /> Add highlight
                              </Button>
                            </div>

                            <div className="space-y-2">
                              {(proj.highlights || []).map((h, hIdx) => (
                                <div key={hIdx} className="flex gap-2 items-center">
                                  <Input 
                                    value={h} 
                                    onChange={e => {
                                      const hg = [...(proj.highlights || [])];
                                      hg[hIdx] = e.target.value;
                                      const projArr = [...form.projects];
                                      projArr[idx] = { ...projArr[idx], highlights: hg };
                                      const updated = { ...form, projects: projArr };
                                      setForm(updated);
                                      triggerAutoSave(updated);
                                    }} 
                                    placeholder="e.g. Implemented end-to-end messaging with web sockets."
                                    className="text-xs" 
                                  />
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                      const hg = (proj.highlights || []).filter((_, i) => i !== hIdx);
                                      const projArr = [...form.projects];
                                      projArr[idx] = { ...projArr[idx], highlights: hg };
                                      const updated = { ...form, projects: projArr };
                                      setForm(updated);
                                      triggerAutoSave(updated);
                                    }}
                                    className="h-8 w-8 text-destructive shrink-0"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {form.projects.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">No projects added. Click Add Project above to add one.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Skills details step */}
              {activeStep === 'skills' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold">Skills</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Organise your skills by categories. Use commas to separate items.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label>Languages</Label>
                      <Input value={form.skills.languages?.join(', ') || ''} onChange={e => {
                        const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        handleFormChange('skills', 'languages', list);
                      }} placeholder="TypeScript, JavaScript, C++" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Frameworks</Label>
                      <Input value={form.skills.frameworks?.join(', ') || ''} onChange={e => {
                        const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        handleFormChange('skills', 'frameworks', list);
                      }} placeholder="Next.js, React, Node.js" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Libraries</Label>
                      <Input value={form.skills.libraries?.join(', ') || ''} onChange={e => {
                        const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        handleFormChange('skills', 'libraries', list);
                      }} placeholder="Redux, Lodash, RxJS" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Databases</Label>
                      <Input value={form.skills.databases?.join(', ') || ''} onChange={e => {
                        const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        handleFormChange('skills', 'databases', list);
                      }} placeholder="PostgreSQL, Redis, MongoDB" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cloud Platforms</Label>
                      <Input value={form.skills.cloud?.join(', ') || ''} onChange={e => {
                        const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        handleFormChange('skills', 'cloud', list);
                      }} placeholder="AWS, GCP, Azure" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>DevOps & Infrastructure</Label>
                      <Input value={form.skills.devops?.join(', ') || ''} onChange={e => {
                        const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        handleFormChange('skills', 'devops', list);
                      }} placeholder="Docker, Kubernetes, GitHub Actions" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>AI / Machine Learning</Label>
                      <Input value={form.skills.ai_ml?.join(', ') || ''} onChange={e => {
                        const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        handleFormChange('skills', 'ai_ml', list);
                      }} placeholder="TensorFlow, PyTorch, Scikit-Learn" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Developer Tools</Label>
                      <Input value={form.skills.tools?.join(', ') || ''} onChange={e => {
                        const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        handleFormChange('skills', 'tools', list);
                      }} placeholder="Git, VS Code, Linux" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Other Skills</Label>
                      <Input value={form.skills.other?.join(', ') || ''} onChange={e => {
                        const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        handleFormChange('skills', 'other', list);
                      }} placeholder="Agile, System Design, Communication" />
                    </div>
                  </div>
                </div>
              )}

              {/* Education details step */}
              {activeStep === 'education' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-semibold">Education</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">List colleges, universities, and graduation details.</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => {
                      const updated = {
                        ...form,
                        education: [...form.education, { degree: '', institution: '', year: '', gpa: '', achievements: [] }]
                      };
                      setForm(updated);
                      triggerAutoSave(updated);
                    }} className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> Add College
                    </Button>
                  </div>

                  <div className="space-y-6 pt-2">
                    {form.education.map((edu, idx) => (
                      <Card key={idx} className="border border-border/80 p-4 relative bg-background/50">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive absolute top-3 right-3 hover:bg-destructive/10"
                          onClick={() => {
                            const filtered = form.education.filter((_, i) => i !== idx);
                            const updated = { ...form, education: filtered };
                            setForm(updated);
                            triggerAutoSave(updated);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="space-y-4 pr-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label>Degree / Program</Label>
                              <Input value={edu.degree} onChange={e => handleArrayFieldChange('education', idx, 'degree', e.target.value)} placeholder="e.g. B.Tech Computer Science" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>College / University</Label>
                              <Input value={edu.institution} onChange={e => handleArrayFieldChange('education', idx, 'institution', e.target.value)} placeholder="e.g. IIT Delhi" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label>Graduation Year</Label>
                              <Input value={edu.year} onChange={e => handleArrayFieldChange('education', idx, 'year', e.target.value)} placeholder="e.g. 2024" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>GPA (Optional)</Label>
                              <Input value={edu.gpa} onChange={e => handleArrayFieldChange('education', idx, 'gpa', e.target.value)} placeholder="e.g. 8.5/10 or 3.8/4.0" />
                            </div>
                          </div>

                          {/* Achievements */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-semibold">Academic Achievements / Activities</Label>
                              <Button size="sm" variant="ghost" onClick={() => {
                                const eduArr = [...form.education];
                                eduArr[idx] = { ...eduArr[idx], achievements: [...(eduArr[idx].achievements || []), ''] };
                                const updated = { ...form, education: eduArr };
                                setForm(updated);
                                triggerAutoSave(updated);
                              }} className="h-6 px-2 text-[10px] text-primary flex items-center gap-0.5">
                                <Plus className="h-3 w-3" /> Add achievement
                              </Button>
                            </div>

                            <div className="space-y-2">
                              {(edu.achievements || []).map((a, aIdx) => (
                                <div key={aIdx} className="flex gap-2 items-center">
                                  <Input 
                                    value={a} 
                                    onChange={e => {
                                      const ac = [...(edu.achievements || [])];
                                      ac[aIdx] = e.target.value;
                                      const eduArr = [...form.education];
                                      eduArr[idx] = { ...eduArr[idx], achievements: ac };
                                      const updated = { ...form, education: eduArr };
                                      setForm(updated);
                                      triggerAutoSave(updated);
                                    }} 
                                    placeholder="e.g. Ranked 1st in department during 3rd year."
                                    className="text-xs" 
                                  />
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                      const ac = (edu.achievements || []).filter((_, i) => i !== aIdx);
                                      const eduArr = [...form.education];
                                      eduArr[idx] = { ...eduArr[idx], achievements: ac };
                                      const updated = { ...form, education: eduArr };
                                      setForm(updated);
                                      triggerAutoSave(updated);
                                    }}
                                    className="h-8 w-8 text-destructive shrink-0"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {form.education.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">No education entries added. Click Add College above to add one.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Certifications step */}
              {activeStep === 'certifications' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-semibold">Certifications</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">List professional industry certifications.</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => {
                      const updated = {
                        ...form,
                        certifications: [...form.certifications, { name: '', organization: '', date: '' }]
                      };
                      setForm(updated);
                      triggerAutoSave(updated);
                    }} className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> Add Certification
                    </Button>
                  </div>

                  <div className="space-y-4 pt-2">
                    {form.certifications.map((cert, idx) => (
                      <Card key={idx} className="border p-4 relative bg-background/50">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive absolute top-3 right-3 hover:bg-destructive/10"
                          onClick={() => {
                            const filtered = form.certifications.filter((_, i) => i !== idx);
                            const updated = { ...form, certifications: filtered };
                            setForm(updated);
                            triggerAutoSave(updated);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pr-6">
                          <div className="space-y-1.5">
                            <Label>Cert Name</Label>
                            <Input value={cert.name} onChange={e => handleArrayFieldChange('certifications', idx, 'name', e.target.value)} placeholder="e.g. AWS Solutions Architect" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Organization</Label>
                            <Input value={cert.organization} onChange={e => handleArrayFieldChange('certifications', idx, 'organization', e.target.value)} placeholder="e.g. Amazon Web Services" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Date</Label>
                            <Input value={cert.date} onChange={e => handleArrayFieldChange('certifications', idx, 'date', e.target.value)} placeholder="e.g. 2023" />
                          </div>
                        </div>
                      </Card>
                    ))}
                    {form.certifications.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">No certifications added yet. Click Add Certification above to add one.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Achievements step */}
              {activeStep === 'achievements' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-semibold">Achievements</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">List awards, hackathons, competitions, or research publications.</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => {
                      const updated = {
                        ...form,
                        achievements: [...form.achievements, '']
                      };
                      setForm(updated);
                      triggerAutoSave(updated);
                    }} className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> Add Award
                    </Button>
                  </div>

                  <div className="space-y-3 pt-2">
                    {form.achievements.map((ach, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input 
                          value={ach} 
                          onChange={e => {
                            const arr = [...form.achievements];
                            arr[idx] = e.target.value;
                            const updated = { ...form, achievements: arr };
                            setForm(updated);
                            triggerAutoSave(updated);
                          }} 
                          placeholder="e.g. Won 1st place in Smart India Hackathon 2023."
                          className="text-xs" 
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            const arr = form.achievements.filter((_, i) => i !== idx);
                            const updated = { ...form, achievements: arr };
                            setForm(updated);
                            triggerAutoSave(updated);
                          }}
                          className="h-8 w-8 text-destructive shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {form.achievements.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">No achievements added yet. Click Add Award above to add one.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Coding Profiles step */}
              {activeStep === 'coding' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold">Coding Profiles</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Provide usernames / handles for developers platforms (links will render cleanly).</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label>GitHub Username</Label>
                      <Input value={form.codingProfiles?.github || ''} onChange={e => handleFormChange('codingProfiles', 'github', e.target.value)} placeholder="username" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>LeetCode Username</Label>
                      <Input value={form.codingProfiles?.leetcode || ''} onChange={e => handleFormChange('codingProfiles', 'leetcode', e.target.value)} placeholder="username" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Codeforces Handle</Label>
                      <Input value={form.codingProfiles?.codeforces || ''} onChange={e => handleFormChange('codingProfiles', 'codeforces', e.target.value)} placeholder="handle" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>CodeChef Handle</Label>
                      <Input value={form.codingProfiles?.codechef || ''} onChange={e => handleFormChange('codingProfiles', 'codechef', e.target.value)} placeholder="handle" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>HackerRank Username</Label>
                      <Input value={form.codingProfiles?.hackerrank || ''} onChange={e => handleFormChange('codingProfiles', 'hackerrank', e.target.value)} placeholder="username" />
                    </div>
                  </div>
                </div>
              )}

              {/* Review & AI Optimization step */}
              {activeStep === 'review' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold">ATS Review & AI Analysis</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Let AI grade your resume, rewrite weak bullet points, and optimize for your target role.</p>
                  </div>

                  {/* Scores dashboard */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="bg-background/40 border p-4 text-center space-y-2">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground leading-none">ATS Score</p>
                      <div className={`text-2xl font-black ${scoreColor(form.analysis?.atsScore ?? 0)}`}>
                        {form.analysis?.atsScore ?? activeResume?.atsScore ?? 0}%
                      </div>
                      <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                        <div className={`h-full ${scoreColor(form.analysis?.atsScore ?? 0).replace('text-', 'bg-')}`} style={{ width: `${form.analysis?.atsScore ?? activeResume?.atsScore ?? 0}%` }}></div>
                      </div>
                    </Card>

                    <Card className="bg-background/40 border p-4 text-center space-y-2">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground leading-none">Completeness</p>
                      <div className={`text-2xl font-black ${scoreColor(form.analysis?.completenessScore ?? 0)}`}>
                        {form.analysis?.completenessScore ?? activeResume?.resumeScore ?? 0}%
                      </div>
                      <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                        <div className={`h-full ${scoreColor(form.analysis?.completenessScore ?? 0).replace('text-', 'bg-')}`} style={{ width: `${form.analysis?.completenessScore ?? activeResume?.resumeScore ?? 0}%` }}></div>
                      </div>
                    </Card>

                    <Card className="bg-background/40 border p-4 text-center space-y-2">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground leading-none">Keyword Match</p>
                      <div className={`text-2xl font-black ${scoreColor(form.analysis?.keywordMatchScore ?? 0)}`}>
                        {form.analysis?.keywordMatchScore ?? 0}%
                      </div>
                      <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                        <div className={`h-full ${scoreColor(form.analysis?.keywordMatchScore ?? 0).replace('text-', 'bg-')}`} style={{ width: `${form.analysis?.keywordMatchScore ?? 0}%` }}></div>
                      </div>
                    </Card>

                    <Card className="bg-background/40 border p-4 text-center space-y-2">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground leading-none">Content Quality</p>
                      <div className={`text-2xl font-black ${scoreColor(form.analysis?.contentQualityScore ?? 0)}`}>
                        {form.analysis?.contentQualityScore ?? 0}%
                      </div>
                      <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                        <div className={`h-full ${scoreColor(form.analysis?.contentQualityScore ?? 0).replace('text-', 'bg-')}`} style={{ width: `${form.analysis?.contentQualityScore ?? 0}%` }}></div>
                      </div>
                    </Card>
                  </div>

                  {/* AI Optimization Trigger */}
                  <div className="bg-muted/20 border border-border/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" /> Auto-Polish with AI
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-md">
                        Rewrites work descriptions using action verbs and highlights. Optimizes keywords for {form.career.targetRole || "Software Engineer"}.
                      </p>
                    </div>
                    <Button onClick={handleOptimizeAI} disabled={generateResume.isPending} size="sm" className="shrink-0 gap-1">
                      {generateResume.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                      {generateResume.isPending ? "Optimizing…" : "Optimize Now"}
                    </Button>
                  </div>

                  {/* Suggestions List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Actionable Recommendations</h4>
                    <div className="space-y-2">
                      {form.analysis?.suggestions && form.analysis.suggestions.length > 0 ? (
                        form.analysis.suggestions.map((sug, idx) => (
                          <div key={idx} className="flex gap-2.5 items-start bg-background p-3 rounded-lg border text-xs">
                            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <strong className="capitalize text-foreground font-semibold">{sug.category}: </strong>
                              <span className="text-muted-foreground">{sug.message}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 bg-muted/10 border border-dashed rounded-lg">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">No critical suggestions found! Run AI Optimization for deep review.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Template Preview and Export step */}
              {activeStep === 'preview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold">Choose Template & Export</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Select a template style, preview live, and download in PDF/DOCX format.</p>
                  </div>

                  {/* Template Picker Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 pt-2">
                    {[
                      { id: 'startup', name: 'Modern Pro', desc: 'indigo gradient' },
                      { id: 'internship', name: 'ATS Optimized', desc: 'pure black & white' },
                      { id: 'experienced', name: 'Executive', desc: 'elegant serif layout' },
                      { id: 'fresher', name: 'Minimal', desc: 'cyan thin details' },
                      { id: 'product', name: 'Tech Portfolio', desc: 'teal bold sidebar' }
                    ].map(tpl => {
                      const isSelected = activeResume.template === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          onClick={() => {
                            if (!activeResumeId) return;
                            updateResume.mutate({
                              id: activeResumeId,
                              data: { template: tpl.id as any }
                            }, {
                              onSuccess: () => {
                                queryClient.invalidateQueries({ queryKey: getGetResumesQueryKey() });
                              }
                            });
                          }}
                          className={`flex flex-col items-center text-center p-3 border rounded-xl transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                              : 'border-border bg-background/50 hover:bg-muted/30'
                          }`}
                        >
                          <FileText className={`h-8 w-8 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <p className="text-xs font-bold leading-tight truncate w-full">{tpl.name}</p>
                          <p className="text-[10px] text-muted-foreground leading-none mt-1 truncate w-full">{tpl.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Export Trigger Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <Button 
                      className="flex-1 gap-2" 
                      onClick={() => exportToPDF(activeResume.title, form, activeResume.template)}
                    >
                      <Download className="h-4 w-4" /> Export High-Quality PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2 border-primary/20 hover:bg-primary/5 text-primary hover:text-primary"
                      onClick={() => exportToDOCX(activeResume.title, form, activeResume.template)}
                    >
                      <FileText className="h-4 w-4" /> Export Editable DOCX
                    </Button>
                  </div>
                </div>
              )}

              {/* Back / Next Buttons */}
              <div className="flex justify-between items-center pt-6 border-t mt-4">
                <Button variant="outline" size="sm" onClick={handlePrev} disabled={stepIndex === 0} className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                
                <Button size="sm" onClick={handleNext} disabled={stepIndex === STEPS.length - 1} className="gap-1.5">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

            </div>

            {/* Live Preview Panel (Right Side on large monitors) */}
            <div className="xl:col-span-5 space-y-3">
              <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                <span>Live Resume Preview</span>
                <span className="capitalize font-medium text-foreground">{activeResume.template} Template</span>
              </div>
              <ResumePreview content={form} templateStyle={activeResume.template} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard List View
  return (
    <div className="space-y-6 pb-12">
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the resume and all its AI-optimized content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteResume.isPending ? "Deleting…" : "Delete Resume"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resume Builder</h1>
          <p className="text-muted-foreground">AI-assisted, ATS-optimized resumes with professional exports.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0"><Plus className="mr-2 h-4 w-4" /> New Resume</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Resume</DialogTitle>
              <DialogDescription>Choose a baseline template. Fill in details manually or load with AI.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Resume Name / Label</Label>
                <Input placeholder="e.g. Fullstack Engineer — Microsoft" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Baseline Template Layout</Label>
                <Select value={template} onValueChange={(v) => setTemplate(v as ResumeInputTemplate)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Modern Professional — indigo accents</SelectItem>
                    <SelectItem value="internship">ATS Optimized — black & white classic</SelectItem>
                    <SelectItem value="experienced">Executive — elegant centered serif</SelectItem>
                    <SelectItem value="fresher">Minimal — simple cyan styling</SelectItem>
                    <SelectItem value="product">Tech Portfolio — teal columns & profiles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createResume.isPending || !title}>
                  {createResume.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[320px] rounded-xl" />)}
        </div>
      ) : resumes && resumes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map(resume => (
            <Card key={resume.id} className="flex flex-col group overflow-hidden">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-lg line-clamp-2 leading-tight">{resume.title}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-destructive/10" 
                    onClick={() => setDeleteId(resume.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                  <Badge variant="outline" className="capitalize text-xs font-normal">{resume.template}</Badge>
                  <span>•</span>
                  <span>Updated {format(new Date(resume.updatedAt), 'MMM d, yyyy')}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 py-5 space-y-4">
                <div className="flex justify-center mb-1">
                  <div className="relative h-24 w-16 bg-white border border-border/80 shadow-md rounded flex items-center justify-center overflow-hidden">
                    <FileText className="h-8 w-8 text-muted-foreground/30" />
                    {resume.content && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/70 flex items-end justify-center pb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Resume Score</span>
                      <span className={`font-semibold ${scoreColor(resume.resumeScore ?? 0)}`}>{resume.resumeScore ?? 0}/100</span>
                    </div>
                    <Progress value={resume.resumeScore ?? 0} className={`h-1.5 ${progressBg(resume.resumeScore ?? 0)}`} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">ATS Compatibility</span>
                      <span className={`font-semibold ${scoreColor(resume.atsScore ?? 0)}`}>{resume.atsScore ?? 0}%</span>
                    </div>
                    <Progress value={resume.atsScore ?? 0} className={`h-1.5 ${progressBg(resume.atsScore ?? 0)}`} />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-0 flex border-t bg-muted/10 divide-x">
                <Button
                  variant="ghost"
                  className="flex-1 rounded-none h-11 text-xs text-primary hover:bg-primary/5 gap-1"
                  onClick={() => {
                    setActiveResumeId(resume.id);
                    setActiveStep('profile');
                  }}
                >
                  <FileText className="h-3.5 w-3.5" /> Edit
                </Button>
                
                <Button
                  variant="ghost"
                  className="flex-1 rounded-none h-11 text-xs hover:bg-accent/40 gap-1"
                  onClick={() => handleDuplicate(resume)}
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </Button>

                <Button
                  variant="ghost"
                  className="flex-1 rounded-none h-11 text-xs text-teal-600 hover:text-teal-600 hover:bg-teal-500/5 gap-1"
                  onClick={() => {
                    setActiveResumeId(resume.id);
                    setActiveStep('preview');
                  }}
                  disabled={!resume.content}
                >
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">No Resumes Yet</h3>
          <p className="text-muted-foreground mt-2 max-w-md mb-8">
            Create your first ATS-friendly resume. Use our step-by-step wizard to construct detailed profiles and optimize them using AI.
          </p>
          <Button size="lg" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-5 w-5" /> Create First Resume
          </Button>
        </Card>
      )}
    </div>
  );
}

// Sub-component for Live Preview
function ResumePreview({ content, templateStyle }: { content: FormState; templateStyle: string }) {
  const colors = {
    fresher: { text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-700/20", bg: "bg-cyan-50 dark:bg-cyan-950/20" },
    experienced: { text: "text-slate-900 dark:text-slate-200", border: "border-slate-800/10", bg: "bg-slate-50 dark:bg-slate-900/10" },
    product: { text: "text-teal-700 dark:text-teal-400", border: "border-teal-600/20", bg: "bg-teal-50 dark:bg-teal-950/20" },
    startup: { text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-600/20", bg: "bg-indigo-50 dark:bg-indigo-950/20" },
    internship: { text: "text-neutral-950 dark:text-neutral-50", border: "border-neutral-800/10", bg: "bg-neutral-50 dark:bg-neutral-900/10" },
  }[templateStyle] || { text: "text-cyan-700", border: "border-cyan-600/20", bg: "bg-cyan-50" };

  const p = content.profile ?? {};
  const c = content.career ?? {};

  return (
    <div className="w-full bg-white text-slate-800 p-6 shadow-inner border rounded-xl space-y-5 max-h-[720px] overflow-y-auto font-sans leading-relaxed text-xs">
      {/* Header */}
      <div className={`border-b pb-3 ${colors.border} ${templateStyle === 'experienced' ? 'text-center' : 'text-left'}`}>
        <h2 className="text-xl font-bold text-slate-900 leading-tight">{p.name || "Developer Name"}</h2>
        {c.targetRole && <p className={`text-xs font-semibold mt-0.5 ${colors.text}`}>{c.targetRole}</p>}
        <div className={`flex flex-wrap gap-x-2 gap-y-0.5 justify-start items-center text-[10px] text-slate-500 mt-2 ${templateStyle === 'experienced' ? 'justify-center' : 'justify-start'}`}>
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>• {p.phone}</span>}
          {p.location && <span>• {p.location}</span>}
        </div>
        <div className={`flex flex-wrap gap-x-2 gap-y-0.5 justify-start items-center text-[10px] text-blue-500 mt-1 ${templateStyle === 'experienced' ? 'justify-center' : 'justify-start'}`}>
          {p.linkedin && <a href={`https://${p.linkedin}`} target="_blank" rel="noreferrer" className="hover:underline">{p.linkedin}</a>}
          {p.github && <a href={`https://${p.github}`} target="_blank" rel="noreferrer" className="hover:underline">{p.github}</a>}
          {p.portfolio && <a href={`https://${p.portfolio}`} target="_blank" rel="noreferrer" className="hover:underline">{p.portfolio}</a>}
        </div>
      </div>

      {/* Summary */}
      {(c.summary || c.objective) && (
        <div className="space-y-1">
          <h4 className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>Professional Summary</h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">{c.summary || c.objective}</p>
        </div>
      )}

      {/* Work Experience */}
      {content.experience?.length > 0 && (
        <div className="space-y-3">
          <h4 className={`text-[10px] font-bold uppercase tracking-wider ${colors.text} border-b pb-0.5 ${colors.border}`}>Experience</h4>
          {content.experience.map((exp, idx) => {
            if (!exp.company && !exp.role) return null;
            return (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-medium text-slate-900 text-[11px]">
                  <span><strong>{exp.role || "Role"}</strong> @ {exp.company || "Company"}</span>
                  <span className="text-slate-500 font-normal">{exp.duration}</span>
                </div>
                {exp.techUsed?.length > 0 && (
                  <div className="flex flex-wrap gap-1 py-0.5">
                    {exp.techUsed.map((t, i) => (
                      <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono">{t}</span>
                    ))}
                  </div>
                )}
                <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 pl-1">
                  {exp.points?.filter(Boolean).map((pt, i) => <li key={i} className="leading-relaxed">{pt}</li>)}
                  {exp.achievements?.filter(Boolean).map((ac, i) => <li key={i} className="leading-relaxed list-none text-teal-600">★ {ac}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* Projects */}
      {content.projects?.length > 0 && (
        <div className="space-y-3">
          <h4 className={`text-[10px] font-bold uppercase tracking-wider ${colors.text} border-b pb-0.5 ${colors.border}`}>Projects</h4>
          {content.projects.map((proj, idx) => {
            if (!proj.name) return null;
            return (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-medium text-slate-900 text-[11px]">
                  <span><strong>{proj.name}</strong></span>
                  <span className="text-slate-500 font-normal text-[10px]">
                    {proj.link && <span className="mr-2">GitHub</span>}
                    {proj.liveDemo && <span>Demo</span>}
                  </span>
                </div>
                {proj.tech?.length > 0 && (
                  <div className="flex flex-wrap gap-1 py-0.5">
                    {proj.tech.map((t, i) => (
                      <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono">{t}</span>
                    ))}
                  </div>
                )}
                {proj.description && <p className="text-[11px] text-slate-600 leading-relaxed">{proj.description}</p>}
                {proj.highlights?.length > 0 && (
                  <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 pl-1">
                    {proj.highlights.filter(Boolean).map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Skills */}
      {content.skills && (
        <div className="space-y-1.5">
          <h4 className={`text-[10px] font-bold uppercase tracking-wider ${colors.text} border-b pb-0.5 ${colors.border}`}>Technical Skills</h4>
          <div className="grid grid-cols-1 gap-1 text-[11px]">
            {Object.entries(content.skills).map(([cat, vals]) => {
              if (!vals || vals.length === 0) return null;
              return (
                <div key={cat} className="flex gap-2">
                  <span className="font-semibold text-slate-700 capitalize min-w-[90px]">{cat.replace('_', '/')}:</span>
                  <span className="text-slate-600">{vals.join(', ')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Education */}
      {content.education?.length > 0 && (
        <div className="space-y-2">
          <h4 className={`text-[10px] font-bold uppercase tracking-wider ${colors.text} border-b pb-0.5 ${colors.border}`}>Education</h4>
          {content.education.map((edu, idx) => {
            if (!edu.degree && !edu.institution) return null;
            return (
              <div key={idx} className="flex justify-between text-[11px]">
                <div>
                  <p className="font-semibold text-slate-900">{edu.degree}</p>
                  <p className="text-slate-600">{edu.institution}</p>
                  {edu.achievements?.filter(Boolean).map((a, i) => <p key={i} className="text-slate-500 text-[10px]">• {a}</p>)}
                </div>
                <div className="text-right text-slate-500">
                  <p>{edu.year}</p>
                  {edu.gpa && <p className="font-semibold text-slate-700">GPA: {edu.gpa}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Certifications & Achievements */}
      {(content.certifications?.length > 0 || content.achievements?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {content.certifications?.length > 0 && (
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-wider ${colors.text} border-b pb-0.5 ${colors.border} mb-1.5`}>Certifications</h4>
              <ul className="space-y-1 text-[11px] text-slate-600">
                {content.certifications.map((c, idx) => {
                  if (!c.name) return null;
                  return (
                    <li key={idx}>
                      <strong>{c.name}</strong> — {c.organization} {c.date ? `(${c.date})` : ''}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {content.achievements?.length > 0 && (
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-wider ${colors.text} border-b pb-0.5 ${colors.border} mb-1.5`}>Achievements</h4>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                {content.achievements.filter(Boolean).map((a, idx) => (
                  <li key={idx} className="leading-relaxed">{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
