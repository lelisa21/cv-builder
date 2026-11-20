import { createPageMetadata } from '@/lib/site-url';
import JobAnalyzer from '@/components/JobAnalyzer';

export const metadata = createPageMetadata(
  'Job Analyzer',
  'Match your CV to a vacancy in CV Studio by BikatTech: fit score, ATS probability, gaps, and the next edits to make.',
  '/jobs',
);

export default function JobAnalysisPage() {
  return <JobAnalyzer />;
}
