'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { JobAnalysis, JobMatchResult } from '@/types';
import { useApp } from '@/lib/AppContext';
import { heuristicSemanticJobMatch } from '@/lib/job-analysis';
import { analyzeJobWithPuterClient } from '@/lib/puter-ai';

type ResultTab = 'overview' | 'comparison' | 'strengths' | 'gaps' | 'actions';
type AnalysisSource = 'backend-ai' | 'puter-ai' | 'semantic-engine';

function tone(score: number) {
  if (score >= 70) return 'good';
  if (score >= 45) return 'mid';
  return 'bad';
}

function StatusBadge({ status, labels }: { status: string; labels: Record<string, string> }) {
  const cls =
    status === 'match' ? 'ja-badge ja-badge-good' : status === 'partial' ? 'ja-badge ja-badge-mid' : 'ja-badge ja-badge-bad';
  return <span className={cls}>{labels[status] || status}</span>;
}

export default function JobAnalyzer() {
  const { t, language } = useApp();
  const router = useRouter();
  const tj = t.jobs;
  const resultsRef = useRef<HTMLElement>(null);

  const [position, setPosition] = useState('Junior Software Engineer');
  const [company, setCompany] = useState('ABC Company');
  const [requirements, setRequirements] = useState(
    "- Bachelor's degree in Software Engineering, Computer Science or related field\n- Proven proficiency in React.js and Node.js\n- Hands-on experience with SQL databases (MySQL/PostgreSQL) and MongoDB\n- Familiarity with Git version control and RESTful APIs\n- Strong problem-solving, collaboration, and verbal communication skills"
  );
  const [profileInput, setProfileInput] = useState(
    "Your Name / Maqaa Kee - BSc in Software Engineering from ABC University (CGPA 4, Exit Exam 99%).\nSkills: Java, C++, React.js, Node.js, SQL, MongoDB, Git, HTML, CSS, JavaScript, Problem Solving, Teamwork.\nExperience: 2 years IT Expert & Software Development Intern at ABC Company.\nProjects: Employee Hiring System (PHP/MySQL) and House Rental Portal (MERN stack)."
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSource, setAnalysisSource] = useState<AnalysisSource>('backend-ai');
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);
  const [atsResult, setAtsResult] = useState<{
    keywordSuggestions: string[];
    structureSuggestions: string[];
    contentSuggestions: string[];
    atsScore: number;
  } | null>(null);
  const [tab, setTab] = useState<ResultTab>('overview');

  useEffect(() => {
    if (analysis && matchResult && atsResult) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysis, matchResult, atsResult]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    const jobPayload = {
      position: position.trim(),
      company: company.trim(),
      requirements: requirements.split('\n').map((r) => r.trim()).filter(Boolean),
    };

    try {
      const res = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: jobPayload.position,
          company: jobPayload.company,
          requirements: jobPayload.requirements,
          profileText: profileInput,
          language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.matchResult) {
          setAnalysis(data.analysis);
          setMatchResult(data.matchResult);
          setAtsResult(data.atsResult);
          setAnalysisSource(data.mock ? 'semantic-engine' : 'backend-ai');
          setTab('overview');
          setIsAnalyzing(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[JobAnalyzer] Backend AI fetch failed, trying client fallback...', err);
    }

    try {
      const puterRes = await analyzeJobWithPuterClient(jobPayload, profileInput, language);
      if (puterRes && puterRes.matchResult) {
        setAnalysis(puterRes.analysis);
        setMatchResult(puterRes.matchResult);
        setAtsResult(puterRes.atsResult);
        setAnalysisSource('puter-ai');
        setTab('overview');
        setIsAnalyzing(false);
        return;
      }
    } catch (err) {
      console.warn('[JobAnalyzer] Puter AI fallback failed...', err);
    }

    const fallback = heuristicSemanticJobMatch(jobPayload, profileInput);
    setAnalysis(fallback.analysis);
    setMatchResult(fallback.matchResult);
    setAtsResult(fallback.atsResult);
    setAnalysisSource('semantic-engine');
    setTab('overview');
    setIsAnalyzing(false);
  };

  const handleLoadSample = (sample: 'tech' | 'marketing' | 'accounting_mismatch') => {
    if (sample === 'tech') {
      setPosition('Junior Full-Stack Engineer');
      setCompany('ABC Tech Solutions');
      setRequirements(
        "- Bachelor's degree in Software Engineering or Computer Science\n- Solid foundation in JavaScript/TypeScript, React.js and Node.js\n- Experience designing and querying SQL and MongoDB databases\n- Familiarity with RESTful APIs, Git, and cloud concepts\n- Adaptable problem solver with good communication"
      );
      setProfileInput(
        "Your Name / Maqaa Kee\nSoftware Engineer Graduate (CGPA: 4) from ABC University.\nSkills: JavaScript, TypeScript, React.js, Node.js, Express, SQL, MySQL, MongoDB, Git, HTML, CSS, Problem Solving, Teamwork.\nExperience: 2 years IT Support & Software Intern at ABC Company.\nProjects: Automated University Hiring System (PHP/MySQL) and Student Housing Platform (MERN stack)."
      );
    } else if (sample === 'marketing') {
      setPosition('Marketing Manager');
      setCompany('Borcelle Media Group');
      setRequirements(
        "- Bachelor's degree in Business, Marketing, or related field\n- 3+ years experience driving digital marketing and brand strategy\n- Proficient in SEO, multi-channel campaign analytics, and ROI tracking\n- Demonstrated leadership and cross-functional project management\n- Strong presentation and stakeholder communication skills"
      );
      setProfileInput(
        "Richard Sanchez\nChicago, IL | Marketing Lead with Bachelor of Business Management from Wardiere University.\nSkills: Digital Marketing, Brand Strategy, SEO, Social Media Campaigns, Team Leadership, Budget Management, Google Analytics, Excel, Presentation.\nExperience: 4 years as Marketing Lead at Fauget Studio delivering 35% growth in brand engagement."
      );
    } else {
      setPosition('Senior Financial Accountant & Auditor');
      setCompany('Nexus Global Capital PLC');
      setRequirements(
        "- Bachelor's or Master's degree in Accounting, Finance, or Auditing (CPA/ACCA preferred)\n- 4+ years direct experience in general ledger reconciliation, GAAP compliance, and financial reporting\n- Hands-on mastery of QuickBooks, SAP ERP Financials, and advanced financial modeling in Excel\n- Strong track record managing quarterly corporate tax audits and cash flow forecasting\n- High ethical standards and executive presentation ability"
      );
      setProfileInput(
        "Your Name / Maqaa Kee\nAddis Ababa, Ethiopia | BSc in Computer Science & Software Engineering (CGPA: 3.9).\nSkills: Java, Python, React.js, Node.js, SQL Databases, Git, Problem Solving, System Architecture, Algorithms, Data Structures.\nExperience: 4 years as Full-Stack Software Developer building SaaS platforms and cloud backend APIs.\nProjects: University Management Portal (PostgreSQL/React) and Real-time Logistics Tracker."
      );
    }
  };

  const engineLabel =
    analysisSource === 'backend-ai'
      ? tj.engineBackend
      : analysisSource === 'puter-ai'
        ? tj.enginePuter
        : tj.engineSemantic;

  const statusLabels = {
    match: tj.statusMatch,
    partial: tj.statusPartial,
    mismatch: tj.statusMismatch,
  };

  const fitTone = matchResult ? tone(matchResult.matchScore) : 'mid';
  const atsTone = atsResult ? tone(atsResult.atsScore) : 'mid';

  return (
    <div className="ja">
      <section className="ja-hero">
        <div className="ja-wrap">
          <div className="ja-kicker">
            <p className="ja-kicker-product">{t.brand.product}</p>
            <span className="ja-kicker-dot" aria-hidden />
            <p className="ja-kicker-company">{t.brand.byline}</p>
          </div>
          <h1 className="ja-h1 mt-4 text-[clamp(36px,5.4vw,64px)]">{tj.title}</h1>
          <p className="ja-lead mt-5">{tj.subtitle}</p>

          <div className="ja-steps">
            <article className="ja-step">
              <div className="ja-step-num">01</div>
              <h3>{tj.how1Title}</h3>
              <p>{tj.how1Desc}</p>
            </article>
            <article className="ja-step">
              <div className="ja-step-num">02</div>
              <h3>{tj.how2Title}</h3>
              <p>{tj.how2Desc}</p>
            </article>
            <article className="ja-step">
              <div className="ja-step-num">03</div>
              <h3>{tj.how3Title}</h3>
              <p>{tj.how3Desc}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="ja-workspace">
        <div className="ja-wrap">
          <div className="ja-toolbar">
            <span className="ja-toolbar-label">{tj.sampleData}</span>
            <div className="ja-chips">
              <button type="button" className="ja-chip" onClick={() => handleLoadSample('tech')}>
                {tj.sampleTech}
              </button>
              <button type="button" className="ja-chip" onClick={() => handleLoadSample('marketing')}>
                {tj.sampleMarketing}
              </button>
              <button
                type="button"
                className="ja-chip is-warn"
                onClick={() => handleLoadSample('accounting_mismatch')}
                title={tj.sampleMismatchHint}
              >
                {tj.sampleMismatch}
              </button>
            </div>
          </div>

          <div className="ja-grid">
            <div className="ja-card">
              <div className="ja-card-head">
                <div>
                  <div className="ja-card-kicker">{tj.stepJob}</div>
                  <h2 className="ja-card-title">{tj.targetJobTitle}</h2>
                  <p className="ja-card-hint">{tj.jobCardHint}</p>
                </div>
              </div>

              <div className="ja-fields-2">
                <div className="ja-field">
                  <label className="ja-label" htmlFor="ja-position">
                    {tj.positionTitle}
                  </label>
                  <input
                    id="ja-position"
                    className="ja-input"
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Senior Financial Accountant"
                  />
                </div>
                <div className="ja-field">
                  <label className="ja-label" htmlFor="ja-company">
                    {tj.companyName}
                  </label>
                  <input
                    id="ja-company"
                    className="ja-input"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Nexus Global Capital PLC"
                  />
                </div>
              </div>

              <div className="ja-field">
                <label className="ja-label" htmlFor="ja-requirements">
                  {tj.requirementsLabel}
                </label>
                <textarea
                  id="ja-requirements"
                  className="ja-textarea"
                  rows={9}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="- Degree in field&#10;- 4+ years specific domain experience&#10;- Core technical tools and competencies"
                />
              </div>
            </div>

            <div className="ja-card">
              <div className="ja-card-head">
                <div>
                  <div className="ja-card-kicker">{tj.stepProfile}</div>
                  <h2 className="ja-card-title">{tj.candidateProfileTitle}</h2>
                  <p className="ja-card-hint">{tj.profileCardHint}</p>
                </div>
              </div>

              <div className="ja-field">
                <label className="ja-label" htmlFor="ja-profile">
                  {tj.profileContentLabel}
                </label>
                <textarea
                  id="ja-profile"
                  className="ja-textarea is-tall"
                  rows={12}
                  value={profileInput}
                  onChange={(e) => setProfileInput(e.target.value)}
                  placeholder="Paste your CV or summarize your degree, domain skills, projects, and work experience..."
                />
              </div>

              <div className="ja-action">
                <button
                  type="button"
                  className="ja-btn ja-btn-primary"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="ja-spin" viewBox="0 0 24 24" aria-hidden>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.85" />
                      </svg>
                      {tj.calculatingBtn}
                    </>
                  ) : (
                    tj.calculateMatchBtn
                  )}
                </button>
                <span className="ja-empty">{isAnalyzing ? tj.analyzingHint : tj.emptyResultsHint}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {analysis && matchResult && atsResult && (
        <section className="ja-results" ref={resultsRef}>
          <div className="ja-wrap">
            <div className="ja-results-head">
              <div>
                <p className="ja-kicker-product">{tj.resultsTitle}</p>
                <h2 className="ja-h1 mt-3 text-[clamp(28px,4vw,44px)]">
                  {position} · {company}
                </h2>
                <p className="ja-lead mt-3 text-[16px]">{tj.resultsSubtitle}</p>
              </div>
              <div className="ja-engine">
                <span>{tj.engineLabel}</span>
                <strong>{engineLabel}</strong>
              </div>
            </div>

            <div className="ja-tabs" role="tablist" aria-label={tj.resultsTitle}>
              {(
                [
                  ['overview', tj.tabOverview],
                  ['comparison', tj.tabComparison],
                  ['strengths', tj.tabStrengths],
                  ['gaps', tj.tabGaps],
                  ['actions', tj.tabActions],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className={`ja-tab${tab === id ? ' is-active' : ''}`}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <>
                <div className="ja-score-grid">
                  <article className="ja-score">
                    <div className="ja-score-label">{tj.fitScore}</div>
                    <div className="ja-score-row">
                      <div
                        className="ja-ring"
                        style={
                          {
                            '--p': matchResult.matchScore,
                            '--ring': fitTone === 'good' ? '#1f7a4d' : fitTone === 'mid' ? '#b45309' : '#a33b3b',
                          } as CSSProperties
                        }
                      >
                        <span>{matchResult.matchScore}%</span>
                      </div>
                      <div>
                        <div className="ja-score-value">{matchResult.matchScore}</div>
                        <div className="ja-score-meta">
                          {matchResult.matchScore >= 70
                            ? tj.strongAlignment
                            : matchResult.matchScore >= 45
                              ? tj.moderateMatchLabel
                              : tj.domainMismatch}
                        </div>
                      </div>
                    </div>
                    <div className="ja-bar">
                      <i style={{ width: `${matchResult.matchScore}%` }} />
                    </div>
                  </article>

                  <article className="ja-score">
                    <div className="ja-score-label">{tj.atsScoreLabel}</div>
                    <div className="ja-score-row">
                      <div>
                        <div className="ja-score-value">{atsResult.atsScore}</div>
                        <div className="ja-score-meta">
                          {atsResult.atsScore >= 70 ? tj.highPass : tj.needsTailoring}
                        </div>
                      </div>
                    </div>
                    <div className="ja-bar">
                      <i
                        style={{
                          width: `${atsResult.atsScore}%`,
                          background: atsTone === 'good' ? '#1a568c' : atsTone === 'mid' ? '#b45309' : '#a33b3b',
                        }}
                      />
                    </div>
                    <p className="ja-empty mt-4">
                      {atsResult.atsScore >= 70
                        ? tj.atsScoreHigh
                        : atsResult.atsScore >= 45
                          ? tj.atsScoreMed
                          : tj.atsScoreLow}
                    </p>
                  </article>

                  <article className="ja-score is-cta">
                    <div>
                      <div className="ja-score-label">{tj.readyToApply}</div>
                      <p>{tj.readyToApplyDesc}</p>
                    </div>
                    <button type="button" className="ja-btn ja-btn-on-dark" onClick={() => router.push('/letters')}>
                      {tj.generateLetterBtn}
                    </button>
                  </article>
                </div>

                <article
                  className={`ja-verdict is-${
                    matchResult.domainMatchStatus === 'mismatch'
                      ? 'bad'
                      : matchResult.matchScore >= 70
                        ? 'good'
                        : 'mid'
                  }`}
                >
                  <div className="ja-score-label">{tj.verdictLabel}</div>
                  <h3 className="mt-2">{matchResult.verdictTitle || tj.matchCompatibility}</h3>
                  {matchResult.verdictSummary && <p>{matchResult.verdictSummary}</p>}
                  {matchResult.domainExplanation && matchResult.domainExplanation !== matchResult.verdictSummary && (
                    <p className="ja-aside">{matchResult.domainExplanation}</p>
                  )}
                  <div className="ja-domain mt-5">
                    <div>
                      <StatusBadge
                        status={matchResult.domainMatchStatus || 'partial'}
                        labels={{
                          match: tj.directMatch,
                          partial: tj.partialOverlap,
                          mismatch: tj.domainShift,
                        }}
                      />
                    </div>
                    <div>
                      <span>{tj.targetLabel}</span>
                      <div>{matchResult.jobDomain || position}</div>
                    </div>
                    <div>
                      <span>{tj.profileLabel}</span>
                      <div>{matchResult.candidateDomain || 'General background'}</div>
                    </div>
                  </div>
                </article>

                {(analysis.keywords.length > 0 ||
                  analysis.requiredTechnicalSkills.length > 0 ||
                  analysis.requiredEducation.length > 0) && (
                  <article className="ja-section">
                    <h3>{tj.jobBreakdown}</h3>
                    <p className="ja-section-lead">{tj.jobBreakdownHint}</p>
                    {analysis.requiredEducation.length > 0 && (
                      <div className="mb-5">
                        <div className="ja-score-label mb-2">{tj.requiredEducation}</div>
                        <div className="ja-pills">
                          {analysis.requiredEducation.map((item) => (
                            <span key={item} className="ja-pill">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.requiredTechnicalSkills.length > 0 && (
                      <div className="mb-5">
                        <div className="ja-score-label mb-2">{tj.requiredTechSkills}</div>
                        <div className="ja-pills">
                          {analysis.requiredTechnicalSkills.map((item) => (
                            <span key={item} className="ja-pill is-info">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.keywords.length > 0 && (
                      <div>
                        <div className="ja-score-label mb-2">{tj.keywordsFromJob}</div>
                        <div className="ja-pills">
                          {analysis.keywords.map((item) => (
                            <span key={item} className="ja-pill">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                )}
              </>
            )}

            {tab === 'comparison' && (
              <article className="ja-section">
                <h3>{tj.matrixTitle}</h3>
                <p className="ja-section-lead">{tj.matrixHint}</p>
                {matchResult.comparisonDetails && matchResult.comparisonDetails.length > 0 ? (
                  <div className="ja-matrix">
                    {matchResult.comparisonDetails.map((detail, idx) => (
                      <div key={`${detail.title}-${idx}`} className="ja-row">
                        <div>
                          <h4>{detail.title}</h4>
                          <div className="mt-2">
                            <StatusBadge status={detail.status} labels={statusLabels} />
                          </div>
                        </div>
                        <div>
                          <div className="col-label">{tj.jobExpectation}</div>
                          <div className="col-value">{detail.requiredValue}</div>
                        </div>
                        <div>
                          <div className="col-label">{tj.yourProfileCol}</div>
                          <div className="col-value">{detail.candidateValue}</div>
                        </div>
                        {detail.commentary && <div className="col-note">{detail.commentary}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="ja-empty">{tj.emptyComparison}</p>
                )}
              </article>
            )}

            {tab === 'strengths' && (
              <div className="ja-split" style={{ marginTop: 0 }}>
                <article className="ja-section" style={{ marginTop: 0 }}>
                  <h3>{tj.matchedQualifications}</h3>
                  <p className="ja-section-lead">{tj.matchedTechSkills}</p>
                  {matchResult.matchedTechnicalSkills.length > 0 ? (
                    <div className="ja-pills">
                      {matchResult.matchedTechnicalSkills.map((skill) => (
                        <span key={skill} className="ja-pill is-good">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="ja-empty">{tj.noSkillOverlap}</p>
                  )}

                  {matchResult.matchedEducation.length > 0 && (
                    <div className="mt-6">
                      <div className="ja-score-label mb-2">{tj.requiredEducation}</div>
                      <ul className="ja-list">
                        {matchResult.matchedEducation.map((edu, i) => (
                          <li key={edu}>
                            <span className="n">{i + 1}</span>
                            <span>{edu}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {matchResult.matchedExperience.length > 0 && (
                    <div className="mt-6">
                      <div className="ja-score-label mb-2">{tj.matchedExperience}</div>
                      <ul className="ja-list">
                        {matchResult.matchedExperience.map((item, i) => (
                          <li key={item}>
                            <span className="n">{i + 1}</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>

                <article className="ja-section" style={{ marginTop: 0 }}>
                  <h3>{tj.transferable}</h3>
                  <p className="ja-section-lead">{tj.transferableHint}</p>
                  {matchResult.transferableSkills && matchResult.transferableSkills.length > 0 ? (
                    <div className="ja-pills">
                      {matchResult.transferableSkills.map((item) => (
                        <span key={item} className="ja-pill is-info">
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="ja-empty">{tj.noTransferable}</p>
                  )}
                </article>
              </div>
            )}

            {tab === 'gaps' && (
              <div className="ja-split" style={{ marginTop: 0 }}>
                <article className="ja-section" style={{ marginTop: 0 }}>
                  <h3>{tj.missingWeakAreas}</h3>
                  <p className="ja-section-lead">{tj.gapsIntro}</p>
                  {matchResult.missingRequirements.length > 0 ? (
                    <div className="ja-pills">
                      {matchResult.missingRequirements.map((item) => (
                        <span key={item} className="ja-pill is-mid">
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="ja-cover">{tj.allCovered}</div>
                  )}
                </article>

                <article className="ja-section" style={{ marginTop: 0 }}>
                  <h3>{tj.atsCheck}</h3>
                  <p className="ja-section-lead">{tj.atsTipsTitle}</p>
                  {atsResult.keywordSuggestions.length > 0 && (
                    <div className="mb-5">
                      <div className="ja-score-label mb-2">{tj.keywordSuggestions}</div>
                      <div className="ja-pills">
                        {atsResult.keywordSuggestions.map((item) => (
                          <span key={item} className="ja-pill">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {atsResult.structureSuggestions.length > 0 && (
                    <div className="mb-5">
                      <div className="ja-score-label mb-2">{tj.structureSuggestions}</div>
                      <ul className="ja-list">
                        {atsResult.structureSuggestions.map((item, i) => (
                          <li key={item}>
                            <span className="n">{i + 1}</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {atsResult.contentSuggestions.length > 0 && (
                    <div>
                      <div className="ja-score-label mb-2">{tj.contentSuggestions}</div>
                      <ul className="ja-list">
                        {atsResult.contentSuggestions.map((item, i) => (
                          <li key={item}>
                            <span className="n">{i + 1}</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              </div>
            )}

            {tab === 'actions' && (
              <>
                <div className="ja-split" style={{ marginTop: 0 }}>
                  <article className="ja-section" style={{ marginTop: 0 }}>
                    <h3>{tj.coachTitle}</h3>
                    <p className="ja-section-lead">{tj.actionableSteps}</p>
                    {matchResult.recruiterAdvice && matchResult.recruiterAdvice.length > 0 ? (
                      <ul className="ja-list">
                        {matchResult.recruiterAdvice.map((adv, i) => (
                          <li key={adv}>
                            <span className="n">{i + 1}</span>
                            <span>{adv}</span>
                          </li>
                        ))}
                      </ul>
                    ) : matchResult.recommendations.length > 0 ? (
                      <ul className="ja-list">
                        {matchResult.recommendations.map((adv, i) => (
                          <li key={adv}>
                            <span className="n">{i + 1}</span>
                            <span>{adv}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="ja-empty">{tj.defaultAdvice}</p>
                    )}
                  </article>

                  <article className="ja-section" style={{ marginTop: 0 }}>
                    <h3>{tj.atsTipsTitle}</h3>
                    <p className="ja-section-lead">{tj.atsCheck}</p>
                    {matchResult.atsOptimizationTips && matchResult.atsOptimizationTips.length > 0 ? (
                      <ul className="ja-list">
                        {matchResult.atsOptimizationTips.map((tip, i) => (
                          <li key={tip}>
                            <span className="n">{i + 1}</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="ja-list">
                        <li>
                          <span className="n">1</span>
                          <span>
                            Align your resume headline with “{position}” so scanners and recruiters see the same role.
                          </span>
                        </li>
                        <li>
                          <span className="n">2</span>
                          <span>Quantify achievements with results, volume, and timelines rather than duties alone.</span>
                        </li>
                      </ul>
                    )}
                  </article>
                </div>

                <article className="ja-score is-cta mt-4" style={{ borderRadius: 24, padding: 28 }}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                    <div>
                      <div className="ja-score-label">{t.brand.product}</div>
                      <h3 className="ja-h1 mt-2 text-[clamp(26px,3vw,36px)]">{tj.nextMove}</h3>
                      <p className="max-w-xl">{tj.nextMoveDesc}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link href="/builder" className="ja-btn ja-btn-on-dark">
                        {tj.openStudio}
                      </Link>
                      <button type="button" className="ja-btn ja-btn-light" onClick={() => router.push('/letters')}>
                        {tj.writeLetter}
                      </button>
                    </div>
                  </div>
                </article>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
