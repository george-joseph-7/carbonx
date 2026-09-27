/**
 * All event copy lives here so the site can be updated without touching components.
 *
 * Organizer, contact, social, registration and history details are carried over from
 * the CarbonX 2026 website (hacksus.rsetiedc.in/carbonx). Anything marked `null` or
 * "TBA" has not been announced for 2027 yet — fill it in when it is.
 */

export const event = {
  name: "CARBONX",
  year: "2027",
  tagline: "Build. Innovate. Electrify the Future.",
  dates: "Dates announcing soon",
  city: "Kochi, Kerala",
  duration: "42 hours",
  registerUrl: "https://konfhub.com/carbonx",
  organizer:
    "Department of Electronics and Communication Engineering, Rajagiri School of Engineering & Technology (Autonomous)",
  collaborators: "In association with IEDC RSET and IIC RSET, with technology partner C-DAC",
  venue: {
    name: "Rajagiri School of Engineering & Technology",
    address: "Rajagiri Valley, Kakkanad, Kochi, Kerala 682039",
    mapUrl: "https://maps.google.com/?q=Rajagiri+School+of+Engineering+and+Technology+Kakkanad",
  },
};

export const about = {
  lead:
    "CARBONX is the flagship hardware hackathon of the Department of Electronics and Communication Engineering at RSET — a national, round-the-clock marathon where builders turn silicon, signals and soil into working prototypes.",
  body:
    "Born as VEGATHON in 2022 — a national-level hackathon built around India's indigenous VEGA processor with C-DAC — the event evolved into CARBONX to carry its hardware-first legacy under a stronger long-term identity. For 2027, CARBONX expands into three arenas: food & sustainability, signals & connectivity, and electronics & embedded systems. Mentors, industry experts and students from across India, 42 hours, one mission: build things that actually work.",
  pillars: [
    { k: "Hardware-first", v: "Real prototypes on real boards — not slideware." },
    { k: "Indigenous tech", v: "Deep-tech collaboration with C-DAC since day one." },
    { k: "National arena", v: "Teams, mentors and industry experts from across India." },
  ],
  lineage: [
    { year: "2022", title: "VEGATHON", body: "National-level hardware hackathon centred on the VEGA RISC-V processor, built with C-DAC." },
    { year: "2026", title: "CARBONX", body: "VEGATHON evolves into CARBONX — a 42-hour hardware hackathon hosted as a track of HackS'US Edition V." },
    { year: "2027", title: "CARBONX 2027", body: "Three tracks. One continuous experience. The biggest edition yet." },
  ],
};

export const stats = [
  { value: 42, suffix: "", label: "Hours of non-stop building" },
  { value: 3, suffix: "", label: "Tracks, one arena" },
  { value: 250, suffix: "+", label: "Builders expected" },
  { value: 1000, suffix: "+", label: "Visitors expected" },
];

export type TrackId = "vegathon" | "signalthon" | "electrothon";

export interface Track {
  id: TrackId;
  index: string;
  emoji: string;
  name: string;
  short: string;
  kicker: string;
  description: string;
  themes: string[];
  stack: string[];
  color: string;
  color2: string;
}

export const tracks: Track[] = [
  {
    id: "vegathon",
    index: "01",
    emoji: "🌱",
    name: "VEGATHON",
    short: "Sustainability · Agriculture · Food",
    kicker: "Grow the future",
    description:
      "Carrying the original VEGATHON name forward, this track is where technology meets soil. Engineer solutions for climate resilience, precision farming, food security and circular resource use — from sensor-rich fields to smarter supply chains.",
    themes: [
      "Smart agriculture & precision farming",
      "Food security, safety & supply chains",
      "Water, soil & climate monitoring",
      "Waste reduction & circular systems",
      "Clean energy for rural communities",
    ],
    stack: ["Sensors", "Edge AI", "LoRa", "Solar", "Drones"],
    color: "#3dff9a",
    color2: "#b6ff3d",
  },
  {
    id: "signalthon",
    index: "02",
    emoji: "📡",
    name: "SIGNALTHON",
    short: "Communication · Signals · Connectivity",
    kicker: "Transmit the impossible",
    description:
      "Everything that moves information — through air, fibre and code. Build radios, networks and signal-processing pipelines that connect the unconnected, keep people safe and push bandwidth, latency and reliability to their limits.",
    themes: [
      "Wireless & mesh networks",
      "Digital signal processing",
      "SDR, antennas & RF systems",
      "Disaster & emergency communication",
      "Secure, low-latency connectivity",
    ],
    stack: ["SDR", "DSP", "5G / LTE", "BLE", "Mesh"],
    color: "#3de8ff",
    color2: "#7a5cff",
  },
  {
    id: "electrothon",
    index: "03",
    emoji: "⚡",
    name: "ELECTROTHON",
    short: "Electronics · Embedded · IoT · Hardware",
    kicker: "Power the build",
    description:
      "The hardware core of CARBONX. Design circuits, write firmware, synthesise digital logic and ship devices — from RISC-V boards and FPGAs to IoT fleets. If it has a clock, a pin or a PCB, it belongs here.",
    themes: [
      "Embedded systems & firmware",
      "IoT devices & smart infrastructure",
      "FPGA / VLSI & EDA workflows",
      "RISC-V & indigenous processors",
      "Robotics, power & assistive hardware",
    ],
    stack: ["RISC-V", "FPGA", "Verilog", "ESP32", "PCB"],
    color: "#ffb13d",
    color2: "#ff3d6e",
  },
];

