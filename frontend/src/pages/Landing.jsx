import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import PetroleumFooter from '../components/PetroleumFooter';
import VacancyMarquee from '../components/VacancyMarquee';

export default function Landing() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const user = useAuthStore(state => state.user);

    const [vacancies, setVacancies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [eligibilityStatement, setEligibilityStatement] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedDept, setSelectedDept] = useState('ALL');

    useEffect(() => {
        fetchPublicData();
    }, []);

    const fetchPublicData = async () => {
        try {
            setLoading(true);
            const [vacRes, deptRes, eligRes] = await Promise.all([
                api.get('jobs/vacancies/public/'),
                api.get('jobs/departments/'),
                api.get('jobs/eligibility-settings/'),
            ]);

            const vacList = Array.isArray(vacRes.data?.results) ? vacRes.data.results : (Array.isArray(vacRes.data) ? vacRes.data : []);
            const deptList = Array.isArray(deptRes.data?.results) ? deptRes.data.results : (Array.isArray(deptRes.data) ? deptRes.data : []);

            setVacancies(vacList);
            setDepartments(deptList);
            // `general_statement_html` is sanitized server-side on save AND on
            // render, so it is safe to inject as HTML here. This page is a
            // pure read-only display: editing lives in Admin -> System Settings
            // & Keys.
            setEligibilityStatement(
                eligRes.data?.general_statement_html
                || eligRes.data?.general_statement
                || '<p>Applicants must be currently enrolled undergraduate or diploma students at an accredited tertiary institution seeking mandatory industrial attachment.</p>'
            );
        } catch (err) {
            console.error('Failed to load public data:', err);
            setVacancies([]);
            setDepartments([]);
            // The three requests share one Promise.all, so a failure on any one
            // of them skips the success branch entirely. Without this the
            // requirements card would render as an empty bordered panel -- a
            // visible blank box where the entry conditions should be, which
            // reads as "there are no requirements".
            setEligibilityStatement(
                '<p>Eligibility requirements are temporarily unavailable. '
                + 'Please check back shortly or contact the department directly.</p>'
            );
        } finally {
            setLoading(false);
        }
    };

    const filteredVacancies = vacancies.filter(v => selectedDept === 'ALL' || v.department_name === selectedDept);

    const handleApplyClick = () => {
        if (isAuthenticated) {
            navigate('/vacancies');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-primary-600 selection:text-white">
            {/* Main Header / Logo Bar
                Gold, per the brand. The base step is --color-primary-700
                (#996322) rather than the exact brand 600 (#bf7d2a): white text
                on 600 measures 3.40:1, which clears the 3:1 large-text/UI
                threshold but fails AA for the small text this bar carries. 700
                measures 5.05:1 with white, so every label here is readable. The
                gradient only travels down the ramp, never above 700, so no
                element in this header drops below that ratio. */}
            <header className="bg-gradient-to-r from-primary-700 via-primary-700 to-primary-800 text-white border-b border-primary-900/30 sticky top-0 z-50 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* The mark sits on a white plate. The logo is an image
                            whose own colours are not under this codebase's
                            control, so rather than assume it reads on gold, it
                            is given a guaranteed white ground -- the same trick
                            as a passport photo mount. */}
                        <span className="inline-flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white shadow-md ring-1 ring-black/5 shrink-0">
                            <img src="/logo.png" alt="State Department for Petroleum" className="h-9 sm:h-11 w-auto object-contain" />
                        </span>
                        <div>
                            <span className="text-xs uppercase tracking-widest text-amber-200 font-extrabold block">Republic of Kenya</span>
                            <span className="text-base sm:text-lg font-black text-white tracking-tight block leading-none">State Department for Petroleum</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <Link
                                to="/dashboard"
                                className="px-5 py-2.5 bg-white hover:bg-primary-50 text-primary-800 font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                {/* Truncates rather than overflowing the bar on a
                                    narrow screen, where a long username would
                                    otherwise push the label off the edge. */}
                                <span className="max-w-[9rem] truncate">Go to Dashboard ({user?.username})</span>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-white/85 hover:text-white font-bold text-sm transition-colors"
                                >
                                    Sign In
                                </Link>
                                {/* A gold button on a gold bar disappears. The
                                    primary action is inverted instead: white
                                    ground, brand-dark text, which is also the
                                    highest-contrast option available here. */}
                                <Link
                                    to="/register"
                                    className="px-5 py-2.5 bg-white hover:bg-primary-50 text-primary-800 font-bold rounded-xl text-sm shadow-md transition-all hover:-translate-y-0.5"
                                >
                                    Register as Applicant
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white py-20 px-4 sm:px-6 lg:px-8 shadow-inner">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none"></div>
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-amber-100 text-xs font-black uppercase tracking-wider border border-white/20 mb-6 backdrop-blur-md shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse"></span>
                        Official Industrial Attachment Portal
                    </span>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6 text-white drop-shadow-sm">
                        Launch Your Career in Kenya's <span className="text-amber-200">Petroleum &amp; Energy Sector</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-amber-50 font-semibold max-w-3xl mx-auto mb-10 leading-relaxed drop-shadow-xs">
                        Join specialized departments across Upstream Geo-exploration, Midstream &amp; Downstream Infrastructure, Energy Transition, and Policy. Apply online with automated ATS qualification and digital clearance.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {/* Inverted to white-on-dark-gold rather than left as the
                            old Twitter blue (#1DA1F2), which belonged to a social
                            network palette and read as an unrelated product on a
                            national identity page. White is also the strongest
                            ground available against this hero, so the primary
                            action is the clearest thing on the screen. */}
                        <a
                            href="#vacancies"
                            className="px-8 py-4 bg-white hover:bg-primary-50 text-primary-800 font-black rounded-2xl shadow-xl transition-all hover:-translate-y-1 text-base flex items-center gap-2 border border-primary-900/10"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            Browse Open Vacancies
                        </a>
                        {!isAuthenticated && (
                            <Link
                                to="/register"
                                className="px-8 py-4 bg-white/15 hover:bg-white/25 text-white font-black rounded-2xl border border-white/30 backdrop-blur-md transition-all hover:-translate-y-1 text-base shadow-md"
                            >
                                Create Free Student Account
                            </Link>
                        )}
                    </div>
                </div>

                {/* Key Metrics Strip */}
                <div className="max-w-6xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-md text-center shadow-sm">
                        <div className="text-3xl font-black text-amber-200">9+</div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">Core Departments</div>
                    </div>
                    <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-md text-center shadow-sm">
                        <div className="text-3xl font-black text-amber-200">100%</div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">Online Dual Clearance</div>
                    </div>
                    <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-md text-center shadow-sm">
                        <div className="text-3xl font-black text-amber-200">Instant</div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">ATS Document Audit</div>
                    </div>
                    <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-md text-center shadow-sm">
                        <div className="text-3xl font-black text-amber-200">Official</div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">Recommendation Letters</div>
                    </div>
                </div>
            </section>

            {/* ── Section 2 of 3: ELIGIBILITY ──────────────────────────────────
                A full-bleed WHITE band, kept deliberately white so the entry
                conditions read as an official document rather than a
                promotional band.

                Two things stop white-on-white from looking unfinished:

                1. Depth. Two heavily blurred gold/amber washes sit behind the
                   content (decorative only, aria-hidden). They are at 5-10%
                   strength, so the section still reads as white to the eye
                   while gaining a lit, non-flat quality.
                2. A tinted subject. The requirements sit on --color-primary-50
                   inside a --color-primary-200 border, not on another white
                   panel. On a white ground the card needs its own surface to
                   register at all; white-on-white was the flat version.

                Colour choices, all from the existing brand ramp. Text sitting
                on white uses --color-primary-700/800 because the exact brand
                gold 600 (#bf7d2a) is only 3.40:1 on white -- fine for a rule
                or an icon, failing AA for small text. 600 is used for the
                non-text elements (rules, borders, icon fills) where 3:1 is the
                applicable threshold. */}
            <section id="eligibility" className="relative bg-white border-t-4 border-primary-600 border-b border-slate-200 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] overflow-hidden">
                {/* Lit corners. Purely decorative, so they are hidden from
                    assistive tech and cannot intercept clicks. */}
                <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 w-[26rem] h-[26rem] rounded-full bg-primary-100/70 blur-3xl"></div>
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-28 w-[24rem] h-[24rem] rounded-full bg-amber-50 blur-3xl"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                    <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                        {/* Left rail: what this section is. */}
                        <div className="lg:col-span-4 lg:sticky lg:top-28">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 text-primary-800 text-xs font-black uppercase tracking-wider border border-primary-300 mb-5">
                                <span className="w-6 h-6 inline-flex items-center justify-center rounded-md bg-primary-700">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </span>
                                Institutional Attachment Eligibility
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                Mandatory Requirements
                            </h2>
                            {/* Gold rule under the heading, the same device the
                                vacancies section uses, so the two headings read
                                as siblings. */}
                            <div className="w-16 h-1 bg-primary-600 rounded-full mt-4"></div>
                            <p className="mt-4 text-slate-600 font-semibold leading-relaxed">
                                Read these before you apply. Every opening below
                                lists the same entry conditions, and an application
                                that does not meet them cannot be processed.
                            </p>

                            {/* Reassurance panel. Tinted rather than white so it
                                survives on a white section, and it repeats the
                                claim already made above instead of introducing
                                new rules. */}
                            <div className="mt-6 flex items-start gap-3 rounded-xl bg-primary-50 border border-primary-200 p-4">
                                <svg className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                    These conditions apply to every attachment
                                    advertised on this site, regardless of
                                    department.
                                </p>
                            </div>
                        </div>

                        {/* Right: the Admin-authored requirements themselves.
                            No heading is hard-coded above the content: the
                            requirements text is authored by an Admin in System
                            Settings, including its own first heading, and a
                            static one here would both duplicate that heading
                            and contradict it the moment the Admin rewrites it.

                            The card carries a labelled header strip so the
                            Admin's own first heading is introduced rather than
                            left to float at the top of the box. */}
                        <div className="lg:col-span-8">
                            <div className="rounded-2xl bg-primary-50 border border-primary-200 border-l-4 border-l-primary-600 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 px-6 sm:px-8 py-4 bg-primary-100/60 border-b border-primary-200">
                                    <span className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-primary-600 shrink-0">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </span>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-primary-800">
                                        Official entry conditions
                                    </h3>
                                </div>

                                {/* Sanitized rich text authored in Admin -> System Settings & Keys.
                                    Styled via .eligibility-prose so headings, lists and paragraphs get
                                    real spacing instead of rendering as an unstyled HTML blob. */}
                                <div
                                    className="eligibility-prose max-w-none text-slate-800 text-sm sm:text-base font-semibold px-6 sm:px-8 py-6"
                                    dangerouslySetInnerHTML={{ __html: eligibilityStatement }}
                                />

                                {/* Once the conditions are read, the next action is
                                    to look at the openings. The button is white
                                    with dark-gold text: the only high-contrast
                                    button pairing on a light surface, and it
                                    keeps the gold-on-white contrast problem out
                                    of the most-clicked element in the section. */}
                                <div className="px-6 sm:px-8 pb-6 pt-2">
                                    <a
                                        href="#vacancies"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary-800 text-sm font-black rounded-xl border border-primary-300 hover:bg-primary-50 hover:border-primary-600 transition-colors shadow-sm"
                                    >
                                        Browse Open Vacancies
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 3 of 3: VACANCIES ───────────────────────────────────
                Back to the pale slate page ground, so the three sections stay
                visually distinct rather than running together. */}
            <section id="vacancies" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white bg-primary-700 px-3 py-1 rounded-md border border-primary-800 inline-block mb-3">
                            Active Attachment Opportunities
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Available Attachment Positions</h2>
                        <p className="text-slate-700 font-semibold text-sm mt-2 max-w-2xl">Explore live industrial attachment openings currently accepting applications.</p>
                        {/* Gold rule, echoing the seam above so the section reads
                            as its own chapter rather than a continuation. */}
                        <div className="w-16 h-1 bg-primary-600 rounded-full mt-4"></div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                        >
                            <option value="ALL">All Departments</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.name}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredVacancies.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-1">No Openings Matching Your Search</h3>
                        <p className="text-slate-600 font-semibold text-sm">Please adjust your department filter or check back soon as new vacancies are published regularly.</p>
                    </div>
                ) : (
                    /* Advertised vacancies scroll right-to-left and loop seamlessly.
                       Below three vacancies, or for a reader who prefers reduced
                       motion, VacancyMarquee falls back to a static grid. */
                    <VacancyMarquee jobs={filteredVacancies} onApply={handleApplyClick} />
                )}
            </section>

            {/* Official Petroleum Footer from Screenshot */}
            <PetroleumFooter />
        </div>
    );
}
