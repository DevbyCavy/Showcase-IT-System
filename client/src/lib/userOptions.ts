// Preserved from signup.php's dropdowns exactly. Several job-title labels collapse onto the same
// underlying Role (Technician/Vinyl Applicator/Cook are all ProductionTeam) — that's an existing
// business rule (department distinguishes the job, not the role), not a bug.
export const JOB_TITLE_OPTIONS: { label: string; role: string }[] = [
  { label: 'Stores Admin', role: 'StoresAdmin' },
  { label: 'Project Manager', role: 'ProjectManager' },
  { label: 'Accountant', role: 'Accountant' },
  { label: 'Graphic Designer', role: 'GraphicDesigner' },
  { label: 'Technician', role: 'ProductionTeam' },
  { label: 'Vinyl Applicator', role: 'ProductionTeam' },
  { label: 'Driver', role: 'Logistics' },
  { label: 'Cook', role: 'ProductionTeam' },
]

export const DEPARTMENT_OPTIONS: string[] = [
  'Stores',
  'Management',
  'Marketing',
  'Accounts',
  'Graphics Department',
  'Production',
  'Logistics',
  'Catering',
]
