import { 
  useGetResumes, 
  useCreateResume, 
  useDeleteResume,
  useGenerateResume 
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Trash2, Wand2, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { getGetResumesQueryKey } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { type ResumeInputTemplate } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

type ResumeContent = {
  profile?: { name?: string; email?: string; phone?: string; location?: string; linkedin?: string; github?: string; portfolio?: string };
  summary?: string;
  education?: Array<{ degree?: string; institution?: string; year?: string; gpa?: string; achievements?: string[] }>;
  skills?: { languages?: string[]; frameworks?: string[]; databases?: string[]; tools?: string[]; cloud?: string[] };
  projects?: Array<{ name?: string; description?: string; tech?: string[]; link?: string; highlights?: string[] }>;
  experience?: Array<{ company?: string; role?: string; duration?: string; points?: string[] }>;
  achievements?: string[];
  certifications?: string[];
};

async function exportToPDF(resumeId: number, resumeTitle: string, content: ResumeContent) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const profile = content.profile ?? {};
  const marginL = 18, marginR = 18, pageW = 210;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const addLine = (text: string, size: number, bold: boolean, color: [number, number, number] = [30, 30, 30]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    doc.text(text, marginL, y);
    y += size * 0.45;
  };

  const addSection = (title: string) => {
    y += 3;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(title.toUpperCase(), marginL, y);
    y += 1;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginL, y, marginL + contentW, y);
    y += 4;
  };

  const addBullet = (text: string) => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(`• ${text}`, contentW - 4);
    doc.text(lines, marginL + 2, y);
    y += lines.length * 4;
  };

  const checkPage = (needed = 10) => {
    if (y + needed > 280) { doc.addPage(); y = 18; }
  };

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(profile.name ?? resumeTitle, marginL, y); y += 8;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  const contactParts = [profile.email, profile.phone, profile.location].filter(Boolean);
  if (contactParts.length) { doc.text(contactParts.join('  |  '), marginL, y); y += 4; }
  const linkParts = [profile.linkedin, profile.github, profile.portfolio].filter(Boolean);
  if (linkParts.length) { doc.text(linkParts.join('  |  '), marginL, y); y += 4; }
  y += 2;

  // Summary
  if (content.summary) {
    addSection('Summary');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(content.summary, contentW);
    doc.text(lines, marginL, y);
    y += lines.length * 4 + 1;
  }

  // Education
  if (content.education?.length) {
    checkPage(20); addSection('Education');
    for (const edu of content.education) {
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
      doc.text(edu.degree ?? '', marginL, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
      const rightText = [edu.year, edu.gpa ? `GPA: ${edu.gpa}` : ''].filter(Boolean).join(' · ');
      if (rightText) doc.text(rightText, pageW - marginR, y, { align: 'right' });
      y += 4;
      doc.setFontSize(8.5); doc.text(edu.institution ?? '', marginL, y); y += 3;
      for (const a of edu.achievements ?? []) addBullet(a);
      y += 1;
    }
  }

  // Skills
  const skills = content.skills;
  if (skills) {
    checkPage(20); addSection('Technical Skills');
    const rows = [
      skills.languages?.length ? `Languages: ${skills.languages.join(', ')}` : '',
      skills.frameworks?.length ? `Frameworks: ${skills.frameworks.join(', ')}` : '',
      skills.databases?.length ? `Databases: ${skills.databases.join(', ')}` : '',
      skills.tools?.length ? `Tools: ${skills.tools.join(', ')}` : '',
      skills.cloud?.length ? `Cloud: ${skills.cloud.join(', ')}` : '',
    ].filter(Boolean);
    for (const row of rows) {
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
      const lines = doc.splitTextToSize(row, contentW);
      doc.text(lines, marginL, y);
      y += lines.length * 4;
    }
    y += 1;
  }

  // Experience
  if (content.experience?.length) {
    checkPage(20); addSection('Experience');
    for (const exp of content.experience) {
      checkPage(15);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
      doc.text(`${exp.role ?? ''} — ${exp.company ?? ''}`, marginL, y);
      doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(90, 90, 90);
      if (exp.duration) doc.text(exp.duration, pageW - marginR, y, { align: 'right' });
      y += 4;
      for (const pt of exp.points ?? []) { checkPage(6); addBullet(pt); }
      y += 1;
    }
  }

  // Projects
  if (content.projects?.length) {
    checkPage(20); addSection('Projects');
    for (const proj of content.projects) {
      checkPage(15);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
      doc.text(proj.name ?? '', marginL, y);
      if (proj.link) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 120, 200);
        doc.text(proj.link, pageW - marginR, y, { align: 'right' });
      }
      y += 4;
      if (proj.tech?.length) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
        doc.text(proj.tech.join(', '), marginL, y); y += 4;
      }
      if (proj.description) { checkPage(6); addBullet(proj.description); }
      for (const h of proj.highlights ?? []) { checkPage(6); addBullet(h); }
      y += 1;
    }
  }

  // Achievements
  if (content.achievements?.length) {
    checkPage(20); addSection('Achievements & Competitive Programming');
    for (const a of content.achievements) { checkPage(6); addBullet(a); }
  }

  // Certifications
  if (content.certifications?.length) {
    checkPage(20); addSection('Certifications');
    for (const c of content.certifications) { checkPage(6); addBullet(c); }
  }

  doc.save(`${resumeTitle.replace(/\s+/g, '_')}.pdf`);
}

