export interface UserConfig {
  linkedin: {
    email: string
    pass: string
  }
  job_search: {
    title: string
    location: string
  }
  blacklist: {
    companies: string[]
    titles: string[]
  }
  paths: {
    resume_path: string
    cover_letter_path: string
  }
  ai: {
    api_key: string
    enabled: boolean
  }
  eeo: {
    gender: 'male' | 'female' | 'decline'
    race: 'hispanic' | 'white' | 'black' | 'asian' | 'two_or_more' | 'decline'
    veteran: 'yes' | 'no' | 'decline'
    disability: 'yes' | 'no' | 'decline'
  }
} 