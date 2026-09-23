import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // 1. Path to base template
    const templatePath = path.resolve('c:/Users/ADMIN/Desktop/electronicsclub/electronic-club-quiz/public/templates/III_ECE_Technical_Test_Consolidated_Template.xlsx');
    const fallbackPath = 'C:\\Users\\ADMIN\\Downloads\\III ECE Technical Test Consolidated template.xls';

    let wb: XLSX.WorkBook;
    if (fs.existsSync(templatePath)) {
      wb = XLSX.readFile(templatePath);
    } else if (fs.existsSync(fallbackPath)) {
      wb = XLSX.readFile(fallbackPath);
    } else {
      throw new Error('Base template not found on server');
    }

    // 2. Fetch live latest attempts from Supabase
    const { data: attempts } = await supabaseAdmin
      .from('attempts')
      .select('id, score, total_marks, status, submitted_at, participants(name, register_no, roll_number)')
      .eq('status', 'submitted');

    const marksByReg = new Map<string, { pct: number; score: number }>();
    (attempts || []).forEach((a) => {
      const part = a.participants as any;
      const reg = String(part?.register_no || '').trim();
      const score = Number(a.score || 0);
      const total = Number(a.total_marks || 30);
      const pct = total > 0 ? Math.round((score / total) * 100) : 0;
      marksByReg.set(reg, { score, pct });
    });

    // 3. Update 'III ECE ' sheet
    const eceSheet = wb.Sheets['III ECE '];
    if (eceSheet) {
      const eceData = XLSX.utils.sheet_to_json<any[]>(eceSheet, { header: 1 });

      const sectionStats: Record<string, { total: number; attended: number; pass: number; sumPct: number }> = {
        'A Section': { total: 0, attended: 0, pass: 0, sumPct: 0 },
        'B Section': { total: 0, attended: 0, pass: 0, sumPct: 0 },
        'C Section': { total: 0, attended: 0, pass: 0, sumPct: 0 },
        'D Section': { total: 0, attended: 0, pass: 0, sumPct: 0 },
      };

      let totalAttendedCount = 0;
      let totalPassCount = 0;
      let totalPctSum = 0;
      let totalStudents = 0;

      for (let r = 5; r <= 258; r++) {
        const row = eceData[r];
        if (!row || !row[1]) continue;

        totalStudents++;
        const regNo = String(row[1]).trim();
        const sec = String(row[3] || '').trim();

        if (sectionStats[sec]) sectionStats[sec].total++;

        // Col 4 (E): TEST 1 -> Empty
        row[4] = '';

        // Col 5 (F): TEST 2 -> Percentage marks
        const studentResult = marksByReg.get(regNo);
        if (studentResult) {
          row[5] = studentResult.pct;
          totalAttendedCount++;
          totalPctSum += studentResult.pct;

          if (sectionStats[sec]) {
            sectionStats[sec].attended++;
            sectionStats[sec].sumPct += studentResult.pct;
            if (studentResult.pct >= 50) {
              sectionStats[sec].pass++;
              totalPassCount++;
            }
          }
        } else {
          row[5] = 'AB';
        }
      }

      const overallAvg = totalAttendedCount > 0 ? Math.round(totalPctSum / totalAttendedCount) : 0;
      const overallPassPct = totalAttendedCount > 0 ? Math.round((totalPassCount / totalAttendedCount) * 100) : 0;

      eceData[260] = [null, null, 'Total Strength', null, '', totalStudents];
      eceData[261] = [null, null, 'Toatl Attended', null, '', totalAttendedCount];
      eceData[262] = [null, null, 'Total Pass', null, '', totalPassCount];
      eceData[263] = [null, null, 'Pass Percentage ', null, '', `${overallPassPct}%`];
      eceData[264] = [null, null, 'Average Marks (in %)', null, '', overallAvg];

      wb.Sheets['III ECE '] = XLSX.utils.aoa_to_sheet(eceData);

      // 4. Update 'Consolidated' sheet
      const secA = sectionStats['A Section'];
      const secB = sectionStats['B Section'];
      const secC = sectionStats['C Section'];
      const secD = sectionStats['D Section'];

      const secAPassPct = secA.attended > 0 ? Math.round((secA.pass / secA.attended) * 100) : 0;
      const secBPassPct = secB.attended > 0 ? Math.round((secB.pass / secB.attended) * 100) : 0;
      const secCPassPct = secC.attended > 0 ? Math.round((secC.pass / secC.attended) * 100) : 0;
      const secDPassPct = secD.attended > 0 ? Math.round((secD.pass / secD.attended) * 100) : 0;

      const secAAvg = secA.attended > 0 ? Math.round(secA.sumPct / secA.attended) : 0;
      const secBAvg = secB.attended > 0 ? Math.round(secB.sumPct / secB.attended) : 0;
      const secCAvg = secC.attended > 0 ? Math.round(secC.sumPct / secC.attended) : 0;
      const secDAvg = secD.attended > 0 ? Math.round(secD.sumPct / secD.attended) : 0;

      const consolidatedAoa = [
        ['V.S.B ENGINEERING COLLEGE,KARUR'],
        ['Department of Electronics and Communication Engineering'],
        ['Year  & Semester: III Year & V Semester'],
        ['Technical Test 2 Analysis'],
        ['', 'III ECE A', 'III ECE B', 'III ECE C', 'III ECE D', 'TOTAL'],
        ['Total Strength', secA.total, secB.total, secC.total, secD.total, totalStudents],
        ['Toatl Attended', secA.attended, secB.attended, secC.attended, secD.attended, totalAttendedCount],
        ['Total Pass', secA.pass, secB.pass, secC.pass, secD.pass, totalPassCount],
        ['Pass Percentage', `${secAPassPct}%`, `${secBPassPct}%`, `${secCPassPct}%`, `${secDPassPct}%`, `${overallPassPct}%`],
        ['Average Marks (in %)', secAAvg, secBAvg, secCAvg, secDAvg, overallAvg],
        [],
        ['Technical Test Consolidated Progress Overview'],
        ['', 'TEST 1', 'TEST 2', 'TEST 3', 'TEST 4', 'TEST 5', 'TEST 6', 'TEST 7'],
        ['Total Strength', totalStudents, totalStudents, '', '', '', '', ''],
        ['Toatl Attended', 0, totalAttendedCount, '', '', '', '', ''],
        ['Total Pass', 0, totalPassCount, '', '', '', '', ''],
        ['Pass Percentage', '0%', `${overallPassPct}%`, '', '', '', '', ''],
        ['Average Marks (in %)', 0, overallAvg, '', '', '', '', ''],
      ];

      const newConsSheet = XLSX.utils.aoa_to_sheet(consolidatedAoa);
      newConsSheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } },
        { s: { r: 11, c: 0 }, e: { r: 11, c: 7 } },
      ];
      newConsSheet['!cols'] = [
        { wch: 24 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
      ];

      wb.Sheets['Consolidated'] = newConsSheet;
    }

    // 5. Generate binary Excel buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="III_ECE_Technical_Test_Consolidated_Analysis_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting coordinator Excel:', error);
    return NextResponse.json({ error: error.message || 'Failed to export Excel report' }, { status: 500 });
  }
}
