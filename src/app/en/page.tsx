import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ring-map – Career Path Diagnosis for Japanese Universities",
  description:
    "A free career path diagnosis tool for high school students considering Japanese universities. Designed for international school counselors supporting students with diverse pathways. 36 fields × 19 axes, based on Holland Code and Big Five.",
  alternates: { canonical: "https://ring-map.com/en" },
  openGraph: {
    title: "ring-map – Career Path Diagnosis for Japanese Universities",
    description:
      "A free diagnostic tool for international school counselors supporting students considering Japanese universities. 36 fields × 19 axes.",
    url: "https://ring-map.com/en",
    type: "website",
    locale: "en_US",
  },
};

export default function EnglishPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-10 text-sm leading-relaxed text-gray-700">
      {/* Hero */}
      <header className="mb-10 border-b border-gray-200 pb-8">
        <p className="mb-2 text-xs font-semibold tracking-widest text-rose-700">
          FOR COUNSELORS
        </p>
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          ring-map
        </h1>
        <p className="mb-4 text-base text-gray-700">
          A free career path diagnosis tool for high school students considering{" "}
          <strong>Japanese universities</strong>.
        </p>
        <p className="mb-6 text-gray-700">
          Designed for international school counselors who support students with diverse pathways, including students who are weighing Japanese universities alongside US, UK, and other options.
        </p>

        {/* TL;DR - F-pattern reading optimization */}
        <div className="mb-6 rounded border border-slate-200 bg-slate-50 p-5">
          <p className="mb-3 text-xs font-semibold tracking-wider text-slate-700">
            EXECUTIVE SUMMARY
          </p>
          <ul className="space-y-2 text-xs leading-relaxed text-gray-700">
            <li className="flex gap-2">
              <span className="text-rose-600">●</span>
              <span>
                A free online diagnostic with about 45–66 questions (depending on the track chosen), mapping students against{" "}
                <strong>36 Japanese university departments using 19 axes</strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-600">●</span>
              <span>
                All student response data is delivered to your school as a{" "}
                <strong>Google Spreadsheet owned by your school</strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-600">●</span>
              <span>
                Independently built and maintained by a current university student.{" "}
                <strong>Core diagnostic is permanently free</strong>
              </span>
            </li>
          </ul>
        </div>

        {/* Trust badges - visual safety signals (Dual coding theory) */}
        <div className="mb-6 grid grid-cols-3 gap-2">
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-emerald-800">
              Permanently free
            </p>
            <p className="mt-0.5 text-[9px] text-emerald-700">
              No setup or running cost
            </p>
          </div>
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-emerald-800">
              School-owned data
            </p>
            <p className="mt-0.5 text-[9px] text-emerald-700">
              Deletion on request
            </p>
          </div>
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-emerald-800">
              No PII storage
            </p>
            <p className="mt-0.5 text-[9px] text-emerald-700">
              Master DB stores scores only
            </p>
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-white p-4 text-xs">
          <p className="mb-1 text-gray-600">
            <span className="font-semibold text-gray-900">Developer:</span>{" "}
            Kazuki Hirai (3rd year, Department of Applied Chemistry, Tokyo University of Science)
          </p>
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">Contact:</span>{" "}
            <a
              href="mailto:info@ring-map.com"
              className="text-rose-700 underline"
            >
              info@ring-map.com
            </a>
          </p>
        </div>
      </header>

      {/* Note about language */}
      <section className="mb-10 rounded border border-amber-200 bg-amber-50 p-5">
        <p className="mb-2 text-xs font-semibold text-amber-900">
          Note on language
        </p>
        <p className="text-xs text-gray-700">
          The diagnostic tool itself is in Japanese, as it is designed for students who plan to study at Japanese universities (where instruction is in Japanese). This English landing page is for school counselors and administrators evaluating the tool for their students.
        </p>
      </section>

      {/* Why this matters */}
      <section className="mb-12">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">
          Why this matters for international school students
        </h2>
        <p className="mb-4">
          International school students who are considering Japanese universities face a unique challenge: <strong>Japan&apos;s higher education system uses a fine-grained department structure</strong> (faculty → department → laboratory) that differs significantly from US-style major declarations.
        </p>
        <p className="mb-4">
          For example, a student interested in &quot;chemistry&quot; in Japan may need to choose between:
        </p>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-1">Pure Chemistry (理学部 化学科)</li>
          <li className="mb-1">Applied Chemistry (工学部 応用化学科)</li>
          <li className="mb-1">Chemical Engineering (工学部 化学工学科)</li>
          <li className="mb-1">Life Chemistry (生命化学科)</li>
        </ul>
        <p className="mb-4">
          Each leads to different careers, requires different entrance exam strategies, and has different academic cultures. Existing Japanese career-guidance services rarely explain these distinctions in a way that international school students (or their counselors, parents) can navigate.
        </p>
        <p className="mb-4">
          ring-map fills this gap by mapping 36 representative departments across 19 axes of interest and aptitude, helping students and counselors have informed conversations about which Japanese departments fit a student&apos;s profile.
        </p>
      </section>

      {/* How it works */}
      <section className="mb-12">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">How it works</h2>
        <ol className="mb-4 ml-6 list-decimal space-y-2">
          <li>
            Students answer ~45–66 questions (10–15 minutes, depending on the track chosen) covering interests, thinking style, and tolerance for various academic environments.
          </li>
          <li>
            Their responses are scored across 19 axes (derived from Holland Code RIASEC and Big Five personality traits, adapted for the Japanese university context).
          </li>
          <li>
            A variance-weighted distance (with an essential-axis gate) is calculated against 36 representative Japanese university departments.
          </li>
          <li>
            Results show ranked compatibility with each department, with descriptions of what daily life and career outcomes typically look like.
          </li>
          <li>
            For school deployments, all student response data is delivered as a <strong>raw Google Spreadsheet</strong> owned by the school.
          </li>
        </ol>
      </section>

      {/* Methodology */}
      <section className="mb-12">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">Methodology</h2>
        <ul className="mb-4 ml-6 list-disc space-y-2">
          <li>
            <strong className="text-gray-900">Psychological foundation:</strong>{" "}
            Holland Code (RIASEC) for interest type, Big Five (OCEAN) for working-style fit. ring-map was independently designed for the Japanese department-selection context. Truity&apos;s career assessment is a comparable English-language service using the same two models, but it focuses on US occupations and the US college system.
          </li>
          <li>
            <strong className="text-gray-900">19 axes:</strong> Built from 16 core axes (math, memorization, lab, fieldwork, code, making, language, care, business, art, abstract thought, team, certification, graduate-school intent, life-relevance, animal-relevance), plus 3 added after bias audit (narrative, justice, body).
          </li>
          <li>
            <strong className="text-gray-900">Department scoring:</strong> Each of 36 departments was scored 0.0–1.0 on each axis by cross-referencing syllabi from 6 tiers of Japanese universities (national flagships through teaching-focused institutions), capturing a representative cross-section rather than a single tier.
          </li>
          <li>
            <strong className="text-gray-900">Career data:</strong> Sourced from Japan&apos;s Ministry of Health, Labour and Welfare occupational classification and the US O*NET database. Individual company names, salary figures, and placement rates are intentionally omitted.
          </li>
          <li>
            <strong className="text-gray-900">Tone:</strong> &quot;A week in the life&quot; descriptions for each department are intentionally written from the higher-rigor end, so students enter university with realistic expectations rather than disappointment.
          </li>
        </ul>
      </section>

      {/* Data ownership */}
      <section className="mb-12">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">
          Data ownership and privacy
        </h2>
        <p className="mb-4 font-semibold text-gray-900">
          School data belongs to the school.
        </p>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-1">
            Student responses are saved to a Google Spreadsheet owned by your school, accessible only to your designated staff.
          </li>
          <li className="mb-1">
            The developer&apos;s master database only stores 19-axis scores (no student names, classes, or numbers).
          </li>
          <li className="mb-1">
            No third-party sharing. No advertising. No university-sponsored steering.
          </li>
          <li className="mb-1">
            If your school requests deletion, all related data is removed immediately.
          </li>
        </ul>
      </section>

      {/* Pricing */}
      <section className="mb-12">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">Pricing</h2>
        <p className="mb-4 font-semibold text-gray-900">
          The core diagnostic and raw-data spreadsheet are free, permanently.
        </p>
        <p className="mb-4">
          Optional add-ons (planned, not yet released) will include:
        </p>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-1">
            Per-student PDF counseling sheets (1 page per student, with 19-axis chart and conversation prompts)
          </li>
          <li className="mb-1">
            Counselor dashboard (Looker Studio integration showing class- and year-level trends)
          </li>
          <li className="mb-1">
            AI-generated cohort interpretation reports
          </li>
        </ul>
        <p className="mb-4">
          Estimated annual pricing for the full bundle is in the range of ¥70,000–120,000 (approximately USD 500–900) per school. Core diagnostic remains free regardless.
        </p>
      </section>

      {/* Timeline for international schools */}
      <section className="mb-12">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">
          Timeline for August 2026 academic year
        </h2>
        <p className="mb-4">
          For international schools starting the 2026–2027 academic year in August or September:
        </p>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-1">
            <strong>June 2026:</strong> Initial outreach, scoping call with counselors
          </li>
          <li className="mb-1">
            <strong>Late June – July 2026:</strong> Demo, customization (school code setup, dedicated spreadsheet provisioning)
          </li>
          <li className="mb-1">
            <strong>August 2026:</strong> Student deployment alongside new academic year orientation
          </li>
          <li className="mb-1">
            <strong>October–December 2026:</strong> Counselor reviews diagnostic data ahead of Japanese university entrance exam preparation
          </li>
        </ul>
        <p className="mb-4">
          Setup is free. There is no integration burden – students simply scan a QR code or visit a school-specific URL.
        </p>
      </section>

      {/* Developer */}
      <section className="mb-12">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">About the developer</h2>
        <p className="mb-3">
          <strong className="text-gray-900">Kazuki Hirai</strong>
        </p>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-1">
            3rd-year undergraduate, Department of Applied Chemistry, Faculty of Science Division I, Tokyo University of Science
          </li>
          <li className="mb-1">
            High school alma mater: Aoyama Gakuin Yokohama Eiwa High School (an affiliated school of Aoyama Gakuin University)
          </li>
          <li className="mb-1">
            Built ring-map as an independent project starting Spring 2026
          </li>
        </ul>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          Personal motivation
        </h3>
        <p className="mb-3">
          As a student at an affiliated high school, my path was effectively defined by grades, with internal advancement to Aoyama Gakuin University as the default. I never had to actively search for a department that genuinely interested me.
        </p>
        <p className="mb-3">
          That changed when a cram-school instructor — himself a graduate of the Department of Applied Chemistry at Tokyo University of Science — shared his enthusiasm for the field. That single encounter led me to take the entrance exam and pursue Applied Chemistry at TUS.
        </p>
        <p className="mb-3">
          But this was{" "}
          <strong>entirely coincidental</strong>. Without that one teacher, I would have continued down the default path and ended up in a department I did not consciously choose. The thought that millions of students depend on similar accidents to find a fitting major has bothered me ever since.
        </p>
        <p className="mb-3">
          After enrolling, I also experienced what many students do: a gap between what I imagined the department to be and the reality of daily coursework, lab hours, and weekly rhythm. I had no way to know the &quot;week in the life&quot; of Applied Chemistry before I started.
        </p>
        <p className="mb-3">
          ring-map exists to make these encounters{" "}
          <strong>intentional rather than accidental</strong>, and to give students a realistic preview of department life before they commit. Each design choice (36 departments mapped, 19 axes scored, weekly schedule descriptions intentionally tilted toward the higher-rigor end, occupation data based on official Japan and US labor classifications) is a direct response to a specific gap I personally felt.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-12">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">Contact</h2>
        <p className="mb-4">
          For inquiries, demos, or to begin a pilot for the 2026–2027 academic year, please reach out by email. Replies typically within one business day.
        </p>
        <div className="mb-6 rounded border border-rose-100 bg-rose-50/50 p-5">
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">Email:</span>{" "}
            <a
              href="mailto:info@ring-map.com"
              className="text-rose-700 underline"
            >
              info@ring-map.com
            </a>
          </p>
        </div>
        <a
          href="mailto:info@ring-map.com?subject=ring-map%20inquiry%20from%20international%20school"
          className="inline-block rounded bg-rose-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-800"
        >
          Contact us
        </a>
      </section>

      <div className="mt-12 border-t border-gray-200 pt-6 text-xs text-gray-500">
        <p className="mb-2">
          Japanese version (for Japanese-speaking students and teachers):
        </p>
        <ul className="ml-6 list-disc">
          <li className="mb-1">
            <Link href="/" className="text-rose-700 underline">
              Main site (for students)
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/teachers" className="text-rose-700 underline">
              For teachers (Japanese teacher Q&amp;A)
            </Link>
          </li>
        </ul>
      </div>
    </article>
  );
}