export default function ResumePage() {
  const { data: resumes, isLoading } = useGetResumes();
  const createResume = useCreateResume();
  const deleteResume = useDeleteResume();
  const generateResume = useGenerateResume();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<ResumeInputTemplate>('fresher');
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !template) return;
    createResume.mutate({ data: { title, template } }, {
      onSuccess: () => {
        setIsAddOpen(false); setTitle('');
        queryClient.invalidateQueries({ queryKey: getGetResumesQueryKey() });
        toast({ title: "Resume created", description: "Now click Generate to fill it with AI content." });
      }
    });
  };

  const handleConfirmDelete = () => {
    if (deleteId === null) return;
    deleteResume.mutate({ id: deleteId }, {
      onSuccess: () => {
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: getGetResumesQueryKey() });
        toast({ title: "Resume deleted" });
      }
    });
  };

  const handleGenerate = (id: number) => {
    toast({ title: "Generating resume…", description: "AI is building your resume from your real profile data." });
    generateResume.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetResumesQueryKey() });
        toast({ title: "✓ Resume generated!", description: "AI has filled all sections. Click Export PDF to download." });
      },
      onError: () => {
        toast({ title: "Generation failed", description: "Connect GitHub and analyze skills first for best results.", variant: "destructive" });
      }
    });
  };

  const handleExportPDF = async (resume: NonNullable<typeof resumes>[number]) => {
    if (!resume.content) {
      toast({ title: "No content", description: "Generate the resume first.", variant: "destructive" });
      return;
    }
    setExportingId(resume.id);
    try {
      await exportToPDF(resume.id, resume.title, resume.content as ResumeContent);
      toast({ title: "✓ PDF downloaded", description: `${resume.title}.pdf saved to your downloads.` });
    } catch {
      toast({ title: "Export failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setExportingId(null);
    }
  };

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="space-y-6 pb-12">
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the resume and all its AI-generated content. This action cannot be undone.
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
          <p className="text-muted-foreground">AI-generated, ATS-optimised resumes built from your real data.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0"><Plus className="mr-2 h-4 w-4" /> New Resume</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Resume</DialogTitle>
              <DialogDescription>Choose a template. AI will generate content from your profile.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Resume Name</label>
                <Input placeholder="e.g. Backend Engineer — Razorpay" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Template</label>
                <Select value={template} onValueChange={(v) => setTemplate(v as ResumeInputTemplate)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fresher">Fresher — Projects & Skills focused</SelectItem>
                    <SelectItem value="experienced">Experienced — Impact & Architecture</SelectItem>
                    <SelectItem value="startup">Startup — Generalist & Fast-paced</SelectItem>
                    <SelectItem value="internship">Internship — Academic & Coding</SelectItem>
                    <SelectItem value="product">Product Company — System design focused</SelectItem>
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => setDeleteId(resume.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className="capitalize text-xs font-normal">{resume.template}</Badge>
                  <span>•</span>
                  <span>Updated {format(new Date(resume.updatedAt), 'MMM d, yyyy')}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 py-5">
                <div className="flex justify-center mb-5">
                  <div className="relative h-28 w-20 bg-white border shadow-md rounded flex items-center justify-center overflow-hidden">
                    <FileText className="h-9 w-9 text-muted-foreground/25" />
                    {resume.content && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/60 flex items-end justify-center pb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Content Score</span>
                      <span className={`font-semibold ${scoreColor(resume.resumeScore ?? 0)}`}>{resume.resumeScore ?? 0}/100</span>
                    </div>
                    <Progress value={resume.resumeScore ?? 0} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">ATS Compatibility</span>
                      <span className={`font-semibold ${scoreColor(resume.atsScore ?? 0)}`}>{resume.atsScore ?? 0}%</span>
                    </div>
                    <Progress value={resume.atsScore ?? 0} className="h-1.5" />
                  </div>
                </div>

                {!resume.content && (
                  <p className="text-xs text-muted-foreground text-center mt-4 flex items-center gap-1 justify-center">
                    <AlertCircle className="h-3 w-3" /> Click Generate to fill with AI content
                  </p>
                )}
              </CardContent>

              <CardFooter className="p-0 flex border-t">
                <Button
                  variant="ghost"
                  className="flex-1 rounded-none h-12 text-primary hover:text-primary hover:bg-primary/5"
                  onClick={() => handleGenerate(resume.id)}
                  disabled={generateResume.isPending}
                >
                  {generateResume.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
                    : <><Wand2 className="mr-2 h-4 w-4" />{resume.content ? 'Regenerate' : 'Generate'}</>}
                </Button>
                <div className="w-px bg-border" />
                <Button
                  variant="ghost"
                  className="flex-1 rounded-none h-12 disabled:opacity-40"
                  disabled={!resume.content || exportingId === resume.id}
                  onClick={() => handleExportPDF(resume)}
                >
                  {exportingId === resume.id
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporting…</>
                    : <><Download className="mr-2 h-4 w-4" />Export PDF</>}
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
            Create your first ATS-friendly resume. AI pulls from your GitHub, skills, and competitive programming data.
          </p>
          <Button size="lg" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-5 w-5" /> Create First Resume
          </Button>
        </Card>
      )}
    </div>
  );
}
