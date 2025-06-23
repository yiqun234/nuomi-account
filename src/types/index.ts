export interface FieldOption {
  key: string;
  value?: string | number;
  en_label: string;
  zh_label: string;
  items?: string[];
  inline_input?: {
    key: string;
    en_unit: string;
    zh_unit: string;
  };
}

export interface Field {
  key: string;
  type: string;
  ui_hint: string;
  en_label: string;
  zh_label: string;
  description_en?: string;
  description_zh?: string;
  buttons?: { key: string; en_label: string; zh_label: string }[];
  options?: FieldOption[];
  item_schema?: {
    type: 'object';
    properties: Field[];
  };
  prompt_config?: {
    target_field: string;
    button_label_key: string;
    modal_title_key: string;
  };
  button?: { key: string; en_label: string; zh_label: string };
  key_label_en?: string;
  value_type?: string;

  // for group-like fields
  fields?: Field[];
  group_name_en?: string;
  group_name_zh?: string;
  inline_input?: {
    key: string;
    en_unit: string;
    zh_unit: string;
  };
}

export interface Group {
  key: string;
  group_name_en: string;
  group_name_zh: string;
  fields: Field[];
}

export interface ConfigSchema {
  groups: Group[];
}

// Sub-interfaces for AppConfig
export interface WorkExperience {
  title: string;
  company: string;
  city: string;
  description: string;
  from_month: string;
  from_year: string;
  to_month: string;
  to_year: string;
  current: boolean;
}

export interface Education {
  school: string;
  city: string;
  degree: string;
  major: string;
  from_month: string;
  from_year: string;
  to_month: string;
  to_year: string;
  current: boolean;
}

export interface CustomQuestion {
  question: string;
  answer: string;
}

export interface Language {
  name: string;
  proficiency: string;
}

export interface Experience {
  name: string;
  years: number;
}


export interface ExperienceLevel {
  internship: boolean;
  entry: boolean;
  associate: boolean;
  'mid-senior_level': boolean;
  director: boolean;
  executive: boolean;
}

export interface JobTypes {
  'full-time': boolean;
  contract: boolean;
  'part-time': boolean;
  temporary: boolean;
  internship: boolean;
  other: boolean;
  volunteer: boolean;
}

export interface DatePosted {
  'all_time': boolean;
  month: boolean;
  week: boolean;
  '24_hours': boolean;
  custom_hours: boolean;
}

export interface Uploads {
  resume: string;
  coverLetter: string;
  photo: string;
}

export interface Checkboxes {
  driversLicence: boolean;
  requireVisa: boolean;
  legallyAuthorized: boolean;
  certifiedProfessional: boolean;
  urgentFill: boolean;
  commute: boolean;
  remote: boolean;
  drugTest: boolean;
  assessment: boolean;
  securityClearance: boolean;
  degreeCompleted: string[];
  backgroundCheck: boolean;
}

export interface PersonalInfo {
  Pronouns: string;
  'First Name': string;
  'Last Name': string;
  'Phone Country Code': string;
  'Mobile Phone Number': string;
  'Street address': string;
  City: string;
  State: string;
  Zip: string;
  Linkedin: string;
  Website: string;
  MessageToManager: string;
}

export interface EEO {
  gender: string;
  race: string;
  veteran: string;
  disability: string;
}

// Main AppConfig Interface
export interface AppConfig {
  email: string;
  password: string;
  openaiApiKey: string;
  disableAntiLock: boolean;
  remote: boolean;
  residentStatus: boolean;
  newestPostingsFirst: boolean;
  lessApplicantsEnabled?: boolean;
  lessApplicantsCount?: number;
  experienceLevel: { [key: string]: boolean };
  jobTypes: { [key: string]: boolean };
  date: DatePosted | string;
  positionsWithCount: { name: string; count: number }[];
  locations: string[];
  distance: number;
  outputFileDirectory: string;
  companyBlacklist: string[];
  titleBlacklist: string[];
  posterBlacklist: string[];
  uploads: Uploads;
  checkboxes: Checkboxes;
  universityGpa: number;
  salaryMinimum: number;
  languages: Language[];
  noticePeriod: number;
  experience: Experience[];
  personalInfo: PersonalInfo;
  eeo: EEO;
  textResume: string;
  evaluateJobFit: boolean;
  jobFitPrompt: string;
  debug: boolean;
  customQuestions: CustomQuestion[];
  useCloudAI: boolean;
  educations: Education[];
  workExperiences: WorkExperience[];
  speed_mode: string | null;
  customHours?: number;
} 