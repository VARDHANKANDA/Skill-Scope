import { type FormState } from '@/pages/resume';

// Helper to sanitize filename
function getSanitizedFilename(title: string, ext: string): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.${ext}`;
}

// Colors for templates
const TEMPLATE_COLORS: Record<string, { primary: [number, number, number]; primaryHex: string; secondary: [number, number, number]; secondaryHex: string }> = {
  fresher: { primary: [14, 116, 144], primaryHex: "0E7490", secondary: [71, 85, 105], secondaryHex: "475569" }, // Minimal - Cyan/Slate
  experienced: { primary: [15, 23, 42], primaryHex: "0F172A", secondary: [71, 85, 105], secondaryHex: "475569" }, // Executive - Dark Slate
  product: { primary: [13, 148, 136], primaryHex: "0D9488", secondary: [100, 116, 139], secondaryHex: "64748B" }, // Tech Portfolio - Teal
  startup: { primary: [79, 70, 229], primaryHex: "4F46E5", secondary: [109, 40, 217], secondaryHex: "6D28D9" }, // Modern Professional - Indigo/Purple
  internship: { primary: [0, 0, 0], primaryHex: "000000", secondary: [51, 51, 51], secondaryHex: "333333" }, // ATS Optimized - Black/Gray
};

// ─── PDF EXPORT ───
export async function exportToPDF(title: string, content: FormState, templateStyle: string) {
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  const colors = TEMPLATE_COLORS[templateStyle] || TEMPLATE_COLORS.fresher;
  const marginL = 15;
  const marginR = 15;
  const pageW = 210;
  const contentW = pageW - marginL - marginR;
  let y = 18;

  const checkPage = (needed = 10) => {
    if (y + needed > 278) {
      doc.addPage();
      y = 15;
    }
  };

  const addBulletPoint = (text: string, bulletChar = "•") => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const splitText = doc.splitTextToSize(`${bulletChar} ${text}`, contentW - 5);
    checkPage(splitText.length * 4);
    doc.text(splitText, marginL + 3, y);
    y += splitText.length * 4.2;
  };

  const addSectionHeader = (heading: string) => {
    y += 5;
    checkPage(12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    
    doc.text(heading.toUpperCase(), marginL, y);
    y += 1.5;
    
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.35);
    doc.line(marginL, y, marginL + contentW, y);
    y += 4;
  };

  const profile = content.profile ?? {};
  const career = content.career ?? {};

  if (templateStyle === 'experienced') { 
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(profile.name ?? title, pageW / 2, y, { align: 'center' });
    y += 6;

    if (career.targetRole) {
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.secondary);
      doc.text(career.targetRole.toUpperCase(), pageW / 2, y, { align: 'center' });
      y += 5;
    }

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const contacts = [profile.email, profile.phone, profile.location].filter(Boolean);
    doc.text(contacts.join('  •  '), pageW / 2, y, { align: 'center' });
    y += 4;

    const links = [profile.linkedin, profile.github, profile.portfolio].filter(Boolean);
    if (links.length) {
      doc.text(links.join('  |  '), pageW / 2, y, { align: 'center' });
      y += 6;
    }
  } else if (templateStyle === 'product') { 
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(profile.name ?? title, marginL, y);
    
    if (career.targetRole) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...colors.secondary);
      doc.text(career.targetRole, pageW - marginR, y, { align: 'right' });
    }
    y += 7;

    doc.setDrawColor(...colors.secondary);
    doc.setLineWidth(0.5);
    doc.line(marginL, y - 2, marginL + 30, y - 2);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 70, 70);
    doc.text([profile.email, profile.phone, profile.location].filter(Boolean).join('  |  '), marginL, y);
    y += 4;

    const githubHandle = content.codingProfiles?.github || profile.github;
    const codingLinks = [githubHandle ? `GitHub: ${githubHandle}` : null, content.codingProfiles?.leetcode ? `LeetCode: ${content.codingProfiles.leetcode}` : null, profile.portfolio ? `Portfolio: ${profile.portfolio}` : null].filter(Boolean);
    if (codingLinks.length) {
      doc.text(codingLinks.join('  •  '), marginL, y);
      y += 6;
    }
  } else { 
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(profile.name ?? title, marginL, y);
    
    if (career.targetRole) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.secondary);
      doc.text(career.targetRole, marginL, y + 5);
      y += 5;
    }
    y += 6;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const contactParts = [profile.email, profile.phone, profile.location].filter(Boolean);
    if (contactParts.length) {
      doc.text(contactParts.join('  |  '), marginL, y);
      y += 4;
    }
    const linkParts = [profile.linkedin, profile.github, profile.portfolio].filter(Boolean);
    if (linkParts.length) {
      doc.text(linkParts.join('  |  '), marginL, y);
      y += 5;
    }
  }

  const summaryText = career.summary;
  if (summaryText) {
    addSectionHeader("Professional Summary");
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(summaryText, contentW);
    checkPage(lines.length * 4);
    doc.text(lines, marginL, y);
    y += lines.length * 4 + 2;
  }

  if (content.experience?.length) {
    addSectionHeader("Work Experience");
    for (const exp of content.experience) {
      checkPage(18);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(`${exp.role} — ${exp.company}`, marginL, y);
      
      if (exp.duration) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(90, 90, 90);
        doc.text(exp.duration, pageW - marginR, y, { align: 'right' });
      }
      y += 4.5;

      if (exp.techUsed?.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...colors.secondary);
        doc.text(`Technologies: ${exp.techUsed.join(', ')}`, marginL, y);
        y += 4;
      }

      const points = exp.points || [];
      for (const pt of points) {
        addBulletPoint(pt);
      }
      
      const achs = exp.achievements || [];
      for (const ac of achs) {
        addBulletPoint(ac, "★");
      }
      y += 1.5;
    }
  }

  if (content.projects?.length) {
    addSectionHeader("Projects");
    for (const proj of content.projects) {
      checkPage(18);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(proj.name ?? '', marginL, y);

      const urlText = [proj.link, proj.liveDemo].filter(Boolean).join('  |  ');
      if (urlText) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(60, 100, 180);
        doc.text(urlText, pageW - marginR, y, { align: 'right' });
      }
      y += 4;

      if (proj.tech?.length) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text(`Tech Stack: ${proj.tech.join(', ')}`, marginL, y);
        y += 4.5;
      }

      if (proj.description) {
        addBulletPoint(proj.description);
      }
      for (const h of proj.highlights ?? []) {
        addBulletPoint(h);
      }
      y += 1.5;
    }
  }

  const skills = content.skills;
  if (skills && (
    (skills.languages && skills.languages.length > 0) ||
    (skills.frameworks && skills.frameworks.length > 0) ||
    (skills.libraries && skills.libraries.length > 0) ||
    (skills.databases && skills.databases.length > 0) ||
    (skills.cloud && skills.cloud.length > 0) ||
    (skills.devops && skills.devops.length > 0) ||
    (skills.ai_ml && skills.ai_ml.length > 0) ||
    (skills.tools && skills.tools.length > 0) ||
    (skills.other && skills.other.length > 0)
  )) {
    addSectionHeader("Technical Skills");
    const skillCategories = [
      { label: "Languages", data: skills.languages },
      { label: "Frameworks", data: skills.frameworks },
      { label: "Libraries", data: skills.libraries },
      { label: "Databases", data: skills.databases },
      { label: "Cloud Platforms", data: skills.cloud },
      { label: "DevOps/Infra", data: skills.devops },
      { label: "AI/ML", data: skills.ai_ml },
      { label: "Tools", data: skills.tools },
      { label: "Other Skills", data: skills.other }
    ];

    for (const cat of skillCategories) {
      if (cat.data && cat.data.length > 0) {
        checkPage(5);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(`${cat.label}: `, marginL, y);

        const labelW = doc.getTextWidth(`${cat.label}: `);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 70, 70);
        
        const textVal = cat.data.join(', ');
        const textLines = doc.splitTextToSize(textVal, contentW - labelW);
        
        doc.text(textLines, marginL + labelW, y);
        y += textLines.length * 4.2;
      }
    }
    y += 1.5;
  }

  if (content.education?.length) {
    addSectionHeader("Education");
    for (const edu of content.education) {
      checkPage(15);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(edu.degree ?? '', marginL, y);
      
      const rightText = [edu.year, edu.gpa ? `GPA: ${edu.gpa}` : ''].filter(Boolean).join(' · ');
      if (rightText) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(90, 90, 90);
        doc.text(rightText, pageW - marginR, y, { align: 'right' });
      }
      y += 4;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(edu.institution ?? '', marginL, y);
      y += 4;

      for (const a of edu.achievements ?? []) {
        addBulletPoint(a);
      }
      y += 1;
    }
  }

  if (content.certifications?.length) {
    addSectionHeader("Certifications");
    for (const cert of content.certifications) {
      checkPage(6);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      
      const dateText = cert.date ? ` — ${cert.date}` : '';
      const certText = `${cert.name} (${cert.organization})${dateText}`;
      
      addBulletPoint(certText, "✓");
    }
    y += 1.5;
  }

  if (content.achievements?.length) {
    addSectionHeader("Achievements & Competitions");
    for (const ach of content.achievements) {
      addBulletPoint(ach, "🏆");
    }
  }

  doc.save(getSanitizedFilename(title, 'pdf'));
}

// ─── DOCX EXPORT ───
export async function exportToDOCX(title: string, content: FormState, templateStyle: string) {
  const docx = await import('docx');
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, HeadingLevel } = docx;

  const colors = TEMPLATE_COLORS[templateStyle] || TEMPLATE_COLORS.fresher;
  const profile = content.profile ?? {};
  const career = content.career ?? {};

  const createSpacer = (size = 100) => new Paragraph({
    spacing: { before: size, after: 0 }
  });

  const createSectionHeader = (text: string) => {
    return [
      createSpacer(120),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: text.toUpperCase(),
            bold: true,
            size: 19, 
            color: colors.primaryHex,
            font: "Arial"
          })
        ],
        spacing: { before: 80, after: 40 },
        border: {
          bottom: {
            color: colors.primaryHex,
            space: 3,
            size: 6,
            style: BorderStyle.SINGLE
          }
        }
      })
    ];
  };

  const children: any[] = [];

  if (templateStyle === 'experienced') { 
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: profile.name ?? title,
            bold: true,
            size: 40, 
            color: colors.primaryHex,
            font: "Arial"
          })
        ],
        spacing: { after: 60 }
      })
    );

    if (career.targetRole) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: career.targetRole.toUpperCase(),
              bold: true,
              size: 21, 
              color: colors.secondaryHex,
              font: "Arial"
            })
          ],
          spacing: { after: 100 }
        })
      );
    }

    const contacts = [profile.email, profile.phone, profile.location].filter(Boolean);
    const links = [profile.linkedin, profile.github, profile.portfolio].filter(Boolean);

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: contacts.join("   •   "),
            size: 17, 
            color: "444444",
            font: "Arial"
          })
        ],
        spacing: { after: 40 }
      })
    );

    if (links.length) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: links.join("   |   "),
              size: 17,
              color: "444444",
              font: "Arial"
            })
          ],
          spacing: { after: 120 }
        })
      );
    }
  } else { 
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: profile.name ?? title,
            bold: true,
            size: 36, 
            color: colors.primaryHex,
            font: "Arial"
          })
        ]
      })
    );

    if (career.targetRole) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: career.targetRole,
              bold: true,
              size: 20, 
              color: colors.secondaryHex,
              font: "Arial"
            })
          ],
          spacing: { after: 60 }
        })
      );
    }

    const contacts = [profile.email, profile.phone, profile.location].filter(Boolean);
    const links = [profile.linkedin, profile.github, profile.portfolio].filter(Boolean);

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contacts.join("   |   "),
            size: 17,
            color: "333333",
            font: "Arial"
          })
        ]
      })
    );

    if (links.length) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: links.join("   |   "),
              size: 17,
              color: "333333",
              font: "Arial"
            })
          ],
          spacing: { after: 100 }
        })
      );
    }
  }

  const summaryText = career.summary;
  if (summaryText) {
    children.push(...createSectionHeader("Professional Summary"));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: summaryText,
            size: 17,
            font: "Arial",
            color: "222222"
          })
        ],
        spacing: { before: 80, after: 80 }
      })
    );
  }

  if (content.experience?.length) {
    children.push(...createSectionHeader("Work Experience"));
    for (const exp of content.experience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${exp.role}  —  ${exp.company}`,
              bold: true,
              size: 18,
              font: "Arial",
              color: "111111"
            }),
            new TextRun({
              text: `\t${exp.duration ?? ""}`,
              italics: true,
              size: 17,
              font: "Arial",
              color: "555555"
            })
          ],
          tabStops: [
            {
              type: "right" as any,
              position: 9000 
            }
          ],
          spacing: { before: 100, after: 40 }
        })
      );

      if (exp.techUsed?.length) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Technologies: ${exp.techUsed.join(", ")}`,
                bold: true,
                size: 16,
                font: "Arial",
                color: colors.secondaryHex
              })
            ],
            spacing: { before: 20, after: 40 }
          })
        );
      }

      for (const pt of exp.points ?? []) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: pt,
                size: 17,
                font: "Arial",
                color: "333333"
              })
            ],
            spacing: { before: 30, after: 30 }
          })
        );
      }

      for (const ac of exp.achievements ?? []) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: `Achievement: ${ac}`,
                size: 17,
                bold: true,
                font: "Arial",
                color: "222222"
              })
            ],
            spacing: { before: 30, after: 30 }
          })
        );
      }
    }
  }

  if (content.projects?.length) {
    children.push(...createSectionHeader("Projects"));
    for (const proj of content.projects) {
      const projLinks = [proj.link, proj.liveDemo].filter(Boolean).join("  |  ");
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: proj.name ?? "",
              bold: true,
              size: 18,
              font: "Arial",
              color: "111111"
            }),
            new TextRun({
              text: `\t${projLinks}`,
              size: 16,
              font: "Arial",
              color: "4f5e7f"
            })
          ],
          tabStops: [{ type: "right" as any, position: 9000 }],
          spacing: { before: 100, after: 40 }
        })
      );

      if (proj.tech?.length) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Tech Stack: ${proj.tech.join(", ")}`,
                italics: true,
                size: 16,
                font: "Arial",
                color: "555555"
              })
            ],
            spacing: { after: 40 }
          })
        );
      }

      if (proj.description) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: proj.description,
                size: 17,
                font: "Arial",
                color: "333333"
              })
            ],
            spacing: { before: 20, after: 20 }
          })
        );
      }

      for (const h of proj.highlights ?? []) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: h,
                size: 17,
                font: "Arial",
                color: "333333"
              })
            ],
            spacing: { before: 20, after: 20 }
          })
        );
      }
    }
  }

  const sk = content.skills;
  if (sk) {
    const cats = [
      { label: "Languages", val: sk.languages },
      { label: "Frameworks", val: sk.frameworks },
      { label: "Libraries", val: sk.libraries },
      { label: "Databases", val: sk.databases },
      { label: "Cloud Platforms", val: sk.cloud },
      { label: "DevOps", val: sk.devops },
      { label: "AI/ML", val: sk.ai_ml },
      { label: "Tools", val: sk.tools },
      { label: "Other", val: sk.other }
    ].filter(c => c.val && c.val.length > 0);

    if (cats.length > 0) {
      children.push(...createSectionHeader("Technical Skills"));
      for (const c of cats) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${c.label}: `,
                bold: true,
                size: 17,
                font: "Arial",
                color: "333333"
              }),
              new TextRun({
                text: c.val!.join(", "),
                size: 17,
                font: "Arial",
                color: "555555"
              })
            ],
            spacing: { before: 40, after: 40 }
          })
        );
      }
    }
  }

  if (content.education?.length) {
    children.push(...createSectionHeader("Education"));
    for (const edu of content.education) {
      const rightText = [edu.year, edu.gpa ? `GPA: ${edu.gpa}` : ""].filter(Boolean).join(" · ");
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree ?? "",
              bold: true,
              size: 18,
              font: "Arial",
              color: "111111"
            }),
            new TextRun({
              text: `\t${rightText}`,
              italics: true,
              size: 17,
              font: "Arial",
              color: "555555"
            })
          ],
          tabStops: [{ type: "right" as any, position: 9000 }],
          spacing: { before: 80, after: 40 }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.institution ?? "",
              size: 17,
              font: "Arial",
              color: "444444"
            })
          ],
          spacing: { after: 40 }
        })
      );

      for (const a of edu.achievements ?? []) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: a,
                size: 17,
                font: "Arial",
                color: "555555"
              })
            ],
            spacing: { before: 20, after: 20 }
          })
        );
      }
    }
  }

  if (content.certifications?.length) {
    children.push(...createSectionHeader("Certifications"));
    for (const c of content.certifications) {
      const dText = c.date ? ` — ${c.date}` : "";
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: `${c.name} (${c.organization})${dText}`,
              size: 17,
              font: "Arial",
              color: "222222"
            })
          ],
          spacing: { before: 40, after: 40 }
        })
      );
    }
  }

  if (content.achievements?.length) {
    children.push(...createSectionHeader("Achievements & Competitive Programming"));
    for (const a of content.achievements) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: a,
              size: 17,
              font: "Arial",
              color: "222222"
            })
          ],
          spacing: { before: 40, after: 40 }
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000, 
              bottom: 1000,
              left: 1000,
              right: 1000
            }
          }
        },
        children: children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = getSanitizedFilename(title, 'docx');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