export const timeline = [
  { phase: "Phase 01", title: "Registrations open", date: "TBA", body: "Form your team, pick a track and lock your spot on KonfHub." },
  { phase: "Phase 02", title: "Idea submission", date: "TBA", body: "Submit your problem understanding and proposed build for review." },
  { phase: "Phase 03", title: "Shortlist announced", date: "TBA", body: "Selected teams are notified and onboarded with the kit list." },
  { phase: "Phase 04", title: "Pre-event workshops", date: "TBA", body: "Hands-on sessions on boards, tools and toolchains before the clock starts." },
  { phase: "Phase 05", title: "Hacking begins", date: "Day 1", body: "Inauguration, problem reveal and the 42-hour clock starts ticking." },
  { phase: "Phase 06", title: "Mentor checkpoints", date: "Day 2", body: "Industry mentors review progress through the night. Coffee is mandatory." },
  { phase: "Phase 07", title: "Demos & finale", date: "Day 3", body: "Live hardware demos, judging, awards and the closing ceremony." },
];

/** Set an amount string (e.g. "₹50,000") to reveal it; `null` shows the classified effect. */
export const prizes = {
  pool: null as string | null,
  podium: [
    { place: "2nd", label: "Runner up", amount: null as string | null },
    { place: "1st", label: "Champion", amount: null as string | null },
    { place: "3rd", label: "Second runner up", amount: null as string | null },
  ],
  perks: [
    "Track-wise winners for Vegathon, Signalthon & Electrothon",
    "Mentorship from industry & C-DAC experts",
    "Certificates for every participant",
    "Swag, hardware goodies & surprise awards",
  ],
};

export const faqs = [
  {
    q: "Who can participate?",
    a: "Students from any college across India with a passion for building. Engineering, science, design — if you can build, you belong.",
  },
  {
    q: "How big can a team be?",
    a: "Team size limits will be announced along with the registration details for each track on KonfHub.",
  },
  {
    q: "How do I register?",
    a: "Registration is handled on KonfHub. Hit Register Now anywhere on this page, choose your track and complete the form.",
  },
  {
    q: "How long is the hackathon?",
    a: "CARBONX is a 42-hour round-the-clock hackathon held on campus at Rajagiri School of Engineering & Technology, Kochi.",
  },
  {
    q: "Do I need to bring my own hardware?",
    a: "Bring your laptop and any components you are comfortable with. Track-specific boards and tools will be communicated to shortlisted teams.",
  },
  {
    q: "Can I switch tracks after registering?",
    a: "Registration is per track. Reach out to the coordinators listed below and we will do our best to help.",
  },
  {
    q: "Will food and accommodation be provided?",
    a: "Details for on-campus logistics will be shared with shortlisted teams. Contact the core team for specific questions.",
  },
];

export type SponsorTier = "title" | "presenting" | "gold" | "silver" | "bronze";

export const sponsorTiers: { tier: SponsorTier; label: string; slots: number; sponsors: { name: string; logo?: string; url?: string }[] }[] = [
  { tier: "title", label: "Title Sponsor", slots: 1, sponsors: [] },
  { tier: "presenting", label: "Presenting Sponsor", slots: 1, sponsors: [] },
  { tier: "gold", label: "Gold Sponsors", slots: 3, sponsors: [] },
  { tier: "silver", label: "Silver Sponsors", slots: 4, sponsors: [] },
  { tier: "bronze", label: "Bronze Sponsors", slots: 5, sponsors: [] },
];

export const pastPartners = [
  { name: "C-DAC", logo: "/partners/cdac.svg", url: "https://www.cdac.in/" },
  { name: "ENAUTS", logo: "/partners/enauts.svg" },
];

export const contacts = [
  { name: "Ashish John Binu", role: "Primary Coordinator", email: "binu.john.ashish@gmail.com", phone: "+91 81290 93676", tel: "+918129093676" },
  { name: "Pooja S Nair", role: "General Support", email: "poojanair6795@gmail.com", phone: "+91 70120 49388", tel: "+917012049388" },
  { name: "Kashinath P Menon", role: "General Support", email: "kashinathpm10@gmail.com", phone: "+91 85901 94852", tel: "+918590194852" },
];

export const orgEmails = ["rsetiedc@rajagiritech.edu.in", "iic_rset@rajagiritech.edu.in"];

export const socials = [
  { label: "Instagram", href: "https://www.instagram.com/rsetiedc/" },
  { label: "LinkedIn", href: "https://in.linkedin.com/company/rset-iedc" },
  { label: "X / Twitter", href: "https://x.com/rset_iedc" },
  { label: "Facebook", href: "https://www.facebook.com/iedc.rset/" },
];
