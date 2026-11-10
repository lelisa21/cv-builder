import type { Metadata } from 'next';
import JobAnalyzer from '@/components/JobAnalyzer';

export const metadata: Metadata = {
  title: 'Job Analyzer',
  description:
    'Match your CV to a vacancy in CV Studio by BikatTech: fit score, ATS probability, gaps, and the next edits to make.',
};

export default function JobAnalysisPage() {
  return <JobAnalyzer />;
}
